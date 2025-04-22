import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag, Image, Upload } from "antd";
import { EditOutlined, DeleteOutlined, SettingOutlined, FullscreenOutlined, EditFilled, PlusOutlined, SendOutlined, CheckCircleFilled, UndoOutlined, DownloadOutlined, SignatureOutlined, InboxOutlined, UploadOutlined, LoadingOutlined, FilePdfOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../../slices/authSlice";
import { useGetContractPorcessPendingQuery } from "../../../services/ProcessAPI";
import ExpandRowContent from "../../Contract/component/ExpandRowContent";
import { useDeleteAppendixMutation, useGetAllAppendixBySelfQuery, useGetImgSignAppendixQuery, useResubmitAppendixMutation } from "../../../services/AppendixAPI";
import Process from "../../Process/Process";
import { IoDuplicate } from "react-icons/io5";
import { IoSend } from "react-icons/io5";
import DuplicateModal from "../component/DuplicateAppendix";
import { useUploadSignFileMutation } from "../../../services/uploadAPI";
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
    const [isOpenSignModal, setIsOpenSignModal] = useState(false);
    const [isVisibleDuplicate, setIsVisibleDuplicate] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [selectedAppendixtId, setSelectedAppendixtId] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const { data: appendixs, isLoading, isError, refetch } = useGetAllAppendixBySelfQuery({
        page: pagination.current - 1,
        size: pagination.pageSize,
        keyword: searchText,
        statuses: status
    });

    const [uploadSign, { isLoading: LoadingUploadSign }] = useUploadSignFileMutation();


    const { data: dataSign, isLoading: LoadingImage, isError: ErrorImage, refetch: refetchImg } = useGetImgSignAppendixQuery({ id: selectedAppendixtId }, {
        skip: !selectedAppendixtId,
    });
    console.log("hi", dataSign)


    const { data: contractManager } = useGetContractPorcessPendingQuery({ approverId: user.id });
    const [deleteappendix] = useDeleteAppendixMutation()
    const [resubmitAppendix] = useResubmitAppendixMutation()


    const tableData = appendixs?.data?.content;

    const handleDeleteImg = (index) => {
        setFileList((prev) => prev.filter((_, i) => i !== index));
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
                                        ...(record.status !== "APPROVAL_PENDING" && record.status !== "APPROVED" && record.status !== "SIGNED" && record.status !== "ACTIVE "
                                            ? [{
                                                key: "edit",
                                                icon: <EditFilled style={{ color: '#228eff' }} />,
                                                label: "Sửa",
                                                onClick: () => navigate(`/EditAppendix/${record.contractId}/${record.addendumId}`),
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
                                            key: "uploadImgSign",
                                            icon: <SignatureOutlined />,
                                            label: "Xác nhận đã ký phụ lục",
                                            onClick: () => handleOpenSignModal(record.addendumId),
                                        },

                                        ...(record.status == "CREATED" || record.status == "UPDATED" || record.status == "REJECTED"
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

                <Modal
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
                            {/* Đã có hóa đơn */}

                            {dataSign?.data?.length > 0 ? (
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
