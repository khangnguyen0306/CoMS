import { Space, Table, Tag, Tooltip, Select } from 'antd'
import Search from 'antd/es/transfer/search'
import React, { useEffect, useState } from 'react'
import { useGetAllContractQuery, useGetContractNearExpiredQuery } from '../../services/ContractAPI';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../slices/authSlice';

const ContractNearlyExpired = () => {
    const userL = useSelector(selectCurrentUser)
    const [searchText, setSearchText] = useState("");
    const [day, setDay] = useState(30);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const { data: contracts, isLoading, isError, refetch } = useGetContractNearExpiredQuery({
        page: pagination.current - 1,
        size: pagination.pageSize,
        keyword: searchText,
        days: day
    }
    );

    const column = [
        {
            title: "Mã hợp đồng",
            dataIndex: "contractNumber",
            key: "contractNumber",
            sorter: (a, b) => a.contractNumber.localeCompare(b.contractNumber),
            render: (text) => (
                <Tooltip title={text}>
                    <div style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '50px'
                    }}>
                        {text}
                    </div>
                </Tooltip>
            ),
        },

        {
            title: "Ngày tạo",
            dataIndex: "expiryDate",
            key: "createdAt",
            sorter: (a, b) => {
                const dateA = new Date(a.createdAt[0], a.createdAt[1] - 1, a.createdAt[2]);
                const dateB = new Date(b.createdAt[0], b.createdAt[1] - 1, b.createdAt[2]);
                return dateB - dateA;
            },
            render: (dateArray) => {
                const [year, month, day] = dateArray;
                return dayjs(`${year}-${month}-${day}`).format('DD/MM/YYYY');
            },
            defaultSortOrder: 'ascend',
        },
        {
            title: "Ngày hết hạn",
            dataIndex: "expiryDate",
            key: "expiryDate",
            sorter: (a, b) => {
                const dateA = new Date(a.expiryDate[0], a.expiryDate[1] - 1, a.expiryDate[2]);
                const dateB = new Date(b.expiryDate[0], b.expiryDate[1] - 1, b.expiryDate[2]);
                return dateB - dateA;
            },
            render: (dateArray) => {
                const [year, month, day] = dateArray;
                return dayjs(`${year}-${month}-${day}`).format('DD/MM/YYYY');
            },
        },
        {
            title: "Người tạo",
            dataIndex: "user",
            key: "user",
            // filters: [...new Set(tableData?.map(contract => contract?.user?.full_name))].map(name => ({
            //     text: name,
            //     value: name,
            // })),
            render: (user) => <Link to={user.user_id != userL.id ? `/profileUser/${user.user_id}` : `/profile`} className="font-bold text-[#228eff]">{user?.full_name}</Link>,
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "title",
            key: "title",
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text, record) => (
                <Link to={`${userL.roles[0] === "ROLE_STAFF" || userL.roles[0] === "ROLE_DIRECTOR" ? `/ContractDetail/${record.id}` : `/manager/ContractDetail/${record.id}`}`} className="font-bold text-[#228eff] cursor-pointer">
                    {text}
                </Link>
            ),
        },
        {
            title: "Loại hợp đồng",
            dataIndex: "contractType",
            key: "contractType",
            render: (value) =>
            (
                <Tag color="blue">{value.name}</Tag>
            ),
            // filters:
            //     [...new Set(tableData?.map(contract => contract.contractType.name))].map(type => ({
            //         text: type,
            //         value: type,
            //     })),
            onFilter:

                (value, record) => record.contractType.name === value,
        },
        {
            title: "Đối tác",
            dataIndex: "partnerB",
            key: "partnerB",
            render: (partner) => <p>{partner?.partnerName}</p>,
            // filters: [
            //     ...new Set(
            //         tableData?.map(contract =>
            //             contract.partnerB?.partnerName
            //         )
            //     ),
            // ]
            //     .filter(Boolean)
            //     .map(name => ({
            //         text: name,
            //         value: name,
            //     })),
            // onFilter: (value, record) =>
            //     (record.partnerB?.partnerName) === value,
        },

        {
            title: "Giá trị",
            dataIndex: "amount",
            key: "amount",
            render: (value) => value.toLocaleString("vi-VN") + " VND",
            sorter: (a, b) => a.amount - b.amount,
        },

    ];

    const handleTableChange = (pagination, filters, sorter) => {

        setPagination(pagination);

        // if (filters?.status && filters?.status.length > 0) {
        //     setStatus(filters?.status);

        // };
    }

    const handleDayChange = (value) => {
        setDay(value);
        refetch();
    };

    useEffect(() => {
        refetch();
    }, [searchText, pagination])

    return (
        <div className='min-h-[100vh]'>
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    HỢP ĐỒNG SẮP HẾT HẠN
                </p>
                <div className='mb-5'>
                    <Search
                        placeholder="Nhập tên hợp đồng hoặc mã hợp đồng 5"
                        allowClear
                        onSearch={(e) => setSearchText(e)}
                        enterButton="Tìm kiếm"
                        disabled={isLoading}
                    />
                </div>
                <div className='mb-5 flex items-center gap-5'>
                    <p>Sắp hết hạn trong </p>
                    <Select defaultValue={30} onChange={handleDayChange} style={{ width: 120 }}>
                        <Select.Option value={30}>30 Ngày</Select.Option>
                        <Select.Option value={60}>60 Ngày</Select.Option>
                        <Select.Option value={90}>90 Ngày</Select.Option>
                    </Select>
                </div>
                <Table
                    columns={column}
                    dataSource={contracts?.data?.content}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: contracts?.data?.totalElements || 0,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `Tổng ${total} hợp đồng`,
                    }}
                    onChange={handleTableChange}
                    expandable={{
                        expandedRowRender: (record) => <ExpandRowContent id={record.id} />,
                    }}
                    onRow={(record) => ({ onClick: () => setSelectedContract(record) })}
                />
            </div>
        </div>
    )
}

export default ContractNearlyExpired