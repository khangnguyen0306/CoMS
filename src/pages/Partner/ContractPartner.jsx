import React, { useState, useEffect } from 'react';
import { Input, Table, Tag, Space, Skeleton, Card, Empty, ConfigProvider } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useGetContractByPartnerQuery } from '../../services/PartnerAPI';
import { Link } from 'react-router-dom';

const ContractPartner = ({ partnerId }) => {
    const { data: contractData, isLoading: isFetching, error: fetchError } = useGetContractByPartnerQuery(partnerId);
    const [searchText, setSearchText] = useState('');






    const filteredData = contractData?.filter(contract =>
        contract.contractName.toLowerCase().includes(searchText.toLowerCase()) ||
        contract.signDate.includes(searchText) ||
        contract.contractId.includes(searchText) ||
        contract.expirationDate.includes(searchText) ||
        contract.status.toLowerCase().includes(searchText.toLowerCase())
    );

    const statusFilters = [
        { text: 'Đã ký', value: 'Đã ký' },
        { text: 'Đang hiệu lực', value: 'Đang hiệu lực' },
        { text: 'Hết hiệu lực', value: 'Hết hiệu lực' },
        { text: 'Đã hết hạn', value: 'Đã hết hạn' },
        { text: 'Đang chờ ký', value: 'Đang chờ ký' },
    ];

    const columns = [
        {
            title: 'Mã hợp đồng',
            dataIndex: 'contractId',
            key: 'contractId',
            sorter: (a, b) => a.contractId.localeCompare(b.contractId),
        },
        {
            title: 'Tên hợp đồng',
            dataIndex: 'contractName',
            key: 'contractName',
            render: text => <Link className='text-cyan-600 font-semibold' to={`/contract/${text}`}>{text}</Link>,
        },
        {
            title: 'Ngày ký',
            dataIndex: 'signDate',
            key: 'signDate',
            sorter: (a, b) => new Date(a.signDate) - new Date(b.signDate),   ///////////////chưa format
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                <Tag color={status === 'Đang hiệu lực' ? 'green' :
                    status === 'Đã hết hạn' ? 'red' :
                        status === 'Đang chờ ký' ? 'blue' :
                            status === 'Hết hiệu lực' ? 'orange' : 'default'}>
                    {status}
                </Tag>
            ),
            filters: statusFilters,
            onFilter: (value, record) => record.status.includes(value),
        },
        {
            title: 'Giá trị',
            dataIndex: 'value',
            key: 'value',
            render: value => `${value.toLocaleString()} VND`,
            sorter: (a, b) => a.value - b.value,
        },
        {
            title: 'Ngày hết hạn',
            dataIndex: 'expirationDate',
            key: 'expirationDate',
            sorter: (a, b) => new Date(a.expirationDate) - new Date(b.expirationDate),    ///////////////chưa format
        },
    ];

    if (isFetching) return <Skeleton active />;
    if (fetchError) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;
    return (
        <div>
            <Space style={{ marginBottom: 16 }} className='w-full'>
                <Input
                    placeholder="Tìm kiếm theo tên, ngày ký, mã hợp đồng, ngày hết hạn, trạng thái"
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    prefix={<SearchOutlined />}
                    className='w-full'
                />
            </Space>
            <ConfigProvider
                theme={{
                    components: {
                        Table: {
                            headerBg:'#c7eaf7',
                            headerSortActiveBg:"#44b1ff",
                            headerFilterHoverBg:"#44b1ff",
                            headerSortHoverBg:"#44b1ff",
                            headerColor:"#005580"
                        },
                    },
                }}
            >


                <Table
                    dataSource={filteredData.sort((a, b) => new Date(b.signDate) - new Date(a.signDate))}
                    columns={columns}
                    rowKey="contractId"
                    bordered
                />
            </ConfigProvider>
        </div>
    );
};

export default ContractPartner;
