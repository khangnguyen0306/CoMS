import React, { useEffect, useMemo, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag, Upload, Tooltip, Collapse, Image, Tabs, Checkbox, ConfigProvider } from "antd";
import { DeleteOutlined, SettingOutlined, EditFilled, PlusOutlined, LoadingOutlined, UploadOutlined, InboxOutlined, DownloadOutlined, SignatureOutlined, FilePdfOutlined } from "@ant-design/icons";
import { useGetAllContractQuery, useGetContractDetailQuery, useGetImgBillQuery, useGetImgSignQuery, useSoftDeleteContractMutation } from "../../services/ContractAPI";
import { BsClipboard2DataFill } from "react-icons/bs"
import dayjs from "dayjs";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BiDuplicate } from "react-icons/bi";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../slices/authSlice";
import { useGetContractPorcessPendingQuery } from "../../services/ProcessAPI";
import ExpandRowContent from "./component/ExpandRowContent";
import { useGetNumberNotiForAllQuery } from "../../services/NotiAPI";
import { useCancelContractMutation, useUploadBillingContractMutation, useUploadImgSignMutation } from "../../services/uploadAPI";
import ExportContractPDF from "./component/ExportContractPDF";
import DuplicateContractModal from './component/DuplicateContractModal';
import TabPane from "antd/es/tabs/TabPane";
import { IoIosWarning } from "react-icons/io";
const { Search } = Input;
import { ImCancelCircle } from "react-icons/im";
import ModalCancelContract from "./component/ModalCancelContract";
import ModalCancelInformation from "./component/ModalCancelInformation";
import { IoInformationCircleOutline } from "react-icons/io5";
const ManageContracts = () => {
    const navigate = useNavigate()
    const userL = useSelector(selectCurrentUser)
    const user = useSelector(selectCurrentUser)
    const isCEO = user?.roles?.includes("ROLE_DIRECTOR");
    const isManager = user?.roles?.includes("ROLE_MANAGER");
    const isStaff = user?.roles?.includes("ROLE_STAFF");
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState(searchParams.get('paramstatus') || []);
    const { Panel } = Collapse;
    const [searchTextStaff, setSearchTextStaff] = useState("");
    const [searchTextManager, setSearchTextManager] = useState("");
    const [selectedContract, setSelectedContract] = useState(null);
    const [isApprover, setIsApprover] = useState(false);
    const [activeKey, setActiveKey] = useState('1');
    const [paginationStaff, setPaginationStaff] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [paginationApprover, setPaginationApprover] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });
    const [paginationCEO, setPaginationCEO] = useState({
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
    const [isModalSignedVisible, setIsModalSignedVisible] = useState(false);
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [paymentId, setPaymentId] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [activePanel, setActivePanel] = useState([]);

    const { data: dataPayment, isLoading: isLoadingPayment, isError: isErrorPayment, refetch: refetchPaymnet } = useGetContractDetailQuery(selectedContractId, {
        skip: !selectedContractId,
    });
    const { data: dataBill, refetch: refetchBill } = useGetImgBillQuery(paymentId, {
        skip: !paymentId,
    });
    const { data: contractApprove, isLoading: isLoadingManager, refetch: refetchManager } = useGetContractPorcessPendingQuery({
        approverId: user.id,
        page: isManager ? paginationManager.current - 1 : 0,
        size: isManager ? paginationManager.pageSize : 1000,
        keyword: searchTextManager,
        status: status
    },
        {
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true,
        }
    );
    const { data: contracts, isLoading, isError, refetch } = useGetAllContractQuery({
        page: isStaff ? paginationStaff.current - 1 : paginationCEO.current - 1,
        size: isStaff ? paginationStaff.pageSize : paginationCEO.pageSize,
        keyword: searchTextStaff,
        status: status,
        isCEO: isCEO
    },
        {
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true,
        }
    );
    const { data: dataSign, isLoading: LoadingImage, isError: ErrorSign, refetch: refetchImg } = useGetImgSignQuery(selectedContractId, {
        skip: !selectedContractId,
    });
    const [softDelete] = useSoftDeleteContractMutation()
    const { refetch: refetchNoti } = useGetNumberNotiForAllQuery();
    const [uploadSign, { isLoading: LoadingSign }] = useUploadImgSignMutation();
    const [uploadBill, { isLoading: LoadingBill }] = useUploadBillingContractMutation();



    const tableData = isManager
        ? contractApprove?.data?.content
        : contracts?.data?.content || [];

    const [selectedContractIdExport, setSelectedContractIdExport] = useState(null);
    const [isDuplicateModalVisible, setIsDuplicateModalVisible] = useState(false);
    const [selectedContractForDuplicate, setSelectedContractForDuplicate] = useState(null);
    const [contractIdCancel, setContracyIdCancel] = useState(0);
    const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
    const [isCancelInforOpen, setIsCancelInforOpen] = useState(false);
    const [contractIdInfo, setContracyIdInfo] = useState(0);
    // Update status when searchParams change
    useEffect(() => {
        const newStatus = searchParams.get('paramstatus');
        setStatus(newStatus || null);
    }, [searchParams]);

    useEffect(() => {
        if (isManager) {
            refetchManager();
        } else {
            refetch();
        }
    }, [paginationManager, paginationStaff, searchTextStaff, searchTextManager, status, isManager, searchParams]);

    // Trong component cha, khai báo state cho modal cập nhật trạng thái

    const openUpdateStatusModal = (contractId) => {
        setSelectedContractId(contractId);
        setIsUpdateStatusModalVisible(true);
        refetchPaymnet();
    };

    // Hàm đóng modal cập nhật trạng thái
    const handleCloseUpdateStatusModal = () => {
        setIsUpdateStatusModalVisible(false);
        setSelectedContractId(null);
        setFileList([]);
    };

    const openUpdateSignModal = (contractId) => {
        setSelectedContractId(contractId);
        setIsModalSignedVisible(true);
        setFileList([]);
    };

    const openCancelSignModal = (contractId) => {
        setContracyIdCancel(contractId);
        setIsCancelModalVisible(true);
    };

    const openInforCancelModal = (contractId) => {
        setContracyIdInfo(contractId);
        setIsCancelInforOpen(true);
    };



    // Hàm đóng modal cập nhật trạng thái
    const handleCloseUpdateSignModal = () => {
        setIsModalSignedVisible(false);
        setSelectedContractId(null);
        setFileList([]);
    };

    // console.log(selectedContract)
    const handleDuplicate = (contractId) => {
        setSelectedContractForDuplicate(contractId);
        setIsDuplicateModalVisible(true);
    };

    const handleCloseDuplicateModal = () => {
        setIsDuplicateModalVisible(false);
        setSelectedContractForDuplicate(null);
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
                    // refetch();
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
        'CREATED': <Tag color="default">Đã tạo</Tag>,
        'FIXED': <Tag color="default">Đã chỉnh sửa</Tag>,
        'APPROVAL_PENDING': <Tag color="gold-inverse">Chờ phê duyệt</Tag>,
        'APPROVED': <Tag color="green-inverse">Đã phê duyệt</Tag>,
        'UPDATED': <Tag color="green-inverse">Đã cập nhật</Tag>,
        'PENDING': <Tag color="warning">Đang chờ</Tag>,
        'REJECTED': <Tag color="red">Từ chối</Tag>,
        'SIGNED': <Tag color="geekblue">Đã ký</Tag>,
        'ACTIVE': <Tag color="processing">Đang hiệu lực</Tag>,
        'COMPLETED': <Tag color="success">Hoàn thành</Tag>,
        'EXPIRED': <Tag color="red">Hết hiệu lực</Tag>,
        'CANCELLED': <Tag color="red-inverse">Đã hủy</Tag>,
        'ENDED': <Tag color="default">Đã kết thúc</Tag>,
        'DELETED': <Tag color="red">Đã xóa</Tag>,
        'EXPIRING': <Tag color="#EB7153"><p className="flex items-center gap-1"><IoIosWarning /><p>Sắp hết hạn</p></p></Tag>,
    }

    const displayStatus = {
        'CREATED': 'ĐÃ TẠO',
        'FIXED': 'ĐÃ CHỈNH SỬA',
        'APPROVAL_PENDING': 'CHỜ PHÊ DUYỆT',
        'APPROVED': 'ĐÃ PHÊ DUYỆT',
        'UPDATED': 'ĐÃ CẬP NHẬT',
        'PENDING': 'ĐANG CHỜ',
        'REJECTED': 'TỪ CHỐI PHÊ DUYỆT',
        'SIGNED': 'ĐÃ KÝ',
        'ACTIVE': 'ĐANG HIỆU LỰC',
        'COMPLETED': 'HOÀN THÀNH',
        'EXPIRED': 'HẾT HIỆU LỰC',
        'CANCELLED': 'ĐÃ HỦY',
        'ENDED': 'ĐÃ KẾT THÚC',
        'DELETED': 'ĐÃ XÓA',
        'EXPIRING': 'SẮP HẾT HẠN',
    };

    const handleExport = (id) => {
        setSelectedContractIdExport(id);
    };

    const columnStaff = [
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
                        maxWidth: '50px'
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
            render: (user) => <Link to={user.user_id != userL.id ? `/profileUser/${user.user_id}` : `/profile`} className="font-bold text-[#228eff]">{user?.full_name}</Link>,
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "title",
            key: "title",
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text, record) => (
                <Link to={`${user.roles[0] === "ROLE_STAFF" || user.roles[0] === "ROLE_DIRECTOR" ? `/ContractDetail/${record.id}` : `/manager/ContractDetail/${record.id}`}`} className="font-bold text-[#228eff] cursor-pointer">
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
            render: (partner) => <p>{partner?.partnerName}</p>,
            filters: [
                ...new Set(
                    tableData?.map(contract =>
                        contract.partnerB?.partnerName
                    )
                ),
            ]
                .filter(Boolean)
                .map(name => ({
                    text: name,
                    value: name,
                })),
            onFilter: (value, record) =>
                (record.partnerB?.partnerName) === value,
        },

        {
            title: "Giá trị",
            dataIndex: "amount",
            key: "amount",
            render: (value) => value.toLocaleString("vi-VN") + " VND",
            sorter: (a, b) => a.amount - b.amount,
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
        ...(!status ? [{
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            filters: [
                { text: 'Đã tạo', value: 'CREATED' },
                { text: 'Đã chỉnh sửa', value: 'FIXED' },
                { text: 'Chờ phê duyệt', value: 'APPROVAL_PENDING' },
                { text: 'Đã phê duyệt', value: 'APPROVED' },
                { text: 'Đã cập nhật', value: 'UPDATED' },
                { text: 'Đang chờ', value: 'PENDING' },
                { text: 'Từ chối', value: 'REJECTED' },
                { text: 'Đã ký', value: 'SIGNED' },
                { text: 'Đang hiệu lực', value: 'ACTIVE' },
                { text: 'Hoàn thành', value: 'COMPLETED' },
                { text: 'Hết hiệu lực', value: 'EXPIRED' },
                { text: 'Đã hủy', value: 'CANCELLED' },
                { text: 'Đã kết thúc', value: 'ENDED' },
                { text: 'Sắp hết hạn', value: 'EXPIRING' }
            ],
            filterMultiple: true,
            onFilter: (value, record) => {
                if (value === 'EXPIRING') {
                    if (record.status === 'ACTIVE' && record.expiryDate) {
                        const expiryDate = new Date(record.expiryDate[0], record.expiryDate[1] - 1, record.expiryDate[2]);
                        const today = new Date();
                        const twoMonthsFromNow = new Date();
                        twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
                        return expiryDate <= twoMonthsFromNow && expiryDate >= today;
                    }
                    return false;
                }
                // Handle other statuses
                return record.status === value;
            },
            render: (status, record) => {
                // Kiểm tra nếu hợp đồng đang hiệu lực và có ngày hết hạn
                if (status === 'ACTIVE' && record.expiryDate) {
                    const expiryDate = new Date(record.expiryDate[0], record.expiryDate[1] - 1, record.expiryDate[2]);
                    const today = new Date();
                    const twoMonthsFromNow = new Date();
                    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

                    // Nếu ngày hết hạn trong vòng 2 tháng tới
                    if (expiryDate <= twoMonthsFromNow && expiryDate >= today) {
                        return statusContract['EXPIRING'];
                    }
                }
                return statusContract[status] || <Tag>{status}</Tag>;
            },
            sorter: (a, b) => a.status.localeCompare(b.status),
        }] : []),
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Dropdown
                        menu={{

                            items: [

                                // Nếu record.status không thuộc các trạng thái sau thì cho phép sửa
                                ...(record.status !== "APPROVAL_PENDING" &&
                                    record.status !== "APPROVED" &&
                                    record.status !== "SIGNED" &&
                                    record.status !== "ACTIVE" &&
                                    record.status !== "COMPLETED" &&
                                    // record.status !== "EXPIRED" &&
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

                                ...(["SIGNED", "ACTIVE"].includes(record.status)
                                    ? [
                                        {
                                            key: "uploadImagSign",
                                            icon: <SignatureOutlined />,
                                            label: record.status === "ACTIVE" ? "Xem hợp đồng đã ký" : "Xác nhận đã ký",
                                            onClick: () => openUpdateSignModal(record.id),
                                        },
                                    ]
                                    : []),
                                ...(["ACTIVE", "EXPIRED", "ENDED"].includes(record.status)
                                    ? [
                                        {
                                            key: "updateStatus",
                                            icon: <BsClipboard2DataFill />,
                                            label: "Cập nhật trạng thái thanh toán",
                                            onClick: () => openUpdateStatusModal(record.id),
                                        },
                                        {
                                            key: "cancelContract",
                                            icon: <ImCancelCircle style={{ color: 'red' }} />,
                                            label: "Hủy hợp đồng",
                                            onClick: () => openCancelSignModal(record.id),
                                        },
                                    ]
                                    : []),

                                {
                                    key: "export",
                                    icon: <DownloadOutlined style={{ color: "#228eff" }} />,
                                    label: "Export",
                                    onClick: () => handleExport(record.id),
                                },

                                ...(["CANCELLED"].includes(record.status)
                                    ? [
                                        {
                                            key: "cancelInfor",
                                            icon: <IoInformationCircleOutline style={{ color: 'red' }} />,
                                            label: "Thông tin hủy",
                                            onClick: () => openInforCancelModal(record.id),
                                        },

                                    ]
                                    : []),

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
                                            key: "delete",
                                            icon: <DeleteOutlined />,
                                            label: "Xóa",
                                            danger: true,
                                            onClick: () => handleDelete(record),
                                        },
                                    ]
                                    : []),
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

    const columnManager = [
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
                        maxWidth: '50px'
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
            render: (user) => <Link to={user.user_id != userL.id ? `/profileUser/${user.user_id}` : `/profile`} className="font-bold text-[#228eff]">{user?.full_name}</Link>,
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "title",
            key: "title",
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text, record) => (
                <Link to={`${user.roles[0] === "ROLE_STAFF" || user.roles[0] === "ROLE_DIRECTOR" ? `/ContractDetail/${record.id}` : `/manager/ContractDetail/${record.id}`}`} className="font-bold text-[#228eff] cursor-pointer">
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
            render: (partner) => <p>{partner?.partnerName}</p>,
            filters: [
                ...new Set(
                    tableData?.map(contract =>
                        contract.partnerB?.partnerName
                    )
                ),
            ]
                .filter(Boolean)
                .map(name => ({
                    text: name,
                    value: name,
                })),
            onFilter: (value, record) =>
                (record.partnerB?.partnerName) === value,
        },

        {
            title: "Giá trị",
            dataIndex: "amount",
            key: "amount",
            render: (value) => value.toLocaleString("vi-VN") + " VND",
            sorter: (a, b) => a.amount - b.amount,
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
                                Tải file  đã ký
                            </Button>
                        )}
                    </div>
                )
            )
        },
        ...(!status ? [{
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            filters: [
                { text: 'Đã tạo', value: 'CREATED' },
                { text: 'Đã chỉnh sửa', value: 'FIXED' },
                { text: 'Chờ phê duyệt', value: 'APPROVAL_PENDING' },
                { text: 'Đã phê duyệt', value: 'APPROVED' },
                { text: 'Đã cập nhật', value: 'UPDATED' },
                { text: 'Đang chờ', value: 'PENDING' },
                { text: 'Từ chối', value: 'REJECTED' },
                { text: 'Đã ký', value: 'SIGNED' },
                { text: 'Đang hiệu lực', value: 'ACTIVE' },
                { text: 'Hoàn thành', value: 'COMPLETED' },
                { text: 'Hết hiệu lực', value: 'EXPIRED' },
                { text: 'Đã hủy', value: 'CANCELLED' },
                { text: 'Đã kết thúc', value: 'ENDED' },
                { text: 'Sắp hết hạn', value: 'EXPIRING' }
            ],
            onFilter: (value, record) => {
                if (value === 'EXPIRING') {
                    if (record.status === 'ACTIVE' && record.expiryDate) {
                        const expiryDate = new Date(record.expiryDate[0], record.expiryDate[1] - 1, record.expiryDate[2]);
                        const today = new Date();
                        const twoMonthsFromNow = new Date();
                        twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);
                        return expiryDate <= twoMonthsFromNow && expiryDate >= today;
                    }
                    return false;
                }
                return record.status === value;
            },
            render: (status, record) => {
                // Kiểm tra nếu hợp đồng đang hiệu lực và có ngày hết hạn
                if (status === 'ACTIVE' && record.expiryDate) {
                    const expiryDate = new Date(record.expiryDate[0], record.expiryDate[1] - 1, record.expiryDate[2]);
                    const today = new Date();
                    const twoMonthsFromNow = new Date();
                    twoMonthsFromNow.setMonth(twoMonthsFromNow.getMonth() + 2);

                    // Nếu ngày hết hạn trong vòng 2 tháng tới
                    if (expiryDate <= twoMonthsFromNow && expiryDate >= today) {
                        return statusContract['EXPIRING'];
                    }
                }
                return statusContract[status] || <Tag>{status}</Tag>;
            },
            sorter: (a, b) => a.status.localeCompare(b.status),
        }] : []),
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Dropdown
                        menu={{

                            items: [
                                // sau active mới hiên
                                ...(["ACTIVE", "EXPIRED", "ENDED"].includes(record.status)
                                    ? [
                                        {
                                            key: "updateStatus",
                                            icon: <BsClipboard2DataFill />,
                                            label: "Cập nhật trạng thái thanh toán",
                                            onClick: () => openUpdateStatusModal(record.id),
                                        },
                                    ]
                                    : []),
                                ...(["SIGNED", "ACTIVE"].includes(record.status)
                                    ? [
                                        {
                                            key: "uploadImagSign",
                                            icon: <SignatureOutlined />,
                                            label: record.status === "ACTIVE" ? "Xem hợp đồng đã ký" : "Xác nhận đã ký",
                                            onClick: () => openUpdateSignModal(record.id),
                                        },
                                    ]
                                    : []),

                                ...(["CANCELLED"].includes(record.status)
                                    ? [
                                        {
                                            key: "cancelInfor",
                                            icon: <IoInformationCircleOutline style={{ color: 'red' }} />,
                                            label: "Thông tin hủy",
                                            onClick: () => openInforCancelModal(record.id),
                                        },

                                    ]
                                    : []),


                                {
                                    key: "export",
                                    icon: <DownloadOutlined style={{ color: "#228eff" }} />,
                                    label: "Export",
                                    onClick: () => handleExport(record.id),
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

    const handleTabChange = (key) => {
        setActiveKey(key);
        setIsApprover(key === '2');
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
            const parsedRes = JSON.parse(res);
            refetchPaymnet();
            refetchBill();
            refetch();
            message.success(parsedRes.message);
            setFileList([]);
            // setActivePanel([]);
            setIsUpdateStatusModalVisible(false);

        } catch (error) {
            console.error("Lỗi khi tải lên file:", error);
            message.error("Có lỗi xảy ra khi tải lên file!");
        }
    };

    const handleUploadSign = async (selectedContractId) => {
        console.log("selectedContractId", selectedContractId)
        try {
            // Tạo FormData và append tất cả file vào cùng một key (ví dụ: "files")
            const formData = new FormData();
            fileList.forEach((file) => {
                formData.append("files", file);
            });
            console.log("formData", formData)
            // Gọi API upload file, truyền paymentScheduleId và formData
            const res = await uploadSign({ contractId: selectedContractId, formData }).unwrap();

            message.success(res.message);
            setFileList([]);

            setSelectedContractId(null);
            setIsModalSignedVisible(false);
            refetchImg();
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
        } else if (isStaff) {
            setPaginationStaff(pagination);
        } else if (isCEO) {
            setPaginationCEO(pagination);
        } else if (isApprover) {
            setPaginationApprover(pagination);
        }
        if (filters?.status && filters?.status.length > 0) {
            setStatus(filters?.status);
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

    const alwaysVisibleKeys = ['signedFilePath', 'action',];

    // Mặc định check hết tất cả (bao gồm cả những cột bắt buộc)
    const defaultCheckedList = columnStaff.map((col) => col.key);

    // State cho các cột có thể thay đổi
    const [checkedList, setCheckedList] = useState(defaultCheckedList);

    // Danh sách hiển thị checkbox cho người dùng chọn, loại bỏ những cột luôn hiển thị
    const options = columnStaff
        .filter(({ key }) => !alwaysVisibleKeys.includes(key))
        .map(({ key, title }) => ({
            label: title,
            value: key,
        }));

    const filteredColumns1 = useMemo(() => {
        return columnStaff.filter((col) =>
            alwaysVisibleKeys.includes(col.key) || checkedList.includes(col.key)
        );
    }, [checkedList]);

    const filteredColumns2 = useMemo(() => {
        return columnManager.filter((col) =>
            alwaysVisibleKeys.includes(col.key) || checkedList.includes(col.key)
        );
    }, [checkedList]);


    return (
        <div className="flex flex-col md:flex-row min-h-[100vh]">
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    QUẢN LÝ HỢP ĐỒNG {status ? displayStatus[status] : null}
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
                    {isStaff && (
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
                    )
                    }
                </Space>

                {isCEO ? (
                    <>
                        <Checkbox.Group
                            value={checkedList}
                            options={options}
                            onChange={(value) => setCheckedList(value)}
                            className="my-5"
                        />
                        <Table
                            columns={filteredColumns2}
                            dataSource={contracts?.data?.content}
                            rowKey="id"
                            loading={isLoading}
                            pagination={{
                                current: paginationCEO.current,
                                pageSize: paginationCEO.pageSize,
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
                    </>
                ) : isManager ? (
                    <>
                        <Checkbox.Group
                            value={checkedList}
                            options={options}
                            onChange={(value) => setCheckedList(value)}
                            className="my-5"
                        />
                        <Table
                            columns={filteredColumns2}
                            dataSource={contractApprove?.data?.content}
                            rowKey="id"
                            loading={isLoading}
                            pagination={{
                                current: paginationManager.current,
                                pageSize: paginationManager.pageSize,
                                total: contractApprove?.data?.totalElements,
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
                    </>
                ) : isStaff ? (

                    <ConfigProvider
                        theme={{
                            components: {
                                Tabs: {
                                    cardBg: "#6a7584",
                                    itemColor: "#ffff",
                                    colorBgContainer: '#1667ff',
                                    itemSelectedColor: "#ffff",
                                    motionDurationMid: '0.1s',
                                    motionDurationSlow: '0.1s',
                                    itemHoverColor: null,
                                    itemActiveColor: '#ffff',
                                },
                            },
                            token: { fontFamily: "Roboto, sans-serif" }
                        }}
                    >
                        <Tabs type="card" activeKey={activeKey} onChange={handleTabChange}>
                            <TabPane tab="Hợp đồng của tôi" key="1">
                                <Checkbox.Group
                                    value={checkedList}
                                    options={options}
                                    onChange={(value) => setCheckedList(value)}
                                    style={{ marginBottom: 16 }}
                                />
                                <Table
                                    columns={filteredColumns1}
                                    dataSource={contracts?.data?.content}
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
                            </TabPane>
                            <TabPane tab="Hợp đồng đã phê duyệt" key="2">
                                <Checkbox.Group
                                    value={checkedList}
                                    options={options}
                                    onChange={(value) => setCheckedList(value)}
                                    className="my-5"
                                />
                                <Table
                                    columns={filteredColumns2}
                                    dataSource={contractApprove?.data?.content}
                                    rowKey="id"
                                    loading={isLoading}
                                    // pagination={{
                                    //     current: paginationApprover.current,
                                    //     pageSize: paginationApprover.pageSize,
                                    //     total: contractApprove?.data?.totalElements,
                                    //     showSizeChanger: true,
                                    //     showQuickJumper: true,
                                    //     showTotal: (total) => `Tổng ${total} hợp đồng`,
                                    // }}
                                    onChange={handleTableChange}
                                    expandable={{
                                        expandedRowRender: (record) => <ExpandRowContent id={record.id} />,
                                    }}
                                    onRow={(record) => ({ onClick: () => setSelectedContract(record) })}
                                />
                            </TabPane>
                        </Tabs>
                    </ConfigProvider>
                ) : null}

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
                            accordion
                            activeKey={activePanel}
                            onChange={(key) => {
                                setActivePanel(key);
                                setPaymentId(key);
                            }}
                            className={` ${isDarkMode ? '' : 'bg-[#fafafa]'}  border border-gray-300 rounded-lg shadow-sm [&_.ant-collapse-arrow]:!text-[#1e1e1e]`}
                        >
                            {dataPayment?.data?.paymentSchedules?.map((schedule, index) => (
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
                                                {dataBill?.data && dataBill?.data?.length > 0 ? (
                                                    dataBill?.data?.map((imgUrl, idx) => (
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
                                                disabled={isManager || isCEO || isApprover}
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

            <Modal
                title="Cập nhật trạng thái đã ký"
                open={isModalSignedVisible}
                onCancel={handleCloseUpdateSignModal}
                footer={null}
                width={700}
                destroyOnClose
            >
                {LoadingImage ? (
                    <Spin />
                ) : ErrorSign ? (

                    <>
                        <Upload.Dragger
                            multiple
                            disabled={isManager || isCEO || isApprover}
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
                            icon={LoadingSign ? <LoadingOutlined /> : <UploadOutlined />}
                            onClick={() => handleUploadSign(selectedContractId)}
                            disabled={fileList.length === 0 || LoadingSign}
                            style={{ marginTop: "10px" }}
                        >
                            {LoadingSign ? "Đang tải lên..." : "Tải lên"}
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
                                    disabled={isManager || isCEO || isApprover}
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
                                    icon={LoadingSign ? <LoadingOutlined /> : <UploadOutlined />}
                                    onClick={() => handleUploadSign(selectedContractId)}
                                    disabled={fileList.length === 0 || LoadingSign}
                                    style={{ marginTop: "10px" }}
                                >
                                    {LoadingSign ? "Đang tải lên..." : "Tải lên"}
                                </Button>
                            </>
                        )}


                    </div>
                )}

            </Modal>

            {selectedContractIdExport && (
                <ExportContractPDF
                    contractId={selectedContractIdExport}
                    onDone={() => setSelectedContractIdExport(null)}
                />
            )}
            <DuplicateContractModal
                visible={isDuplicateModalVisible}
                onCancel={handleCloseDuplicateModal}
                contractId={selectedContractForDuplicate}
                refetch={refetch}
                refetchNoti={refetchNoti}
            />
            <ModalCancelContract
                visible={isCancelModalVisible}
                onCancel={() => setIsCancelModalVisible(false)}
                contractId={contractIdCancel}
                refetch={refetch}
            />
            <ModalCancelInformation
                visible={isCancelInforOpen}
                onCancel={() => setIsCancelInforOpen(false)}
                contractId={contractIdInfo}
            />
        </div>
    );
};

export default ManageContracts;
