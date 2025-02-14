import React, { useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Tag, Skeleton, Empty, Card, Popover } from "antd";
import { EditOutlined, DeleteOutlined, SettingOutlined, EditFilled } from "@ant-design/icons";
import { BsClipboard2DataFill } from "react-icons/bs";
import { IoNotifications } from "react-icons/io5";
import { useGetAllUserQuery, useGetAllUserRoleQuery } from "../../services/UserAPI";
import { label } from "framer-motion/client";

const { Search } = Input;


const UserManagement = () => {
    const { data: userData, isLoading, isError } = useGetAllUserQuery();
    const { data: userRole, isloading: isLoadingRole, isError: isRoleError } = useGetAllUserRoleQuery();
    const [searchText, setSearchText] = useState("");


    const handleDelete = (record) => {
        message.success("Xóa nhân viên thành công!");
    };

    const columns = [
        { title: "Mã nhân viên", dataIndex: "id", key: "id" },
        {
            title: "Tên nhân viên", dataIndex: "name", key: "name",
            render: (text, record) => (
                <Popover
                    content={
                        <div className="flex flex-col gap-2">
                            <p><strong>Vai trò:</strong> <Tag color={record.role === "Giám đốc" ? "red" : record.role === "Nhân viên" ? "blue" : "green"}>{record.role}</Tag></p>
                            <p><strong>Tên:</strong> {record.name}</p>
                            <p><strong>Email:</strong> {record.email}</p>
                            <p><strong>Số điện thoại:</strong> {record.phone}</p>
                            <p><strong>Ngày sinh:</strong> {new Date(record.dob).toLocaleDateString("vi-VN")}</p>
                        </div>
                    }
                    title="Thông tin người dùng"
                    trigger="hover"
                >
                    <p className="font-bold text-[#228eff]">{text}</p>
                </Popover>
            ),
        },
        {
            title: "Vai trò",
            dataIndex: "role",
            label: userRole?.map(role => role.description),
            key: "role",
            filters: userRole?.map(role => ({ text: role.name, value: role.name })),
            onFilter: (value, record) => record.role === value,
            render: (role) => <Tag color={role === "Giám đốc" ? "red" : role === "Nhân viên" ? "blue" : "green"}>{role}</Tag>,
            sorter: (a, b) => a.role.localeCompare(b.role),
        },
        {
            title: "Ngày sinh",
            dataIndex: "dob",
            key: "dob",
            render: (text) => new Date(text).toLocaleDateString("vi-VN")
        },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Số điện thoại", dataIndex: "phone", key: "phone" },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Dropdown
                        menu={{
                            items: [
                                { key: "edit", icon: <EditFilled style={{ color: '#228eff' }} />, label: "Sửa", onClick: () => message.info("Cập nhật nhân viên!") },
                                { key: "delete", icon: <DeleteOutlined />, label: "Xóa", danger: true, onClick: () => handleDelete(record) },
                            ],
                        }}
                    >
                        <Button><SettingOutlined /></Button>
                    </Dropdown>
                </Space>
            ),
        },
    ];

    if (isLoading || isLoadingRole) return <Skeleton active />;
    if (isError || isRoleError) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;
    if (!userRole) return <Card><Empty description="Không có dữ liệu để hiển thị" /></Card>;

    return (
        <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    QUẢN LÝ NHÂN SỰ
                </p>
                <Space style={{ marginBottom: 16 }}>
                    <Search
                        placeholder="Nhập mã nhân viên, tên hoặc email"
                        allowClear
                        onSearch={setSearchText}
                        style={{ width: "100%", minWidth: 500, maxWidth: 1200, marginBottom: 20 }}
                        enterButton="Tìm kiếm"
                    />
                </Space>
                <Table
                    columns={columns}
                    dataSource={userData?.filter(item =>
                        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                        item.email.toLowerCase().includes(searchText.toLowerCase()) ||
                        item.id.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    rowKey="id"
                />
            </div>
        </div>
    );
};

export default UserManagement;
