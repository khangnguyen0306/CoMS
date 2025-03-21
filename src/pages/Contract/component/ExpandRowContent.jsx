import React from 'react';
import { useGetProcessByContractIdQuery } from '../../../services/ProcessAPI';
import { Skeleton, Timeline, Tag, Empty } from 'antd';
import { CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';

const ExpandRowContent = ({ id }) => {
    const { data, isLoading, isError } = useGetProcessByContractIdQuery({ contractId: id });

    // Hiển thị Skeleton khi đang tải dữ liệu
    if (isLoading) {
        return <Skeleton />;
    }

    // Hiển thị thông báo lỗi nếu có lỗi xảy ra
    if (isError) {
        return <p>Lỗi khi tải dữ liệu !</p>;
    }

    // Kiểm tra nếu không có dữ liệu hoặc không có stages, hiển thị Empty
    if (!data || !data?.data.stages || data?.data.stages.length === 0) {
        return <Empty description="Chưa có quy trình duyệt" />;
    }

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

    // Ánh xạ trạng thái sang tiếng Việt
    const statusText = {
        APPROVED: 'Đã duyệt',
        APPROVING: 'Đang duyệt',
    };

    // Hiển thị Timeline với các giai đoạn
    return (
        <div className='justify-self-start mt-[40px]'>
            <Timeline mode='left'>
                {data?.data.stages.map((stage) => (
                    <Timeline.Item
                        position='left'
                        key={stage.stageId}
                        className='min-w-[500px]'
                        label={
                            <div className='flex flex-col items-center  gap-2'>
                                <p><Tag color={stage.status === 'APPROVED' ? 'green-inverse' : 'gold-inverse'}>
                                    <span className='mx-[2px]'>{statusText[stage.status] || stage.status}</span> {stage.status != 'APPROVED' ? <LoadingOutlined /> : <CheckCircleFilled />}
                                </Tag>
                                </p>
                                {stage.status === 'APPROVED' && (
                                    <p>{formatDate(stage.startDate)}</p>
                                )}
                            </div>}
                    >
                        <div className='min-h-[50px] '>
                            <p>Người duyệt:<b> {stage.approverName}</b></p>
                        </div>
                    </Timeline.Item>
                ))}
            </Timeline>
        </div>
    );
};

export default ExpandRowContent;