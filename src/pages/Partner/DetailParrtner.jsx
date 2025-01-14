import React from 'react';
import { useLocation } from 'react-router-dom';
import { Card, Descriptions, Tag, Statistic, Row, Col, Typography } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title } = Typography;

const PartnerDetail = () => {
    const location = useLocation();
    const partner = location.state;

    if (!partner) {
        return (
            <Card>
                <Empty
                    description="Không có dữ liệu để hiển thị!"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        );
    }

    // Format currency function
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(value);
    };

    // Determine partner type color
    const getPartnerTypeColor = (type) => {
        switch (type) {
            case 'Nhà cung cấp':
                return 'blue';
            case 'Khách hàng':
                return 'green';
            default:
                return 'default';
        }
    };

    return (
        <div className="site-card-wrapper">
            <Card
                title={
                    <Title level={3}>
                        <UserOutlined className="mr-2" />
                        Chi tiết đối tác {partner.partnerName}
                    </Title>
                }
                className="shadow-md"
            >
                <Descriptions
                    bordered
                    column={2}
                >
                    <Descriptions.Item
                        label="Mã Partner"
                        style={{
                            border: '1px solid #89c4d9',
                        }}
                        labelStyle={{
                            backgroundColor: '#cdf2ff',
                            color: '#005580',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        <Tag color="purple">{partner.partnerCode}</Tag>
                    </Descriptions.Item>



                    <Descriptions.Item
                        label="Loại Partner"
                        style={{
                            border: '1px solid #89c4d9',
                        }}
                        labelStyle={{
                            backgroundColor: '#cdf2ff',
                            color: '#005580',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        <Tag color={getPartnerTypeColor(partner.partnerType)}>
                            {partner.partnerType}
                        </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item
                        label="Tên Partner"
                        style={{
                            border: '1px solid #89c4d9',
                        }}
                        labelStyle={{
                            backgroundColor: '#cdf2ff',
                            color: '#005580',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        {partner.partnerName}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label="Công ty"
                        style={{
                            border: '1px solid #89c4d9',
                        }}
                        labelStyle={{
                            backgroundColor: '#cdf2ff',
                            color: '#005580',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        {partner.company}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label="Chức vụ"
                        style={{
                            border: '1px solid #89c4d9',
                        }}
                        labelStyle={{
                            backgroundColor: '#cdf2ff',
                            color: '#005580',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        {partner.position}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label="Tuổi"
                        style={{
                            border: '1px solid #89c4d9',
                        }}
                        labelStyle={{
                            backgroundColor: '#cdf2ff',
                            color: '#005580',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        {partner.age}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label="Điện thoại"
                        style={{
                            border: '1px solid #89c4d9',
                        }}
                        labelStyle={{
                            backgroundColor: '#cdf2ff',
                            color: '#005580',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        <PhoneOutlined className="mr-2" />
                        {partner.phone}
                    </Descriptions.Item>

                    <Descriptions.Item
                        label="Email"
                        span={2}
                        style={{
                            border: '1px solid #89c4d9',
                        }}
                        labelStyle={{
                            backgroundColor: '#cdf2ff',
                            color: '#005580',
                            fontWeight: 'bold',
                            textAlign: 'center',
                        }}
                    >
                        <MailOutlined className="mr-2" />
                        {partner.email}
                    </Descriptions.Item>
                </Descriptions>

                <Row gutter={16} className="mt-6">
                    <Col span={8} >
                        <Card style={{ borderColor: '#919191', borderWidth: 2 }}>
                            <Statistic
                                title={<span style={{ color: '#313131', fontWeight: 'bold' }}>Tổng số hợp đồng</span>}
                                value={partner.totalContracts}
                                prefix={<FileTextOutlined />}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card style={{ borderColor: '#919191', borderWidth: 2 }}>
                            <Statistic
                                title={<span style={{ color: '#313131', fontWeight: 'bold' }}>Hợp đồng còn hiệu lực</span>}
                                value={partner.activeContracts}
                                valueStyle={{ color: '#3f8600' }}
                            />
                        </Card>
                    </Col>
                    <Col span={8}>
                        <Card style={{ borderColor: '#919191', borderWidth: 2 }}>
                            <Statistic
                                title={<span style={{ color: '#313131', fontWeight: 'bold' }}>Tổng giá trị hợp đồng</span>}
                                value={partner.contractValue}
                                formatter={(value) => formatCurrency(value)}
                                precision={0}
                            />
                        </Card>
                    </Col>
                </Row>
            </Card>
        </div>
    );
};

export default PartnerDetail;