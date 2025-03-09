import React from "react";
import { Layout, Card, Typography, Button, Space, Tag, Row, Col, Skeleton, Descriptions, Input } from "antd";
import { FileSearchOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useGetContractDetailQuery } from "../../services/ContractAPI";
import { useNavigate, useParams } from "react-router-dom";


const { Title, Text } = Typography;

const ReviewContract = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: contracts, isLoading, isError } = useGetContractDetailQuery(id);
    console.log(contracts)
    if (isLoading)
        return (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
                <Skeleton active />
            </div>
        );
    if (isError)
        return (
            <div style={{ textAlign: "center", marginTop: "20px", color: "red" }}>
                Error loading contracts
            </div>
        );

    // Lấy hợp đồng đầu tiên trong danh sách
    const contract = contracts.data

    const handleNavigate = () => {
        navigate(`/manager/approvalContract/reviewContract/${id}/approve/${id}`);
    };

    return (
        <div className='container mx-auto'>
            <p
                className='font-bold text-[34px] flex justify-center pb-7 bg-custom-gradient bg-clip-text text-transparent'
                style={{ textShadow: '0 0 8px rgba(0, 0, 0, 0.1' }}
            >
                XEM TRƯỚC HỢP ĐỒNG
            </p>
            {/* Nội dung chính */}
            <Row gutter={[16, 16]}>
                {/* Thông tin hợp đồng */}
                <Col xs={24} lg={16}>
                    <Card
                        bordered={false}
                        className="p-6 mb-6"
                        style={{
                            boxShadow: "0 0 12px 4px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        {/* Phần tiêu đề hợp đồng và thông tin chung */}
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                            {/* Cột trái: Mã HĐ, Người tạo, Số HĐ... */}
                            <div className="flex flex-col gap-2 w-full md:w-1/3">
                                <div>
                                    <Text className="font-bold text-blue-500">Người Tạo:</Text>
                                    <Text className="ml-2">
                                        {contract?.user?.full_name || "Chưa cập nhật"}
                                    </Text>
                                </div>
                                <div>
                                    <Text className="font-bold text-blue-500">Mã HĐ:</Text>
                                    <Text className="ml-2">{contract?.contractNumber || "Chưa cập nhật"}</Text>
                                </div>
                            </div>

                            {/* Cột giữa: Tên hợp đồng, Version... */}
                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                                    <Text className="text-xl font-bold">
                                        {contract?.title || "Chưa cập nhật"}
                                    </Text>
                                    <div className="flex flex-col items-start">
                                        <Text className="text-gray-400 text-sm md:text-base">
                                            Version hợp đồng: 2.0
                                        </Text>
                                        <Button className="mt-2" icon={<FileSearchOutlined />}>
                                            So Sánh Version Trước Đó
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Cột phải: Trạng thái, Tag, ... (tuỳ ý) */}
                            <div className="w-full md:w-1/4 flex flex-col items-start md:items-end gap-2">
                                <div>
                                    <Tag color="orange" className="text-base">
                                        Đang chờ phê duyệt
                                    </Tag>
                                </div>
                                <div>
                                    <Text className="text-sm text-gray-500">
                                        Có thể còn 1 ngày trước khi hết hạn
                                    </Text>
                                </div>
                            </div>
                        </div>

                        {/* Phần nội dung chi tiết bên dưới */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="mb-2">
                                    <Text className="font-bold text-blue-500">Đối Tác:</Text>
                                    <Text className="ml-2">{contract?.party?.partnerName || "Chưa cập nhật"}</Text>
                                </div>
                                <div className="mb-2">
                                    <Text className="font-bold text-blue-500">Giá Trị:</Text>
                                    <Text className="ml-2">
                                        {contract?.amount?.toLocaleString() || "Chưa cập nhật"} VND
                                    </Text>
                                </div>
                                <div className="mb-2">
                                    <Text className="font-bold text-blue-500">Ngày Tạo:</Text>
                                    <Text className="ml-2">
                                        {contract?.createdAt
                                            ? new Date(...contract.createdAt).toLocaleString()
                                            : "Chưa cập nhật"}
                                    </Text>
                                </div>
                                <div className="mb-2">
                                    <Text className="font-bold text-blue-500">Ngày Ký:</Text>
                                    <Text className="ml-2">
                                        {contract?.signingDate
                                            ? new Date(...contract.signingDate).toLocaleString()
                                            : "Chưa cập nhật"}
                                    </Text>
                                </div>
                            </div>

                            <div>
                                <div className="mb-2">
                                    <Text className="font-bold text-blue-500">Ngày Hiệu lực:</Text>
                                    <Text className="ml-2">
                                        {contract?.effectiveDate
                                            ? new Date(...contract.effectiveDate).toLocaleString()
                                            : "Chưa cập nhật"}
                                    </Text>
                                </div>
                                <div className="mb-2">
                                    <Text className="font-bold text-blue-500">Ngày Hết Hạn:</Text>
                                    <Text className="ml-2">
                                        {contract?.expiryDate
                                            ? new Date(...contract.expiryDate).toLocaleString()
                                            : "Chưa cập nhật"}
                                    </Text>
                                </div>
                                <div className="mb-2">
                                    <Text className="font-bold text-blue-500">Địa Điểm:</Text>
                                    <Text className="ml-2">
                                        {contract?.contractLocation || "Chưa cập nhật"}
                                    </Text>
                                </div>
                            </div>
                        </div>
                    </Card>
                </Col>

                {/* Quy trình phê duyệt & Trạng thái */}
                <Col xs={24} lg={8}>
                    {/* Danh Sách Phê Duyệt */}
                    <Card
                        bordered={false}
                        style={{
                            padding: "24px",
                            boxShadow: "0 0 12px 4px rgba(0, 0, 0, 0.2)",
                            marginBottom: "20px"
                        }}
                    >
                        <Title level={4}>Danh Sách Phê Duyệt</Title>
                        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "8px 0",
                                    borderBottom: "1px solid #f0f0f0"
                                }}
                            >
                                <Text strong>Nguyễn Văn A</Text>
                                <Text type="secondary">Quản lý phòng sale</Text>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "8px 0",
                                    borderBottom: "1px solid #f0f0f0"
                                }}
                            >
                                <Text strong>Trần Thị B</Text>
                                <Text type="secondary">Quản lý phòng marketing</Text>
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "8px 0"
                                }}
                            >
                                <Text strong>Lê Văn C</Text>
                                <Text type="secondary">Giám đốc</Text>
                            </div>
                        </Space>
                    </Card>

                    {/* Trạng Thái Phê Duyệt */}
                    <Card
                        bordered={false}
                        style={{
                            padding: "24px",
                            boxShadow: "0 0 12px 4px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        <Title level={4}>Trạng Thái Phê Duyệt</Title>
                        <Tag
                            icon={<CheckCircleOutlined />}
                            color="orange"
                            style={{ fontSize: "16px", padding: "8px 12px" }}
                        >
                            {contract.status}
                        </Tag>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default ReviewContract;
