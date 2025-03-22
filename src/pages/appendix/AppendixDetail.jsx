import { CheckOutlined, ClockCircleOutlined, CloseOutlined, ForwardOutlined, InfoCircleOutlined, LoadingOutlined, RollbackOutlined, SmallDashOutlined } from '@ant-design/icons';
import { Button, Collapse, Radio, Form, Input, Space, Row, Col, Checkbox, Image, Skeleton, Card, Timeline, Tag, message } from 'antd';
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApIcon from '../../assets/Image/appendix.svg'
import { useApproveAppendixMutation, useGetAppendixDetailQuery, useGetWorkFlowByAppendixIdQuery, useRejectAppendixMutation } from '../../services/AppendixAPI';
import { selectCurrentUser } from '../../slices/authSlice';
import { useSelector } from 'react-redux';
const { Panel } = Collapse;

const AppendixDetail = () => {
    const { appendixId, contractId } = useParams()
    const navigate = useNavigate();
    const [approvalChoice, setApprovalChoice] = useState(null);
    const [reason, setReason] = useState('');
    const [isApproved, setIsApproved] = useState(false);
    const { data: appendixData, isLoading: isLoadingAppendix, isError: isErrorAppendix } = useGetAppendixDetailQuery({ id: appendixId })
    const { data: dataAppendixProcess, isLoading: isLoadingAppendixProcess, isError: isErrorAppendixProcess } = useGetWorkFlowByAppendixIdQuery(
        { appendixId },
        { skip: !appendixId }
    );
    const user = useSelector(selectCurrentUser);
    const stages = dataAppendixProcess?.data?.stages || [];
    const matchingStage = stages.find(stage => stage.approver === user?.id);
    const StageIdMatching = matchingStage?.stageId;
    const userApproval = dataAppendixProcess?.data.stages.find(stage => stage.approver === user?.id && (stage.status === "APPROVED"));
    const userCreate = appendixData?.data.createdBy.userName == user?.id;

    const [rejectProcess, { isLoading: rejectLoading }] = useRejectAppendixMutation();
    const [approveProcess, { isLoading: approveLoading }] = useApproveAppendixMutation();
    // Xử lý khi thay đổi lựa chọn radio
    const handleApprovalChange = (e) => {
        setApprovalChoice(e.target.value);
        setIsApproved(null)
    };

    // Xử lý khi xác nhận phê duyệt
    const handleConfirmApproval = async () => {
        try {
            const result = await approveProcess({ appendixId: appendixId, stageId: StageIdMatching }).unwrap();
            if (result.status === "OK") {
                message.success("Đã đồng ý phê duyệt thành công!");
                if (user?.roles?.includes("ROLE_STAFF")) {
                    navigate(`/appendix`);
                } else if (user?.roles?.includes("ROLE_MANAGER")) {
                    navigate(`/manager/appendix`);
                }
                setIsApproved(true);
            }
        } catch (error) {
            console.log(error);
            message.error(error?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
        }
    };


    const handleReject = async () => {
        try {
            await rejectProcess({ comment: reason, appendixId: appendixId, stageId: StageIdMatching }).unwrap();
            message.success("Đã từ chối phê duyệt và gửi nhận xét thành công!");
            setReason('')
            if (user?.roles?.includes("ROLE_STAFF")) {
                navigate(`/appendix`);
            } else if (user?.roles?.includes("ROLE_MANAGER")) {
                navigate(`/manager/appendix`);
            }
        } catch (error) {
            console.log(error);
            message.error(error?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
        }
    };

    const arrayToDate = (arr) => {
        const year = arr[0];
        const month = arr[1] ? arr[1] - 1 : 0;
        const day = arr[2] || 0;
        const hours = arr[3] || 0;
        const minutes = arr[4] || 0;
        const seconds = arr[5] || 0;
        return new Date(year, month, day, hours, minutes, seconds);
    };

    // Hàm định dạng ngày thành chuỗi DD/MM/YYYY HH:mm:ss
    const formatDate = (dateArray) => {
        const date = arrayToDate(dateArray);
        return date?.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };
    if (isLoadingAppendix) {
        return (
            <div className='flex justify-center items-center w-full h-full'>
                <Skeleton />
            </div>
        )
    }
    return (
        <Row gutter={16} className='min-h-[100vh]'>
            {/* Cột bên trái */}
            <Col span={17} className=" rounded-lg ">
                <Button
                    icon={<RollbackOutlined />}
                    type="primary"
                    onClick={() => navigate(-1)}
                    className="mb-4"
                >
                    Quay về
                </Button>
                <div className="text-center mb-10">
                    <p
                        className="font-bold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500"
                        style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }}
                    >
                        CHI TIẾT PHỤ LỤC
                    </p>

                </div>

                {/* I. Thông tin chung */}
                <div className='ml-[50px]'>
                    <div className="mb-6 ml-2">
                        <h2 className="text-xl font-semibold ">I. Thông tin chung</h2>
                        <Button
                            type="link"
                            className="my-4 ml-[-17px] mb-7"
                            onClick={() => navigate(user?.roles[0] === "ROLE_STAFF" ? `/contractDetail/${contractId}` : `/manager/contractDetail/${contractId}`)}
                        >
                            <Image preview={false} width={30} height={30} src={ApIcon} />
                            <span className='font-bold text-base'>Xem hợp đồng sử dụng phụ lục </span>
                        </Button>
                        <div className='flex flex-col gap-2'>
                            <p className=""><b>Mã hợp đồng:</b> {appendixData?.data.contractNumber}</p>
                            <p className=""><b>Người tạo:</b> {appendixData?.data.createdBy?.userName}</p>
                            <p className=""><b>Ngày tạo:</b>  {formatDate(appendixData?.data?.createdAt)}</p>
                            <p className=""><b>Ngày có hiệu lực:</b>  {formatDate(appendixData?.data?.effectiveDate)}</p>
                        </div>
                    </div>

                    {/* II. Nội dung phụ lục */}
                    <div>
                        <h2 className="text-xl font-semibold  mb-4">II. Nội dung phụ lục</h2>
                        <div
                            className="ml-2"
                            dangerouslySetInnerHTML={{ __html: appendixData?.data.content || "Chưa nhập" }}
                        />
                    </div>
                </div>
            </Col>

            {/* Cột bên phải - Fixed */}
            <Col span={7}>
                <div
                    className=" p-4 rounded-lg shadow-md border"
                    style={{
                        position: 'fixed',
                        right: '66px',
                        top: '100px',
                        minWidth: '400px',
                        width: 'fit-content',
                        maxHeight: 'calc(100vh - 32px)',
                        overflowY: 'auto',
                    }}
                >
                    {/* 1. Thông tin phê duyệt */}
                    <div>
                        <h3 className="text-lg font-semibold mt-2 ml-1">1. Thông tin phê duyệt</h3>
                        <div
                            style={{
                                padding: "7px",
                            }}
                        >
                            <Timeline mode="left" className=" mt-5">
                                {stages?.map((stage) => (
                                    <Timeline.Item
                                        children={
                                            <div className="min-h-[50px]">
                                                {stage.approverName}
                                            </div>
                                        }
                                        label={
                                            <div className="w-full">
                                                {
                                                    stage.status === "APPROVING"
                                                        ? <div className="flex flex-col justify-center items-center">
                                                            <p className="text-[12px]">
                                                            </p>
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
                                                            :
                                                            <div className="flex flex-col justify-center items-center">
                                                                <Tag color="default" className="w-fit mr-0">Chưa bắt đầu</Tag>
                                                            </div>
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
                                            ) : stage.status === "APPROVAL_PENDING" ? (
                                                <InfoCircleOutlined style={{ color: 'gray' }} />
                                            ) : (
                                                <InfoCircleOutlined />
                                            )

                                        }
                                    >
                                    </Timeline.Item>
                                ))}
                            </Timeline>
                        </div>
                    </div>

                    {/* Collapse phê duyệt */}
                    {!userApproval && (
                        userCreate && (
                            <Collapse>
                                <Panel header="Phê duyệt" key="1">
                                    <Radio.Group onChange={handleApprovalChange} value={approvalChoice}>
                                        <Space direction="vertical">
                                            <Radio value="approve">Đồng ý phê duyệt</Radio>
                                            <Radio value="reject">Không đồng ý</Radio>
                                        </Space>
                                    </Radio.Group>

                                    {/* Nếu chọn Đồng ý phê duyệt */}
                                    {approvalChoice === 'approve' && (
                                        <div className="mt-4 flex flex-col">
                                            <Checkbox
                                                onChange={(e) => setIsApproved(e.target.checked)}
                                                disabled={isApproved}
                                            >
                                                Tôi đã đọc kỹ phụ lục và phê duyệt
                                            </Checkbox>
                                            {isApproved && (
                                                <Button
                                                    type="primary"
                                                    onClick={handleConfirmApproval}
                                                    className="mt-2"
                                                    loading={approveLoading}
                                                >
                                                    Phê duyệt
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {/* Nếu chọn Không đồng ý */}
                                    {approvalChoice === 'reject' && (
                                        <Form className="mt-4 flex flex-col">
                                            <Form.Item >
                                                <Input.TextArea
                                                    rows={7}
                                                    value={reason}
                                                    onChange={(e) => setReason(e.target.value)}
                                                    placeholder="Nhập lý do từ chối"
                                                    style={{
                                                        overflow: 'hidden',
                                                        overflowY: 'auto',
                                                        scrollbarWidth: 'none'
                                                    }}
                                                />
                                            </Form.Item>
                                            <Form.Item >
                                                <Button
                                                    type="primary"
                                                    danger
                                                    onClick={handleReject}
                                                    disabled={!reason}
                                                    loading={rejectLoading}
                                                >
                                                    Từ chối phê duyệt
                                                </Button>
                                            </Form.Item>
                                        </Form>
                                    )}
                                </Panel>
                            </Collapse>
                        )
                    )}
                </div>
            </Col>
        </Row>

    );
};

export default AppendixDetail;