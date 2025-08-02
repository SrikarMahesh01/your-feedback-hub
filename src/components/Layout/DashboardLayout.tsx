import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FileTextOutlined,
  FormOutlined,
  SettingOutlined,
  TeamOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';
import { formatText } from '../../utils/textFormatter';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      // Navigate to clean login page without redirect parameter
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getMenuItems = (userRole: User['role']) => {
    const baseItems = [
      {
        key: 'dashboard',
        icon: <DashboardOutlined />,
        label: formatText.title('Dashboard'),
      },
    ];

    if (userRole === 'student') {
      return [
        ...baseItems,
        {
          key: 'grievances',
          icon: <FileTextOutlined />,
          label: formatText.title('My Grievances'),
        },
        {
          key: 'feedback',
          icon: <FormOutlined />,
          label: formatText.title('Feedback Forms'),
        },
        {
          key: 'history',
          icon: <HistoryOutlined />,
          label: formatText.title('Submission History'),
        },
      ];
    }

    if (userRole === 'admin') {
      return [
        ...baseItems,
        {
          key: 'grievances',
          icon: <FileTextOutlined />,
          label: formatText.title('Department Grievances'),
        },
        {
          key: 'feedbackforms',
          icon: <FormOutlined />,
          label: formatText.title('Feedback Forms'),
        },
        {
          key: 'anonymous-forms',
          icon: <FormOutlined />,
          label: formatText.title('Anonymous Forms'),
        },
        {
          key: 'students',
          icon: <TeamOutlined />,
          label: formatText.title('Students'),
        },
        {
          key: 'analytics',
          icon: <SettingOutlined />,
          label: formatText.title('Analytics'),
        },
      ];
    }

    if (userRole === 'super_admin') {
      return [
        ...baseItems,
        {
          key: 'grievances',
          icon: <FileTextOutlined />,
          label: 'All Grievances',
        },
        {
          key: 'admins',
          icon: <TeamOutlined />,
          label: 'Manage Admins',
        },
        {
          key: 'students',
          icon: <UserOutlined />,
          label: 'All Students',
        },
        {
          key: 'forms',
          icon: <FormOutlined />,
          label: 'All Forms',
        },
        {
          key: 'analytics',
          icon: <SettingOutlined />,
          label: 'System Analytics',
        },
      ];
    }

    return baseItems;
  };

  // Get current selected key based on location
  const getCurrentSelectedKey = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/admin/dashboard') return 'dashboard';
    if (path === '/super-admin/dashboard') return 'dashboard';
    if (path === '/feedbackforms') return 'feedbackforms';
    if (path === '/admin/anonymous-forms') return 'anonymous-forms';
    if (path === '/students') return 'students';
    if (path === '/analytics') return 'analytics';
    if (path === '/grievances') return 'grievances';
    if (path === '/profile') return 'profile';
    // Student routes
    if (path === '/student/dashboard') return 'dashboard';
    if (path === '/student/feedback') return 'feedback';
    if (path === '/student/history') return 'history';
    if (path === '/student/grievances') return 'grievances';
    return 'dashboard';
  };

  const handleMenuClick = (key: string) => {
    if (key === 'profile') {
      navigate('/profile');
    } else if (key === 'logout') {
      handleLogout();
    }
  };

  const handleMenuSelect = (key: string) => {
    switch (key) {
      case 'dashboard':
        if (user?.role === 'student') {
          navigate('/student/dashboard');
        } else if (user?.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user?.role === 'super_admin') {
          navigate('/super-admin/dashboard');
        } else {
          navigate('/dashboard');
        }
        break;
      case 'feedbackforms':
        navigate('/feedbackforms');
        break;
      case 'anonymous-forms':
        navigate('/admin/anonymous-forms');
        break;
      case 'students':
        navigate('/students');
        break;
      case 'analytics':
        navigate('/analytics');
        break;
      case 'grievances':
        if (user?.role === 'student') {
          navigate('/student/grievances');
        } else {
          navigate('/grievances');
        }
        break;
      case 'feedback':
        if (user?.role === 'student') {
          navigate('/student/feedback');
        }
        break;
      case 'history':
        if (user?.role === 'student') {
          navigate('/student/history');
        }
        break;
      default:
        if (user?.role === 'super_admin') {
          const event = new CustomEvent('sidebar-navigation', {
            detail: { key }
          });
          window.dispatchEvent(event);
        }
        break;
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => handleMenuClick('profile'),
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const getRoleDisplay = (role: User['role']) => {
    switch (role) {
      case 'student':
        return 'Student';
      case 'admin':
        return 'HOD';
      case 'super_admin':
        return 'Super Admin';
      default:
        return 'User';
    }
  };

  return (
    <Layout className="min-h-screen">
      <Sider trigger={null} collapsible collapsed={collapsed} theme="light">
        <div className="p-4 text-center border-b">
          {!collapsed ? (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Title level={4} className="m-0 text-blue-600">
                  yoUR Feedback Hub
                </Title>
              </div>
              <Button
                type="text"
                icon={<MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="text-lg ml-2"
                size="small"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Title level={5} className="m-0 text-blue-600 mb-2 text-xs">
                UR
              </Title>
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                className="text-lg"
                size="small"
              />
            </div>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[getCurrentSelectedKey()]}
          items={getMenuItems(user?.role || 'student')}
          className="border-r-0"
          onSelect={({ key }) => {
            handleMenuSelect(key);
          }}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-6 border-b flex items-center justify-between">
          <div className="flex items-center">
            <Title level={3} className="m-0 text-gray-800">
              {user?.role === 'student' ? 'Student Dashboard' : 
               user?.role === 'admin' ? 'HOD Dashboard' : 
               'Super Admin Dashboard'}
            </Title>
          </div>
          <div className="flex items-center gap-4">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-2 rounded">
                <Avatar icon={<UserOutlined />} />
                <div className="text-sm">
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-gray-500">{getRoleDisplay(user?.role || 'student')}</div>
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content className="m-6 p-6 bg-white rounded-lg">
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};