import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag } from "antd";
import { EditOutlined, DeleteOutlined, SettingOutlined, FullscreenOutlined, EditFilled, PlusOutlined, SendOutlined, CheckCircleFilled } from "@ant-design/icons";
import { BsClipboard2DataFill } from "react-icons/bs"
import { IoNotifications } from "react-icons/io5";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { BiDuplicate } from "react-icons/bi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../slices/authSlice";
import { useGetContractPorcessPendingQuery } from "../../../services/ProcessAPI";
import ExpandRowContent from "../../Contract/component/ExpandRowContent";
import { useDeleteAppendixMutation, useGetAllAppendixByApproverQuery, useGetAllAppendixBySelfQuery } from "../../../services/AppendixAPI";
import Process from "../../Process/Process";

const { Search } = Input;

const AppendixManagementManager = () => {
    const user = useSelector(selectCurrentUser)
    const [searchText, setSearchText] = useState("");
    const [selectedContract, setSelectedContract] = useState(null)
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const [status, setStatus] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    ////////////////////////////////////////////////////////////////
    const { data: appendixs, isLoading, isError, refetch } = useGetAllAppendixByApproverQuery({
        approverId: user.id,
        page: pagination.current - 1,
        size: pagination.pageSize,
    });
    console.log(appendixs)


    const { data: contractManager } = useGetContractPorcessPendingQuery({ approverId: user.id });
    const navigate = useNavigate()
    const [deleteappendix] = useDeleteAppendixMutation()


    // const isManager = user?.roles[0] === "ROLE_MANAGER";
    const tableData = appendixs?.data.content;

    useEffect(() => {
        refetch();
    }, [])




    const handleDelete = (record) => {
        if (record?.status === "APPROVED" || record?.status === "APPROVAL_PENDING") {
            message.warning("Không thể xóa phụ lục " + (record?.status === "APPROVED" ? "Đã được phê duyệt." : "Đang được phê duyệt."));
            return;
        }
        Modal.confirm({
            title: 'Bạn có chắc muốn xóa phụ lục này không?',
            onOk: async () => {
                try {
                    await deleteappendix(record.addendumId).unwrap();
                    message.success("Xóa phụ lục thành công!");
                    refetch()
                } catch (error) {
                    const errorMessage = error?.data?.message?.split(": ")?.[1] || "Xóa phụ lục thất bại, vui lòng thử lại!";
                    message.error(errorMessage);
                }
            },
            okText: 'Xóa',
            cancelText: 'Hủy',
        });

    };

    const statusAppendix = {
        'CREATED': <Tag color="default">Đã tạo</Tag>,
        'APPROVAL_PENDING': <Tag color="gold-inverse">Chờ phê duyệt</Tag>,
        'APPROVED': <Tag color="green-inverse">Đã phê duyệt</Tag>,
        'UPDATED': <Tag color="blue-inverse">Đã cập nhật</Tag>,
        'REJECTED': <Tag color="red-inverse">Từ chối</Tag>,
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
            title: "Tên phụ lục",
            dataIndex: "title",
            key: "title",
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text,record) => (
                <Link to={`${user.roles[0] === "ROLE_STAFF" ? `/appendixDetail/${record.contractId}/${record.addendumId}` : `/manager/appendixDetail/${record.contractId}/${record.addendumId}`}`} className="font-bold text-[#228eff] cursor-pointer">
                    <p> {text} </p>
                </Link>
            ),
        },
        {
            title: "Loại phụ lục",
            dataIndex: "addendumType",
            key: "addendumType",
            render: (value) => (
                <Tag color="blue">{value.name}</Tag>
            ),
            filters: [...new Set(tableData?.map(appendix => appendix.addendumType.name))].map(name => ({
                text: name,
                value: name,
            })),
            onFilter: (value, record) => record.addendumType.name === value,
        },

        {
            title: "Ngày có hiệu lực",
            dataIndex: "effectiveDate",
            key: "effectiveDate",
            render: (dateArray) => {
                const [year, month, day] = dateArray;
                return dayjs(`${year}-${month}-${day}`).format('DD/MM/YYYY');
            },
            sorter: (a, b) => {
                const dateA = new Date(a.effectiveDate[0], a.effectiveDate[1] - 1, a.effectiveDate[2]);
                const dateB = new Date(b.effectiveDate[0], b.effectiveDate[1] - 1, b.effectiveDate[2]);
                return dateB - dateA;
            }
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            filters: Object.keys(statusAppendix).map(status => ({
                text: statusAppendix[status].props.children, 
                value: status,
            })),
            onFilter: (value, record) => record.status === value,
            render: (status) => statusAppendix[status] || <Tag>{status}</Tag>,
            sorter: (a, b) => a.status.localeCompare(b.status),
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    {record?.status === "APPROVED" ? (
                        <div>
                            <Button type="primary">Gửi ký <SendOutlined /></Button>
                        </div>
                    ) : (
                        <Dropdown
                            menu={{
                                items: [
                                    ...(record.status !== "APPROVAL_PENDING" && record.status !== "APPROVED"
                                        ? [{
                                            key: "edit",
                                            icon: <EditFilled style={{ color: '#228eff' }} />,
                                            label: "Sửa",
                                            onClick: () => navigate(`/CreateAppendix/?appendixId=${record.addendumId}`),
                                        }]
                                        : []),
                                    ...(record.status == "ACTIVE"
                                        ? [{
                                            key: "createAppendix",
                                            icon: <PlusOutlined style={{ color: '#228eff' }} />,
                                            label: "Tạo phụ lục",
                                            onClick: () => navigate(`/CreateAppendix/?contractId=${record.contractId}`),
                                        }]
                                        : []),
                                    ...(record.status != "APPROVAL_PENDING" && record.status != "APPROVED") ? [
                                        {
                                            key: "select-process",
                                            icon: <CheckCircleFilled style={{ color: "#00FF33" }} />,
                                            label: (
                                                <span onClick={() => showModal(record)}>

                                                    Yêu cầu phê duyệt
                                                </span>
                                            ),
                                        }] : [],
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
        }
    ];

    const handleTableChange = (pagination, filters, sorter) => {
        setPagination(pagination);
        if (filters?.status && filters?.status.length > 0) {
            setStatus(filters?.status[0]);
        } else {
            setStatus(null);
        }
    };

    const showModal = (record) => {
        console.log(record)
        setSelectedRecord(record);
        setIsModalVisible(true);
    };

    const handleOk = () => {
        setIsModalVisible(false);
        setSelectedRecord(null);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedRecord(null);
        refetch();

    };

    return (
        <div className="flex flex-col md:flex-row min-h-[100vh]">
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    PHỤ LỤC CẦN PHÊ DUYỆT
                </p>
                <Space className="mb-[16px] flex items-center justify-between" >
                    <Search
                        placeholder="Nhập tên phụ lục, mã hợp đồng"
                        allowClear
                        onSearch={setSearchText}
                        style={{ width: "100%", minWidth: 500, maxWidth: 1200, marginBottom: 20 }}
                        className="block"
                        enterButton="Tìm kiếm"
                        disabled={isLoading}
                    />
                </Space>
                <Table
                    columns={columns}
                    dataSource={tableData}
                    rowKey={(record) => record.addendumId}
                    loading={isLoading}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: appendixs?.data.totalElements || 0,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `Tổng ${total} phụ lục`,
                    }}
                    onChange={handleTableChange}
                    expandable={{
                        expandedRowRender: (record) => <ExpandRowContent appendixId={record?.addendumId} />,
                    }}
                    onRow={(record) => ({ onClick: () => setSelectedContract(record) })}
                />

            </div>

        </div>
    );
};

export default AppendixManagementManager;
