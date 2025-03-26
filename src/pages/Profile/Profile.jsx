import React, { useState } from "react";
import { Modal, Form, Input, Button, message, Typography, Space, Skeleton, DatePicker, Select, Divider } from "antd";
import { useParams } from "react-router-dom";
import { useGetUserByIdQuery, useUpdateUserMutation } from "../../services/UserAPI";
import dayjs from "dayjs";
import { useGetDepartmentsQuery } from "../../services/Department";
import partnerIMG from "../../assets/Image/partner.jpg";
import { EditFilled, MailFilled } from "@ant-design/icons";
import { MdPlace } from "react-icons/md";

const { Title } = Typography;

const Profile = () => {
    const { id } = useParams();
    const { data, isLoading } = useGetUserByIdQuery({ id });
    const { data: departmentData, isLoading: DepartmentLoading } = useGetDepartmentsQuery();
    const [updateUser] = useUpdateUserMutation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [form] = Form.useForm();

    const handleUpdateClick = () => {
        form.setFieldsValue({
            full_name: data?.full_name,
            department_id: data?.department?.id,
            date_of_birth: data?.date_of_birth
                ? dayjs(
                    `${data.date_of_birth[0]}-${data.date_of_birth[1].toString().padStart(2, "0")}-${data.date_of_birth[2].toString().padStart(2, "0")}`
                )
                : null,
            phone_number: data?.phone_number,
            address: data?.address,
            email: data?.email,
        });
        setIsModalOpen(true);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            await updateUser({
                id: id,
                email: values.email,
                address: values.address,
                phone_number: values.phone_number,
                dateOfBirth: values.date_of_birth ? values.date_of_birth.toISOString() : null,
                full_name: values.full_name,
                departmentId: values.department_id,
                is_ceo: data?.is_ceo,
                role_id: data?.role.id,
            }).unwrap();
            message.success("Profile updated successfully!");
            setIsModalOpen(false);
            form.resetFields();
        } catch (error) {
            message.error("Update failed, please try again.");
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setIsModalOpen(false);
    };

    if (isLoading || DepartmentLoading) return <Skeleton active />;

    return (
        <div className="flex p-6 min-h-screen">
            {/* Sidebar */}
            <div className="w-[30%]  p-6 rounded-lg ">
                <div className="flex flex-col items-center">
                    <img
                        src={data?.employeeCode || partnerIMG}
                        alt="Profile"
                        className="w-[220px] h-[220px] mb-[60px] border-4 border-white shadow-md object-cover"
                    />
                    <Divider className="mt-[40px]"><p>Liên lạc</p></Divider>

                    {/* Buttons */}
                    <div className="mt-4 flex flex-col gap-2 w-full">
                        <Button type="primary" icon={<MailFilled />}>
                            Gửi email
                        </Button>
                    </div>

                </div>
            </div>

            {/* Main Content Area */}
            <div className="w-[70%] ml-6 bg-white p-6 rounded-lg relative">
                <Button type="primary" icon={<EditFilled />} onClick={handleUpdateClick} className="absolute right-0">
                    Cập nhật thông tin
                </Button>
                <div className="space-y-4">
                    <div className="flex items-end gap-8">
                        <p className="font-semibold text-black text-3xl">{data?.full_name}</p>
                        <p className="flex mb-1 items-center text-gray-700 text-sm"> <MdPlace style={{ fontSize: '20px', marginBottom: '5px', color: 'grey',marginRight:'7px' }} /> {data?.address || "Chưa cập nhật"}</p>
                    </div>
                    <p></p>
                    <div>
                        <span className="font-bold text-black">Phone: </span>
                        <a href={`tel:${data?.phone_number}`} className="text-[#007bff] underline">
                            {data?.phone_number || "+1 123 456 7890"}
                        </a>
                    </div>
                    <div>
                        <span className="font-bold text-black">Email: </span>
                        <a href={`mailto:${data?.email}`} className="text-[#007bff] underline">
                            {data?.email || "hello@jeremyrose.com"}
                        </a>
                    </div>
                    <div>
                        <span className="font-bold text-black">Site: </span>
                        <a href="https://jeremyrose.com" className="text-[#007bff] underline">
                            jeremyrose.com
                        </a>
                    </div>
                    <div>
                        <span className="font-bold text-black">Birthday: </span>
                        <span className="text-gray-800">
                            {data?.date_of_birth
                                ? dayjs(new Date(data.date_of_birth[0], data.date_of_birth[1] - 1, data.date_of_birth[2])).format("MMMM D, YYYY")
                                : "June 5, 1982"}
                        </span>
                    </div>
                    <div>
                        <span className="font-bold text-black">Gender: </span>
                        <span className="text-gray-800">Male</span>
                    </div>
                </div>

            </div>

            {/* Modal */}
            <Modal
                title="Update Personal Information"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                className="rounded-lg"
            >
                <Form form={form} layout="vertical" onFinish={handleOk}>
                    <div className="grid grid-cols-2 gap-4">
                        <Form.Item name="full_name" label="Full Name" rules={[{ required: true, message: "Please enter your full name!" }]}>
                            <Input placeholder="Enter full name" />
                        </Form.Item>
                        <Form.Item name="department_id" label="Department" rules={[{ required: true, message: "Please select a department!" }]}>
                            <Select placeholder="Select department">
                                {departmentData?.data?.map((dept) => (
                                    <Select.Option key={dept.departmentName} value={dept.departmentId}>
                                        {dept.departmentName}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="date_of_birth"
                            label="Date of Birth"
                            rules={[{ required: true, message: "Please select your date of birth!" }]}
                        >
                            <DatePicker className="w-full" placeholder="Select date of birth" format="DD-MM-YYYY" />
                        </Form.Item>
                        <Form.Item name="phone_number" label="Phone" rules={[{ required: true, message: "Please enter your phone number!" }]}>
                            <Input placeholder="Enter phone number" />
                        </Form.Item>
                        <Form.Item name="address" label="Address" rules={[{ required: true, message: "Please enter your address!" }]}>
                            <Input placeholder="Enter address" />
                        </Form.Item>
                        <Form.Item name="email" label="Email" rules={[{ required: true, message: "Please enter your email!" }]}>
                            <Input placeholder="Enter email" />
                        </Form.Item>
                    </div>
                    <Form.Item>
                        <Space className="flex justify-end">
                            <Button type="primary" htmlType="submit" className="bg-[#007bff]">
                                Save Updates
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