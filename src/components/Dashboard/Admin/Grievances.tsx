import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Button, Modal, Form, Input, Select, Space, message, Row, Col } from 'antd';
import { EyeOutlined, EditOutlined, SearchOutlined, BookOutlined, BankOutlined, HomeOutlined, CarOutlined, ReadOutlined, EllipsisOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { Grievance } from '../../../types';
import { formatText } from '../../../utils/textFormatter';
import { 
  getGrievancesByAdminDepartments,
  updateGrievanceStatus
} from '../../../services/firebaseService';

const { Title } = Typography;
const { TextArea } = Input;
const { Search } = Input;

export const Grievances: React.FC = () => {
  const { user } = useAuth();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [filteredGrievances, setFilteredGrievances] = useState<Grievance[]>([]);
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null);
  const [isGrievanceModalVisible, setIsGrievanceModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  // Define categories with icons and colors
  const categories = [
    { 
      key: 'academic', 
      name: 'Academic', 
      icon: <BookOutlined />, 
      color: '#1890ff',
      bgColor: '#e6f7ff',
      borderColor: '#91d5ff'
    },
    { 
      key: 'infrastructure', 
      name: 'Infrastructure', 
      icon: <BankOutlined />, 
      color: '#52c41a',
      bgColor: '#f6ffed',
      borderColor: '#b7eb8f'
    },
    { 
      key: 'hostel', 
      name: 'Hostel', 
      icon: <HomeOutlined />, 
      color: '#722ed1',
      bgColor: '#f9f0ff',
      borderColor: '#d3adf7'
    },
    { 
      key: 'transport', 
      name: 'Transport', 
      icon: <CarOutlined />, 
      color: '#fa8c16',
      bgColor: '#fff7e6',
      borderColor: '#ffd591'
    },
    { 
      key: 'library', 
      name: 'Library', 
      icon: <ReadOutlined />, 
      color: '#13c2c2',
      bgColor: '#e6fffb',
      borderColor: '#87e8de'
    },
    { 
      key: 'other', 
      name: 'Other', 
      icon: <EllipsisOutlined />, 
      color: '#8c8c8c',
      bgColor: '#f5f5f5',
      borderColor: '#d9d9d9'
    }
  ];

  useEffect(() => {
    loadGrievances();
  }, [user?.department]);

  useEffect(() => {
    // Filter grievances based on search text
    if (searchText.trim() === '') {
      setFilteredGrievances(grievances);
    } else {
      const filtered = grievances.filter(grievance =>
        grievance.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        grievance.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        grievance.studentName?.toLowerCase().includes(searchText.toLowerCase()) ||
        grievance.category?.toLowerCase().includes(searchText.toLowerCase()) ||
        grievance.status?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredGrievances(filtered);
    }
  }, [grievances, searchText]);

  const loadGrievances = async () => {
    if (!user?.department) return;

    setLoading(true);
    try {
      const adminGrievances = await getGrievancesByAdminDepartments(user.department);
      console.log(`Loaded ${adminGrievances.length} grievances for admin departments`);
      setGrievances(adminGrievances);
      setFilteredGrievances(adminGrievances);
    } catch (error) {
      console.error('Error loading grievances:', error);
      message.error('Failed to load grievances');
    } finally {
      setLoading(false);
    }
  };

  const handleViewGrievance = (grievance: Grievance) => {
    setSelectedGrievance(grievance);
    setIsGrievanceModalVisible(true);
  };

  const handleUpdateGrievance = (grievance: Grievance) => {
    setSelectedGrievance(grievance);
    form.setFieldsValue({
      status: grievance.status,
      comment: ''
    });
    setIsUpdateModalVisible(true);
  };

  const handleUpdateSubmit = async (values: any) => {
    if (!selectedGrievance || !user?.id) return;

    try {
      let adminComments = selectedGrievance.adminComments || [];
      
      // Add new comment if provided
      if (values.comment?.trim()) {
        const newComment = `[${new Date().toLocaleString()}] ${user.name || 'Admin'}: ${values.comment}`;
        adminComments = [...adminComments, newComment];
      }

      // Update status and comments
      await updateGrievanceStatus(selectedGrievance.id, values.status, adminComments);

      message.success('Grievance updated successfully!');
      setIsUpdateModalVisible(false);
      form.resetFields();
      setSelectedGrievance(null);
      await loadGrievances();
    } catch (error) {
      console.error('Error updating grievance:', error);
      message.error('Failed to update grievance');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'in_progress': return 'blue';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      default: return 'default';
    }
  };

  // Get grievances count by category
  const getGrievancesByCategory = (category: string) => {
    return grievances.filter(g => g.category === category);
  };

  const getCategoryStats = (category: string) => {
    const categoryGrievances = getGrievancesByCategory(category);
    return {
      total: categoryGrievances.length,
      pending: categoryGrievances.filter(g => g.status === 'pending').length,
      inProgress: categoryGrievances.filter(g => g.status === 'in_progress').length,
      resolved: categoryGrievances.filter(g => g.status === 'resolved').length,
      closed: categoryGrievances.filter(g => g.status === 'closed').length
    };
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    const categoryGrievances = getGrievancesByCategory(category);
    setFilteredGrievances(categoryGrievances);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setFilteredGrievances(grievances);
  };

  const columns = [
    {
      title: formatText.title('S.No'),
      key: 'serialNumber',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: formatText.title('Title'),
      dataIndex: 'title',
      key: 'title',
      sorter: (a: Grievance, b: Grievance) => a.title.localeCompare(b.title),
      render: (title: string) => (
        <div className="max-w-xs truncate font-medium" title={title}>
          {title}
        </div>
      ),
    },
    {
      title: formatText.title('Student'),
      dataIndex: 'studentName',
      key: 'studentName',
      sorter: (a: Grievance, b: Grievance) => a.studentName.localeCompare(b.studentName),
    },
    {
      title: formatText.title('Category'),
      dataIndex: 'category',
      key: 'category',
      filters: [
        { text: 'Academic', value: 'academic' },
        { text: 'Infrastructure', value: 'infrastructure' },
        { text: 'Hostel', value: 'hostel' },
        { text: 'Transport', value: 'transport' },
        { text: 'Library', value: 'library' },
        { text: 'Other', value: 'other' },
      ],
      onFilter: (value: any, record: Grievance) => record.category === value,
      render: (category: string) => (
        <Tag color="blue">
          {formatText.tag(category)}
        </Tag>
      ),
    },
    {
      title: formatText.title('Department'),
      dataIndex: 'department',
      key: 'department',
      filters: [
        { text: 'Computer Science', value: 'Computer Science' },
        { text: 'Electronics', value: 'Electronics' },
        { text: 'Mechanical', value: 'Mechanical' },
        { text: 'Civil', value: 'Civil' },
        { text: 'Electrical', value: 'Electrical' },
      ],
      onFilter: (value: any, record: Grievance) => record.department === value,
    },
    {
      title: formatText.title('Status'),
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'In Progress', value: 'in_progress' },
        { text: 'Resolved', value: 'resolved' },
        { text: 'Closed', value: 'closed' },
      ],
      onFilter: (value: any, record: Grievance) => record.status === value,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {formatText.status(status)}
        </Tag>
      ),
    },
    {
      title: formatText.title('Submitted'),
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      sorter: (a: Grievance, b: Grievance) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: formatText.title('Actions'),
      key: 'actions',
      width: 150,
      render: (_: any, record: Grievance) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewGrievance(record)}
            size="small"
          >
            {formatText.title('View')}
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleUpdateGrievance(record)}
            size="small"
          >
            {formatText.title('Update')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>{formatText.title("Grievances Management")}</Title>
          <p className="text-gray-600">
            Handle and track student grievances by category
          </p>
        </div>
      </div>

      {!selectedCategory ? (
        // Category Blocks View
        <div>
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>{formatText.title("Grievance Categories")}</span>
                <Search
                  placeholder="Search all grievances..."
                  allowClear
                  onSearch={handleSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                />
              </div>
            }
          >
            <div className="mb-4 text-sm text-gray-600">
              Total grievances across all categories: {grievances.length}
            </div>

            <Row gutter={[16, 16]}>
              {categories.map(category => {
                const stats = getCategoryStats(category.key);
                return (
                  <Col xs={24} sm={12} lg={8} key={category.key}>
                    <Card
                      hoverable
                      className="h-full cursor-pointer"
                      style={{ 
                        borderColor: category.borderColor,
                        backgroundColor: category.bgColor
                      }}
                      onClick={() => handleCategoryClick(category.key)}
                    >
                      <div className="text-center">
                        <div 
                          className="text-4xl mb-3"
                          style={{ color: category.color }}
                        >
                          {category.icon}
                        </div>
                        <Title level={4} style={{ color: category.color, marginBottom: 8 }}>
                          {category.name}
                        </Title>
                        <div className="text-2xl font-bold mb-2" style={{ color: category.color }}>
                          {stats.total}
                        </div>
                        <div className="text-sm text-gray-600">
                          Total Grievances
                        </div>
                        
                        <div className="mt-4 pt-3 border-t" style={{ borderTopColor: category.borderColor }}>
                          <Row gutter={8}>
                            <Col span={6}>
                              <div className="text-center">
                                <div className="text-orange-500 font-semibold">{stats.pending}</div>
                                <div className="text-xs text-gray-500">Pending</div>
                              </div>
                            </Col>
                            <Col span={6}>
                              <div className="text-center">
                                <div className="text-blue-500 font-semibold">{stats.inProgress}</div>
                                <div className="text-xs text-gray-500">Progress</div>
                              </div>
                            </Col>
                            <Col span={6}>
                              <div className="text-center">
                                <div className="text-green-500 font-semibold">{stats.resolved}</div>
                                <div className="text-xs text-gray-500">Resolved</div>
                              </div>
                            </Col>
                            <Col span={6}>
                              <div className="text-center">
                                <div className="text-gray-500 font-semibold">{stats.closed}</div>
                                <div className="text-xs text-gray-500">Closed</div>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </div>
      ) : (
        // Category Detail View
        <div>
          <Card
            title={
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Button 
                    type="link" 
                    onClick={handleBackToCategories}
                    className="p-0 mr-3"
                  >
                    ← Back to Categories
                  </Button>
                  <span>
                    {formatText.title(categories.find(c => c.key === selectedCategory)?.name || '')} Grievances
                  </span>
                </div>
                <Search
                  placeholder="Search in this category..."
                  allowClear
                  onSearch={handleSearch}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 300 }}
                  prefix={<SearchOutlined />}
                />
              </div>
            }
          >
            <div className="mb-4 text-sm text-gray-600">
              {searchText ? (
                <span>
                  Showing {filteredGrievances.length} grievances in {categories.find(c => c.key === selectedCategory)?.name}
                  {searchText && ` (filtered by "${searchText}")`}
                </span>
              ) : (
                <span>Total grievances in {categories.find(c => c.key === selectedCategory)?.name}: {filteredGrievances.length}</span>
              )}
            </div>

            <Table
              dataSource={filteredGrievances}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} grievances`,
              }}
              scroll={{ x: 'max-content' }}
              size="middle"
              bordered
            />
          </Card>
        </div>
      )}

      {/* Grievance Details Modal */}
      <Modal
        title={selectedGrievance ? `${formatText.title("Grievance Details")} - ${selectedGrievance.title}` : formatText.title("Grievance Details")}
        open={isGrievanceModalVisible}
        onCancel={() => {
          setIsGrievanceModalVisible(false);
          setSelectedGrievance(null);
        }}
        footer={[
          <Button 
            key="update" 
            type="primary"
            onClick={() => {
              setIsGrievanceModalVisible(false);
              handleUpdateGrievance(selectedGrievance!);
            }}
          >
            {formatText.title("Update Status")}
          </Button>,
          <Button 
            key="close" 
            onClick={() => {
              setIsGrievanceModalVisible(false);
              setSelectedGrievance(null);
            }}
          >
            {formatText.title("Close")}
          </Button>
        ]}
        width={800}
      >
        {selectedGrievance && (
          <div className="space-y-4">
            <Row gutter={16}>
              <Col span={12}>
                <div><strong>{formatText.title("Student Name")}:</strong> {selectedGrievance.studentName}</div>
              </Col>
              <Col span={12}>
                <div><strong>{formatText.title("Category")}:</strong> 
                  <Tag color="blue" className="ml-2">
                    {formatText.tag(selectedGrievance.category)}
                  </Tag>
                </div>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <div><strong>{formatText.title("Department")}:</strong> {selectedGrievance.department}</div>
              </Col>
              <Col span={12}>
                <div><strong>{formatText.title("Status")}:</strong> 
                  <Tag color={getStatusColor(selectedGrievance.status)} className="ml-2">
                    {formatText.status(selectedGrievance.status)}
                  </Tag>
                </div>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <div><strong>{formatText.title("Submitted At")}:</strong> {new Date(selectedGrievance.submittedAt).toLocaleString()}</div>
              </Col>
              <Col span={12}>
                <div><strong>{formatText.title("Updated At")}:</strong> {new Date(selectedGrievance.updatedAt).toLocaleString()}</div>
              </Col>
            </Row>

            <div>
              <strong>{formatText.title("Description")}:</strong>
              <div className="mt-2 p-3 bg-gray-50 rounded border">
                {selectedGrievance.description}
              </div>
            </div>

            {selectedGrievance.adminComments && selectedGrievance.adminComments.length > 0 && (
              <div>
                <strong>{formatText.title("Admin Comments")}:</strong>
                <div className="mt-2 space-y-2">
                  {selectedGrievance.adminComments.map((comment, index) => (
                    <div key={index} className="p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                      {comment}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Update Grievance Modal */}
      <Modal
        title={selectedGrievance ? `${formatText.title("Update Grievance")} - ${selectedGrievance.title}` : formatText.title("Update Grievance")}
        open={isUpdateModalVisible}
        onCancel={() => {
          setIsUpdateModalVisible(false);
          setSelectedGrievance(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateSubmit}
        >
          <Form.Item
            name="status"
            label={formatText.title("Status")}
            rules={[{ required: true, message: 'Please select a status' }]}
          >
            <Select placeholder="Select status">
              <Select.Option value="pending">{formatText.title("Pending")}</Select.Option>
              <Select.Option value="in_progress">{formatText.title("In Progress")}</Select.Option>
              <Select.Option value="resolved">{formatText.title("Resolved")}</Select.Option>
              <Select.Option value="closed">{formatText.title("Closed")}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="comment"
            label={formatText.title("Admin Comment (Optional)")}
          >
            <TextArea 
              rows={4} 
              placeholder="Add a comment about this grievance..."
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space>
              <Button type="primary" htmlType="submit">
                {formatText.title("Update Grievance")}
              </Button>
              <Button onClick={() => {
                setIsUpdateModalVisible(false);
                setSelectedGrievance(null);
                form.resetFields();
              }}>
                {formatText.title("Cancel")}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
