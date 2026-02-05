import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, FormOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const { Title, Text } = Typography;

export const LoginForm: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginAttemptRef = useRef(false);
  
  // Check for registration success message
  useEffect(() => {
    const state = location.state as any;
    if (state?.message) {
      setSuccessMessage(state.message);
      // Pre-fill email if provided
      if (state?.email) {
        form.setFieldsValue({ email: state.email });
      }
      // Clear the state to prevent showing message on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, form, navigate]);
  
  // Prevent unwanted redirects when there's an error
  useEffect(() => {
    console.log('LoginForm: user state changed', user);
    console.log('LoginForm: location', location.pathname);
    console.log('LoginForm: is login attempt', isLoginAttemptRef.current);
    
    // If we're not in the middle of a login attempt and location changes, something redirected us
    if (!isLoginAttemptRef.current && location.pathname !== '/login') {
      console.warn('Unexpected navigation detected!');
    }
  }, [user, location]);
  
  // Clear error when user starts typing
  useEffect(() => {
    const handleFormChange = () => {
      if (error) {
        console.log('Form changed, clearing error');
        setError('');
      }
    };
    return () => {};
  }, [error]);

  const onFinish = async (values: { email: string; password: string }) => {
    console.log('onFinish called with:', values.email);
    
    // Mark that we're in a login attempt
    isLoginAttemptRef.current = true;
    
    // Prevent any default form submission behavior
    setLoading(true);
    setError('');
    
    try {
      console.log('Attempting login...');
      const userData = await login(values.email, values.password);
      console.log('Login successful, user data:', userData);
      
      // Only navigate if login was successful
      if (userData.role === 'student') {
        console.log('Navigating to student dashboard');
        navigate('/student/dashboard', { replace: true });
      } else {
        console.log('Navigating to admin dashboard');
        navigate('/dashboard', { replace: true });
      }
    } catch (err: any) {
      console.error('=== Login Error Caught ===');
      console.error('Login error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      console.error('========================');
      
      // Set error message immediately
      let errorMessage = 'Invalid credentials. Please try again.';
      
      // Provide specific error messages based on error type
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errorMessage = '❌ Incorrect password. Please try again.';
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = '❌ No account found with this email address.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = '❌ Invalid email format.';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = '❌ Too many failed attempts. Please try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMessage = '❌ Network error. Please check your connection.';
      } else if (err.message && err.message.includes('User profile not found')) {
        errorMessage = '❌ Account not found in system. Please contact administrator.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      console.log('Setting error message to:', errorMessage);
      setError(errorMessage);
      
      // Force a small delay to ensure state is set before marking login attempt complete
      await new Promise(resolve => setTimeout(resolve, 100));
      console.log('Error state should now be:', errorMessage);
      
      // CRITICAL: Mark login attempt as complete BEFORE finally block
      isLoginAttemptRef.current = false;
      
      // Don't navigate or reload on error - stop execution here
    } finally {
      console.log('Finally block - setting loading to false');
      setLoading(false);
      // Reset login attempt flag
      isLoginAttemptRef.current = false;
    }
  };
  
  const onFinishFailed = (errorInfo: any) => {
    console.log('Form validation failed:', errorInfo);
    // Don't clear the error state on validation failure
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto">
        <Card className="shadow-lg">
          <div className="text-center mb-6">
            <Title level={2} className="text-blue-600 mb-2">yoUR Feedback Hub</Title>
            <a 
              href="https://usharama.edu.in/home" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-red-600 hover:text-blue-800 transition-colors duration-200"
              style={{ fontSize: '18px', fontWeight: 600, textDecoration: 'none' }}
            >
              Usha Rama College of Engineering and Technology
            </a>
          </div>

          {successMessage && successMessage.length > 0 && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>{successMessage}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && error.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Login Failed</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            layout="vertical"
            size="large"
            preserve={true}
          >
            <Form.Item
              name="email"
              label="Email"
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
              <Input prefix={<UserOutlined />} placeholder="Enter your email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: <span style={{ color: '#ff4d4f' }}>Please input your password!</span> },
                { min: 6, message: <span style={{ color: '#ff4d4f' }}>Password must be at least 6 characters!</span> }
              ]}
              validateTrigger={['onChange', 'onBlur']}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Enter your password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" className="w-full" loading={loading}>
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider>Or</Divider>

          <Button
            type="default"
            icon={<FormOutlined />}
            className="w-full mb-4"
            onClick={() => navigate('/anonymous-forms')}
            size="large"
          >
            Fill Anonymous Forms
          </Button>

          <div className="text-center">
            <Text type="secondary">
              Don't have an account? <Link to="/register" className="text-blue-600">Register as Student</Link>
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};