import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Row, Col, Statistic, Button, Modal, Form, Input, Select, Space } from 'antd';
import { FileTextOutlined, TeamOutlined, FormOutlined, PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Grievance, FeedbackForm, User } from '../../types';
import { 
  getGrievancesByAdminDepartments, 
  getStudentsByDepartment, 
  getFeedbackFormsByDepartment,
  getDetailedFeedbackResponses,
  createFeedbackForm,
  updateGrievanceStatus 
} from '../../services/firebaseService';
import { Profile } from '../Profile/Profile';

const { Title } = Typography;
const { TextArea } = Input;

type ViewType = 'dashboard' | 'grievances' | 'forms' | 'responses' | 'students' | 'profile';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<any[]>([]);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Listen for navigation changes from sidebar and user menu
  useEffect(() => {
    const handleAdminNavigation = (event: CustomEvent) => {
      const key = event.detail.key;
      switch (key) {
        case 'dashboard':
          setCurrentView('dashboard');
          break;
        case 'grievances':
          setCurrentView('grievances');
          break;
        case 'forms':
          setCurrentView('forms');
          break;
        case 'responses':
          setCurrentView('responses');
          break;
        case 'students':
          setCurrentView('students');
          break;
      }
    };

    const handleUserNavigation = (event: CustomEvent) => {
      const key = event.detail.key;
      if (key === 'profile') {
        setCurrentView('profile');
      }
    };

    window.addEventListener('admin-navigation', handleAdminNavigation as EventListener);
    window.addEventListener('user-navigation', handleUserNavigation as EventListener);
    
    return () => {
      window.removeEventListener('admin-navigation', handleAdminNavigation as EventListener);
      window.removeEventListener('user-navigation', handleUserNavigation as EventListener);
    };
  }, []);

  useEffect(() => {
    // Load data based on current view
    if (currentView === 'dashboard' || currentView === 'grievances') {
      loadGrievances();
    }
    if (currentView === 'dashboard' || currentView === 'students') {
      loadStudents();
    }
    if (currentView === 'dashboard' || currentView === 'forms' || currentView === 'responses') {
      loadFeedbackForms();
      loadFeedbackResponses();
    }
  }, [user?.department, currentView]);

  const loadGrievances = async () => {
    if (!user?.department) return;
    
    try {
      // Use enhanced function that supports both single and multiple departments
      const departmentGrievances = await getGrievancesByAdminDepartments(user.department);
      
      // Debug: Log department routing information
      console.log('Admin department:', user.department);
      console.log('Loaded grievances:', departmentGrievances.length);
      departmentGrievances.forEach(grievance => {
        console.log(`- Grievance: ${grievance.title} | Student: ${grievance.studentName} (${grievance.studentDepartment}) | Routed to: ${grievance.department}`);
      });
      
      setGrievances(departmentGrievances);
    } catch (error) {
      console.error('Error loading grievances:', error);
    }
  };

  const loadStudents = async () => {
    if (!user?.department) return;
    
    try {
      // Use enhanced function that supports both single and multiple departments
      const departmentStudents = await getStudentsByDepartment(user.department);
      setStudents(departmentStudents);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadFeedbackForms = async () => {
    if (!user?.department) return;
    
    try {
      // Handle both single department and multiple departments
      const department = Array.isArray(user.department) ? user.department[0] : user.department;
      const departmentForms = await getFeedbackFormsByDepartment(department);
      setFeedbackForms(departmentForms);
    } catch (error) {
      console.error('Error loading feedback forms:', error);
    }
  };

  const loadFeedbackResponses = async () => {
    if (!user?.department) return;
    
    try {
      const responses = await getDetailedFeedbackResponses(user.department);
      setFeedbackResponses(responses);
    } catch (error) {
      console.error('Error loading feedback responses:', error);
    }
  };

  const handleUpdateGrievanceStatus = async (grievanceId: string, newStatus: string) => {
    try {
      await updateGrievanceStatus(grievanceId, newStatus);
      await loadGrievances();
    } catch (error) {
      console.error('Error updating grievance status:', error);
    }
  };

  const handleCreateFeedbackForm = async (values: any) => {
    if (!user?.id || !user?.department) return;

    try {
      const formData = {
        title: values.title,
        description: values.description,
        questions: [
          {
            id: '1',
            type: 'textarea' as const,
            question: 'Please provide your feedback',
            required: true,
          },
          {
            id: '2',
            type: 'rating' as const,
            question: 'Rate your overall experience',
            required: true,
            options: ['1', '2', '3', '4', '5'],
          },
        ],
        targetYear: values.targetYear,
        targetBranch: values.targetBranch,
        department: Array.isArray(user.department) ? user.department[0] : user.department,
        createdBy: user.id,
        isAnonymous: false,
        isActive: true,
      };

      await createFeedbackForm(formData);
      setIsFormModalVisible(false);
      form.resetFields();
      await loadFeedbackForms();
    } catch (error) {
      console.error('Error creating form:', error);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>HOD Dashboard</Title>
          <p className="text-gray-600">
            Department: {Array.isArray(user?.department) ? user.department.join(', ') : user?.department}
          </p>
        </div>
        <Button 
          type="primary" 
          onClick={() => {
            loadGrievances();
            loadStudents();
            loadFeedbackForms();
            loadFeedbackResponses();
          }}
        >
          Refresh Data
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Grievances"
              value={grievances.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Grievances"
              value={grievances.filter(g => g.status === 'pending').length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Department Students"
              value={students.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="Department Grievances"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsFormModalVisible(true)}
          >
            Create Feedback Form
          </Button>
        }
      >
        <Table
          dataSource={grievances}
          columns={[
            {
              title: 'Student',
              key: 'student',
              render: (_, record) => (
                <div>
                  <div className="font-medium">{record.studentName}</div>
                  <div className="text-sm text-gray-500">
                    {record.studentDepartment && (
                      <Tag color="blue">
                        {record.studentDepartment}
                      </Tag>
                    )}
                    {record.studentYear && (
                      <Tag color="green">
                        Year {record.studentYear}
                      </Tag>
                    )}
                  </div>
                </div>
              ),
            },
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
              title: 'Routed To',
              dataIndex: 'department',
              key: 'department',
              render: (department: string) => (
                <Tag color="purple">{department}</Tag>
              ),
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
                const colors = {
                  high: 'red',
                  medium: 'orange',
                  low: 'green',
                };
                return <Tag color={colors[priority as keyof typeof colors]}>{priority}</Tag>;
              },
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => handleUpdateGrievanceStatus(record.id, 'in_progress')}
                  >
                    In Progress
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleUpdateGrievanceStatus(record.id, 'resolved')}
                  >
                    Resolve
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Card title="Feedback Forms" extra={<FormOutlined />}>
        <Table
          dataSource={feedbackForms}
          columns={[
            {
              title: 'Form Title',
              dataIndex: 'title',
              key: 'title',
            },
            {
              title: 'Target Year',
              dataIndex: 'targetYear',
              key: 'targetYear',
            },
            {
              title: 'Target Branch',
              dataIndex: 'targetBranch',
              key: 'targetBranch',
            },
            {
              title: 'Status',
              dataIndex: 'isActive',
              key: 'isActive',
              render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                  {isActive ? 'Active' : 'Inactive'}
                </Tag>
              ),
            },
            {
              title: 'Responses',
              dataIndex: 'responses',
              key: 'responses',
              render: (responses: any[]) => responses?.length || 0,
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Create Feedback Form"
        open={isFormModalVisible}
        onCancel={() => setIsFormModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateFeedbackForm}
        >
          <Form.Item
            name="title"
            label="Form Title"
            rules={[{ required: true, message: 'Please enter form title' }]}
          >
            <Input placeholder="Enter form title" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter form description' }]}
          >
            <TextArea rows={4} placeholder="Enter form description" />
          </Form.Item>
          <Form.Item
            name="targetYear"
            label="Target Year"
            rules={[{ required: true, message: 'Please select target year' }]}
          >
            <Select placeholder="Select year">
              <Select.Option value="1">1st Year</Select.Option>
              <Select.Option value="2">2nd Year</Select.Option>
              <Select.Option value="3">3rd Year</Select.Option>
              <Select.Option value="4">4th Year</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="targetBranch"
            label="Target Branch"
            rules={[{ required: true, message: 'Please select target branch' }]}
          >
            <Select placeholder="Select branch">
              <Select.Option value="CSE">CSE</Select.Option>
              <Select.Option value="ECE">ECE</Select.Option>
              <Select.Option value="EEE">EEE</Select.Option>
              <Select.Option value="MECH">MECH</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Form
              </Button>
              <Button onClick={() => setIsFormModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  const renderGrievances = () => (
    <div className="space-y-6">
      <div>
        <Title level={2}>Department Grievances</Title>
        <p className="text-gray-600">
          Manage grievances for {Array.isArray(user?.department) ? user.department.join(', ') : user?.department} department
        </p>
      </div>

      <Card>
        <Table
          dataSource={grievances}
          columns={[
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
              title: 'Description',
              dataIndex: 'description',
              key: 'description',
              render: (text: string) => (
                <div className="max-w-xs truncate" title={text}>
                  {text}
                </div>
              ),
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
              title: 'Priority',
              dataIndex: 'priority',
              key: 'priority',
              render: (priority: string) => {
                const colors = {
                  high: 'red',
                  medium: 'orange',
                  low: 'green',
                };
                return <Tag color={colors[priority as keyof typeof colors]}>{priority}</Tag>;
              },
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
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => handleUpdateGrievanceStatus(record.id, 'in_progress')}
                    disabled={record.status === 'in_progress'}
                  >
                    In Progress
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleUpdateGrievanceStatus(record.id, 'resolved')}
                    disabled={record.status === 'resolved'}
                  >
                    Resolve
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  const renderForms = () => (
    <div className="space-y-6">
      <div>
        <Title level={2}>Manage Forms</Title>
        <p className="text-gray-600">
          Create and manage feedback forms for your department
        </p>
      </div>

      <Card
        title="Feedback Forms"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsFormModalVisible(true)}
          >
            Create New Form
          </Button>
        }
      >
        <Table
          dataSource={feedbackForms}
          columns={[
            {
              title: 'Form Title',
              dataIndex: 'title',
              key: 'title',
            },
            {
              title: 'Description',
              dataIndex: 'description',
              key: 'description',
              render: (text: string) => (
                <div className="max-w-xs truncate" title={text}>
                  {text}
                </div>
              ),
            },
            {
              title: 'Target Year',
              dataIndex: 'targetYear',
              key: 'targetYear',
            },
            {
              title: 'Target Branch',
              dataIndex: 'targetBranch',
              key: 'targetBranch',
            },
            {
              title: 'Status',
              dataIndex: 'isActive',
              key: 'isActive',
              render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                  {isActive ? 'Active' : 'Inactive'}
                </Tag>
              ),
            },
            {
              title: 'Anonymous',
              dataIndex: 'isAnonymous',
              key: 'isAnonymous',
              render: (isAnonymous: boolean) => (
                <Tag color={isAnonymous ? 'blue' : 'default'}>
                  {isAnonymous ? 'Anonymous' : 'Named'}
                </Tag>
              ),
            },
            {
              title: 'Responses',
              dataIndex: 'responses',
              key: 'responses',
              render: (responses: any[]) => responses?.length || 0,
            },
            {
              title: 'Created',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (date: string) => new Date(date).toLocaleDateString(),
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  const renderResponses = () => (
    <div className="space-y-6">
      <div>
        <Title level={2}>Form Responses</Title>
        <p className="text-gray-600">
          View and analyze responses to your feedback forms from students in your department
        </p>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Responses"
              value={feedbackResponses.length}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Active Forms"
              value={feedbackForms.filter(f => f.isActive).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="This Month"
              value={feedbackResponses.filter(r => {
                const responseDate = new Date(r.submittedAt);
                const currentDate = new Date();
                return responseDate.getMonth() === currentDate.getMonth() && 
                       responseDate.getFullYear() === currentDate.getFullYear();
              }).length}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Recent Responses">
        <Table
          dataSource={feedbackResponses}
          columns={[
            {
              title: 'Form',
              key: 'form',
              render: (_, record) => (
                <div>
                  <div className="font-medium">{record.formDetails?.title || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{record.formDetails?.department}</div>
                </div>
              ),
            },
            {
              title: 'Student',
              key: 'student',
              render: (_, record) => (
                <div>
                  {record.isAnonymous ? (
                    <Tag color="blue">Anonymous</Tag>
                  ) : (
                    <div>
                      <div className="font-medium">{record.studentDetails?.name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">
                        {record.studentDetails?.rollNumber} - Year {record.studentDetails?.year}
                      </div>
                    </div>
                  )}
                </div>
              ),
            },
            {
              title: 'Submitted',
              dataIndex: 'submittedAt',
              key: 'submittedAt',
              render: (date: string) => new Date(date).toLocaleDateString(),
            },
            {
              title: 'Questions',
              key: 'questions',
              render: (_, record) => (
                <div className="text-sm">
                  {record.formDetails?.questions?.length || 0} questions
                </div>
              ),
            },
            {
              title: 'Action',
              key: 'action',
              render: () => (
                <Button type="link" size="small">
                  View Details
                </Button>
              ),
            },
          ]}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          scroll={{ x: 800 }}
        />
      </Card>

      <Card title="Form Performance">
        <Row gutter={[16, 16]}>
          {feedbackForms.map((form) => {
            const formResponses = feedbackResponses.filter(r => r.formId === form.id);
            return (
              <Col xs={24} lg={12} key={form.id}>
                <Card
                  title={form.title}
                  extra={<Tag color="blue">{formResponses.length} responses</Tag>}
                >
                  <p className="text-gray-600 mb-4">{form.description}</p>
                  <div className="space-y-2">
                    <div><strong>Target:</strong> Year {form.targetYear}, {form.targetBranch}</div>
                    <div><strong>Status:</strong> <Tag color={form.isActive ? 'green' : 'red'}>{form.isActive ? 'Active' : 'Inactive'}</Tag></div>
                    <div><strong>Type:</strong> <Tag color={form.isAnonymous ? 'blue' : 'default'}>{form.isAnonymous ? 'Anonymous' : 'Named'}</Tag></div>
                    <div><strong>Created:</strong> {new Date(form.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="mt-4">
                    <Button type="primary" size="small">
                      View All Responses ({formResponses.length})
                    </Button>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );

  const renderStudents = () => (
    <div className="space-y-6">
      <div>
        <Title level={2}>Students</Title>
        <p className="text-gray-600">
          View students in your department
        </p>
      </div>

      <Card>
        <Table
          dataSource={students}
          columns={[
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
              title: 'Year',
              dataIndex: 'year',
              key: 'year',
            },
            {
              title: 'Branch',
              dataIndex: 'branch',
              key: 'branch',
            },
            {
              title: 'Status',
              dataIndex: 'isActive',
              key: 'isActive',
              render: (isActive: boolean) => (
                <Tag color={isActive !== false ? 'green' : 'red'}>
                  {isActive !== false ? 'Active' : 'Inactive'}
                </Tag>
              ),
            },
            {
              title: 'Joined',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (date: string) => new Date(date).toLocaleDateString(),
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'profile':
        return <Profile />;
      case 'grievances':
        return renderGrievances();
      case 'forms':
        return renderForms();
      case 'responses':
        return renderResponses();
      case 'students':
        return renderStudents();
      case 'dashboard':
      default:
        return renderDashboard();
    }
  };

  // Debug: Add temporary console logging to diagnose the issue
  useEffect(() => {
    if (user?.department && currentView === 'dashboard') {
      console.log('Current admin department:', user.department);
      console.log('Current feedback responses count:', feedbackResponses.length);
      console.log('Current grievances count:', grievances.length);
      console.log('Current students count:', students.length);
      
      // Log some sample data
      if (feedbackResponses.length > 0) {
        console.log('Sample feedback response:', feedbackResponses[0]);
      }
      if (grievances.length > 0) {
        console.log('Sample grievance:', grievances[0]);
      }
    }
  }, [user?.department, currentView, feedbackResponses.length, grievances.length, students.length]);

  return renderCurrentView();
};
