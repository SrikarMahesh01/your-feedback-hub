import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Typography, Button, Modal, Descriptions, Space, message, Input } from 'antd';
import { UserOutlined, DownloadOutlined, SearchOutlined } from '@ant-design/icons';
import { User, DEPARTMENTS } from '../../../types';
import { formatText } from '../../../utils/textFormatter';
import { getStudentsByDepartment, exportStudentsToCSV } from '../../../services/firebaseService';
import { useAuth } from '../../../contexts/AuthContext';

const { Title } = Typography;
const { Search } = Input;

export const Students: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<User[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search text
    if (searchText.trim() === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.rollNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.branch?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.year?.toString().includes(searchText)
      );
      setFilteredStudents(filtered);
    }
  }, [students, searchText]);

  const loadStudents = async () => {
    if (!user || !user.department) {
      console.error('Admin user or department not found');
      message.error('Unable to load students: Admin department not specified');
      return;
    }

    setLoading(true);
    try {
      const departmentStudents = await getStudentsByDepartment(user.department);
      console.log(`Loaded ${departmentStudents.length} students from ${Array.isArray(user.department) ? user.department.join(', ') : user.department} department(s)`);
      setStudents(departmentStudents);
      setFilteredStudents(departmentStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      message.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = (student: User) => {
    setSelectedStudent(student);
    setIsStudentModalVisible(true);
  };

  const handleExportStudents = async () => {
    if (!user || !user.department) {
      message.warning('Unable to export: Admin department not specified');
      return;
    }

    try {
      const departmentName = Array.isArray(user.department) 
        ? user.department.join(', ') 
        : user.department;
      exportStudentsToCSV(filteredStudents, departmentName);
      message.success('Students data exported to CSV successfully!');
    } catch (error) {
      console.error('Error exporting students:', error);
      message.error('Failed to export students data');
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const columns = [
    {
      title: formatText.title('S.No'),
      key: 'serialNumber',
      width: 80,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: formatText.title('Name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: User, b: User) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: formatText.title('Roll Number'),
      dataIndex: 'rollNumber',
      key: 'rollNumber',
      sorter: (a: User, b: User) => (a.rollNumber || '').localeCompare(b.rollNumber || ''),
    },
    {
      title: formatText.title('Email'),
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <div className="max-w-xs truncate" title={email}>
          {email}
        </div>
      ),
    },
    {
      title: formatText.title('Branch'),
      dataIndex: 'branch',
      key: 'branch',
      filters: DEPARTMENTS.map(dept => ({ text: dept, value: dept })),
      onFilter: (value: any, record: User) => record.branch === value,
      sorter: (a: User, b: User) => (a.branch || '').localeCompare(b.branch || ''),
    },
    {
      title: formatText.title('Year'),
      dataIndex: 'year',
      key: 'year',
      filters: [
        { text: '1st Year', value: '1' },
        { text: '2nd Year', value: '2' },
        { text: '3rd Year', value: '3' },
        { text: '4th Year', value: '4' },
      ],
      onFilter: (value: any, record: User) => record.year?.toString() === value,
      sorter: (a: User, b: User) => (parseInt(a.year || '0') || 0) - (parseInt(b.year || '0') || 0),
      render: (year: string) => year ? `${year}${getOrdinalSuffix(parseInt(year))} Year` : 'N/A',
    },
    {
      title: formatText.title('Phone'),
      dataIndex: 'phone',
      key: 'phone',
      render: () => 'N/A', // Phone field doesn't exist in User type
    },
    {
      title: formatText.title('Status'),
      dataIndex: 'isActive',
      key: 'isActive',
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value: any, record: User) => record.isActive === value,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {formatText.status(isActive ? 'active' : 'inactive')}
        </Tag>
      ),
    },
    {
      title: formatText.title('Registered'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      sorter: (a: User, b: User) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: formatText.title('Actions'),
      key: 'actions',
      width: 120,
      render: (_: any, record: User) => (
        <Space>
          <Button
            type="link"
            icon={<UserOutlined />}
            onClick={() => handleViewStudent(record)}
            size="small"
          >
            {formatText.title('View')}
          </Button>
        </Space>
      ),
    },
  ];

  function getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2}>{formatText.title("Students Management")}</Title>
          <p className="text-gray-600">
            View and manage students from your department{user?.department && ` (${Array.isArray(user.department) ? user.department.join(', ') : user.department})`}
          </p>
        </div>
      </div>

      <Card
        title={
          <div className="flex justify-between items-center">
            <span>{formatText.title("Department Students")}</span>
            <div className="flex items-center space-x-4">
              <Search
                placeholder="Search students..."
                allowClear
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300 }}
                prefix={<SearchOutlined />}
              />
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleExportStudents}
                disabled={filteredStudents.length === 0}
              >
                {formatText.title("Export to CSV")}
              </Button>
            </div>
          </div>
        }
      >
        <div className="mb-4 text-sm text-gray-600">
          {searchText ? (
            <span>
              Showing {filteredStudents.length} of {students.length} students
              {searchText && ` (filtered by "${searchText}")`}
            </span>
          ) : (
            <span>Total students: {students.length}</span>
          )}
        </div>

        <Table
          dataSource={filteredStudents}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} students`,
          }}
          scroll={{ x: 'max-content' }}
          size="middle"
          bordered
        />
      </Card>

      {/* Student Details Modal */}
      <Modal
        title={selectedStudent ? `${formatText.title("Student Details")} - ${selectedStudent.name}` : formatText.title("Student Details")}
        open={isStudentModalVisible}
        onCancel={() => {
          setIsStudentModalVisible(false);
          setSelectedStudent(null);
        }}
        footer={[
          <Button 
            key="close" 
            onClick={() => {
              setIsStudentModalVisible(false);
              setSelectedStudent(null);
            }}
          >
            {formatText.title("Close")}
          </Button>
        ]}
        width={600}
      >
        {selectedStudent && (
          <div className="space-y-4">
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label={formatText.title("Full Name")}>
                {selectedStudent.name || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={formatText.title("Email Address")}>
                {selectedStudent.email || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={formatText.title("Roll Number")}>
                {selectedStudent.rollNumber || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={formatText.title("Branch/Department")}>
                {selectedStudent.branch || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={formatText.title("Academic Year")}>
                {selectedStudent.year ? `${selectedStudent.year}${getOrdinalSuffix(parseInt(selectedStudent.year))} Year` : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={formatText.title("Phone Number")}>
                N/A
              </Descriptions.Item>
              <Descriptions.Item label={formatText.title("Account Status")}>
                <Tag color={selectedStudent.isActive ? 'green' : 'red'}>
                  {formatText.status(selectedStudent.isActive ? 'active' : 'inactive')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={formatText.title("Registration Date")}>
                {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleString() : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label={formatText.title("Last Updated")}>
                N/A
              </Descriptions.Item>
              <Descriptions.Item label={formatText.title("User ID")}>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {selectedStudent.id}
                </code>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};
