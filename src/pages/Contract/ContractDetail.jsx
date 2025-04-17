import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Button, Col, Row, Spin, Drawer, Card, Tabs, Tag, Form, Input, Space, message, Timeline, Divider, Image, Typography, Checkbox, List, Table, Collapse, Tooltip } from 'antd';
import { useGetBussinessInformatinQuery } from '../../services/BsAPI';
import { useLazyGetTermDetailQuery } from '../../services/ClauseAPI';
import { numberToVietnamese } from '../../utils/ConvertMoney';
import dayjs from 'dayjs';
import { BookOutlined, CheckCircleFilled, CheckOutlined, ClockCircleOutlined, CloseOutlined, DollarOutlined, EditFilled, FileOutlined, ForwardOutlined, HistoryOutlined, InfoCircleOutlined, LeftCircleFilled, LeftOutlined, LoadingOutlined, PaperClipOutlined, RollbackOutlined, SmallDashOutlined } from '@ant-design/icons';
import { useLazyGetDataChangeByDateQuery, useLazyGetDateChangeContractQuery } from '../../services/AuditTrailAPI';
import { useGetContractDetailQuery, useGetImgBillQuery } from '../../services/ContractAPI';
import { useApproveProcessMutation, useGetProcessByContractIdQuery, useRejectProcessMutation } from '../../services/ProcessAPI';
import { selectCurrentUser } from '../../slices/authSlice';
import note from "../../assets/Image/review.svg"
import AuditrailContract from './component/AuditrailContract';
import { useGetAppendixByContractIdQuery } from '../../services/AppendixAPI';
import DisplayAppendix from '../appendix/staff/DisplayAppendix';
import { useGetNumberNotiForAllQuery } from '../../services/NotiAPI';
import { IoSearchCircle } from "react-icons/io5";
import ModalSearch from './component/ModalSearch';
import html2canvas from 'html2canvas';
const { Title, Text } = Typography;
import jsPDF from 'jspdf';
import { MdMarkChatRead } from "react-icons/md";

const ContractDetail = () => {
    const { Panel } = Collapse;
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: contractData, isLoading: loadingDataContract } = useGetContractDetailQuery(id);
    const { data: appendixData, isLoading: loadingDataContractAppendix } = useGetAppendixByContractIdQuery({ id: id });
    const [termsData, setTermsData] = useState({});
    const [loadingTerms, setLoadingTerms] = useState({});
    const [paymentId, setPaymentId] = useState(null);
    const [activePanel, setActivePanel] = useState([]);
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [visible, setVisible] = useState(false);
    const [auditTrails, setAuditTrails] = useState([]);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 20;
    const [hasMore, setHasMore] = useState(true);
    const [groupedTerms, setGroupedTerms] = useState({
        Common: [],
        A: [],
        B: []
    });
    const [confirmed, setConfirmed] = useState(false);
    const [searchModalVisible, setSearchModalVisible] = useState(false);

    const [selectedText, setSelectedText] = useState('');
    const [showSearchButton, setShowSearchButton] = useState(false);
    const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });

    const user = useSelector(selectCurrentUser);
    const [form] = Form.useForm();
    const { refetch: refetchNoti } = useGetNumberNotiForAllQuery()
    const [openAprove, setOpenAprove] = useState(false);
    const [rejectProcess, { isLoading: rejectLoading }] = useRejectProcessMutation();
    const [approveProcess, { isLoading: approveLoading }] = useApproveProcessMutation();

    const { data: dataBill } = useGetImgBillQuery(paymentId, {
        skip: !paymentId,
    });
    // Lấy thông tin bên thuê theo partner_id
    const { data: bsInfor, isLoading: isLoadingBsData } = useGetBussinessInformatinQuery();
    const [fetchTerms] = useLazyGetTermDetailQuery();

    const [fetchDdateAudittrail, { data: auditTrailDate, isLoading: loadingAuditTrailDate }] = useLazyGetDateChangeContractQuery();
    const [fetchDataData] = useLazyGetDataChangeByDateQuery();
    const { data: processData, isLoading: loadingDataProcess } = useGetProcessByContractIdQuery({ contractId: id });

    const stages = processData?.data?.stages || [];

    const matchingStage = stages.find(stage => stage.approver === user?.id);
    const StageIdMatching = matchingStage?.stageId;

    const clauseRef = useRef(null);


    const loadTermDetail = async (termId) => {
        if (!termsData[termId]) {
            setLoadingTerms((prev) => ({ ...prev, [termId]: true }));
            try {
                const response = await fetchTerms(termId).unwrap();
                setTermsData((prev) => ({
                    ...prev,
                    [termId]: response?.data
                }));
            } catch (error) {
                console.error(`Error loading term ${termId}:`, error);
            } finally {
                setLoadingTerms((prev) => ({ ...prev, [termId]: false }));
            }
        } else {
            setLoadingTerms((prev) => ({ ...prev, [termId]: false }));
        }
    };

    // Tải chi tiết các căn cứ pháp lý (legal_basis_terms là mảng object có trường original_term_id)
    useEffect(() => {
        if (contractData?.data?.legalBasisTerms) {
            contractData?.data?.legalBasisTerms.forEach((termObj) => {
                loadTermDetail(termObj.original_term_id);
            });
        }
    }, [contractData?.data?.legalBasisTerms]);

    // Nhóm các điều khoản từ additional_config
    useEffect(() => {
        if (contractData?.data?.additionalConfig) {
            const allGrouped = { Common: [], A: [], B: [] };
            // additionalConfig là object với các key (ví dụ: "1") chứa object với mảng Common, A, B
            Object.values(contractData?.data?.additionalConfig).forEach((config) => {
                if (config.Common && config.Common.length > 0) {
                    config.Common.forEach((termObj) => {
                        allGrouped.Common.push(termObj.original_term_id);
                    });
                }
                if (config.A && config.A.length > 0) {
                    config.A.forEach((termObj) => {
                        allGrouped.A.push(termObj.original_term_id);
                    });
                }
                if (config.B && config.B.length > 0) {
                    config.B.forEach((termObj) => {
                        allGrouped.B.push(termObj.original_term_id);
                    });
                }
            });
            // Loại bỏ trùng lặp
            allGrouped.A = [...new Set(allGrouped.A)];
            allGrouped.B = [...new Set(allGrouped.B)];
            setGroupedTerms(allGrouped);

            // Tải chi tiết cho các điều khoản bổ sung (bao gồm cả additional_terms)
            const additionalTermsIds =
                contractData?.data?.additional_terms?.map((termObj) => termObj.original_term_id) || [];
            const allTermIds = [
                ...allGrouped.Common,
                ...allGrouped.A,
                ...allGrouped.B,
                ...additionalTermsIds
            ];
            [...new Set(allTermIds)].forEach((termId) => {
                loadTermDetail(termId);
            });
        }
    }, [contractData?.data]);

    // Render các căn cứ pháp lý
    const renderLegalBasisTerms = () => {
        if (!contractData?.data?.legalBasisTerms || contractData?.data?.legalBasisTerms.length === 0) {
            return <p>Chưa có căn cứ pháp lý nào được chọn.</p>;
        }
        return contractData?.data?.legalBasisTerms.map((termObj, index) => {
            const termDetail = termsData[termObj.original_term_id];
            if (!termDetail) {
                return (
                    <div key={termObj.original_term_id} className="term-item p-1">
                        <Spin size="small" />
                    </div>
                );
            }
            return (
                <p key={index}>
                    <i>- {termDetail.value || termObj.label}</i>
                </p>
            );
        });
    };

    // Render một điều khoản (cho cả nhóm A và B)
    const renderTerm = (termId, index) => {
        if (loadingTerms[termId]) {
            return (
                <div key={termId} className="term-item p-1">
                    <Spin size="small" />
                </div>
            );
        }
        const termDetail = termsData[termId];
        if (!termDetail) return null;
        return (
            <div key={termId} className="term-item p-1">
                <div className="term-content">
                    <p>{index + 1}. {termDetail.value}</p>
                </div>
            </div>
        );
    };
    // Hàm chuyển mảng thành Date (lưu ý: month của Date là 0-indexed)
    const parseDate = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
        const [year, month, day, hour, minute] = dateArray;
        return new Date(year, month - 1, day, hour, minute);
    };

    const showDrawer = () => {
        setVisible(true);
    };

    const onClose = () => {
        setVisible(false);
    };
    const showDrawerAprove = () => {
        setOpenAprove(true);
    };

    const onCloseDrawerAprove = () => {
        setOpenAprove(false);
    };

    const onCheckboxChange = (e) => {
        setConfirmed(e.target.checked);
    };

    function convertCreatedAt(createdAtArray) {
        if (!createdAtArray || !Array.isArray(createdAtArray) || createdAtArray.length < 6) {
            return "Không có dữ liệu";
        }
        const [year, month, day, hour, minute, second] = createdAtArray;
        // Tạo đối tượng Date; chú ý tháng phải trừ 1 vì tháng trong JavaScript tính từ 0
        const date = new Date(year, month - 1, day, hour, minute, second);
        return dayjs(date).format("DD-MM-YYYY vào lúc HH:mm:ss");
    }

    // Hàm để xử lý khi tab được thay đổi
    const loadAuditTrailPage = async (page) => {
        try {
            const response = await fetchDdateAudittrail({ id: contractData.data?.originalContractId, params: { page, size: pageSize } }).unwrap();
            console.log("Audit trail page", response.data);
            if (page === 0) {
                setAuditTrails(response?.data?.content);
            } else {
                setAuditTrails((prev) => [...prev, ...response?.data?.content]);
            }
            // Nếu số lượng trả về ít hơn pageSize thì không còn dữ liệu
            if (response?.data?.content.length < pageSize) {
                setHasMore(false);
            }
        } catch (error) {
            console.error("Lỗi tải audit trail:", error);
        }
    };

    // Add a new button to load more data
    const loadMoreData = () => {
        if (hasMore && !loadingAuditTrailDate) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            loadAuditTrailPage(nextPage);
        }
    };

    // Khi chuyển tab sang "Lịch sử thay đổi"
    const handleTabChange = (key) => {
        if (key === "2") {
            // Reset lại dữ liệu (nếu cần)
            setAuditTrails([]);
            setCurrentPage(1);
            setHasMore(true);
            loadAuditTrailPage(0);
        }
    };
    const statusContract = {
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
    };


    // Ví dụ chuyển hướng khi ấn nút Đồng Ý Phê Duyệt
    const handleApprove = async () => {
        try {
            await approveProcess({ contractId: id, stageId: StageIdMatching }).unwrap();
            message.success("Đã đồng ý phê duyệt thành công!");
            onClose();
            refetchNoti()
            if (user?.roles?.includes("ROLE_STAFF")) {
                navigate(`/approvalContract`);
            } else if (user?.roles?.includes("ROLE_MANAGER")) {
                navigate(`/manager/approvalContract`);
            } else if (user?.roles?.includes("ROLE_DIRECTOR")) {
                navigate(`/director/approvalContract`);
            }
        } catch (error) {
            console.log(error);
            message.error(error?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
        }
    };
    const handleReject = async (values) => {
        // Lấy comment từ form
        const { comment } = values;
        try {
            await rejectProcess({ comment: comment, contractId: id, stageId: StageIdMatching }).unwrap();
            message.success("Đã từ chối phê duyệt và gửi nhận xét thành công!");
            form.resetFields();
            onClose();
            refetchNoti()
            if (user?.roles[0]?.includes("ROLE_STAFF")) {
                navigate(`/approvalContract`);
            } else if (user?.roles[0]?.includes("ROLE_MANAGER")) {
                navigate(`/manager/approvalContract`);
            } else if (user?.roles?.includes("ROLE_DIRECTOR")) {
                navigate(`/director/approvalContract`);
            }
        } catch (error) {
            console.log(error);
            message.error(error?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
        }
    };
    const userApproval = processData?.data.stages.find(stage => stage.approver === user?.id && stage.status === "APPROVED");
    const isApprover = processData?.data.stages?.some(stage => stage.approver === user?.id);

    const paymentItemsColumns = [
        {
            title: 'STT',
            dataIndex: 'itemOrder',
            key: 'itemOrder',
            align: 'center',
        },
        {
            title: 'Nội dung',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Số tiền (VND)',
            dataIndex: 'amount',
            key: 'amount',
            render: (value) => new Intl.NumberFormat('vi-VN').format(value),
        },

    ];

    // Cột cho bảng số lần thanh toán
    const paymentSchedulesColumns = [
        {
            title: 'Đợt',
            dataIndex: 'paymentOrder',
            key: 'paymentOrder',
            align: 'center',
        },
        {
            title: 'Số tiền (VND)',
            dataIndex: 'amount',
            key: 'amount',
            render: (value) => new Intl.NumberFormat('vi-VN').format(value),
        },
        {
            title: 'Ngày thanh toán',
            dataIndex: 'paymentDate',
            key: 'paymentDate',
            render: (paymentDate) =>
                `Ngày ${dayjs(parseDate(paymentDate)).format('DD')} Tháng ${dayjs(parseDate(paymentDate)).format('MM')} năm ${dayjs(parseDate(paymentDate)).format('YYYY')}`,
        },
        {
            title: 'Phương thức thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method) =>
                method === 'cash'
                    ? 'Tiền mặt'
                    : method === 'creditCard'
                        ? 'Thẻ tín dụng'
                        : 'Chuyển khoản',
        },
    ];

    // hàm hiển thị 
    const handleMouseUp = (e) => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        // Kiểm tra xem văn bản được chọn có nằm trong component không
        if (text && clauseRef.current.contains(selection.anchorNode)) {
            setSelectedText(text);
            setShowSearchButton(true);
            setButtonPosition({ x: e.pageX - 100, y: e.pageY + 10 });
        } else {
            setShowSearchButton(false);
        }
    };


    const handleSearch = () => {
        setSearchModalVisible(true)
    };

    //hover hiển thin nút
    useEffect(() => {
        const element = clauseRef.current;
        if (element) {
            element.addEventListener('mouseup', handleMouseUp, true);
        }
        return () => {
            if (element) {
                element.removeEventListener('mouseup', handleMouseUp, true);
            }
        };
    }, []);



    if (isLoadingBsData || loadingDataContract | loadingDataContractAppendix) {
        return (
            <div className="flex justify-center items-center">
                <Spin />
            </div>
        );
    }


    return (
        <div
            id="contractContent"
            className={`${isDarkMode ? 'bg-[#222222] text-white' : 'bg-gray-100'} w-[80%] justify-self-center   shadow-md p-4 pb-16 rounded-md`}
        >
            <Button
                icon={<RollbackOutlined />}
                type="primary"
                onClick={() => navigate(-1)}
                className="mb-4 absolute left-[120px] top-[90px]"
            >
                Quay về
            </Button>
            {/* <Button
                icon={<RollbackOutlined />}
                type="primary"
                onClick={exportPDF}
                className="mb-4 absolute left-[120px] top-[90px]"
            >
                Export PDF
            </Button> */}

            <div className="flex justify-between relative">
                {contractData?.data?.status === "APPROVAL_PENDING" && (
                    !isApprover && user.roles[0] !== "ROLE_MANAGER" ? (
                        <Button
                            type='primary'
                            icon={<EditFilled style={{ fontSize: 20 }} />}
                            onClick={() => navigate(`/EditContract/${id}`)}
                        >
                            Sửa hợp đồng
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            className="fixed right-5 top-20 flex flex-col h-fit "
                            onClick={showDrawerAprove}
                        >
                            <div className='flex flex-col items-center'>
                                <p className='flex items-center justify-center'>
                                    <LeftOutlined style={{ fontSize: 25, color: '#ffffff' }} />
                                    <Image width={40} className='py-1' height={40} src={note} preview={false} />
                                </p>
                                <p className={`${!isDarkMode ? "text-white" : ''}`}>Phê duyệt</p>
                            </div>
                        </Button>
                    )
                )}

                <Button type='link' onClick={showDrawer}>
                    <InfoCircleOutlined style={{ fontSize: 30 }} /> Thông tin hợp đồng
                </Button>
            </div>

            <Drawer
                size="large"
                title="Thông tin phê duyệt hợp đồng"
                onClose={onCloseDrawerAprove}
                open={openAprove}
            >
                {!userApproval ? (
                    <Tabs defaultActiveKey="1" >
                        {/* Tab Nhận xét */}
                        <Tabs.TabPane tab="Nhận xét" key="1">
                            <Form form={form} layout="vertical" onFinish={handleReject}>
                                <Form.Item
                                    name="comment"
                                    label="Đề xuất sửa đổi hợp đồng :"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nhận xét" }]}
                                >
                                    <Input.TextArea rows={8} placeholder="Vui lòng để lại ghi chú" style={{ resize: "none" }} />
                                </Form.Item>

                                <Form.Item>
                                    <Space style={{ display: "flex", justifyContent: "space-around" }}>
                                        <Button icon={<CloseOutlined />} danger type="primary" loading={rejectLoading} htmlType="submit" >
                                            Từ Chối Phê Duyệt
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>

                        </Tabs.TabPane>
                        <Tabs.TabPane tab="Phê duyệt" key="2">
                            <Card style={{ margin: '16px' }}>
                                <Typography.Paragraph>
                                    Vui lòng đảm bảo rằng bạn đã đọc kỹ tất cả các thông tin liên quan đến phê duyệt.
                                </Typography.Paragraph>
                                <Checkbox onChange={onCheckboxChange}>
                                    Tôi đã đọc kỹ và quyết định phê duyệt
                                </Checkbox>
                                <Button
                                    disabled={!confirmed}
                                    loading={approveLoading}
                                    type="primary"
                                    onClick={handleApprove}
                                    style={{ marginTop: '16px' }}
                                    icon={<CheckOutlined />}
                                >
                                    Đồng Ý Phê Duyệt
                                </Button>
                            </Card>
                        </Tabs.TabPane>
                    </Tabs>
                ) : (
                    <Tag color='green' className='text-base mt-5 ml-5' icon={<CheckCircleFilled />}>Bạn đã phê duyệt hợp đồng này </Tag>
                )}
            </Drawer>

            <Drawer
                title="Thông tin chi tiết"
                placement="right"
                onClose={onClose}
                open={visible}
                width={700}
            >
                <Tabs defaultActiveKey="1" onChange={handleTabChange}>
                    <Tabs.TabPane icon={<BookOutlined />} tab="Thông tin chung" key="1">
                        <div className='flex gap-2 flex-col ml-6 justify-center'>
                            <p> <b>phiên bản hợp đồng:</b> <Tag className='ml-2' color='blue-inverse'>{contractData?.data.version}.0.0 </Tag></p>
                            <p> <b>Người tạo:</b> {contractData?.data.user.full_name}</p>
                            <p><b>Được tạo vào:</b> {convertCreatedAt(contractData?.data.createdAt)}</p>
                            <p><b>Lần chỉnh sửa cuối cùng</b> {convertCreatedAt(contractData?.data.updatedAt)}</p>
                            <p><b>Trạng thái:</b> <span className='ml-3'>{statusContract[contractData?.data.status]}</span></p>
                            <Divider className="border-t-2 border-gray-400" />
                        </div>
                        {loadingDataProcess ? (
                            <div className='flex justify-center items-center'>
                                <Spin />
                            </div>
                        ) :
                            (
                                <div>
                                    <p className="text-center font-bold mt-6 mb-[50px]">
                                        Lộ trình xét duyệt
                                    </p>
                                    <Timeline mode="left" className="mt-4 -mb-14">
                                        {processData?.data?.stages?.length > 0 ? (
                                            processData?.data?.stages.map((stage,index) => (
                                                <Timeline.Item
                                                    key={index}
                                                    children={
                                                        <div className="min-h-[50px]">
                                                            {stage.approverName}
                                                        </div>
                                                    }
                                                    label={
                                                        <div className="w-full mt-[-15px] h-full">
                                                            {
                                                                stage.status === "APPROVING"
                                                                    ? <div className="flex flex-col h-full justify-center items-center">
                                                                        {/* <p className="text-[12px]">
                                                                            {new Date(
                                                                                stage.startDate[0],
                                                                                stage.startDate[1] - 1,
                                                                                stage.startDate[2]
                                                                            ).toLocaleDateString("vi-VN")} -
                                                                            {new Date(
                                                                                stage.endDate[0],
                                                                                stage.endDate[1] - 1,
                                                                                stage.endDate[2]
                                                                            ).toLocaleDateString("vi-VN")}
                                                                        </p> */}
                                                                        <Tag color="gold-inverse" className="w-fit mr-0">Đang phê duyệt</Tag>
                                                                    </div>
                                                                    : stage.status === "APPROVED" && stage.approvedAt
                                                                        ?
                                                                        <div className="flex flex-col justify-center items-center">
                                                                            <p className="text-[12px]">
                                                                                {
                                                                                    new Date(
                                                                                        stage.approvedAt[0],
                                                                                        stage.approvedAt[1] - 1,
                                                                                        stage.approvedAt[2]
                                                                                    ).toLocaleDateString("vi-VN")
                                                                                }
                                                                            </p>
                                                                            <Tag color="green-inverse" className="w-fit mr-0">Đã duyệt</Tag>
                                                                        </div>
                                                                        : ""
                                                            }
                                                        </div>
                                                    }

                                                    dot={
                                                        stage.status === "APPROVING" ? (
                                                            <div>
                                                                <LoadingOutlined spin className="timeline-clock-icon" />
                                                            </div>
                                                        ) : stage.status === "APPROVED" ? (
                                                            <div>
                                                                <CheckOutlined className="timeline-clock-icon" style={{ color: 'green' }} />
                                                            </div>
                                                        ) : stage.status === "REJECTED" ? (
                                                            <CloseOutlined className="timeline-clock-icon" style={{ color: 'red' }} />
                                                        ) : stage.status === "SKIPPED" ? (
                                                            <ForwardOutlined className="timeline-clock-icon" style={{ color: 'orange' }} />
                                                        ) : stage.status === "NOT_STARTED" ? (
                                                            <SmallDashOutlined className="timeline-clock-icon" style={{ color: 'gray' }} />
                                                        ) : (
                                                            <ClockCircleOutlined className="timeline-clock-icon" />
                                                        )
                                                    }
                                                />
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-center mt-2">Chưa có lộ trình xét duyệt</p>
                                        )}
                                    </Timeline>

                                </div>

                            )}
                    </Tabs.TabPane>
                    <Tabs.TabPane icon={<HistoryOutlined />} tab="Lịch sử thay đổi" key="2">
                        <div
                            id="scrollableDiv"
                            style={{ height: '100%', overflow: 'auto', padding: '0 16px' }}
                        >
                            {auditTrails.length === 0 && loadingAuditTrailDate ? (
                                <Spin />
                            ) : (
                                <div className="date-list">
                                    <AuditrailContract auditTrails={auditTrails} contractId={contractData?.data.originalContractId} getDetail={fetchDataData} />
                                    {/* {!hasMore && <p style={{ textAlign: 'center' }}>Không còn dữ liệu</p>} */}
                                </div>
                            )}
                            {loadingAuditTrailDate && <Spin style={{ textAlign: 'center', marginTop: 10 }} />}

                        </div>
                        {hasMore && (
                            <div className='flex justify-center'>
                                <Button onClick={loadMoreData} disabled={!hasMore || loadingAuditTrailDate} style={{ marginTop: '10px' }}>
                                    {loadingAuditTrailDate ? 'Đang tải...' : 'Xem thêm'}
                                </Button>
                            </div>
                        )}
                    </Tabs.TabPane>
                    {appendixData?.data.length > 0 && (
                        <Tabs.TabPane icon={<FileOutlined />} tab="Phụ Lục Hợp Đồng" key="3">
                            <div className="flex flex-col">
                                {/* <h3 className="text-lg font-bold">Danh sách phụ lục:</h3> */}
                                <DisplayAppendix appendices={appendixData?.data} />
                            </div>
                        </Tabs.TabPane>
                    )}
                    {["APPROVED", "PENDING", "SIGNED", "ACTIVE"].includes(contractData?.data?.status) && (
                        <Tabs.TabPane icon={<DollarOutlined />} tab="Các đợt thanh toán" key="4">
                            <Collapse
                                bordered
                                activeKey={activePanel}
                                className={` ${isDarkMode ? '' : 'bg-[#fafafa]'}  border border-gray-300 rounded-lg shadow-sm [&_.ant-collapse-arrow]:!text-[#1e1e1e]`}
                            >
                                {contractData?.data?.paymentSchedules?.map((schedule, index) => (
                                    <Panel
                                        key={schedule.id || index}
                                        header={
                                            <div className={`${isDarkMode ? '' : '!text-black'} flex items-center justify-between w-full`}>
                                                {/* Số tiền */}
                                                <Tooltip title={`${schedule.amount.toLocaleString()} VND`}>
                                                    <span
                                                        className="font-bold  whitespace-nowrap overflow-hidden "
                                                        style={{ maxWidth: "250px" }}
                                                    >
                                                        {schedule.amount.toLocaleString()} VND
                                                    </span>
                                                </Tooltip>
                                                {/* Ngày thanh toán */}
                                                <span className="">
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
                                        }}
                                    >
                                        {schedule.status === "PAID" ? (
                                            // Nếu đã thanh toán, chỉ hiển thị danh sách ảnh từ API
                                            <div>
                                                <div className="text-gray-500 italic text-center mb-3">
                                                    Đợt thanh toán này đã hoàn thành, danh sách hóa đơn:
                                                </div>
                                                <div className="image-preview flex gap-3 flex-wrap" style={{ justifyContent: "center" }}>
                                                    {dataBill?.data && dataBill.data.length > 0 ? (
                                                        dataBill.data.map((imgUrl, idx) => (
                                                            <Image
                                                                key={idx}
                                                                src={imgUrl}
                                                                alt={`Uploaded ${idx}`}
                                                                style={{
                                                                    width: "100px",
                                                                    height: "100px",
                                                                    objectFit: "cover",
                                                                    borderRadius: "8px",
                                                                }}
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="text-gray-500">
                                                            Không có hóa đơn nào được tải lên.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // Nếu chưa thanh toán, hiển thị thông báo "Chưa thanh toán" với UI đẹp
                                            <div className="p-8 rounded-lg bg-gradient-to-r  shadow-lg text-center">
                                                <p className={`text-3xl font-extrabold ${isDarkMode ? '' : 'text-red-600'} `}>Chưa thanh toán</p>
                                                <p className="mt-4 text-lg ">
                                                    Hóa đơn sẽ được cập nhật sau khi thanh toán được xác nhận.
                                                </p>
                                            </div>

                                        )}
                                    </Panel>
                                ))}
                            </Collapse>
                        </Tabs.TabPane>
                    )}


                </Tabs>
            </Drawer>
            <div >
                <div className="text-center mt-9">
                    <p className="font-bold text-xl pt-8">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-bold text-lg mt-2">Độc lập - Tự do - Hạnh phúc</p>
                    <p>---------oOo---------</p>
                    {/* <p className='place-self-end mr-10 my-6'>
                        {contractData?.data?.contractLocation}, Ngày {dayjs(parseDate(contractData?.data?.createdAt)).format('DD')} Tháng {dayjs(parseDate(contractData?.data?.createdAt)).format('MM')} năm {dayjs(parseDate(contractData?.data?.createdAt)).format('YYYY')}
                    </p> */}
                    <p className="text-3xl font-bold mt-5">
                        {contractData?.data.title ? contractData?.data.title.toUpperCase() : ''}
                    </p>
                    <p className="mt-3 text-base">
                        <b>Số:</b> {contractData?.data.contractNumber}
                    </p>

                </div>

                <div className="px-4 flex pl-10 flex-col gap-2 mt-[100px]">
                    {renderLegalBasisTerms()}
                    <div className={` p-1 rounded-lg`}>
                        Hôm nay, Hợp đồng dịch vụ này được lập vào ngày{" "}
                        {dayjs(parseDate(contractData?.data?.signingDate)).format("DD")} tháng{" "}
                        {dayjs(parseDate(contractData?.data?.signingDate)).format("MM")} năm{" "}
                        {dayjs(parseDate(contractData?.data?.signingDate)).format("YYYY")}, tại {contractData?.data?.contractLocation}, bởi và giữa:
                    </div>
                </div>

                <Row gutter={16} className="flex flex-col mt-5 pl-10 gap-5" justify="center">
                    <Col className="flex flex-col gap-2" md={10} sm={24}>
                        <p className="font-bold text-lg"><u>BÊN CUNG CẤP (BÊN A)</u></p>
                        <p className="text-sm"><b>Tên công ty:</b> {contractData?.data.partnerA.partnerName}</p>
                        <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {contractData?.data.partnerA.partnerAddress}</p>
                        <p className="text-sm"><b>Người đại diện:</b> {contractData?.data.partnerA.spokesmanName}</p>
                        <p className="text-sm"><b>Chức vụ:</b> {contractData?.data.partnerA.position}</p>
                        <p className="text-sm"><b>Mã số thuế:</b> {contractData?.data.partnerA.partnerTaxCode}</p>
                        <p className="text-sm"><b>Email:</b> {contractData?.data.partnerA.partnerEmail}</p>
                    </Col>
                    <Col className="flex flex-col gap-2" md={10} sm={24}>
                        <p className="font-bold text-lg"><u>BÊN CUNG CẤP (BÊN A)</u></p>
                        <p className="text-sm"><b>Tên công ty:</b> {contractData?.data.partnerB.partnerName}</p>
                        <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {contractData?.data.partnerB.partnerAddress}</p>
                        <p className="text-sm"><b>Người đại diện:</b> {contractData?.data.partnerB.spokesmanName}</p>
                        <p className="text-sm"><b>Chức vụ:</b> {contractData?.data.partnerB.position}</p>
                        <p className="text-sm"><b>Mã số thuế:</b> {contractData?.data.partnerB.partnerTaxCode}</p>
                        <p className="text-sm"><b>Email:</b> {contractData?.data.partnerB.partnerEmail}</p>
                    </Col>
                    <div className="pl-2">
                        <p>
                            Sau khi bàn bạc và thống nhất, chúng tôi cùng thỏa thuận ký kết hợp đồng với nội dung và các điều khoản sau:
                        </p>
                        <p className="font-bold text-lg mt-4 mb-3"><u>NỘI DUNG HỢP ĐỒNG</u></p>
                        <div
                            className="ml-1"
                            dangerouslySetInnerHTML={{ __html: contractData?.data.contractContent || "Chưa nhập" }}
                        />
                        <div className="mt-4">
                            <p className="font-bold text-lg mt-4 mb-3"><u>GIÁ TRỊ VÀ THANH TOÁN</u></p>
                            <div className="mb-4">
                                <Text className='ml-3'>
                                    - Tổng giá trị hợp đồng:{' '}
                                    <b>
                                        {new Intl.NumberFormat('vi-VN').format(contractData?.data.amount)} VND
                                    </b>{' '}
                                    <span className="text-gray-600">
                                        ( {numberToVietnamese(contractData?.data.amount)} )
                                    </span>
                                </Text>
                            </div>
                            <div className=" space-y-4 mb-[40px]">
                                {/* Bảng Hạng mục thanh toán */}
                                <p className=" ml-3 font-bold">
                                    1.  Hạng mục thanh toán
                                </p>
                                <Table
                                    dataSource={contractData?.data.contractItems}
                                    columns={paymentItemsColumns}
                                    rowKey="id"
                                    pagination={false}
                                    bordered
                                />
                                {/* Bảng Giá trị hợp đồng và số lần thanh toán */}

                                <p className=" ml-3 font-bold">
                                    2. Tổng giá trị và số lần thanh toán
                                </p>

                                {contractData?.data?.paymentSchedules &&
                                    contractData?.data.paymentSchedules.length > 0 && (
                                        <>
                                            <Table
                                                dataSource={contractData.data.paymentSchedules}
                                                columns={paymentSchedulesColumns}
                                                rowKey="paymentOrder"
                                                pagination={false}
                                                bordered
                                            />
                                        </>
                                    )}

                            </div>
                            <div>
                                {contractData?.data?.isDateLateChecked && (
                                    <p className="mt-3">
                                        - Trong quá trình thanh toán cho phép trễ hạn tối đa {contractData?.data?.maxDateLate} (ngày)
                                    </p>
                                )}
                                {contractData?.data?.autoAddVAT && (
                                    <p className="mt-3">
                                        - Thuế VAT được tính ({contractData?.data?.vatPercentage}%)
                                    </p>
                                )}
                            </div>
                            <div className="mt-4">
                                <h4 className="font-bold text-lg"><u>THỜI GIAN HIỆU LỰC LIÊN QUAN</u></h4>
                                {contractData?.data?.effectiveDate && contractData?.data?.expiryDate && (
                                    <div className="mt-3">
                                        <p>
                                            - Ngày bắt đầu hiệu lực: {dayjs(parseDate(contractData?.data?.effectiveDate)).format('HH:mm')} ngày <b>{dayjs(parseDate(contractData.data.effectiveDate)).format('DD/MM/YYYY')}</b>
                                        </p>
                                        <p>
                                            - Ngày chấm dứt hiệu lực: {dayjs(parseDate(contractData?.data?.expiryDate)).format('HH:mm')} ngày <b>{dayjs(parseDate(contractData.data.expiryDate)).format('DD/MM/YYYY')}</b>
                                        </p>
                                    </div>
                                )}
                                {contractData?.data?.autoRenew && (
                                    <p className="mt-3">
                                        - Tự động gia hạn khi hợp đồng hết hạn nếu không có phản hồi từ các phía
                                    </p>
                                )}
                                {contractData?.data?.appendixEnabled && (
                                    <p className="mt-3">
                                        - Cho phép tạo phụ lục khi hợp đồng có hiệu lực
                                    </p>
                                )}
                            </div>
                        </div>
                        <div ref={clauseRef} onMouseUp={handleMouseUp} className="mt-2 relative">
                            <h4 className="font-bold text-lg mt-4"><u>CÁC LOẠI ĐIỀU KHOẢN</u></h4>
                            <div className="ml-5 mt-3 flex flex-col gap-3">
                                {groupedTerms.Common.length > 0 && (
                                    <div className="term-group mb-2">
                                        <p className="text-base font-bold">Điều khoản chung</p>
                                        {groupedTerms.Common.map((termId, index) => renderTerm(termId, index))}
                                    </div>
                                )}
                                {groupedTerms.A.length > 0 && (
                                    <div className="term-group mb-2">
                                        <p className="font-bold">Điều khoản riêng bên A</p>
                                        {groupedTerms.A.map((termId, index) => renderTerm(termId, index))}
                                        {contractData?.data?.specialTermsA && contractData?.data?.specialTermsA.trim() !== "" && (
                                            <p className="text-sm">- {contractData?.data?.specialTermsA}</p>
                                        )}
                                    </div>
                                )}
                                {groupedTerms.B.length > 0 && (
                                    <div className="term-group mb-2">
                                        <p className="font-bold">Điều khoản riêng bên B</p>
                                        {groupedTerms.B.map((termId, index) => renderTerm(termId, index))}
                                        {contractData?.data?.specialTermsB && contractData?.data?.specialTermsB.trim() !== "" && (
                                            <p className="text-sm">- {contractData?.data?.specialTermsB}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="mt-4">
                                {(contractData?.data?.appendixEnabled ||
                                    contractData?.data?.transferEnabled ||
                                    contractData?.data?.violate ||
                                    contractData?.data?.suspend) && (
                                        <div>
                                            <h4 className="font-bold text-lg"><u>CÁC THÔNG TIN KHÁC</u></h4>
                                            {contractData?.data?.appendixEnabled && (
                                                <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>
                                            )}
                                            {contractData?.data?.transferEnabled && (
                                                <p className="mt-3">- Cho phép chuyển nhượng hợp đồng</p>
                                            )}
                                            {contractData?.data?.violate && (
                                                <p className="mt-3">
                                                    - Cho phép đơn phương hủy hợp đồng nếu 1 trong 2 vi phạm các quy định trong điều khoản
                                                </p>
                                            )}
                                            {contractData?.data?.suspend && (
                                                <div>
                                                    <p className="mt-3">
                                                        - Cho phép tạm ngưng hợp đồng trong trường hợp bất khả kháng: {contractData.data.suspendContent}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                            </div>

                        </div>
                        {showSearchButton && (
                            <Button
                                type="primary"
                                style={{
                                    position: 'absolute',
                                    left: buttonPosition.x,
                                    top: buttonPosition.y,
                                    zIndex: 1000,
                                }}
                                icon={<IoSearchCircle />}
                                onClick={handleSearch}
                            >
                                Tìm kiếm điều khoản
                            </Button>
                        )}

                    </div>
                </Row>
                <div className="flex justify-center mt-10 items-center pb-24">
                    <div className="flex flex-col gap-2 px-[18%] text-center">
                        <p className="text-lg"><b>ĐẠI DIỆN BÊN A</b></p>
                        <p><b>{contractData?.data?.partnerB.partnerName?.toUpperCase()}</b></p>
                        <i className="text-zinc-600">Ký và ghi rõ họ tên</i>
                    </div>
                    <div className="flex flex-col gap-2 px-[18%] text-center">
                        <p className="text-lg"><b>ĐẠI DIỆN BÊN B</b></p>
                        <p><b>{bsInfor?.representativeName?.toUpperCase()}</b></p>
                        <i className="text-zinc-600">Ký và ghi rõ họ tên</i>
                    </div>
                </div>

            </div>

            <ModalSearch
                searchModalVisible={searchModalVisible}
                setSearchModalVisible={setSearchModalVisible}
                selectedText={selectedText}
                setSelectedText={setSelectedText}
            />
        </div>
    );
};

export default ContractDetail;
