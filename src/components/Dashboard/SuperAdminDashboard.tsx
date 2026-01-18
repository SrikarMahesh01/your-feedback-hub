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
  Space
} from 'antd';
import { 
  TeamOutlined, 
  FileTextOutlined, 
  FormOutlined, 
  SettingOutlined, 
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SafetyOutlined,
  EditOutlined,
  UserOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { User, Grievance, FeedbackForm, DEPARTMENTS } from '../../types';
import { formatText } from '../../utils/textFormatter';
import { formatDate } from '../../utils/dateFormatter';
import { 
  getAllUsers, 
  getAllGrievances, 
  getFeedbackFormsByDepartment,
  createAdminUser,
  deleteUser,
  assignUserRole,
  toggleUserStatus,
  toggleFeedbackFormStatus,
  deleteFeedbackForm,
  deleteGrievance,
  updateGrievanceStatus
} from '../../services/firebaseService';
import { generateRandomPassword, copyToClipboard } from '../../utils/passwordUtils';
import { Profile } from '../Profile/Profile';

const { Title } = Typography;

type ViewType = 'dashboard' | 'grievances' | 'admins' | 'students' | 'forms' | 'analytics' | 'profile';

export const SuperAdminDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [users, setUsers] = useState<User[]>([]);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [isAdminModalVisible, setIsAdminModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    loadAllData();
  }, []);

  // Listen for navigation changes from sidebar and user menu
  useEffect(() => {
    const handleSidebarNavigation = (event: CustomEvent) => {
      const key = event.detail.key;
      switch (key) {
        case 'dashboard':
          setCurrentView('dashboard');
          break;
        case 'grievances':
          setCurrentView('grievances');
          break;
        case 'admins':
          setCurrentView('admins');
          break;
        case 'students':
          setCurrentView('students');
          break;
        case 'forms':
          setCurrentView('forms');
          break;
        case 'analytics':
          setCurrentView('analytics');
          break;
      }
    };

    const handleUserNavigation = (event: CustomEvent) => {
      const key = event.detail.key;
      if (key === 'profile') {
        setCurrentView('profile');
      }
    };

    window.addEventListener('sidebar-navigation', handleSidebarNavigation as EventListener);
    window.addEventListener('user-navigation', handleUserNavigation as EventListener);
    return () => {
      window.removeEventListener('sidebar-navigation', handleSidebarNavigation as EventListener);
      window.removeEventListener('user-navigation', handleUserNavigation as EventListener);
    };
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
      const departments = [...DEPARTMENTS];
      
      for (const dept of departments) {
        const deptForms = await getFeedbackFormsByDepartment(dept);
        allForms.push(...deptForms);
      }
      
      setFeedbackForms(allForms);
    } catch (error) {
      console.error('Error loading feedback forms:', error);
    }
  };

  const createAdmin = async (values: any) => {
    try {
      const generatedPassword = generateRandomPassword(12);
      
      const result = await createAdminUser({
        email: values.email,
        name: values.name,
        department: values.departments,
        password: generatedPassword,
      });

      if (result.success) {
        await loadUsers();
        message.success('HOD created successfully!');
        
        // Show credentials to super admin
        Modal.success({
          title: 'Admin Account Created Successfully',
          content: (
            <div style={{ padding: '10px 0' }}>
              <p><strong>Admin Details:</strong></p>
              <p><strong>Name:</strong> {values.name}</p>
              <p><strong>Email:</strong> {values.email}</p>
              <p><strong>Department(s):</strong> {Array.isArray(values.departments) ? values.departments.join(', ') : values.departments}</p>
              <p><strong>Generated Password:</strong> <code style={{ background: '#f0f0f0', padding: '2px 6px', fontFamily: 'monospace' }}>{generatedPassword}</code></p>
              <p style={{ color: '#faad14', marginTop: '10px' }}>
                <strong>⚠️ Important:</strong> Please share these credentials with the HOD. They can change the password after first login.
              </p>
              <Button 
                type="primary" 
                onClick={async () => {
                  const copied = await copyToClipboard(`Email: ${values.email}\nPassword: ${generatedPassword}`);
                  if (copied) {
                    message.success('Credentials copied to clipboard!');
                  } else {
                    message.error('Failed to copy credentials');
                  }
                }}
                style={{ marginTop: '10px' }}
              >
                Copy Credentials
              </Button>
            </div>
          ),
          width: 500,
        });

        setIsAdminModalVisible(false);
        form.resetFields();
      } else {
        message.error(result.error || 'Failed to create HOD. Please try again.');
      }
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

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await toggleUserStatus(userId, !currentStatus);
      await loadUsers();
      message.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error toggling user status:', error);
      message.error('Failed to update user status. Please try again.');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    const userDepartments = user.department 
      ? Array.isArray(user.department) 
        ? user.department 
        : [user.department]
      : [];
    
    editForm.setFieldsValue({
      name: user.name,
      email: user.email,
      departments: userDepartments,
      role: user.role,
    });
    setIsEditModalVisible(true);
  };

  const handleUpdateUser = async (values: any) => {
    if (!editingUser) return;

    try {
      await assignUserRole(editingUser.id, values.role);
      await loadUsers();
      message.success('User updated successfully!');
      setIsEditModalVisible(false);
      setEditingUser(null);
      editForm.resetFields();
    } catch (error) {
      console.error('Error updating user:', error);
      message.error('Failed to update user. Please try again.');
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

  const handleUpdateGrievanceStatus = async (grievanceId: string, status: 'pending' | 'in_progress' | 'resolved') => {
    try {
      await updateGrievanceStatus(grievanceId, status);
      await loadGrievances();
      message.success('Grievance status updated successfully!');
    } catch (error) {
      console.error('Error updating grievance status:', error);
      message.error('Failed to update grievance status. Please try again.');
    }
  };

  // Separate users by role
  const students = users.filter(user => user.role === 'student');
  const admins = users.filter(user => user.role === 'admin');
  const superAdmins = users.filter(user => user.role === 'super_admin');

  const stats = {
    totalUsers: users.length,
    totalStudents: students.length,
    totalAdmins: admins.length,
    totalGrievances: grievances.length,
    pendingGrievances: grievances.filter(g => g.status === 'pending').length,
    totalForms: feedbackForms.length,
  };

  // Column definitions for different user tables
  const studentColumns = [
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
      title: 'Roll Number',
      dataIndex: 'rollNumber',
      key: 'rollNumber',
    },
    {
      title: 'Branch',
      dataIndex: 'branch',
      key: 'branch',
    },
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: User) => (
        <Switch
          checked={record.isActive !== false}
          onChange={() => handleStatusToggle(record.id, record.isActive !== false)}
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Popconfirm
          title="Are you sure you want to delete this student?"
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
      ),
    },
  ];

  const adminColumns = [
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
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (department: string | string[]) => {
        if (Array.isArray(department)) {
          return department.map(dept => (
            <Tag key={dept} color="blue" style={{ marginBottom: 4 }}>
              {dept}
            </Tag>
          ));
        }
        return <Tag color="blue">{formatText.department(department)}</Tag>;
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: User) => (
        <Switch
          checked={record.isActive !== false}
          onChange={() => handleStatusToggle(record.id, record.isActive !== false)}
          size="small"
        />
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Button 
            type="link" 
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditUser(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this admin?"
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
        </Space>
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
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
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
      render: (status: 'pending' | 'in_progress' | 'resolved', record: Grievance) => (
        <Space>
          <Tag color={status === 'pending' ? 'orange' : status === 'in_progress' ? 'blue' : 'green'}>
            {formatText.tag(status)}
          </Tag>
          <Select
            size="small"
            value={status}
            onChange={(value: 'pending' | 'in_progress' | 'resolved') => handleUpdateGrievanceStatus(record.id, value)}
            style={{ width: 120 }}
          >
            <Select.Option value="pending">Pending</Select.Option>
            <Select.Option value="in_progress">in progress</Select.Option>
            <Select.Option value="resolved">Resolved</Select.Option>
          </Select>
        </Space>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
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

  const formColumns = [
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
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
    },
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
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
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
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2}>
          <SafetyOutlined style={{ marginRight: 8 }} />
          Super Admin Dashboard
        </Title>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />}
          onClick={loadAllData}
          loading={loading}
        >
          Refresh Data
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("total users")}
              value={stats.totalUsers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("active students")}
              value={stats.totalStudents}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("department admins")}
              value={stats.totalAdmins}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("total grievances")}
              value={stats.totalGrievances}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("pending grievances")}
              value={stats.pendingGrievances}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: stats.pendingGrievances > 5 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("active forms")}
              value={stats.totalForms}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderGrievances = () => (
    <Card title="All Grievances">
      <Table
        columns={grievanceColumns}
        dataSource={grievances}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={loading}
      />
    </Card>
  );

  const renderAdmins = () => (
    <Card
      title="Manage Admins"
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
        columns={adminColumns}
        dataSource={admins}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={loading}
      />
    </Card>
  );

  const renderStudents = () => (
    <Card title="All Students">
      <Table
        columns={studentColumns}
        dataSource={students}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={loading}
      />
    </Card>
  );

  const renderForms = () => (
    <Card title="All Forms">
      <Table
        columns={formColumns}
        dataSource={feedbackForms}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        loading={loading}
      />
    </Card>
  );

  const renderAnalytics = () => (
    <Card title="System Analytics">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="User Distribution"
              value={`${stats.totalStudents}/${stats.totalAdmins}/${superAdmins.length}`}
              prefix={<BarChartOutlined />}
              suffix="S/A/SA"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Grievance Resolution Rate"
              value={Math.round(((stats.totalGrievances - stats.pendingGrievances) / Math.max(stats.totalGrievances, 1)) * 100)}
              prefix={<FileTextOutlined />}
              suffix="%"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Active Forms"
              value={feedbackForms.filter(f => f.isActive).length}
              prefix={<FormOutlined />}
              suffix={`/${stats.totalForms}`}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return renderDashboard();
      case 'grievances':
        return renderGrievances();
      case 'admins':
        return renderAdmins();
      case 'students':
        return renderStudents();
      case 'forms':
        return renderForms();
      case 'analytics':
        return renderAnalytics();
      case 'profile':
        return <Profile />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="space-y-6">
      {renderCurrentView()}

      {/* Add HOD Modal */}
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
            name="departments"
            label="Department(s)"
            rules={[{ required: true, message: 'Please select at least one department' }]}
          >
            <Select 
              mode="multiple" 
              placeholder="Select departments (max 2)"
              maxTagCount={2}
              style={{ width: '100%' }}
              onChange={(values) => {
                if (values.length > 2) {
                  message.warning('Maximum 2 departments can be selected');
                  const limitedValues = values.slice(0, 2);
                  form.setFieldsValue({ departments: limitedValues });
                }
              }}
            >
              {DEPARTMENTS.map(dept => (
                <Select.Option key={dept} value={dept}>{dept}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <div style={{ padding: '10px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '6px', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#389e0d' }}>
              <strong>📝 Note:</strong> A random password will be generated for the HOD account. The credentials will be displayed after creation for sharing with the HOD.
            </p>
          </div>

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

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Please enter full name' }]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter valid email' }
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>

          <Form.Item
            name="departments"
            label="Department(s)"
            rules={[{ required: true, message: 'Please select at least one department' }]}
          >
            <Select 
              mode="multiple" 
              placeholder="Select departments (max 2)"
              maxTagCount={2}
              style={{ width: '100%' }}
              onChange={(values) => {
                if (values.length > 2) {
                  message.warning('Maximum 2 departments can be selected');
                  const limitedValues = values.slice(0, 2);
                  editForm.setFieldsValue({ departments: limitedValues });
                }
              }}
            >
              {DEPARTMENTS.map(dept => (
                <Select.Option key={dept} value={dept}>{dept}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: 'Please select role' }]}
          >
            <Select placeholder="Select role">
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="student">Student</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div className="flex gap-2">
              <Button type="primary" htmlType="submit">
                Update User
              </Button>
              <Button onClick={() => setIsEditModalVisible(false)}>
                Cancel
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
