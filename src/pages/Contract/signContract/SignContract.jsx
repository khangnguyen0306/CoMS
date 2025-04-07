import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useGetContractDetailQuery } from '../../../services/ContractAPI';
import dayjs from 'dayjs';
import { Button, Col, Divider, Drawer, Row, Spin, Table, Tabs, Tag, Timeline } from 'antd';
import { numberToVietnamese } from '../../../utils/ConvertMoney';
import { useLazyGetTermDetailQuery } from '../../../services/ClauseAPI';
import { BookOutlined, CheckOutlined, ClockCircleOutlined, CloseOutlined, ForwardOutlined, HistoryOutlined, InfoCircleOutlined, LoadingOutlined, SmallDashOutlined } from '@ant-design/icons';
import AuditrailContract from '../component/AuditrailContract';
import DisplayAppendix from '../../appendix/staff/DisplayAppendix';
import { useGetProcessByContractIdQuery } from '../../../services/ProcessAPI';
import { selectCurrentUser } from '../../../slices/authSlice';
import { useLazyGetDataChangeByDateQuery, useLazyGetDateChangeContractQuery } from '../../../services/AuditTrailAPI';
import { useGetAppendixByContractIdQuery } from '../../../services/AppendixAPI';
import { convert } from 'html-to-text';
import { useFindLocationMutation } from '../../../services/uploadAPI';
import pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";


const SignContract = () => {
    const { contractId } = useParams();
    const { data: contractData, isLoading: loadingDataContract, isSuccess } = useGetContractDetailQuery(contractId);
    const { data: appendixData, isLoading: loadingDataContractAppendix } = useGetAppendixByContractIdQuery({ id: contractId });
    const [fetchDdateAudittrail, { data: auditTrailDate, isLoading: loadingAuditTrailDate }] = useLazyGetDateChangeContractQuery();
    const [fetchTerms] = useLazyGetTermDetailQuery();
    const [fetchDataData] = useLazyGetDataChangeByDateQuery();
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [termsData, setTermsData] = useState({});
    const [loadingTerms, setLoadingTerms] = useState({});
    const [auditTrails, setAuditTrails] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [visible, setVisible] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 20;
    const [groupedTerms, setGroupedTerms] = useState({
        Common: [],
        A: [],
        B: []
    });
    const [groupedTermsExport, setGroupedTermsExport] = useState({
        Common: [],
        A: [],
        B: []
    });
    const user = useSelector(selectCurrentUser);
    const { data: processData, isLoading: loadingDataProcess } = useGetProcessByContractIdQuery({ contractId: contractId });
    const [uploadFilePDF] = useFindLocationMutation();

    const stages = processData?.data?.stages || [];

    const matchingStage = stages.find(stage => stage.approver === user?.id);





    const parseDate = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
        const [year, month, day, hour, minute] = dateArray;
        return new Date(year, month - 1, day, hour, minute);
    };

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
        if (contractData?.data?.legalBasisTerms) {
            contractData?.data?.legalBasisTerms.forEach((termObj) => {
                loadTermDetail(termObj.original_term_id);
            });
        }
    }, [contractData?.data?.legalBasisTerms]);

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

    function convertCreatedAt(createdAtArray) {
        if (!createdAtArray || !Array.isArray(createdAtArray) || createdAtArray.length < 6) {
            return "Không có dữ liệu";
        }
        const [year, month, day, hour, minute, second] = createdAtArray;
        // Tạo đối tượng Date; chú ý tháng phải trừ 1 vì tháng trong JavaScript tính từ 0
        const date = new Date(year, month - 1, day, hour, minute, second);
        return dayjs(date).format("DD-MM-YYYY vào lúc HH:mm:ss");
    }

    const handleTabChange = (key) => {
        if (key === "2") {
            // Reset lại dữ liệu (nếu cần)
            setAuditTrails([]);
            setCurrentPage(1);
            setHasMore(true);
            loadAuditTrailPage(0);
        }
    };

    const onClose = () => {
        setVisible(false);
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
    };

    const loadMoreData = () => {
        if (hasMore && !loadingAuditTrailDate) {
            const nextPage = currentPage + 1;
            setCurrentPage(nextPage);
            loadAuditTrailPage(nextPage);
        }
    };

    const showDrawer = () => {
        setVisible(true);
    };

    const parsedContent = convert(contractData?.data.contractContent, {
        wordwrap: 220,
    });

    useEffect(() => {
        if (contractData?.data?.additionalConfig) {
            const allGrouped = { Common: [], A: [], B: [] };

            Object.values(contractData.data.additionalConfig).forEach((config) => {
                // Group Common terms
                if (config.Common && config.Common.length > 0) {
                    config.Common.forEach((termObj) => {
                        allGrouped.Common.push(termObj.value);
                    });
                }

                // Group A terms
                if (config.A && config.A.length > 0) {
                    config.A.forEach((termObj) => {
                        allGrouped.A.push(termObj.value);
                    });
                }

                // Group B terms
                if (config.B && config.B.length > 0) {
                    config.B.forEach((termObj) => {
                        allGrouped.B.push(termObj.value);
                    });
                }
            });

            // Optionally remove duplicates
            groupedTermsExport.A = [...new Set(allGrouped.A)];
            groupedTermsExport.B = [...new Set(allGrouped.B)];
            groupedTermsExport.Common = [...new Set(allGrouped.Common)];

        }
    }, [contractData?.data]);

    useEffect(() => {
        if (isSuccess && contractData) {
            const docDefinition = {
                content: [
                    { text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", style: "header" },
                    { text: "Độc lập - Tự do - Hạnh phúc", style: "subheader" },
                    { text: "---------oOo---------", style: "subheader" },


                    { text: contractData.data.title.toUpperCase(), style: "contractTitle" },
                    {
                        text: [
                            { text: 'Số: ', style: "subheader" }, { text: contractData.data.contractNumber }
                        ],
                        margin: [0, 10, 0, 15],
                        fontSize: 11
                    },
                    //ccpl
                    ...(contractData.data.legalBasisTerms?.length > 0
                        ? [
                            ...contractData.data.legalBasisTerms.map((item, index) => ({
                                text: [
                                    { text: `- ${item.value}`, italics: true },
                                ],
                                margin: [0, 2, 0, 2],
                                fontSize: 11,
                            }))
                        ]
                        : []),

                    {
                        text: [
                            { text: `Hôm nay, Hợp đồng dịch vụ này được lập vào ngày ${dayjs(parseDate(contractData.data.signingDate)).format("DD")} tháng ${dayjs(parseDate(contractData.data.signingDate)).format("MM")} năm ${dayjs(parseDate(contractData.data.signingDate)).format("YYYY")}, tại ${contractData.data.contractLocation}, bởi và giữa: ` }
                        ],
                        margin: [0, 7, 0, 3],
                        fontSize: 11
                    },
                    // been A
                    { text: "BÊN CUNG CẤP (BÊN A)", style: "titleDescription", decoration: 'underline' },
                    {
                        text: [
                            { text: 'Tên công ty: ', style: "boldtext" }, { text: contractData.data.partnerA.partnerName }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: 'Địa chỉ trụ sở chính: ', style: "boldtext" }, { text: contractData.data.partnerA.partnerAddress }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: 'Người đại diện: ', style: "boldtext" }, { text: contractData.data.partnerA.spokesmanName }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: 'Chức vụ: ', style: "boldtext" }, { text: contractData.data.partnerA.position }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: 'Mã số thuế: ', style: "boldtext" }, { text: contractData.data.partnerA.partnerTaxCode }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: 'Email: ', style: "boldtext" }, { text: contractData.data.partnerA.partnerEmail }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    //Bên B
                    { text: "BÊN SỬ DỤNG (BÊN B)", style: "titleDescription", decoration: 'underline' },
                    {
                        text: [
                            { text: 'Tên công ty: ', style: "boldtext" }, { text: contractData.data.partnerB.partnerName }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: 'Địa chỉ trụ sở chính: ', style: "boldtext" }, { text: contractData.data.partnerB.partnerAddress }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: 'Người đại diện: ', style: "boldtext" }, { text: contractData.data.partnerB.spokesmanName }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: 'Chức vụ: ', style: "boldtext" }, { text: contractData.data.partnerB.position }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: 'Mã số thuế: ', style: "boldtext" }, { text: contractData.data.partnerB.partnerTaxCode }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: 'Email: ', style: "boldtext" }, { text: contractData.data.partnerB.partnerEmail }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: `Sau khi bàn bạc và thống nhất, chúng tôi cùng thỏa thuận ký kết hợp đồng với nội dung và các điều khoản sau:` }
                        ],
                        margin: [0, 9, 0, 9],
                        fontSize: 11
                    },

                    { text: "NỘI DUNG HỢP ĐỒNG", style: "titleDescription", decoration: 'underline' },


                    {
                        text: parsedContent,
                        margin: [0, 7, 0, 0],
                        lineHeight: 0.7,
                        fontSize: 11
                    },

                    // Thanh toán

                    { text: "GIÁ TRỊ VÀ THANH TOÁN", style: "titleDescription", decoration: 'underline', margin: [0, 10, 0, 0] },

                    {
                        text: [
                            { text: `- Tổng giá trị hợp đồng: ${new Intl.NumberFormat('vi-VN').format(contractData?.data.amount)} VND  ` }, { text: `( ${numberToVietnamese(contractData?.data.amount)} )` }
                        ],
                        margin: [5, 9, 0, 9],
                        fontSize: 11
                    },
                    {
                        text: [
                            { text: `1. Hạng mục thanh toán` }
                        ],
                        margin: [0, 9, 0, 9],
                        fontSize: 11,
                        bold: true,
                    },

                    {
                        style: "table",
                        table: {
                            widths: ["auto", "*", "auto"],
                            body: [
                                [
                                    { text: "STT", style: "tableHeader" },
                                    { text: "Nội dung", style: "tableHeader" },
                                    { text: "Số tiền (VND)", style: "tableHeader" },
                                ],
                                ...contractData.data.contractItems.map(item => [
                                    { text: item.itemOrder, style: "tableCell" },
                                    { text: item.description, style: "tableCell" },
                                    { text: new Intl.NumberFormat('vi-VN').format(item.amount), style: "tableCell" },
                                ]),
                            ],
                        },
                        layout: {
                            hLineWidth: function (i, node) {
                                return 1;
                            },
                            vLineWidth: function (i, node) {
                                return 1;
                            },
                            hLineColor: function (i, node) {
                                return 'black';
                            },
                            vLineColor: function (i, node) {
                                return 'black';
                            },
                            paddingLeft: function (i, node) { return 5; },
                            paddingRight: function (i, node) { return 5; },
                            paddingTop: function (i, node) { return 5; },
                            paddingBottom: function (i, node) { return 5; },
                        },
                    },


                    {
                        text: [
                            { text: `2. Tổng giá trị và số lần thanh toán` }
                        ],
                        margin: [0, 9, 0, 9],
                        fontSize: 11,
                        bold: true,
                    },

                    {
                        style: "table",
                        table: {
                            widths: ["auto", "*", "*", "auto"],
                            body: [
                                [
                                    { text: "Đợt", style: "tableHeader" },
                                    { text: "Số tiền (VND)", style: "tableHeader" },
                                    { text: "Ngày thanh toán", style: "tableHeader" },
                                    { text: "Phương thức thanh toán", style: "tableHeader" },
                                ],
                                ...contractData.data.paymentSchedules.map(item => [
                                    { text: item.paymentOrder, style: "tableCell" },
                                    { text: item.amount, style: "tableCell" },
                                    { text: `Ngày ${dayjs(parseDate(item.paymentDate)).format("DD")} tháng ${dayjs(parseDate(item.paymentDate)).format("MM")} năm ${dayjs(parseDate(item.paymentDate)).format("YYYY")}`, style: "tableCell" },
                                    {
                                        text: item.paymentMethod === 'cash'
                                            ? 'Tiền mặt'
                                            : item.paymentMethod === 'creditCard'
                                                ? 'Thẻ tín dụng'
                                                : 'Chuyển khoản', style: "tableCell"
                                    },
                                ]),
                            ],
                        },
                        layout: {
                            hLineWidth: function (i, node) {
                                return 1;
                            },
                            vLineWidth: function (i, node) {
                                return 1;
                            },
                            hLineColor: function (i, node) {
                                return 'black';
                            },
                            vLineColor: function (i, node) {
                                return 'black';
                            },
                            paddingLeft: function (i, node) { return 5; },
                            paddingRight: function (i, node) { return 5; },
                            paddingTop: function (i, node) { return 5; },
                            paddingBottom: function (i, node) { return 5; },
                        },
                    },
                    {
                        text: [
                            contractData?.data?.isDateLateChecked &&
                            `- Trong quá trình thanh toán cho phép trễ hạn tối đa ${contractData?.data?.maxDateLate} (ngày)\n`,

                            contractData?.data?.autoAddVAT &&
                            `- Thuế VAT được tính (${contractData?.data?.vatPercentage}%)\n`
                        ].filter(Boolean),
                        margin: [0, 10, 0, 10],
                        fontSize: 11,
                    },

                    {
                        text: "THỜI GIAN HIỆU LỰC LIÊN QUAN",
                        style: "titleDescription",
                        decoration: 'underline',
                        margin: [0, 10, 0, 10],
                    },
                    contractData?.data?.effectiveDate && contractData?.data?.expiryDate && {
                        margin: [0, 5, 0, 5],
                        text: [
                            `- Ngày bắt đầu hiệu lực: ${dayjs(parseDate(contractData?.data?.effectiveDate)).format('HH:mm')} ngày `,
                            { text: dayjs(parseDate(contractData.data.effectiveDate)).format('DD/MM/YYYY'), bold: true },
                            `\n- Ngày chấm dứt hiệu lực: ${dayjs(parseDate(contractData?.data?.expiryDate)).format('HH:mm')} ngày `,
                            { text: dayjs(parseDate(contractData.data.expiryDate)).format('DD/MM/YYYY'), bold: true },
                        ],
                    },
                    ...[
                        contractData?.data?.autoRenew === true && {
                            text: "- Tự động gia hạn khi hợp đồng hết hạn nếu không có phản hồi từ các phía",
                            margin: [0, 5, 0, 5],
                            fontSize: 11
                        },
                        contractData?.data?.appendixEnabled === true && {
                            text: "- Cho phép tạo phụ lục khi hợp đồng có hiệu lực",
                            margin: [0, 5, 0, 5],
                            fontSize: 11
                        }
                    ].filter(Boolean),
                    //Điều khoản 

                    {
                        text: "CÁC LOẠI ĐIỀU KHOẢN",
                        style: "titleDescription",
                        decoration: 'underline',
                        margin: [0, 10, 0, 10],
                    },
                    {
                        margin: [0, 5, 0, 5],
                        columns: [
                            {
                                width: '*',
                                stack: [
                                    groupedTermsExport.Common.length > 0 && {
                                        text: "Điều khoản chung",
                                        style: "titleDescription",
                                        margin: [5, 8],
                                    },
                                    ...groupedTermsExport.Common.map((termId, index) => ({
                                        text: `- ${termId}`,
                                        margin: [5, 2],
                                    })),
                                    groupedTermsExport.A.length > 0 && {
                                        text: "Điều khoản riêng bên A",
                                        style: "titleDescription",
                                        margin: [5, 5],
                                    },
                                    ...groupedTermsExport.A.map((termId, index) => ({
                                        text: `- ${termId}`,
                                        margin: [5, 2],
                                    })),


                                    contractData?.data?.specialTermsA && contractData?.data?.specialTermsA.trim() !== "" && {
                                        text: `- ${contractData?.data?.specialTermsA}`,
                                        margin: [5, 2],
                                    },
                                    groupedTermsExport.B.length > 0 && {
                                        text: "Điều khoản riêng bên B",
                                        style: "titleDescription",
                                        margin: [5, 8],
                                    },
                                    ...groupedTermsExport.B.map((termId, index) => ({
                                        text: `- ${termId}`,
                                        margin: [5, 2],
                                    })),
                                    contractData?.data?.specialTermsB && contractData?.data?.specialTermsB.trim() !== "" && {
                                        text: `- ${contractData?.data?.specialTermsB}`,
                                        margin: [5, 2],
                                    },
                                ].filter(Boolean),
                            },
                        ],
                    },
                    (contractData?.data?.appendixEnabled ||
                        contractData?.data?.transferEnabled ||
                        contractData?.data?.violate ||
                        contractData?.data?.suspend) ? [
                        {
                            text: "CÁC THÔNG TIN KHÁC",
                            style: "titleDescription",
                            decoration: 'underline',
                            margin: [0, 10, 0, 10],
                        },
                        {
                            stack: [
                                contractData?.data?.appendixEnabled && {
                                    text: "- Cho phép tạo phụ lục khi hợp đồng có hiệu lực",
                                    margin: [0, 3, 0, 3],
                                    fontSize: 11,
                                },
                                contractData?.data?.transferEnabled && {
                                    text: "- Cho phép chuyển nhượng hợp đồng",
                                    margin: [0, 3, 0, 3],
                                    fontSize: 11,
                                },
                                contractData?.data?.violate && {
                                    text: "- Cho phép đơn phương hủy hợp đồng nếu 1 trong 2 vi phạm các quy định trong điều khoản",
                                    margin: [0, 3, 0, 3],
                                    fontSize: 11,
                                },
                                contractData?.data?.suspend && {
                                    text: `- Cho phép tạm ngưng hợp đồng trong trường hợp bất khả kháng: ${contractData?.data?.suspendContent}`,
                                    margin: [0, 3, 0, 3],
                                    fontSize: 11,
                                },
                            ].filter(Boolean),
                        },
                    ] : [],
                    {
                        columns: [
                            {
                                width: '*',
                                stack: [
                                    { text: "ĐẠI DIỆN BÊN A", style: "signatureTitle" },
                                    { text: contractData.data.partnerA.partnerName.toUpperCase(), style: "signatureName", bold: true },
                                    { text: "Ký và ghi rõ họ tên", style: "signatureNote" }
                                ],
                                alignment: 'center'
                            },
                            {
                                width: '*',
                                stack: [
                                    { text: "ĐẠI DIỆN BÊN B", style: "signatureTitle" },
                                    { text: contractData.data.partnerB.partnerName.toUpperCase(), style: "signatureName", bold: true },
                                    { text: "Ký và ghi rõ họ tên", style: "signatureNote" }
                                ],
                                alignment: 'center'
                            }
                        ],
                        margin: [0, 30, 0, 0]
                    },
                ],

                styles: {
                    header: {
                        fontSize: 15,
                        bold: true,
                        alignment: "center",
                        margin: [0, 0, 0, 10],
                    },
                    subheader: {
                        fontSize: 13,
                        bold: true,
                        alignment: "center",
                        margin: [0, 0, 0, 10],
                    },
                    contractTitle: {
                        fontSize: 19,
                        bold: true,
                        alignment: "center",
                        margin: [0, 0, 0, 10],
                    },

                    legal: {

                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 12,
                        color: 'black',
                        fillColor: '#f0f0f0',
                        // alignment: 'center',
                        margin: [5, 5, 5, 5],

                    },
                    tableCell: {
                        fontSize: 11,
                        margin: [7, 5, 5, 5],
                    },
                    boldtext: {
                        bold: true,
                        fontSize: 11,
                    },
                    titleDescription: {
                        bold: true,
                        fontSize: 14,
                        margin: [0, 10, 0, 5],
                    }
                },
                signatureTitle: {
                    fontSize: 16,
                    bold: true,
                    margin: [0, 0, 0, 5]
                },
                signatureName: {
                    fontSize: 14,
                    bold: true,
                    margin: [0, 0, 0, 5]
                },
                signatureNote: {
                    fontSize: 11,
                    color: '#666666',
                    fontStyle: 'italic'
                },

                defaultStyle: {
                    font: "Roboto",
                },
            };

            pdfMake.createPdf(docDefinition).getBlob((blob) => {
                const file = new File([blob], "document.pdf", { type: "application/pdf" }); 
                uploadFilePDF({ file })
                    .then((response) => {
                        console.log("Upload thành công:", response);
                    })
                    .catch((error) => {
                        console.error("Lỗi khi upload:", error);
                    });
            });
        }
        
    }, [isSuccess, contractData]);

    return (
        <div className={`${isDarkMode ? 'bg-[#222222] text-white' : 'bg-gray-100'} w-[80%] justify-self-center   shadow-md p-4 pb-16 rounded-md`}>
            <Button type='link' onClick={showDrawer}>
                <InfoCircleOutlined style={{ fontSize: 30 }} /> Thông tin hợp đồng
            </Button>
            <Drawer
                title="Thông tin chi tiết"
                placement="right"
                onClose={onClose}
                open={visible}
                width={500}
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
                                            processData?.data?.stages.map((stage) => (
                                                <Timeline.Item
                                                    key={stage.id}
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
                        <Tabs.TabPane tab="Phụ Lục Hợp Đồng" key="3">
                            <div className="flex flex-col">
                                {/* <h3 className="text-lg font-bold">Danh sách phụ lục:</h3> */}
                                <DisplayAppendix appendices={appendixData?.data} />
                            </div>
                        </Tabs.TabPane>
                    )}
                </Tabs>
            </Drawer>

            <div className="text-center mt-9">
                <p className="font-bold text-xl pt-8">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-lg mt-2">Độc lập - Tự do - Hạnh phúc</p>
                <p>---------oOo---------</p>
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
                            <p className='ml-3'>
                                - Tổng giá trị hợp đồng:{' '}
                                <b>
                                    {new Intl.NumberFormat('vi-VN').format(contractData?.data.amount)} VND
                                </b>{' '}
                                <span className="text-gray-600">
                                    ( {numberToVietnamese(contractData?.data.amount)} )
                                </span>
                            </p>
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
                    <div className="mt-2 relative">
                        <h4 className="font-bold text-lg mt-4"><u>CÁC LOẠI ĐIỀU KHOẢN</u></h4>
                        <div className="ml-5 mt-3 flex flex-col gap-3">
                            {groupedTermsExport.Common.length > 0 && (
                                <div className="term-group mb-2">
                                    <p className="text-base font-bold">Điều khoản chung</p>
                                    {groupedTermsExport.Common.map((termId, index) => renderTerm(termId, index))}
                                </div>
                            )}
                            {groupedTermsExport.A.length > 0 && (
                                <div className="term-group mb-2">
                                    <p className="font-bold">Điều khoản riêng bên A</p>
                                    {groupedTermsExport.A.map((termId, index) => renderTerm(termId, index))}
                                    {contractData?.data?.specialTermsA && contractData?.data?.specialTermsA.trim() !== "" && (
                                        <p className="text-sm">- {contractData?.data?.specialTermsA}</p>
                                    )}
                                </div>
                            )}
                            {groupedTermsExport.B.length > 0 && (
                                <div className="term-group mb-2">
                                    <p className="font-bold">Điều khoản riêng bên B</p>
                                    {groupedTermsExport.B.map((termId, index) => renderTerm(termId, index))}
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

                </div>
            </Row>
            <div className="flex justify-center mt-10 items-center pb-24">
                <div className="flex flex-col gap-2 px-[18%] text-center">
                    <p className="text-lg"><b>ĐẠI DIỆN BÊN A</b></p>
                    <p><b>{contractData?.data?.partnerA.partnerName?.toUpperCase()}</b></p>
                    <i className="text-zinc-600">Ký và ghi rõ họ tên</i>
                </div>
                <div className="flex flex-col gap-2 px-[18%] text-center">
                    <p className="text-lg"><b>ĐẠI DIỆN BÊN B</b></p>
                    <p><b>{contractData?.data?.partnerB.partnerName?.toUpperCase()}</b></p>
                    <i className="text-zinc-600">Ký và ghi rõ họ tên</i>
                </div>
            </div>

        </div>
    )
}

export default SignContract