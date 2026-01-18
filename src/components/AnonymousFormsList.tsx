import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Empty, Spin, Tag, message, Divider } from 'antd';
import { FormOutlined, ArrowLeftOutlined, CalendarOutlined, BranchesOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { FeedbackForm } from '../types';
import { getAnonymousForms } from '../services/firebaseService';

const { Title, Text, Paragraph } = Typography;

interface AnonymousFormsListProps {
  onBack?: () => void;
}

export const AnonymousFormsList: React.FC<AnonymousFormsListProps> = ({ onBack }) => {
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadAnonymousForms();
  }, []);

  const loadAnonymousForms = async () => {
    try {
      console.log('Loading anonymous forms...');
      const anonymousForms = await getAnonymousForms();
      console.log('Loaded anonymous forms:', anonymousForms.length, 'forms');
      console.log('Forms data:', anonymousForms);
      setForms(anonymousForms);
    } catch (error) {
      console.error('Error loading anonymous forms:', error);
      message.error('Error loading anonymous forms');
    } finally {
      setLoading(false);
    }
  };

  const handleFormClick = (formId: string) => {
    navigate(`/anonymous-forms/${formId}`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spin size="large" />
        <p className="mt-4">Loading anonymous forms...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => onBack ? onBack() : navigate('/login')}
            size="large"
            className="mb-6 shadow-sm"
          >
            Back to Login
          </Button>
          
          <div className="text-center mb-6">
            <Title level={2} className="mb-3">
              Anonymous Feedback Forms
            </Title>
            <Paragraph className="text-gray-600 text-lg max-w-2xl mx-auto">
              Share your honest feedback without revealing your identity. Your responses are completely anonymous and confidential.
            </Paragraph>
          </div>
        </div>

        {forms.length === 0 ? (
          <Card className="max-w-2xl mx-auto shadow-lg">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text className="text-gray-500 text-lg">No anonymous forms available at the moment</Text>
                  <div className="mt-2">
                    <Text type="secondary">Check back later for new feedback opportunities</Text>
                  </div>
                </div>
              }
            />
          </Card>
        ) : (
          <Row gutter={[24, 24]}>
            {forms.map((form) => (
              <Col xs={24} sm={24} md={12} lg={8} key={form.id}>
                <Card
                  hoverable
                  className="h-full shadow-md hover:shadow-xl transition-all duration-300 border-0"
                  bodyStyle={{ padding: '24px' }}
                >
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <Title level={4} className="mb-0 flex-1 pr-2">
                        {form.title}
                      </Title>
                      <Tag color="orange" className="ml-2 flex-shrink-0">
                        Anonymous
                      </Tag>
                    </div>
                    
                    <Paragraph 
                      className="text-gray-600 mb-4" 
                      ellipsis={{ rows: 3, expandable: false }}
                      style={{ minHeight: '60px' }}
                    >
                      {form.description}
                    </Paragraph>
                    
                    <Divider className="my-3" />
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <CalendarOutlined className="mr-2" />
                        <Text type="secondary">
                          {form.targetYear && form.targetYear !== 'ALL' && form.targetYear !== 'all' 
                            ? `Year ${form.targetYear}`
                            : 'All Years'}
                        </Text>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BranchesOutlined className="mr-2" />
                        <Text type="secondary">{form.targetBranch || 'All Branches'}</Text>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <FormOutlined className="mr-2" />
                        <Text type="secondary">{form.questions?.length || 0} questions</Text>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    type="primary"
                    icon={<FormOutlined />}
                    onClick={() => handleFormClick(form.id)}
                    block
                    size="large"
                    className="mt-auto"
                  >
                    Fill Form Anonymously
                  </Button>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};
