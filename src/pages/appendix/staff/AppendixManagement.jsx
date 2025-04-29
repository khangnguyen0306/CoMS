import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag, Image, Upload, Collapse, Tooltip } from "antd";
import { DeleteOutlined, SettingOutlined, EditFilled, CheckCircleFilled, UndoOutlined, DownloadOutlined, SignatureOutlined, InboxOutlined, UploadOutlined, LoadingOutlined, FilePdfOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../slices/authSlice";
import { useGetContractPorcessPendingQuery } from "../../../services/ProcessAPI";
import ExpandRowContent from "../../Contract/component/ExpandRowContent";
import { useDeleteAppendixMutation, useGetAllAppendixBySelfQuery, useGetAppendixDetailQuery, useGetImgBillAppendixQuery, useGetImgSignAppendixQuery, useResubmitAppendixMutation } from "../../../services/AppendixAPI";
import Process from "../../Process/Process";
import { IoDuplicate } from "react-icons/io5";
import DuplicateModal from "../component/DuplicateAppendix";
import { useUploadImgAppendixMutation, useUploadSignFileMutation } from "../../../services/uploadAPI";
import { BsClipboard2DataFill } from "react-icons/bs";
const { Search } = Input;
const { Panel } = Collapse;

const AppendixManagement = () => {
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);

    const navigate = useNavigate()
    const user = useSelector(selectCurrentUser)
    const isCEO = user?.roles?.includes("ROLE_DIRECTOR");
    const isManager = user?.roles?.includes("ROLE_MANAGER");
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
    const [isOpenSignModal, setIsOpenSignModal] = useState(false);
    const [isVisibleDuplicate, setIsVisibleDuplicate] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [selectedAppendixtId, setSelectedAppendixtId] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [isUpdateStatusModalVisible, setIsUpdateStatusModalVisible] = useState(false);
    const [activePanel, setActivePanel] = useState([]);
    const [paymentId, setPaymentId] = useState(null);

    const { data: appendixs, isLoading, isError, refetch } = useGetAllAppendixBySelfQuery({
        page: pagination.current - 1,
        size: pagination.pageSize,
        keyword: searchText,
        statuses: status
    });

    const [uploadSign, { isLoading: LoadingUploadSign }] = useUploadSignFileMutation();

    const { data: dataBillAppendix, refetch: refetchBill } = useGetImgBillAppendixQuery({ id: paymentId }, {
        skip: !paymentId,
    });
    console.log("he", paymentId)

    const { data: dataSign, isLoading: LoadingImage, isError: ErrorImage, refetch: refetchImg } = useGetImgSignAppendixQuery({ id: selectedAppendixtId }, {
        skip: !selectedAppendixtId,
    });
    // console.log("hi", dataSign)
    const { data: appendixData, isLoading: isLoadingDetailAppendix, isError: isErrorDetailAppendix, refetch: refetchDetailAppendix } = useGetAppendixDetailQuery(
        { id: selectedContractId },
        { skip: !selectedContractId },
        {
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true,
        }
    )

    const [deleteappendix] = useDeleteAppendixMutation()
    const [resubmitAppendix] = useResubmitAppendixMutation()
    const [uploadBill, { isLoading: LoadingBill }] = useUploadImgAppendixMutation();


    const tableData = appendixs?.data?.content;

    const handleDeleteImg = (index) => {
        setFileList((prev) => prev.filter((_, i) => i !== index));
    };

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
        setSelectedAppendixtId(addendumId);
        setIsOpenSignModal(true);
    }

    const handleCloseUpdateSignModal = () => {
        setIsOpenSignModal(false);
        setSelectedAppendixtId(null);
        refetch()
    }

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

    const handleUploadAll = async (paymentScheduleId) => {
        try {
            // Tạo FormData và append tất cả file vào cùng một key (ví dụ: "files")
            const formData = new FormData();
            fileList.forEach((file) => {
                formData.append("files", file);
            });

            // Gọi API upload file, truyền paymentScheduleId và formData
            const res = await uploadBill({ paymentScheduleId, formData }).unwrap();
            refetchDetailAppendix();
            refetchBill();
            refetch();
            message.success(res.message);
            setFileList([]);
            // setActivePanel([]);
            setIsUpdateStatusModalVisible(false);

        } catch (error) {
            console.error("Lỗi khi tải lên file:", error);
            message.error("Có lỗi xảy ra khi tải lên file!");
        }
    };

    const handleResubmit = async (record) => {
        Modal.confirm({
            title: 'Phụ lục sẽ được gửi lại để phê duyệt',
            onOk: async () => {
                try {
                    const result = await resubmitAppendix(record.addendumId).unwrap();

                    if (result.status == "OK") {
                        message.success(result.message);
                        refetch()
                    } else {
                        const errorMessage = result?.message?.split(": ")?.[1] || "Gửi yêu cầu phê duyệt phụ lục thất bại!";
                        message.error(errorMessage);
                    }
                } catch (error) {

                    console.log(error)

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
        'FIXED': <Tag color="blue-inverse">Đã cập nhật</Tag>,
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
                                        ...(record.status === "REJECTED" || record.status === "FIXED" ? [
                                            {
                                                key: "select-process",
                                                icon: <UndoOutlined style={{ color: "#ffcf48" }} />,
                                                label: (
                                                    <span onClick={() => handleResubmit(record)}>
                                                        Gửi lại yêu cầu phê duyệt
                                                    </span>
                                                ),
                                            }] :
                                            (record.status != "APPROVAL_PENDING" && record.status != "APPROVED" && record.status != "ACTIVE" && record.status != "SIGNED") ? [
                                                {
                                                    key: "select-process",
                                                    icon: <CheckCircleFilled style={{ color: "#00FF33" }} />,
                                                    label: (
                                                        <span onClick={() => showModal(record)}>
                                                            Yêu cầu phê duyệt
                                                        </span>
                                                    ),
                                                }] : []),
                                        ...(record.status !== "APPROVAL_PENDING" && record.status !== "APPROVED" && record.status !== "SIGNED" && record.status !== "ACTIVE "
                                            ? [{
                                                key: "edit",
                                                icon: <EditFilled style={{ color: '#228eff' }} />,
                                                label: "Sửa",
                                                onClick: () => navigate(`/EditAppendix/${record.contractId}/${record.addendumId}`),
                                            }]
                                            : []),
                                        ...(record.status == "SIGNED"
                                            ? [
                                                {
                                                    key: "updateStatus",
                                                    icon: <BsClipboard2DataFill />,
                                                    label: "Cập nhật trạng thái thanh toán",
                                                    onClick: () => openUpdateStatusModal(record.addendumId),
                                                },
                                            ]
                                            : []),
                                        ...(record.status == "SIGNED"
                                            ? [
                                                {
                                                    key: "uploadImgSign",
                                                    icon: <SignatureOutlined />,
                                                    label: record.status === "SIGNED" ? "Xác nhận đã ký" : "Xem phụ lục đã ký",
                                                    onClick: () => handleOpenSignModal(record.addendumId),
                                                }
                                            ]
                                            : []),

                                        ...((record.status == "CREATED" || record.status == "UPDATED" || record.status == "REJECTED") && user.id == record.createdBy.userId
                                            ? [{

                                                key: "delete",
                                                icon: <DeleteOutlined />,
                                                label: "Xóa",
                                                danger: true,
                                                onClick: () => handleDelete(record),
                                            }]
                                            : []),
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

    const handleBeforeUpload = (file) => {
        const isValidType =
            file.type === "image/png" || file.type === "image/jpeg";
        if (!isValidType) {
            message.error("Bạn chỉ có thể tải file PNG hoặc JPEG!");
            return Upload.LIST_IGNORE;
        }

        // Thêm file vào state
        setFileList((prev) => [...prev, file]);

        return false; // Ngăn không cho Upload.Dragger tự động tải lên
    };

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

    const handleUploadSign = async (selectedAppendixtId) => {
        console.log("selectedContractId", selectedAppendixtId)
        try {
            // Tạo FormData và append tất cả file vào cùng một key (ví dụ: "files")
            const formData = new FormData();
            fileList.forEach((file) => {
                formData.append("files", file);
            });
            console.log("formData", formData)
            // Gọi API upload file, truyền paymentScheduleId và formData
            const res = await uploadSign({ addendumId: selectedAppendixtId, formData }).unwrap();

            message.success(res.message);
            setFileList([]);

            setSelectedAppendixtId(null);
            setIsOpenSignModal(false);
            refetchImg();
            // refetch();
        } catch (error) {
            console.error("Lỗi khi tải lên file:", error);
            message.error("Có lỗi xảy ra khi tải lên file!");
        }
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

                {/* <Modal
                    title="Cập nhật trạng thái đã ký"
                    open={isOpenSignModal}
                    onCancel={handleCloseUpdateSignModal}
                    footer={null}
                    width={700}
                >
                    {LoadingImage ? (
                        <Spin />
                    ) : (
                        <div className="p-4">

                            {dataSign?.data?.length > 0 ? (
                                <>
                                    <h3 className="text-xl font-semibold text-center mb-4">Danh sách file đã tải lên</h3>
                                    <div
                                        className="image-preview"
                                        style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                                    >
                                        {dataSign?.data?.map((fileUrl, idx) => {

                                            const isPDF = fileUrl.includes("/raw");
                                            const isImage = fileUrl.includes("/image");
                                            return (
                                                <div key={idx} style={{ position: "relative" }}>
                                                    {isImage ? (
                                                        <Image
                                                            src={fileUrl}
                                                            alt={`Uploaded ${idx}`}
                                                            style={{
                                                                width: "100px",
                                                                height: "100px",
                                                                objectFit: "cover",
                                                                borderRadius: "8px"
                                                            }}
                                                        />
                                                    ) : isPDF ? (
                                                        <a
                                                            href={fileUrl}

                                                            rel="noopener noreferrer"
                                                            download
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "center",
                                                                alignItems: "center",
                                                                width: "100px",
                                                                height: "100px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "8px",
                                                                backgroundColor: "#f0f0f0",
                                                                flexDirection: "column",
                                                                color: "#e74c3c",
                                                                textDecoration: "none"
                                                            }}
                                                        >
                                                            <FilePdfOutlined style={{ fontSize: "30px" }} />
                                                            <span style={{ fontSize: "12px", textAlign: "center" }}>PDF File</span>
                                                        </a>
                                                    ) : (
                                                        <span>File không xác định</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Upload.Dragger
                                        disabled={isManager || isCEO}
                                        multiple
                                        name="files"
                                        accept="image/png,image/jpeg,application/pdf"
                                        beforeUpload={(file) => {
                                            const isImage = file.type === "image/png" || file.type === "image/jpeg";
                                            const isPDF = file.type === "application/pdf";

                                            if (!isImage && !isPDF) {
                                                message.error(`${file.name} không phải là hình PNG/JPG hoặc file PDF!`);
                                                return Upload.LIST_IGNORE;
                                            }

                                            setFileList((prev) => [...prev, file]);
                                            return false;
                                        }}
                                        showUploadList={false}
                                    >
                                        <p className="ant-upload-drag-icon">
                                            <InboxOutlined />
                                        </p>
                                        <div className="ant-upload-text">Click hoặc kéo file vào đây để tải lên</div>
                                        <p className="ant-upload-hint">Hỗ trợ tải lên nhiều file hình hoặc PDF.</p>
                                    </Upload.Dragger>

                                    {fileList.length > 0 && (
                                        <div className="file-preview mt-4" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                            {fileList.map((file, index) => {
                                                const isImage = file.type.startsWith("image/");
                                                return (
                                                    <div
                                                        key={index}
                                                        onMouseEnter={() => setHoveredIndex(index)}
                                                        onMouseLeave={() => setHoveredIndex(null)}
                                                        style={{ position: "relative" }}
                                                    >
                                                        {isImage ? (
                                                            <Image
                                                                src={URL.createObjectURL(file)}
                                                                alt="Preview"
                                                                style={{
                                                                    width: "100px",
                                                                    height: "100px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "8px"
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    width: "100px",
                                                                    height: "100px",
                                                                    display: "flex",
                                                                    justifyContent: "center",
                                                                    alignItems: "center",
                                                                    border: "1px solid #ddd",
                                                                    borderRadius: "8px",
                                                                    backgroundColor: "#f5f5f5"
                                                                }}
                                                            >
                                                                <FilePdfOutlined style={{ fontSize: "30px", color: "#e74c3c" }} />
                                                            </div>
                                                        )}
                                                        {hoveredIndex === index && (
                                                            <Button
                                                                icon={<DeleteOutlined />}
                                                                onClick={() => handleDeleteImg(index)}
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "5px",
                                                                    right: "5px",
                                                                    backgroundColor: "red",
                                                                    color: "white",
                                                                    borderRadius: "50%",
                                                                    padding: "5px",
                                                                    border: "none"
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <Button
                                        type="primary"
                                        icon={LoadingUploadSign ? <LoadingOutlined /> : <UploadOutlined />}
                                        onClick={() => handleUploadSign(selectedAppendixtId)}
                                        disabled={fileList.length === 0 || LoadingUploadSign}
                                        style={{ marginTop: "10px" }}
                                    >
                                        {LoadingUploadSign ? "Đang tải lên..." : "Tải lên"}
                                    </Button>


                                </>
                            )}


                        </div>
                    )}

                </Modal> */}

                <Modal
                    title="Cập nhật trạng thái đã ký"
                    open={isOpenSignModal}
                    onCancel={handleCloseUpdateSignModal}
                    footer={null}
                    width={700}
                    destroyOnClose
                >
                    {LoadingImage ? (
                        <Spin />
                    ) : ErrorImage ? (

                        <>
                            <Upload.Dragger
                                multiple
                                disabled={isManager || isCEO}
                                name="files"
                                accept="image/png,image/jpeg,application/pdf"
                                beforeUpload={(file) => {
                                    const isImage = file.type === "image/png" || file.type === "image/jpeg";
                                    const isPDF = file.type === "application/pdf";

                                    if (!isImage && !isPDF) {
                                        message.error(`${file.name} không phải là hình PNG/JPG hoặc file PDF!`);
                                        return Upload.LIST_IGNORE;
                                    }

                                    setFileList((prev) => [...prev, file]);
                                    return false;
                                }}
                                showUploadList={false}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <div className="ant-upload-text">Click hoặc kéo file vào đây để tải lên</div>
                                <p className="ant-upload-hint">Hỗ trợ tải lên nhiều file hình hoặc PDF.</p>
                            </Upload.Dragger>

                            {fileList.length > 0 && (
                                <div className="file-preview mt-4" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    {fileList.map((file, index) => {
                                        const isImage = file.type.startsWith("image/");
                                        return (
                                            <div
                                                key={index}
                                                onMouseEnter={() => setHoveredIndex(index)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                                style={{ position: "relative" }}
                                            >
                                                {isImage ? (
                                                    <Image
                                                        src={URL.createObjectURL(file)}
                                                        alt="Preview"
                                                        style={{
                                                            width: "100px",
                                                            height: "100px",
                                                            objectFit: "cover",
                                                            borderRadius: "8px"
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: "100px",
                                                            height: "100px",
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                            border: "1px solid #ddd",
                                                            borderRadius: "8px",
                                                            backgroundColor: "#f5f5f5"
                                                        }}
                                                    >
                                                        <FilePdfOutlined style={{ fontSize: "30px", color: "#e74c3c" }} />
                                                    </div>
                                                )}
                                                {hoveredIndex === index && (
                                                    <Button
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleDeleteImg(index)}
                                                        style={{
                                                            position: "absolute",
                                                            top: "5px",
                                                            right: "5px",
                                                            backgroundColor: "red",
                                                            color: "white",
                                                            borderRadius: "50%",
                                                            padding: "5px",
                                                            border: "none"
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <Button
                                type="primary"
                                icon={LoadingUploadSign ? <LoadingOutlined /> : <UploadOutlined />}
                                onClick={() => handleUploadSign(selectedAppendixtId)}
                                disabled={fileList.length === 0 || LoadingUploadSign}
                                style={{ marginTop: "10px" }}
                            >
                                {LoadingUploadSign ? "Đang tải lên..." : "Tải lên"}
                            </Button>


                        </>
                    ) : (
                        <div className="p-4">

                            {dataSign?.data?.length > 0 && dataSign?.data ? (
                                <>
                                    <h3 className="text-xl font-semibold text-center mb-4">Danh sách file đã tải lên</h3>
                                    <div
                                        className="image-preview"
                                        style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}
                                    >
                                        {dataSign?.data?.map((fileUrl, idx) => {
                                            // const isImage = fileUrl.match(/\.(jpeg|jpg|png)$/i);
                                            // const isPDF = fileUrl.match(/\.pdf$/i);
                                            const isPDF = fileUrl.includes("/raw");
                                            const isImage = fileUrl.includes("/image");
                                            return (
                                                <div key={idx} style={{ position: "relative" }}>
                                                    {isImage ? (
                                                        <Image
                                                            src={fileUrl}
                                                            alt={`Uploaded ${idx}`}
                                                            style={{
                                                                width: "100px",
                                                                height: "100px",
                                                                objectFit: "cover",
                                                                borderRadius: "8px"
                                                            }}
                                                        />
                                                    ) : isPDF ? (
                                                        <a
                                                            href={fileUrl}

                                                            rel="noopener noreferrer"
                                                            download
                                                            style={{
                                                                display: "flex",
                                                                justifyContent: "center",
                                                                alignItems: "center",
                                                                width: "100px",
                                                                height: "100px",
                                                                border: "1px solid #ccc",
                                                                borderRadius: "8px",
                                                                backgroundColor: "#f0f0f0",
                                                                flexDirection: "column",
                                                                color: "#e74c3c",
                                                                textDecoration: "none"
                                                            }}
                                                        >
                                                            <FilePdfOutlined style={{ fontSize: "30px" }} />
                                                            <span style={{ fontSize: "12px", textAlign: "center" }}>PDF File</span>
                                                        </a>
                                                    ) : (
                                                        <span>File không xác định</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Upload.Dragger
                                        multiple
                                        disabled={isManager || isCEO}
                                        name="files"
                                        accept="image/png,image/jpeg,application/pdf"
                                        beforeUpload={(file) => {
                                            const isImage = file.type === "image/png" || file.type === "image/jpeg";
                                            const isPDF = file.type === "application/pdf";

                                            if (!isImage && !isPDF) {
                                                message.error(`${file.name} không phải là hình PNG/JPG hoặc file PDF!`);
                                                return Upload.LIST_IGNORE;
                                            }

                                            setFileList((prev) => [...prev, file]);
                                            return false; // Không upload tự động
                                        }}
                                        showUploadList={false}
                                    >
                                        <p className="ant-upload-drag-icon">
                                            <InboxOutlined />
                                        </p>
                                        <div className="ant-upload-text">Click hoặc kéo file vào đây để tải lên</div>
                                        <p className="ant-upload-hint">Hỗ trợ tải lên nhiều file hình hoặc PDF.</p>
                                    </Upload.Dragger>

                                    {fileList.length > 0 && (
                                        <div className="file-preview mt-4" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                            {fileList.map((file, index) => {
                                                const isImage = file.type.startsWith("image/");
                                                return (
                                                    <div
                                                        key={index}
                                                        onMouseEnter={() => setHoveredIndex(index)}
                                                        onMouseLeave={() => setHoveredIndex(null)}
                                                        style={{ position: "relative" }}
                                                    >
                                                        {isImage ? (
                                                            <Image
                                                                src={URL.createObjectURL(file)}
                                                                alt="Preview"
                                                                style={{
                                                                    width: "100px",
                                                                    height: "100px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "8px"
                                                                }}
                                                            />
                                                        ) : (
                                                            <div
                                                                style={{
                                                                    width: "100px",
                                                                    height: "100px",
                                                                    display: "flex",
                                                                    justifyContent: "center",
                                                                    alignItems: "center",
                                                                    border: "1px solid #ddd",
                                                                    borderRadius: "8px",
                                                                    backgroundColor: "#f5f5f5"
                                                                }}
                                                            >
                                                                <FilePdfOutlined style={{ fontSize: "30px", color: "#e74c3c" }} />
                                                            </div>
                                                        )}
                                                        {hoveredIndex === index && (
                                                            <Button
                                                                icon={<DeleteOutlined />}
                                                                onClick={() => handleDeleteImg(index)}
                                                                style={{
                                                                    position: "absolute",
                                                                    top: "5px",
                                                                    right: "5px",
                                                                    backgroundColor: "red",
                                                                    color: "white",
                                                                    borderRadius: "50%",
                                                                    padding: "5px",
                                                                    border: "none"
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    <Button
                                        type="primary"
                                        icon={LoadingUploadSign ? <LoadingOutlined /> : <UploadOutlined />}
                                        onClick={() => handleUploadSign(selectedAppendixtId)}
                                        disabled={fileList.length === 0 || LoadingUploadSign}
                                        style={{ marginTop: "10px" }}
                                    >
                                        {LoadingUploadSign ? "Đang tải lên..." : "Tải lên"}
                                    </Button>
                                </>
                            )}


                        </div>
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
                                                {/* Số tiền */}
                                                <Tooltip title={`${schedule.amount.toLocaleString()} VND`}>
                                                    <span
                                                        className={`font-bold   whitespace-nowrap overflow-hidden `}
                                                        style={{ maxWidth: "250px" }}
                                                    >
                                                        {schedule.amount.toLocaleString()} VND
                                                    </span>
                                                </Tooltip>
                                                {/* Ngày thanh toán */}
                                                <span className=" ">
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
                                                {/* Tag trạng thái */}
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
                                        {schedule.status === "PAID" ? (
                                            // Nếu đã thanh toán, chỉ hiển thị danh sách ảnh từ API
                                            <div>

                                                <div className="text-gray-500 italic text-center mb-3">
                                                    Đợt thanh toán này đã hoàn thành, danh sách hóa đơn:
                                                </div>
                                                <div className="image-preview" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                                    {dataBillAppendix?.data && dataBillAppendix?.data?.length > 0 ? (
                                                        dataBillAppendix?.data?.map((imgUrl, idx) => (
                                                            <Image
                                                                key={idx}
                                                                src={imgUrl}
                                                                alt={`Uploaded ${idx}`}
                                                                style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500">Không có đợt thanh toán nào cho hợp đồng này.</div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // Nếu chưa thanh toán, hiển thị form tải lên

                                            <>
                                                <Upload.Dragger
                                                    disabled={isManager || isCEO}
                                                    name="invoice"
                                                    accept="image/png, image/jpeg"
                                                    beforeUpload={handleBeforeUpload}
                                                    showUploadList={false} // Không để Ant Design quản lý danh sách file
                                                >
                                                    <p className="ant-upload-drag-icon">
                                                        <InboxOutlined />
                                                    </p>
                                                    <div className="ant-upload-text">
                                                        Click hoặc kéo file vào đây để tải lên
                                                    </div>
                                                    <p className="ant-upload-hint">Hỗ trợ tải lên một hoặc nhiều file.</p>
                                                </Upload.Dragger>

                                                {/* Hiển thị danh sách ảnh đã chọn */}
                                                <div className="image-preview" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "15px" }}>
                                                    {fileList.map((file, index) => (
                                                        <div
                                                            key={index}
                                                            className="image-item"
                                                            onMouseEnter={() => setHoveredIndex(index)}
                                                            onMouseLeave={() => setHoveredIndex(null)}
                                                            style={{ position: "relative", display: "inline-block" }}
                                                        >
                                                            <Image
                                                                src={URL.createObjectURL(file)}
                                                                alt="Uploaded"
                                                                style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                                                            />
                                                            {hoveredIndex === index && (
                                                                <Button
                                                                    icon={<DeleteOutlined />}
                                                                    onClick={() => handleDeleteImg(index)}
                                                                    style={{
                                                                        position: "absolute",
                                                                        top: "5px",
                                                                        right: "5px",
                                                                        backgroundColor: "red",
                                                                        color: "white",
                                                                        borderRadius: "50%",
                                                                        padding: "5px",
                                                                        border: "none",
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Nút tải lên */}
                                                <Button
                                                    type="primary"
                                                    icon={LoadingBill ? <LoadingOutlined /> : <UploadOutlined />}
                                                    onClick={() => handleUploadAll(schedule.id)}
                                                    disabled={fileList.length === 0 || LoadingBill}
                                                    style={{ marginTop: "10px" }}
                                                >
                                                    {LoadingBill ? "Đang tải lên..." : "Tải lên"}
                                                </Button>
                                            </>
                                        )}
                                    </Panel>
                                ))}
                            </Collapse>
                            <div className="text-center mt-8">
                                <Button onClick={handleCloseUpdateStatusModal}>Đóng</Button>
                            </div>
                        </div>
                    )}
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
