import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag } from "antd";
import { EditOutlined, DeleteOutlined, SettingOutlined, FullscreenOutlined, EditFilled, PlusOutlined, SendOutlined, CheckCircleFilled, UndoOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../slices/authSlice";
import { useGetContractPorcessPendingQuery } from "../../../services/ProcessAPI";
import ExpandRowContent from "../../Contract/component/ExpandRowContent";
import { useDeleteAppendixMutation, useGetAllAppendixBySelfQuery, useResubmitAppendixMutation } from "../../../services/AppendixAPI";
import Process from "../../Process/Process";
import { IoDuplicate } from "react-icons/io5";
import { IoSend } from "react-icons/io5";
import DuplicateModal from "../component/DuplicateAppendix";
const { Search } = Input;

const AppendixManagement = () => {

    const navigate = useNavigate()
    const user = useSelector(selectCurrentUser)
    const [searchText, setSearchText] = useState("");
    const [selectedContract, setSelectedContract] = useState(null)
    const [searchParams] = useSearchParams();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const [status, setStatus] = useState(searchParams.get('paramstatus') || null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isVisibleDuplicate, setIsVisibleDuplicate] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedContractId, setSelectedContractId] = useState(null);


    const { data: appendixs, isLoading, isError, refetch } = useGetAllAppendixBySelfQuery({
        page: pagination.current - 1,
        size: pagination.pageSize,
        keyword: searchText,
        statuses: status
    });

    const { data: contractManager } = useGetContractPorcessPendingQuery({ approverId: user.id });
    const [deleteappendix] = useDeleteAppendixMutation()
    const [resubmitAppendix] = useResubmitAppendixMutation()


    const tableData = appendixs?.data?.content;



    const handleOpenDuplicate = (record) => {
        setSelectedContractId(record)
        setIsVisibleDuplicate(true);
    };

    const handleCancelDuplicate = () => {
        setIsVisibleDuplicate(false);
    };

    useEffect(() => {
        const newStatus = searchParams.get('paramstatus');
        setStatus(newStatus || null);
    }, [searchParams]);


    useEffect(() => {
        refetch();
    }, [searchParams, status])




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

    const handleResubmit = async (record) => {
        Modal.confirm({
            title: 'Phụ lục sẽ được gửi lại để phê duyệt',
            onOk: async () => {
                try {
                    await resubmitAppendix(record.addendumId).unwrap();
                } catch (error) {
                    console.log(error)
                    if (error.originalStatus == 200) {
                        message.success(error.data);
                        refetch()
                    } else {
                        const errorMessage = error?.data?.message?.split(": ")?.[1] || "Gửi yêu cầu phê duyệt phụ lục thất bại!";
                        message.error(errorMessage);
                    }


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
        'SIGNED': <Tag color="purple-inverse">Đã ký</Tag>,
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
            render: (text, record) => (
                <Link to={`${(user.roles[0] === "ROLE_STAFF") ? `/appendixDetail/${record.contractId}/${record.addendumId}` : (user.roles[0] === "ROLE_DIRECTOR" ? `/director/appendixDetail/${record.contractId}/${record.addendumId}` : `/manager/appendixDetail/${record.contractId}/${record.addendumId}`)}`} className="font-bold text-[#228eff] cursor-pointer">
                    <p> {text} </p>
                </Link>
            ),
        },
        // {
        //     title: "Loại phụ lục",
        //     dataIndex: "addendumType",
        //     key: "addendumType",
        //     render: (value) =>
        //     // user.roles[0] === "ROLE_MANAGER" ? (
        //     //     <Tag color="blue">{value}</Tag>
        //     (
        //         <Tag color="blue">{value.name}</Tag>
        //     ),
        //     // filters:
        //     //     user.roles[0] === "ROLE_MANAGER"
        //     //         ? [...new Set(tableData?.data.map(appendix => appendix.addendumType))].map(type => ({
        //     //             text: type,
        //     //             value: type,
        //     //         }))
        //     //         : [...new Set(tableData?.data.map(appendix => appendix.appendixType.name))].map(type => ({
        //     //             text: type,
        //     //             value: type,
        //     //         })),
        //     // onFilter:
        //     //     user.roles[0] === "ROLE_MANAGER"
        //     //         ? (value, record) => record.addendumType === value
        //     //         : (value, record) => record.appendixType.name === value,
        // },

        // {
        //     title: "Ngày có hiệu lực",
        //     dataIndex: "effectiveDate",
        //     key: "effectiveDate",
        //     render: (dateArray) => {
        //         if (!dateArray || dateArray.length < 3) {
        //             return 'N/A'; // or any default value you want to show
        //         }
        //         const [year, month, day] = dateArray;
        //         return dayjs(`${year}-${month}-${day}`).format('DD/MM/YYYY');
        //     },
        //     sorter: (a, b) => {
        //         const dateA = a?.effectiveDate ? new Date(a.effectiveDate[0], a.effectiveDate[1] - 1, a.effectiveDate[2]) : new Date(0); // Default to epoch if null
        //         const dateB = b?.effectiveDate ? new Date(b.effectiveDate[0], b.effectiveDate[1] - 1, b.effectiveDate[2]) : new Date(0); // Default to epoch if null
        //         return dateB - dateA;
        //     }
        // },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            filters: Object.keys(statusAppendix).map(status => ({
                text: status,
                value: status,
            })),
            onFilter: (value, record) => record.status === value,
            render: (status) => statusAppendix[status] || <Tag>{status}</Tag>,
            sorter: (a, b) => a.status.localeCompare(b.status),
        },
        ...(user.roles[0] !== "ROLE_MANAGER" && user.roles[0] !== "ROLE_DIRECTOR" ? [{

            title: "Hành động",
            key: "action",
            render: (_, record) => {
                if (user.roles.includes("ROLE_MANAGER") || user.roles.includes("ROLE_DIRECTOR")) {
                    return null; // Do not render the actions for these roles
                }
                return (
                    <Space>
                        {record?.status === "APPROVED" ? (
                            <div className="flex gap-2">
                                <Button type="default" onClick={() => handleOpenDuplicate(record)} icon={<IoDuplicate />}></Button>
                                {/* <Button type="default" icon={<IoSend style={{ color: '#40a9ff', fontSize: 15 }} />}></Button> */}
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
                                        ...(record.status === "REJECTED" ? [
                                            {
                                                key: "select-process",
                                                icon: <UndoOutlined style={{ color: "#ffcf48" }} />,
                                                label: (
                                                    <span onClick={() => handleResubmit(record)}>
                                                        Gửi lại yêu cầu phê duyệt
                                                    </span>
                                                ),
                                            }] :
                                            (record.status != "APPROVAL_PENDING" && record.status != "APPROVED") ? [
                                                {
                                                    key: "select-process",
                                                    icon: <CheckCircleFilled style={{ color: "#00FF33" }} />,
                                                    label: (
                                                        <span onClick={() => showModal(record)}>
                                                            Yêu cầu phê duyệt
                                                        </span>
                                                    ),
                                                }] : []),
                                        {
                                            key: "duplicate",
                                            icon: <IoDuplicate />,
                                            label: "Nhân bản phụ lục",
                                            onClick: () => handleOpenDuplicate(record),
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
                );
            },

        }] : []),
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

    // console.log(selectedRecord)

    return (
        <div className="flex flex-col md:flex-row min-h-[100vh]">
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    QUẢN LÝ PHỤ LỤC HỢP ĐỒNG
                </p>
                <Space className="mb-[16px] flex items-center justify-between" >
                    <Search
                        placeholder="Nhập tên phụ lục, tên partner hoặc tên người tạo"
                        allowClear
                        onSearch={setSearchText}
                        style={{ width: "100%", minWidth: 500, maxWidth: 1200, marginBottom: 20 }}
                        className="block"
                        enterButton="Tìm kiếm"
                        disabled={isLoading}
                    />
                    {/* <div>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                        >
                            <Link to={'/CreateAppendix'}> Tạo phụ lục</Link>
                        </Button>
                    </div> */}
                </Space>
                <Table
                    columns={columns}
                    dataSource={tableData}
                    rowKey="addendumId"
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
                        expandedRowRender: (record) => <ExpandRowContent appendixId={record.addendumId} />,
                    }}
                    onRow={(record) => ({ onClick: () => setSelectedContract(record) })}
                />
                <Modal
                    title="Chi tiết bản ghi"
                    width={"80%"}
                    footer={null}
                    open={isModalVisible}
                    onOk={handleOk}
                    onCancel={handleCancel}
                >

                    <Process
                        appendix={true}
                        appendixId={selectedRecord?.addendumId}
                        // appendixTypeId={selectedRecord?.addendumType.addendumTypeId}
                        contractId={selectedRecord?.contractId}
                        contractTypeId={selectedRecord?.contractType?.id}
                        onProcessApplied={() => {
                            handleCancel();
                            refetch();
                        }}
                    />
                </Modal>

                <DuplicateModal
                    visible={isVisibleDuplicate}
                    handleCancelDuplicate={handleCancelDuplicate}
                    record={selectedContractId}
                    setSelectedContractId={setSelectedContractId}
                    refetch={refetch}
                />
            </div>

        </div>
    );
};

export default AppendixManagement;
