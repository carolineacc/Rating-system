/**
 * 管理员后台页面
 * 管理员查看和管理所有评分数据
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Table,
  Rate,
  Tag,
  Space,
  Button,
  Typography,
  Statistic,
  Row,
  Col,
  DatePicker,
  Select,
  Input,
  message,
  Modal
} from 'antd';
import {
  DashboardOutlined,
  LogoutOutlined,
  StarOutlined,
  UserOutlined,
  ReloadOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { getRatingList, getStatistics } from '../services/ratingService';
import { getLocalUser, logout } from '../services/authService';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

function AdminDashboard() {
  const navigate = useNavigate();
  const user = getLocalUser();
  
  // 状态管理
  const [loading, setLoading] = useState(false);
  const [ratingList, setRatingList] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  
  // 筛选条件
  const [filters, setFilters] = useState({
    minScore: undefined,
    maxScore: undefined,
    startDate: undefined,
    endDate: undefined,
    hasComment: undefined
  });

  /**
   * 加载评分列表
   */
  const loadRatingList = async (page = 1, pageSize = 20) => {
    try {
      setLoading(true);
      const response = await getRatingList({
        page,
        pageSize,
        ...filters
      });
      
      setRatingList(response.data.list);
      setPagination({
        current: response.data.page,
        pageSize: response.data.pageSize,
        total: response.data.total
      });
    } catch (error) {
      // 错误已在request.js中处理
    } finally {
      setLoading(false);
    }
  };

  /**
   * 加载统计数据
   */
  const loadStatistics = async () => {
    try {
      const response = await getStatistics({
        startDate: filters.startDate,
        endDate: filters.endDate
      });
      setStatistics(response.data);
    } catch (error) {
      // 错误已在request.js中处理
    }
  };

  /**
   * 初始加载数据
   */
  useEffect(() => {
    loadRatingList();
    loadStatistics();
  }, []);

  /**
   * 处理表格变化（分页、筛选、排序）
   */
  const handleTableChange = (newPagination) => {
    loadRatingList(newPagination.current, newPagination.pageSize);
  };

  /**
   * 应用筛选条件
   */
  const handleApplyFilters = () => {
    loadRatingList(1, pagination.pageSize);
    loadStatistics();
  };

  /**
   * 重置筛选条件
   */
  const handleResetFilters = () => {
    setFilters({
      minScore: undefined,
      maxScore: undefined,
      startDate: undefined,
      endDate: undefined,
      hasComment: undefined
    });
    // 重置后重新加载
    setTimeout(() => {
      loadRatingList(1, pagination.pageSize);
      loadStatistics();
    }, 0);
  };

  /**
   * 处理登出
   */
  const handleLogout = () => {
    logout();
    message.success('Logged out successfully');
    navigate('/login');
  };

  /**
   * 查看评分详情
   */
  const handleViewDetail = (record) => {
    Modal.info({
      title: `Order ${record.order_no} - Rating Details`,
      width: 600,
      content: (
        <div style={{ marginTop: 20 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>User: </Text>
              <Text>{record.username} ({record.user_email})</Text>
            </div>
            <div>
              <Text strong>Admin: </Text>
              <Text>{record.admin_name || 'Not specified'}</Text>
            </div>
            <div>
              <Text strong>Overall Rating: </Text>
              <Rate disabled value={record.overall_score} />
              <Text> ({record.overall_score} star)</Text>
            </div>
            {record.service_attitude && (
              <div>
                <Text strong>Service Attitude: </Text>
                <Rate disabled value={record.service_attitude} />
              </div>
            )}
            {record.response_speed && (
              <div>
                <Text strong>Response Speed: </Text>
                <Rate disabled value={record.response_speed} />
              </div>
            )}
            {record.problem_solving && (
              <div>
                <Text strong>Problem-solving: </Text>
                <Rate disabled value={record.problem_solving} />
              </div>
            )}
            {record.professionalism && (
              <div>
                <Text strong>Professionalism: </Text>
                <Rate disabled value={record.professionalism} />
              </div>
            )}
            {record.comment && (
              <div>
                <Text strong>Comment: </Text>
                <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  {record.comment}
                </div>
              </div>
            )}
            <div>
              <Text strong>Rated at: </Text>
              <Text>{dayjs(record.created_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
            </div>
          </Space>
        </div>
      ),
    });
  };

  // 表格列定义
  const columns = [
    {
      title: 'Order No.',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 150,
      fixed: 'left'
    },
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      render: (text, record) => (
        <div>
          <div>{text}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.user_email}</Text>
        </div>
      )
    },
    {
      title: 'Admin',
      dataIndex: 'admin_name',
      key: 'admin_name',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: 'Overall',
      dataIndex: 'overall_score',
      key: 'overall_score',
      width: 150,
      render: (score) => <Rate disabled value={score} />
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
      width: 200,
      ellipsis: true,
      render: (text) => text ? (
        <Text ellipsis={{ tooltip: text }}>{text}</Text>
      ) : (
        <Text type="secondary">No comment</Text>
      )
    },
    {
      title: 'Rated at',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          View Details
        </Button>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          <DashboardOutlined /> Admin Dashboard
        </Title>
        <Space>
          <Text>Admin: {user?.username || user?.email}</Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            Logout
          </Button>
        </Space>
      </Header>

      {/* 主要内容区域 */}
      <Content style={{ padding: '24px', background: '#f0f2f5' }}>
        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Ratings"
                value={statistics.total_ratings || 0}
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average Rating"
                value={statistics.avg_overall_score || 0}
                precision={2}
                suffix="/ 5"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="5-Star Count"
                value={statistics.five_star_count || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="With Comment"
                value={statistics.with_comment_count || 0}
                suffix={`/ ${statistics.total_ratings || 0}`}
              />
            </Card>
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card style={{ marginBottom: 24 }}>
          <Space wrap>
            <RangePicker
              placeholder={['Start date', 'End date']}
              onChange={(dates) => {
                setFilters({
                  ...filters,
                  startDate: dates ? dates[0].format('YYYY-MM-DD') : undefined,
                  endDate: dates ? dates[1].format('YYYY-MM-DD') : undefined
                });
              }}
            />
            
            <Select
              placeholder="Score filter"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters({ ...filters, minScore: value })}
            >
              <Select.Option value={5}>5 stars</Select.Option>
              <Select.Option value={4}>4+ stars</Select.Option>
              <Select.Option value={3}>3+ stars</Select.Option>
              <Select.Option value={2}>2+ stars</Select.Option>
              <Select.Option value={1}>1+ stars</Select.Option>
            </Select>

            <Select
              placeholder="Comment filter"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters({ ...filters, hasComment: value })}
            >
              <Select.Option value={1}>With comment</Select.Option>
              <Select.Option value={0}>No comment</Select.Option>
            </Select>

            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleApplyFilters}
            >
              Apply
            </Button>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          </Space>
        </Card>

        {/* 评分列表表格 */}
        <Card>
          <Table
            columns={columns}
            dataSource={ratingList}
            rowKey="id"
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        </Card>
      </Content>
    </Layout>
  );
}

export default AdminDashboard;
