import React from "react";
import { Layout, Card, Typography, Button, Space, Tag, Row, Col, Skeleton, Descriptions, Input, Divider, Timeline, ConfigProvider, Breadcrumb } from "antd";
import { FileSearchOutlined, CheckCircleOutlined, ClockCircleOutlined, LoadingOutlined, CheckOutlined, CloseOutlined, ForwardOutlined, SmallDashOutlined } from "@ant-design/icons";
import { useGetContractDetailQuery } from "../../services/ContractAPI";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useGetProcessByContractIdQuery } from "../../services/ProcessAPI";
import { selectCurrentUser } from "../../slices/authSlice";
import { useSelector } from "react-redux";


const { Title, Text } = Typography;

const ReviewContract = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useSelector(selectCurrentUser)
    const currentUser = useSelector(selectCurrentUser);
    const { data: contracts, isLoading, isError } = useGetContractDetailQuery(id);
    const { data: process, isLoading: LoadingProcess } = useGetProcessByContractIdQuery({ contractId: id });


    // Lấy mảng stages
    const stages = process?.data?.stages;

    console.log(contracts);

    const matchingStage = stages?.find(stage => stage.approver === currentUser?.id);
    const StageIdMatching = matchingStage?.stageId;



    // Lấy hợp đồng đầu tiên trong danh sách
    const contract = contracts?.data

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
        } else if (currentUser?.roles?.includes("ROLE_DIRECTOR")) {
            navigate(`/director/approvalContract/reviewContract/${id}/approve/${id}`, {
                state: {
                    StageIdMatching,
                },
            });
        }
    };


    if (isLoading || LoadingProcess)
        return (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
                <Skeleton active />
            </div>
        );

    if (isError) {
        return (
            <div style={{ textAlign: "center", marginTop: "20px" }}>
                <p style={{ color: "red" }}>Có lỗi xảy ra khi tải dữ liệu.</p>
            </div>
        );
    }

    return (
        <div className='container mx-auto min-h-[100vh]'>
            <Breadcrumb
                className='p-5'
                items={[
                    {
                        title: <Link to={user.roles[0] == "ROLE_STAFF" ? "/approvalContract" : "/manager/approvalContract"} >Hợp đồng cần phê duyệt </Link>,
                    },
                    {
                        title: <p className='font-bold'>{contracts?.data.title}</p>,
                    },
                ]}
            />
            <p className='font-bold text-[34px] justify-self-center pb-9 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                THÔNG TIN PHÊ DUYỆT
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
                                <div>
                                    <p className="text-base font-bold mb-3" >Hợp đồng phê duyệt</p>
                                    <p className="text-lg break-words text-blue-600">  {contract?.title.toUpperCase() || "Chưa cập nhật"} <span className="text-red-800">---</span> {contract?.contractNumber || "Chưa cập nhật"}
                                    </p>
                                </div>
                            }
                        >
                            <Tag className="w-fit top-4 right-4 absolute">
                                Phiên bản: {contract?.version ? `${contract?.version}.0.0` : "Chưa cập nhật"}
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
                                        <Text className="ml-2">{contract?.partnerB?.partnerName || "Chưa cập nhật"}</Text>
                                    </div>
                                    <div>
                                        <Text strong className="">Tổng giá Trị:</Text>
                                        <Text className="ml-2">
                                            {contract?.amount?.toLocaleString() || "Chưa cập nhật"} VND
                                        </Text>
                                    </div>
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
                                        Xem và phê duyệt
                                    </Button>
                                    {contract?.version != 1 && (
                                        <Button icon={<ClockCircleOutlined />} onClick={() => navigate(`/compare/${contracts?.data.originalContractId}/${contracts?.data?.version}/${contracts?.data?.version - 1}`)} type="default" className="rounded-lg">
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
                        <Timeline mode="left" className="mb-14">
                            {stages.map((stage, index) => (
                                <Timeline.Item
                                    key={index}
                                    children={
                                        <div className="min-h-[50px]">
                                            {stage.approverName}
                                        </div>
                                    }
                                    label={
                                        <div className="w-full">
                                            {
                                                stage?.status === "APPROVING"
                                                    ? <div className="flex flex-col justify-center items-center">
                                                        {/* <p className="text-[12px]">
                                                            {new Date(
                                                                stage.startDate[0],
                                                                stage.startDate[1] - 1,
                                                                stage.startDate[2]
                                                            ).toLocaleDateString("vi-VN")} -
                                                            {new Date(
                                                                stage.endDate[0],
                                                                stage.endDate[1] - 1,
                                                                stage.endDate[2]
                                                            ).toLocaleDateString("vi-VN")}
                                                        </p> */}
                                                        <Tag color="gold-inverse" className="w-fit mr-0">Đang phê duyệt</Tag>
                                                    </div>
                                                    : stage.status === "APPROVED" && stage.approvedAt
                                                        ?
                                                        <div className="flex flex-col justify-center items-center">
                                                            <p className="text-[12px]">
                                                                {
                                                                    new Date(
                                                                        stage.approvedAt[0],
                                                                        stage.approvedAt[1] - 1,
                                                                        stage.approvedAt[2]
                                                                    ).toLocaleDateString("vi-VN")
                                                                }
                                                            </p>
                                                            <Tag color="green-inverse" className="w-fit mr-0">Đã duyệt</Tag>
                                                        </div>
                                                        : ""
                                            }
                                        </div>
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
