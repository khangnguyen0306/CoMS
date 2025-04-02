import React from 'react';
import { useGetProcessByContractIdQuery } from '../../../services/ProcessAPI';
import { Skeleton, Timeline, Tag, Empty, Upload, Button } from 'antd';
import { CheckCircleFilled, InfoCircleOutlined, LoadingOutlined, UploadOutlined } from '@ant-design/icons';
import { useGetWorkFlowByAppendixIdQuery } from '../../../services/AppendixAPI';
import { useGetContractDetailQuery } from '../../../services/ContractAPI';
import dayjs from 'dayjs';
import { useUploadBillingContractMutation } from '../../../services/uploadAPI';

const ExpandRowContent = ({ id, appendixId }) => {
    const { data, isLoading, isError } = useGetProcessByContractIdQuery(
        { contractId: id },
        { skip: !id }
    );
    const { data: dataAppendix, isLoading: isLoadingAppendix, isError: isErrorAppendix } = useGetWorkFlowByAppendixIdQuery(
        { appendixId },
        { skip: !appendixId }
    );

    const [uploadBill, { isLoading: LoadingBill }] = useUploadBillingContractMutation();


    const { data: dataPayment, isLoading: isLoadingPayment, isError: isErrorPayment } = useGetContractDetailQuery(id)
    console.log(dataPayment?.data?.paymentSchedules)
    // Hiển thị thông báo lỗi nếu có lỗi xảy ra
    if (isError || isErrorAppendix) {
        return <p>Lỗi khi tải dữ liệu!</p>;
    }

    // Kiểm tra dữ liệu để sử dụng
    if (id) {
        if (!data || !data?.data.stages || data?.data.stages.length === 0) {
            return <Empty description="Chưa có quy trình duyệt" />;
        }
    } else {
        if (!dataAppendix || !dataAppendix?.data.stages || dataAppendix?.data.stages.length === 0) {
            return <Empty description="Chưa có quy trình duyệt" />;
        }
    }
    const stages = id ? data?.data.stages : dataAppendix?.data.stages;

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
        const date = arrayToDate(dateArray);
        return date.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
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

    // Ánh xạ trạng thái sang tiếng Việt
    const statusText = {
        APPROVED: 'Đã duyệt',
        APPROVING: 'Đang duyệt',
        NOT_STARTED: 'Chưa bắt đầu'
    };
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
                                            color={
                                                stage.status === "APPROVED"
                                                    ? "green-inverse"
                                                    : stage.status === "NOT_STARTED"
                                                        ? "default"
                                                        : "gold-inverse"
                                            }
                                        >
                                            <span className="mx-[2px]">
                                                {statusText[stage.status] || stage.status}
                                            </span>
                                            {stage.status === "APPROVED" ? (
                                                <CheckCircleFilled />
                                            ) : stage.status === "NOT_STARTED" ? (
                                                <InfoCircleOutlined />
                                            ) : (
                                                <LoadingOutlined />
                                            )}
                                        </Tag>
                                    </p>
                                    {stage.status === "APPROVED" && (
                                        <p>{formatDate(stage?.approvedAt)}</p>
                                    )}
                                </div>
                            }
                        >
                            <div className="min-h-[50px]">
                                <p>
                                    Người duyệt: <b>{stage.approverName}</b>
                                </p>
                            </div>
                        </Timeline.Item>
                    ))}
                </Timeline>
            </div>

            {/* Cột bên phải: Các đợt thanh toán */}
            <div className="w-1/2 pr-10 relative">
                <h3 className="text-xl font-semibold text-center absolute top-[-40px] left-1/2 transform -translate-x-1/2">
                    Các đợt thanh toán
                </h3>
                <Timeline className='mt-8' mode="left">
                    {dataPayment?.data?.paymentSchedules.map((schedule, index) => (
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
                                <span style={{ fontWeight: "bold" }}>
                                    {schedule.amount.toLocaleString()} VND
                                </span>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    {schedule.status === "UNPAID" ? (
                                        <>
                                            <Tag color="gold">Chưa thanh toán</Tag>
                                            <Upload
                                                name="invoice"
                                                accept="image/png, image/jpeg"
                                                beforeUpload={(file) => {
                                                    const isValidType =
                                                        file.type === "image/png" || file.type === "image/jpeg";
                                                    if (!isValidType) {
                                                        message.error("Bạn chỉ có thể tải file PNG hoặc JPEG!");
                                                        return Upload.LIST_IGNORE;
                                                    }
                                                    uploadFile(file, schedule.id);
                                                    return false;
                                                }}
                                                showUploadList={false}
                                            >
                                                <Button icon={LoadingBill ? <LoadingOutlined /> : <UploadOutlined />}>
                                                    {LoadingBill ? "Đang tải..." : "Tải hình ảnh"}
                                                </Button>
                                            </Upload>
                                        </>
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
        </div>


    );
};

export default ExpandRowContent;