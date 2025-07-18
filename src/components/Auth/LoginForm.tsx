import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

export const LoginForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError('');
    
    try {
      await login(values.email, values.password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <div className="text-center mb-6">
            <Title level={2} className="text-blue-600 mb-2">yoUR Feedback Hub</Title>
            <Text type="secondary">Usha Rama College of Engineering and Technology</Text>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              className="mb-4"
              showIcon
            />
          )}

          <Form
            name="login"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter your email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please input your password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6">
            <Text type="secondary">
              Don't have an account? <Link to="/register" className="text-blue-600">Register as Student</Link>
            </Text>
          </div>
        </Card>

        <Card className="mt-4 shadow-lg">
          <Title level={4} className="text-center mb-4">Anonymous Feedback</Title>
          <Text type="secondary" className="block text-center mb-4">
            Submit feedback without logging in
          </Text>
          <Link to="/anonymous">
            <Button type="default" className="w-full" size="large">
              Submit Anonymous Feedback
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
};