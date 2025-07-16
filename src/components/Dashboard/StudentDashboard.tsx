import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Typography, Row, Col, Statistic, Space, Modal, Form, Input, Select } from 'antd';
import { PlusOutlined, FileTextOutlined, FormOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Grievance, FeedbackForm } from '../../types';
import { 
  createGrievance, 
  getGrievancesByStudent, 
  getAvailableFeedbackForms,
  sendWebhookNotification
} from '../../services/firebaseService';
import { Profile } from '../Profile/Profile';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

type ViewType = 'dashboard' | 'grievances' | 'feedback' | 'history' | 'profile';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [availableForms, setAvailableForms] = useState<FeedbackForm[]>([]);
  const [isGrievanceModalVisible, setIsGrievanceModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Listen for navigation changes from sidebar and user menu
  useEffect(() => {
    const handleStudentNavigation = (event: CustomEvent) => {
      const key = event.detail.key;
      switch (key) {
        case 'dashboard':
          setCurrentView('dashboard');
          break;
        case 'grievances':
          setCurrentView('grievances');
          break;
        case 'feedback':
          setCurrentView('feedback');
          break;
        case 'history':
          setCurrentView('history');
          break;
      }
    };

    const handleUserNavigation = (event: CustomEvent) => {
      const key = event.detail.key;
      if (key === 'profile') {
        setCurrentView('profile');
      }
    };

    window.addEventListener('student-navigation', handleStudentNavigation as EventListener);
    window.addEventListener('user-navigation', handleUserNavigation as EventListener);
    
    return () => {
      window.removeEventListener('student-navigation', handleStudentNavigation as EventListener);
      window.removeEventListener('user-navigation', handleUserNavigation as EventListener);
    };
  }, []);

  useEffect(() => {
    // Load data based on current view
    if (currentView === 'dashboard' || currentView === 'grievances' || currentView === 'history') {
      loadGrievances();
    }
    if (currentView === 'dashboard' || currentView === 'feedback') {
      loadAvailableForms();
    }
  }, [user?.id, currentView]);

  const loadGrievances = async () => {
    if (!user?.id) return;
    
    try {
      const userGrievances = await getGrievancesByStudent(user.id);
      setGrievances(userGrievances);
    } catch (error) {
      console.error('Error loading grievances:', error);
    }
  };

  const loadAvailableForms = async () => {
    if (!user) return;
    
    try {
      const userForms = await getAvailableFeedbackForms(user.year, user.branch);
      setAvailableForms(userForms);
    } catch (error) {
      console.error('Error loading available forms:', error);
    }
  };

  const submitGrievance = async (values: any) => {
    if (!user?.id) return;

    try {
      const grievanceData = {
        studentId: user?.id || '',
        studentName: user?.name || '',
        title: values.title,
        description: values.description,
        category: values.category,
        department: values.department,
        status: 'pending' as const,
        priority: values.priority,
      };

      const grievanceId = await createGrievance(grievanceData);

      // Send webhook notification
      const webhookData = {
        grievance: { ...grievanceData, id: grievanceId },
        student: user,
        type: 'new_grievance',
      };
      await sendWebhookNotification(webhookData);

      // Reload grievances
      await loadGrievances();
      
      setIsGrievanceModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error submitting grievance:', error);
    }
  };

  const grievanceColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag>{category}</Tag>,
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
      render: (status: string) => {
        const colors = {
          pending: 'orange',
          in_progress: 'blue',
          resolved: 'green',
          closed: 'gray',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{status.replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => {
        const colors = { low: 'green', medium: 'orange', high: 'red' };
        return <Tag color={colors[priority as keyof typeof colors]}>{priority}</Tag>;
      },
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const formColumns = [
    {
      title: 'Form Title',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: FeedbackForm) => (
        <Button
          type="primary"
          size="small"
          onClick={() => window.open(`/forms/${record.id}`, '_blank')}
        >
          Fill Form
        </Button>
      ),
    },
  ];

  const stats = {
    totalGrievances: grievances.length,
    pendingGrievances: grievances.filter(g => g.status === 'pending').length,
    resolvedGrievances: grievances.filter(g => g.status === 'resolved').length,
    availableForms: availableForms.length,
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile':
        return <Profile />;
      case 'grievances':
        return renderGrievancesView();
      case 'feedback':
        return renderFeedbackView();
      case 'history':
        return renderHistoryView();
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  const renderGrievancesView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>My Grievances</Title>
          <Paragraph type="secondary">
            View and manage your submitted grievances
          </Paragraph>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsGrievanceModalVisible(true)}
        >
          Submit New Grievance
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Grievances"
              value={stats.totalGrievances}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pendingGrievances}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Resolved"
              value={stats.resolvedGrievances}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="All Grievances">
        <Table
          columns={grievanceColumns}
          dataSource={grievances}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  const renderFeedbackView = () => (
    <div className="space-y-6">
      <div>
        <Title level={2}>Feedback Forms</Title>
        <Paragraph type="secondary">
          Available feedback forms for your department and year
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Available Forms"
              value={stats.availableForms}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Completed Forms"
              value={0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Available Feedback Forms">
        <Table
          columns={formColumns}
          dataSource={availableForms}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  const renderHistoryView = () => (
    <div className="space-y-6">
      <div>
        <Title level={2}>Submission History</Title>
        <Paragraph type="secondary">
          Complete history of your grievances and feedback submissions
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Submissions"
              value={stats.totalGrievances}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="This Month"
              value={grievances.filter(g => {
                const grievanceDate = new Date(g.submittedAt);
                const currentDate = new Date();
                return grievanceDate.getMonth() === currentDate.getMonth() && 
                       grievanceDate.getFullYear() === currentDate.getFullYear();
              }).length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Success Rate"
              value={Math.round((stats.resolvedGrievances / stats.totalGrievances) * 100) || 0}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Submission History">
        <Table
          columns={[
            {
              title: 'Title',
              dataIndex: 'title',
              key: 'title',
            },
            {
              title: 'Type',
              key: 'type',
              render: () => <Tag color="blue">Grievance</Tag>,
            },
            {
              title: 'Category',
              dataIndex: 'category',
              key: 'category',
              render: (category: string) => <Tag>{category}</Tag>,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => {
                const colors = {
                  pending: 'orange',
                  in_progress: 'blue',
                  resolved: 'green',
                  closed: 'gray',
                };
                return <Tag color={colors[status as keyof typeof colors]}>{status.replace('_', ' ')}</Tag>;
              },
            },
            {
              title: 'Submitted',
              dataIndex: 'submittedAt',
              key: 'submittedAt',
              render: (date: string) => new Date(date).toLocaleDateString(),
            },
          ]}
          dataSource={grievances}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div>
        <Title level={2}>Welcome back, {user?.name}!</Title>
        <Paragraph type="secondary">
          {user?.branch} - Year {user?.year} | Roll No: {user?.rollNumber}
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Grievances"
              value={stats.totalGrievances}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pendingGrievances}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Resolved"
              value={stats.resolvedGrievances}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Available Forms"
              value={stats.availableForms}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Submit New Grievance"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsGrievanceModalVisible(true)}
          >
            Submit Grievance
          </Button>
        }
      >
        <Paragraph type="secondary">
          Have a concern or issue? Submit a grievance and our team will address it promptly.
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="My Grievances" extra={<HistoryOutlined />}>
            <Table
              dataSource={grievances}
              columns={[
                {
                  title: 'Title',
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => {
                    const colors = {
                      pending: 'orange',
                      in_progress: 'blue',
                      resolved: 'green',
                      closed: 'gray',
                    };
                    return <Tag color={colors[status as keyof typeof colors]}>{status.replace('_', ' ')}</Tag>;
                  },
                },
                {
                  title: 'Submitted',
                  dataIndex: 'submittedAt',
                  key: 'submittedAt',
                  render: (date: string) => new Date(date).toLocaleDateString(),
                },
              ]}
              pagination={false}
              scroll={{ x: 400 }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Available Forms" extra={<FormOutlined />}>
            <Table
              dataSource={availableForms}
              columns={[
                {
                  title: 'Form Title',
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: 'Department',
                  dataIndex: 'department',
                  key: 'department',
                },
                {
                  title: 'Action',
                  key: 'action',
                  render: (_: any, record: FeedbackForm) => (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => window.open(`/forms/${record.id}`, '_blank')}
                    >
                      Fill Form
                    </Button>
                  ),
                },
              ]}
              pagination={false}
              scroll={{ x: 400 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div>
      {renderCurrentView()}
      
      {/* Grievance Modal */}
      <Modal
        title="Submit New Grievance"
        open={isGrievanceModalVisible}
        onCancel={() => setIsGrievanceModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={submitGrievance}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Brief description of your grievance" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <TextArea rows={4} placeholder="Detailed description of your grievance" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category' }]}
          >
            <Select placeholder="Select category">
              <Select.Option value="academic">Academic</Select.Option>
              <Select.Option value="hostel">Hostel</Select.Option>
              <Select.Option value="transport">Transport</Select.Option>
              <Select.Option value="food">Food</Select.Option>
              <Select.Option value="infrastructure">Infrastructure</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="department"
            label="Department"
            rules={[{ required: true, message: 'Please select a department' }]}
          >
            <Select placeholder="Select department">
              <Select.Option value="Academic Affairs">Academic Affairs</Select.Option>
              <Select.Option value="Student Affairs">Student Affairs</Select.Option>
              <Select.Option value="Hostel Management">Hostel Management</Select.Option>
              <Select.Option value="Transport">Transport</Select.Option>
              <Select.Option value="IT Support">IT Support</Select.Option>
              <Select.Option value="Administration">Administration</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="priority"
            label="Priority"
            rules={[{ required: true, message: 'Please select priority' }]}
          >
            <Select placeholder="Select priority">
              <Select.Option value="low">Low</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="high">High</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Grievance
              </Button>
              <Button onClick={() => setIsGrievanceModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
