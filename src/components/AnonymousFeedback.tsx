import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Typography, Select, Rate, message } from 'antd';
import { ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { FeedbackForm } from '../types';
import { getAnonymousFeedbackForms, submitAnonymousResponse } from '../services/firebaseService';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export const AnonymousFeedback: React.FC = () => {
  const [anonymousForms, setAnonymousForms] = useState<FeedbackForm[]>([]);
  const [selectedForm, setSelectedForm] = useState<FeedbackForm | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadAnonymousForms();
  }, []);

  const loadAnonymousForms = async () => {
    try {
      const publicForms = await getAnonymousFeedbackForms();
      setAnonymousForms(publicForms);
    } catch (error) {
      console.error('Error loading anonymous forms:', error);
    }
  };

  const submitAnonymousFeedback = async (values: any) => {
    if (!selectedForm) return;

    try {
      const responseData = {
      formId: selectedForm.id,
      responses: values,
      isAnonymous: true,
    };

      await submitAnonymousResponse(responseData);

      message.success('Thank you for your anonymous feedback!');
      form.resetFields();
      setSelectedForm(null);
    } catch (error) {
      console.error('Error submitting anonymous feedback:', error);
      message.error('Failed to submit feedback. Please try again.');
    }
  };

  if (selectedForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg">
            <div className="mb-6">
              <Button 
                type="text" 
                icon={<ArrowLeftOutlined />}
                onClick={() => setSelectedForm(null)}
                className="mb-4"
              >
                Back to Forms
              </Button>
              <Title level={3}>{selectedForm.title}</Title>
              <Paragraph type="secondary">{selectedForm.description}</Paragraph>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={submitAnonymousFeedback}
            >
              {selectedForm.questions.map((question) => (
                <Form.Item
                  key={question.id}
                  name={question.id}
                  label={question.question}
                  rules={question.required ? [{ required: true, message: 'This field is required' }] : []}
                >
                  {question.type === 'text' && <Input />}
                  {question.type === 'textarea' && <TextArea rows={4} />}
                  {question.type === 'radio' && (
                    <Select>
                      {question.options?.map(option => (
                        <Select.Option key={option} value={option}>{option}</Select.Option>
                      ))}
                    </Select>
                  )}
                  {question.type === 'rating' && <Rate />}
                </Form.Item>
              ))}

              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SendOutlined />} size="large">
                  Submit Anonymous Feedback
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg mb-6">
          <div className="text-center">
            <Title level={2} className="text-purple-600">Anonymous Feedback</Title>
            <Paragraph type="secondary" className="text-lg">
              Share your honest feedback without revealing your identity
            </Paragraph>
            <Link to="/login">
              <Button type="link" icon={<ArrowLeftOutlined />}>
                Back to Login
              </Button>
            </Link>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {anonymousForms.map((feedbackForm) => (
            <Card
              key={feedbackForm.id}
              hoverable
              className="shadow-md"
              onClick={() => setSelectedForm(feedbackForm)}
            >
              <div className="text-center">
                <Title level={4}>{feedbackForm.title}</Title>
                <Paragraph type="secondary" className="mb-4">
                  {feedbackForm.description}
                </Paragraph>
                <div className="text-sm text-gray-500 mb-4">
                  Department: {feedbackForm.department}
                </div>
                <Button type="primary" size="large">
                  Fill Form
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {anonymousForms.length === 0 && (
          <Card className="text-center">
            <Title level={4} type="secondary">No Anonymous Forms Available</Title>
            <Paragraph>
              There are currently no anonymous feedback forms available. 
              Please check back later or contact your department for more information.
            </Paragraph>
          </Card>
        )}
      </div>
    </div>
  );
};