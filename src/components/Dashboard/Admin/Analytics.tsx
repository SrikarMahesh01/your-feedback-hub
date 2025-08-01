import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Typography, Spin, Table, Tag, Progress } from 'antd';
import { UserOutlined, FormOutlined, FileTextOutlined, DashboardOutlined } from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { User, FeedbackForm, Grievance } from '../../../types';
import { formatText } from '../../../utils/textFormatter';
import { 
  getStudentsByDepartment,
  getFeedbackFormsByCreator,
  getGrievancesByAdminDepartments,
  getFeedbackResponsesByCreator
} from '../../../services/firebaseService';

const { Title } = Typography;

interface AnalyticsData {
  totalStudents: number;
  totalForms: number;
  totalGrievances: number;
  totalResponses: number;
  studentsByYear: { [key: string]: number };
  studentsByBranch: { [key: string]: number };
  grievancesByStatus: { [key: string]: number };
  formsByStatus: { [key: string]: number };
  recentActivities: any[];
}

export const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [user?.id]);

  const loadAnalytics = async () => {
    if (!user?.id || !user?.department) return;

    setLoading(true);
    try {
      // Load basic data
      const [students, forms, grievances, responses] = await Promise.all([
        getStudentsByDepartment(user.department),
        getFeedbackFormsByCreator(user.id),
        getGrievancesByAdminDepartments(user.department || []),
        getFeedbackResponsesByCreator(user.id)
      ]);

      // Process students by year
      const studentsByYear = students.reduce((acc: { [key: string]: number }, student: User) => {
        const year = student.year || 'Unknown';
        acc[year] = (acc[year] || 0) + 1;
        return acc;
      }, {});

      // Process students by branch
      const studentsByBranch = students.reduce((acc: { [key: string]: number }, student: User) => {
        const branch = student.branch || 'Unknown';
        acc[branch] = (acc[branch] || 0) + 1;
        return acc;
      }, {});

      // Process grievances by status
      const grievancesByStatus = grievances.reduce((acc: { [key: string]: number }, grievance: Grievance) => {
        const status = grievance.status;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Process forms by status
      const formsByStatus = forms.reduce((acc: { [key: string]: number }, form: FeedbackForm) => {
        const status = form.isActive ? 'active' : 'inactive';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      // Recent activities (combining grievances and responses)
      const recentActivities = [
        ...grievances.slice(0, 5).map((g: Grievance) => ({
          type: 'grievance',
          title: g.title,
          status: g.status,
          date: g.submittedAt,
          studentName: g.studentName
        })),
        ...responses.slice(0, 5).map((r: any) => ({
          type: 'response',
          title: r.formDetails?.title || 'Unknown Form',
          status: 'submitted',
          date: r.submittedAt,
          studentName: r.studentDetails?.name || 'Unknown'
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

      setAnalyticsData({
        totalStudents: students.length,
        totalForms: forms.length,
        totalGrievances: grievances.length,
        totalResponses: responses.length,
        studentsByYear,
        studentsByBranch,
        grievancesByStatus,
        formsByStatus,
        recentActivities
      });

    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <Title level={3}>{formatText.title("Unable to load analytics data")}</Title>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange';
      case 'in_progress': return 'blue';
      case 'resolved': return 'green';
      case 'closed': return 'gray';
      case 'active': return 'green';
      case 'inactive': return 'red';
      case 'submitted': return 'blue';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Title level={2}>{formatText.title("Department Analytics")}</Title>
        <p className="text-gray-600">
          Overview of your department performance and statistics{user?.department && ` (${Array.isArray(user.department) ? user.department.join(', ') : user.department})`}
        </p>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("Department Students")}
              value={analyticsData.totalStudents}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("Active Forms")}
              value={analyticsData.totalForms}
              prefix={<FormOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("Total Grievances")}
              value={analyticsData.totalGrievances}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={formatText.title("Form Responses")}
              value={analyticsData.totalResponses}
              prefix={<DashboardOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Distribution Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={formatText.title("Students by Year")}>
            <div className="space-y-3">
              {Object.entries(analyticsData.studentsByYear).map(([year, count]) => (
                <div key={year} className="flex justify-between items-center">
                  <span className="font-medium">
                    {year === 'Unknown' ? 'Unknown' : `Year ${year}`}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress
                      percent={(count / analyticsData.totalStudents) * 100}
                      size="small"
                      showInfo={false}
                      className="w-20"
                    />
                    <span className="font-bold text-blue-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title={formatText.title("Students by Branch")}>
            <div className="space-y-3">
              {Object.entries(analyticsData.studentsByBranch).map(([branch, count]) => (
                <div key={branch} className="flex justify-between items-center">
                  <span className="font-medium">{branch}</span>
                  <div className="flex items-center space-x-2">
                    <Progress
                      percent={(count / analyticsData.totalStudents) * 100}
                      size="small"
                      showInfo={false}
                      className="w-20"
                    />
                    <span className="font-bold text-green-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={formatText.title("Grievances by Status")}>
            <div className="space-y-3">
              {Object.entries(analyticsData.grievancesByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="font-medium">
                    <Tag color={getStatusColor(status)}>
                      {formatText.status(status)}
                    </Tag>
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress
                      percent={analyticsData.totalGrievances ? (count / analyticsData.totalGrievances) * 100 : 0}
                      size="small"
                      showInfo={false}
                      className="w-20"
                    />
                    <span className="font-bold text-red-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title={formatText.title("Forms by Status")}>
            <div className="space-y-3">
              {Object.entries(analyticsData.formsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="font-medium">
                    <Tag color={getStatusColor(status)}>
                      {formatText.status(status)}
                    </Tag>
                  </span>
                  <div className="flex items-center space-x-2">
                    <Progress
                      percent={analyticsData.totalForms ? (count / analyticsData.totalForms) * 100 : 0}
                      size="small"
                      showInfo={false}
                      className="w-20"
                    />
                    <span className="font-bold text-purple-600">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity */}
      <Card title={formatText.title("Recent Activity")}>
        <Table
          dataSource={analyticsData.recentActivities}
          pagination={false}
          size="small"
          columns={[
            {
              title: formatText.title('Type'),
              dataIndex: 'type',
              key: 'type',
              width: 100,
              render: (type: string) => (
                <Tag color={type === 'grievance' ? 'red' : 'blue'}>
                  {formatText.tag(type)}
                </Tag>
              ),
            },
            {
              title: formatText.title('Title'),
              dataIndex: 'title',
              key: 'title',
              render: (title: string) => (
                <div className="max-w-xs truncate" title={title}>
                  {title}
                </div>
              ),
            },
            {
              title: formatText.title('Student'),
              dataIndex: 'studentName',
              key: 'studentName',
            },
            {
              title: formatText.title('Status'),
              dataIndex: 'status',
              key: 'status',
              render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                  {formatText.status(status)}
                </Tag>
              ),
            },
            {
              title: formatText.title('Date'),
              dataIndex: 'date',
              key: 'date',
              render: (date: string) => new Date(date).toLocaleDateString(),
            },
          ]}
        />
      </Card>
    </div>
  );
};
