import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag, Typography } from "antd";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../slices/authSlice";
import { useGetContractPorcessPendingQuery } from "../../services/ProcessAPI";

const { Search } = Input;
const { Text } = Typography;
const ManageContractApproval = () => {
    const user = useSelector(selectCurrentUser);
    const { data: contracts, isLoading, isError, refetch } = useGetContractPorcessPendingQuery({ approverId: user?.id });
    const [searchText, setSearchText] = useState("");
    console.log(contracts)
    console.log(user?.id)
    useEffect(() => {
        refetch();
    }, [contracts]);

    const columns = [
        {
            title: "Mã hợp đồng",
            dataIndex: "id",
            key: "id",
            width: "10%",
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            width: "12%",
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
            defaultSortOrder: "ascend",
        },
        {
            title: "Người tạo",
            dataIndex: ["user", "full_name"],
            key: "user?.full_name",
            width: "10%",
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "title",
            key: "title",
            width: "20%",
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text, record) => (
                <Link
                    className="font-bold text-[#228eff] block truncate max-w-[200px]"
                    to={
                        user?.roles?.includes("ROLE_STAFF")
                            ? `/approvalContract/reviewContract/${record.id}`
                            : `/manager/approvalContract/reviewContract/${record.id}`
                    }
                    title={text} // Hiển thị tooltip mặc định của trình duyệt
                >
                    {text}
                </Link>
            )

        },

        {
            title: "Loại hợp đồng",
            dataIndex: "contractTypeName",
            key: "contractTypeName",
            width: "15%",
            render: (type) => <Tag color="blue">{type}</Tag>,
            // filters: [...new Set(contracts?.map(contract => contract.contract_type))].map(type => ({
            //     text: type,
            //     value: type,
            // })),
            onFilter: (value, record) => record.contract_type === value,
        },
        {
            title: "Đối tác",
            dataIndex: ["partner", "partnerName"],
            key: "partner.partnerName",
            width: "18%",
            sorter: (a, b) => a.partner.localeCompare(b.partner),
        },

        {
            title: "Giá trị",
            dataIndex: "amount",
            key: "amount",
            width: "15%",
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
                        onSearch={setSearchText}
                        style={{ width: "100%", minWidth: 500, maxWidth: 1200, marginBottom: 20 }}
                        enterButton="Tìm kiếm"
                        disabled={isLoading}
                    />
                </Space>
                <Table
                    columns={columns}
                    dataSource={contracts?.data?.filter(item =>
                        item?.title?.toLowerCase().includes(searchText.toLowerCase()) ||
                        item?.party?.partnerName?.toLowerCase().includes(searchText.toLowerCase()) ||
                        item?.user?.full_name?.toLowerCase().includes(searchText.toLowerCase())
                        // item.contract_code.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    rowKey="id"
                    loading={isLoading}
                // onRow={(record) => ({ onClick: () => setSelectedContract(record) })}
                />
            </div>

        </div>
    );
};

export default ManageContractApproval;
