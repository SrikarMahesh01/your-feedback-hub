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
        rollNumber: values.rollNumber.toUpperCase(),
        year: values.year,
        branch: values.branch,
        isActive: true,
      }, values.password);
      
      console.log('Registration successful! Redirecting to login...');
      
      // Log out the newly created user to force them to login
      // This ensures proper authentication flow
      navigate('/login', { 
        replace: true,
        state: { 
          message: 'Registration successful! Please login with your credentials.',
          email: values.email 
        }
      });
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
            <a 
              href="https://usharama.edu.in/home" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
              style={{ fontSize: '16px', fontWeight: 600, textDecoration: 'none' }}
            >
              Join yoUR Feedback Hub
            </a>
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
              rules={[
                { required: true, message: <span style={{ color: '#ff4d4f' }}>Please input your full name!</span> },
                { 
                  pattern: /^[a-zA-Z\s]+$/,
                  message: <span style={{ color: '#ff4d4f' }}>Name should only contain letters and spaces!</span>
                },
                { min: 3, message: <span style={{ color: '#ff4d4f' }}>Name must be at least 3 characters long!</span> },
                { max: 50, message: <span style={{ color: '#ff4d4f' }}>Name must not exceed 50 characters!</span> }
              ]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input prefix={<UserOutlined />} placeholder="Enter your Full Name" />
            </Form.Item>

            <Form.Item
              name="email"
              label="College Email"
              rules={[
                { required: true, message: <span style={{ color: '#ff4d4f' }}>Please input your email!</span> },
                { type: 'email', message: <span style={{ color: '#ff4d4f' }}>Please enter a valid email address!</span> },
                { 
                  pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: <span style={{ color: '#ff4d4f' }}>Invalid email format!</span>
                }
              ]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input prefix={<MailOutlined />} placeholder="your.email@usharama.in" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: <span style={{ color: '#ff4d4f' }}>Please input your password!</span> },
                { min: 6, message: <span style={{ color: '#ff4d4f' }}>Password must be at least 6 characters!</span> },
                { max: 128, message: <span style={{ color: '#ff4d4f' }}>Password must not exceed 128 characters!</span> }
              ]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm Password"
              dependencies={['password']}
              rules={[
                { required: true, message: <span style={{ color: '#ff4d4f' }}>Please confirm your password!</span> },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(<span style={{ color: '#ff4d4f' }}>Passwords do not match!</span>));
                  },
                }),
              ]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm your password" />
            </Form.Item>

            <Form.Item
              name="rollNumber"
              label="Roll Number"
              rules={[
                { required: true, message: <span style={{ color: '#ff4d4f' }}>Please input your roll number!</span> },
                { 
                  pattern: /^[A-Za-z0-9]+$/,
                  message: <span style={{ color: '#ff4d4f' }}>Roll number should only contain letters and numbers!</span>
                },
                { min: 4, message: <span style={{ color: '#ff4d4f' }}>Roll number must be at least 4 characters!</span> },
                { max: 20, message: <span style={{ color: '#ff4d4f' }}>Roll number must not exceed 20 characters!</span> }
              ]}
              validateTrigger={['onChange', 'onBlur']}
              normalize={(value) => value ? value.toUpperCase() : value}
            >
              <Input 
                prefix={<IdcardOutlined />} 
                placeholder="Enter your Roll Number"
                style={{ textTransform: 'uppercase' }}
              />
            </Form.Item>

            <Form.Item
              name="year"
              label="Year"
              rules={[{ required: true, message: <span style={{ color: '#ff4d4f' }}>Please select your year!</span> }]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Select placeholder="Select your Year">
                {YEARS.map(year => (
                  <Option key={year} value={year}>{year}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="branch"
              label="Branch"
              rules={[{ required: true, message: <span style={{ color: '#ff4d4f' }}>Please select your branch!</span> }]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Select placeholder="Select your Branch">
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