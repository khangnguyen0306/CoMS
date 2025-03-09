import React, { useState } from "react";
import { Modal, Form, Input, Button, message, Typography, Space, Skeleton } from "antd";
import { useParams } from "react-router-dom";
import { useGetUserByIdQuery, useUpdateUserMutation } from "../../services/UserAPI";
import LOGO from './../../assets/Image/letterC.svg'

const { Title } = Typography;

const Profile = () => {
    const { id } = useParams();
    const { data, isLoading } = useGetUserByIdQuery({ id });
    const [updateUser] = useUpdateUserMutation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();
    console.log(data?.role.id)
    const handleUpdateClick = () => {
        // Set các giá trị hiện có vào form
        form.setFieldsValue({
            full_name: data?.full_name,
            department: data?.position,
            date_of_birth: data?.date_of_birth,
            phone_number: data?.phone_number,
            address: data?.address,
            email: data?.email,
        });
        setIsModalOpen(true);
    };

    const handleOk = async () => {
        console.log("Form values:");
        try {
            const values = await form.validateFields();
            console.log("Form values:", values);
            const updatedData = await updateUser({
                id: id,
                email: values.email,
                address: values.address,
                phone_number: values.phone_number,
                date_of_birth: values.date_of_birth,
                full_name: values.full_name,
                is_ceo: data.is_ceo,
                role_id: data.role.id,
            }).unwrap();
            console.log("Updated user:", updatedData);
            message.success("Profile updated successfully!");
            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            console.error("Update error:", error);
            message.error("Update failed, please try again.");
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setIsModalOpen(false);
    };

    if (isLoading) return <Skeleton active />;

    return (
        <div className="flex justify-center p-6">
            {/* Profile Card */}
            <div className="w-[800px] bg-white rounded-lg shadow-lg overflow-hidden">
                {/* Header */}
                <div className="relative">
                    <div className="p-8 bg-[#2095f2]">
                        <div className="w-48 h-60 mx-auto">
                            <img
                                src={LOGO}
                                alt="Company Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                    <div className="h-3 bg-gray-600"></div>
                    <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-20">
                        <div className="w-40 h-40 rounded-full border-4 border-white overflow-hidden">
                            <img
                                src="https://faceinch.vn/upload/elfinder/%E1%BA%A2nh/chup-chan-dung-5.jpg"
                                alt="Employee"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
                {/* Card Content */}
                <div className="mt-36 grid grid-cols-2 gap-x-12 gap-y-4 px-8 pb-8">
                    <div className="flex items-center">
                        <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#2095f2" }}>
                            Mã Nhân Viên
                        </span>
                        <span className="text-gray-800 font-semibold text-lg"> : {data?.employeeCode ? data.employeeCode : "Chưa cập nhật"}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#2095f2" }}>
                            Năm Sinh
                        </span>
                        <span className="text-gray-800 font-semibold text-lg">
                            : {data?.date_of_birth ? data.date_of_birth : "Chưa cập nhật"}
                        </span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#2095f2" }}>
                            Điện Thoại
                        </span>
                        <span className="text-gray-800 font-semibold text-lg">: {data?.phone_number}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#2095f2" }}>
                            Họ Và Tên
                        </span>
                        <span className="text-gray-800 font-semibold text-lg">: {data?.full_name}</span>
                    </div>

                    <div className="flex items-center">
                        <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#2095f2" }}>
                            Tuổi
                        </span>
                        <span className="text-gray-800 font-semibold text-lg">: {data?.age ? data.age : "Chưa cập nhật"}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#2095f2" }}>
                            Địa chỉ
                        </span>
                        <span className="text-gray-800 font-semibold text-lg">: {data?.address}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#2095f2" }}>
                            Phong Ban
                        </span>
                        <span className="text-gray-800 font-semibold text-lg"> : {data?.department ? data.department : "Chưa cập nhật"}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#2095f2" }}>
                            Email
                        </span>
                        <span className="text-gray-800 font-semibold text-lg">: {data?.email}</span>
                    </div>
                </div>
                {/* Update Button */}
                <div className="mt-8 text-center pb-12">
                    <button
                        className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                        onClick={handleUpdateClick}
                    >
                        Update
                    </button>
                </div>
            </div>

            {/* Modal Update */}
            <Modal
                title="Cập nhật thông tin cá nhân"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleOk}>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                            name="full_name"
                            label="Họ và Tên"
                            rules={[{ required: true, message: "Vui lòng nhập họ và tên!" }]}
                        >
                            <Input placeholder="Nhập họ và tên" />
                        </Form.Item>
                        {/* <Form.Item
                            name="department"
                            label="Phòng ban"
                            rules={[{ required: true, message: "Vui lòng nhập phòng ban!" }]}
                        >
                            <Input placeholder="Nhập phòng ban" />
                        </Form.Item> */}
                        <Form.Item
                            name="date_of_birth"
                            label="Năm Sinh"
                        >
                            <Input placeholder="Nhập năm sinh" />
                        </Form.Item>
                        <Form.Item
                            name="phone_number"
                            label="Điện thoại"
                            rules={[{ required: true, message: "Vui lòng nhập số điện thoại!" }]}
                        >
                            <Input placeholder="Nhập số điện thoại" />
                        </Form.Item>
                        <Form.Item
                            name="address"
                            label="Địa chỉ"
                            rules={[{ required: true, message: "Vui lòng nhập địa chỉ!" }]}
                        >
                            <Input placeholder="Nhập địa chỉ" />
                        </Form.Item>
                        <Form.Item
                            name="email"
                            label="Email"
                            rules={[{ required: true, message: "Vui lòng nhập email!" }]}
                        >
                            <Input placeholder="Nhập email" />
                        </Form.Item>
                    </div>
                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit">
                                OK
                            </Button>
                            <Button onClick={handleCancel}>Cancel</Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

        </div>
    );
};

export default Profile;
