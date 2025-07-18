import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Radio, Checkbox, Rate, message, Typography, Space, Divider } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { FeedbackForm, FormQuestion } from '../types';
import { getFeedbackFormById, submitFeedbackResponse, checkIfStudentSubmittedForm } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const FeedbackFormFill: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [feedbackForm, setFeedbackForm] = useState<FeedbackForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);

  useEffect(() => {
    if (formId && user?.id) {
      loadFeedbackForm(formId);
    }
  }, [formId, user?.id]);

  const loadFeedbackForm = async (id: string) => {
    try {
      const formData = await getFeedbackFormById(id);
      if (formData) {
        setFeedbackForm(formData);
        
        // Check if the student has already submitted this form
        if (user?.id) {
          const hasSubmitted = await checkIfStudentSubmittedForm(user.id, id);
          setAlreadySubmitted(hasSubmitted);
          
          if (hasSubmitted) {
            message.info('You have already submitted this form');
          }
        }
      } else {
        message.error('Form not found');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error loading form:', error);
      message.error('Error loading form');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!feedbackForm || !user) return;

    // Prevent re-submission
    if (alreadySubmitted) {
      message.warning('You have already submitted this form');
      return;
    }

    setSubmitting(true);
    try {
      // Format responses as key-value pairs
      const responses: { [questionId: string]: string | number | string[] } = {};
      
      feedbackForm.questions.forEach((question: FormQuestion) => {
        responses[question.id] = values[question.id] || '';
      });

      await submitFeedbackResponse({
        formId: feedbackForm.id,
        studentId: user.id,
        responses,
        isAnonymous: feedbackForm.isAnonymous || false,
      });

      message.success('Feedback submitted successfully!');
      setAlreadySubmitted(true); // Mark as submitted to prevent re-submission
      
      // Emit custom event to notify other components
      window.dispatchEvent(new CustomEvent('form-submitted', { 
        detail: { formId: feedbackForm.id, studentId: user.id } 
      }));
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Error submitting feedback:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <Text>Loading form...</Text>
        </div>
      </div>
    );
  }

  if (!feedbackForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Title level={3} className="text-red-600">Form Not Found</Title>
          <Text>The requested form could not be found.</Text>
          <br />
          <Button type="primary" onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Title level={3} className="text-green-600">Form Already Submitted</Title>
          <Text>You have already submitted this form. Thank you for your feedback!</Text>
          <br />
          <Text type="secondary">Form: {feedbackForm.title}</Text>
          <br />
          <Button type="primary" onClick={() => navigate('/dashboard')} className="mt-4">
            Back to Dashboard
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
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              Back to Dashboard
            </Button>
            
            <Title level={2} className="text-center mb-2">
              {feedbackForm.title}
            </Title>
            
            <Text className="text-gray-600 text-center block mb-4">
              {feedbackForm.description}
            </Text>
            
            <Divider />
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-6"
          >
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
                Submit Feedback
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </div>
  );
};
