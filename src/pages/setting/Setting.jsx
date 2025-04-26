import React, { useState, useEffect } from 'react';
import {
    Tabs,
    Form,
    InputNumber,
    Button,
    Card,
    Space,
    Typography,
    message,
    Descriptions,
    Spin,
} from 'antd';
import { SaveOutlined, EditFilled } from '@ant-design/icons';
import {
    useCreateDateNofiticationMutation,
    useGetDateNofitifationQuery,
} from '../../services/ConfigAPI';

const { Title, Text } = Typography;

const Setting = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [editingField, setEditingField] = useState(null); // 'notificationDays', 'approvalDays', 'create'

    const { data: dateNotifi, isLoading, refetch } = useGetDateNofitifationQuery();
    const [createDateNoftifi] = useCreateDateNofiticationMutation();
    const [settings, setSettings] = useState(null);

    // Map API data to settings
    useEffect(() => {
        if (Array.isArray(dateNotifi) && dateNotifi.length) {
            setSettings({
                approvalDays: parseInt(dateNotifi.find(item => item.key === 'APPROVAL_DEADLINE')?.value, 10) || 0,
                notificationDays: parseInt(dateNotifi.find(item => item.key === 'PAYMENT_DEADLINE')?.value, 10) || 0,
            });
        }
    }, [dateNotifi]);

    // Save a single field or both
    const handleSave = async (values) => {
        // console.log(values)
        setLoading(true);
        try {
            let payload = {};

            if (editingField === 'notificationDays') {
                payload = {
                    configId: 2,
                    key: 'PAYMENT_DEADLINE',
                    value: values.notificationDays.toString(),
                };
            } else {
                payload = {
                    configId: 1,
                    key: 'APPROVAL_DEADLINE',
                    value: values.approvalDays.toString(),
                };
            }

            // console.log(payload)
            await createDateNoftifi(payload).unwrap();
            refetch();
            setEditingField(null);
            message.success('Cài đặt đã được lưu thành công!');
        } catch (error) {
            console.error('Error saving settings:', error);
            message.error('Đã xảy ra lỗi khi lưu cài đặt!');
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center">
                <Spin />
            </div>
        );
    }

    // Render content
    const renderContent = () => {
        // Creation form when no prior settings
        // if (!settings) {
        //     if (editingField === 'create') {
        //         return (
        //             <Form
        //                 form={form}
        //                 layout="vertical"
        //                 initialValues={{ notificationDays: 0, approvalDays: 0 }}
        //                 onFinish={handleSave}
        //             >
        //                 <Form.Item
        //                     name="notificationDays"
        //                     label="Số ngày thông báo mặc định trước đợt thanh toán"
        //                     rules={[
        //                         { required: true, message: 'Vui lòng nhập số ngày thông báo!' },
        //                         { type: 'number', min: 1, message: 'Số ngày phải lớn hơn 0!' },
        //                         { type: 'number', max: 90, message: 'Số ngày không được vượt quá 90!' },
        //                     ]}
        //                 >
        //                     <InputNumber min={1} max={90} addonAfter="ngày" />
        //                 </Form.Item>

        //                 <Form.Item
        //                     name="approvalDays"
        //                     label="Số ngày cho phép phê duyệt mặc định"
        //                     rules={[
        //                         { required: true, message: 'Vui lòng nhập số ngày phê duyệt!' },
        //                         { type: 'number', min: 1, message: 'Số ngày phải lớn hơn 0!' },
        //                         { type: 'number', max: 90, message: 'Số ngày không được vượt quá 90!' },
        //                     ]}
        //                 >
        //                     <InputNumber min={1} max={90} addonAfter="ngày" />
        //                 </Form.Item>

        //                 <Form.Item>
        //                     <Space>
        //                         <Button
        //                             type="primary"
        //                             htmlType="submit"
        //                             icon={<SaveOutlined />}
        //                             loading={loading}
        //                         >
        //                             Lưu cài đặt
        //                         </Button>
        //                         <Button onClick={() => setEditingField(null)}>Hủy</Button>
        //                     </Space>
        //                 </Form.Item>
        //             </Form>
        //         );
        //     }

        //     return (
        //         <div style={{ textAlign: 'center', padding: 30 }}>
        //             <Space direction="vertical" size="large">
        //                 <Text>Chưa có cài đặt thông tin hợp đồng.</Text>
        //                 <Button
        //                     type="primary"
        //                     icon={<PlusOutlined />}
        //                     onClick={() => setEditingField('create')}
        //                 >
        //                     Thêm cài đặt
        //                 </Button>
        //             </Space>
        //         </div>
        //     );
        // }

        // When have settings
        return (
            <Descriptions title="Cài đặt hiện tại" bordered column={1}>
                {/* Notification Days */}
                <Descriptions.Item label="Số ngày thông báo mặc định trước đợt thanh toán">
                    <Space className='flex justify-between'>
                        <Text>{settings?.notificationDays} ngày</Text>
                        {!editingField && (
                            <Button
                                size="middle"
                                className='ml-3'
                                icon={<EditFilled />}
                                onClick={() => {
                                    setEditingField('notificationDays');
                                    form.setFieldsValue({ notificationDays: settings?.notificationDays });
                                }}
                            >
                                Sửa
                            </Button>
                        )}
                    </Space>
                </Descriptions.Item>
                {editingField === 'notificationDays' && (
                    <Descriptions.Item>
                        <Form
                            form={form}
                            layout="inline"
                            initialValues={{ notificationDays: settings?.notificationDays }}
                            onFinish={(vals) => handleSave({ notificationDays: vals.notificationDays })}
                            style={{ marginBottom: 16 }}
                        >
                            <Form.Item
                                name="notificationDays"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số ngày thông báo!' },
                                    { type: 'number', min: 1, message: 'Số ngày phải lớn hơn 0!' },
                                    { type: 'number', max: 90, message: 'Số ngày không được vượt quá 90!' },
                                ]}
                            >
                                <InputNumber min={1} max={90} addonAfter="ngày" />
                            </Form.Item>
                            <Form.Item>
                                <Space>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<SaveOutlined />}
                                        loading={loading}
                                    >
                                        Lưu
                                    </Button>
                                    <Button onClick={() => setEditingField(null)}>Hủy</Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Descriptions.Item>
                )}

                {/* Approval Days */}
                <Descriptions.Item label="Thông báo trước cho giám đốc khi hợp đồng chưa được phê duyệt trước">
                    <Space className='flex justify-between'>
                        <Text>{settings?.approvalDays} ngày</Text>
                        {!editingField && (
                            <Button
                                size="middle"
                                className='ml-3'
                                icon={<EditFilled />}
                                onClick={() => {
                                    setEditingField('approvalDays');
                                    form.setFieldsValue({ approvalDays: settings?.approvalDays });
                                }}
                            >
                                Sửa
                            </Button>
                        )}
                    </Space>
                </Descriptions.Item>
                {editingField === 'approvalDays' && (
                    <Descriptions.Item>
                        <Form
                            form={form}
                            layout="inline"
                            initialValues={{ approvalDays: settings?.approvalDays }}
                            onFinish={(vals) => handleSave({ approvalDays: vals.approvalDays })}
                            style={{ marginBottom: 16 }}
                        >
                            <Form.Item
                                name="approvalDays"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số ngày phê duyệt!' },
                                    { type: 'number', min: 1, message: 'Số ngày phải lớn hơn 0!' },
                                    { type: 'number', max: 90, message: 'Số ngày không được vượt quá 90!' },
                                ]}
                            >
                                <InputNumber min={1} max={90} addonAfter="ngày" />
                            </Form.Item>
                            <Form.Item>
                                <Space>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        icon={<SaveOutlined />}
                                        loading={loading}
                                    >
                                        Lưu
                                    </Button>
                                    <Button onClick={() => setEditingField(null)}>Hủy</Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </Descriptions.Item>
                )}
            </Descriptions>
        );
    };

    const items = [
        {
            key: '1',
            label: 'Cài đặt thông tin hợp đồng',
            children: (
                <Card style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', borderRadius: 8 }}>
                    {renderContent()}
                </Card>
            ),
        },
    ];

    return (
        <div style={{ padding: 20, height: '100vh', overflow: 'auto' }}>
            <Title level={3}>Cài đặt hệ thống</Title>
            <Tabs defaultActiveKey="1" items={items} />
        </div>
    );
};

export default Setting;
