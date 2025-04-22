import React, { useState, useEffect } from 'react';
import { Tabs, Form, InputNumber, Button, Card, Space, Typography, message, Descriptions, Spin, Checkbox } from 'antd';
import { EditOutlined, SaveOutlined, PlusOutlined } from '@ant-design/icons';
import { useCreateDateNofiticationMutation, useGetDateNofitifationQuery } from '../../services/ConfigAPI';

const { Title, Text } = Typography;

const Setting = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const { data: dateNotifi, isLoading, isError, refetch } = useGetDateNofitifationQuery();
    const [createDateNoftifi, { isLoading: loadingCreate }] = useCreateDateNofiticationMutation();
    const [settings, setSettings] = useState(null);

    // Cập nhật settings khi nhận được dữ liệu từ API
    console.log(dateNotifi?.length)
    useEffect(() => {
        if (dateNotifi) {
            setSettings({
                notificationDays: parseInt(dateNotifi[dateNotifi?.length - 1]?.value) || 0,
                approvalDays: parseInt(dateNotifi[0]?.value) || 0
            });
        }
    }, [dateNotifi]);

    const handleSave = async (values) => {
        setLoading(true);
        try {
            const formData = [
                {
                    key: "1",
                    value: values?.notificationDays.toString(),
                    description: "Số ngày thông báo mặc định trước đợt thanh toán"
                },
                {
                    key: "2",
                    value: values?.approvalDays.toString(),
                    description: "Số ngày cho phép phê duyệt mặc định"
                }
            ];

            // Gửi dữ liệu lên API
            await createDateNoftifi(formData).unwrap();
            refetch();
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
        form.setFieldsValue(settings || { notificationDays: 0, approvalDays: 0 });
        setIsEditMode(true);
    };

    const handleCancel = () => {
        setIsEditMode(false);
    };

    if (isLoading) {
        return (
            <div className='flex items-center justify-center'>
                <Spin />
            </div>
        );
    }

    const renderContractSettingsContent = () => {
        if (isEditMode) {
            return (
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ ...settings, editNotificationDays: false, editApprovalDays: false }}
                    onFinish={(values) => {
                        const updatedSettings = {};
                        if ('notificationDays' in values) {
                            updatedSettings.notificationDays = values.notificationDays;
                        }
                        if ('approvalDays' in values) {
                            updatedSettings.approvalDays = values.approvalDays;
                        }
                        handleSave(updatedSettings);
                    }}
                >
                    <Form.Item name="editNotificationDays" valuePropName="checked">
                        <Checkbox>Chỉnh sửa số ngày thông báo mặc định trước đợt thanh toán</Checkbox>
                    </Form.Item>

                    <Form.Item
                        className='mt-[-20px]'
                        shouldUpdate={(prevValues, currentValues) => prevValues.editNotificationDays !== currentValues.editNotificationDays}>
                        {({ getFieldValue }) =>
                            getFieldValue('editNotificationDays') ? (
                                <Form.Item
                                    name="notificationDays"
                                    label="Số ngày thông báo mặc định trước đợt thanh toán"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập số ngày thông báo mặc định!' },
                                        { type: 'number', min: 1, message: 'Số ngày phải lớn hơn 0!' },
                                        { type: 'number', max: 90, message: 'Số ngày không được vượt quá 90!' }
                                    ]}
                                >
                                    <InputNumber
                                        min={1}
                                        max={90}
                                        addonAfter="ngày"
                                        style={{ width: '200px' }}
                                    />
                                </Form.Item>
                            ) : null
                        }
                    </Form.Item>
                    <Form.Item  name="editApprovalDays" valuePropName="checked">
                        <Checkbox>Chỉnh sửa số ngày cho phép phê duyệt mặc định</Checkbox>
                    </Form.Item>
                    <Form.Item
                        className='mt-[-20px]'
                        shouldUpdate={(prevValues, currentValues) => prevValues.editApprovalDays !== currentValues.editApprovalDays}>
                        {({ getFieldValue }) =>
                            getFieldValue('editApprovalDays') ? (
                                <Form.Item
                                    name="approvalDays"
                                    label="Số ngày cho phép phê duyệt mặc định"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập số ngày cho phép phê duyệt mặc định!' },
                                        { type: 'number', min: 1, message: 'Số ngày phải lớn hơn 0!' },
                                        { type: 'number', max: 90, message: 'Số ngày không được vượt quá 90!' }
                                    ]}
                                >
                                    <InputNumber
                                        min={1}
                                        max={90}
                                        addonAfter="ngày"
                                        style={{ width: '200px' }}
                                    />
                                </Form.Item>
                            ) : null
                        }
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
            return (
                <div>
                    {settings ? (
                        <>
                            <Descriptions title="Cài đặt hiện tại" bordered column={1}>
                                <Descriptions.Item label="Số ngày thông báo mặc định trước các ngày, đợt thanh toán">
                                    {settings.notificationDays} ngày
                                </Descriptions.Item>
                                <Descriptions.Item label="Số ngày mặc định giới hạn phê duyệt hợp đồng">
                                    {settings.approvalDays} ngày
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
                    }}
                >
                    {renderContractSettingsContent()}
                </Card>
            ),
        },
        // {
        //     key: '2',
        //     label: 'Cài đặt khác',
        //     children: (
        //         <Card
        //             style={{
        //                 boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        //                 borderRadius: '8px'
        //             }}
        //         >
        //             <Space direction="vertical" align="center" style={{ width: '100%', padding: '20px' }}>
        //                 <Title level={5}>Cài đặt khác</Title>
        //                 <Text type="secondary">Hiện tại chưa có dữ liệu cài đặt khác.</Text>
        //             </Space>
        //         </Card>
        //     ),
        // },
    ];

    return (
        <div style={{ padding: '20px', height: '100vh', overflow: 'auto' }}>
            <Title level={3}>Cài đặt hệ thống</Title>
            <Tabs defaultActiveKey="1" items={items} />
        </div>
    );
};

export default Setting;