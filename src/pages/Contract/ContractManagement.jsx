import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag, Timeline, Upload, Tooltip, Collapse, Image } from "antd";
import { EditOutlined, DeleteOutlined, SettingOutlined, FullscreenOutlined, EditFilled, PlusOutlined, CheckCircleFilled, LoadingOutlined, UploadOutlined, InboxOutlined, DownloadOutlined } from "@ant-design/icons";
import { useDuplicateContractMutation, useGetAllContractQuery, useGetContractDetailQuery, useGetImgBillQuery, useSoftDeleteContractMutation } from "../../services/ContractAPI";
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
import { useUploadBillingContractMutation } from "../../services/uploadAPI";
import ExportContractPDF from "./component/ExportContractPDF";
const { Search } = Input;

const ManageContracts = () => {
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
    const [isUpdateStatusModalVisible, setIsUpdateStatusModalVisible] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [paymentId, setPaymentId] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [activePanel, setActivePanel] = useState([]);

    const [status, setStatus] = useState(null);
    const [duplicateContract] = useDuplicateContractMutation();
    const { data: contracts, isLoading, isError, refetch } = useGetAllContractQuery({
        page: paginationStaff.current - 1,
        size: paginationStaff.pageSize,
        keyword: searchTextStaff,
        status: status
    });
    const [uploadBill, { isLoading: LoadingBill }] = useUploadBillingContractMutation();

    const { data: dataPayment, isLoading: isLoadingPayment, isError: isErrorPayment } = useGetContractDetailQuery(selectedContractId, {
        skip: !selectedContractId,
    });
    const { data: dataBill, refetch: refetchBill } = useGetImgBillQuery(paymentId, {
        skip: !paymentId,
    });

    console.log("dataBill", dataBill)

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
    const [selectedContractIdExport, setSelectedContractIdExport] = useState(null);


    useEffect(() => {
        if (isManager) {
            refetchManager();
        } else {
            refetch();
        }
    }, [paginationManager, paginationStaff, searchTextStaff, searchTextManager, status, isManager]);

    // Trong component cha, khai báo state cho modal cập nhật trạng thái

    const openUpdateStatusModal = (contractId) => {
        setSelectedContractId(contractId);
        setIsUpdateStatusModalVisible(true);
    };

    // Hàm đóng modal cập nhật trạng thái
    const handleCloseUpdateStatusModal = () => {
        setIsUpdateStatusModalVisible(false);
        setSelectedContractId(null);
    };


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

    const handleExport = (id) => {
        setSelectedContractIdExport(id);
    };

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
            dataIndex: isManager ? "partner" : "partnerB",
            key: isManager ? "partner" : "partnerB",
            render: (partner) => <p>{partner?.partnerName}</p>,
            filters: [
                ...new Set(
                    tableData?.map(contract =>
                        isManager ? contract.partner?.partnerName : contract.partnerB?.partnerName
                    )
                ),
            ]
                .filter(Boolean)
                .map(name => ({
                    text: name,
                    value: name,
                })),
            onFilter: (value, record) =>
                (isManager ? record.partnerB?.partnerName : record.partner?.partnerName) === value,
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
                    <Dropdown
                        menu={{
                            items: [
                                // Nếu record.status là "APPROVED" thì thêm mục "Gửi ký"
                                ...(record.status === "APPROVED"
                                    ? [
                                        {
                                            key: "send-sign",
                                            icon: <CheckCircleFilled style={{ color: "#228eff" }} />,
                                            label: "Gửi ký",
                                            onClick: () => {
                                                // Logic gửi ký ở đây
                                                message.success("Gửi ký thành công!");
                                            },
                                        },
                                    ]
                                    : []),
                                // Nếu record.status không thuộc các trạng thái sau thì cho phép sửa
                                ...(record.status !== "APPROVAL_PENDING" &&
                                    record.status !== "APPROVED" &&
                                    record.status !== "SIGNED" &&
                                    record.status !== "ACTIVE" &&
                                    record.status !== "COMPLETED" &&
                                    record.status !== "EXPIRED" &&
                                    record.status !== "CANCELLED" &&
                                    record.status !== "ENDED"
                                    ? [
                                        {
                                            key: "edit",
                                            icon: <EditFilled style={{ color: "#228eff" }} />,
                                            label: "Sửa",
                                            onClick: () => navigate(`/EditContract/${record.id}`),
                                        },
                                    ]
                                    : []),
                                // Nếu record.status là "ACTIVE" thì thêm mục "Tạo phụ lục"
                                ...(record.status === "ACTIVE"
                                    ? [
                                        {
                                            key: "createAppendix",
                                            icon: <PlusOutlined style={{ color: "#228eff" }} />,
                                            label: "Tạo phụ lục",
                                            onClick: () =>
                                                navigate(
                                                    `/CreateAppendix/?contractId=${record.id}&contractNumber=${record.contractNumber}`
                                                ),
                                        },
                                    ]
                                    : []),
                                {
                                    key: "duplicate",
                                    icon: <BiDuplicate style={{ color: "#228eff" }} />,
                                    label: "Nhân bản",
                                    onClick: () => handleDuplicate(record.id),
                                },
                                ...(["APPROVED", "PENDING", "SIGNED", "ACTIVE"].includes(record.status)
                                    ? [
                                        {
                                            key: "updateStatus",
                                            icon: <BsClipboard2DataFill />,
                                            label: "Cập nhật trạng thái thanh toán",
                                            onClick: () => openUpdateStatusModal(record.id),
                                        },
                                    ]
                                    : []),
                                {
                                    key: "updateNotification",
                                    icon: <IoNotifications />,
                                    label: "Cập nhật thông báo",
                                    onClick: () => message.info("Cập nhật thông báo hợp đồng!"),
                                },
                                {
                                    key: "export",
                                    icon: <DownloadOutlined style={{ color: "#228eff" }} />,
                                    label: "Export",
                                    onClick: () => handleExport(record.id),
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

                        trigger={["hover"]}
                    >
                        <Button>
                            <SettingOutlined />
                        </Button>
                    </Dropdown>
                </Space>

            ),
        },
    ];

    const handleUploadAll = async (paymentScheduleId) => {
        try {
            // Tạo FormData và append tất cả file vào cùng một key (ví dụ: "files")
            const formData = new FormData();
            fileList.forEach((file) => {
                formData.append("files", file);
            });

            // Gọi API upload file, truyền paymentScheduleId và formData
            const res = await uploadBill({ paymentScheduleId, formData }).unwrap();
            const parsedRes = JSON.parse(res);

            message.success(parsedRes.message);
            setFileList([]);
            setActivePanel([]);
            setIsUpdateStatusModalVisible(false);
            refetchBill();
            refetch();
        } catch (error) {
            console.error("Lỗi khi tải lên file:", error);
            message.error("Có lỗi xảy ra khi tải lên file!");
        }
    };


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

    const handleDeleteImg = (index) => {
        setFileList((prev) => prev.filter((_, i) => i !== index));
    };


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
                            icon={<UploadOutlined />}
                            className="mr-3"
                        >
                            <Link to={'/createContractPDF'}> Tải lên hợp đồng</Link>
                        </Button>

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
            <Modal
                title="Cập nhật trạng thái thanh toán"
                open={isUpdateStatusModalVisible}
                onCancel={handleCloseUpdateStatusModal}
                footer={null}
                width={700}
            >
                {isLoadingPayment ? (
                    <Spin />
                ) : isErrorPayment ? (
                    <div className="text-center text-red-500">Có lỗi xảy ra khi tải dữ liệu</div>
                ) : (
                    <div className="p-4">
                        <h3 className="text-2xl font-semibold text-center mb-4">Các đợt thanh toán</h3>
                        <Collapse
                            bordered
                            activeKey={activePanel}
                            onChange={(key) => setActivePanel(key)}
                            className="bg-[#fafafa] border border-gray-300 rounded-lg shadow-sm [&_.ant-collapse-arrow]:!text-[#1e1e1e]"
                        >
                            {dataPayment?.data?.paymentSchedules?.map((schedule, index) => (
                                <Panel
                                    key={schedule.id || index}
                                    header={
                                        <div className="flex items-center justify-between w-full">
                                            {/* Số tiền */}
                                            <Tooltip title={`${schedule.amount.toLocaleString()} VND`}>
                                                <span
                                                    className="font-bold text-gray-800 text-lg whitespace-nowrap overflow-hidden text-ellipsis"
                                                    style={{ maxWidth: "250px" }}
                                                >
                                                    {schedule.amount.toLocaleString()} VND
                                                </span>
                                            </Tooltip>
                                            {/* Ngày thanh toán */}
                                            <span className="text-base text-gray-800">
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
                                                    <Tag color="red">Quá hạn</Tag>
                                                ) : (
                                                    schedule.status
                                                )}
                                            </div>
                                        </div>
                                    }
                                    onClick={() => {
                                        setPaymentId(schedule.id);
                                        // Mở panel này nếu chưa mở, hoặc đóng nếu đã mở
                                        setActivePanel((prev) =>
                                            prev.includes(schedule.id) ? [] : [schedule.id]
                                        );
                                    }}                                >
                                    {schedule.status === "PAID" ? (
                                        // Nếu đã thanh toán, chỉ hiển thị danh sách ảnh từ API
                                        <div>

                                            <div className="text-gray-500 italic text-center mb-3">
                                                Đợt thanh toán này đã hoàn thành, danh sách hóa đơn:
                                            </div>
                                            <div className="image-preview" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                                {dataBill?.data && dataBill.data.length > 0 ? (
                                                    dataBill.data.map((imgUrl, idx) => (
                                                        <Image
                                                            key={idx}
                                                            src={imgUrl}
                                                            alt={`Uploaded ${idx}`}
                                                            style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                                                        />
                                                    ))
                                                ) : (
                                                    <div className="text-gray-500">Không có hóa đơn nào được tải lên.</div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        // Nếu chưa thanh toán, hiển thị form tải lên
                                        <>
                                            <Upload.Dragger
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
            {selectedContractIdExport && (
                <ExportContractPDF
                    contractId={selectedContractIdExport}
                    onDone={() => setSelectedContractIdExport(null)}
                />
            )}

        </div>
    );
};

export default ManageContracts;
