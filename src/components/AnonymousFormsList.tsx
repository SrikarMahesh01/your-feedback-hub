import React, { useState, useEffect } from 'react';
import { Card, Button, Typography, Row, Col, Empty, Spin, Tag, message } from 'antd';
import { FormOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { FeedbackForm } from '../types';
import { getAnonymousForms } from '../services/firebaseService';

const { Title, Text } = Typography;

interface AnonymousFormsListProps {
  onBack: () => void;
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
      const anonymousForms = await getAnonymousForms();
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
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          className="mb-4"
        >
          Back to Login
        </Button>
        
        <Title level={2} className="text-center mb-2">
          🔒 Anonymous Feedback Forms
        </Title>
        
        <Text className="text-gray-600 text-center block mb-4">
          Fill out feedback forms anonymously. Your identity will remain completely confidential.
        </Text>
      </div>

      {forms.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No anonymous forms available at the moment"
        />
      ) : (
        <Row gutter={[16, 16]}>
          {forms.map((form) => (
            <Col xs={24} sm={12} lg={8} key={form.id}>
              <Card
                hoverable
                className="h-full"
                actions={[
                  <Button
                    type="primary"
                    icon={<FormOutlined />}
                    onClick={() => handleFormClick(form.id)}
                    block
                  >
                    Fill Form Anonymously
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <div>
                      <Text strong>{form.title}</Text>
                      <Tag color="orange" className="ml-2">Anonymous</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Text className="text-gray-600">{form.description}</Text>
                      <div className="mt-2">
                        {form.targetYear && form.targetYear !== 'ALL' && form.targetYear !== 'all' && (
                          <Tag color="blue">Year {form.targetYear}</Tag>
                        )}
                        <Tag color="purple">For Technozola</Tag>
                      </div>
                      <div className="mt-2">
                        <Text type="secondary" className="text-xs">
                          {form.questions?.length || 0} questions
                        </Text>
                      </div>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
};
