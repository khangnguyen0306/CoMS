import React from "react";
import { Layout, Card, Typography, Button, Space, Tag, Row, Col, Skeleton, Descriptions, Input, Divider, Timeline, ConfigProvider } from "antd";
import { FileSearchOutlined, CheckCircleOutlined, ClockCircleOutlined, LoadingOutlined, CheckOutlined, CloseOutlined, ForwardOutlined, SmallDashOutlined } from "@ant-design/icons";
import { useGetContractDetailQuery } from "../../services/ContractAPI";
import { useNavigate, useParams } from "react-router-dom";
import { useGetProcessByContractIdQuery } from "../../services/ProcessAPI";
import { selectCurrentUser } from "../../slices/authSlice";
import { useSelector } from "react-redux";
import { useGetAllUserQuery } from "../../services/UserAPI";


const { Title, Text } = Typography;

const ReviewContract = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = useSelector(selectCurrentUser);
    const contractId = id;
    const { data: contracts, isLoading, isError } = useGetContractDetailQuery(id);
    const { data: process } = useGetProcessByContractIdQuery({ contractId });
    const { data: userData, refetch } = useGetAllUserQuery({
        keyword: "",
        page: 0,
        limit: 10,
    });
    console.log(contracts)
    // Lấy mảng stages
    const stages = process?.data?.stages || [];

    // Lấy mảng user
    const users = userData?.content || [];

    const matchingStage = stages.find(stage => stage.approver === currentUser?.id);
    const StageIdMatching = matchingStage?.stageId;

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
        if (currentUser?.roles?.includes("ROLE_STAFF")) {
            navigate(`/approvalContract/reviewContract/${id}/approve/${id}`, {
                state: {
                    StageIdMatching,
                },
            });
        } else if (currentUser?.roles?.includes("ROLE_MANAGER")) {
            navigate(`/manager/approvalContract/reviewContract/${id}/approve/${id}`, {
                state: {
                    StageIdMatching,
                },
            });
        }
    };



    return (
        <div className='container mx-auto min-h-[100vh]'>
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
                    <ConfigProvider
                        theme={{
                            components: {
                                Card: {
                                    headerBg: ""
                                },
                            },
                        }}
                    >
                        <Card className="p-6 mb-6 shadow-lg relative"
                            title={
                                <p className="text-lg break-words text-blue-600">  {contract?.title.toUpperCase() || "Chưa cập nhật"} - {contract?.contractNumber || "Chưa cập nhật"}
                                </p>
                            }
                        >
                            <Tag className="w-fit top-4 right-4 absolute">
                                Phiên bản: {contract?.version ? `${contract.version}.0.0` : "Chưa cập nhật"}
                            </Tag>

                            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                                {/* Cột trái */}
                                <div className="flex flex-col gap-2">
                                    <div>
                                        <Text strong className="">Ngày Tạo:</Text>
                                        <Text className="ml-2">
                                            {contract?.createdAt
                                                ? new Date(...contract.createdAt).toLocaleString()
                                                : "Chưa cập nhật"}
                                        </Text>
                                    </div>
                                    <Text >
                                        <b>Người Tạo:</b>  {contract?.user?.full_name || "Chưa cập nhật"}
                                    </Text>
                                    <div>
                                        <Text strong className="">Đối Tác:</Text>
                                        <Text className="ml-2">{contract?.party?.partnerName || "Chưa cập nhật"}</Text>
                                    </div>
                                    <div>
                                        <Text strong className="">Giá Trị:</Text>
                                        <Text className="ml-2">
                                            {contract?.amount?.toLocaleString() || "Chưa cập nhật"} VND
                                        </Text>
                                    </div>
                                    {/* 
                                    <div>
                                        <Text strong className="">Ngày Hiệu lực:</Text>
                                        <Text className="ml-2">
                                            {contract?.effectiveDate
                                                ? new Date(...contract.effectiveDate).toLocaleString()
                                                : "Chưa cập nhật"}
                                        </Text>
                                    </div>
                                    <div>
                                        <Text strong className="">Ngày Hết Hạn:</Text>
                                        <Text className="ml-2">
                                            {contract?.expiryDate
                                                ? new Date(...contract.expiryDate).toLocaleString()
                                                : "Chưa cập nhật"}
                                        </Text>
                                    </div> */}
                                    <div>
                                        <Text strong className="">Ngày Ký:</Text>
                                        <Text className="ml-2">
                                            {contract?.signingDate
                                                ? new Date(...contract.signingDate).toLocaleString()
                                                : "Chưa cập nhật"}
                                        </Text>
                                    </div>
                                </div>

                                {/* Cột phải */}
                                <div className="flex flex-col items-start md:items-end gap-3">
                                    <Button
                                        onClick={handleNavigate}
                                        type="primary"
                                        icon={<FileSearchOutlined />}
                                        className="rounded-lg shadow-md"
                                    >
                                        Xem Chi Tiết Hợp Đồng
                                    </Button>
                                    {contract.version != 1 && (
                                        <Button icon={<ClockCircleOutlined />} onClick={() => navigate(`/compare/${contracts?.data.originalContractId}/${contracts?.data.version}/${contracts?.data.version - 1}`)} type="default" className="rounded-lg">
                                            So Sánh với phiên bản trước
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </ConfigProvider>

                </Col>

                {/* Quy trình phê duyệt & Trạng thái */}
                <Col xs={24} lg={8}>
                    {/* Danh Sách Phê Duyệt */}
                    <Card
                        style={{
                            padding: "14px",
                            marginBottom: "20px"
                        }}
                    >
                        <p className="mx-3 text-base font-bold mb-6" >Danh Sách Phê Duyệt</p>
                        <Timeline mode="left" className="-mb-14">
                            {stages?.map((stage) => (
                                <Timeline.Item
                                    children={stage.approverName}
                                    label={
                                        stage.status === "APPROVING"
                                            ? `${new Date(
                                                stage.startDate[0],
                                                stage.startDate[1] - 1,
                                                stage.startDate[2]
                                            ).toLocaleDateString("vi-VN")} - ${new Date(
                                                stage.endDate[0],
                                                stage.endDate[1] - 1,
                                                stage.endDate[2]
                                            ).toLocaleDateString("vi-VN")}`
                                            : stage.status === "APPROVED" && stage.approvedAt
                                                ? new Date(
                                                    stage.approvedAt[0],
                                                    stage.approvedAt[1] - 1,
                                                    stage.approvedAt[2]
                                                ).toLocaleDateString("vi-VN")
                                                : ""
                                    }
                                    dot={
                                        stage.status === "APPROVING" ? (
                                            <LoadingOutlined spin className="timeline-clock-icon" />
                                        ) : stage.status === "APPROVED" ? (
                                            <CheckOutlined className="timeline-clock-icon" style={{ color: 'green' }} />
                                        ) : stage.status === "REJECTED" ? (
                                            <CloseOutlined className="timeline-clock-icon" style={{ color: 'red' }} />
                                        ) : stage.status === "SKIPPED" ? (
                                            <ForwardOutlined className="timeline-clock-icon" style={{ color: 'orange' }} />
                                        ) : stage.status === "NOT_STARTED" ? (
                                            <SmallDashOutlined className="timeline-clock-icon" style={{ color: 'gray' }} />
                                        ) : (
                                            <ClockCircleOutlined className="timeline-clock-icon" />
                                        )

                                    }
                                >

                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </Card>

                    {/* Trạng Thái Phê Duyệt */}
                </Col>
            </Row>
        </div>
    );
};

export default ReviewContract;
