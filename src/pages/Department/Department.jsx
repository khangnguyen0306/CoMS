import React, { useState } from 'react';
import { Table, Button, Modal, Form, Input, message, Space } from 'antd';
import {
    useCreateDepartmentMutation,
    useGetDepartmentsQuery,
    useUpdateDepartmentMutation,
} from '../../services/Department';

const Department = () => {
    const { data, error, isLoading, refetch } = useGetDepartmentsQuery();
    const [createDepartment] = useCreateDepartmentMutation();
    const [updateDepartment] = useUpdateDepartmentMutation();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [form] = Form.useForm();
    const [currentDepartment, setCurrentDepartment] = useState(null);

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
            if (isEditMode) {
                await updateDepartment({
                    id: currentDepartment.id,
                    data: {
                        departmentId: currentDepartment.id,
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
            refetch();
        } catch (err) {
            message.error('Đã xảy ra lỗi!');
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

    return (
        <div className="min-h-[100vh] p-4 w-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Danh sách Phòng Ban</h2>
                <Button type="primary" onClick={showAddModal}>
                    Thêm Phòng Ban
                </Button>
            </div>

            <Table
                columns={columns}
                dataSource={data?.data}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={isEditMode ? 'Chỉnh Sửa Phòng Ban' : 'Thêm Mới Phòng Ban'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        label="Tên Phòng Ban"
                        name="departmentName"
                        rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban!' }]}
                    >
                        <Input placeholder="Nhập tên phòng ban" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default Department;
