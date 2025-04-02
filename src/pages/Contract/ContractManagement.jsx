import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag } from "antd";
import { EditOutlined, DeleteOutlined, SettingOutlined, FullscreenOutlined, EditFilled, PlusOutlined } from "@ant-design/icons";
import { useDuplicateContractMutation, useGetAllContractQuery, useSoftDeleteContractMutation } from "../../services/ContractAPI";
import { BsClipboard2DataFill } from "react-icons/bs"
import { IoNotifications } from "react-icons/io5";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { BiDuplicate } from "react-icons/bi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../slices/authSlice";
import { useGetContractPorcessPendingQuery, useGetProcessByContractIdQuery, useLazyGetProcessByContractIdQuery } from "../../services/ProcessAPI";
import ExpandRowContent from "./component/ExpandRowContent";
import { useGetNumberNotiForAllQuery } from "../../services/NotiAPI";
const { Search } = Input;

const ManageContracts = () => {

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
    const [duplicateContract] = useDuplicateContractMutation();
    const { data: contracts, isLoading, isError, refetch } = useGetAllContractQuery({
        page: paginationStaff.current - 1,
        size: paginationStaff.pageSize,
        keyword: searchTextStaff,
        status: status
    });
    const { refetch: refetchNoti } = useGetNumberNotiForAllQuery();
    const user = useSelector(selectCurrentUser)
    const { data: contractManager, isLoading: isLoadingManager, refetch: refetchManager } = useGetContractPorcessPendingQuery({
        approverId: user.id,
        page: paginationManager.current - 1,
        size: paginationManager.pageSize,
        keyword: searchTextManager,
    });
    const navigate = useNavigate()
    const [softDelete] = useSoftDeleteContractMutation()
    // console.log(contractManager)
    const isManager = user?.roles[0] === "ROLE_MANAGER";
    const tableData = isManager ? contractManager?.data.content : contracts?.data?.content;

    useEffect(() => {
        if (isManager) {
            refetchManager();
        } else {
            refetch();
        }
    }, [paginationManager, paginationStaff, searchTextStaff, searchTextManager, status, isManager]);

    // console.log(selectedContract)
    const handleDuplicate = async (contractId) => {
        try {
            const result = await duplicateContract(contractId).unwrap();
            console.log(result);
            if (result?.status === "OK") {
                message.success("Nhân bản hợp đồng thành công!");
                refetch();
                refetchNoti();
            }

        } catch (error) {
            console.error("Error duplicating template:", error);
            message.error("Lỗi khi nhân bản hợp đồng!");
        }
    };
    const handleDelete = (record) => {
        if (record?.status === "ACTIVE" || record?.status === "SIGNED") {
            message.warning("Không thể xóa hợp đồng đang hiệu lực hoặc đã thanh toán.");
            return;
        }
        Modal.confirm({
            title: 'Bạn có chắc muốn xóa hợp đồng này không?',
            onOk: async () => {
                try {
                    await softDelete(record.id).unwrap();
                    message.success("Xóa hợp đồng thành công!");
                    refetch();
                    refetchNoti();
                } catch (error) {
                    const errorMessage = error?.data?.message?.split(": ")?.[1] || "Xóa hợp đồng thất bại, vui lòng thử lại!";
                    message.error(errorMessage);
                }
            },

            okText: 'Xóa',
            cancelText: 'Hủy',
        });

    };

    const statusContract = {
        'DRAFT': <Tag color="default">Đang tạo</Tag>,
        'CREATED': <Tag color="default">Đã tạo</Tag>,
        'APPROVAL_PENDING': <Tag color="gold-inverse">Chờ phê duyệt</Tag>,
        'APPROVED': <Tag color="success">Đã phê duyệt</Tag>,
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

    const columns = [
        {
            title: "Mã hợp đồng",
            dataIndex: "contractNumber",
            key: "contractNumber",
            sorter: (a, b) => a.contractNumber.localeCompare(b.contractNumber),
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
                <Link to={`${user.roles[0] === "ROLE_STAFF" ? `/ContractDetail/${record.id}` : `/manager/ContractDetail/${record.id}`}`} className="font-bold text-[#228eff] cursor-pointer">
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
            dataIndex: "partner",
            key: "partner",
            render: (partner) => <p>{partner.partnerName}</p>,
            filters: [...new Set(tableData?.map(contract => contract.partner.partnerName))].map(type => ({
                text: type,
                value: type,
            })),
            sorter: (a, b) => a.partner.partnerName.localeCompare(b.partner.partnerName),
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
            filters: Object.keys(statusContract).map(status => ({
                text: status,
                value: status,
            })),
            onFilter: (value, record) => record.status === value,
            render: (status) => statusContract[status] || <Tag>{status}</Tag>,
            sorter: (a, b) => a.status.localeCompare(b.status),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    {record?.status === "APPROVED" ? (
                        <Button>Gửi ký</Button>
                    ) : (
                        <Dropdown
                            menu={{
                                items: [
                                    ...(record.status !== "APPROVAL_PENDING" && record.status !== "APPROVED" && record.status !== "SIGNED" && record.status !== "ACTIVE" && record.status !== "COMPLETED" && record.status !== "EXPIRED" && record.status !== "CANCELLED" && record.status !== "ENDED"
                                        ? [{
                                            key: "edit",
                                            icon: <EditFilled style={{ color: '#228eff' }} />,
                                            label: "Sửa",
                                            onClick: () => navigate(`/EditContract/${record.id}`),
                                        }]
                                        : []),
                                    ...(record.status == "ACTIVE"
                                        ? [{
                                            key: "createAppendix",
                                            icon: <PlusOutlined style={{ color: '#228eff' }} />,
                                            label: "Tạo phụ lục",
                                            onClick: () => navigate(`/CreateAppendix/?contractId=${record.id}&contractNumber=${record.contractNumber}`),
                                        }]
                                        : []),

                                    {
                                        key: "duplicate",
                                        icon: <BiDuplicate style={{ color: '#228eff' }} />,
                                        label: "Nhân bản",
                                        onClick: () => handleDuplicate(record.id),
                                    },
                                    {
                                        key: "updateStatus",
                                        icon: <BsClipboard2DataFill />,
                                        label: "Cập nhật trạng thái",
                                        onClick: () => message.info("Cập nhật trạng thái hợp đồng!"),
                                    },
                                    {
                                        key: "updateNotification",
                                        icon: <IoNotifications />,
                                        label: "Cập nhật thông báo",
                                        onClick: () => message.info("Cập nhật thông báo hợp đồng!"),
                                    },
                                    {
                                        key: "delete",
                                        icon: <DeleteOutlined />,
                                        label: "Xóa",
                                        danger: true,
                                        onClick: () => handleDelete(record),
                                    },
                                ],
                            }}
                        >
                            <Button><SettingOutlined /></Button>
                        </Dropdown>
                    )}
                </Space>
            ),
        },
    ];

    const handleTableChange = (pagination, filters, sorter) => {
        if (isManager) {
            setPaginationManager(pagination);
        } else {
            setPaginationStaff(pagination);
        }
        if (filters?.status && filters?.status.length > 0) {
            setStatus(filters?.status[0]);
        } else {
            setStatus(null);
        }
    };

    const handleSearch = (value) => {
        if (isManager) {
            setSearchTextManager(value);
        } else {
            setSearchTextStaff(value);
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-[100vh]">
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    QUẢN LÝ HỢP ĐỒNG
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
                    <div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                        >
                            <Link to={'/createContract'}> Tạo hợp đồng</Link>
                        </Button>
                    </div>
                </Space>
                <Table
                    columns={columns}
                    dataSource={tableData}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{
                        current: isManager ? paginationManager.current : paginationStaff.current,
                        pageSize: isManager ? paginationManager.pageSize : paginationStaff.pageSize,
                        total: isManager ? contractManager?.data.totalElements : contracts?.data?.totalElements || 0,
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
    );
};

export default ManageContracts;
