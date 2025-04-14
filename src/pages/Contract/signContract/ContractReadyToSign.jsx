import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Tag, Collapse, Tooltip } from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useGetAllContractQuery } from "../../../services/ContractAPI";
import dayjs from "dayjs";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../slices/authSlice";
import ExportContractPDF from "./../component/ExportContractPDF";
import ExpandRowContent from "../component/ExpandRowContent";
const { Search } = Input;

const ContractReadyToSign = () => {
    const { Panel } = Collapse
    const [searchTextStaff, setSearchTextStaff] = useState("");
    const [searchTextManager, setSearchTextManager] = useState("");
    const [selectedContract, setSelectedContract] = useState(null)
    const [paginationStaff, setPaginationStaff] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [paginationManager, setPaginationManager] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [status, setStatus] = useState(null);

    const { data: contracts, isLoading, isError, refetch } = useGetAllContractQuery({
        page: paginationStaff.current - 1,
        size: paginationStaff.pageSize,
        keyword: searchTextStaff,
        status: "APPROVED"
    });
    const user = useSelector(selectCurrentUser)
    const tableData = contracts?.data?.content;
    const [selectedContractIdExport, setSelectedContractIdExport] = useState(null);


    useEffect(() => {
        refetch();
    }, [paginationManager, paginationStaff, searchTextStaff, searchTextManager, status]);

    const statusContract = {
        'CREATED': <Tag color="default">Đã tạo</Tag>,
        'APPROVAL_PENDING': <Tag color="gold-inverse">Chờ phê duyệt</Tag>,
        'APPROVED': <Tag color="success">Đã phê duyệt chờ ký</Tag>,
        'UPDATED': <Tag color="success">Đã cập nhật</Tag>,
        'PENDING': <Tag color="warning">Đang chờ</Tag>,
        'REJECTED': <Tag color="red">Từ chối</Tag>,
        'SIGNED': <Tag color="geekblue">Đã ký</Tag>,
        'ACTIVE': <Tag color="processing">Đang hiệu lực</Tag>,
        'COMPLETED': <Tag color="success">Hoàn thành</Tag>,
        'EXPIRED': <Tag color="red">Hết hiệu lực</Tag>,
        'CANCELLED': <Tag color="red-inverse">Đã hủy</Tag>,
        'ENDED': <Tag color="default">Đã kết thúc</Tag>
    }

    const handleExport = (id) => {
        setSelectedContractIdExport(id);
    };

    const columns = [
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
                        maxWidth: 80
                    }}>
                        {text}
                    </div>
                </Tooltip>
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
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
            title: "Người tạo",
            dataIndex: "user",
            key: "user",
            filters: [...new Set(tableData?.map(contract => contract?.user?.full_name))].map(name => ({
                text: name,
                value: name,
            })),
            render: (user) => <Link className="font-bold text-[#228eff]">{user?.full_name}</Link>,
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "title",
            key: "title",
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text, record) => (
                <Link to={`/director/signContract/${record.id}`} className="font-bold text-[#228eff] cursor-pointer">
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
            filters:
                [...new Set(tableData?.map(contract => contract.contractType.name))].map(type => ({
                    text: type,
                    value: type,
                })),
            onFilter:

                (value, record) => record.contractType.name === value,
        },
        {
            title: "Đối tác",
            dataIndex: "partnerB",
            key: "partnerB",
            render: (partner) => <p>{partner.partnerName}</p>,
            filters: [...new Set(tableData?.map(contract => contract.partnerB.partnerName))].map(type => ({
                text: type,
                value: type,
            })),
            sorter: (a, b) => a.partnerB.partnerName.localeCompare(b.partnerB.partnerName),
        },

        {
            title: "Giá trị",
            dataIndex: "amount",
            key: "amount",
            render: (value) => value.toLocaleString("vi-VN") + " VND",
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            render: (status) => statusContract[status] || <Tag>{status}</Tag>,
            sorter: (a, b) => a.status.localeCompare(b.status),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button onClick={() => handleExport(record.id)} icon={<DownloadOutlined />}>Tải xuống PDF</Button>
                </Space>

            ),
        },
    ];

    const handleTableChange = (pagination, filters, sorter) => {
        setPaginationStaff(pagination);
        if (filters?.status && filters?.status.length > 0) {
            setStatus(filters?.status[0]);
        } else {
            setStatus(null);
        }
    };

    const handleSearch = (value) => {
        setSearchTextStaff(value);
    };

    return (
        <div className="flex flex-col md:flex-row min-h-[100vh]">
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    HỢP ĐỒNG ĐÃ DUYỆT CHỜ KÝ
                </p>
                <Space className="mb-[16px] flex items-center justify-between" >
                    <Search
                        placeholder="Nhập tên hợp đồng, tên partner hoặc tên người tạo"
                        allowClear
                        onSearch={handleSearch}
                        style={{ width: "100%", minWidth: 500, maxWidth: 1200, marginBottom: 20 }}
                        className="block"
                        enterButton="Tìm kiếm"
                        disabled={isLoading}
                    />
                </Space>
                <Table
                    columns={columns}
                    dataSource={tableData}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        current: paginationStaff.current,
                        pageSize: paginationStaff.pageSize,
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

            {selectedContractIdExport && (
                <ExportContractPDF
                    contractId={selectedContractIdExport}
                    onDone={() => setSelectedContractIdExport(null)}
                />
            )}

        </div>
    );
};

export default ContractReadyToSign;
