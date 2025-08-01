import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Tag, Typography, Row, Col, Descriptions, Space, message, Spin } from 'antd';
import { ArrowLeftOutlined, UserOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import { Grievance } from '../types';
import { formatText } from '../utils/textFormatter';
import { getGrievanceById, updateGrievanceStatus } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

const { Title, Paragraph } = Typography;

export const GrievanceDetail: React.FC = () => {
  const { grievanceId } = useParams<{ grievanceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (grievanceId) {
      loadGrievance();
    }
  }, [grievanceId]);

  const loadGrievance = async () => {
    if (!grievanceId) return;
    
    try {
      setLoading(true);
      // We'll need to implement getGrievanceById in firebaseService
      const grievanceData = await getGrievanceById(grievanceId);
      setGrievance(grievanceData);
    } catch (error) {
      console.error('Error loading grievance:', error);
      message.error('Failed to load grievance details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!grievanceId) return;
    
    try {
      setUpdating(true);
      await updateGrievanceStatus(grievanceId, status);
      message.success('Grievance status updated successfully');
      await loadGrievance(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating grievance status:', error);
      message.error('Failed to update grievance status');
    } finally {
      setUpdating(false);
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Title level={3}>Grievance not found</Title>
          <Button type="primary" onClick={handleGoBack} icon={<ArrowLeftOutlined />}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'orange',
      in_progress: 'blue',
      resolved: 'green',
      closed: 'gray',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button 
            type="text" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleGoBack}
            className="mb-4"
          >
            Back to Dashboard
          </Button>
          <Title level={2}>{formatText.title("Grievance Details")}</Title>
        </div>

        {/* Main Content */}
        <Row gutter={[16, 16]}>
          {/* Grievance Information */}
          <Col span={24}>
            <Card>
              <div className="mb-4">
                <Space>
                  <Title level={3} className="mb-0">{grievance.title}</Title>
                  <Tag color={getStatusColor(grievance.status)}>
                    {grievance.status.replace('_', ' ').toUpperCase()}
                  </Tag>
                </Space>
              </div>

              <Descriptions bordered column={2}>
                <Descriptions.Item label="Student Name" span={1}>
                  <Space>
                    <UserOutlined />
                    {grievance.studentName}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Student ID" span={1}>
                  {grievance.studentId}
                </Descriptions.Item>
                <Descriptions.Item label="Department" span={1}>
                  {grievance.department}
                </Descriptions.Item>
                <Descriptions.Item label="Student Branch" span={1}>
                  {grievance.studentBranch}
                </Descriptions.Item>
                <Descriptions.Item label="Year" span={1}>
                  {grievance.studentYear}
                </Descriptions.Item>
                <Descriptions.Item label="Category" span={1}>
                  <Tag>{grievance.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Submitted" span={1}>
                  <Space>
                    <CalendarOutlined />
                    {new Date(grievance.submittedAt).toLocaleString()}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated" span={1}>
                  <Space>
                    <CalendarOutlined />
                    {new Date(grievance.updatedAt).toLocaleString()}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* Description */}
          <Col span={24}>
            <Card title={<><FileTextOutlined /> Description</>}>
              <Paragraph className="whitespace-pre-wrap">
                {grievance.description}
              </Paragraph>
            </Card>
          </Col>

          {/* Actions */}
          {user?.role === 'admin' && (
            <Col span={24}>
              <Card title="Actions">
                <Space>
                  <Button
                    type="default"
                    onClick={() => handleStatusUpdate('in_progress')}
                    disabled={grievance.status === 'in_progress' || updating}
                    loading={updating}
                  >
                    Mark as In Progress
                  </Button>
                  <Button
                    type="primary"
                    onClick={() => handleStatusUpdate('resolved')}
                    disabled={grievance.status === 'resolved' || updating}
                    loading={updating}
                  >
                    Mark as Resolved
                  </Button>
                  <Button
                    type="default"
                    onClick={() => handleStatusUpdate('closed')}
                    disabled={grievance.status === 'closed' || updating}
                    loading={updating}
                  >
                    Close Grievance
                  </Button>
                </Space>
              </Card>
            </Col>
          )}
        </Row>
      </div>
    </div>
  );
};
