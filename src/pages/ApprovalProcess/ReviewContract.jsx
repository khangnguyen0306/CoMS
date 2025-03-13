import React from "react";
import { Layout, Card, Typography, Button, Space, Tag, Row, Col, Skeleton, Descriptions, Input, Divider, Timeline } from "antd";
import { FileSearchOutlined, CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
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
    console.log(userData?.content);

    // Lấy mảng stages
    const stages = process?.data?.stages || [];

    // Lấy mảng user
    const users = userData?.content || [];

    console.log(stages);
    // Map stages => stages kèm full_name
    const stagesWithFullName = stages?.map(stage => {
        const user = users.find(u => u.id === stage.approver);
        return {
            ...stage,
            approverName: user ? user.full_name : "Chưa rõ",
        };
    });
    console.log(currentUser?.roles);

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
                    <Card style={{ boxShadow: "0 0 12px 4px rgba(0, 0, 0, 0.2)", }} className="p-6 mb-6 rounded-2xl border border-gray-200">
                        {/* Tiêu đề và thông tin chung */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            {/* Cột trái */}
                            <div className="flex flex-col gap-2">
                                <div>
                                    <Text strong className="text-gray-700">Người Tạo:</Text>
                                    <Text className="ml-2 text-gray-600">
                                        {contract?.user?.full_name || "Chưa cập nhật"}
                                    </Text>
                                </div>
                                <div>
                                    <Text strong className="text-gray-700">Mã HĐ:</Text>
                                    <Text className="ml-2 text-gray-600">
                                        {contract?.contractNumber || "Chưa cập nhật"}
                                    </Text>
                                </div>
                                <Title
                                    level={4}
                                    className="text-[#222] mt-2 break-words max-w-full"
                                >
                                    {contract?.title || "Chưa cập nhật"}
                                </Title>

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
                                <Text className="text-gray-500 text-sm">
                                    Version hợp đồng: {contract?.version ? `${contract.version}.0.0` : "Chưa cập nhật"}
                                </Text>
                                <Button icon={<ClockCircleOutlined />} type="default" className="rounded-lg">
                                    So Sánh Version Trước Đó
                                </Button>
                            </div>
                        </div>

                        <Divider className="my-4 border-t border-gray-300" />

                        {/* Nội dung chi tiết */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                            <div className="space-y-3">
                                <div>
                                    <Text strong className="text-gray-700">Đối Tác:</Text>
                                    <Text className="ml-2">{contract?.party?.partnerName || "Chưa cập nhật"}</Text>
                                </div>
                                <div>
                                    <Text strong className="text-gray-700">Giá Trị:</Text>
                                    <Text className="ml-2">
                                        {contract?.amount?.toLocaleString() || "Chưa cập nhật"} VND
                                    </Text>
                                </div>
                                <div>
                                    <Text strong className="text-gray-700">Ngày Tạo:</Text>
                                    <Text className="ml-2">
                                        {contract?.createdAt
                                            ? new Date(...contract.createdAt).toLocaleString()
                                            : "Chưa cập nhật"}
                                    </Text>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Text strong className="text-gray-700">Ngày Hiệu lực:</Text>
                                    <Text className="ml-2">
                                        {contract?.effectiveDate
                                            ? new Date(...contract.effectiveDate).toLocaleString()
                                            : "Chưa cập nhật"}
                                    </Text>
                                </div>
                                <div>
                                    <Text strong className="text-gray-700">Ngày Hết Hạn:</Text>
                                    <Text className="ml-2">
                                        {contract?.expiryDate
                                            ? new Date(...contract.expiryDate).toLocaleString()
                                            : "Chưa cập nhật"}
                                    </Text>
                                </div>
                                <div>
                                    <Text strong className="text-gray-700">Ngày Ký:</Text>
                                    <Text className="ml-2">
                                        {contract?.signingDate
                                            ? new Date(...contract.signingDate).toLocaleString()
                                            : "Chưa cập nhật"}
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
                            padding: "14px",
                            boxShadow: "0 0 12px 4px rgba(0, 0, 0, 0.2)",
                            marginBottom: "20px"
                        }}
                    >
                        <Title className="-mt-2 pb-4" level={4}>Danh Sách Phê Duyệt</Title>
                        <Timeline className="-mb-14">
                            {stagesWithFullName.map((stage) => (
                                <Timeline.Item key={stage.stageId} className="mb-2">
                                    <div className="flex justify-between">
                                        <Text strong>{stage.approverName}</Text>
                                        {/* Nếu bạn có thông tin vai trò, thay thế "Vai trò" bằng thông tin đó */}
                                        {/* <Text type="secondary">Vai trò</Text> */}
                                    </div>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </Card>

                    {/* Trạng Thái Phê Duyệt */}
                    <Card
                        bordered={false}
                        style={{
                            paddingTop: "0px",
                            padding: "14px",
                            boxShadow: "0 0 12px 4px rgba(0, 0, 0, 0.2)",
                        }}
                    >
                        <Title className="-mt-4" level={4}>Trạng Thái Phê Duyệt</Title>
                        <Tag
                            icon={<CheckCircleOutlined />}
                            color="orange"
                            className="text-base -mb-14"
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
