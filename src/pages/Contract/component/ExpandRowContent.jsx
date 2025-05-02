import React, { useEffect } from 'react';
import { useGetProcessByContractIdQuery } from '../../../services/ProcessAPI';
import { Skeleton, Timeline, Tag, Empty, Button, Tooltip, message } from 'antd';
import { CheckCircleFilled, CloseCircleOutlined, InfoCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { useGetAppendixDetailQuery, useGetWorkFlowByAppendixIdQuery } from '../../../services/AppendixAPI';
import { useGetContractDetailQuery, useSendReminderContractMutation } from '../../../services/ContractAPI';
import dayjs from 'dayjs';
// import { useUploadBillingContractMutation } from '../../../services/uploadAPI';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../slices/authSlice';
import { TbBellRingingFilled } from "react-icons/tb";

const ExpandRowContent = ({ id, appendixId }) => {
    const user = useSelector(selectCurrentUser)
    const isCEO = user?.roles?.includes("ROLE_DIRECTOR");
    const { data, isLoading, isError, refetch: refetchContract } = useGetProcessByContractIdQuery(
        { contractId: id },
        { skip: !id }
    );
    const { data: dataAppendix, isLoading: isLoadingAppendix, isError: isErrorAppendix, refetch: refetchAppendix } = useGetWorkFlowByAppendixIdQuery(
        { appendixId },
        { skip: !appendixId }
    );
    const [Reminder] = useSendReminderContractMutation();

    const { data: dataPayment, isLoading: isLoadingPayment, isError: isErrorPayment, refetch: refetchDetailContract } = useGetContractDetailQuery(id)
    const { data: appendixData, isLoading: isLoadingDetailAppendix, isError: isErrorDetailAppendix, refetch: refetchDetailAppendix } = useGetAppendixDetailQuery(
        { id: appendixId },
        { skip: !appendixId },
        {
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true,
        }
    )
    console.log("dataAppendix", appendixData)
    console.log("dataPayment", dataPayment)

    useEffect(() => {
        if (id) {
            refetchContract()
        } else if (appendixId) {
            refetchAppendix()
        }
    }, [id, appendixId])

    useEffect(() => {
        if (id) {
            refetchDetailContract()
        } else if (appendixId) {
            refetchDetailAppendix()
        }
    }, [id, appendixId])

    if (isError || isErrorAppendix) {
        return <p>Lỗi khi tải dữ liệu!</p>;
    }

    // Kiểm tra dữ liệu để sử dụng
    if (id) {
        if (!data || !data?.data.stages || data?.data.stages.length === 0) {
            return <Empty description="Chưa có quy trình duyệt" />;
        }
    } else {
        if (!dataAppendix || !dataAppendix?.data.stages || dataAppendix?.data?.stages.length === 0) {
            return <Empty description="Chưa có quy trình duyệt" />;
        }
    }
    const stages = id ? data?.data?.stages : dataAppendix?.data?.stages;

    // if (id) {
    //     if (!dataPayment || !dataPayment?.data || dataPayment?.data) {
    //         return <Empty description="Chưa có đợt thanh toán nào" />;
    //     }
    // } else {
    //     if (!dataAppendix || !dataAppendix?.data.stages || dataAppendix?.data) {
    //         return <Empty description="Chưa có đợt thanh toán nào" />;
    //     }
    // }

    const dataPaymentDetail = id ? dataPayment?.data : appendixData?.data;
    console.log("daya nè", dataPaymentDetail)

    if (!stages || stages.length === 0) {
        return <Empty description="Chưa có quy trình duyệt" />;
    }
    // Kiểm tra nếu không có dữ liệu hoặc không có stages, hiển thị Empty
    // if (!stages || stages.length === 0) {
    //     return <Empty description="Chưa có quy trình duyệt" />;
    // }

    // Hàm chuyển đổi mảng ngày thành đối tượng Date
    const arrayToDate = (arr) => new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5], arr[6]);

    // Hàm định dạng ngày thành chuỗi DD/MM/YYYY HH:mm:ss
    const formatDate = (dateArray) => {
        // Check if the array has at least 6 elements
        if (dateArray.length < 6) {
            return <p>Ngày không hợp lệ</p>; // Return a default message if data is insufficient
        }

        // Format the date if the array has enough elements
        return (
            <p>
                {dateArray[2] + "/" + dateArray[1] + "/" + dateArray[0] + "   lúc     " + dateArray[3] + ":" + dateArray[4] + ":" + dateArray[5]}
            </p>
        );
    };

    const uploadFile = async (file, paymentScheduleId) => {
        console.log("File:", file);
        console.log("Payment Schedule ID:", paymentScheduleId);
        try {
            const formData = new FormData();
            formData.append("file", file);
            // Gọi API upload file, truyền paymentScheduleId và formData
            const res = await uploadBill({ paymentScheduleId, formData }).unwrap();
            const parsedRes = JSON.parse(res);
            message.success(parsedRes.message);

            refetch();
        } catch (error) {
            console.error("Lỗi upload file:", error);
            message.error("Upload thất bại!");
        }
    };

    const ReminderContract = async () => {
        try {
            const res = await Reminder(id).unwrap();
            console.log(res);
            // const parsedRes = JSON.parse(res);
            message.success(res.message);
        } catch (error) {
            // console.error("Lỗi gửi nhắc nhở:", error);
            message.error(error.data.message);
        }
    };

    // Ánh xạ trạng thái sang tiếng Việt
    const statusText = {
        APPROVED: 'Đã duyệt',
        APPROVING: 'Đang duyệt',
        REJECTED: 'Từ chối duyệt',
        NOT_STARTED: 'Chưa bắt đầu'
    };

    const displayColor = {
        NOT_STARTED: "default",
        APPROVED: "green-inverse",
        APPROVING: "gold-inverse",
        REJECTED: "red"
    }
    const displayIcon = {
        NOT_STARTED: <InfoCircleOutlined />,
        APPROVED: <CheckCircleFilled />,
        APPROVING: <LoadingOutlined />,
        REJECTED: <CloseCircleOutlined />
    }

    if (isLoading || isLoadingAppendix) {
        return <Skeleton />;
    }
    // Hiển thị Timeline với các giai đoạn
    return (
        <div className="flex justify-between mt-[40px] relative">
            {/* Cột bên trái: Quy trình phê duyệt */}
            <div className="w-1/2 pr-4 relative">
                <h3 className=" text-xl font-semibold text-center absolute top-[-40px] left-1/2 transform -translate-x-1/2">
                    Quy trình phê duyệt
                </h3>
                <Timeline className='mt-8' mode="left">
                    {stages.map((stage) => (
                        <Timeline.Item
                            key={stage.stageId}
                            className="min-w-[500px]"
                            label={
                                <div className="flex flex-col items-center gap-2">
                                    <p>
                                        <Tag
                                            color={displayColor[stage.status]}
                                        >
                                            <span className="mx-[2px]">
                                                {statusText[stage.status] || stage.status}
                                            </span>
                                            {displayIcon[stage.status]}
                                        </Tag>
                                    </p>
                                    {stage.status === "APPROVED" && (
                                        <p>{formatDate(stage?.approvedAt)}</p>
                                    )}
                                </div>
                            }
                        >
                            <div className="min-h-[50px] flex items-center justify-between">
                                <p className="max-w-[150px]">
                                    Người duyệt: <b>{stage.approverName}</b>
                                </p>

                                {/* Hiển thị nút khi là bước đang APPROVING */}
                                {isCEO && stage.status === "APPROVING" && (
                                    <Button
                                        type="text"
                                        icon={<TbBellRingingFilled style={{ color: '#FAAD14' }} />}
                                        className="bg-yellow-100 text-yellow-800 border-none hover:!text-yellow-900"
                                        onClick={() => ReminderContract()}
                                    >
                                        Nhắc nhở
                                    </Button>
                                )}
                            </div>
                        </Timeline.Item>
                    ))}
                </Timeline>


            </div>

            {/* Cột bên phải: Các đợt thanh toán */}

            {["ACTIVE", "EXPIRED", "ENDED", "CANCELLED", "LIQUIDATED", "SIGN_OVERDUE"].includes(dataPaymentDetail?.status) ? (
                (dataPaymentDetail?.paymentSchedules?.length || 0) === 0 ? (
                    <div className="w-1/2 pr-10 relative">
                        <h3 className="text-xl font-semibold text-center absolute top-[-40px] left-1/2 transform -translate-x-1/2">
                            Các đợt thanh toán
                        </h3>
                        <div className="mt-10  ml-10">
                            <Empty description="Không có đợt thanh toán nào cho hợp đồng này." />
                        </div>
                    </div>
                ) : (
                    <div className="w-1/2 pr-10 relative">
                        <h3 className="text-xl font-semibold text-center absolute top-[-40px] left-1/2 transform -translate-x-1/2">
                            Các đợt thanh toán
                        </h3>

                        <Timeline className='mt-8 -ml-[20%]' mode="left">
                            {dataPaymentDetail?.paymentSchedules.map((schedule, index) => (
                                <Timeline.Item
                                    key={schedule.id || index}
                                    label={
                                        schedule.paymentDate
                                            ? dayjs(
                                                new Date(
                                                    schedule.paymentDate[0],
                                                    schedule.paymentDate[1] - 1,
                                                    schedule.paymentDate[2]
                                                )
                                            ).format("DD/MM/YYYY")
                                            : "Không có dữ liệu"
                                    }
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", textAlign: "left" }}>
                                        <Tooltip title={`${schedule.amount.toLocaleString()} VND`}>
                                            <span
                                                className="font-bold text-gray-800 text-lg whitespace-nowrap overflow-hidden text-ellipsis"
                                                style={{ maxWidth: "150px", display: "inline-block", whiteSpace: "nowrap", minWidth: "150px" }}
                                                title={`${schedule.amount.toLocaleString()} VND`}
                                            >
                                                {schedule.amount.toLocaleString()} VND
                                            </span>
                                        </Tooltip>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            {schedule.status === "UNPAID" ? (
                                                <Tag color="red">Chưa thanh toán</Tag>
                                            ) : schedule.status === "PAID" ? (
                                                <Tag color="green">Đã thanh toán</Tag>
                                            ) : schedule.status === "OVERDUE" ? (
                                                <Tag color="red">Quá hạn</Tag>
                                            ) : (
                                                schedule.status
                                            )}
                                        </div>
                                    </div>
                                </Timeline.Item>
                            ))}
                        </Timeline>
                    </div>
                )
            ) : (
                <div className="w-1/2 pr-10 relative">
                    <h3 className="text-xl font-semibold text-center absolute top-[-40px] left-1/2 transform -translate-x-1/2">
                        Các đợt thanh toán
                    </h3>
                    <div className="mt-10">
                        <Empty description="Chưa có đợt thanh toán" />
                    </div>
                </div>
            )}

        </div>


    );
};

export default ExpandRowContent;