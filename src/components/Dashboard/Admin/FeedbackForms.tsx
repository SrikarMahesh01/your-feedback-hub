import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Row, Col, Button, Modal, Form, Input, Select, Space, Switch, InputNumber, Tooltip, message } from 'antd';
import { PlusOutlined, DeleteOutlined, CopyOutlined, DragOutlined, DownloadOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { FeedbackForm, DEPARTMENTS } from '../../../types';
import { formatText } from '../../../utils/textFormatter';
import { 
  getFeedbackFormsByCreator,
  getFeedbackResponsesByCreator,
  createFeedbackForm,
  updateFeedbackFormStatus,
  exportResponsesToCSV,
  deleteFeedbackForm
} from '../../../services/firebaseService';

const { Title } = Typography;

export const FeedbackForms: React.FC = () => {
  const { user } = useAuth();
  const [feedbackForms, setFeedbackForms] = useState<FeedbackForm[]>([]);
  const [feedbackResponses, setFeedbackResponses] = useState<any[]>([]);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isFormResponsesModalVisible, setIsFormResponsesModalVisible] = useState(false);
  const [selectedForm, setSelectedForm] = useState<FeedbackForm | null>(null);
  const [selectedFormResponses, setSelectedFormResponses] = useState<any[]>([]);
  const [form] = Form.useForm();
  
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

  useEffect(() => {
    loadFeedbackForms();
    loadFeedbackResponses();
  }, [user?.id]);

  const loadFeedbackForms = async () => {
    if (!user?.id) return;
    
    try {
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
      const responses = await getFeedbackResponsesByCreator(user.id);
      setFeedbackResponses(responses);
      
      console.log('Loaded responses for admin forms:', responses.length);
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
      console.error('Missing required form fields');
      return;
    }

    const formData = {
      title: values.title,
      description: values.description,
      questions: formQuestions,
      targetYear: values.targetYear,
      targetBranch: values.targetBranch,
      department: Array.isArray(user.department) ? user.department[0] : user.department,
      createdBy: user.id,
      isActive: true,
      expiresAt: values.expiresAt || null,
    };

    console.log('Final form data to be submitted:', formData);

    try {
      await createFeedbackForm(formData);
      console.log('✅ Form created successfully');
      message.success('Feedback form created successfully!');
      setIsFormModalVisible(false);
      form.resetFields();
      setFormQuestions([{
        id: Date.now().toString(),
        type: 'text',
        question: 'Sample question',
        required: true,
        options: [],
        placeholder: '',
        maxLength: null,
        minLength: null,
      }]);
      await loadFeedbackForms();
    } catch (error) {
      console.error('❌ Error creating form:', error);
      message.error('Failed to create feedback form');
    }
  };

  const handleViewFormResponses = (form: FeedbackForm) => {
    const formResponses = feedbackResponses.filter(r => r.formId === form.id);
    console.log(`Viewing responses for form: ${form.title}`, formResponses);
    
    setSelectedForm(form);
    setSelectedFormResponses(formResponses);
    setIsFormResponsesModalVisible(true);
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

  const handleToggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await updateFeedbackFormStatus(formId, newStatus);
      
      message.success(`Form ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      await loadFeedbackForms(); // Refresh the forms list
    } catch (error) {
      console.error('Error toggling form status:', error);
      message.error('Failed to update form status');
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>{formatText.title("Manage Forms")}</Title>
          <p className="text-gray-600">
            Create and manage feedback forms for your department
          </p>
        </div>
      </div>

      <Card
        title={formatText.title("Feedback Forms")}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openFormModal}
          >
            {formatText.title("Create New Form")}
          </Button>
        }
      >
        <Table
          dataSource={feedbackForms}
          rowKey="id"
          columns={[
            {
              title: formatText.title('Form Title'),
              dataIndex: 'title',
              key: 'title',
            },
            {
              title: formatText.title('Description'),
              dataIndex: 'description',
              key: 'description',
              render: (text: string) => (
                <div className="max-w-xs truncate" title={text}>
                  {text}
                </div>
              ),
            },
            {
              title: formatText.title('Target Year'),
              dataIndex: 'targetYear',
              key: 'targetYear',
              render: (year: string) => (year === 'ALL' || year === 'all') ? 'All Years' : `Year ${year}`,
            },
            {
              title: formatText.title('Target Branch'),
              dataIndex: 'targetBranch',
              key: 'targetBranch',
              render: (branch: string) => (branch === 'ALL' || branch === 'all') ? 'All Branches' : branch,
            },
            {
              title: formatText.title('Status'),
              dataIndex: 'isActive',
              key: 'isActive',
              render: (isActive: boolean) => (
                <Tag color={isActive ? 'green' : 'red'}>
                  {formatText.status(isActive ? 'active' : 'inactive')}
                </Tag>
              ),
            },
            {
              title: formatText.title('Created'),
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (date: string) => new Date(date).toLocaleDateString(),
            },
            {
              title: formatText.title('Actions'),
              key: 'actions',
              render: (_: any, record: FeedbackForm) => (
                <Space size="middle">
                  <Tooltip title={record.isActive ? "Deactivate form - Students won't be able to fill this form" : "Activate form - Students will be able to fill this form"}>
                    <Button
                      type={record.isActive ? "default" : "primary"}
                      size="small"
                      onClick={() => handleToggleFormStatus(record.id, record.isActive)}
                      style={{
                        backgroundColor: record.isActive ? '#ff4d4f' : '#52c41a',
                        borderColor: record.isActive ? '#ff4d4f' : '#52c41a',
                        color: 'white'
                      }}
                    >
                      {record.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </Tooltip>
                  <Button
                    size="small"
                    onClick={() => handleViewFormResponses(record)}
                  >
                    View Responses
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleExportFormResponses(record)}
                  >
                    Export
                  </Button>
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

      <Card title={formatText.title("Form Performance")}>
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
                        {formatText.title(`View All Responses (${formResponses.length})`)}
                      </Button>
                      <Button 
                        type="default" 
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleExportFormResponses(form)}
                        disabled={formResponses.length === 0}
                      >
                        {formatText.title("Export CSV")}
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>

      {/* Form Creation Modal */}
      <Modal
        title={formatText.title("Create Feedback Form")}
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
            label={formatText.title("Form Title")}
            rules={[{ required: true, message: 'Please enter form title' }]}
          >
            <Input placeholder="Enter form title" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label={formatText.title("Description")}
            rules={[{ required: true, message: 'Please enter form description' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter form description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="targetYear"
                label={formatText.title("Target Year")}
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
                label={formatText.title("Target Branch")}
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
              <Form.Item
                name="expiresAt"
                label={formatText.title("Expires At (Optional)")}
              >
                <Input type="datetime-local" />
              </Form.Item>
            </Col>
          </Row>

          <div className="mt-6">
            <div className="text-lg font-semibold mb-4">{formatText.title("Form Questions")}</div>
            
            {formQuestions.map((question, index) => (
              <Card
                key={question.id}
                size="small"
                className="mb-4"
                title={`${formatText.title("Question")} ${index + 1}`}
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
                  />
                  
                  <Row gutter={16}>
                    <Col span={8}>
                      <Select
                        value={question.type}
                        onChange={(value) => updateQuestion(question.id, { type: value })}
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="text">Short Text</Select.Option>
                        <Select.Option value="textarea">Long Text</Select.Option>
                        <Select.Option value="radio">Single Choice</Select.Option>
                        <Select.Option value="checkbox">Multiple Choice</Select.Option>
                        <Select.Option value="rating">Rating Scale</Select.Option>
                      </Select>
                    </Col>
                    <Col span={4}>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Required:</span>
                        <Switch
                          checked={question.required}
                          onChange={(checked) => updateQuestion(question.id, { required: checked })}
                        />
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
                      <div className="text-sm font-medium">{formatText.title("Options")}:</div>
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
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => {
                              const newOptions = question.options?.filter((_: any, idx: number) => idx !== optionIndex);
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
                        {formatText.title("Add Option")}
                      </Button>
                    </div>
                  )}

                  {(question.type === 'text' || question.type === 'textarea') && (
                    <Row gutter={16}>
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
              {formatText.title("Add Question")}
            </Button>
          </div>

          <Form.Item className="mt-6 mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {formatText.title("Create Form")}
              </Button>
              <Button onClick={() => setIsFormModalVisible(false)}>
                {formatText.title("Cancel")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
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
                    pageSize: 50,
                    showSizeChanger: true,
                    showQuickJumper: true,
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
    </div>
  );
};
