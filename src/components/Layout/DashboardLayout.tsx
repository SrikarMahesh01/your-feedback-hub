import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Typography, Badge } from 'antd';
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
  MessageOutlined,
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
          icon: <MessageOutlined />,
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
          key: 'forms',
          icon: <FormOutlined />,
          label: formatText.title('Manage Forms'),
        },
        {
          key: 'responses',
          icon: <MessageOutlined />,
          label: formatText.title('Form Responses'),
        },
        {
          key: 'students',
          icon: <TeamOutlined />,
          label: 'Students',
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

  const handleMenuClick = (key: string) => {
    if (key === 'profile') {
      // Emit custom event for all user types to handle profile navigation
      const event = new CustomEvent('user-navigation', {
        detail: { key }
      });
      window.dispatchEvent(event);
    } else if (key === 'logout') {
      logout();
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
      onClick: logout,
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
              <Title level={4} className="m-0 text-blue-600 mb-2">
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
          defaultSelectedKeys={['dashboard']}
          items={getMenuItems(user?.role || 'student')}
          className="border-r-0"
          onSelect={({ key }) => {
            // Emit custom event for dashboard navigation
            if (user?.role === 'super_admin') {
              const event = new CustomEvent('sidebar-navigation', {
                detail: { key }
              });
              window.dispatchEvent(event);
            } else if (user?.role === 'admin') {
              const event = new CustomEvent('admin-navigation', {
                detail: { key }
              });
              window.dispatchEvent(event);
            } else if (user?.role === 'student') {
              const event = new CustomEvent('student-navigation', {
                detail: { key }
              });
              window.dispatchEvent(event);
            }
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
            <Badge count={3} size="small">
              <Button type="text" icon={<MessageOutlined />} />
            </Badge>
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