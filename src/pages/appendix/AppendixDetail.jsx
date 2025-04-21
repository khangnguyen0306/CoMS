import { CheckCircleFilled, CheckOutlined, ClockCircleOutlined, CloseOutlined, ForwardOutlined, InfoCircleOutlined, LoadingOutlined, RollbackOutlined, SmallDashOutlined } from '@ant-design/icons';
import { Button, Collapse, Radio, Form, Input, Space, Row, Col, Checkbox, Image, Skeleton, Card, Timeline, Tag, message, Breadcrumb, Table, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ApIcon from '../../assets/Image/appendix.svg'
import { useApproveAppendixMutation, useGetAppendixDetailQuery, useGetWorkFlowByAppendixIdQuery, useRejectAppendixMutation, useUploadAppendixAlreadySignedMutation, useUploadAppendixOnlineSignedMutation } from '../../services/AppendixAPI';
import { selectCurrentToken, selectCurrentUser } from '../../slices/authSlice';
import { useSelector } from 'react-redux';
import { useLazyGetTermDetailQuery } from '../../services/ClauseAPI';
import { convert } from 'html-to-text';
import pdfMake from "pdfmake/build/pdfmake";
import dayjs from 'dayjs';
import { useFindLocationMutation, useUploadAppenixToSignMutation } from '../../services/uploadAPI';
import { FaPenNib } from 'react-icons/fa6';
import { useUploadContractAlreadySignedMutation } from '../../services/ContractAPI';
import { DataToSign } from '../../utils/DataToSign';
import { AuthenSignContractOnline } from '../Contract/signContract/AuthenSignOnlineContract';

const { Panel } = Collapse;

const AppendixDetail = () => {
    const { appendixId, contractId } = useParams()
    const navigate = useNavigate();
    const [approvalChoice, setApprovalChoice] = useState(null);
    const [reason, setReason] = useState('');
    const [isApproved, setIsApproved] = useState(false);
    const [loadingCreateFile, setLoadingCreateFile] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(null);
    const [dataToSign, setDataToSign] = useState({
        llx: null,
        lly: null,
        urx: null,
        ury: null,
        FileType: 'PDF',
        FileName: '',
        page: null,
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [isConfirmed, setIsConfirmed] = useState(false)
    const [hubProxy, setHubProxy] = useState(null);
    const [connection, setConnection] = useState(null);
    const [termsData, setTermsData] = useState({});
    const [loadingTerms, setLoadingTerms] = useState({});
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
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
    const { data: appendixData, isLoading: isLoadingAppendix, isError: isErrorAppendix, refetch } = useGetAppendixDetailQuery(
        { id: appendixId },
        {
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true,
        }
    )
    const { data: dataAppendixProcess, isLoading: isLoadingAppendixProcess, isError: isErrorAppendixProcess,refetch:refetchAppendix } = useGetWorkFlowByAppendixIdQuery(
        { appendixId },
        { skip: !appendixId }
    );
    const user = useSelector(selectCurrentUser);
    const token = useSelector(selectCurrentToken);
    const stages = dataAppendixProcess?.data?.stages || [];
    const matchingStage = stages.find(stage => stage.approver === user?.id);
    const StageIdMatching = matchingStage?.stageId;
    const userApproval = dataAppendixProcess?.data.stages.find(stage => stage.approver === user?.id && (stage.status === "APPROVED"));
    const userCreate = appendixData?.data.createdBy.userId == user?.id;

    const [signMethod, setSignMethod] = useState('online');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authError, setAuthError] = useState(null);
    const [authenSign, setAuthenSign] = useState('')
    const [isAuthLoading, setIsAuthLoading] = useState(false)
    const [fileBase64, setFileBase64] = useState('');

    const [rejectProcess, { isLoading: rejectLoading }] = useRejectAppendixMutation();
    const [approveProcess, { isLoading: approveLoading }] = useApproveAppendixMutation();
    const [uploadFileSignedAlready] = useUploadAppendixAlreadySignedMutation();
    const [uploadFilePDF] = useFindLocationMutation();
    const [fetchTerms] = useLazyGetTermDetailQuery();
    const [uploadFileToSign] = useUploadAppenixToSignMutation();
    const [uploadOnlineSigned] = useUploadAppendixOnlineSignedMutation();


    useEffect(() => {
        refetch();
        refetchAppendix();
    }, [])

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
    const parseDate = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
        const [year, month, day, hour, minute] = dateArray;
        return new Date(year, month - 1, day, hour, minute);
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
            title: 'Ngày thông báo thanh toán', dataIndex: 'notifyPaymentDate', key: 'notifyPaymentDate', render: (dateArray) => {
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

    const writeToLog = (message) => {
        // setLogs((prevLogs) => [
        //     ...prevLogs,
        //     `${new Date().toLocaleTimeString()} - ${message}`,
        // ]);
    };
    useEffect(() => {
        // Check if jQuery and SignalR are loaded
        if (typeof $ === 'undefined') {
            setError('jQuery không được tải');
            writeToLog('jQuery không được tải');
            return;
        }
        if (typeof $.signalR === 'undefined') {
            setError('SignalR không được tải');
            writeToLog('SignalR không được tải');
            return;
        }

        // Load the SignalR hubs script dynamically
        $.getScript('http://localhost:8888/signalr/hubs')
            .done(() => {
                // Create a new SignalR connection and hub proxy
                const conn = $.hubConnection('http://localhost:8888/signalr');
                const proxy = conn.createHubProxy('simpleHub');

                // Define the callback when the signed file is received from the server.
                proxy.on('ReceiveSignedFile', (fileName, fileBase64, serverSignTime) => {
                    // setSignedFile({ fileName, fileBase64 });
                    writeToLog(`File đã ký: ${fileName}`);
                    writeToLog(`Thời gian ký từ server: ${serverSignTime}`);
                    // Upload the signed file to your API.
                    uploadSignedFile(fileName, fileBase64, serverSignTime);
                });

                // Define the error callback from the server.
                proxy.on('ShowError', (err) => {
                    if (err.includes("The process cannot access the file")) {
                        setError("File ký vừa được hủy bởi người ký, vui lòng đợi trong vài phút và reload lại trang.");
                    } else {
                        setError(err);
                    }
                    setIsUploading(false);
                    writeToLog(`Lỗi: ${err}`);
                });

                // Start the connection.
                conn
                    .start()
                    .done(() => {
                        console.log('Đã kết nối với SignalR');
                        writeToLog('Đã kết nối tới server SignalR');
                        setConnection(conn);
                        setHubProxy(proxy);
                    })
                    .fail((err) => {
                        setError('Kết nối SignalR thất bại: ' + err);
                        writeToLog('Kết nối SignalR thất bại: ' + err);
                    });

                // Cleanup: Stop SignalR connection when component unmounts.
                return () => {
                    if (conn) {
                        conn.stop();
                    }
                };
            })
            .fail(() => {
                setError('Không thể tải /signalr/hubs');
                writeToLog('Không thể tải /signalr/hubs');
            });
        // Empty dependency array means this runs only once at mount
    }, []);

    const uploadSignedFile = async (fileName, fileBase64, serverSignTime) => {
        try {
            const result = await uploadFileSignedAlready(
                {
                    addendumId: parseInt(appendixId, 10),
                    fileName: fileName,
                    fileBase64: fileBase64,
                    signedBy: 'Director',
                    signedAt: serverSignTime,
                }
            ).unwrap()

            message.success("Ký phụ lục thành công !")
            navigate('/appendix?paramstatus=APPROVED', { replace: true })
        } catch (err) {
            console.error('Error uploading file:', err);
            setError('Lỗi khi upload file đã ký');
            writeToLog('Lỗi khi upload file đã ký: ' + (err.response?.data || err.message));
        } finally {
            setIsUploading(false);
        }
    };

    const handleSign = async () => {
        if (!selectedFile) {
            setError('Vui lòng chọn file PDF trước khi ký');
            return;
        }

        if (!connection || !hubProxy) {
            setError('Chưa kết nối tới SignalR');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            const data = await uploadFileToSign({ file: selectedFile }).unwrap();
            const signInfo = {
                llx: dataToSign.llx,
                lly: dataToSign.lly,
                urx: dataToSign.urx,
                ury: dataToSign.ury,
                FileType: 'PDF',
                page: dataToSign.page,
                FileName: selectedFile.name,
            };

            // console.log(data)
            hubProxy.invoke('SignDocument', data.FileId, signInfo, dataToSign.page, token);


            setSelectedFile(null)
            // setSignedFile(null)

        } catch (err) {
            setError(err.message);
            writeToLog(err.message);
            setIsUploading(false);
        }
    };


    // ok!
    const handleOnlineSign = async () => {
        if (!selectedFile) {
            setError('File chưa được tạo, vui lòng thử lại!');
            return;
        }
        setIsUploading(true);
        setError(null);
        try {
            const signInfo = {
                "options": {
                    "PAGENO": dataToSign.page,
                    "POSITIONIDENTIFIER": DataToSign.POSITIONIDENTIFIER,
                    "RECTANGLESIZE": DataToSign.RECTANGLESIZE,
                    "RECTANGLEOFFSET": DataToSign.RECTANGLEOFFSETFORAPPENDIX,
                    "VISIBLESIGNATURE": DataToSign.VISIBLESIGNATURE,
                    "VISUALSTATUS": DataToSign.VISUALSTATUS,
                    "SHOWSIGNERINFO": DataToSign.SHOWSIGNERINFO,
                    "SIGNERINFOPREFIX": DataToSign.SIGNERINFOPREFIX,
                    "SHOWDATETIME": DataToSign.SHOWDATETIME,
                    "DATETIMEPREFIX": DataToSign.DATETIMEPREFIX,
                    "TEXTDIRECTION": DataToSign.TEXTDIRECTION,
                    "TEXTCOLOR": DataToSign.TEXTCOLOR,
                    "IMAGEANDTEXT": DataToSign.IMAGEANDTEXT,
                    "BACKGROUNDIMAGE": DataToSign.BACKGROUNDIMAGE,
                },
                "file_data": fileBase64
            };

            const response = await fetch('/api/hsm/pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authenSign}`,
                },
                body: JSON.stringify(signInfo),
            });

            if (!response.ok) {
                throw new Error('Lỗi khi gửi dữ liệu ký');
            }

            const data = await response.json();
            if (data.result.status = "Success") {
                console.log(appendixId)
                const upload = await uploadOnlineSigned(
                    {
                        body: data.result.file_data,
                        params: {
                            fileName: appendixData?.data.title,
                            addendumId: appendixId
                        }
                    })
                // console.log(upload)
                message.success("Ký phụ lục và" + upload.data.message)
                navigate('/appendix?paramstatus=APPROVED', { replace: true })
            } else {
                message.error("Có lỗi xảy ra vui lòng thử lại !")
            }
            // console.log('Ký thành công:', data);

            // Reset sau khi ký
            setSelectedFile(null);
            setSignedFile(null);
            setIsUploading(false);
        } catch (err) {
            setError(err.message);
            writeToLog(err.message);
            setIsUploading(false);
        }
    };

    // ok!
    const handleAuth = async (values) => {
        try {
            setIsAuthLoading(true)
            const response = await fetch('/api/hsm/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: values.username,
                    password: values.password,
                }),
            });

            // Kiểm tra status code
            if (!response.ok) {
                throw new Error('Server trả về lỗi');
            }

            const data = await response.json();
            console.log(data);

            if (data.result.status === "Success") {
                message.success('Xác thực thành công người ký!')
                setAuthenSign(data.result.token)
                setIsAuthenticated(true);
                setAuthError(null);
            } else {
                setAuthError('Tài khoản hoặc mật khẩu không đúng');
            }
            setIsAuthLoading(false)
        } catch (err) {
            setAuthError('Lỗi xác thực: ' + (err.message || 'Vui lòng thử lại'));
            setIsAuthLoading(false)
        }
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

            // groupedTermsExport.A = [...new Set(allGrouped.A)];
            // groupedTermsExport.B = [...new Set(allGrouped.B)];
            // groupedTermsExport.Common = [...new Set(allGrouped.Common)];


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

    useEffect(() => {
        if (appendixData?.data?.additionalConfig) {
            const allGrouped = { Common: [], A: [], B: [] };

            Object.values(appendixData.data.additionalConfig).forEach((config) => {
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
    }, [appendixData?.data]);

    const parsedContent = convert(appendixData?.data.contractContent, {
        wordwrap: 220,
    });

    useEffect(() => {
        if (error && error !== 'The action was cancelled by the user') {
            setSignMethod('online');
        }
    }, [error])

    useEffect(() => {
        if (isConfirmed && signMethod) {
            setSignMethod('online')
        }
    }, [error])


    useEffect(() => {

        if (appendixData) {
            setLoadingCreateFile(true);
            pdfMake.fonts = {
                Roboto: {
                    normal: 'Roboto-Regular.ttf',
                    bold: 'Roboto-Medium.ttf',
                    italics: 'Roboto-Italic.ttf',
                    bolditalics: 'Roboto-MediumItalic.ttf'
                }
            };
            const docDefinition = {
                content: [
                    // Header Section
                    { text: "CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", style: "header" },
                    { text: "Độc lập - Tự do - Hạnh phúc", style: "subheader" },
                    { text: "---------oOo---------", style: "subheader" },

                    // Contract Title and Number
                    appendixData.data.title && { text: appendixData.data.title.toUpperCase(), style: "contractTitle" },
                    appendixData.data.contractNumber && {
                        text: [
                            { text: 'Đính kèm phụ lục số: ', style: "subheader" }, { text: appendixData.data.contractNumber }
                        ],
                        margin: [0, 10, 0, 15],
                        fontSize: 11
                    },

                    // Legal Basis Terms
                    appendixData.data.legalBasisTerms?.length > 0 && [
                        ...appendixData.data.legalBasisTerms.map((item) => ({
                            text: `- ${item.value}`,
                            italics: true,
                            margin: [0, 2, 0, 2],
                            fontSize: 11,
                        }))
                    ],

                    // Signing Date and Location
                    {
                        text: `Phụ lục có sự tham gia bởi và giữa: `,
                        margin: [0, 7, 0, 3],
                        fontSize: 11
                    },

                    // Partner A Details
                    appendixData.data.partnerA && { text: "BÊN CUNG CẤP (BÊN A)", style: "titleDescription", decoration: 'underline' },
                    appendixData.data.partnerA?.partnerName && {
                        text: [
                            { text: 'Tên công ty: ', style: "boldtext" }, { text: appendixData.data.partnerA.partnerName }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    appendixData.data.partnerA?.partnerAddress && {
                        text: [
                            { text: 'Địa chỉ trụ sở chính: ', style: "boldtext" }, { text: appendixData.data.partnerA.partnerAddress }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    appendixData.data.partnerA?.spokesmanName && {
                        text: [
                            { text: 'Người đại diện: ', style: "boldtext" }, { text: appendixData.data.partnerA.spokesmanName }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    appendixData.data.partnerA?.position && {
                        text: [
                            { text: 'Chức vụ: ', style: "boldtext" }, { text: appendixData.data.partnerA.position }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    appendixData.data.partnerA?.partnerTaxCode && {
                        text: [
                            { text: 'Mã số thuế: ', style: "boldtext" }, { text: appendixData.data.partnerA.partnerTaxCode }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    appendixData.data.partnerA?.partnerEmail && {
                        text: [
                            { text: 'Email: ', style: "boldtext" }, { text: appendixData.data.partnerA.partnerEmail }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },

                    // Partner B Details
                    appendixData.data.partnerB && { text: "BÊN SỬ DỤNG (BÊN B)", style: "titleDescription", decoration: 'underline' },
                    appendixData.data.partnerB?.partnerName && {
                        text: [
                            { text: 'Tên công ty: ', style: "boldtext" }, { text: appendixData.data.partnerB.partnerName }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    appendixData.data.partnerB?.partnerAddress && {
                        text: [
                            { text: 'Địa chỉ trụ sở chính: ', style: "boldtext" }, { text: appendixData.data.partnerB.partnerAddress }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    appendixData.data.partnerB?.spokesmanName && {
                        text: [
                            { text: 'Người đại diện: ', style: "boldtext" }, { text: appendixData.data.partnerB.spokesmanName }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    appendixData.data.partnerB?.position && {
                        text: [
                            { text: 'Chức vụ: ', style: "boldtext" }, { text: appendixData.data.partnerB.position }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    appendixData.data.partnerB?.partnerTaxCode && {
                        text: [
                            { text: 'Mã số thuế: ', style: "boldtext" }, { text: appendixData.data.partnerB.partnerTaxCode }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    appendixData.data.partnerB?.partnerEmail && {
                        text: [
                            { text: 'Email: ', style: "boldtext" }, { text: appendixData.data.partnerB.partnerEmail }
                        ],
                        margin: [0, 3, 0, 3],
                        fontSize: 11
                    },
                    // Agreement Statement
                    {
                        text: `Điều khoản phụ lục:`,
                        margin: [0, 9, 0, 4],
                        fontSize: 11,
                        bold: true,
                    },
                    {
                        text: `- Phụ lục này là một phần không thể tách rời của hợp đồng số ${appendixData?.data.contractNumber}.`,
                        margin: [0, 9, 0, 9],
                        fontSize: 11
                    },
                    {
                        text: `- Các điều khoản khác của Hợp đồng không bị điều chỉnh bởi Phụ lục này vẫn giữ nguyên hiệu lực.`,
                        margin: [0, 9, 0, 9],
                        fontSize: 11
                    },

                    // Contract Content
                    parsedContent && { text: "NỘI DUNG HỢP ĐỒNG", style: "titleDescription", decoration: 'underline' },
                    parsedContent && {
                        text: parsedContent,
                        margin: [0, 7, 0, 0],
                        lineHeight: 0.7,
                        fontSize: 11
                    },

                    // Payment Section
                    appendixData.data.amount && { text: "GIÁ TRỊ VÀ THANH TOÁN", style: "titleDescription", decoration: 'underline', margin: [0, 10, 0, 0] },
                    appendixData.data.amount && {
                        text: [
                            { text: `- Tổng giá trị hợp đồng: ${new Intl.NumberFormat('vi-VN').format(appendixData.data.amount)} VND  ` },
                            { text: `( ${numberToVietnamese(appendixData.data.amount)} )` }
                        ],
                        margin: [5, 9, 0, 9],
                        fontSize: 11
                    },
                    appendixData.data.contractItems?.length > 0 && {
                        text: `1. Hạng mục thanh toán`,
                        margin: [0, 9, 0, 9],
                        fontSize: 11,
                        bold: true,
                    },
                    appendixData.data.contractItems?.length > 0 && {
                        style: "table",
                        table: {
                            widths: ["auto", "*", "auto"],
                            body: [
                                [
                                    { text: "STT", style: "tableHeader" },
                                    { text: "Nội dung", style: "tableHeader" },
                                    { text: "Số tiền (VND)", style: "tableHeader" },
                                ],
                                ...appendixData.data.contractItems.map(item => [
                                    { text: item.itemOrder, style: "tableCell" },
                                    { text: item.description, style: "tableCell" },
                                    { text: new Intl.NumberFormat('vi-VN').format(item.amount), style: "tableCell" },
                                ]),
                            ],
                        },
                        layout: {
                            hLineWidth: function (i, node) { return 0.5; },
                            vLineWidth: function (i, node) { return 0.5; },
                            hLineColor: function (i, node) { return 'black'; },
                            vLineColor: function (i, node) { return 'black'; },
                            paddingLeft: function (i, node) { return 5; },
                            paddingRight: function (i, node) { return 5; },
                            paddingTop: function (i, node) { return 5; },
                            paddingBottom: function (i, node) { return 5; },
                        },
                    },
                    appendixData.data.paymentSchedules?.length > 0 && {
                        text: `2. Tổng giá trị và số lần thanh toán`,
                        margin: [0, 9, 0, 9],
                        fontSize: 11,
                        bold: true,
                    },
                    appendixData.data.paymentSchedules?.length > 0 && {
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
                                ...appendixData.data.paymentSchedules.map(item => [
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
                            hLineWidth: function (i, node) { return 0.5; },
                            vLineWidth: function (i, node) { return 0.5; },
                            hLineColor: function (i, node) { return 'black'; },
                            vLineColor: function (i, node) { return 'black'; },
                            paddingLeft: function (i, node) { return 5; },
                            paddingRight: function (i, node) { return 5; },
                            paddingTop: function (i, node) { return 5; },
                            paddingBottom: function (i, node) { return 5; },
                        },
                    },
                    (appendixData.data.isDateLateChecked || appendixData.data.autoAddVAT) && {
                        text: [
                            appendixData.data.isDateLateChecked && `- Trong quá trình thanh toán cho phép trễ hạn tối đa ${appendixData.data.maxDateLate} (ngày)`,
                            appendixData.data.autoAddVAT && `- Thuế VAT được tính (${appendixData.data.vatPercentage}%)`
                        ].filter(Boolean),
                        margin: [0, 10, 0, 10],
                        fontSize: 11,
                    },

                    // Effective Dates
                    (appendixData.data.effectiveDate || appendixData.data.expiryDate) && {
                        text: "THỜI GIAN HIỆU LỰC LIÊN QUAN",
                        style: "titleDescription",
                        decoration: 'underline',
                        margin: [0, 10, 0, 10],
                    },
                    appendixData.data.effectiveDate && appendixData.data.expiryDate && {
                        margin: [0, 5, 0, 5],
                        text: [
                            `- Ngày bắt đầu hiệu lực: ${dayjs(parseDate(appendixData.data.effectiveDate)).format('HH:mm')} ngày `,
                            { text: dayjs(parseDate(appendixData.data.effectiveDate)).format('DD/MM/YYYY'), bold: true },
                            `\n- Ngày chấm dứt hiệu lực: ${dayjs(parseDate(appendixData.data.expiryDate)).format('HH:mm')} ngày `,
                            { text: dayjs(parseDate(appendixData.data.expiryDate)).format('DD/MM/YYYY'), bold: true },
                        ],
                    },
                    (appendixData.data.autoRenew || appendixData.data.appendixEnabled) && [
                        appendixData.data.autoRenew && {
                            text: "- Tự động gia hạn khi hợp đồng hết hạn nếu không có phản hồi từ các phía",
                            margin: [0, 5, 0, 5],
                            fontSize: 11
                        },
                        appendixData.data.appendixEnabled && {
                            text: "- Cho phép tạo phụ lục khi hợp đồng có hiệu lực",
                            margin: [0, 5, 0, 5],
                            fontSize: 11
                        }
                    ],

                    // Terms Section
                    (groupedTermsExport.Common.length > 0 || groupedTermsExport.A.length > 0 || groupedTermsExport.B.length > 0 || appendixData.data.specialTermsA || appendixData.data.specialTermsB) && {
                        text: "CÁC LOẠI ĐIỀU KHOẢN",
                        style: "titleDescription",
                        decoration: 'underline',
                        margin: [0, 10, 0, 10],
                    },
                    (groupedTermsExport.Common.length > 0 || groupedTermsExport.A.length > 0 || groupedTermsExport.B.length > 0 || appendixData.data.specialTermsA || appendixData.data.specialTermsB) && {
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
                                    ...groupedTermsExport.Common.map((termId) => ({
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
                                    appendixData.data.specialTermsA?.trim() && {
                                        text: `- ${appendixData.data.specialTermsA}`,
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
                                    appendixData.data.specialTermsB?.trim() && {
                                        text: `- ${appendixData.data.specialTermsB}`,
                                        margin: [5, 2],
                                    },
                                ].filter(Boolean),
                            },
                        ],
                    },

                    // Other Information
                    (appendixData.data.appendixEnabled || appendixData.data.transferEnabled || appendixData.data.violate || appendixData.data.suspend) && {
                        text: "CÁC THÔNG TIN KHÁC",
                        style: "titleDescription",
                        decoration: 'underline',
                        margin: [0, 10, 0, 10],
                    },
                    (appendixData.data.appendixEnabled || appendixData.data.transferEnabled || appendixData.data.violate || appendixData.data.suspend) && {
                        stack: [
                            appendixData.data.appendixEnabled && {
                                text: "- Cho phép tạo phụ lục khi hợp đồng có hiệu lực",
                                margin: [0, 3, 0, 3],
                                fontSize: 11,
                            },
                            appendixData.data.transferEnabled && {
                                text: "- Cho phép chuyển nhượng hợp đồng",
                                margin: [0, 3, 0, 3],
                                fontSize: 11,
                            },
                            appendixData.data.violate && {
                                text: "- Cho phép đơn phương hủy hợp đồng nếu 1 trong 2 vi phạm các quy định trong điều khoản",
                                margin: [0, 3, 0, 3],
                                fontSize: 11,
                            },
                            appendixData.data.suspend && {
                                text: `- Cho phép tạm ngưng hợp đồng trong trường hợp bất khả kháng: ${appendixData.data.suspendContent}`,
                                margin: [0, 3, 0, 3],
                                fontSize: 11,
                            },
                        ].filter(Boolean),
                    },

                    // Signatures
                    (appendixData.data.partnerA || appendixData.data.partnerB) && {
                        columns: [
                            appendixData.data.partnerA && {
                                width: '*',
                                stack: [
                                    { text: "ĐẠI DIỆN BÊN A", style: "signatureTitle" },
                                    { text: appendixData.data.partnerA.partnerName.toUpperCase(), style: "signatureName", bold: true },
                                    { text: "Ký và ghi rõ họ tên", style: "signatureNote" }
                                ],
                                alignment: 'center'
                            },
                            appendixData.data.partnerB && {
                                width: '*',
                                stack: [
                                    { text: "ĐẠI DIỆN BÊN B", style: "signatureTitle" },
                                    { text: appendixData.data.partnerB.partnerName.toUpperCase(), style: "signatureName", bold: true },
                                    { text: "Ký và ghi rõ họ tên", style: "signatureNote" }
                                ],
                                alignment: 'center'
                            }
                        ],
                        margin: [0, 30, 0, 0]
                    },
                ].filter(Boolean),

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
                        fontSize: 14,
                        bold: true,
                        alignment: "center",
                        margin: [0, 0, 0, 10],
                    },
                    tableHeader: {
                        bold: true,
                        fontSize: 12,
                        color: 'black',
                        fillColor: '#f0f0f0',
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
                },

                defaultStyle: {
                    font: "Roboto",
                },
            };

            const pdfDocGenerator = pdfMake.createPdf(docDefinition);
            pdfDocGenerator.getBlob((blob) => {
                const file = new File([blob], `${appendixData.data.title || 'contract'}-${appendixData.data.partnerB?.partnerName || 'partner'}.pdf`, { type: "application/pdf" });
                setSelectedFile(file);
                uploadFilePDF({ file })
                    .then((response) => {
                        console.log("Upload thành công:", response);
                        if (response.data.status === "OK" && response.data.data) {
                            const { llx, lly, urx, ury, page } = response.data.data;
                            dataToSign.llx = llx;
                            dataToSign.lly = lly;
                            dataToSign.urx = urx;
                            dataToSign.ury = ury;
                            dataToSign.page = page;
                        }
                    })
                    .catch((error) => {
                        console.error("Lỗi khi upload:", error);
                        setLoadingCreateFile(false);
                    });
            });

            pdfDocGenerator.getBase64((base64) => {
                setFileBase64(base64)
            });

            setLoadingCreateFile(false);
        }

    }, [appendixData]);

    const paymentSchedulesDataSource = appendixData?.data.paymentSchedules.map(schedule => ({
        key: schedule.id,
        paymentOrder: schedule.paymentOrder,
        amount: schedule.amount,
        paymentDate: schedule.paymentDate,
        status: schedule.status,
        paymentMethod: schedule.paymentMethod,
        notifyPaymentDate:schedule.notifyPaymentDate
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
                                <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {appendixData?.data.partnerA.address}</p>
                                <p className="text-sm"><b>Người đại diện:</b> {appendixData?.data.partnerA.spokesmanName}</p>
                                <p className="text-sm"><b>Chức vụ:</b> {appendixData?.data.partnerA.position}</p>
                                <p className="text-sm"><b>Mã số thuế:</b> {appendixData?.data.partnerA.taxCode}</p>
                                <p className="text-sm"><b>Email:</b> {appendixData?.data.partnerA.email}</p>
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
                        {appendixData?.data.contractContent && (
                            <>
                                <h4 className="font-bold text-lg mt-4"><u>NỘI DUNG HỢP ĐỒNG</u></h4>
                                <div className="ml-2" dangerouslySetInnerHTML={{ __html: appendixData?.data.contractContent || "Chưa nhập" }} />
                            </>
                        )}
                        {appendixData?.data.extendContractDate && appendixData?.data.contractExpirationDate && (
                            <div className='flex flex-col w-full mb-5'>
                                <p>Thời gian hiệu lực hợp đồng: </p>
                                <p className='w-full flex gap-1'> Từ <b>{displayDate(appendixData?.data.extendContractDate)} </b>đến  <b>{displayDate(appendixData?.data.contractExpirationDate)}</b> </p>
                            </div>
                        )}
                        {appendixData?.data.contractItems && appendixData?.data.contractItems.length > 0 && (
                            <Card title="Hạng mục thanh toán" className="ml-[-10px] mb-4" style={{ backgroundColor: isDarkMode ? '#333' : '#f4f4f4' }}>
                                <Table
                                    dataSource={contractItemsDataSource}
                                    columns={contractItemsColumns}
                                    pagination={false}
                                />
                            </Card>
                        )}

                        {appendixData?.data.paymentSchedules && appendixData?.data.paymentSchedules.length > 0 && (
                            <Card
                                title="Đợt thanh toán"
                                className="ml-[-10px] mb-4"
                                style={{ backgroundColor: isDarkMode ? '#333' : '#f4f4f4' }}
                            >
                                <Table
                                    dataSource={paymentSchedulesDataSource}
                                    columns={paymentSchedulesColumns}
                                    pagination={false}
                                />
                            </Card>
                        )}
                        {appendixData?.data.additionalConfig && Object.keys(appendixData.data.additionalConfig).length > 0 && (
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
                            // w: '400px',

                            width: '400px',
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

                        {(user.roles[0] === "ROLE_DIRECTOR" && (appendixData?.data.status == "APPROVED")) && (
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '20px',
                                }}
                            >
                                <div>
                                    {loadingCreateFile ? (
                                        <Tag color='gold-inverse' icon={<Spin color="red" />}>Đang tải dữ liệu</Tag>
                                    ) : (
                                        <Card className='flex flex-col gap-4 items-center text-center pb-[90px]'>
                                            <p className='mb-4'>
                                                <Tag color='green' icon={<CheckCircleFilled />} className='w-fit'>Sẵn sàng ký</Tag>
                                            </p>
                                            {/* {error && <p style={{ color: 'red' }}>Lỗi: {error}</p>} */}
                                            <div className='flex flex-col items-center gap-2'>
                                                <Checkbox
                                                    disabled={isUploading}
                                                    checked={isConfirmed}
                                                    onChange={(e) => setIsConfirmed(e.target.checked)}
                                                    className='text-left'
                                                >
                                                    <p className='ml-2'>  Tôi xác nhận đã đọc và đồng ý với nội dung phụ lục</p>
                                                </Checkbox>
                                                {isConfirmed && (
                                                    <>
                                                        <Radio.Group
                                                            onChange={(e) => setSignMethod(e.target.value)}
                                                            value={signMethod}
                                                            disabled={isUploading}
                                                            style={{
                                                                cursor: (isUploading) ? 'not-allowed' : 'pointer',
                                                            }}
                                                            className='flex flex-col justify-start gap-2'
                                                        >
                                                            <Radio value="usbToken" disabled={!!error || isUploading}>
                                                                Ký bằng USB Token
                                                            </Radio>
                                                            <Radio value="online" disabled={isUploading}>
                                                                Ký bằng tài khoản Online
                                                            </Radio>
                                                        </Radio.Group>
                                                        {signMethod === 'online' && !isAuthenticated && (
                                                            <AuthenSignContractOnline
                                                                onAuth={handleAuth}
                                                                isLoading={isAuthLoading}
                                                                error={authError}
                                                            />
                                                        )}
                                                        {(signMethod === 'usbToken') && (
                                                            <Button
                                                                icon={<FaPenNib />}
                                                                onClick={handleSign}
                                                                disabled={loadingCreateFile || isUploading || !isConfirmed}
                                                                style={{
                                                                    marginTop: '20px',
                                                                    padding: '8px 16px',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: (loadingCreateFile || isUploading || !isConfirmed) ? 'not-allowed' : 'pointer',
                                                                }}
                                                            >
                                                                {isUploading ? 'Đang xử lý...' : 'Ký hợp đồng'}
                                                            </Button>
                                                        )}
                                                        {(signMethod === 'online' && isAuthenticated) && (
                                                            <div>
                                                                <Button
                                                                    icon={<FaPenNib />}
                                                                    onClick={handleOnlineSign}
                                                                    disabled={loadingCreateFile || isUploading || !isConfirmed}
                                                                    style={{
                                                                        padding: '8px 16px',
                                                                        marginTop: '20px',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: (loadingCreateFile || isUploading || !isConfirmed) ? 'not-allowed' : 'pointer',
                                                                    }}
                                                                >
                                                                    {isUploading ? 'Đang xử lý...' : 'Ký hợp đồng'}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </Card>
                                    )}
                                </div>
                            </div>
                        )}

                        {appendixData?.data.status == "SIGNED" && (
                            <Tag className='flex justify-center gap-2 py-2'>
                                <p>Phụ lục này đã được ký</p>
                                <CheckCircleFilled style={{ color: '#49aa19' }} />
                            </Tag>
                        )}
                    </div>

                </Col>
            )}
        </Row>

    );
};

export default AppendixDetail;