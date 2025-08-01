import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Typography, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch,
  message,
  Popconfirm,
  Tabs,
  Space,
  Divider,
  Alert,
  Badge,
  Progress
} from 'antd';
import { 
  TeamOutlined, 
  FileTextOutlined, 
  FormOutlined, 
  SettingOutlined, 
  PlusOutlined,
  DeleteOutlined,
  UserAddOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DashboardOutlined,
  SafetyOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { User, Grievance, FeedbackForm } from '../../types';
import { 
  getAllUsers, 
  getAllGrievances, 
  getFeedbackFormsByDepartment,
  createUser,
  deleteUser,
  assignUserRole,
  toggleUserStatus,
  getSystemStats,
  toggleFeedbackFormStatus,
  deleteFeedbackForm,
  deleteGrievance,
  updateGrievanceStatus
} from '../../services/firebaseService';
import { initializeSuperAdmin, createDemoUsers } from '../../utils/initializeSuperAdmin';
import { testFirebaseIntegration, enhancedSuperAdminOps } from '../../utils/testFirebaseIntegration';

const { Title } = Typography;

export const SuperAdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [isAdminModalVisible, setIsAdminModalVisible] = useState(false);
  const [isSystemTestModalVisible, setIsSystemTestModalVisible] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAllData();
    loadSystemStats();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadGrievances(),
        loadFeedbackForms(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemStats = async () => {
    try {
      const stats = await getSystemStats();
      setSystemStats(stats);
    } catch (error) {
      console.error('Error loading system stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadGrievances = async () => {
    try {
      const allGrievances = await getAllGrievances();
      setGrievances(allGrievances);
    } catch (error) {
      console.error('Error loading grievances:', error);
    }
  };

  const loadFeedbackForms = async () => {
    try {
      const allForms: FeedbackForm[] = [];
      const departments = ['CSE', 'AI ML', 'AI DS', 'ECE', 'EEE', 'IT', 'MECH'];
      
      for (const dept of departments) {
        const deptForms = await getFeedbackFormsByDepartment(dept);
        allForms.push(...deptForms);
      }
      
      setFeedbackForms(allForms);
    } catch (error) {
      console.error('Error loading feedback forms:', error);
    }
  };

  const handleTestFirebaseIntegration = async () => {
    setLoading(true);
    try {
      const results = await testFirebaseIntegration();
      setTestResults(results);
      setIsSystemTestModalVisible(true);
      if (results.success) {
        message.success('Firebase integration test completed successfully!');
      } else {
        message.error('Firebase integration test failed!');
      }
    } catch (error) {
      console.error('Error testing Firebase integration:', error);
      message.error('Failed to test Firebase integration');
    } finally {
      setLoading(false);
    }
  };

  const handleInitializeCompleteSystem = async () => {
    setLoading(true);
    try {
      const result = await enhancedSuperAdminOps.initializeSystem();
      if (result.success) {
        message.success('Complete system initialized successfully!');
        await loadAllData();
      } else {
        message.error('Failed to initialize complete system');
      }
    } catch (error) {
      console.error('Error initializing complete system:', error);
      message.error('Failed to initialize complete system');
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (values: any) => {
    try {
      const adminData = {
        id: `admin_${Date.now()}`,
        email: values.email,
        name: values.name,
        role: 'admin' as const,
        department: values.department,
        isActive: true,
      };

      await createUser(adminData);
      await loadUsers();
      message.success('HOD created successfully!');

      setIsAdminModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error creating admin:', error);
      message.error('Failed to create HOD. Please try again.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      await loadUsers();
      message.success('User deleted successfully!');
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Failed to delete user. Please try again.');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus(userId, !currentStatus);
      await loadUsers();
      message.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      message.error('Failed to update user status. Please try again.');
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'student' | 'admin' | 'super_admin') => {
    try {
      await assignUserRole(userId, newRole);
      await loadUsers();
      message.success('User role updated successfully!');
    } catch (error) {
      console.error('Error updating user role:', error);
      message.error('Failed to update user role. Please try again.');
    }
  };

  const handleGrievanceStatusChange = async (grievanceId: string, newStatus: string) => {
    try {
      await updateGrievanceStatus(grievanceId, newStatus);
      await loadGrievances();
      message.success('Grievance status updated successfully!');
    } catch (error) {
      console.error('Error updating grievance status:', error);
      message.error('Failed to update grievance status. Please try again.');
    }
  };

  const handleDeleteGrievance = async (grievanceId: string) => {
    try {
      await deleteGrievance(grievanceId);
      await loadGrievances();
      message.success('Grievance deleted successfully!');
    } catch (error) {
      console.error('Error deleting grievance:', error);
      message.error('Failed to delete grievance. Please try again.');
    }
  };

  const handleToggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      await toggleFeedbackFormStatus(formId, !currentStatus);
      await loadFeedbackForms();
      message.success(`Form ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling form status:', error);
      message.error('Failed to update form status. Please try again.');
    }
  };

  const handleDeleteForm = async (formId: string) => {
    try {
      await deleteFeedbackForm(formId);
      await loadFeedbackForms();
      message.success('Form deleted successfully!');
    } catch (error) {
      console.error('Error deleting form:', error);
      message.error('Failed to delete form. Please try again.');
    }
  };

  const handleInitializeSuperAdmin = async () => {
    try {
      setLoading(true);
      const result = await initializeSuperAdmin();
      message.success('Super Admin initialized successfully!');
      Modal.info({
        title: 'Super Admin Credentials',
        content: (
          <div>
            <p><strong>Email:</strong> {result.email}</p>
            <p><strong>Password:</strong> {result.password}</p>
            <p style={{ color: 'red' }}>Please change this password after first login!</p>
          </div>
        ),
      });
      await loadUsers();
    } catch (error) {
      console.error('Error initializing super admin:', error);
      message.error('Failed to initialize super admin. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoUsers = async () => {
    try {
      setLoading(true);
      const demoUsers = await createDemoUsers();
      message.success('Demo users created successfully!');
      Modal.info({
        title: 'Demo Users Credentials',
        content: (
          <div>
            {demoUsers.map((user, index) => (
              <div key={index} style={{ marginBottom: '10px' }}>
                <p><strong>{user.role}:</strong> {user.email}</p>
                <p><strong>Password:</strong> {user.password}</p>
              </div>
            ))}
            <p style={{ color: 'red' }}>Please change these passwords after first login!</p>
          </div>
        ),
      });
      await loadUsers();
    } catch (error) {
      console.error('Error creating demo users:', error);
      message.error('Failed to create demo users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const userColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: User) => (
        <Space>
          <Tag color={role === 'student' ? 'blue' : role === 'admin' ? 'orange' : 'red'}>
            {role.replace('_', ' ')}
          </Tag>
          {record.role !== 'super_admin' && (
            <Select
              size="small"
              value={role as 'student' | 'admin' | 'super_admin'}
              onChange={(value: 'student' | 'admin' | 'super_admin') => handleRoleChange(record.id, value)}
              style={{ width: 120 }}
            >
              <Select.Option value="student">Student</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="super_admin">Super Admin</Select.Option>
            </Select>
          )}
        </Space>
      ),
    },
    {
      title: 'Department/Branch',
      key: 'dept',
      render: (record: User) => record.department || record.branch || '-',
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
      render: (year: string) => year || '-',
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: User) => (
        <Switch
          checked={record.isActive !== false}
          onChange={() => handleToggleUserStatus(record.id, record.isActive !== false)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        record.role !== 'super_admin' && (
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDeleteUser(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              type="link" 
              danger 
              size="small"
              icon={<DeleteOutlined />}
            >
              Delete
            </Button>
          </Popconfirm>
        )
      ),
    },
  ];

  const grievanceColumns = [
    {
      title: 'Student',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: Grievance) => (
        <Space>
          <Tag color={status === 'pending' ? 'orange' : status === 'resolved' ? 'green' : 'red'}>
            {status}
          </Tag>
          <Select
            size="small"
            value={status}
            onChange={(value) => handleGrievanceStatusChange(record.id, value)}
            style={{ width: 100 }}
          >
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="resolved">Resolved</Select.Option>
            <Select.Option value="closed">Closed</Select.Option>
          </Select>
        </Space>
      ),
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Grievance) => (
        <Popconfirm
          title="Are you sure you want to delete this grievance?"
          onConfirm={() => handleDeleteGrievance(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            type="link" 
            danger 
            size="small"
            icon={<DeleteOutlined />}
          >
            Delete
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const stats = {
    totalUsers: users.length,
    totalStudents: users.filter(u => u.role === 'student').length,
    totalAdmins: users.filter(u => u.role === 'admin').length,
    totalGrievances: grievances.length,
    pendingGrievances: grievances.filter(g => g.status === 'pending').length,
    totalForms: feedbackForms.length,
  };

  const departmentStats = ['CSE', 'AI ML', 'AI DS', 'ECE', 'EEE', 'IT', 'MECH'].map(dept => ({
    department: dept,
    students: users.filter(u => u.role === 'student' && u.branch === dept).length,
    grievances: grievances.filter(g => g.department === dept).length,
    admin: users.find(u => u.role === 'admin' && u.department === dept)?.name || 'Not Assigned',
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>
          <SafetyOutlined style={{ marginRight: 8 }} />
          Super Admin Dashboard
        </Title>
        <Space>
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={loadAllData}
            loading={loading}
          >
            Refresh Data
          </Button>
          <Button 
            type="default" 
            icon={<ThunderboltOutlined />}
            onClick={handleTestFirebaseIntegration}
            loading={loading}
          >
            Test Firebase
          </Button>
          <Button 
            type="default" 
            icon={<DashboardOutlined />}
            onClick={handleInitializeCompleteSystem}
            loading={loading}
          >
            Initialize System
          </Button>
          <Button 
            type="default" 
            icon={<UserAddOutlined />}
            onClick={handleInitializeSuperAdmin}
            loading={loading}
          >
            Initialize Super Admin
          </Button>
          <Button 
            type="default" 
            onClick={handleCreateDemoUsers}
            loading={loading}
          >
            Create Demo Users
          </Button>
        </Space>
      </div>

      {/* System Status Alert */}
      {systemStats && (
        <Alert
          message="System Status"
          description={
            <div>
              <p>Firebase Integration: <Badge status="success" text="Connected" /></p>
              <p>Total Users: {systemStats.totalUsers} | Active Forms: {systemStats.activeForms}</p>
              <p>System Health: <Badge status="success" text="Operational" /></p>
            </div>
          }
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: 16 }}
        />
      )}

      {/* Enhanced Statistics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers}
              prefix={<TeamOutlined />}
            />
            <Progress 
              percent={Math.min(100, (stats.totalUsers / 1000) * 100)} 
              size="small" 
              showInfo={false}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Students"
              value={stats.totalStudents}
              prefix={<TeamOutlined />}
            />
            <Progress 
              percent={Math.min(100, (stats.totalStudents / 800) * 100)} 
              size="small" 
              showInfo={false}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Department Admins"
              value={stats.totalAdmins}
              prefix={<SettingOutlined />}
            />
            <Progress 
              percent={Math.min(100, (stats.totalAdmins / 10) * 100)} 
              size="small" 
              showInfo={false}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Grievances"
              value={stats.totalGrievances}
              prefix={<FileTextOutlined />}
            />
            <Progress 
              percent={stats.totalGrievances > 0 ? Math.min(100, (stats.pendingGrievances / stats.totalGrievances) * 100) : 0} 
              size="small" 
              showInfo={false}
              status={stats.pendingGrievances > 5 ? 'exception' : 'success'}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Grievances"
              value={stats.pendingGrievances}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: stats.pendingGrievances > 5 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Forms"
              value={stats.totalForms}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="users" type="card">
        <Tabs.TabPane tab="Users Management" key="users">
          <Card
            title="All Users"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAdminModalVisible(true)}
              >
                Add HOD
              </Button>
            }
          >
            <Table
              columns={userColumns}
              dataSource={users}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Grievances Management" key="grievances">
          <Card title="All Grievances">
            <Table
              columns={grievanceColumns}
              dataSource={grievances}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab="Feedback Forms" key="forms">
          <Card title="All Feedback Forms">
            <Table
              columns={[
                { title: 'Title', dataIndex: 'title', key: 'title' },
                { title: 'Department', dataIndex: 'department', key: 'department' },
                { title: 'Created By', dataIndex: 'createdBy', key: 'createdBy' },
                { 
                  title: 'Status', 
                  dataIndex: 'isActive', 
                  key: 'isActive',
                  render: (isActive: boolean, record: FeedbackForm) => (
                    <Space>
                      <Tag color={isActive ? 'green' : 'red'}>
                        {isActive ? 'Active' : 'Inactive'}
                      </Tag>
                      <Switch
                        checked={isActive}
                        onChange={() => handleToggleFormStatus(record.id, isActive)}
                        size="small"
                      />
                    </Space>
                  )
                },
                { 
                  title: 'Created', 
                  dataIndex: 'createdAt', 
                  key: 'createdAt',
                  render: (date: string) => new Date(date).toLocaleDateString()
                },
                {
                  title: 'Actions',
                  key: 'actions',
                  render: (record: FeedbackForm) => (
                    <Popconfirm
                      title="Are you sure you want to delete this form?"
                      onConfirm={() => handleDeleteForm(record.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button 
                        type="link" 
                        danger 
                        size="small"
                        icon={<DeleteOutlined />}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  ),
                },
              ]}
              dataSource={feedbackForms}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </Card>
        </Tabs.TabPane>
      </Tabs>

      <Modal
        title="Add New HOD"
        open={isAdminModalVisible}
        onCancel={() => setIsAdminModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={createAdmin}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Enter HOD's full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input placeholder="hod.department@urcet.edu" />
          </Form.Item>

          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true, message: 'Please select department' }]}
          >
            <Select placeholder="Select department">
              {['CSE', 'AI ML', 'AI DS', 'ECE', 'EEE', 'IT', 'MECH'].map(dept => (
                <Select.Option key={dept} value={dept}>{dept}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <div className="flex gap-2">
              <Button type="primary" htmlType="submit">
                Create HOD Account
              </Button>
              <Button onClick={() => setIsAdminModalVisible(false)}>
                Cancel
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Firebase Test Results Modal */}
      <Modal
        title="Firebase Integration Test Results"
        open={isSystemTestModalVisible}
        onCancel={() => setIsSystemTestModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsSystemTestModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {testResults && (
          <div>
            <Alert
              message={testResults.success ? 'All Tests Passed!' : 'Test Failed'}
              description={testResults.message}
              type={testResults.success ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: 16 }}
            />
            {testResults.stats && (
              <div>
                <h4>System Statistics:</h4>
                <ul>
                  <li>Users: {testResults.stats.users}</li>
                  <li>Grievances: {testResults.stats.grievances}</li>
                  <li>Forms: {testResults.stats.forms}</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
