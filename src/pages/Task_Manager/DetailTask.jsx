import React from "react";
import { Descriptions, Tag, Typography, Breadcrumb } from "antd";
import { useLocation, Link } from "react-router-dom";

const { Title } = Typography;

const DetailTask = () => {
    const location = useLocation();
    const task = location.state;

    if (!task) return <p>Không tìm thấy thông tin nhiệm vụ.</p>;

    return (
        <div style={{ padding: "20px" }}>
            <Breadcrumb
                items={[
                    {
                        title: <Link to={"/"} >Trang chủ</Link>,
                    },
                    {
                        title: <Link to={"/task"} >Nhiệm vụ</Link>,
                    },
                    {
                        title: <p className='font-bold'>{task.name}</p>,
                    },
                ]}
                style={{
                    margin: '0 0 20px 0',
                }}
            />
            <Title level={3} style={{ color: "#005590", textAlign: "center", marginBottom: "20px" }}>
                Chi Tiết Nhiệm Vụ
            </Title>
            <Descriptions
                bordered
                column={2}
                labelStyle={{
                    backgroundColor: "#cdf2ff",
                    color: "#005580",
                    fontWeight: "bold",
                    border: "1px solid #89c4d9",
                }}
                contentStyle={{
                    border: "1px solid #89c4d9",
                }}
            >
                <Descriptions.Item label="ID">{task.id}</Descriptions.Item>
                <Descriptions.Item label="Tên hợp đồng">{task.name}</Descriptions.Item>
                <Descriptions.Item label="Người Thực Hiện">{task.assignedTo}</Descriptions.Item>
                <Descriptions.Item label="Ngày Tạo">
                    {new Date(task.createdDate).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Người Giám Sát">
                    {Array.isArray(task.supervisor) ? task.supervisor.join(", ") : task.supervisor}
                </Descriptions.Item>
                <Descriptions.Item label="Hạn Chót">
                    {new Date(task.dueDate).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng Thái">
                    <Tag color={task.status === "Hoàn Thành" ? "green" : "red"}>{task.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Lần Xem Cuối">
                    {new Date(task.lastViewed).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Mô Tả" span={2}>
                    {task.description || "Không có mô tả"}
                </Descriptions.Item>
            </Descriptions>
        </div>
    );
};

export default DetailTask;
