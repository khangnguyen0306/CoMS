import React, { useState } from "react";
import { Table, Input, Space, Button, message, Tag, Skeleton, Popover, Modal, Form, Select, Tooltip, Radio, Col, Row, Tabs } from "antd";
import { EditFilled, PlusOutlined, DeleteFilled, StarFilled, StopOutlined } from "@ant-design/icons";
import { VscVmActive } from "react-icons/vsc";
import { useGetAllUserQuery, useBanUserMutation, useActiveUserMutation, useUpdateUserMutation, useAddUserMutation } from "../../services/UserAPI";
import { validationPatterns } from "../../utils/ultil";
import { useGetDepartmentsQuery } from "../../services/Department";
import Department from "../Department/Department";
import TabPane from "antd/es/tabs/TabPane";

const { Search } = Input;


const UserManagement = () => {
    const [searchText, setSearchText] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalUpdate, setIsModalUpdate] = useState(false);
    const [activeTab, setActiveTab] = useState("1");
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);

    const [form] = Form.useForm();

    const { data: userData, isLoading, isError, refetch } = useGetAllUserQuery({
        search: searchText,
        page: page - 1,
        size: size,
    });
    const { data, error, isLoading: DepartmentLoading, refetch: DepartmentRefetch } = useGetDepartmentsQuery();

    const [BanUser, { isLoading: loadingDelete }] = useBanUserMutation();
    const [ActiveUser, { isLoading: loadingActive }] = useActiveUserMutation();
    const [UpdateUser, { isLoading: loadingUpdate }] = useUpdateUserMutation();
    const [AddUser, { isLoading: loadingAdd }] = useAddUserMutation();

    const isCEO = Form.useWatch('is_ceo', form);

    console.log("Data:", userData);

    React.useEffect(() => {
        if (isCEO === true) {
            // Nếu là CEO thì tự động set role_id = 2 (Manage)
            form.setFieldsValue({ role_id: 2 });
        }
    }, [isCEO, form]);


    const filterUsers = (users) => {
        return users?.filter(user => user.role.id !== 1);
    };

    const filteredUsers = userData?.content ? filterUsers(userData?.content) : [];
    console.log("Filtered users:", userData?.content);

    const showModal = () => {
        setIsModalVisible(true);
        form.resetFields();
    };

    const handleSubmitAddUser = async (values) => {
        console.log('Form data:', values);
        if (values.is_ceo === true && values.role_id === 3) {
            message.error("Không thể tạo CEO với vai trò Staff. Vui lòng chọn vai trò Manage cho CEO!");
            return;
        }
        try {
            const result = await AddUser({ role_id: values.role_id, phone_number: values.phone_number, full_name: values.full_name, email: values.email, address: values.address, is_ceo: values.is_ceo, departmentId: values.departmentId }).unwrap();
            message.success("Tạo nhân sự thành công");
            refetch();
            setIsModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.error("Lỗi tạo nhân sự:", error);
            message.error(error?.data?.message);
        }
    };

    const showEditModal = (record) => {
        console.log("Record:", record);
        setIsModalUpdate(true);
        form.resetFields();
        form.setFieldsValue({
            id: record.id,
            full_name: record.full_name,
            phone_number: record.phone_number,
            email: record.email,
            address: record.address,
            role_id: record.role.id,
            is_ceo: record.isCeo,
            departmentId: record.department?.id,
        });
        console.log("Record:", record);
    }

    const handleSubmitEditUser = async (values) => {
        console.log('Form data:', values);
        try {
            const result = await UpdateUser({ id: values.id, full_name: values.full_name, phone_number: values.phone_number, email: values.email, address: values.address, role_id: values.role_id, is_ceo: values.is_ceo, departmentId: values.departmentId }).unwrap();
            message.success(result.message);
            refetch();
            setIsModalUpdate(false);
            form.resetFields();
        } catch (error) {
            console.error("Lỗi cập nhật thông tin:", error);
            message.error("Có lỗi xảy ra khi cập nhật thông tin!");
        }
    };

    const handleDelete = async (userId) => {
        Modal.confirm({
            title: 'Bạn có chắc muốn cấm không?',
            onOk: async () => {
                try {
                    const result = await BanUser({ userId: userId });
                    console.log(result);
                    refetch();
                    message.success(result?.data?.message);
                }
                catch (error) {
                    console.error("Error during delete:", error);
                    message.error('Cấm thất bại, vui lòng thử lại!');
                }
            },
            okText: "Cấm",
            cancelText: "Hủy"

        });
    };
    const handleActive = async (userId) => {
        Modal.confirm({
            title: 'Bạn có chắc muốn kích hoạt không?',
            onOk: async () => {
                try {
                    const result = await ActiveUser({ userId: userId });
                    refetch();
                    message.success(result?.data?.message);
                }
                catch (error) {
                    console.error("Error during delete:", error);
                    message.error('Kích hoạt thất bại, vui lòng thử lại!');
                }
            },
            okText: "Kích hoạt",
            cancelText: "Hủy"
        });
    };




    const columns = [
        {
            title: "Mã nhân viên",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: "Tên nhân viên", dataIndex: "full_name", key: "full_name",
            render: (text, record) => (
                <Popover
                    content={
                        <div className="flex flex-col gap-2">
                            <p>
                                <strong>Vai trò:</strong>{" "}
                                <Tag color={record.role.id === 2 ? "red" : "blue"} >
                                    {record.role.roleName}

                                </Tag>{record.isCeo && <StarFilled style={{ color: "#fadb14" }} />}
                            </p>
                            <p><strong>Tên:</strong> {record.full_name}</p>
                            <p><strong>Email:</strong> {record.email}</p>
                            <p><strong>Số điện thoại:</strong> {record.phone_number}</p>
                            {/* <p><strong>Ngày sinh:</strong> {new Date(record.date_of_birth).toLocaleDateString("vi-VN")}</p> */}
                        </div>
                    }
                    title="Thông tin người dùng"
                    trigger="hover"
                >
                    {
                        record.role.id === 3 ? (
                            <p className="font-bold text-gray-500">{text}</p>
                        ) : record.isCeo ? (
                            <p className="font-bold text-[#ff0000]">
                                {text} <StarFilled />
                            </p>
                        ) : (
                            <p className="font-bold text-[#228eff]">{text}</p>
                        )
                    }

                </Popover>
            ),
        },
        {
            title: "Vai trò",
            dataIndex: "role",
            key: "role",
            filters: userData
                ? Array.from(new Set(userData?.content?.map(user => user.role?.roleName))) // Lấy danh sách unique roles
                    .map(roleName => ({ text: roleName, value: roleName }))
                : [],
            onFilter: (value, record) => record.role?.roleName === value,
            render: (role) => (
                <Tag color={role?.roleName === "ADMIN" ? "red" : role?.roleName === "MANAGER" ? "blue" : "green"}>
                    {role?.roleName || "N/A"}
                </Tag>
            ),
            sorter: (a, b) => a.role?.roleName?.localeCompare(b.role?.roleName),
        },

        {
            title: "Phòng ban",
            dataIndex: ["department", "departmentName"],
            key: "department.departmentName",
            filters: data?.data.map(dept => ({
                text: dept.departmentName,
                value: dept.departmentName
            })) || [],
            onFilter: (value, record) => record?.department?.departmentName === value,
        },


        {
            title: "Hoạt động",
            dataIndex: "is_active",
            key: "is_active",
            filters: [
                { text: "Active", value: true },
                { text: "Ban", value: false },
            ],
            onFilter: (value, record) => record.is_active === value,
            render: (is_active) => (
                <Tag color={is_active ? "green" : "red"}>
                    {is_active ? "Active" : "Ban"}
                </Tag>
            ),
        },
        { title: "Email", dataIndex: "email", key: "email" },
        { title: "Số điện thoại", dataIndex: "phone_number", key: "phone_number" },
        { title: "Địa chỉ", dataIndex: "address", key: "address" },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space className="flex justify-center">
                    <Tooltip title="Cập nhật thông tin">
                        <Button
                            icon={<EditFilled style={{ color: '#2196f3' }} />}
                            onClick={() => showEditModal(record)}
                        />
                    </Tooltip>
                    {!record.isCeo && (
                        record.is_active ? (
                            <Tooltip title="Cấm">
                                <Button
                                    icon={<StopOutlined style={{ color: "#2196f3" }} />}
                                    onClick={() => handleDelete(record.id)}
                                />
                            </Tooltip>
                        ) : (
                            <Tooltip title="Kích hoạt">
                                <Button
                                    icon={<VscVmActive style={{ color: "#2196f3" }} />}
                                    onClick={() => handleActive(record.id)}
                                />
                            </Tooltip>
                        ))}
                </Space>
            ),
        },
    ];

    if (isLoading) return <Skeleton active />;
    // if (isError) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;

    return (
        <div className="min-h-[50vh] p-4">
            <Tabs
                defaultActiveKey="1"
                type="card"
                style={{ marginBottom: 32 }}
                className="mt-10"
                activeKey={activeTab}
                onChange={setActiveTab}

            >
                <TabPane tab="Quản lý nhân sự" key="1">
                    <div className="flex-1 p-4">
                        <p className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                            QUẢN LÝ NHÂN SỰ
                        </p>
                        <Modal
                            title="Thêm Nhân Sự"
                            open={isModalVisible}
                            onCancel={() => setIsModalVisible(false)}
                            footer={null}
                            width={850}
                        >
                            <Form form={form} layout="vertical" onFinish={handleSubmitAddUser}>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="full_name"
                                            label="Tên nhân sự"
                                            rules={[{ required: true, message: "Vui lòng nhập tên nhân sự!" }]}
                                        >
                                            <Input placeholder="Nhập tên nhân sự" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="phone_number"
                                            label="Số điện thoại"
                                            rules={[
                                                {
                                                    required: true,
                                                    pattern: validationPatterns.phoneNumber.pattern,
                                                    message: validationPatterns.phoneNumber.message,
                                                },
                                            ]}
                                        >
                                            <Input placeholder="Nhập sđt nhân sự" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="email"
                                            label="Email"
                                            rules={[
                                                {
                                                    required: true,
                                                    pattern: validationPatterns.email.pattern,
                                                    message: validationPatterns.email.message,
                                                },
                                            ]}
                                        >
                                            <Input placeholder="Nhập email nhân sự" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="address"
                                            label="Địa chỉ"
                                            rules={[{ required: true, message: "Vui lòng nhập địa chỉ của nhân sự!" }]}
                                        >
                                            <Input placeholder="Nhập địa chỉ" />
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="role_id"
                                            label="Chọn vai trò"
                                            rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
                                        >
                                            <Select placeholder="Chọn vai trò">
                                                <Option value={2}>Quản Lý</Option>
                                                <Option value={3}>Nhân Viên</Option>
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="departmentId"
                                            label="Chọn phòng ban"
                                            rules={[{ required: true, message: "Vui lòng chọn phòng ban!" }]}
                                        >
                                            <Select placeholder="Chọn phòng ban">
                                                {data?.data?.map((dept) => (
                                                    <Option key={dept.departmentId} value={dept.departmentId}>
                                                        {dept.departmentName}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="is_ceo"
                                            label="CEO"
                                            rules={[{ required: true, message: "Vui lòng chọn lựa!" }]}
                                        >
                                            <Radio.Group>
                                                <Radio value={true}>Có</Radio>
                                                <Radio value={false}>Không</Radio>
                                            </Radio.Group>
                                        </Form.Item>
                                    </Col>
                                </Row>
                                <Form.Item>
                                    <div className="flex justify-center">
                                        <Button type="primary" htmlType="submit" loading={loadingAdd}>
                                            Thêm nhân sự
                                        </Button>
                                    </div>
                                </Form.Item>
                            </Form>
                        </Modal>

                        <Modal
                            title="Đổi Thông Tin Nhân Sự"
                            open={isModalUpdate}
                            onCancel={() => setIsModalUpdate(false)}
                            footer={null}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={(values) => handleSubmitEditUser(values)}
                            >
                                <Form.Item
                                    name="id"
                                    style={{ display: 'none' }}
                                />

                                <Form.Item
                                    name="full_name"
                                    label="Tên nhân sự"
                                    rules={[{ required: true, message: "Vui lòng nhập tên nhân sự!" }]}
                                >
                                    <Input placeholder="Nhập tên nhận sự" />
                                </Form.Item>

                                <Form.Item
                                    name="phone_number"
                                    label="Số điện thoại"
                                    rules={[{
                                        required: true,
                                        pattern: validationPatterns.phoneNumber.pattern,
                                        message: validationPatterns.phoneNumber.message
                                    }]}
                                >
                                    <Input placeholder="Nhập sđt nhận sự" />
                                </Form.Item>

                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[{
                                        required: true,
                                        pattern: validationPatterns.email.pattern,
                                        message: validationPatterns.email.message
                                    }]}                        >
                                    <Input placeholder="Nhập email nhận sự" />
                                </Form.Item>

                                <Form.Item
                                    name="address"
                                    label="Địa chỉ"
                                    rules={[{ required: true, message: "Vui lòng nhập địa chỉ của nhân sự!" }]}
                                >
                                    <Input placeholder="Nhập tên nhận sự" />
                                </Form.Item>

                                <Form.Item
                                    name="departmentId"
                                    label="Chọn phòng ban"
                                    rules={[{ required: true, message: "Vui lòng chọn phòng ban!" }]}
                                >
                                    <Select placeholder="Chọn phòng ban">
                                        {data?.data?.map((dept) => (
                                            <Option key={dept.departmentId} value={dept.departmentId}>
                                                {dept.departmentName}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="role_id"
                                    label="Chọn vai trò"
                                    rules={[{ required: true, message: "Vui lòng chọn vai trò!" }]}
                                >
                                    <Select placeholder="Chọn vai trò">
                                        <Option value={2}>Quản Lý</Option>
                                        <Option value={3}>Nhân Viên</Option>
                                    </Select>
                                </Form.Item>

                                <Form.Item
                                    name="is_ceo"
                                    label="CEO"
                                    rules={[{ required: true, message: "Vui lòng chọn lựa!" }]}
                                >
                                    <Radio.Group>
                                        <Radio value={true}>Có</Radio>
                                        <Radio value={false}>Không</Radio>
                                    </Radio.Group>
                                </Form.Item>

                                <Form.Item>
                                    <div className="flex justify-center">
                                        <Button type="primary" htmlType="submit">
                                            Cập nhật nhân sự
                                        </Button>
                                    </div>
                                </Form.Item>
                            </Form>
                        </Modal>

                        <div className="mb-4 flex justify-between items-center gap-2">

                            <Space style={{ marginBottom: 16 }}>
                                <Search
                                    placeholder="Nhập mã nhân viên, tên hoặc email"
                                    allowClear
                                    onSearch={setSearchText}
                                    style={{ width: "100%", minWidth: 500, maxWidth: 1200, marginBottom: 20 }}
                                    enterButton="Tìm kiếm"
                                />
                            </Space>
                            <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                                Tạo nhân sự mới
                            </Button>
                        </div>
                        <Table
                            columns={columns}
                            dataSource={filteredUsers}
                            rowKey="id"
                            pagination={{
                                current: page,
                                pageSize: size,
                                total: userData?.totalElements,
                                showSizeChanger: true,
                                onChange: (page, pageSize) => {
                                    setPage(page);
                                    setSize(pageSize);
                                },
                            }}
                        />
                    </div>
                </TabPane>
                <TabPane tab="Quản lý phòng ban" key="2">
                    <Department />
                </TabPane>
            </Tabs>
        </div>

    );
};

export default UserManagement;
