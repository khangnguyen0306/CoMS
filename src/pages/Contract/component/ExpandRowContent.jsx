import React from 'react'
import { useGetProcessByContractIdQuery } from '../../../services/ProcessAPI';
import { Skeleton } from 'antd';

const ExpandRowContent = ({ id }) => {
    const { data, isLoading, isError,status } = useGetProcessByContractIdQuery({ contractId: id });
    console.log(data)
    console.log(status)

    if (isLoading) {
        return <Skeleton />;
    }

    // Handle error state
    if (isError) {
        return <p>Lỗi khi tải dữ liệu !</p>;
    }

    return (
        <div>ExpandRowContent</div>
    )
}

export default ExpandRowContent