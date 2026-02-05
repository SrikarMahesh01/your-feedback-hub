import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Row, 
  Col, 
  message, 
  Tag,
  Tooltip
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  IdcardOutlined,
  HomeOutlined,
  CalendarOutlined,
  BankOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/dateFormatter';
import { changePassword, updateUserProfile } from '../../services/firebaseService';
import { User } from '../../types';
import { formatText } from '../../utils/textFormatter';

const { Title, Text } = Typography;

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Add keyboard shortcut for back navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleBackToDashboard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [user?.role]);

  const handleProfileUpdate = async (values: any) => {
    if (!user) return;

    setLoading(true);
    try {
      const updates: Partial<User> = {
        name: values.name,
      };

      // Only update fields that are relevant to the user's role
      if (user.role === 'student') {
        updates.rollNumber = values.rollNumber ? values.rollNumber.toUpperCase() : values.rollNumber;
        updates.year = values.year;
        updates.branch = values.branch;
      } else if (user.role === 'admin') {
        updates.department = values.department;
      }

      const result = await updateUserProfile(user.id, updates);
      
      if (result.success) {
        message.success('Profile updated successfully!');
        // You might want to refresh the user data here
      } else {
        message.error(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    setPasswordLoading(true);
    try {
      const result = await changePassword(values.currentPassword, values.newPassword);
      
      if (result.success) {
        message.success('Password changed successfully!');
        passwordForm.resetFields();
      } else {
        message.error(result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      message.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleDisplay = (role: User['role']) => {
    return formatText.role(role);
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'student':
        return 'blue';
      case 'admin':
        return 'orange';
      case 'super_admin':
        return 'red';
      default:
        return 'default';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Text>Please log in to view your profile.</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Tooltip title="Go back to dashboard (Press Esc)" placement="bottom">
            <Button
              type="default"
              icon={<ArrowLeftOutlined />}
              onClick={handleBackToDashboard}
              size="large"
              className="flex items-center gap-2 hover:bg-blue-50 border-blue-200"
            >
              {formatText.title('Back to Dashboard')}
            </Button>
          </Tooltip>
          <Title level={2} className="mb-0">
            <UserOutlined style={{ marginRight: 8 }} />
            My Profile
          </Title>
        </div>
        <Tag color={getRoleColor(user.role)} style={{ fontSize: '14px', padding: '4px 12px' }}>
          {getRoleDisplay(user.role)}
        </Tag>
      </div>

      <Row gutter={[24, 24]}>
        {/* Profile Information Card */}
        <Col xs={24} lg={12}>
          <Card title="Profile Information" bordered={false}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleProfileUpdate}
              initialValues={{
                name: user.name,
                email: user.email,
                rollNumber: user.rollNumber,
                year: user.year,
                branch: user.branch,
                department: Array.isArray(user.department) ? user.department.join(', ') : user.department,
              }}
            >
              <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter your full name' }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Enter your full name" />
              </Form.Item>

              <Form.Item
                name="email"
                label="Email Address"
              >
                <Input prefix={<MailOutlined />} disabled value={user.email} />
              </Form.Item>

              {user.role === 'student' && (
                <>
                  <Form.Item
                    name="rollNumber"
                    label="Roll Number"
                    rules={[{ required: true, message: 'Please enter your roll number' }]}
                    normalize={(value) => value ? value.toUpperCase() : value}
                  >
                    <Input 
                      prefix={<IdcardOutlined />} 
                      placeholder="Enter your roll number (e.g., 22NG1A0569)"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </Form.Item>

                  <Form.Item
                    name="year"
                    label="Year"
                    rules={[{ required: true, message: 'Please enter your year' }]}
                  >
                    <Input prefix={<CalendarOutlined />} placeholder="Enter your year" />
                  </Form.Item>

                  <Form.Item
                    name="branch"
                    label="Branch"
                    rules={[{ required: true, message: 'Please enter your branch' }]}
                  >
                    <Input prefix={<HomeOutlined />} placeholder="Enter your branch" />
                  </Form.Item>
                </>
              )}

              {user.role === 'admin' && (
                <Form.Item
                  name="department"
                  label="Department(s)"
                >
                  <Input prefix={<BankOutlined />} disabled placeholder="Department(s)" />
                </Form.Item>
              )}

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Update Profile
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Change Password Card */}
        <Col xs={24} lg={12}>
          <Card title="Change Password" bordered={false}>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                For security reasons, please use a strong password with at least 6 characters.
              </Text>
            </div>

            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Please enter your current password' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter a new password' },
                  { min: 6, message: 'Password must be at least 6 characters long' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your new password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={passwordLoading} block>
                  Change Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      {/* Account Information */}
      <Card title="Account Information" bordered={false}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text strong>Account Status:</Text>
              <br />
              <Tag color={user.isActive !== false ? 'green' : 'red'}>
                {user.isActive !== false ? 'Active' : 'Inactive'}
              </Tag>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text strong>Account Created:</Text>
              <br />
              <Text type="secondary">
                {formatDate(user.createdAt)}
              </Text>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text strong>User ID:</Text>
              <br />
              <Text type="secondary" copyable>
                {user.id}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};
