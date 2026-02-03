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
    message.success('已退出登录');
    navigate('/login');
  };

  /**
   * 查看评分详情
   */
  const handleViewDetail = (record) => {
    Modal.info({
      title: `订单 ${record.order_no} 的评价详情`,
      width: 600,
      content: (
        <div style={{ marginTop: 20 }}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div>
              <Text strong>用户：</Text>
              <Text>{record.username} ({record.user_email})</Text>
            </div>
            <div>
              <Text strong>管理员：</Text>
              <Text>{record.admin_name || '未指定'}</Text>
            </div>
            <div>
              <Text strong>总体评分：</Text>
              <Rate disabled value={record.overall_score} />
              <Text>({record.overall_score}星)</Text>
            </div>
            {record.service_attitude && (
              <div>
                <Text strong>服务态度：</Text>
                <Rate disabled value={record.service_attitude} />
              </div>
            )}
            {record.response_speed && (
              <div>
                <Text strong>响应速度：</Text>
                <Rate disabled value={record.response_speed} />
              </div>
            )}
            {record.problem_solving && (
              <div>
                <Text strong>问题解决：</Text>
                <Rate disabled value={record.problem_solving} />
              </div>
            )}
            {record.professionalism && (
              <div>
                <Text strong>专业程度：</Text>
                <Rate disabled value={record.professionalism} />
              </div>
            )}
            {record.comment && (
              <div>
                <Text strong>评价内容：</Text>
                <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                  {record.comment}
                </div>
              </div>
            )}
            <div>
              <Text strong>评价时间：</Text>
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
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      width: 150,
      fixed: 'left'
    },
    {
      title: '用户',
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
      title: '管理员',
      dataIndex: 'admin_name',
      key: 'admin_name',
      width: 100,
      render: (text) => text || '-'
    },
    {
      title: '总体评分',
      dataIndex: 'overall_score',
      key: 'overall_score',
      width: 150,
      render: (score) => <Rate disabled value={score} />
    },
    {
      title: '评价内容',
      dataIndex: 'comment',
      key: 'comment',
      width: 200,
      ellipsis: true,
      render: (text) => text ? (
        <Text ellipsis={{ tooltip: text }}>{text}</Text>
      ) : (
        <Text type="secondary">无评语</Text>
      )
    },
    {
      title: '评价时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" onClick={() => handleViewDetail(record)}>
          查看详情
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
          <DashboardOutlined /> 管理员后台
        </Title>
        <Space>
          <Text>管理员：{user?.username || user?.email}</Text>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>
            退出登录
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
                title="评价总数"
                value={statistics.total_ratings || 0}
                prefix={<StarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均评分"
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
                title="五星好评"
                value={statistics.five_star_count || 0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="有评语"
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
              placeholder={['开始日期', '结束日期']}
              onChange={(dates) => {
                setFilters({
                  ...filters,
                  startDate: dates ? dates[0].format('YYYY-MM-DD') : undefined,
                  endDate: dates ? dates[1].format('YYYY-MM-DD') : undefined
                });
              }}
            />
            
            <Select
              placeholder="评分筛选"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters({ ...filters, minScore: value })}
            >
              <Select.Option value={5}>5星</Select.Option>
              <Select.Option value={4}>4星及以上</Select.Option>
              <Select.Option value={3}>3星及以上</Select.Option>
              <Select.Option value={2}>2星及以上</Select.Option>
              <Select.Option value={1}>1星及以上</Select.Option>
            </Select>

            <Select
              placeholder="评语筛选"
              style={{ width: 150 }}
              allowClear
              onChange={(value) => setFilters({ ...filters, hasComment: value })}
            >
              <Select.Option value={1}>有评语</Select.Option>
              <Select.Option value={0}>无评语</Select.Option>
            </Select>

            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleApplyFilters}
            >
              应用筛选
            </Button>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={handleResetFilters}
            >
              重置
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
