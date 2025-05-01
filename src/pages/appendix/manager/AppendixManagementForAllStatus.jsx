import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag, Collapse, Tooltip, Empty, Image } from "antd";
import { EditOutlined, DeleteOutlined, SettingOutlined, FullscreenOutlined, EditFilled, PlusOutlined, SendOutlined, CheckCircleFilled, DownloadOutlined, SignatureOutlined, FilePdfOutlined } from "@ant-design/icons";
import { BsClipboard2DataFill } from "react-icons/bs"
import { IoNotifications } from "react-icons/io5";
import dayjs from "dayjs";
import { Link, useNavigate } from "react-router-dom";
import { BiDuplicate } from "react-icons/bi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../slices/authSlice";
import { useGetContractPorcessPendingQuery } from "../../../services/ProcessAPI";
import ExpandRowContent from "../../Contract/component/ExpandRowContent";
import { useDeleteAppendixMutation, useGetAllAppendixByApproverQuery, useGetAllAppendixByManagerQuery, useGetAllAppendixBySelfQuery, useGetAppendixDetailQuery, useGetImgBillAppendixQuery, useGetImgSignAppendixQuery } from "../../../services/AppendixAPI";

const { Search } = Input;
const { Panel } = Collapse;

const AppendixManagementForAllStatus = () => {
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);

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
    const [isUpdateStatusModalVisible, setIsUpdateStatusModalVisible] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [activePanel, setActivePanel] = useState([]);
    const [paymentId, setPaymentId] = useState(null);
    const [isOpenSignModal, setIsOpenSignModal] = useState(false);
    const [selectedAppendixtId, setSelectedAppendixtId] = useState(null);

    const { data: appendixs, isLoading, isError, refetch } = useGetAllAppendixByManagerQuery({
        managerId: user.id,
        params: {
            page: pagination.current - 1,
            size: pagination.pageSize,
        }
    });

    const { data: appendixData, isLoading: isLoadingDetailAppendix, isError: isErrorDetailAppendix, refetch: refetchDetailAppendix } = useGetAppendixDetailQuery(
        { id: selectedContractId },
        { skip: !selectedContractId },
        {
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true,
        }
    )



    const { data: dataBillAppendix, isLoading: isLoadingBillAppendix, error: errorBillAppendix, refetch: refetchBill } = useGetImgBillAppendixQuery({ id: paymentId }, {
        skip: !paymentId,
    });
    console.log("paymentId", paymentId)

    console.log("dataBillAppendix", dataBillAppendix)

    const { data: dataSign, isLoading: LoadingImage, isError: ErrorImage, refetch: refetchImg } = useGetImgSignAppendixQuery({ id: selectedAppendixtId }, {
        skip: !selectedAppendixtId,
    });



    // const { data: contractManager } = useGetContractPorcessPendingQuery({ approverId: user.id });
    const navigate = useNavigate()
    const [deleteappendix] = useDeleteAppendixMutation()


    // const isManager = user?.roles[0] === "ROLE_MANAGER";
    const tableData = appendixs?.data.content;

    useEffect(() => {
        refetch();
    }, [])


    const openUpdateStatusModal = (contractId) => {
        setSelectedContractId(contractId);
        setIsUpdateStatusModalVisible(true);
        refetchDetailAppendix();
    };

    const handleCloseUpdateStatusModal = () => {
        setIsUpdateStatusModalVisible(false);
        setSelectedContractId(null);
        setFileList([]);
    };

    const handleOpenSignModal = (addendumId) => {
        console.log("addendumId", addendumId)
        setSelectedAppendixtId(addendumId);
        setIsOpenSignModal(true);
    }

    const handleCloseUpdateSignModal = () => {
        setIsOpenSignModal(false);
        setSelectedAppendixtId(null);
        // refetch()
    }

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
        {
            title: "Tải file",
            dataIndex: "signedFilePath",
            key: "signedFilePath",
            render: (text, record) => (
                (record.status === "SIGNED" || record.status === "ACTIVE") && (
                    <div className="flex flex-col items-center gap-3">
                        {record.signedFilePath && (
                            <Button
                                type="primary"
                                className="px-2"
                                icon={<DownloadOutlined style={{ fontSize: "20px" }} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const link = document.createElement("a");
                                    link.href = record.signedFilePath;
                                    link.download = record.signedFilePath?.split("/").pop();
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                Tải file đã ký
                            </Button>
                        )}
                    </div>
                )
            )
        },

        // {
        //     title: "Ngày có hiệu lực",
        //     dataIndex: "effectiveDate",
        //     key: "effectiveDate",
        //     render: (dateArray) => {
        //         if (!dateArray || dateArray.length < 3) return "N/A";
        //         const [year, month, day] = dateArray;
        //         return dayjs(`${year}-${month}-${day}`).format('DD/MM/YYYY');
        //     },
        //     sorter: (a, b) => {
        //         if (!a.effectiveDate || a.effectiveDate.length < 3) return 1;
        //         if (!b.effectiveDate || b.effectiveDate.length < 3) return -1;
        //         const dateA = new Date(a.effectiveDate[0], a.effectiveDate[1] - 1, a.effectiveDate[2]);
        //         const dateB = new Date(b.effectiveDate[0], b.effectiveDate[1] - 1, b.effectiveDate[2]);
        //         return dateB - dateA;
        //     }
        // },
        {
            title: "Người tạo",
            dataIndex: "createdBy",
            key: "createdBy",
            render: (createdBy) => createdBy?.userName || "N/A",
            filters: [...new Set(tableData?.map(appendix => appendix.createdBy.userName))].map(userName => ({
                text: userName,
                value: userName,
            })),
            onFilter: (value, record) => record.createdBy.userName === value,
            sorter: (a, b) => a.createdBy.userName.localeCompare(b.createdBy.userName),
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

        ...(user.roles[0] !== "ROLE_ADMIN" ? [{

            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    {record?.status === "APPROVED" ? (
                        <div>
                            {/* <Button type="primary">Gửi ký <SendOutlined /></Button> */}
                        </div>
                    ) : (
                        <Dropdown
                            menu={{
                                items: [

                                    ...(record.status == "SIGNED"
                                        ? [{
                                            key: "updateStatus",
                                            icon: <BsClipboard2DataFill />,
                                            label: "Cập nhật trạng thái thanh toán",
                                            onClick: () => openUpdateStatusModal(record.addendumId),
                                        },]
                                        : []),
                                    ...(record.status == "SIGNED"
                                        ? [{
                                            key: "uploadImgSign",
                                            icon: <SignatureOutlined />,
                                            label: record.status === "SIGNED" ? "Xác nhận đã ký" : "Xem phụ lục đã ký",
                                            onClick: () => handleOpenSignModal(record.addendumId),
                                        }]
                                        : []),

                                ],
                            }}
                        >
                            <Button><SettingOutlined /></Button>
                        </Dropdown>
                    )}
                </Space>
            ),
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
        // console.log(record)
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
                    QUẢN LÝ PHỤ LỤC
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

                <Modal
                    title="Cập nhật trạng thái đã ký"
                    open={isOpenSignModal}
                    onCancel={handleCloseUpdateSignModal}
                    footer={null}
                    width={700}
                    destroyOnClose
                >
                    {LoadingImage ? (
                        <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                    ) : ErrorImage || !(dataSign?.data) ? (
                        <>
                            <h3 className="text-xl font-semibold text-center mb-4">Danh sách file đã tải lên</h3>
                            <div className="flex justify-center items-center w-full">

                                <Empty description="Chưa có file ký" />
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="text-xl font-semibold text-center mb-4">Danh sách file đã tải lên</h3>
                            <div
                                className="image-preview"
                                style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
                            >

                                {dataSign?.data?.map((url, idx) => {
                                    const isImage = /\.(jpe?g|png|gif)$/i.test(url);
                                    const isPDF = /\.pdf$/i.test(url);

                                    if (isImage) {
                                        return (
                                            <Image
                                                key={idx}
                                                src={url}
                                                alt={`Signed ${idx}`}
                                                width={100}
                                                height={100}
                                                style={{ objectFit: 'cover', borderRadius: 8 }}
                                            />
                                        );
                                    } else if (isPDF) {
                                        return (
                                            <a
                                                key={idx}
                                                href={url}
                                                download
                                                style={{
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    width: 100,
                                                    height: 100,
                                                    border: '1px solid #ccc',
                                                    borderRadius: 8,
                                                    textDecoration: 'none',
                                                    color: '#e74c3c',
                                                }}
                                            >
                                                <FilePdfOutlined style={{ fontSize: 30 }} />
                                                <span style={{ fontSize: 12, textAlign: 'center' }}>PDF File</span>
                                            </a>
                                        );
                                    } else {
                                        return (
                                            <div key={idx} style={{ width: 100, textAlign: 'center' }}>
                                                <span>Không xác định</span>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </>
                    )}
                </Modal>

                <Modal
                    title="Cập nhật trạng thái thanh toán"
                    open={isUpdateStatusModalVisible}
                    onCancel={handleCloseUpdateStatusModal}
                    footer={null}
                    width={700}
                >
                    {isLoadingDetailAppendix ? (
                        <Spin />
                    ) : isErrorDetailAppendix ? (
                        <div className="text-center text-red-500">Có lỗi xảy ra khi tải dữ liệu</div>
                    ) : (
                        <div className="p-4">
                            <h3 className="text-2xl font-semibold text-center mb-4">Các đợt thanh toán</h3>
                            <Collapse
                                bordered
                                accordion
                                activeKey={activePanel}
                                onChange={(key) => {
                                    setActivePanel(key);
                                    setPaymentId(key);
                                }}
                                className={` ${isDarkMode ? '' : 'bg-[#fafafa]'}  border border-gray-300 rounded-lg shadow-sm [&_.ant-collapse-arrow]:!text-[#1e1e1e]`}
                            >
                                {appendixData?.data?.paymentSchedules?.map((schedule, index) => (
                                    <Panel
                                        key={schedule.id || index}
                                        header={
                                            <div className={`${isDarkMode ? '' : '!text-black'} flex items-center justify-between w-full`}>
                                                <Tooltip title={`${schedule.amount.toLocaleString()} VND`}>
                                                    <span className="font-bold whitespace-nowrap overflow-hidden" style={{ maxWidth: 250 }}>
                                                        {schedule.amount.toLocaleString()} VND
                                                    </span>
                                                </Tooltip>
                                                <span>
                                                    {schedule.paymentDate
                                                        ? dayjs(
                                                            new Date(
                                                                schedule.paymentDate[0],
                                                                schedule.paymentDate[1] - 1,
                                                                schedule.paymentDate[2]
                                                            )
                                                        ).format("DD/MM/YYYY")
                                                        : "Không có dữ liệu"}
                                                </span>
                                                <div>
                                                    {schedule.status === "UNPAID" ? (
                                                        <Tag color="red">Chưa thanh toán</Tag>
                                                    ) : schedule.status === "PAID" ? (
                                                        <Tag color="green">Đã thanh toán</Tag>
                                                    ) : schedule.status === "OVERDUE" ? (
                                                        <Tag color="yellow">Quá hạn</Tag>
                                                    ) : (
                                                        schedule.status
                                                    )}
                                                </div>
                                            </div>
                                        }
                                    >
                                        {/* Luôn hiển thị phần ảnh, không cho upload */}
                                        <div className="text-gray-500 italic text-center mb-3">
                                            {schedule.status === "PAID"
                                                ? "Đợt thanh toán này đã hoàn thành, danh sách hóa đơn:"
                                                : "Chưa có hình hóa đơn để hiển thị."}
                                        </div>
                                        <div className="image-preview" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>

                                            {isLoadingBillAppendix ? (
                                                <Spin />
                                            ) : errorBillAppendix ? (
                                                <div className="flex justify-center items-center w-full">
                                                    <Empty description="Chưa có hình thanh toán phụ lục" />
                                                </div>
                                            ) : (dataBillAppendix?.data?.length ?? 0) > 0 ? (
                                                dataBillAppendix.data.map((imgUrl, idx) => (
                                                    <Image
                                                        key={idx}
                                                        src={imgUrl}
                                                        alt={`Hóa đơn ${idx + 1}`}
                                                        style={{ width: 100, height: 100, objectFit: "cover", borderRadius: 8 }}
                                                    />
                                                ))
                                            ) : (
                                                <div className="flex justify-center items-center w-full">
                                                    <Empty description="Chưa có hình thanh toán phụ lục" />
                                                </div>
                                            )}
                                        </div>
                                    </Panel>
                                ))}
                            </Collapse>
                            <div className="text-center mt-8">
                                <Button onClick={handleCloseUpdateStatusModal}>Đóng</Button>
                            </div>
                        </div>
                    )}
                </Modal>


            </div>

        </div>
    );
};

export default AppendixManagementForAllStatus;
