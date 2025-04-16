import { CheckOutlined, ClockCircleOutlined, CloseOutlined, ForwardOutlined, InfoCircleOutlined, LoadingOutlined, RollbackOutlined, SmallDashOutlined } from '@ant-design/icons';
import { Button, Collapse, Radio, Form, Input, Space, Row, Col, Checkbox, Image, Skeleton, Card, Timeline, Tag, message, Breadcrumb, Table, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ApIcon from '../../assets/Image/appendix.svg'
import { useApproveAppendixMutation, useGetAppendixDetailQuery, useGetWorkFlowByAppendixIdQuery, useRejectAppendixMutation } from '../../services/AppendixAPI';
import { selectCurrentUser } from '../../slices/authSlice';
import { useSelector } from 'react-redux';
import { useLazyGetTermDetailQuery } from '../../services/ClauseAPI';
const { Panel } = Collapse;

const AppendixDetail = () => {
    const { appendixId, contractId } = useParams()
    const navigate = useNavigate();
    const [approvalChoice, setApprovalChoice] = useState(null);
    const [reason, setReason] = useState('');
    const [isApproved, setIsApproved] = useState(false);
    const [termsData, setTermsData] = useState({});
    const [loadingTerms, setLoadingTerms] = useState({});
    const [groupedTerms, setGroupedTerms] = useState({
        Common: [],
        A: [],
        B: []
    });
    const { data: appendixData, isLoading: isLoadingAppendix, isError: isErrorAppendix } = useGetAppendixDetailQuery({ id: appendixId })
    const { data: dataAppendixProcess, isLoading: isLoadingAppendixProcess, isError: isErrorAppendixProcess } = useGetWorkFlowByAppendixIdQuery(
        { appendixId },
        { skip: !appendixId }
    );
    const user = useSelector(selectCurrentUser);
    const stages = dataAppendixProcess?.data?.stages || [];
    const matchingStage = stages.find(stage => stage.approver === user?.id);
    const StageIdMatching = matchingStage?.stageId;
    const userApproval = dataAppendixProcess?.data.stages.find(stage => stage.approver === user?.id && (stage.status === "APPROVED"));
    const userCreate = appendixData?.data.createdBy.userId == user?.id;

    const [rejectProcess, { isLoading: rejectLoading }] = useRejectAppendixMutation();
    const [approveProcess, { isLoading: approveLoading }] = useApproveAppendixMutation();
    const [fetchTerms] = useLazyGetTermDetailQuery();
    // Xử lý khi thay đổi lựa chọn radio
    const handleApprovalChange = (e) => {
        setApprovalChoice(e.target.value);
        setIsApproved(null)
    };

    // Xử lý khi xác nhận phê duyệt
    const handleConfirmApproval = async () => {
        try {
            const result = await approveProcess({ appendixId: appendixId, stageId: StageIdMatching }).unwrap();
            if (result.status === "OK") {
                message.success("Đã đồng ý phê duyệt thành công!");
                if (user?.roles?.includes("ROLE_STAFF")) {
                    navigate(`/appendix`);
                } else if (user?.roles?.includes("ROLE_MANAGER")) {
                    navigate(`/manager/appendix`);
                } else if (user?.roles?.includes("ROLE_DIRECTOR")) {
                    navigate(`/director/appendix?paramstatus=CREATED`);
                }
                setIsApproved(true);
            }
        } catch (error) {
            console.log(error);
            message.error(error?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
        }
    };


    const handleReject = async () => {
        try {
            await rejectProcess({ comment: reason, appendixId: appendixId, stageId: StageIdMatching }).unwrap();
            message.success("Đã từ chối phê duyệt và gửi nhận xét thành công!");
            setReason('')
            if (user?.roles?.includes("ROLE_STAFF")) {
                navigate(`/appendix`);
            } else if (user?.roles?.includes("ROLE_MANAGER")) {
                navigate(`/manager/appendix`);
            }
        } catch (error) {
            console.log(error);
            message.error(error?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
        }
    };

    const arrayToDate = (arr) => {
        if (!Array.isArray(arr) || arr.length < 3) {
            return new Date();
        }
        const year = arr[0];
        const month = arr[1] ? arr[1] - 1 : 0;
        const day = arr[2] || 0;
        const hours = arr[3] || 0;
        const minutes = arr[4] || 0;
        const seconds = arr[5] || 0;
        return new Date(year, month, day, hours, minutes, seconds);
    };

    // Hàm định dạng ngày thành chuỗi DD/MM/YYYY HH:mm:ss
    const formatDate = (dateArray) => {
        const date = arrayToDate(dateArray);
        return date instanceof Date && !isNaN(date)
            ? date.toLocaleString('en-GB', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })
            : "Invalid date";
    };
    const displayDate = (dateArray) => {
        return (
            <p className='ml-1'> Ngày {dateArray[2]} tháng {dateArray[1]} năm {dateArray[0]} </p>
        )
    };

    const contractItemsColumns = [
        { title: 'Số thứ tự', dataIndex: 'itemOrder', key: 'itemOrder' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (amount) => `${amount.toLocaleString()} VND` },
    ];

    const contractItemsDataSource = appendixData?.data.contractItems.map(item => ({
        key: item.id,
        description: item.description,
        itemOrder: item.itemOrder,
        amount: item.amount,
    }));

    const paymentSchedulesColumns = [
        { title: 'Thứ tự thanh toán', dataIndex: 'paymentOrder', key: 'paymentOrder' },
        { title: 'Số tiền', dataIndex: 'amount', key: 'amount', render: (amount) => `${amount.toLocaleString()} VND` },
        {
            title: 'Ngày thanh toán', dataIndex: 'paymentDate', key: 'paymentDate', render: (dateArray) => {
                if (!dateArray || dateArray.length < 5) return 'Invalid date';
                const [year, month, day, hour, minute] = dateArray;
                const date = new Date(year, month - 1, day, hour, minute);
                return date.toLocaleDateString('vi-VN');
            }
        },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (status) =>
                status == "PAID" ?
                    <Tag color='green-inverse'>Đã thanh toán</Tag> :
                    <Tag color='orange'>Chưa thanh toán</Tag>
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

    // const displayPaymentMethod = {
    //     'creditCard':"Thẻ tín dụng",
    //     'cash':"Tiền mặt",
    //     ''
    // }
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
    useEffect(() => {
        if (appendixData?.data?.additionalConfig) {
            const allGrouped = { Common: [], A: [], B: [] };
            // additionalConfig là object với các key (ví dụ: "1") chứa object với mảng Common, A, B
            Object.values(appendixData?.data?.additionalConfig).forEach((config) => {
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
                appendixData?.data?.additional_terms?.map((termObj) => termObj.original_term_id) || [];
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
    }, [appendixData?.data]);

    const paymentSchedulesDataSource = appendixData?.data.paymentSchedules.map(schedule => ({
        key: schedule.id,
        paymentOrder: schedule.paymentOrder,
        amount: schedule.amount,
        paymentDate: schedule.paymentDate,
        status: schedule.status,
        paymentMethod: schedule.paymentMethod,
    }));

    if (isLoadingAppendix) {
        return (
            <div className='flex justify-center items-center w-full h-full'>
                <Skeleton />
            </div>
        )
    }
    return (
        <Row gutter={16} className='min-h-[100vh]'>

            <Col span={17} className=" rounded-lg ">
                <div>
                    <Breadcrumb
                        className='p-5'
                        items={[
                            {
                                title: <Link to={user.roles[0] == "ROLE_STAFF" ? "/appendix" : "/manager/appendixFull"} >Quản lý phụ lục</Link>,
                            },
                            {
                                title: <p className='font-bold'>{appendixData?.data.title}</p>,
                            },
                        ]}
                    />
                </div>
                <div className="text-center mb-10">
                    <p
                        className="font-bold text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-green-500 mt-10"
                        style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)' }}
                    >
                        {appendixData?.data.title}
                    </p>

                </div>

                {/* I. Thông tin chung */}
                <div className='ml-[50px]'>
                    <div className="mb-6 ml-2">
                        <h2 className="text-xl font-semibold ">I. Thông tin chung</h2>
                        <Button
                            type="link"
                            className="my-4 ml-[-17px] mb-7"
                            onClick={() => navigate((user?.roles[0] === "ROLE_STAFF" || user.roles[0] === "ROLE_DIRECTOR") ? `/contractDetail/${contractId}` : `/manager/contractDetail/${contractId}`)}
                        >
                            <Image preview={false} width={30} height={30} src={ApIcon} />
                            <span className='font-bold text-base'>Xem hợp đồng sử dụng phụ lục </span>
                        </Button>
                        <div className='flex flex-col gap-2'>
                            {/* <p className=""><b>Tên phụ lục</b> {appendixData?.data.title}</p> */}
                            <p className=""><b>Mã hợp đồng:</b> {appendixData?.data.contractNumber}</p>
                            <p className=""><b>Người tạo:</b> {appendixData?.data.createdBy?.userName}</p>
                            <p className=""><b>Ngày tạo:</b>  {formatDate(appendixData?.data?.createdAt)}</p>
                            <p className=""><b>Ngày có hiệu lực:</b>  {formatDate(appendixData?.data?.effectiveDate)}</p>
                        </div>
                    </div>

                    {/* II. Nội dung phụ lục */}
                    <div className="p-4">
                        <h2 className="text-xl font-semibold mb-4">II. Nội dung phụ lục</h2>
                        <div className="text-center mt-9 mb-10">
                            <p className="font-bold text-xl pt-8">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                            <p className="font-bold text-lg mt-2">Độc lập - Tự do - Hạnh phúc</p>
                            <p>---------oOo---------</p>
                            <p className="text-lg font-bold mt-5">
                                {appendixData?.data.title ? appendixData?.data.title.toUpperCase() : ''}
                            </p>
                            <p className="mt-3 text-base">
                                (Đính kèm Hợp đồng số  {appendixData?.data.contractNumber})
                            </p>

                        </div>

                        <p>Phụ lục này có sự tham gia giữa 2 bên: </p>
                        <Row gutter={16} className="flex flex-col mt-3 gap-5 mb-5" justify="center">
                            <Col className="flex flex-col gap-2" md={10} sm={24}>
                                <p className="font-bold text-lg"><u>BÊN CUNG CẤP (BÊN A)</u></p>
                                <p className="text-sm"><b>Tên công ty:</b> {appendixData?.data.partnerA.partnerName}</p>
                                <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {appendixData?.data.partnerA.partnerAddress}</p>
                                <p className="text-sm"><b>Người đại diện:</b> {appendixData?.data.partnerA.spokesmanName}</p>
                                <p className="text-sm"><b>Chức vụ:</b> {appendixData?.data.partnerA.position}</p>
                                <p className="text-sm"><b>Mã số thuế:</b> {appendixData?.data.partnerA.partnerTaxCode}</p>
                                <p className="text-sm"><b>Email:</b> {appendixData?.data.partnerA.partnerEmail}</p>
                            </Col>
                            <Col className="flex flex-col gap-2" md={10} sm={24}>
                                <p className="font-bold text-lg"><u>BÊN CUNG CẤP (BÊN A)</u></p>
                                <p className="text-sm"><b>Tên công ty:</b> {appendixData?.data.partnerB.partnerName}</p>
                                <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {appendixData?.data.partnerB.partnerAddress}</p>
                                <p className="text-sm"><b>Người đại diện:</b> {appendixData?.data.partnerB.spokesmanName}</p>
                                <p className="text-sm"><b>Chức vụ:</b> {appendixData?.data.partnerB.position}</p>
                                <p className="text-sm"><b>Mã số thuế:</b> {appendixData?.data.partnerB.partnerTaxCode}</p>
                                <p className="text-sm"><b>Email:</b> {appendixData?.data.partnerB.partnerEmail}</p>
                            </Col>
                        </Row>
                        <div>
                            <div className='flex flex-col gap-1 mb-5'>
                                <p><b>ĐIỀU KHOẢN PHỤ LỤC</b></p>
                                <p> - Phụ lục này là một phần không thể tách rời của hợp đồng số {appendixData?.data.contractNumber}.</p>
                                <p>  - Các điều khoản khác của Hợp đồng không bị điều chỉnh bởi Phụ lục này vẫn giữ nguyên hiệu lực.</p>
                            </div>

                        </div>
                        {appendixData?.data.content && (
                            <>
                                <p>Hai bên đồng ý thanh lý hợp đồng với nội dung như sau: </p>
                                <div className="ml-2" dangerouslySetInnerHTML={{ __html: appendixData?.data.content || "Chưa nhập" }} />
                            </>
                        )}
                        {appendixData?.data.extendContractDate && appendixData?.data.contractExpirationDate && (
                            <div className='flex flex-col w-full mb-5'>
                                <p>Thời gian hiệu lực hợp đồng: </p>
                                <p className='w-full flex gap-1'> Từ <b>{displayDate(appendixData?.data.extendContractDate)} </b>đến  <b>{displayDate(appendixData?.data.contractExpirationDate)}</b> </p>
                            </div>
                        )}
                        {appendixData?.data.contractItems && appendixData?.data.contractItems.length > 0 && (
                            <Card title="Hạng mục thanh toán" className="ml-[-10px] mb-4" style={{ backgroundColor: '#f4f4f4' }}>
                                <Table
                                    dataSource={contractItemsDataSource}
                                    columns={contractItemsColumns}
                                    pagination={false}
                                />
                            </Card>
                        )}

                        {appendixData?.data.paymentSchedules && appendixData?.data.paymentSchedules.length > 0 && (
                            <Card title="Đợt thanh toán" className="ml-[-10px] mb-4" style={{ backgroundColor: '#f4f4f4' }}>
                                <Table
                                    dataSource={paymentSchedulesDataSource}
                                    columns={paymentSchedulesColumns}
                                    pagination={false}
                                />
                            </Card>
                        )}
                        {appendixData?.data.additionalConfig && appendixData?.data.additionalConfig && (
                            <div className="mt-2 relative">
                                <h4 className="font-bold text-lg mt-4"><u>CÁC LOẠI ĐIỀU KHOẢN</u></h4>
                                <div className="ml-5 mt-3 flex flex-col gap-3">
                                    {groupedTerms.Common.length > 0 && (
                                        <div className="term-group mb-2">
                                            <p className="text-base font-bold">Điều khoản chung </p>
                                            {groupedTerms.Common.map((termId, index) => renderTerm(termId, index))}
                                        </div>
                                    )}
                                    {groupedTerms.A.length > 0 && (
                                        <div className="term-group mb-2">
                                            <p className="font-bold">Điều khoản riêng bên A</p>
                                            {groupedTerms.A.map((termId, index) => renderTerm(termId, index))}
                                            {appendixData?.data?.specialTermsA && appendixData?.data?.specialTermsA.trim() !== "" && (
                                                <p className="text-sm">- {appendixData?.data?.specialTermsA}</p>
                                            )}
                                        </div>
                                    )}
                                    {groupedTerms.B.length > 0 && (
                                        <div className="term-group mb-2">
                                            <p className="font-bold">Điều khoản riêng bên B</p>
                                            {groupedTerms.B.map((termId, index) => renderTerm(termId, index))}
                                            {appendixData?.data?.specialTermsB && appendixData?.data?.specialTermsB.trim() !== "" && (
                                                <p className="text-sm">- {appendixData?.data?.specialTermsB}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* <div className="mt-4">
                                    {(appendixData?.data?.appendixEnabled ||
                                        appendixData?.data?.transferEnabled ||
                                        appendixData?.data?.violate ||
                                        appendixData?.data?.suspend) && (
                                            <div>
                                                <h4 className="font-bold text-lg"><u>CÁC THÔNG TIN KHÁC</u></h4>
                                                {appendixData?.data?.appendixEnabled && (
                                                    <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>
                                                )}
                                                {appendixData?.data?.transferEnabled && (
                                                    <p className="mt-3">- Cho phép chuyển nhượng hợp đồng</p>
                                                )}
                                                {appendixData?.data?.violate && (
                                                    <p className="mt-3">
                                                        - Cho phép đơn phương hủy hợp đồng nếu 1 trong 2 vi phạm các quy định trong điều khoản
                                                    </p>
                                                )}
                                                {appendixData?.data?.suspend && (
                                                    <div>
                                                        <p className="mt-3">
                                                            - Cho phép tạm ngưng hợp đồng trong trường hợp bất khả kháng: {appendixData.data.suspendContent}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                </div> */}

                            </div>
                        )}



                    </div>

                </div>
                <div className="flex justify-center mt-10 items-center pb-24">
                    <div className="flex flex-col gap-2 px-[10%] text-center">
                        <p className="text-lg"><b>ĐẠI DIỆN BÊN A</b></p>
                        <p><b>{appendixData?.data?.partnerB.partnerName?.toUpperCase()}</b></p>
                        <i className="text-zinc-600">Ký và ghi rõ họ tên</i>
                    </div>
                    <div className="flex flex-col gap-2 px-[10%] text-center">
                        <p className="text-lg"><b>ĐẠI DIỆN BÊN B</b></p>
                        <p><b>{appendixData?.data?.partnerB.partnerName?.toUpperCase()}</b></p>
                        <i className="text-zinc-600">Ký và ghi rõ họ tên</i>
                    </div>
                </div>
            </Col>

            {/* Cột bên phải - Fixed */}
            {stages.length != 0 && (
                <Col span={7}>
                    <div
                        className=" p-4 rounded-lg shadow-md border"
                        style={{
                            position: 'fixed',
                            right: '45px',
                            top: '100px',
                            minWidth: '400px',
                            width: 'fit-content',
                            maxHeight: 'calc(100vh - 32px)',
                            overflowY: 'auto',
                        }}
                    >
                        {/* 1. Thông tin phê duyệt */}
                        <div>
                            <h3 className="text-lg font-semibold mt-2 ml-1">1. Thông tin phê duyệt</h3>
                            <div
                                style={{
                                    padding: "7px",
                                }}
                            >
                                <Timeline mode="left" className=" mt-5">
                                    {stages?.map((stage) => (
                                        <Timeline.Item
                                            children={
                                                <div className="min-h-[50px]">
                                                    {stage.approverName}
                                                </div>
                                            }
                                            label={
                                                <div className="w-full">
                                                    {
                                                        stage.status === "APPROVING"
                                                            ? <div className="flex flex-col justify-center items-center">
                                                                <p className="text-[12px]">
                                                                </p>
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
                                                                :
                                                                <div className="flex flex-col justify-center items-center">
                                                                    <Tag color="default" className="w-fit mr-0">Chưa bắt đầu</Tag>
                                                                </div>
                                                    }
                                                </div>
                                            }
                                            dot={
                                                stage.status === "APPROVING" ? (
                                                    <LoadingOutlined spin className="timeline-clock-icon" />
                                                ) : stage.status === "APPROVED" ? (
                                                    <CheckOutlined className="timeline-clock-icon" style={{ color: 'green' }} />
                                                ) : stage.status === "REJECTED" ? (
                                                    <CloseOutlined className="timeline-clock-icon" style={{ color: 'red' }} />
                                                ) : stage.status === "SKIPPED" ? (
                                                    <ForwardOutlined className="timeline-clock-icon" style={{ color: 'orange' }} />
                                                ) : stage.status === "APPROVAL_PENDING" ? (
                                                    <InfoCircleOutlined style={{ color: 'gray' }} />
                                                ) : (
                                                    <InfoCircleOutlined />
                                                )

                                            }
                                        >
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            </div>
                        </div>

                        {/* Collapse phê duyệt */}
                        {!userApproval && (
                            !userCreate && (
                                <Collapse>
                                    <Panel header="Phê duyệt" key="1">
                                        <Radio.Group onChange={handleApprovalChange} value={approvalChoice}>
                                            <Space direction="vertical">
                                                <Radio value="approve">Đồng ý phê duyệt</Radio>
                                                <Radio value="reject">Không đồng ý</Radio>
                                            </Space>
                                        </Radio.Group>

                                        {/* Nếu chọn Đồng ý phê duyệt */}
                                        {approvalChoice === 'approve' && (
                                            <div className="mt-4 flex flex-col">
                                                <Checkbox
                                                    onChange={(e) => setIsApproved(e.target.checked)}
                                                    disabled={isApproved}
                                                >
                                                    Tôi đã đọc kỹ phụ lục và phê duyệt
                                                </Checkbox>
                                                {isApproved && (
                                                    <Button
                                                        type="primary"
                                                        onClick={handleConfirmApproval}
                                                        className="mt-2"
                                                        loading={approveLoading}
                                                    >
                                                        Phê duyệt
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {/* Nếu chọn Không đồng ý */}
                                        {approvalChoice === 'reject' && (
                                            <Form className="mt-4 flex flex-col">
                                                <Form.Item >
                                                    <Input.TextArea
                                                        rows={7}
                                                        value={reason}
                                                        onChange={(e) => setReason(e.target.value)}
                                                        placeholder="Nhập lý do từ chối"
                                                        style={{
                                                            overflow: 'hidden',
                                                            overflowY: 'auto',
                                                            scrollbarWidth: 'none'
                                                        }}
                                                    />
                                                </Form.Item>
                                                <Form.Item >
                                                    <Button
                                                        type="primary"
                                                        danger
                                                        onClick={handleReject}
                                                        disabled={!reason}
                                                        loading={rejectLoading}
                                                    >
                                                        Từ chối phê duyệt
                                                    </Button>
                                                </Form.Item>
                                            </Form>
                                        )}
                                    </Panel>
                                </Collapse>
                            )
                        )}
                    </div>
                </Col>
            )}
        </Row>

    );
};

export default AppendixDetail;