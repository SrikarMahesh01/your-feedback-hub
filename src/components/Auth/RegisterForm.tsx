import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { createUserWithId } from '../../services/firebaseService';
import { DEPARTMENTS, YEARS } from '../../types';
import { formatText } from '../../utils/textFormatter';

const { Title, Text } = Typography;
const { Option } = Select;

export const RegisterForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Registration attempt with values:', {
        email: values.email,
        name: values.name,
        rollNumber: values.rollNumber,
        year: values.year,
        branch: values.branch
      });
      
      await register({
        email: values.email,
        name: values.name,
        role: 'student',
        rollNumber: values.rollNumber,
        year: values.year,
        branch: values.branch,
        isActive: true,
      }, values.password);
      
      console.log('Registration successful!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Handle specific Firebase error codes
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-lg">
          <div className="text-center mb-6">
            <Title level={2} className="text-blue-600 mb-2">{formatText.title('student registration')}</Title>
            <Text type="secondary">Join yoUR Feedback Hub</Text>
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
            name="register"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please input your full name!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="College Email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="your.email@urcet.edu" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please input your password!' },
                { min: 6, message: 'Password must be at least 6 characters!' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm your password" />
            </Form.Item>

            <Form.Item
              name="rollNumber"
              label="Roll Number"
              rules={[{ required: true, message: 'Please input your roll number!' }]}
            >
              <Input prefix={<IdcardOutlined />} placeholder="Enter your roll number" />
            </Form.Item>

            <Form.Item
              name="year"
              label="Year"
              rules={[{ required: true, message: 'Please select your year!' }]}
            >
              <Select placeholder="Select your year">
                {YEARS.map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="branch"
              label="Branch"
              rules={[{ required: true, message: 'Please select your branch!' }]}
            >
              <Select placeholder="Select your branch">
                {DEPARTMENTS.map(dept => (
                  <Option key={dept} value={dept}>{dept}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
                Register
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6">
            <Text type="secondary">
              Already have an account? <Link to="/login" className="text-blue-600">Sign In</Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};