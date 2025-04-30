import React, { useState } from 'react';
import { Button, Modal, Form, Input, message, Space, Skeleton, List, Divider } from 'antd';
import {
    useCreateDepartmentMutation,
    useGetDepartmentsQuery,
    useUpdateDepartmentMutation,
} from '../../services/Department';
import { EditFilled, PlusOutlined } from '@ant-design/icons';

const Department = () => {
    const { data, isLoading, refetch } = useGetDepartmentsQuery();
    const [createDepartment] = useCreateDepartmentMutation();
    const [updateDepartment] = useUpdateDepartmentMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [form] = Form.useForm();
    const [currentDepartment, setCurrentDepartment] = useState(null);

    console.log('data', currentDepartment);

    // Mở Modal Thêm Mới
    const showAddModal = () => {
        setIsEditMode(false);
        form.resetFields();
        setIsModalOpen(true);
    };

    // Mở Modal Chỉnh Sửa
    const showEditModal = (record) => {
        setIsEditMode(true);
        setCurrentDepartment(record);
        form.setFieldsValue({ departmentName: record.departmentName });
        setIsModalOpen(true);
    };

    // Xử lý Thêm hoặc Cập Nhật
    const handleSubmit = async (values) => {
        try {
            // Viết hoa chữ cái đầu tiên của tên phòng ban
            values.departmentName =
                values.departmentName.charAt(0).toUpperCase() +
                values.departmentName.slice(1);

            if (isEditMode) {
                await updateDepartment({
                    departmentId: currentDepartment.departmentId,
                    data: {
                        departmentName: values.departmentName,
                    },
                }).unwrap();
                message.success('Cập nhật phòng ban thành công!');
            } else {
                await createDepartment({
                    departmentName: values.departmentName,
                }).unwrap();
                message.success('Thêm mới phòng ban thành công!');
            }
            setIsModalOpen(false);

            form.resetFields();
            refetch();
        } catch (err) {
            message.error(err.data.message);
        }
    };

    // Cấu trúc cột của bảng
    const columns = [
        {
            title: 'Tên Phòng Ban',
            dataIndex: 'departmentName',
            key: 'departmentName',
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space>
                    <Button type="link" onClick={() => showEditModal(record)}>
                        Sửa
                    </Button>
                </Space>
            ),
        },
    ];
    if (isLoading) return <Skeleton active />;

    return (
        <div className="min-h-[100vh] p-4 w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Danh sách Phòng Ban</h2>
                <Button type="primary" onClick={showAddModal} icon={<PlusOutlined />}>
                    Thêm Phòng Ban
                </Button>
            </div>

            {/* <Table
                columns={columns}
                dataSource={data?.data}
                rowKey="id"
                pagination={{ pageSize: 10 }}
            /> */}

            <div>
                <List
                    dataSource={data?.data}
                    pagination={{ pageSize: 10 }}
                    renderItem={(item, index) => (
                        <>
                            <List.Item
                                actions={[
                                    <Button
                                        type="primary"
                                        icon={<EditFilled />}
                                        onClick={() => showEditModal(item)}
                                    >
                                        Sửa
                                    </Button>,
                                    // Thêm các hành động khác nếu cần
                                ]}
                                className="shadow-md border rounded-lg p-4 m-3"
                            >
                                <List.Item.Meta
                                    title={<span className="ml-4 text-lg">{item.departmentName}</span>}

                                />
                            </List.Item>
                            {index !== data?.data.length - 1 && <Divider style={{ margin: 0 }} />}
                        </>
                    )}
                />
            </div>


            <Modal
                title={isEditMode ? 'Chỉnh Sửa Phòng Ban' : 'Thêm Mới Phòng Ban'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                okText="Lưu"
                cancelText="Hủy"
                centered
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        label="Tên Phòng Ban"
                        name="departmentName"
                        rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên phòng ban!' }]}
                    >
                        <Input placeholder="Nhập tên phòng ban" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Department;
