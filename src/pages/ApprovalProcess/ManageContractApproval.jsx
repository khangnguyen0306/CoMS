import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../slices/authSlice";
import { useGetContractPorcessPendingManagerQuery } from "../../services/ProcessAPI";
import { useGetNumberNotiForAllQuery } from "../../services/NotiAPI";

const { Search } = Input;
const { Text } = Typography;
const ManageContractApproval = () => {
    const user = useSelector(selectCurrentUser);

    const [page, setPage] = useState(0);
    const [size, setSize] = useState(10);
    const [searchText, setSearchText] = useState("");
    const { refetch: refetchNoti } = useGetNumberNotiForAllQuery();

    const { data: contracts, isLoading, isError, refetch } = useGetContractPorcessPendingManagerQuery({
        approverId: user?.id,
        page,
        size,
        keyword: searchText
    });

    useEffect(() => {
        refetch();
        refetchNoti();
    }, [contracts]);

    useEffect(() => {
        refetch();
    }, [page, size, searchText]);

    const columns = [
        {
            title: "Mã hợp đồng",
            dataIndex: "contractNumber",
            key: "contractNumber",
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (createdAt) =>
                createdAt
                    ? dayjs(
                        new Date(createdAt[0], createdAt[1] - 1, createdAt[2])
                    ).format("DD/MM/YYYY")
                    : "Chưa cập nhật",
            sorter: (a, b) => {
                const dateA = new Date(a.createdAt[0], a.createdAt[1] - 1, a.createdAt[2], a.createdAt[3], a.createdAt[4], a.createdAt[5]);
                const dateB = new Date(b.createdAt[0], b.createdAt[1] - 1, b.createdAt[2], b.createdAt[3], b.createdAt[4], b.createdAt[5]);
                return dateA - dateB;
            },
            defaultSortOrder: "descend",
        },
        {
            title: "Người tạo",
            dataIndex: ["user", "full_name"],
            key: "full_name",
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "title",
            key: "title",
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text, record) => (
                <Link
                    className="font-bold text-[#228eff] block truncate max-w-[200px]"
                    to={
                        user?.roles?.includes("ROLE_STAFF")
                            ? `/approvalContract/reviewContract/${record.id}`
                            : user?.roles?.includes("ROLE_MANAGER")
                                ? `/manager/approvalContract/reviewContract/${record.id}`
                                : user?.roles?.includes("ROLE_DIRECTOR")
                                    ? `/director/approvalContract/reviewContract/${record.id}`
                                    : `/approvalContract/reviewContract/${record.id}`
                    }

                    title={text} // Hiển thị tooltip mặc định của trình duyệt
                >
                    {text}
                </Link>
            )

        },

        {
            title: "Loại hợp đồng",
            dataIndex: ["contractType", "name"],
            key: "contractType.name",
            render: (type) => <Tag color="blue">{type}</Tag>,
            filters: [...new Set(contracts?.data?.content.map(contract => contract.contractType.name))].map(type => ({
                text: type,
                value: type,
            })),
            onFilter: (value, record) => record.contractType.name === value,
        },
        {
            title: "Đối tác",
            dataIndex: ["partner", "partnerName"],
            key: "partner.partnerName",
            sorter: (a, b) => a.partner.localeCompare(b.partner),
        },

        {
            title: "Giá trị",
            dataIndex: "amount",
            key: "amount",
            render: (value) => value.toLocaleString("vi-VN") + " VND",
            sorter: (a, b) => a.value - b.value,
        },
        // {
        //     title: "Hành động",
        //     key: "action",
        //     render: (_, record) => (
        //         <Space>
        //             <Button
        //                 type="primary"
        //                 onClick={() => navigate('/manager/previewContract')}
        //             >
        //                 Xem chi tiết
        //             </Button>
        //         </Space>
        //     ),
        // },
    ];

    return (
        <div className="flex flex-col md:flex-row min-h-[100vh]">
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    HỢP ĐỒNG CẦN PHÊ DUYỆT
                </p>
                <Space style={{ marginBottom: 16 }}>
                    <Search
                        placeholder="Nhập tên hợp đồng, tên partner hoặc tên người tạo"
                        allowClear
                        onSearch={(value) => setSearchText(value)}
                        style={{ width: "100%", minWidth: 500, maxWidth: 1200 }}
                        enterButton="Tìm kiếm"
                        disabled={isLoading}
                    />
                </Space>
                <Table
                    columns={columns}
                    dataSource={contracts?.data?.content}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        current: page + 1,
                        pageSize: size,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        total: contracts?.data?.totalElements,
                        onChange: (newPage, newSize) => {
                            setPage(newPage - 1);
                            setSize(newSize);
                        }
                    }}
                />
            </div>

        </div>
    );
};

export default ManageContractApproval;
