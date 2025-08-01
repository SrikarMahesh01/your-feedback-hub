import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Radio, Checkbox, Rate, message, Typography, Space, Divider, Select } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { FeedbackForm, FormQuestion, YEARS } from '../types';
import { getAnonymousFormById, submitAnonymousResponse } from '../services/firebaseService';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const AnonymousFormFill: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (formId) {
      loadFeedbackForm(formId);
    }
  }, [formId]);

  const loadFeedbackForm = async (id: string) => {
    try {
      const formData = await getAnonymousFormById(id);
      if (formData) {
        setFeedbackForm(formData);
      } else {
        message.error('Form not found or is no longer available');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      message.error('Error loading form');
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!feedbackForm) return;

    setSubmitting(true);
    try {
      // Format responses as key-value pairs
      const responses: { [questionId: string]: string | number | string[] } = {};
      
      feedbackForm.questions.forEach((question: FormQuestion) => {
        responses[question.id] = values[question.id] || '';
      });

      await submitAnonymousResponse({
        formId: feedbackForm.id,
        studentYear: values.studentYear,
        responses,
      });

      message.success('Anonymous feedback submitted successfully!');
      navigate('/login');
    } catch (error) {
      console.error('Error submitting anonymous feedback:', error);
      message.error('Error submitting feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestionInput = (question: FormQuestion) => {
    switch (question.type) {
      case 'text':
        return (
          <Input
            placeholder={question.placeholder || 'Enter your answer'}
            maxLength={question.maxLength}
            showCount={!!question.maxLength}
          />
        );
      
      case 'textarea':
        return (
          <TextArea
            rows={4}
            placeholder={question.placeholder || 'Enter your detailed answer'}
            maxLength={question.maxLength}
            showCount={!!question.maxLength}
          />
        );
      
      case 'radio':
        return (
          <Radio.Group>
            <Space direction="vertical">
              {question.options?.map((option, index) => (
                <Radio key={index} value={option}>
                  {option}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );
      
      case 'checkbox':
        return (
          <Checkbox.Group>
            <Space direction="vertical">
              {question.options?.map((option, index) => (
                <Checkbox key={index} value={option}>
                  {option}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );
      
      case 'rating':
        return (
          <Rate allowHalf />
        );
      
      default:
        return <Input />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text>Loading form...</Text>
        </div>
      </div>
    );
  }

  if (!feedbackForm) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Title level={3} className="text-red-600">Form Not Found</Title>
          <Text>The requested form could not be found.</Text>
          <br />
          <Button type="primary" onClick={() => navigate('/login')} className="mt-4">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="shadow-lg">
          <div className="mb-6">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/login')}
              className="mb-4"
            >
              Back to Login
            </Button>
            
            <Title level={2} className="text-center mb-2">
              {feedbackForm.title}
            </Title>
            
            <Text className="text-gray-600 text-center block mb-2">
              {feedbackForm.description}
            </Text>
            
            <div className="text-center mb-4">
              <Text type="warning" strong>
                🔒 Anonymous Form - Your identity will remain confidential
              </Text>
            </div>
            
            <Divider />
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-6"
          >
            {/* Student Year Selection */}
            <Card className="bg-blue-50 border-blue-200">
              <Form.Item
                name="studentYear"
                label={
                  <Text strong>
                    Your Academic Year <Text className="text-red-500">*</Text>
                  </Text>
                }
                rules={[
                  {
                    required: true,
                    message: 'Please select your academic year',
                  },
                ]}
              >
                <Select placeholder="Select your academic year" size="large">
                  {YEARS.map((year) => (
                    <Option key={year} value={year}>
                      Year {year}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Card>

            {/* Form Questions */}
            {feedbackForm.questions.map((question, index) => (
              <Card key={question.id} className="bg-gray-50">
                <Form.Item
                  name={question.id}
                  label={
                    <div className="flex items-center">
                      <Text strong className="mr-2">
                        {index + 1}. {question.question}
                      </Text>
                      {question.required && (
                        <Text className="text-red-500">*</Text>
                      )}
                    </div>
                  }
                  rules={[
                    {
                      required: question.required,
                      message: `Please answer: ${question.question}`,
                    },
                    ...(question.minLength
                      ? [{
                          min: question.minLength,
                          message: `Answer must be at least ${question.minLength} characters`,
                        }]
                      : []),
                  ]}
                >
                  {renderQuestionInput(question)}
                </Form.Item>
              </Card>
            ))}

            <div className="text-center pt-6">
              <Button
                type="primary"
                htmlType="submit"
                loading={submitting}
                size="large"
                icon={<SendOutlined />}
                className="px-8"
              >
                Submit Anonymous Feedback
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};
