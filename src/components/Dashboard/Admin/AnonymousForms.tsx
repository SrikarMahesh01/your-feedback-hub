import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Row, Col, Button, Modal, Form, Input, Select, Space, Switch, InputNumber, Tooltip, message, Dropdown } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, LinkOutlined, DownloadOutlined, MoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAuth } from '../../../contexts/AuthContext';
import { FeedbackForm, DEPARTMENTS } from '../../../types';
import { formatText } from '../../../utils/textFormatter';
import { formatDate } from '../../../utils/dateFormatter';
import { 
  getAnonymousForms,
  getAnonymousResponsesByCreator,
  createAnonymousForm,
  updateAnonymousFormStatus,
  deleteAnonymousForm,
  exportAnonymousResponsesToCSV
} from '../../../services/firebaseService';

const { Title } = Typography;

export const AnonymousForms: React.FC = () => {
  const { user } = useAuth();
  const [anonymousForms, setAnonymousForms] = useState<FeedbackForm[]>([]);
  const [anonymousResponses, setAnonymousResponses] = useState<any[]>([]);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isResponsesModalVisible, setIsResponsesModalVisible] = useState(false);
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

  useEffect(() => {
    loadAnonymousForms();
    loadAnonymousResponses();
  }, []);

  const loadAnonymousForms = async () => {
    try {
      const forms = await getAnonymousForms();
      setAnonymousForms(forms);
    } catch (error) {
      console.error('Error loading anonymous forms:', error);
      message.error('Error loading anonymous forms');
    }
  };

  const loadAnonymousResponses = async () => {
    if (!user?.id) return;
    
    try {
      const responses = await getAnonymousResponsesByCreator(user.id);
      setAnonymousResponses(responses);
    } catch (error) {
      console.error('Error loading anonymous responses:', error);
      message.error('Error loading anonymous responses');
    }
  };

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

  const removeQuestion = (index: number) => {
    if (formQuestions.length > 1) {
      const updatedQuestions = formQuestions.filter((_, i) => i !== index);
      setFormQuestions(updatedQuestions);
    }
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...formQuestions];
    updatedQuestions[index][field] = value;
    
    // Reset options if type changes to non-option type
    if (field === 'type' && !['radio', 'checkbox'].includes(value)) {
      updatedQuestions[index].options = [];
    }
    
    setFormQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...formQuestions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    updatedQuestions[questionIndex].options.push('New Option');
    setFormQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...formQuestions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setFormQuestions(updatedQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...formQuestions];
    updatedQuestions[questionIndex].options.splice(optionIndex, 1);
    setFormQuestions(updatedQuestions);
  };

  const handleCreateForm = async (values: any) => {
    if (!user?.id) return;

    // Validate that all questions have proper content
    const validQuestions = formQuestions.filter(q => q.question.trim() !== '');
    if (validQuestions.length === 0) {
      message.error('Please add at least one question');
      return;
    }

    // Validate questions with options
    for (const question of validQuestions) {
      if (['radio', 'checkbox'].includes(question.type)) {
        if (!question.options || question.options.length === 0) {
          message.error(`Question "${question.question}" requires at least one option`);
          return;
        }
      }
    }

    const formData = {
      title: values.title,
      description: values.description,
      questions: validQuestions,
      targetYear: values.targetYear,
      targetBranch: values.targetBranch,
      department: Array.isArray(user.department) ? user.department[0] : (user.department || 'CSE'),
      createdBy: user.id,
      isActive: true,
      expiresAt: values.expiresAt || null,
    };

    console.log('Creating anonymous form with data:', formData);

    try {
      const formId = await createAnonymousForm(formData);
      console.log('Anonymous form created successfully with ID:', formId);
      message.success('Anonymous form created successfully!');
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
      await loadAnonymousForms();
    } catch (error) {
      console.error('Error creating anonymous form:', error);
      message.error('Error creating anonymous form');
    }
  };

  const handleToggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await updateAnonymousFormStatus(formId, newStatus);
      
      message.success(`Anonymous form ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      await loadAnonymousForms();
    } catch (error) {
      console.error('Error toggling anonymous form status:', error);
      message.error('Failed to update anonymous form status');
    }
  };

  const handleDeleteForm = async (formId: string, formTitle: string) => {
    Modal.confirm({
      title: 'Delete Anonymous Form',
      content: `Are you sure you want to delete "${formTitle}"? This will also delete all anonymous responses associated with this form. This action cannot be undone.`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteAnonymousForm(formId);
          message.success('Anonymous form and all associated responses deleted successfully!');
          await loadAnonymousForms();
          await loadAnonymousResponses();
        } catch (error) {
          console.error('Error deleting anonymous form:', error);
          message.error('Failed to delete anonymous form');
        }
      },
    });
  };

  const handleViewFormResponses = (form: FeedbackForm) => {
    const formResponses = anonymousResponses.filter(r => r.formId === form.id);
    setSelectedForm(form);
    setSelectedFormResponses(formResponses);
    setIsResponsesModalVisible(true);
  };

  const handleExportResponses = async (formId: string, formTitle: string) => {
    try {
      await exportAnonymousResponsesToCSV(formId, formTitle);
      message.success('Responses exported successfully!');
    } catch (error) {
      console.error('Error exporting responses:', error);
      message.error('Failed to export responses');
    }
  };

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/anonymous-forms/${formId}`;
    navigator.clipboard.writeText(link);
    message.success('Anonymous form link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={3}>Anonymous Forms</Title>
          <p className="text-gray-600">Create and manage anonymous feedback forms that can be filled without login</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsFormModalVisible(true)}
        >
          Create Anonymous Form
        </Button>
      </div>

      <Card title={formatText.title("Anonymous Forms")}>
        <Table
          dataSource={anonymousForms}
          rowKey="id"
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: formatText.title('Form Title'),
              dataIndex: 'title',
              key: 'title',
              width: 200,
              ellipsis: true,
            },
            {
              title: formatText.title('Description'),
              dataIndex: 'description',
              key: 'description',
              width: 250,
              ellipsis: true,
              render: (text: string) => (
                <Tooltip title={text}>
                  <div className="truncate">
                    {text}
                  </div>
                </Tooltip>
              ),
            },
            {
              title: formatText.title('Target Year'),
              dataIndex: 'targetYear',
              key: 'targetYear',
              width: 120,
              render: (year: string) => year === 'ALL' ? 'All Years' : `Year ${year}`,
            },
            {
              title: formatText.title('Target Branch'),
              dataIndex: 'targetBranch',
              key: 'targetBranch',
              width: 100,
            },
            {
              title: formatText.title('Status'),
              dataIndex: 'isActive',
              key: 'isActive',
              width: 100,
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
              width: 120,
              render: (date: string) => formatDate(date),
            },
            {
              title: formatText.title('Actions'),
              key: 'actions',
              width: 280,
              fixed: 'right' as const,
              render: (_: any, record: FeedbackForm) => {
                const items: MenuProps['items'] = [
                  {
                    key: 'toggle',
                    label: record.isActive ? 'Deactivate' : 'Activate',
                    onClick: () => handleToggleFormStatus(record.id, record.isActive),
                  },
                  {
                    key: 'responses',
                    icon: <EyeOutlined />,
                    label: 'View Responses',
                    onClick: () => handleViewFormResponses(record),
                  },
                  {
                    key: 'export',
                    icon: <DownloadOutlined />,
                    label: 'Export CSV',
                    onClick: () => handleExportResponses(record.id, record.title),
                  },
                  {
                    key: 'link',
                    icon: <LinkOutlined />,
                    label: 'Copy Link',
                    onClick: () => copyFormLink(record.id),
                  },
                  {
                    type: 'divider',
                  },
                  {
                    key: 'delete',
                    icon: <DeleteOutlined />,
                    label: 'Delete',
                    danger: true,
                    onClick: () => handleDeleteForm(record.id, record.title),
                  },
                ];

                return (
                  <Space size="small">
                    <Button
                      type={record.isActive ? "default" : "primary"}
                      size="small"
                      onClick={() => handleToggleFormStatus(record.id, record.isActive)}
                      danger={record.isActive}
                    >
                      {record.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewFormResponses(record)}
                    >
                      View Responses
                    </Button>
                    <Dropdown menu={{ items }} trigger={['click']}>
                      <Button size="small" icon={<MoreOutlined />} />
                    </Dropdown>
                  </Space>
                );
              },
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

      {/* Create Form Modal */}
      <Modal
        title="Create New Anonymous Form"
        visible={isFormModalVisible}
        onCancel={() => {
          setIsFormModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          onFinish={handleCreateForm}
          layout="vertical"
          className="space-y-4"
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
            label="Form Description"
            rules={[{ required: true, message: 'Please enter form description' }]}
          >
            <Input.TextArea rows={3} placeholder="Enter form description" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="targetYear"
                label="Target Year"
                rules={[{ required: true, message: 'Please select target year' }]}
              >
                <Select placeholder="Select target year">
                  <Select.Option value="ALL">All Years</Select.Option>
                  <Select.Option value="1">Year 1</Select.Option>
                  <Select.Option value="2">Year 2</Select.Option>
                  <Select.Option value="3">Year 3</Select.Option>
                  <Select.Option value="4">Year 4</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="targetBranch"
                label="Target Branch"
                rules={[{ required: true, message: 'Please select target branch' }]}
              >
                <Select placeholder="Select target branch">
                  <Select.Option value="ALL">All Branches</Select.Option>
                  {DEPARTMENTS.map(dept => (
                    <Select.Option key={dept} value={dept}>{dept}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {/* Dynamic Question Builder */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-medium">Form Questions</h4>
              <Button type="dashed" onClick={addQuestion} icon={<PlusOutlined />}>
                Add Question
              </Button>
            </div>

            {formQuestions.map((question, index) => (
              <Card key={question.id} className="border-gray-200">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Question {index + 1}</span>
                    {formQuestions.length > 1 && (
                      <Button 
                        type="text" 
                        danger 
                        onClick={() => removeQuestion(index)}
                        size="small"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Input
                    placeholder="Enter question"
                    value={question.question}
                    onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                  />

                  <Row gutter={16}>
                    <Col span={8}>
                      <Select
                        value={question.type}
                        onChange={(value) => updateQuestion(index, 'type', value)}
                        style={{ width: '100%' }}
                      >
                        <Select.Option value="text">Text Input</Select.Option>
                        <Select.Option value="textarea">Text Area</Select.Option>
                        <Select.Option value="radio">Radio Buttons</Select.Option>
                        <Select.Option value="checkbox">Checkboxes</Select.Option>
                        <Select.Option value="rating">Rating</Select.Option>
                      </Select>
                    </Col>
                    <Col span={8}>
                      <Switch
                        checked={question.required}
                        onChange={(checked) => updateQuestion(index, 'required', checked)}
                        checkedChildren="Required"
                        unCheckedChildren="Optional"
                      />
                    </Col>
                  </Row>

                  {['radio', 'checkbox'].includes(question.type) && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Options:</span>
                        <Button size="small" onClick={() => addOption(index)}>Add Option</Button>
                      </div>
                      {question.options?.map((option: string, optionIndex: number) => (
                        <div key={optionIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <Button 
                            type="text" 
                            danger 
                            onClick={() => removeOption(index, optionIndex)}
                            size="small"
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {['text', 'textarea'].includes(question.type) && (
                    <Row gutter={16}>
                      <Col span={12}>
                        <Input
                          placeholder="Placeholder text"
                          value={question.placeholder}
                          onChange={(e) => updateQuestion(index, 'placeholder', e.target.value)}
                        />
                      </Col>
                      <Col span={6}>
                        <InputNumber
                          placeholder="Max length"
                          value={question.maxLength}
                          onChange={(value) => updateQuestion(index, 'maxLength', value)}
                          style={{ width: '100%' }}
                        />
                      </Col>
                      <Col span={6}>
                        <InputNumber
                          placeholder="Min length"
                          value={question.minLength}
                          onChange={(value) => updateQuestion(index, 'minLength', value)}
                          style={{ width: '100%' }}
                        />
                      </Col>
                    </Row>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button onClick={() => setIsFormModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit">Create Anonymous Form</Button>
          </div>
        </Form>
      </Modal>

      {/* View Responses Modal */}
      <Modal
        title={`Anonymous Responses - ${selectedForm?.title}`}
        visible={isResponsesModalVisible}
        onCancel={() => setIsResponsesModalVisible(false)}
        footer={null}
        width={1000}
      >
        {selectedFormResponses.length === 0 ? (
          <div className="text-center py-8">
            <p>No anonymous responses yet for this form.</p>
          </div>
        ) : (
          <Table
            dataSource={selectedFormResponses}
            rowKey="id"
            columns={[
              {
                title: 'Student',
                key: 'student',
                render: () => <Tag color="orange">Anonymous</Tag>
              },
              {
                title: 'Year',
                dataIndex: 'studentYear',
                key: 'studentYear',
                render: (year: string) => <Tag color="blue">Year {year}</Tag>
              },
              {
                title: 'Submitted At',
                dataIndex: 'submittedAt',
                key: 'submittedAt',
                render: (date: string) => new Date(date).toLocaleDateString(),
              },
              ...selectedForm?.questions?.map((question: any) => ({
                title: question.question,
                key: question.id,
                render: (record: any) => {
                  const answer = record.responses?.[question.id];
                  if (Array.isArray(answer)) {
                    return answer.join(', ');
                  }
                  return answer || 'No response';
                },
              })) || []
            ]}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        )}
      </Modal>
    </div>
  );
};
