import React, { useState, useEffect, useCallback } from 'react';
import { Input, Table, Tag, Space, Skeleton, Card, Empty, ConfigProvider } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useGetContractByPartnerIdQuery } from '../../services/ContractAPI';
import { Link } from 'react-router-dom';
import { debounce } from 'lodash';

const ContractPartner = ({ partnerId }) => {
    // Quản lý state
    const [searchText, setSearchText] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Gọi API với các tham số phân trang và tìm kiếm
    const {
        data: partnerContractData,
        isLoading: isFetchingContractData,
        error: fetchErrorContractData,
        refetch: refetchContractData
    } = useGetContractByPartnerIdQuery({
        partnerId: partnerId,
        page: currentPage - 1, // API thường bắt đầu từ page 0
        size: pageSize,
        keyword: searchText,
    });

    // Reset về trang 1 khi searchText thay đổi
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText]);

    // Create a debounced function for setting search text
    const debouncedSetSearchText = useCallback(debounce((value) => {
        setSearchText(value);
    }, 200), []);

    // Xử lý sự kiện thay đổi trang hoặc kích thước trang
    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };

    
    // Định nghĩa bộ lọc trạng thái
    const statusFilters = [
        { text: 'SIGNED', value: 'Đã ký' },
        { text: 'ACTIVE', value: 'Đang hiệu lực' },
        { text: 'ENDED', value: 'Hết hiệu lực' },
        { text: 'EXPIRED', value: 'Đã hết hạn' },
        { text: 'APPROVED', value: 'Đang chờ ký' },
    ];

    const Displaystatus = {
        'SIGNED': <Tag color='default'>Đã ký</Tag>,
        'ACTIVE': <Tag color='blue-inverse'>Đang hiệu lực</Tag>,
        'ENDED': <Tag color='red'>Hết hiệu lực</Tag>,
        'EXPIRED': <Tag color='red-inverse'>Đã hết hạn</Tag>,
        'APPROVED': <Tag color='yellow-inverse'>Đang chờ ký</Tag>
    };

    const renderDate = (date) => {
        return (
            <p>Ngày {date[2]} tháng {date[1]} năm {date[0]}</p>
        )
    }

    const parseDate = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
        const [year, month, day, hour, minute] = dateArray;
        return new Date(year, month - 1, day, hour, minute);
    };

    // Định nghĩa cột của bảng
    const columns = [
        {
            title: 'Mã hợp đồng',
            dataIndex: 'contractNumber',
            key: 'contractNumber',
            sorter: (a, b) => a.contractNumber.localeCompare(b.contractNumber),
        },
        {
            title: 'Tên hợp đồng',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <Link className='text-cyan-600 font-semibold' to={`/contractDetail/${record.id}`}>
                    {text}
                </Link>
            ),
        },
        {
            title: 'Ngày ký',
            dataIndex: 'signingDate',
            key: 'signingDate',
            sorter: (a, b) => parseDate(a.signingDate) - parseDate(b.signingDate),
            render: date => renderDate(date),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                Displaystatus[status]
            ),
            filters: statusFilters,
            // Giữ filters nhưng không dùng onFilter để tương thích server-side sau này
        },
        {
            title: 'Giá trị',
            dataIndex: 'amount',
            key: 'amount',
            render: amount =>
                new Intl.NumberFormat('vi-VN').format(amount) + ' VND',
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: 'Ngày hết hạn',
            dataIndex: 'expiryDate',
            key: 'expiryDate',
            sorter: (a, b) => parseDate(a.expiryDate) - parseDate(b.expiryDate),
            render: date => renderDate(date),
        },
    ];

    // const sortedData = (partnerContractData?.data?.content || []).sort((a, b) => new Date(b.signDate) - new Date(a.signDate));

    // Xử lý trạng thái loading và error
    if (isFetchingContractData) return <Skeleton active />;
    if (fetchErrorContractData) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;

    // Sắp xếp dữ liệu theo ngày ký giảm dần (mặc định)


    return (
        <div>
            <Space style={{ marginBottom: 16 }} className='w-full'>
                <Input
                    placeholder="Tìm kiếm theo tên, ngày ký, mã hợp đồng, ngày hết hạn, trạng thái"
                    onChange={e => debouncedSetSearchText(e.target.value)}
                    prefix={<SearchOutlined />}
                    className='w-full min-w-[500px]'
                />
            </Space>
            <ConfigProvider
                theme={{
                    components: {
                        Table: {
                            headerBg: '#2196f3',
                            headerSortActiveBg: "#44b1ff",
                            headerFilterHoverBg: "#44b1ff",
                            headerSortHoverBg: "#44b1ff",
                            headerColor: "#fff"
                        },
                    },
                }}
            >
                <Table
                    dataSource={partnerContractData?.data?.content}
                    columns={columns}
                    rowKey="contractId"
                    bordered
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: partnerContractData?.totalElements || 0,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                    }}
                    onChange={handleTableChange}
                />
            </ConfigProvider>
        </div>
    );
};

export default ContractPartner;