import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Typography, Row, Col, Statistic, Space, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, FileTextOutlined, FormOutlined, HistoryOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Grievance, FeedbackForm } from '../../types';
import { formatText } from '../../utils/textFormatter';
import { formatDate } from '../../utils/dateFormatter';
import { 
  createGrievance, 
  getGrievancesByStudent, 
  getAvailableFeedbackForms,
  getFeedbackResponsesByStudent,
  sendWebhookNotification
} from '../../services/firebaseService';
import { Profile } from '../Profile/Profile';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

type ViewType = 'dashboard' | 'grievances' | 'feedback' | 'history' | 'profile';

interface StudentDashboardProps {
  initialView?: ViewType;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ initialView = 'dashboard' }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [availableForms, setAvailableForms] = useState<FeedbackForm[]>([]);
  const [submittedResponses, setSubmittedResponses] = useState<any[]>([]);
  const [isGrievanceModalVisible, setIsGrievanceModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
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

    const handleFormSubmission = () => {
      console.log('Form submitted, refreshing data...');
      // Refresh the data when a form is submitted
      loadSubmittedResponses();
      loadAvailableForms();
    };

    window.addEventListener('student-navigation', handleStudentNavigation as EventListener);
    window.addEventListener('user-navigation', handleUserNavigation as EventListener);
    window.addEventListener('form-submitted', handleFormSubmission as EventListener);

    return () => {
      window.removeEventListener('student-navigation', handleStudentNavigation as EventListener);
      window.removeEventListener('user-navigation', handleUserNavigation as EventListener);
      window.removeEventListener('form-submitted', handleFormSubmission as EventListener);
    };
  }, []);

  useEffect(() => {
    // Load data based on current view
    console.log('Current view changed to:', currentView);
    
    if (currentView === 'dashboard' || currentView === 'grievances' || currentView === 'history') {
      console.log('Loading grievances due to view change');
      loadGrievances();
    }
    if (currentView === 'dashboard' || currentView === 'feedback') {
      console.log('Loading forms due to view change');
      loadAvailableForms();
    }
    if (currentView === 'dashboard' || currentView === 'history') {
      console.log('Loading responses due to view change');
      loadSubmittedResponses();
    }
  }, [user, currentView]);

  const loadGrievances = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Loading grievances for student:', user.id);
      const userGrievances = await getGrievancesByStudent(user.id);
      console.log('Loaded grievances:', userGrievances);
      setGrievances(userGrievances);
      
      if (userGrievances.length === 0) {
        console.log('No grievances found for student:', user.id);
      }
    } catch (error) {
      console.error('Error loading grievances:', error);
      message.error('Failed to load grievances');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableForms = async () => {
    if (!user) return;
    
    console.log('=== STUDENT DASHBOARD DEBUG ===');
    console.log('Full user object:', user);
    console.log('User details for form filtering:', { 
      year: user.year, 
      branch: user.branch, 
      department: user.department 
    });
    
    if (!user.year || !user.branch) {
      console.error('Missing required user data:', { year: user.year, branch: user.branch });
      return;
    }
    
    try {
      // For students, branch and department are typically the same
      const studentDepartment = Array.isArray(user.department) 
        ? user.department[0] 
        : user.department || user.branch;
      
      console.log('Final parameters for getAvailableFeedbackForms:', {
        year: user.year,
        branch: user.branch,
        department: studentDepartment
      });
      
      const userForms = await getAvailableFeedbackForms(user.year, user.branch, studentDepartment, user.id);
      console.log('Available forms loaded:', userForms.length);
      console.log('Form details:', userForms.map(form => ({
        id: form.id,
        title: form.title,
        targetYear: form.targetYear,
        targetBranch: form.targetBranch,
        department: form.department,
        isActive: form.isActive
      })));
      
      setAvailableForms(userForms);
    } catch (error) {
      console.error('Error loading available forms:', error);
    }
  };

  const loadSubmittedResponses = async () => {
    if (!user?.id) return;
    
    try {
      const responses = await getFeedbackResponsesByStudent(user.id);
      setSubmittedResponses(responses);
      console.log('Loaded submitted responses:', responses.length);
    } catch (error) {
      console.error('Error loading submitted responses:', error);
    }
  };

  const submitGrievance = async (values: any) => {
    if (!user?.id) return;

    try {
      // Use student's department as primary routing, but allow override for cross-departmental issues
      const targetDepartment = values.department || user?.department || user?.branch;
      const studentDept = Array.isArray(user?.department) ? user?.department[0] : user?.department;
      
      const grievanceData = {
        studentId: user?.id || '',
        studentName: user?.name || '',
        title: values.title,
        description: values.description,
        category: values.category,
        department: targetDepartment, // This determines which HOD receives the grievance
        studentDepartment: studentDept || user?.branch, // Student's own department for reference
        studentBranch: user?.branch,
        studentYear: user?.year,
        status: 'pending' as const,
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

  // Function to suggest department based on category
  const suggestDepartmentForCategory = (category: string) => {
    const departmentMapping = {
      'academic': Array.isArray(user?.department) ? user?.department[0] : user?.department || user?.branch,
      'infrastructure': 'Administration',
      'hostel': 'Hostel Management',
      'transport': 'Transport',
      'library': 'Administration',
      'other': Array.isArray(user?.department) ? user?.department[0] : user?.department || user?.branch,
    };
    return departmentMapping[category as keyof typeof departmentMapping] || 'Administration';
  };

  // Handle category change to auto-suggest department
  const handleCategoryChange = (category: string) => {
    const suggestedDepartment = suggestDepartmentForCategory(category);
    form.setFieldsValue({ department: suggestedDepartment });
  };

  const grievanceColumns = [
    {
      title: formatText.title('title'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: formatText.title('category'),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => <Tag>{formatText.tag(category)}</Tag>,
    },
    {
      title: formatText.title('department'),
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: formatText.title('status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          pending: 'orange',
          in_progress: 'blue',
          resolved: 'green',
          closed: 'gray',
        };
        return <Tag color={colors[status as keyof typeof colors]}>{formatText.tag(status)}</Tag>;
      },
    },
    {
      title: formatText.title('submitted'),
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => formatDate(date),
    },
  ];

  const formColumns = [
    {
      title: formatText.title('form title'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: formatText.title('description'),
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <div style={{ maxWidth: 200 }}>
          {text?.length > 100 ? `${text.substring(0, 100)}...` : text}
        </div>
      ),
    },
    {
      title: formatText.title('target year'),
      dataIndex: 'targetYear',
      key: 'targetYear',
      render: (year: string) => (year === 'ALL' || year === 'all') ? 'All Years' : `Year ${year}`,
    },
    {
      title: formatText.title('target branch'),
      dataIndex: 'targetBranch',
      key: 'targetBranch',
      render: (branch: string) => (branch === 'ALL' || branch === 'all') ? 'All Branches' : branch,
    },
    {
      title: formatText.title('created'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date),
    },
    {
      title: formatText.title('action'),
      key: 'action',
      render: (_: any, record: FeedbackForm) => {
        const isSubmitted = submittedResponses.some(response => response.formId === record.id);
        return isSubmitted ? (
          <Tag color="green">Submitted</Tag>
        ) : (
          <Button
            type="primary"
            size="small"
            onClick={() => navigate(`/forms/${record.id}`)}
          >
            Fill Form
          </Button>
        );
      },
    },
  ];

  const stats = {
    totalGrievances: grievances.length,
    pendingGrievances: grievances.filter(g => g.status === 'pending').length,
    resolvedGrievances: grievances.filter(g => g.status === 'resolved').length,
    availableForms: availableForms.length,
    submittedResponses: submittedResponses.length,
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
        <Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsGrievanceModalVisible(true)}
          >
            Submit New Grievance
          </Button>
          <Button
            onClick={() => {
              console.log('Manual refresh clicked');
              loadGrievances();
            }}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={formatText.title("total grievances")}
              value={stats.totalGrievances}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={formatText.title("pending")}
              value={stats.pendingGrievances}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={formatText.title("resolved")}
              value={stats.resolvedGrievances}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title={formatText.title("all grievances")}>
        <Table
          columns={grievanceColumns}
          dataSource={grievances}
          rowKey="id"
          loading={loading}
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
          Available feedback forms for your department ({user?.department || user?.branch || 'Not specified'}) and year ({user?.year ? `Year ${user.year}` : 'No year specified'})
        </Paragraph>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={formatText.title("available forms")}
              value={stats.availableForms}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title={formatText.title("completed forms")}
              value={submittedResponses.length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Previously Submitted Forms */}
      {submittedResponses.length > 0 && (
        <Card title={formatText.title("Previously Submitted Forms")}>
          <Table
            columns={[
              {
                title: formatText.title('Form Title'),
                key: 'formTitle',
                render: (record: any) => record.formDetails?.title || 'Unknown Form',
              },
              {
                title: formatText.title('Description'),
                key: 'description',
                render: (record: any) => record.formDetails?.description || 'No description',
                ellipsis: true,
              },
              {
                title: formatText.title('Submitted At'),
                dataIndex: 'submittedAt',
                key: 'submittedAt',
                render: (date: string) => formatDate(date),
              },
              {
                title: formatText.title('Status'),
                key: 'status',
                render: () => <Tag color="green">Completed</Tag>,
              },
            ]}
            dataSource={submittedResponses}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
          />
        </Card>
      )}

      {/* Available Forms */}
      <Card title={formatText.title("available feedback forms")}>
        {availableForms.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <FormOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            <p style={{ color: '#999', marginTop: '16px' }}>
              No feedback forms available for your department ({user?.department || user?.branch || 'Not specified'}) and year ({user?.year || 'Not specified'})
            </p>
            <p style={{ color: '#999', fontSize: '14px' }}>
              Check back later or contact your department admin if you expect to see forms here.
            </p>
          </div>
        ) : (
          <Table
            columns={formColumns}
            dataSource={availableForms}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        )}
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
              title={formatText.title("total grievances")}
              value={stats.totalGrievances}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={formatText.title("completed forms")}
              value={submittedResponses.length}
              prefix={<FormOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={formatText.title("success rate")}
              value={Math.round((stats.resolvedGrievances / stats.totalGrievances) * 100) || 0}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Submitted Feedback Forms Section */}
      <Card title={formatText.title("Submitted Feedback Forms")}>
        {submittedResponses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <FormOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            <p style={{ color: '#999', marginTop: '16px' }}>
              No feedback forms submitted yet
            </p>
          </div>
        ) : (
          <Table
            columns={[
              {
                title: formatText.title('Form Title'),
                key: 'formTitle',
                render: (record: any) => record.formDetails?.title || 'Unknown Form',
              },
              {
                title: formatText.title('Type'),
                key: 'type',
                render: () => <Tag color="blue">Feedback Form</Tag>,
              },
              {
                title: formatText.title('Status'),
                key: 'status',
                render: () => <Tag color="green">Submitted</Tag>,
              },
              {
                title: formatText.title('Submitted At'),
                dataIndex: 'submittedAt',
                key: 'submittedAt',
                render: (date: string) => formatDate(date),
              },
            ]}
            dataSource={submittedResponses}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>

      {/* Grievances Section */}
      <Card title={formatText.title("Submitted Grievances")}>
        {grievances.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            <p style={{ color: '#999', marginTop: '16px' }}>
              No grievances submitted yet
            </p>
          </div>
        ) : (
          <Table
            columns={[
              {
                title: formatText.title('Title'),
                dataIndex: 'title',
                key: 'title',
              },
              {
                title: formatText.title('Type'),
                key: 'type',
                render: () => <Tag color="orange">Grievance</Tag>,
              },
              {
                title: formatText.title('Category'),
                dataIndex: 'category',
                key: 'category',
                render: (category: string) => <Tag>{formatText.tag(category)}</Tag>,
              },
              {
                title: formatText.title('Status'),
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => {
                  const colors = {
                    pending: 'orange',
                    in_progress: 'blue',
                    resolved: 'green',
                    closed: 'gray',
                  };
                  return <Tag color={colors[status as keyof typeof colors]}>{formatText.tag(status)}</Tag>;
                },
              },
              {
                title: formatText.title('Submitted'),
                dataIndex: 'submittedAt',
                key: 'submittedAt',
                render: (date: string) => formatDate(date),
              },
            ]}
            dataSource={grievances}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        )}
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
              title={formatText.title("total grievances")}
              value={stats.totalGrievances}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("pending")}
              value={stats.pendingGrievances}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("resolved")}
              value={stats.resolvedGrievances}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("available forms")}
              value={stats.availableForms}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("forms submitted")}
              value={stats.submittedResponses}
              prefix={<FormOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={formatText.title("submit new grievance")}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsGrievanceModalVisible(true)}
          >
            {formatText.title("submit grievance")}
          </Button>
        }
      >
        <Paragraph type="secondary">
          Have a concern or issue? Submit a grievance and our team will address it promptly.
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={formatText.title("my grievances")} extra={<HistoryOutlined />}>
            <Table
              dataSource={grievances}
              rowKey="id"
              columns={[
                {
                  title: formatText.title('title'),
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: formatText.title('status'),
                  dataIndex: 'status',
                  key: 'status',
                  render: (status: string) => {
                    const colors = {
                      pending: 'orange',
                      in_progress: 'blue',
                      resolved: 'green',
                      closed: 'gray',
                    };
                    return <Tag color={colors[status as keyof typeof colors]}>{formatText.tag(status)}</Tag>;
                  },
                },
                {
                  title: 'Submitted',
                  dataIndex: 'submittedAt',
                  key: 'submittedAt',
                  render: (date: string) => formatDate(date),
                },
              ]}
              loading={loading}
              pagination={false}
              scroll={{ x: 400 }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={formatText.title("available forms")} extra={<FormOutlined />}>
            <Table
              dataSource={availableForms}
              rowKey="id"
              columns={[
                {
                  title: formatText.title('form title'),
                  dataIndex: 'title',
                  key: 'title',
                },
                {
                  title: formatText.title('action'),
                  key: 'action',
                  render: (_: any, record: FeedbackForm) => (
                    <Button
                      type="primary"
                      size="small"
                      onClick={() => navigate(`/forms/${record.id}`)}
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

      {/* Recent Submissions Section */}
      {(submittedResponses.length > 0 || grievances.length > 0) && (
        <Card title={formatText.title("Recent Submissions")} className="mt-6">
          <Row gutter={[16, 16]}>
            {/* Recent Feedback Forms */}
            {submittedResponses.length > 0 && (
              <Col xs={24} lg={12}>
                <div className="border rounded p-4">
                  <Title level={4} className="mb-3">
                    <FormOutlined className="mr-2" />
                    Latest Feedback Forms
                  </Title>
                  <div className="space-y-2">
                    {submittedResponses.slice(0, 3).map((response) => (
                      <div key={response.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">
                            {response.formDetails?.title || 'Unknown Form'}
                          </div>
                          <div className="text-xs text-gray-500">
                              {formatDate(response.submittedAt)}
                          </div>
                        </div>
                        <Tag color="green">Completed</Tag>
                      </div>
                    ))}
                    {submittedResponses.length > 3 && (
                      <div className="text-center pt-2">
                        <Button type="link" size="small" onClick={() => setCurrentView('history')}>
                          View all {submittedResponses.length} submissions
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            )}
            
            {/* Recent Grievances */}
            {grievances.length > 0 && (
              <Col xs={24} lg={submittedResponses.length > 0 ? 12 : 24}>
                <div className="border rounded p-4">
                  <Title level={4} className="mb-3">
                    <FileTextOutlined className="mr-2" />
                    Latest Grievances
                  </Title>
                  <div className="space-y-2">
                    {grievances.slice(0, 3).map((grievance) => (
                      <div key={grievance.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-medium text-sm">{grievance.title}</div>
                          <div className="text-xs text-gray-500">
                              {formatDate(grievance.submittedAt)}
                          </div>
                        </div>
                        <Tag 
                          color={
                            grievance.status === 'pending' ? 'orange' :
                            grievance.status === 'in_progress' ? 'blue' :
                            grievance.status === 'resolved' ? 'green' : 'gray'
                          }
                        >
                          {formatText.tag(grievance.status)}
                        </Tag>
                      </div>
                    ))}
                    {grievances.length > 3 && (
                      <div className="text-center pt-2">
                        <Button type="link" size="small" onClick={() => setCurrentView('grievances')}>
                          View all {grievances.length} grievances
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Col>
            )}
          </Row>
        </Card>
      )}
    </div>
  );

  return (
    <div>
      {renderCurrentView()}
      
      {/* Grievance Modal */}
      <Modal
        title={formatText.title("submit new grievance")}
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
            <Select placeholder="Select category" onChange={handleCategoryChange}>
              <Select.Option value="academic">Academic</Select.Option>
              <Select.Option value="infrastructure">Infrastructure</Select.Option>
              <Select.Option value="hostel">Hostel</Select.Option>
              <Select.Option value="transport">Transport</Select.Option>
              <Select.Option value="library">Library</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Note:</strong> Your grievance will be routed to the selected department's HOD. 
              For academic issues, select your department (e.g., CSE, ECE). 
              For administrative issues, select the relevant administrative department.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Your department: {Array.isArray(user?.department) ? user?.department[0] : user?.department || user?.branch || 'Not specified'}
            </p>
          </div>
          <Form.Item
            name="department"
            label="Route to Department"
            rules={[{ required: true, message: 'Please select the department to handle this grievance' }]}
            initialValue={Array.isArray(user?.department) ? user?.department[0] : user?.department || user?.branch}
          >
            <Select placeholder="Select department to handle this grievance">
              <Select.OptGroup label="Academic Departments">
                <Select.Option value="CSE">Computer Science Engineering (CSE)</Select.Option>
                <Select.Option value="ECE">Electronics & Communication Engineering (ECE)</Select.Option>
                <Select.Option value="EEE">Electrical & Electronics Engineering (EEE)</Select.Option>
                <Select.Option value="MECH">Mechanical Engineering (MECH)</Select.Option>
                <Select.Option value="CIVIL">Civil Engineering (CIVIL)</Select.Option>
                <Select.Option value="IT">Information Technology (IT)</Select.Option>
              </Select.OptGroup>
              <Select.OptGroup label="Administrative Departments">
                <Select.Option value="Academic Affairs">Academic Affairs</Select.Option>
                <Select.Option value="Student Affairs">Student Affairs</Select.Option>
                <Select.Option value="Hostel Management">Hostel Management</Select.Option>
                <Select.Option value="Transport">Transport</Select.Option>
                <Select.Option value="IT Support">IT Support</Select.Option>
                <Select.Option value="Administration">Administration</Select.Option>
              </Select.OptGroup>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {formatText.title("submit grievance")}
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
