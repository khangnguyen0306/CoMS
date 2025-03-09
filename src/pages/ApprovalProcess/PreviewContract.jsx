import React from "react";
import { Layout, Card, Typography, Button, Space, Tag, Row, Col, Skeleton, Descriptions, Input } from "antd";
import { FileSearchOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useGetContractByIdQuery } from "../../services/ContractAPI";
import { useNavigate, useParams } from "react-router-dom";


const { Title, Text } = Typography;

const PreviewContract = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data: contracts, isLoading, isError } = useGetContractByIdQuery({ id });
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
        navigate(`/manager/approvalContract/previewContract/${id}/approve/${id}`);
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
                        style={{
                            padding: "24px",
                            boxShadow: "0 0 12px 4px rgba(0, 0, 0, 0.2)",
                            marginBottom: "20px"
                        }}
                    >
                        <Card
                            className="mb-4 shadow-lg shadow-black/20"
                        >
                            <div style={{ textAlign: "center", marginBottom: "20px" }}>
                                <Button onClick={handleNavigate} type="primary" icon={<FileSearchOutlined />} size="large">
                                    Xem Chi Tiết Hợp Đồng
                                </Button>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#1890ff" }}>
                                    Người Tạo:
                                </Text>
                                <Text style={{ fontSize: "16px", marginLeft: "8px" }}>
                                    {contract?.user?.full_name || "Chưa cập nhật"}
                                </Text>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#1890ff" }}>
                                    Tên Hợp Đồng:
                                </Text>
                                <Text style={{ fontSize: "16px", marginLeft: "8px" }}>
                                    {contract?.title || "Chưa cập nhật"}
                                </Text>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#1890ff" }}>
                                    Số Hợp Đồng:
                                </Text>
                                <Text style={{ fontSize: "16px", marginLeft: "8px" }}>
                                    {contract?.contractNumber || "Chưa cập nhật"}
                                </Text>
                            </div>

                            <div style={{ marginBottom: "20px" }}>
                                <Text strong style={{ color: "#1890ff", display: "inline-block" }}>
                                    Version Hợp Đồng:
                                </Text>
                                <Text style={{ fontSize: "16px", marginLeft: "10px" }}>2.0</Text>
                                <div style={{ marginTop: "10px" }}>
                                    <Button >So Sánh Version Trước Đó</Button>
                                </div>
                            </div>
                        </Card>
                        <Card
                            className="shadow-lg shadow-black/20"
                        >
                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#1890ff" }}>
                                    Đối Tác:
                                </Text>
                                <Text style={{ fontSize: "16px", marginLeft: "8px" }}>
                                    {contract?.party?.partnerName || "Chưa cập nhật"}
                                </Text>
                            </div>



                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#1890ff" }}>
                                    Giá Trị:
                                </Text>
                                <Text style={{ fontSize: "16px", marginLeft: "8px" }}>
                                    {contract.amount.toLocaleString() || "Chưa cập nhật"} VND
                                </Text>
                            </div>



                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#1890ff" }}>
                                    Ngày Tạo:
                                </Text>
                                <Text style={{ fontSize: "16px", marginLeft: "8px" }}>
                                    {contract?.createdAt ? new Date(...contract.createdAt).toLocaleString() : "Chưa cập nhật"}
                                </Text>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#1890ff" }}>
                                    Ngày Ký:
                                </Text>
                                <Text style={{ fontSize: "16px", marginLeft: "8px" }}>
                                    {contract?.signingDate ? new Date(...contract.signingDate).toLocaleString() : "Chưa cập nhật"}
                                </Text>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#1890ff" }}>
                                    Ngày Hiệu lực:
                                </Text>
                                <Text style={{ fontSize: "16px", marginLeft: "8px" }}>
                                    {contract?.effectiveDate ? new Date(...contract.effectiveDate).toLocaleString() : "Chưa cập nhật"}
                                </Text>
                            </div>

                            <div style={{ marginBottom: "10px" }}>
                                <Text strong style={{ color: "#1890ff" }}>
                                    Ngày Hết Hạn:
                                </Text>
                                <Text style={{ fontSize: "16px", marginLeft: "8px" }}>
                                    {contract?.expiryDate ? new Date(...contract.expiryDate).toLocaleString() : "Chưa cập nhật"}
                                </Text>
                            </div>
                        </Card>


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

export default PreviewContract;
