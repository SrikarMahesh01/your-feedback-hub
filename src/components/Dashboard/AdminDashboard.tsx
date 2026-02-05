import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Typography, Row, Col, Statistic, Button, Modal, Form, Input, Select, Space, Switch, InputNumber, Divider, Tooltip, message } from 'antd';
import { FileTextOutlined, TeamOutlined, FormOutlined, PlusOutlined, DeleteOutlined, CopyOutlined, DragOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Grievance, FeedbackForm, User, DEPARTMENTS } from '../../types';
import { formatText } from '../../utils/textFormatter';
import { formatDate } from '../../utils/dateFormatter';
import { 
  getGrievancesByAdminDepartments, 
  getStudentsByDepartment, 
  getFeedbackFormsByCreator,
  getFeedbackResponsesByCreator,
  createFeedbackForm,
  updateGrievanceStatus,
  exportResponsesToCSV,
  exportStudentsToCSV,
  deleteFeedbackForm
} from '../../services/firebaseService';
import { Profile } from '../Profile/Profile';

const { Title } = Typography;

type ViewType = 'dashboard' | 'grievances' | 'forms' | 'responses' | 'students' | 'profile';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<any[]>([]);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isResponseModalVisible, setIsResponseModalVisible] = useState(false);
  const [isFormResponsesModalVisible, setIsFormResponsesModalVisible] = useState(false);
  const [isGrievanceModalVisible, setIsGrievanceModalVisible] = useState(false);
  const [isGrievanceUpdateModalVisible, setIsGrievanceUpdateModalVisible] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [selectedForm, setSelectedForm] = useState<FeedbackForm | null>(null);
  const [selectedFormResponses, setSelectedFormResponses] = useState<any[]>([]);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [form] = Form.useForm();
  const [grievanceForm] = Form.useForm();
  
  // State for dynamic form builder
  const [formQuestions, setFormQuestions] = useState<any[]>([
    {
      id: Date.now().toString(),
      type: 'text',
      question: 'Sample question',
      required: true,
      options: [],
      placeholder: '',
      maxLength: null,
      minLength: null,
    }
  ]);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);

  // Form builder helper functions
  const addQuestion = () => {
    const newQuestion = {
      id: Date.now().toString(),
      type: 'text',
      question: 'Untitled Question',
      required: false,
      options: [],
      placeholder: '',
      maxLength: null,
      minLength: null,
    };
    setFormQuestions([...formQuestions, newQuestion]);
  };

  const removeQuestion = (questionId: string) => {
    setFormQuestions(formQuestions.filter(q => q.id !== questionId));
  };

  const updateQuestion = (questionId: string, updates: any) => {
    setFormQuestions(formQuestions.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };

  const duplicateQuestion = (questionId: string) => {
    const originalQuestion = formQuestions.find(q => q.id === questionId);
    if (originalQuestion) {
      const duplicatedQuestion = {
        ...originalQuestion,
        id: Date.now().toString(),
        question: `${originalQuestion.question} (Copy)`
      };
      const originalIndex = formQuestions.findIndex(q => q.id === questionId);
      const newQuestions = [...formQuestions];
      newQuestions.splice(originalIndex + 1, 0, duplicatedQuestion);
      setFormQuestions(newQuestions);
    }
  };

  const moveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = formQuestions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= formQuestions.length) return;
    
    const newQuestions = [...formQuestions];
    [newQuestions[currentIndex], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[currentIndex]];
    setFormQuestions(newQuestions);
  };

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
  }, [user?.id, currentView]);

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
    if (!user?.id) return;
    
    try {
      // Get forms created by this admin user
      const userForms = await getFeedbackFormsByCreator(user.id);
      setFeedbackForms(userForms);
      
      console.log('Loaded forms created by admin:', userForms.length);
      userForms.forEach(form => {
        console.log(`- Form: ${form.title} | Target: ${form.targetBranch} (Year ${form.targetYear})`);
      });
    } catch (error) {
      console.error('Error loading feedback forms:', error);
    }
  };

  const loadFeedbackResponses = async () => {
    if (!user?.id) return;
    
    try {
      console.log('Loading feedback responses for admin:', user.id);
      
      // Get responses for forms created by this admin
      const responses = await getFeedbackResponsesByCreator(user.id);
      setFeedbackResponses(responses);
      
      console.log('Loaded responses for admin forms:', responses.length);
      console.log('Sample response:', responses[0]);
      
      // Debug: Log each response
      responses.forEach((response, index) => {
        console.log(`Response ${index + 1}:`, {
          formTitle: response.formDetails?.title,
          studentName: response.studentDetails?.name || 'Unknown',
          submittedAt: response.submittedAt
        });
      });
    } catch (error) {
      console.error('Error loading feedback responses:', error);
    }
  };

  const handleUpdateGrievanceStatus = async (grievanceId: string, newStatus: string) => {
    try {
      await updateGrievanceStatus(grievanceId, newStatus);
      await loadGrievances();
      message.success('Grievance status updated successfully!');
    } catch (error) {
      console.error('Error updating grievance status:', error);
      message.error('Failed to update grievance status');
    }
  };

  const handleDeleteForm = async (formId: string, formTitle: string) => {
    Modal.confirm({
      title: 'Delete Feedback Form',
      content: `Are you sure you want to delete "${formTitle}"? This will also delete all responses associated with this form. This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteFeedbackForm(formId);
          message.success('Form and all associated responses deleted successfully!');
          await loadFeedbackForms(); // Refresh the forms list
          await loadFeedbackResponses(); // Refresh the responses list
        } catch (error) {
          console.error('Error deleting form:', error);
          message.error('Failed to delete form');
        }
      },
    });
  };

  const handleViewGrievance = (grievance: Grievance) => {
    setSelectedGrievance(grievance);
    setIsGrievanceModalVisible(true);
  };

  const handleUpdateGrievanceModal = (grievance: Grievance) => {
    setSelectedGrievance(grievance);
    grievanceForm.setFieldsValue({
      status: grievance.status,
      comment: ''
    });
    setIsGrievanceUpdateModalVisible(true);
  };

  const handleGrievanceUpdate = async (values: any) => {
    if (!selectedGrievance || !user?.id) return;

    try {
      let adminComments = selectedGrievance.adminComments || [];
      
      // Add new comment if provided
      if (values.comment?.trim()) {
        const newComment = `[${new Date().toLocaleString()}] ${user.name || 'Admin'}: ${values.comment}`;
        adminComments = [...adminComments, newComment];
      }

      // Update status and comments
      await updateGrievanceStatus(selectedGrievance.id, values.status, adminComments);

      message.success('Grievance updated successfully!');
      setIsGrievanceUpdateModalVisible(false);
      grievanceForm.resetFields();
      setSelectedGrievance(null);
      await loadGrievances();
    } catch (error) {
      console.error('Error updating grievance:', error);
      message.error('Failed to update grievance');
    }
  };

  const openFormModal = () => {
    console.log('Opening form modal...');
    console.log('Current formQuestions state:', formQuestions);
    
    // Reset form fields
    form.resetFields();
    
    // Ensure we have at least one question
    if (!formQuestions || formQuestions.length === 0) {
      console.log('No questions found, initializing with default question');
      setFormQuestions([
        {
          id: Date.now().toString(),
          type: 'text',
          question: 'Sample question',
          required: true,
          options: [],
          placeholder: '',
          maxLength: null,
          minLength: null,
        }
      ]);
    }
    
    setIsFormModalVisible(true);
  };

  const handleCreateFeedbackForm = async (values: any) => {
    console.log('Form submission started with values:', values);
    console.log('Current user:', user);
    console.log('Current form questions:', formQuestions);
    
    if (!user?.id || !user?.department) {
      console.error('Missing user ID or department:', { userId: user?.id, department: user?.department });
      return;
    }

    if (!formQuestions || formQuestions.length === 0) {
      console.error('No questions in form');
      return;
    }

    if (!values.title || !values.description) {
      console.error('Missing required form fields:', { title: values.title, description: values.description });
      return;
    }

    try {
      // Clean and validate form data to prevent undefined values
      const cleanFormData = {
        title: values.title || '',
        description: values.description || '',
        questions: formQuestions.map(q => {
          const cleanQuestion: any = {
            id: q.id,
            type: q.type,
            question: q.question || '',
            required: Boolean(q.required),
            options: Array.isArray(q.options) ? q.options : [],
          };
          
          // Only add optional fields if they have valid values
          if (q.placeholder && q.placeholder.trim() !== '') {
            cleanQuestion.placeholder = q.placeholder;
          }
          if (q.maxLength && q.maxLength > 0) {
            cleanQuestion.maxLength = q.maxLength;
          }
          if (q.minLength && q.minLength > 0) {
            cleanQuestion.minLength = q.minLength;
          }
          
          return cleanQuestion;
        }),
        targetYear: values.targetYear || 'ALL',
        targetBranch: values.targetBranch || 'ALL',
        department: values.targetBranch || 'ALL', // Use targetBranch as department
        createdBy: user.id,
        isActive: true,
      };

      console.log('About to create feedback form with data:', cleanFormData);
      
      const docId = await createFeedbackForm(cleanFormData);
      console.log('Form created successfully with ID:', docId);
      
      message.success('Feedback form created successfully!');
      
      setIsFormModalVisible(false);
      form.resetFields();
      // Reset questions to default
      setFormQuestions([
        {
          id: Date.now().toString(),
          type: 'text',
          question: 'Sample question',
          required: true,
          options: [],
          placeholder: '',
          maxLength: null,
          minLength: null,
        }
      ]);
      await loadFeedbackForms();
      console.log('Form creation process completed');
    } catch (error) {
      console.error('Error creating form:', error);
      message.error('Failed to create feedback form. Please try again.');
    }
  };

  const handleViewResponseDetails = (response: any) => {
    console.log('Viewing response details:', response);
    setSelectedResponse(response);
    setIsResponseModalVisible(true);
  };

  const handleCloseResponseModal = () => {
    setIsResponseModalVisible(false);
    setSelectedResponse(null);
  };

  const handleViewFormResponses = (form: FeedbackForm) => {
    // Filter responses for this specific form
    const formResponses = feedbackResponses.filter(r => r.formId === form.id);
    console.log(`Viewing responses for form: ${form.title}`, formResponses);
    
    // Set the selected form and its responses for the modal
    setSelectedForm(form);
    setSelectedFormResponses(formResponses);
    setIsFormResponsesModalVisible(true);
  };

  const handleExportResponses = () => {
    if (feedbackResponses.length === 0) {
      message.warning('No responses to export');
      return;
    }
    
    try {
      exportResponsesToCSV(feedbackResponses, 'All_Feedback_Responses');
      message.success('CSV exported successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      message.error('Failed to export CSV');
    }
  };

  const handleExportFormResponses = (form: FeedbackForm) => {
    const formResponses = feedbackResponses.filter(r => r.formId === form.id);
    if (formResponses.length === 0) {
      message.warning('No responses to export for this form');
      return;
    }
    
    try {
      exportResponsesToCSV(formResponses, form.title);
      message.success(`CSV exported successfully for ${form.title}!`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      message.error('Failed to export CSV');
    }
  };

  const handleExportStudents = () => {
    if (students.length === 0) {
      message.warning('No students to export');
      return;
    }
    
    try {
      const departmentName = Array.isArray(user?.department) 
        ? user.department.join('_') 
        : user?.department || 'Department';
      
      exportStudentsToCSV(students, departmentName);
      message.success('Students CSV exported successfully!');
    } catch (error) {
      console.error('Error exporting students CSV:', error);
      message.error('Failed to export students CSV');
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
          loading={refreshLoading}
          onClick={async () => {
            setRefreshLoading(true);
            try {
              await Promise.all([
                loadGrievances(),
                loadStudents(),
                loadFeedbackForms(),
                loadFeedbackResponses()
              ]);
              message.success('Data refreshed successfully!');
            } catch (error) {
              console.error('Error refreshing data:', error);
              message.error('Failed to refresh data. Please try again.');
            } finally {
              setRefreshLoading(false);
            }
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
              title={formatText.title("department students")}
              value={students.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={formatText.title("department grievances")}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openFormModal}
          >
            {formatText.title("create feedback form")}
          </Button>
        }
      >
        <Table
          dataSource={grievances}
          rowKey="id"
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
              render: (category: string) => <Tag>{formatText.tag(category)}</Tag>,
            },
            {
              title: 'Routed To',
              dataIndex: 'department',
              key: 'department',
              render: (department: string) => (
                <Tag color="purple">{formatText.department(department)}</Tag>
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
                return <Tag color={colors[status as keyof typeof colors]}>{formatText.tag(status)}</Tag>;
              },
            },
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    onClick={() => handleViewGrievance(record)}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleUpdateGrievanceModal(record)}
                  >
                    Update
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={{ 
            pageSize: 50, 
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} grievances`
          }}
        />
      </Card>

      <Card title="Feedback Forms" extra={<FormOutlined />}>
        <Table
          dataSource={feedbackForms}
          rowKey="id"
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
              render: (year: string) => (year === 'ALL' || year === 'all') ? 'All Years' : `Year ${year}`,
            },
            {
              title: 'Target Branch',
              dataIndex: 'targetBranch',
              key: 'targetBranch',
              render: (branch: string) => (branch === 'ALL' || branch === 'all') ? 'All Branches' : branch,
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
            {
              title: 'Actions',
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleDeleteForm(record.id, record.title)}
                  >
                    Delete
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={{ 
            pageSize: 50, 
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} forms`
          }}
        />
      </Card>

      <Modal
        title="Create Feedback Form"
        open={isFormModalVisible}
        onCancel={() => setIsFormModalVisible(false)}
        footer={null}
        width={900}
        style={{ top: 20 }}
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
            <Input.TextArea rows={3} placeholder="Enter form description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
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
                  <Select.Option value="ALL">All Years</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="targetBranch"
                label="Target Branch"
                rules={[{ required: true, message: 'Please select target branch' }]}
              >
                <Select placeholder="Select branch">
                  {DEPARTMENTS.map(dept => (
                    <Select.Option key={dept} value={dept}>{dept}</Select.Option>
                  ))}
                  <Select.Option value="ALL">All Branches</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Questions">
                <div className="text-sm text-gray-600">
                  {formQuestions.length} question(s) added
                </div>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Questions</Divider>

          <div className="max-h-96 overflow-y-auto space-y-4">
            {formQuestions.map((question, index) => (
              <Card
                key={question.id}
                size="small"
                className={`transition-all duration-200 ${
                  editingQuestion === question.id ? 'ring-2 ring-blue-400' : ''
                }`}
                extra={
                  <Space>
                    <Tooltip title="Move up">
                      <Button
                        type="text"
                        size="small"
                        icon={<DragOutlined />}
                        onClick={() => moveQuestion(question.id, 'up')}
                        disabled={index === 0}
                      />
                    </Tooltip>
                    <Tooltip title="Move down">
                      <Button
                        type="text"
                        size="small"
                        icon={<DragOutlined style={{ transform: 'rotate(180deg)' }} />}
                        onClick={() => moveQuestion(question.id, 'down')}
                        disabled={index === formQuestions.length - 1}
                      />
                    </Tooltip>
                    <Tooltip title="Duplicate">
                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => duplicateQuestion(question.id)}
                      />
                    </Tooltip>
                    <Tooltip title="Delete">
                      <Button
                        type="text"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeQuestion(question.id)}
                        disabled={formQuestions.length === 1}
                      />
                    </Tooltip>
                  </Space>
                }
              >
                <div className="space-y-3">
                  <Input
                    placeholder="Question text"
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                    onFocus={() => setEditingQuestion(question.id)}
                    onBlur={() => setEditingQuestion(null)}
                  />
                  
                  <Row gutter={12}>
                    <Col span={8}>
                      <Select
                        placeholder="Question type"
                        value={question.type}
                        onChange={(value) => updateQuestion(question.id, { type: value })}
                        className="w-full"
                      >
                        <Select.Option value="text">Short Text</Select.Option>
                        <Select.Option value="textarea">Long Text</Select.Option>
                        <Select.Option value="radio">Multiple Choice</Select.Option>
                        <Select.Option value="checkbox">Checkboxes</Select.Option>
                        <Select.Option value="rating">Rating</Select.Option>
                      </Select>
                    </Col>
                    <Col span={8}>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={question.required}
                          onChange={(checked) => updateQuestion(question.id, { required: checked })}
                        />
                        <span className="text-sm">Required</span>
                      </div>
                    </Col>
                    <Col span={8}>
                      {(question.type === 'text' || question.type === 'textarea') && (
                        <Input
                          placeholder="Placeholder text"
                          value={question.placeholder}
                          onChange={(e) => updateQuestion(question.id, { placeholder: e.target.value })}
                        />
                      )}
                    </Col>
                  </Row>

                  {(question.type === 'radio' || question.type === 'checkbox') && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Options:</div>
                      {(question.options || []).map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...(question.options || [])];
                              newOptions[optionIndex] = e.target.value;
                              updateQuestion(question.id, { options: newOptions });
                            }}
                          />
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              const newOptions = (question.options || []).filter((_: any, i: number) => i !== optionIndex);
                              updateQuestion(question.id, { options: newOptions });
                            }}
                          />
                        </div>
                      ))}
                      <Button
                        type="dashed"
                        size="small"
                        onClick={() => {
                          const newOptions = [...(question.options || []), ''];
                          updateQuestion(question.id, { options: newOptions });
                        }}
                      >
                        Add Option
                      </Button>
                    </div>
                  )}

                  {(question.type === 'text' || question.type === 'textarea') && (
                    <Row gutter={12}>
                      <Col span={12}>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Min Length:</span>
                          <InputNumber
                            min={0}
                            value={question.minLength}
                            onChange={(value) => updateQuestion(question.id, { minLength: value || 0 })}
                            size="small"
                          />
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">Max Length:</span>
                          <InputNumber
                            min={0}
                            value={question.maxLength}
                            onChange={(value) => updateQuestion(question.id, { maxLength: value || 0 })}
                            size="small"
                          />
                        </div>
                      </Col>
                    </Row>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-4 text-center">
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={addQuestion}
              className="w-full"
            >
              Add Question
            </Button>
          </div>

          <Form.Item className="mt-6 mb-0">
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

      <Modal
        title="Response Details"
        open={isResponseModalVisible}
        onCancel={handleCloseResponseModal}
        footer={null}
        width={800}
      >
        <div className="p-4">
          {selectedResponse && (
            <div>
              <div className="text-lg font-semibold mb-4">{selectedResponse.formDetails?.title}</div>
              
              <div className="mb-4">
                <strong>Student:</strong> {selectedResponse.studentDetails?.name || 'Unknown'}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Submitted At:</strong> {new Date(selectedResponse.submittedAt).toLocaleString()}
                </div>
                <div>
                  <strong>Response ID:</strong> {selectedResponse.id}
                </div>
              </div>
              
              <Divider className="my-4" />

              <div className="space-y-4">
                {selectedResponse.formDetails?.questions?.map((question: any, index: number) => {
                  const response = selectedResponse.responses?.[index];
                  return (
                    <div key={question.id} className="p-4 border rounded-md">
                      <div className="font-medium">{question.question}</div>
                      <div className="text-sm text-gray-500 mb-2">
                        {question.type === 'checkbox' ? 'Selected Options:' : 'Response:'}
                      </div>
                      <div>
                        {question.type === 'checkbox' && Array.isArray(response) ? (
                          <div className="flex flex-wrap gap-2">
                            {response.map((option: string, idx: number) => (
                              <Tag key={idx} color="blue">
                                {option}
                              </Tag>
                            ))}
                          </div>
                        ) : (
                          <div>{response}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
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
          rowKey="id"
          columns={[
            {
              title: formatText.title('student'),
              dataIndex: 'studentName',
              key: 'studentName',
            },
            {
              title: formatText.title('title'),
              dataIndex: 'title',
              key: 'title',
            },
            {
              title: formatText.title('description'),
              dataIndex: 'description',
              key: 'description',
              render: (text: string) => (
                <div className="max-w-xs truncate" title={text}>
                  {text}
                </div>
              ),
            },
            {
              title: formatText.title('category'),
              dataIndex: 'category',
              key: 'category',
              render: (category: string) => <Tag>{formatText.title(category)}</Tag>,
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
                return <Tag color={colors[status as keyof typeof colors]}>{formatText.status(status)}</Tag>;
              },
            },
            {
              title: formatText.title('submitted'),
              dataIndex: 'submittedAt',
              key: 'submittedAt',
              render: (date: string) => new Date(date).toLocaleDateString(),
            },
            {
              title: formatText.title('actions'),
              key: 'actions',
              render: (_, record) => (
                <Space>
                  <Button
                    size="small"
                    type="default"
                    onClick={() => navigate(`/grievances/${record.id}`)}
                  >
                    {formatText.title('view')}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleUpdateGrievanceStatus(record.id, 'in_progress')}
                    disabled={record.status === 'in_progress'}
                  >
                    {formatText.title('in progress')}
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    onClick={() => handleUpdateGrievanceStatus(record.id, 'resolved')}
                    disabled={record.status === 'resolved'}
                  >
                    {formatText.title('resolve')}
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={{ 
            pageSize: 50, 
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} grievances`
          }}
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
            onClick={openFormModal}
          >
            Create New Form
          </Button>
        }
      >
        <Table
          dataSource={feedbackForms}
          rowKey="id"
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
              render: (year: string) => (year === 'ALL' || year === 'all') ? 'All Years' : `Year ${year}`,
            },
            {
              title: 'Target Branch',
              dataIndex: 'targetBranch',
              key: 'targetBranch',
              render: (branch: string) => (branch === 'ALL' || branch === 'all') ? 'All Branches' : branch,
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
            {
              title: 'Created',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (date: string) => new Date(date).toLocaleDateString(),
            },
          ]}
          pagination={{ 
            pageSize: 50, 
            showSizeChanger: true,
            pageSizeOptions: ['10', '25', '50', '100'],
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} forms`
          }}
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

      {/* Additional Form Statistics Row */}
      <Row gutter={[16, 16]} className="mt-4">
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Forms"
              value={feedbackForms.length}
              prefix={<FormOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Inactive Forms"
              value={feedbackForms.filter(f => !f.isActive).length}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Form Response Rate"
              value={feedbackForms.length > 0 ? Math.round((feedbackResponses.length / feedbackForms.length) * 100) / 100 : 0}
              suffix="avg/form"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card 
        title="Recent Responses"
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExportResponses}
            disabled={feedbackResponses.length === 0}
          >
            Export CSV
          </Button>
        }
      >
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
                  <div className="font-medium">{record.studentDetails?.name || 'Unknown'}</div>
                  <div className="text-sm text-gray-500">
                    {record.studentDetails?.rollNumber} - Year {record.studentDetails?.year}
                  </div>
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
              render: (_, record) => (
                <Button 
                  type="link" 
                  size="small"
                  onClick={() => handleViewResponseDetails(record)}
                >
                  View Details
                </Button>
              ),
            },
          ]}
          rowKey="id"
          pagination={{ 
            pageSize: 100, 
            showSizeChanger: true,
            pageSizeOptions: ['25', '50', '100', '200', '500'],
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} responses`
          }}
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
                    <div><strong>Created:</strong> {new Date(form.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="mt-4">
                    <Space>
                      <Button 
                        type="primary" 
                        size="small"
                        onClick={() => handleViewFormResponses(form)}
                      >
                        View All Responses ({formResponses.length})
                      </Button>
                      <Button 
                        type="default" 
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleExportFormResponses(form)}
                        disabled={formResponses.length === 0}
                      >
                        Export CSV
                      </Button>
                    </Space>
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
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>{formatText.title("Students")}</Title>
          <p className="text-gray-600">
            View students in your department ({Array.isArray(user?.department) ? user.department.join(', ') : user?.department})
          </p>
        </div>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleExportStudents}
          disabled={students.length === 0}
        >
          {formatText.title("Export Students CSV")}
        </Button>
      </div>

      <Card
        title={
          <div className="flex justify-between items-center">
            <span>{formatText.title("Department Students")}</span>
            <Tag color="blue">{students.length} {formatText.title("students")}</Tag>
          </div>
        }
      >
        {students.length === 0 ? (
          <div className="text-center py-8">
            <TeamOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            <div className="text-gray-500 text-lg mt-4 mb-2">
              {formatText.title("No Students Found")}
            </div>
            <div className="text-gray-400 text-sm">
              No students found in your department. Students will appear here once they register.
            </div>
          </div>
        ) : (
          <Table
            dataSource={students}
            rowKey="id"
            columns={[
              {
                title: formatText.title('S.No'),
                key: 'serialNumber',
                width: 80,
                render: (_, __, index) => index + 1,
              },
              {
                title: formatText.title('Name'),
                dataIndex: 'name',
                key: 'name',
                sorter: (a, b) => a.name.localeCompare(b.name),
              },
              {
                title: formatText.title('Email'),
                dataIndex: 'email',
                key: 'email',
                render: (email: string) => (
                  <a href={`mailto:${email}`} className="text-blue-600">
                    {email}
                  </a>
                ),
              },
              {
                title: formatText.title('Roll Number'),
                dataIndex: 'rollNumber',
                key: 'rollNumber',
                sorter: (a, b) => (a.rollNumber || '').localeCompare(b.rollNumber || ''),
              },
              {
                title: formatText.title('Year'),
                dataIndex: 'year',
                key: 'year',
                sorter: (a, b) => (a.year || '').localeCompare(b.year || ''),
                render: (year: string) => year ? `Year ${year}` : 'N/A',
              },
              {
                title: formatText.title('Branch'),
                dataIndex: 'branch',
                key: 'branch',
                sorter: (a, b) => (a.branch || '').localeCompare(b.branch || ''),
                render: (branch: string) => (
                  <Tag color="purple">{formatText.department(branch)}</Tag>
                ),
              },
              {
                title: formatText.title('Status'),
                dataIndex: 'isActive',
                key: 'isActive',
                filters: [
                  { text: 'Active', value: true },
                  { text: 'Inactive', value: false },
                ],
                onFilter: (value, record) => record.isActive === value,
                render: (isActive: boolean) => (
                  <Tag color={isActive !== false ? 'green' : 'red'}>
                    {formatText.status(isActive !== false ? 'active' : 'inactive')}
                  </Tag>
                ),
              },
              {
                title: formatText.title('Joined'),
                dataIndex: 'createdAt',
                key: 'createdAt',
                sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
                render: (date: string) => (
                  <div className="text-sm">
                    <div>{new Date(date).toLocaleDateString()}</div>
                    <div className="text-gray-500">{new Date(date).toLocaleTimeString()}</div>
                  </div>
                ),
              },
            ]}
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} students`,
            }}
            scroll={{ x: 800 }}
            size="middle"
          />
        )}
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

  useEffect(() => {
    const handleFormSubmission = () => {
      console.log('Form submitted, refreshing admin data...');
      // Refresh the admin data when a form is submitted
      loadFeedbackResponses();
    };

    window.addEventListener('form-submitted', handleFormSubmission as EventListener);

    return () => {
      window.removeEventListener('form-submitted', handleFormSubmission as EventListener);
    };
  }, []);

  return (
    <>
      {renderCurrentView()}
      
      {/* Response Details Modal */}
      <Modal
        title="Response Details"
        open={isResponseModalVisible}
        onCancel={handleCloseResponseModal}
        footer={[
          <Button key="close" onClick={handleCloseResponseModal}>
            Close
          </Button>
        ]}
        width={800}
        className="response-details-modal"
      >
        {selectedResponse && (
          <div className="space-y-6">
            {/* Form Information */}
            <Card size="small" title="Form Information">
              <div className="space-y-2">
                <div><strong>Title:</strong> {selectedResponse.formDetails?.title || 'N/A'}</div>
                <div><strong>Description:</strong> {selectedResponse.formDetails?.description || 'N/A'}</div>
                <div><strong>Target:</strong> Year {selectedResponse.formDetails?.targetYear}, {selectedResponse.formDetails?.targetBranch}</div>
                <div><strong>Submitted:</strong> {new Date(selectedResponse.submittedAt).toLocaleString()}</div>
              </div>
            </Card>

            {/* Student Information */}
            <Card size="small" title="Student Information">
              {selectedResponse.studentDetails ? (
                <div className="space-y-2">
                  <div><strong>Name:</strong> {selectedResponse.studentDetails.name}</div>
                  <div><strong>Email:</strong> {selectedResponse.studentDetails.email}</div>
                  <div><strong>Roll Number:</strong> {selectedResponse.studentDetails.rollNumber}</div>
                  <div><strong>Year:</strong> {selectedResponse.studentDetails.year}</div>
                  <div><strong>Branch:</strong> {selectedResponse.studentDetails.branch}</div>
                </div>
              ) : (
                <div>Student information not available</div>
              )}
            </Card>

            {/* Response Details */}
            <Card size="small" title="Response Details">
              <div className="space-y-4">
                {selectedResponse.formDetails?.questions?.map((question: any, index: number) => (
                  <div key={question.id} className="border-b pb-4">
                    <div className="font-medium mb-2">
                      {index + 1}. {question.question}
                    </div>
                    <div className="ml-4 p-3 bg-gray-50 rounded">
                      {selectedResponse.responses?.[question.id] || 'No response provided'}
                    </div>
                  </div>
                )) || 'No questions available'}
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* Form Responses Excel-like View Modal */}
      <Modal
        title={selectedForm ? `${formatText.title("responses for")} "${selectedForm.title}"` : formatText.title("form responses")}
        open={isFormResponsesModalVisible}
        onCancel={() => {
          setIsFormResponsesModalVisible(false);
          setSelectedForm(null);
          setSelectedFormResponses([]);
        }}
        footer={[
          <Button 
            key="export" 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={() => selectedForm && handleExportFormResponses(selectedForm)}
            disabled={selectedFormResponses.length === 0}
          >
            {formatText.title("export csv")}
          </Button>,
          <Button 
            key="close" 
            onClick={() => {
              setIsFormResponsesModalVisible(false);
              setSelectedForm(null);
              setSelectedFormResponses([]);
            }}
          >
            {formatText.title("close")}
          </Button>
        ]}
        width="95%"
        style={{ top: 20 }}
        className="form-responses-modal"
      >
        {selectedForm && selectedFormResponses && (
          <div className="space-y-4">
            {/* Form Information Header */}
            <Card size="small" className="bg-blue-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><strong>{formatText.title("form")}:</strong> {selectedForm.title}</div>
                <div><strong>{formatText.title("department")}:</strong> {selectedForm.department}</div>
                <div><strong>{formatText.title("target")}:</strong> Year {selectedForm.targetYear}, {selectedForm.targetBranch}</div>
                <div><strong>{formatText.title("total responses")}:</strong> {selectedFormResponses.length}</div>
              </div>
            </Card>

            {/* Excel-like Table */}
            {selectedFormResponses.length > 0 ? (
              <div className="overflow-auto" style={{ maxHeight: '60vh' }}>
                <Table
                  dataSource={selectedFormResponses.map((response, index) => ({
                    ...response,
                    serialNumber: index + 1,
                    studentName: response.studentDetails?.name || 'N/A',
                    studentEmail: response.studentDetails?.email || 'N/A',
                    studentRoll: response.studentDetails?.rollNumber || 'N/A',
                    studentYear: response.studentDetails?.year || 'N/A',
                    studentBranch: response.studentDetails?.branch || 'N/A',
                    submissionDate: new Date(response.submittedAt).toLocaleDateString(),
                    submissionTime: new Date(response.submittedAt).toLocaleTimeString(),
                  }))}
                  columns={[
                    {
                      title: formatText.title('S.No'),
                      dataIndex: 'serialNumber',
                      key: 'serialNumber',
                      width: 60,
                      fixed: 'left' as const,
                    },
                    {
                      title: formatText.title('student name'),
                      dataIndex: 'studentName',
                      key: 'studentName',
                      width: 150,
                      fixed: 'left' as const,
                    },
                    {
                      title: formatText.title('roll number'),
                      dataIndex: 'studentRoll',
                      key: 'studentRoll',
                      width: 120,
                    },
                    {
                      title: formatText.title('year'),
                      dataIndex: 'studentYear',
                      key: 'studentYear',
                      width: 80,
                    },
                    {
                      title: formatText.title('branch'),
                      dataIndex: 'studentBranch',
                      key: 'studentBranch',
                      width: 100,
                    },
                    // Dynamic columns for each question
                    ...selectedForm.questions.map((question, qIndex) => ({
                      title: (
                        <div className="max-w-xs">
                          <div className="font-semibold text-xs">
                            {formatText.title(`Q${qIndex + 1}`)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {question.question.length > 50 
                              ? `${question.question.substring(0, 50)}...` 
                              : question.question
                            }
                          </div>
                        </div>
                      ),
                      dataIndex: ['responses', question.id],
                      key: `question_${question.id}`,
                      width: 200,
                      render: (value: any) => {
                        if (!value) return <span className="text-gray-400">No response</span>;
                        
                        if (Array.isArray(value)) {
                          return (
                            <div className="flex flex-wrap gap-1">
                              {value.map((item, idx) => (
                                <Tag key={idx} color="blue">
                                  {item}
                                </Tag>
                              ))}
                            </div>
                          );
                        }
                        
                        if (typeof value === 'string' && value.length > 100) {
                          return (
                            <div title={value} className="max-w-xs">
                              {value.substring(0, 100)}...
                            </div>
                          );
                        }
                        
                        return <div className="max-w-xs break-words">{value}</div>;
                      },
                    })),
                    {
                      title: formatText.title('submission date'),
                      dataIndex: 'submissionDate',
                      key: 'submissionDate',
                      width: 120,
                    },
                    {
                      title: formatText.title('submission time'),
                      dataIndex: 'submissionTime',
                      key: 'submissionTime',
                      width: 120,
                    },
                  ]}
                  pagination={{
                    pageSize: 1000,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    pageSizeOptions: ['50', '100', '200', '500', '1000', '2000'],
                    showTotal: (total, range) => 
                      `${range[0]}-${range[1]} of ${total} responses`,
                  }}
                  scroll={{ x: 'max-content', y: 400 }}
                  size="small"
                  bordered
                  rowKey="id"
                  className="excel-like-table"
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg mb-2">
                  {formatText.title("no responses found")}
                </div>
                <div className="text-gray-400 text-sm">
                  This form hasn't received any responses yet.
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Grievance Details Modal */}
      <Modal
        title={selectedGrievance ? `${formatText.title("grievance details")} - ${selectedGrievance.title}` : formatText.title("grievance details")}
        open={isGrievanceModalVisible}
        onCancel={() => {
          setIsGrievanceModalVisible(false);
          setSelectedGrievance(null);
        }}
        footer={[
          <Button 
            key="update" 
            type="primary"
            onClick={() => {
              setIsGrievanceModalVisible(false);
              handleUpdateGrievanceModal(selectedGrievance!);
            }}
          >
            {formatText.title("update status")}
          </Button>,
          <Button 
            key="close" 
            onClick={() => {
              setIsGrievanceModalVisible(false);
              setSelectedGrievance(null);
            }}
          >
            {formatText.title("close")}
          </Button>
        ]}
        width={800}
      >
        {selectedGrievance && (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <div><strong>{formatText.title("student name")}:</strong> {selectedGrievance.studentName}</div>
              </Col>
              <Col span={12}>
                <div><strong>{formatText.title("category")}:</strong> 
                  <Tag color="blue" className="ml-2">
                    {formatText.tag(selectedGrievance.category)}
                  </Tag>
                </div>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={24}>
                <div><strong>{formatText.title("department")}:</strong> {selectedGrievance.department}</div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div><strong>{formatText.title("status")}:</strong> 
                  <Tag color={selectedGrievance.status === 'pending' ? 'orange' : selectedGrievance.status === 'in_progress' ? 'blue' : selectedGrievance.status === 'resolved' ? 'green' : 'gray'} className="ml-2">
                    {formatText.status(selectedGrievance.status)}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <div><strong>{formatText.title("submitted at")}:</strong> {new Date(selectedGrievance.submittedAt).toLocaleString()}</div>
              </Col>
            </Row>

            <div>
              <strong>{formatText.title("description")}:</strong>
              <div className="mt-2 p-3 bg-gray-50 rounded border">
                {selectedGrievance.description}
              </div>
            </div>

            {selectedGrievance.adminComments && selectedGrievance.adminComments.length > 0 && (
              <div>
                <strong>{formatText.title("admin comments")}:</strong>
                <div className="mt-2 space-y-2">
                  {selectedGrievance.adminComments.map((comment, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                      {comment}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Update Grievance Modal */}
      <Modal
        title={selectedGrievance ? `${formatText.title("update grievance")} - ${selectedGrievance.title}` : formatText.title("update grievance")}
        open={isGrievanceUpdateModalVisible}
        onCancel={() => {
          setIsGrievanceUpdateModalVisible(false);
          setSelectedGrievance(null);
          grievanceForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={grievanceForm}
          layout="vertical"
          onFinish={handleGrievanceUpdate}
        >
          <Form.Item
            name="status"
            label={formatText.title("status")}
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="pending">{formatText.title("pending")}</Select.Option>
              <Select.Option value="in_progress">{formatText.title("in progress")}</Select.Option>
              <Select.Option value="resolved">{formatText.title("resolved")}</Select.Option>
              <Select.Option value="closed">{formatText.title("closed")}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label={formatText.title("admin comment (optional)")}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Add a comment about this grievance..."
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {formatText.title("update grievance")}
              </Button>
              <Button onClick={() => {
                setIsGrievanceUpdateModalVisible(false);
                setSelectedGrievance(null);
                grievanceForm.resetFields();
              }}>
                {formatText.title("cancel")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
