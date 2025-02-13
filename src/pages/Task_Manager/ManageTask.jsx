import React, { useState, useEffect } from "react";
import { Table, Modal, Form, Input, Select, DatePicker, Button, Space, message, Tag, Typography } from "antd";
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGetTaskManageQuery } from '../../services/TaskAPI';


const { Option } = Select;
const { Link } = Typography;

const ManageTask = () => {
    const { data: taskData, isLoading: isFetching, error: fetchError } = useGetTaskManageQuery();
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [users, setUsers] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();

    console.log(taskData)

    // Load data into state
    useEffect(() => {
        if (taskData) {
            setTasks(taskData.tasks || []);
            setUsers(taskData.users || []);
        }
    }, [taskData]);

    // Handle adding a new task
    const handleAddTask = async (values) => {
        const newTask = {
            id: tasks.length + 1, // Giả định ID tăng dần
            name: values.name,
            assignedTo: values.assignedTo,
            dueDate: values.dueDate.format("YYYY-MM-DD"),
            createdDate: new Date().toISOString().split("T")[0],
            status: "Đã được giao",
            priority: values.priority,
            supervisor: values.supervisor,
        };

        setTasks((prevTasks) => [...prevTasks, newTask]);
        message.success("Task đã được thêm thành công!");
        form.resetFields();
        setIsModalVisible(false);
    };

    const navigateToDetail = (record) => {
        console.log("record", record);
        navigate(`/task/${record.id}`, { state: record });
    };

    // Columns for the task table
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: "Tên Yêu Cầu",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Link
                    onClick={() => navigateToDetail(record)}
                    className="font-medium hover:text-blue-600"
                >
                    {text}
                </Link>
            ),
        },
        {
            title: "Người Thực Hiện",
            dataIndex: "assignedTo",
            key: "assignedTo",
        },
        // {
        //     title: "Ưu Tiên",
        //     dataIndex: "priority",
        //     key: "priority",
        //     filters: [
        //         { text: "Cao", value: "Cao" },
        //         { text: "Trung bình", value: "Trung bình" },
        //         { text: "Thấp", value: "Thấp" },
        //     ],
        //     onFilter: (value, record) => record.status === value,
        //     render: (priority) => {
        //         let color;
        //         if (priority === "Cao") {
        //             color = "red";
        //         } else if (priority === "Trung bình") {
        //             color = "yellow";
        //         } else if (priority === "Thấp") {
        //             color = "green";
        //         }
        //         return <Tag color={color}>{priority}</Tag>;
        //     },
        // },
        {
            title: "Người Giám Sát",
            dataIndex: "supervisor",
            key: "supervisor",
            render: (supervisors) => {
                if (Array.isArray(supervisors)) {
                    return supervisors.join(", ");
                }
                if (typeof supervisors === "string") {
                    return supervisors;
                }
                return "";
            },
        },
        {
            title: "Ngày Tạo",
            dataIndex: "createdDate",
            key: "createdDate",
            sorter: (a, b) => new Date(a.createdDate) - new Date(b.createdDate),
        },
        // {
        //     title: "Lần cuối xem hợp đồng",
        //     dataIndex: "lastViewed",
        //     key: "lastViewed",
        //     sorter: (a, b) => new Date(a.lastViewed) - new Date(b.lastViewed),
        // },

        {
            title: "Ngày Dự Kiến Hoàn Thành",
            dataIndex: "dueDate",
            key: "dueDate",
            sorter: (a, b) => new Date(a.dueDate) - new Date(b.dueDate),

        },
        {
            title: "Trạng Thái",
            dataIndex: "status",
            key: "status",
            filters: [
                { text: "Đã được giao", value: "Đã được giao" },
                { text: "Đang thực hiện", value: "Đang thực hiện" },
                { text: "Chờ xác nhận", value: "Chờ xác nhận" },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status) => {
                let color;
                if (status === "Đã được giao") {
                    color = "blue";
                } else if (status === "Đang thực hiện") {
                    color = "orange";
                } else if (status === "Chờ xác nhận") {
                    color = "green";
                }
                return <Tag color={color}>{status}</Tag>;
            },
        },
        {
            title: 'Thao tác',
            width: '100px',
            render: (_, record) => (
                <Space className="flex justify-center">
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => {
                            navigateToDetail(record);
                        }}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: "20px" }}>
     <p className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                QUẢN LÝ TASK
                </p>
            <Space style={{ marginBottom: "20px", display: "flex", justifyContent: "flex-end" }}>
                <Button type="primary" onClick={() => setIsModalVisible(true)}>
                    Tạo Task Mới
                </Button>
            </Space>

            <Table
                columns={columns}
                dataSource={tasks}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                bordered
            // scroll={{ x: 1500 }}
            />

            <Modal
                title="Tạo Task Mới"
                visible={isModalVisible}
                onCancel={() => setIsModalVisible(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleAddTask}>
                    <Form.Item
                        name="name"
                        label="Tên Task"
                        rules={[{ required: true, message: "Vui lòng nhập tên task!" }]}
                    >
                        <Input placeholder="Nhập tên task" />
                    </Form.Item>

                    <Form.Item
                        name="assignedTo"
                        label="Người Chịu Trách Nhiệm Chính"
                        rules={[{ required: true, message: "Vui lòng chọn người thực hiện!" }]}
                    >
                        <Select placeholder="Chọn nhân viên">
                            {users?.map((user) => (
                                <Option key={user.name} value={user.name}>
                                    {user.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    {/* <Form.Item
                        name="priority"
                        label="Ưu Tiên"
                        rules={[{ required: true, message: "Vui lòng chọn mức độ ưu tiên!" }]}
                    >
                        <Select placeholder="Chọn mức độ ưu tiên">
                            <Option value="Cao">Cao</Option>
                            <Option value="Trung bình">Trung bình</Option>
                            <Option value="Thấp">Thấp</Option>
                        </Select>
                    </Form.Item> */}


                    <Form.Item
                        name="supervisor"
                        label="Người Giám Sát"
                        rules={[{ required: true, message: "Vui lòng chọn ít nhất một giám sát!" }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Chọn nhân viên giám sát"
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {users
                                .filter((user) => {
                                    const assignedTo = form.getFieldValue("assignedTo");
                                    return user.name !== assignedTo;
                                })
                                .map((user) => (
                                    <Option key={user.name} value={user.name}>
                                        {user.name}
                                    </Option>
                                ))}
                        </Select>
                    </Form.Item>


                    <Form.Item
                        name="dueDate"
                        label="Ngày Hoàn Thành"
                        rules={[{ required: true, message: "Vui lòng chọn ngày hoàn thành!" }]}
                    >
                        <DatePicker />
                    </Form.Item>

                    <Form.Item
                        name="description"
                        label="Mô Tả"
                        rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>


                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Tạo Task
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ManageTask;
