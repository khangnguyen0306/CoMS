import React, { useState, useEffect } from 'react';
import { Tabs, Form, InputNumber, Button, Card, Space, Typography, message, Descriptions } from 'antd';
import { EditOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Setting = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // In a real application, you would fetch these values from an API
    const [settings, setSettings] = useState(null);

    // Simulate fetching settings from API
    useEffect(() => {
        // API call to get settings
        const fetchSettings = async () => {
            try {
                // Simulate API delay
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Here you would make the actual API call
                // const response = await yourSettingsAPI.getSettings();
                // setSettings(response.data);
                
                // For testing purposes, you can set this to null to simulate no data
                setSettings(null);
                
                // Remove this mock data - let the API determine if settings exist
                // setSettings({
                //     notificationDays: 5
                // });
            } catch (error) {
                console.error('Error fetching settings:', error);
                message.error('Không thể tải cài đặt!');
            }
        };
        
        fetchSettings();
    }, []);
    
    const handleSave = async (values) => {
        setLoading(true);
        try {
            // Here you would make an API call to save the settings
            console.log('Saving settings:', values);
            
            // In a real application:
            // const response = await yourSettingsAPI.saveSettings(values);
            // if (response.success) {
            //     setSettings(values);
            //     setIsEditMode(false);
            //     message.success('Cài đặt đã được lưu thành công!');
            // }
            
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 800));
            
            setSettings(values);
            setIsEditMode(false);
            message.success('Cài đặt đã được lưu thành công!');
        } catch (error) {
            console.error('Error saving settings:', error);
            message.error('Đã xảy ra lỗi khi lưu cài đặt!');
        } finally {
            setLoading(false);
        }
    };
    
    const handleEditClick = () => {
        // Only set existing values if settings exist, otherwise use empty object
        form.setFieldsValue(settings || {});
        setIsEditMode(true);
    };

    const handleCancel = () => {
        setIsEditMode(false);
    };

    const renderContractSettingsContent = () => {
        if (isEditMode) {
            // Edit mode - show form
            return (
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={settings || { notificationDays: 0 }}
                    onFinish={handleSave}
                >
                    <Form.Item
                        name="notificationDays"
                        label="Số ngày thông báo mặc định trước đợt thanh toán"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số ngày thông báo mặc định!' },
                            { type: 'number', min: 1, message: 'Số ngày phải lớn hơn 0!' }
                        ]}
                    >
                        <InputNumber
                            min={1}
                            max={90}
                            addonAfter="ngày"
                            style={{ width: '200px' }}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={loading}
                            >
                                Lưu cài đặt
                            </Button>
                            <Button onClick={handleCancel}>
                                Hủy
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            );
        } else {
            // View mode - show current settings or prompt to add
            return (
                <div >
                    {settings ? (
                        <>
                            <Descriptions
                                title="Cài đặt hiện tại"
                                bordered

                            >
                                <Descriptions.Item label="Số ngày thông báo mặc định trước đợt thanh toán">
                                    {settings.notificationDays} ngày
                                </Descriptions.Item>
                            </Descriptions>
                            <div style={{ marginTop: '20px' }}>
                                <Button
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={handleEditClick}
                                >
                                    Sửa cài đặt
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '30px 0' }}>
                            <Space direction="vertical" size="large">
                                <Text>Chưa có cài đặt thông tin hợp đồng.</Text>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleEditClick}
                                >
                                    Thêm cài đặt
                                </Button>
                            </Space>
                        </div>
                    )}
                </div>
            );
        }
    };

    const items = [
        {
            key: '1',
            label: 'Cài đặt thông tin hợp đồng',
            children: (
                <Card 
                  style={{
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px'
                }}>
                    {renderContractSettingsContent()}
                </Card>
            ),
        },
        {
            key: '2',
            label: 'Cài đặt khác',
            children: (
                <Card 
                  style={{
                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    borderRadius: '8px'
                }}  >
                    <Space direction="vertical" align="center" style={{ width: '100%', padding: '20px' }}>
                        <Title level={5}>Cài đặt khác</Title>
                        <Text type="secondary">Hiện tại chưa có dữ liệu cài đặt khác.</Text>
                    </Space>
                </Card>
            ),
        },
    ];

    return (
        <div style={{ padding: '20px', height: '100vh', overflow: 'auto' }}>
            <Title level={3}>Cài đặt hệ thống</Title>
            <Tabs defaultActiveKey="1" items={items} />
        </div>
    );
};

export default Setting;