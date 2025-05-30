import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Steps, Form, Input, Select, DatePicker, Checkbox, Button, Space, Divider, message, Row, Col, Spin, Modal, Popover, InputNumber, Typography, Switch, Timeline, Skeleton, Table, Tooltip } from "antd";
import dayjs from "dayjs";
import LazySelectContractTemplate from "../../hooks/LazySelectContractTemplate";
import { useNavigate } from "react-router-dom";
import { useLazyGetAllTemplateByContractTypeIdQuery, useLazyGetAllTemplateQuery, useLazyGetTemplateDataDetailQuery } from "../../services/TemplateAPI";
import { FcNext } from "react-icons/fc";
import { useGetPartnerInfoDetailQuery, useLazyGetPartnerListByPartnerTypeQuery, useLazyGetPartnerListQuery } from "../../services/PartnerAPI";
import LazySelectPartner from "../../hooks/LazySelectPartner";
import LazySelectContractType from "../../hooks/LazySelectContractType";
import { useCreateContractMutation, useCreateContractTypeMutation, useLazyGetContractTypeQuery } from "../../services/ContractAPI";
import { CaretLeftOutlined, CaretRightOutlined, CheckCircleFilled, CheckCircleOutlined, DeleteFilled, EyeFilled, InfoCircleOutlined, PlusOutlined } from "@ant-design/icons";
import LazySelect from "../../hooks/LazySelect";
import { useCreateClauseMutation, useLazyGetClauseManageQuery, useLazyGetLegalCreateContractQuery, useLazyGetTermDetailQuery } from "../../services/ClauseAPI";
import LazyLegalSelect from "../../hooks/LazyLegalSelect";
import RichTextEditor, {
} from 'reactjs-tiptap-editor';
import 'reactjs-tiptap-editor/style.css';
import 'katex/dist/katex.min.css';
import { extensions } from "../../utils/textEditor";
import { PreviewSection } from "../../components/ui/PreviewSection";
import { numberToVietnamese } from "../../utils/ConvertMoney";
import { TermSection } from "../../config/TermConfig";
import PreviewContract from "../../components/ui/PreviewContract";
import { VietnameseProvinces } from "../../utils/Province";
import { useLazyGetDateNofitifationQuery } from "../../services/ConfigAPI";
import { useSelector } from "react-redux";
import { useGetBussinessInformatinQuery } from "../../services/BsAPI";
import topIcon from "../../assets/Image/top.svg"
import { debounce, throttle } from "lodash";
import ModalAdd from "./component/ModalAdd";
import { useWarnOnLeave } from "../../hooks/UseWarnOnLeave";

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

// Thêm các constant cho nội dung thông báo mặc định
const DEFAULT_NOTIFICATIONS = {
    effective: "Hợp đồng sẽ có hiệu lực vào ngày",
    expiry: "Hợp đồng sẽ hết hiệu lực vào ngày",
    payment: "Đến hạn thanh toán đợt"
};

const CreateContractForm = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [formLegal] = Form.useForm();
    const inputRef = useRef(null);
    const navigate = useNavigate()
    const [newTypeCreate, setNewTypeCreate] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateDataSelected, setTemplateDataSelected] = useState(null);
    const [isAddLegalModalOpen, setIsAddLegalModalOpen] = useState(false);
    const [isAddClasueModalOpen, setIsAddClauseModalOpen] = useState(false);
    const [adddClauseId, setIsAddClauseId] = useState(0);
    const [newLegalBasis, setNewLegalBasis] = useState({ name: '', content: '' });
    const [content, setContent] = useState('')
    const [textValue, setTextValue] = useState("");
    const [isVATChecked, setIsVATChecked] = useState(false);
    const [isDateLateChecked, setIsDateLateChecked] = useState(false);
    const [isAutoRenew, setIsAutoRenew] = useState(false);
    const [selectedOthersTerms, setSelectedOthersTerms] = useState([]);
    const [isAppendixEnabled, setIsAppendixEnabled] = useState(false);
    const [isTransferEnabled, setIsTransferEnabled] = useState(false);
    const [isSuspend, setIsSuspend] = useState(false);
    const [isViolate, setIsisViolate] = useState(false);
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [loadingTerms, setLoadingTerms] = useState({});
    const [changeCCPL, setChangeCCPL] = useState(false);
    const [shouldBlockNavigation, setShouldBlockNavigation] = useState(true);

    const { data: partnerDetail, isLoading: isLoadingInfoPartner } = useGetPartnerInfoDetailQuery({ id: form.getFieldValue('partnerId') });
    const { data: bsInfor, isLoading: isLoadingBsData } = useGetBussinessInformatinQuery();

    const [showScroll, setShowScroll] = useState(false)
    const [activeSection, setActiveSection] = useState('general');
    const generalInfoRef = useRef(null);
    const mainContentRef = useRef(null);
    const containerRef = useRef(null)
    const termsRef = useRef(null);
    const otherContentRef = useRef(null);

    const [getContractTypeData, { data: contractTypeData, isLoading: isLoadingContractType }] = useLazyGetContractTypeQuery()
    const [getTemplateData, { data: templateData, isLoading }] = useLazyGetAllTemplateByContractTypeIdQuery({
        pollingInterval: 0,
        refetchOnMountOrArgChange: true,
    })
    const [getPartnerData, { data: partnerData, isLoading: isLoadingParnerData }] = useLazyGetPartnerListByPartnerTypeQuery()
    const [createContractType, { isLoadingCreateType }] = useCreateContractTypeMutation()
    const [getTemplateDetail] = useLazyGetTemplateDataDetailQuery();
    const [getContractLegal, { data: legalData, isLoading: loadingLegal, refetch: refetchLegal }] = useLazyGetLegalCreateContractQuery();
    const [getGeneralTerms, { data: generalData, isLoading: loadingGenaral, refetch: refetchGenaral }] = useLazyGetClauseManageQuery();
    const [getDateNotification] = useLazyGetDateNofitifationQuery();
    const [notificationDays, setNotificationDays] = useState(null);
    const [fetchTerms] = useLazyGetTermDetailQuery();
    const [createClause] = useCreateClauseMutation();
    const [createContract, { isLoading: loadingCreateContract, isError: CreateError }] = useCreateContractMutation();
    const [termsData, setTermsData] = useState({});
    const [notifications, setNotifications] = useState([]);

    // Hàm thêm một thông báo mới
    const addNotification = () => {
        setNotifications([
            ...notifications,
            {
                id: Date.now(),
                date: null,
                content: ''
            }
        ]);
    };

    // Hàm xóa một thông báo
    const removeNotification = (id) => {
        setNotifications(notifications.filter(notif => notif.id !== id));
    };

    // Hàm cập nhật nội dung thông báo
    const updateNotification = (id, field, value) => {
        setNotifications(notifications.map(notif =>
            notif.id === id ? { ...notif, [field]: value } : notif
        ));
    };

    // Thêm useEffect để lấy số ngày thông báo từ API
    useEffect(() => {
        const fetchNotificationDays = async () => {
            try {
                const response = await getDateNotification().unwrap();
                if (response) {
                    // Find the response with key PAYMENT_DEADLINE
                    const paymentDeadline = response.find(item => item.key === "PAYMENT_DEADLINE");
                    if (paymentDeadline) {
                        setNotificationDays(paymentDeadline.value || 0);
                    }
                }
            } catch (error) {
                // console.error('Error fetching notification days:', error);
            }
        };

        fetchNotificationDays();
    }, []);

    // Thêm hàm helper để tính toán ngày thông báo an toàn
    const calculateNotificationDate = (targetDate) => {
        if (!targetDate) return null;
        const notifyDate = targetDate.clone().subtract(notificationDays, 'days');
        const today = dayjs().startOf('day');
        return notifyDate.isBefore(today) ? targetDate.clone() : notifyDate;
    };

    // Cập nhật useEffect theo dõi thay đổi của các ngày
    useEffect(() => {
        // Lắng nghe sự thay đổi của ngày hiệu lực
        const effectiveDate = form.getFieldValue('effectiveDate');
        if (effectiveDate) {
            form.setFieldsValue({
                notifyEffectiveDate: calculateNotificationDate(effectiveDate)
            });
        }

        // Lắng nghe sự thay đổi của ngày hết hiệu lực
        const expiryDate = form.getFieldValue('expiryDate');
        if (expiryDate) {
            form.setFieldsValue({
                notifyExpiryDate: calculateNotificationDate(expiryDate)
            });
        }

        // Lắng nghe sự thay đổi của các ngày thanh toán
        const payments = form.getFieldValue('payments') || [];
        if (payments.length > 0) {
            const updatedPayments = payments.map(payment => {
                if (payment?.paymentDate) {
                    return {
                        ...payment,
                        notifyPaymentDate: calculateNotificationDate(payment.paymentDate)
                    };
                }
                return payment;
            });
            form.setFieldsValue({ payments: updatedPayments });
        }
    }, [form.getFieldValue('effectiveDate'), form.getFieldValue('expiryDate'), form.getFieldValue('payments'), notificationDays]);

    // Cập nhật các hàm xử lý sự kiện
    const handleEffectiveDateChange = (date) => {
        if (date) {
            form.setFieldsValue({
                notifyEffectiveDate: calculateNotificationDate(date)
            });
        }
    };

    const handleExpiryDateChange = (date) => {
        if (date) {
            form.setFieldsValue({
                notifyExpiryDate: calculateNotificationDate(date)
            });
        }
    };

    const handlePaymentDateChange = (date, name) => {
        if (!effectiveDate) { // Assuming effectiveDate is the state holding the effective date
            message.error("Vui lòng chọn ngày hiệu lực trước"); // Display error message
            return; // Exit the function
        }
        if (date && (date.isBefore(effectiveDate) || date.isAfter(expiryDate))) { // Assuming expiryDate is defined
            message.error("Ngày thanh toán phải nằm trong khoảng thời gian hiệu lực"); // Display error message
            return; // Exit the function
        }
        if (date) {
            const notifyDate = calculateNotificationDate(date);
            const payments = form.getFieldValue('payments') || [];
            const updatedPayments = [...payments];
            updatedPayments[name] = {
                ...updatedPayments[name],
                notifyPaymentDate: notifyDate
            };
            form.setFieldsValue({ payments: updatedPayments });
        }
    };

    // chuyển trang tạo partner
    const handleCreatePartner = () => {
        navigate("/partner")
    }

    const loadLegalData = async ({ page, size, keyword }) => {
        return getContractLegal({ page, size, keyword }).unwrap();
    };
    const loadGenaralData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 9 }).unwrap();
    };
    const loadDKBSData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 1 }).unwrap();
    };
    const loadQVNVCBData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 2 }).unwrap();
    };
    const loadBHVBTData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 3 }).unwrap();
    };
    const loadVPBTTHData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 4 }).unwrap();
    };
    const loadCDHDData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 5 }).unwrap();
    };
    const loadGQTCData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 6 }).unwrap();
    };
    const loadBMData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 7 }).unwrap();
    };

    const loadDKKata = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 10 }).unwrap();
    };
    // const loadPartnerData = async ({ page, size, keyword }) => {
    //     return getGeneralTerms({ page, size, keyword, typeTermIds: 10 }).unwrap();
    // };

    const loadTemplateData = async ({ page, size, keyword }) => {
        // Lấy giá trị loại hợp đồng đang được chọn
        const selectedContractType = form.getFieldValue('contractType');
        console.log(selectedContractType)
        if (!selectedContractType) {
            return { content: [] };
        }
        // Gọi API với contractTypeId, page, size và keyword
        return getTemplateData({
            ContractTypeId: selectedContractType.value,
            page,
            size,
            keyword,
        }).unwrap();
    };

    const loadPartnerData = async ({ page, size, keyword }) => {
        return getPartnerData({ page, size, keyword }).unwrap();
    };

    const loadContractTypeData = async () => {
        return getContractTypeData().unwrap();
    };
    const loadContractTemplateDetail = async (templateId) => {
        return getTemplateDetail(templateId).unwrap();
    };

    const handleSelectChange = (newValues) => {
        form.setFieldsValue({ generalTerms: newValues });
    };
    const handleSelectOthersTermsChange = (newValues) => {
        form.setFieldsValue({ otherTerms: newValues });
    };


    const handleChange = (value) => {
        if (value) {
            setTextValue(numberToVietnamese(value));
        } else {
            setTextValue("");
        }
    };

    // Xử lý chuyển bước
    const next = async () => {
        try {
            // Validate current step fields (nếu cần)
            await form.validateFields();
            setCurrentStep(currentStep + 1);
        } catch (errorInfo) {
            // console.log(errorInfo)
            message.error(errorInfo.errorFields.length > 1 ? errorInfo.errorFields[0].errors[0] + " và các trường bắt buộc khác" : errorInfo.errorFields[0].errors[0]);
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };


    const onFinish = async () => {
        setShouldBlockNavigation(false);
        const data = form.getFieldsValue(true);

        // Xử lý additionalConfig, chỉ lấy các object có dữ liệu trong A, B hoặc Common
        const additionalConfig = Object.keys(data)
            .filter(key => !isNaN(key)) // Chỉ lấy các key là số (1,2,3,...)
            .reduce((acc, key) => {
                const { A = [], B = [], Common = [] } = data[key] || {};
                if (A.length > 0 || B.length > 0 || Common.length > 0) {
                    acc[key] = {};
                    if (A.length > 0) acc[key].A = A;
                    if (B.length > 0) acc[key].B = B;
                    if (Common.length > 0) acc[key].Common = Common;
                }
                return acc;
            }, {});

        // Format TemplateData
        const templateData = {
            specialTermsA: data.specialTermsA || "",
            specialTermsB: data.specialTermsB || "",
            appendixEnabled: data.appendixEnabled || false,
            transferEnabled: data.transferEnabled || false,
            violate: data.violate || false,
            suspend: data.suspend || false,
            suspendContent: data.suspendContent || "",
            contractContent: data.contractContent || "",
            autoAddVAT: data.autoAddVAT || false,
            vatPercentage: data.vatPercentage || 0,
            isDateLateChecked: data.isDateLateChecked || false,
            maxDateLate: data.maxDateLate || 0,
            autoRenew: data.autoRenew || false,
            legalBasisTerms: data.legalBasisTerms || [],
            generalTerms: data.generalTerms || [],
            additionalTerms: data.additionalTerms || [],
            contractTypeId: data.contractType?.value || null,
            additionalConfig,
            originalTemplateId: null,
            duplicateVersion: null,
            otherTerms: data.otherTerms || []
        };

        // Các trường cần loại bỏ khỏi data chính
        const excludedFields = [
            "specialTermsA",
            "specialTermsB",
            "appendixEnabled",
            "transferEnabled",
            "violate",
            "suspend",
            "suspendContent",
            "contractContent",
            "autoAddVAT",
            "vatPercentage",
            "isDateLateChecked",
            "maxDateLate",
            "autoRenew",
            "legalBasis",
            "generalTerms",
            "additionalTerms",
            "contractType",
            "1", "2", "3", "4", "5", "6", "7",
            "effectiveDate&expiryDate"
        ];

        // Xử lý dữ liệu và loại bỏ các trường không cần thiết
        const formattedData = Object.keys(data).reduce((acc, key) => {
            if (!excludedFields.includes(key)) {
                if (key === 'templateId') {
                    acc[key] = data[key]?.value || null;
                } else if (key === "contractName") {
                    acc["contractTitle"] = data[key] || "";
                } else {
                    acc[key] = data[key];
                }
            }
            return acc;
        }, {});

        // Định dạng ngày giờ chuẩn ISO 8601 (YYYY-MM-DDTHH:mm:ss)
        const formatDateTime = (date) => date ? dayjs(date).format("YYYY-MM-DDTHH:mm:ss") : null;

        formattedData.signingDate = formatDateTime(data.signingDate);
        formattedData.effectiveDate = formatDateTime(data.effectiveDate);
        formattedData.expiryDate = formatDateTime(data.expiryDate);
        formattedData.notifyEffectiveDate = formatDateTime(data.notifyEffectiveDate);
        formattedData.notifyExpiryDate = formatDateTime(data.notifyExpiryDate);

        // Định dạng ngày giờ cho payments
        formattedData.payments = data.payments?.map(payment => ({
            ...payment,
            paymentDate: formatDateTime(payment.paymentDate),
            notifyPaymentDate: formatDateTime(payment.notifyPaymentDate),
        })) || [];

        // Thêm TemplateData vào dữ liệu cuối cùng
        formattedData.TemplateData = templateData;

        // console.log("Formatted Data:", formattedData);

        try {
            const response = await createContract(formattedData).unwrap();
            if (response.status === "CREATED") {
                form.resetFields();
                message.success("Tạo hợp đồng thành công!");

                navigate('/contractsApproval');
            } else {
                message.error(response.message);
                setShouldBlockNavigation(true)
            }
        } catch (error) {
            console.log(error);
            setShouldBlockNavigation(true)
            message.error("Lỗi khi tạo hợp đồng!");
        }
    };




    const onNewTypeChange = (e) => {
        setNewTypeCreate(e.target.value);
    };

    const addNewType = async () => {
        if (!newTypeCreate.trim()) return message.warning("Vui lòng nhập loại hợp đồng!");
        try {
            await createContractType({ name: newTypeCreate }).unwrap();
            loadContractTypeData();
            setNewTypeCreate("");
            message.success("Thêm loại hợp đồng thành công!");
        } catch (error) {
            if (error.data == "exist") {
                message.error("Loại hợp đồng đã tồn tại!");
            } else {
                message.error("Lỗi khi tạo loại hợp đồng!");
            }

        }
    };

    const handleSelectTemplate = (e) => {
        setSelectedTemplate(e.value)
    }

    const handleAddOk = async () => {
        let name = formLegal.getFieldValue('legalLabel') || '';
        let content = formLegal.getFieldValue('legalContent') || '';
        try {
            const result = await createClause({ label: name, value: content, typeTermId: 8 }).unwrap();
            // console.log(result);
            if (result.status === "CREATED") {
                message.success("Tạo căn cứ pháp lý thành công");
                loadLegalData({ page: 0, size: 10, order: 'desc' });
                setIsAddLegalModalOpen(false);
                formLegal.resetFields();
            }

        } catch (error) {
            // console.error("Lỗi tạo căn cứ pháp lý:", error);
            message.error("Có lỗi xảy ra khi tạo căn cứ pháp lý");
        }

    };

    const onValueChange = useCallback(
        debounce((value) => {
            setContent(value);
            form.setFieldsValue({ contractContent: value });
        }, 300),
        []
    );
    useEffect(() => {
        return () => onValueChange.cancel();
    }, []);

    useEffect(() => {
        if (selectedTemplate) {
            loadContractTemplateDetail(selectedTemplate)
                .then((data) => {
                    setTemplateDataSelected(data.data);
                    setContent(data.data?.contractContent)
                    setIsVATChecked(data.data?.autoAddVAT)
                    setIsDateLateChecked(data.data?.isDateLateChecked)
                    setIsAutoRenew(data.data?.autoRenew)
                    setSelectedOthersTerms(data.data.additionalTerms?.map(term => term.original_term_id) || [])
                    setIsAppendixEnabled(data.data?.appendixEnabled)
                    setIsTransferEnabled(data.data?.transferEnabled)
                    setIsSuspend(data.data?.suspend)
                    setIsisViolate(data.data?.violate)
                    form.setFieldsValue({
                        legalBasisTerms: data.data.legalBasisTerms?.map(term => term.original_term_id),
                        generalTerms: data.data?.generalTerms?.map(term => term.original_term_id),
                        autoAddVAT: data.data?.autoAddVAT,
                        vatPercentage: data.data?.vatPercentage,
                        isDateLateChecked: data.data?.isDateLateChecked,
                        maxDateLate: data.data?.maxDateLate,
                        autoRenew: data.data?.autoRenew,
                        additionalTerms: data.data.additionalTerms?.map(term => term.original_term_id) || [],
                        specialTermsA: data.data?.specialTermsA,
                        specialTermsB: data.data?.specialTermsB,
                        appendixEnabled: data.data?.appendixEnabled,
                        transferEnabled: data.data?.transferEnabled,
                        suspend: data.data?.suspend,
                        violate: data.data?.violate,
                        suspendContent: data.data?.suspendContent,
                        // Add only original_term_id values from additionalConfig
                        "1": {
                            A: data.data.additionalConfig?.["1"]?.A?.map(item => item.original_term_id) || [],
                            B: data.data.additionalConfig?.["1"]?.B?.map(item => item.original_term_id) || [],
                            Common: data.data.additionalConfig?.["1"]?.Common?.map(item => item.original_term_id) || []
                        },
                        "2": {
                            A: data.data.additionalConfig?.["2"]?.A?.map(item => item.original_term_id) || [],
                            B: data.data.additionalConfig?.["2"]?.B?.map(item => item.original_term_id) || [],
                            Common: data.data.additionalConfig?.["2"]?.Common?.map(item => item.original_term_id) || []
                        },
                        "3": {
                            A: data.data.additionalConfig?.["3"]?.A?.map(item => item.original_term_id) || [],
                            B: data.data.additionalConfig?.["3"]?.B?.map(item => item.original_term_id) || [],
                            Common: data.data.additionalConfig?.["3"]?.Common?.map(item => item.original_term_id) || []
                        },
                        "4": {
                            A: data.data.additionalConfig?.["4"]?.A?.map(item => item.original_term_id) || [],
                            B: data.data.additionalConfig?.["4"]?.B?.map(item => item.original_term_id) || [],
                            Common: data.data.additionalConfig?.["4"]?.Common?.map(item => item.original_term_id) || []
                        },
                        "5": {
                            A: data.data.additionalConfig?.["5"]?.A?.map(item => item.original_term_id) || [],
                            B: data.data.additionalConfig?.["5"]?.B?.map(item => item.original_term_id) || [],
                            Common: data.data.additionalConfig?.["5"]?.Common?.map(item => item.original_term_id) || []
                        },
                        "6": {
                            A: data.data.additionalConfig?.["6"]?.A?.map(item => item.original_term_id) || [],
                            B: data.data.additionalConfig?.["6"]?.B?.map(item => item.original_term_id) || [],
                            Common: data.data.additionalConfig?.["6"]?.Common?.map(item => item.original_term_id) || []
                        },
                        "7": {
                            A: data.data.additionalConfig?.["7"]?.A?.map(item => item.original_term_id) || [],
                            B: data.data.additionalConfig?.["7"]?.B?.map(item => item.original_term_id) || [],
                            Common: data.data.additionalConfig?.["7"]?.Common?.map(item => item.original_term_id) || []
                        }
                    });
                });
        }
    }, [selectedTemplate]);


    const hanldeOpenAddLegalModal = () => {
        setIsAddLegalModalOpen(true);
    };

    const getAllAdditionalTermsContent = () => {
        const termTitles = {
            1: 'ĐIỀU KHOẢN BỔ SUNG',
            2: 'QUYỀN VÀ NGHĨA VỤ CÁC BÊN',
            3: 'ĐIỀU KHOẢN BẢO HÀNH VÀ BẢO TRÌ',
            4: 'ĐIỀU KHOẢN VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI',
            5: 'ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG',
            6: 'ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP',
            7: 'ĐIỀU KHOẢN BẢO MẬT',
        };

        const combineUniqueTerms = (formTerms, templateTerms) => {
            const uniqueTerms = new Map();

            if (templateTerms && templateTerms.length > 0) {
                templateTerms.forEach((term) => {
                    const termId = term.original_term_id;
                    if (termId && !uniqueTerms.has(termId)) {
                        uniqueTerms.set(termId, term);
                    }
                });
            }

            if (formTerms && formTerms.length > 0) {
                formTerms.forEach((term) => {
                    const termId = term.value || term.original_term_id || term;
                    if (termId && !uniqueTerms.has(termId)) {
                        uniqueTerms.set(termId, termsData[termId] || { original_term_id: termId });
                    }
                });
            }

            return Array.from(uniqueTerms.values());
        };

        const renderTermSection = (termId) => {
            if (!selectedOthersTerms.includes(termId)) {
                return null;
            }

            const formData = form.getFieldValue(String(termId)) || {
                A: [],
                B: [],
                Common: [],
            };
            const templateData = templateDataSelected?.additionalConfig?.[String(termId)] || {
                A: [],
                B: [],
                Common: [],
            };

            const commonTerms = combineUniqueTerms(formData.Common, templateData.Common);
            const aTerms = combineUniqueTerms(formData.A, templateData.A);
            const bTerms = combineUniqueTerms(formData.B, templateData.B);

            const hasCommonTerms = commonTerms.length > 0;
            const hasATerms = aTerms.length > 0;
            const hasBTerms = bTerms.length > 0;
            const hasNoTerms = !hasCommonTerms && !hasATerms && !hasBTerms;

            if (hasNoTerms && !termsData[termId]) {
                return null;
            }

            return (
                <div key={termId} className="mb-6 border-b pb-4">
                    <div className="font-bold text-lg mb-3">{termTitles[termId]}</div>

                    {loadingTerms[termId] ? (
                        <div>Loading...</div>
                    ) : termsData[termId] ? (
                        <div className="mb-4">
                            <div className="text-gray-600">1. {termsData[termId].label}</div>
                        </div>
                    ) : null}

                    {hasCommonTerms && (
                        <div className="mb-4">
                            <div className="font-semibold border-b pb-1 mb-2">Điều khoản chung</div>
                            {commonTerms.map((term, index) => (
                                <div key={`common-${index}`} className="mb-2 pl-3">
                                    {term?.label && (
                                        <div className="text-gray-600">{index + 1}. {term.label}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {hasATerms && (
                        <div className="mb-4">
                            <div className="font-semibold border-b pb-1 mb-2">Điều khoản riêng bên A</div>
                            {aTerms.map((term, index) => (
                                <div key={`a-${index}`} className="mb-2 pl-3">
                                    {term?.label && (
                                        <div className="text-gray-600">{index + 1}. {term.label}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {hasBTerms && (
                        <div className="mb-4">
                            <div className="font-semibold border-b pb-1 mb-2">Điều khoản riêng bên B</div>
                            {bTerms.map((term, index) => (
                                <div key={`b-${index}`} className="mb-2 pl-3">
                                    {term?.label && (
                                        <div className="text-gray-600">{index + 1}. {term.label}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        const allTermSections = Object.keys(termTitles).map((termId) => renderTermSection(Number(termId)));
        const hasAnyTerms = allTermSections.some((section) => section !== null);

        return (
            <div className="max-w-2xl max-h-[500px] overflow-auto px-4">
                {!hasAnyTerms && (
                    <div className="text-gray-500 italic">Chưa có điều khoản nào được chọn</div>
                )}
                {allTermSections}
            </div>
        );
    };

    // const getTermsContent = (fieldName) => {
    //     const fieldLabels = {
    //         legalBasis: 'Căn cứ pháp lý',
    //         generalTerms: 'Điều khoản chung',
    //         additionalTerms: 'Điều khoản bổ sung',
    //         rightsAndObligations: 'Quyền và nghĩa vụ các bên',
    //         warrantyTerms: 'Điều khoản bảo hành và bảo trì',
    //         breachTerms: 'Điều khoản về vi phạm và bồi thường',
    //         terminationTerms: 'Điều khoản về chấm dứt hợp đồng',
    //         disputeTerms: 'Điều khoản về giải quyết tranh chấp',
    //         privacyTerms: 'Điều khoản bảo mật'
    //     };

    //     // Mapping from field names to template data properties
    //     const templateDataMapping = {
    //         legalBasis: 'legalBasisTerms',
    //         generalTerms: 'generalTerms',
    //         additionalTerms: 'additionalTerms',
    //         rightsAndObligations: 'rightsAndObligationsTerms',
    //         warrantyTerms: 'warrantyTerms',
    //         breachTerms: 'breachTerms',
    //         terminationTerms: 'terminationTerms',
    //         disputeTerms: 'disputeTerms',
    //         privacyTerms: 'privacyTerms'
    //     };

    //     const terms = form.getFieldValue(fieldName) || [];

    //     // Dynamically get the corresponding template data based on the field name
    //     const templateProperty = templateDataMapping[fieldName];
    //     const valuefromDetail = templateDataSelected?.[templateProperty] || [];

    //     // Create a set to track unique term IDs
    //     const uniqueTermIds = new Set();
    //     const allUniqueTerms = [];

    //     // First add terms from template data
    //     if (valuefromDetail.length > 0) {
    //         valuefromDetail.forEach(term => {
    //             const termId = term.original_term_id;
    //             if (!uniqueTermIds.has(termId)) {
    //                 uniqueTermIds.add(termId);
    //                 allUniqueTerms.push(term);
    //             }
    //         });
    //     }

    //     // Then add terms from form that aren't already included
    //     if (terms.length > 0) {
    //         terms.forEach(term => {
    //             const termId = term.value || term.original_term_id;
    //             if (termId && !uniqueTermIds.has(termId)) {
    //                 uniqueTermIds.add(termId);
    //                 allUniqueTerms.push(term);
    //             }
    //         });
    //     }

    //     return (
    //         <div className="max-w-md max-h-96 overflow-auto">
    //             {allUniqueTerms.length > 0 ? (
    //                 allUniqueTerms.map((term, index) => (
    //                     <div key={index} className="mb-2 p-1 border-b last:border-b-0">
    //                         {term?.label && <div className="text-gray-600">{index + 1}. {term?.label}</div>}
    //                     </div>
    //                 ))
    //             ) : (
    //                 <div className="text-gray-500 italic">Chưa có {fieldLabels[fieldName].toLowerCase()} nào được chọn</div>
    //             )}
    //         </div>
    //     );
    // };

    const handleCheckboxChange = (checkedValues) => {
        setSelectedOthersTerms(checkedValues);
        const currentFields = form.getFieldsValue();
        const newFields = {};

        checkedValues.forEach((value) => {
            newFields[value] = currentFields[value] || {
                Common: [],
                A: [],
                B: [],
            };
        });

        form.setFieldsValue({
            ...currentFields,
            ...newFields,
        });
    };

    const termConfigs = {
        "1": {
            title: "ĐIỀU KHOẢN BỔ SUNG",
            loadData: loadDKBSData,
        },
        "2": {
            title: "QUYỀN VÀ NGHĨA VỤ CÁC BÊN",
            loadData: loadQVNVCBData,
        },
        "3": {
            title: "ĐIỀU KHOẢN BẢO HÀNH VÀ BẢO TRÌ",
            loadData: loadBHVBTData,
        },
        "4": {
            title: "ĐIỀU KHOẢN VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI",
            loadData: loadVPBTTHData,
        },
        "5": {
            title: "ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG",
            loadData: loadCDHDData,
        },
        "6": {
            title: "ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP",
            loadData: loadGQTCData,
        },
        "7": {
            title: "ĐIỀU KHOẢN BẢO MẬT",
            loadData: loadBMData,
        }
    };

    const generateContractNumber = (contractName, signingDate) => {
        if (!contractName || !signingDate) return '';

        // Extract initials from the contract name
        const initials = contractName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('');

        // Format the signing date
        const formattedDate = dayjs(signingDate).format('DD/MM/YYYY');

        // Combine initials and formatted date  
        return `${formattedDate}/${initials}`;
    };

    useEffect(() => {
        const formValues = form.getFieldsValue(['contractName', 'signingDate']);
        const contractNumber = generateContractNumber(formValues.contractName, formValues.signingDate);
        // form.setFieldsValue({ contractNumber });
    }, [form, form.getFieldValue('contractName'), form.getFieldValue('signingDate')]);


    const scrollToSection = (sectionRef, sectionId) => {
        if (sectionRef.current) {
            sectionRef.current.scrollIntoView({ behavior: 'smooth' });
            setActiveSection(sectionId);
        }
    };

    const scrollToTop = (e) => {
        e.stopPropagation();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Add scroll event listener
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const legalBasis = form.getFieldValue('legalBasisTerms');
        if (legalBasis && legalBasis.length > 0) {
            legalBasis.forEach(termId => {
                loadTermDetail(termId);
            });
        }
    }, [form.getFieldValue('legalBasisTerms'), changeCCPL])



    useEffect(() => {
        const legalBasis = form.getFieldValue('generalTerms');
        if (legalBasis && legalBasis.length > 0) {
            legalBasis.forEach(termId => {
                loadTermDetail(termId);
            });
        }
    }, [form.getFieldValue('generalTerms'), changeCCPL]);


    const handleScroll = useCallback(
        throttle(() => {
            const scrollPosition = window.scrollY + 50;
            const generalInfoPosition = generalInfoRef.current?.offsetTop || 0;
            const mainContentPosition = mainContentRef.current?.offsetTop || 0;
            const termsPosition = termsRef.current?.offsetTop || 0;
            const otherContentPosition = otherContentRef.current?.offsetTop || 0;

            // vị trí
            if (scrollPosition >= otherContentPosition) {
                setActiveSection('other');
            } else if (scrollPosition >= termsPosition) {
                setActiveSection('terms');
            } else if (scrollPosition >= mainContentPosition) {
                setActiveSection('main');
            } else {
                setActiveSection('general');
            }

            // nút scrol 
            if (window.scrollY > 400) {
                setShowScroll(true);
            } else {
                setShowScroll(false);
            }
        }, 200),
        []
    );

    const renderLegalBasisTerms = () => {
        if (!form.getFieldValue('legalBasisTerms') || form.getFieldValue('legalBasisTerms').length === 0) {
            return <p>Chưa có căn cứ pháp lý nào được chọn.</p>;
        }

        return form.getFieldValue('legalBasisTerms').map((termId, index) => {
            const term = termsData[termId];
            if (!term) {
                return (
                    <div key={termId} className="term-item p-1">
                        <Spin size="small" />
                    </div>
                );
            }

            return (
                <p key={index} className={`${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'}`}>
                    <i>- {term.value}</i>
                </p>
            );
        });
    };
    const renderGenaralTerms = () => {
        if (!form.getFieldValue('generalTerms') || form.getFieldValue('generalTerms').length === 0) {
            return <p>Chưa có căn cứ pháp lý nào được chọn.</p>;
        }

        return form.getFieldValue('generalTerms').map((termId, index) => {
            const term = termsData[termId];
            if (!term) {
                return (
                    <div key={termId} className="term-item p-1">
                        <Spin size="small" />
                    </div>
                );
            }

            return (
                <p key={index} className={`${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'}`}>
                    <p>- {term.value}</p>
                </p>
            );
        });
    };

    // Tải chi tiết điều khoản
    const loadTermDetail = async (termId) => {
        if (!termsData[termId]) {
            setLoadingTerms(prev => ({ ...prev, [termId]: true }));
            try {
                const response = await fetchTerms(termId).unwrap();
                setTermsData(prev => ({
                    ...prev,
                    [termId]: response.data
                }));
            } catch (error) {
                // console.error(`Error loading term ${termId}:`, error);
            } finally {
                setLoadingTerms(prev => ({ ...prev, [termId]: false }));
            }
        }
    };

    const handleOpenModalAddClause = (clauseId) => {
        setIsAddClauseModalOpen(true)
        setIsAddClauseId(clauseId)
    }

    const contentPopover = (
        <div>
            <p>1. Phần thanh toán của hợp đồng và các nội dung khác có thể có hoặc không.</p>
            <p>2. Thời gian có hiệu lực của hợp đồng sẽ bắt buộc sau ngày ký.</p>
            <p>3. Thời gian thanh toán các khoản trong hợp đồng sẽ nằm trong khoảng thời gian hiệu lực hợp đồng.</p>
        </div>
    );

    // Định nghĩa các cột của bảng

    const columns = [
        {
            title: 'STT',
            dataIndex: 'index',
            key: 'index',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'Nội dung',
            dataIndex: 'description',
            key: 'description',
            render: (text, record, index) => (
                <Form.Item
                    name={[index, 'description']}
                    rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập nội dung' }]}
                    noStyle
                >
                    <Input.TextArea placeholder="Nhập nội dung" rows={2} />
                </Form.Item>

            ),
        },
        {
            title: 'Giá tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (text, record, index) => (
                <Form.Item
                    name={[index, 'amount']}
                    rules={[
                        { required: true, message: 'Vui lòng nhập giá tiền' },

                    ]}

                    noStyle
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập giá tiền"
                        min={0}
                        max={100000000000}
                        onChange={(value) => {
                            if (value > 100000000000) {
                                message.warning('Giá tiền không được vượt quá 100 tỷ');
                            }
                        }}
                        formatter={(value) =>
                            value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫' : ''
                        }
                        parser={(value) => value.replace(/\D/g, '')}
                    />
                </Form.Item>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (text, record, index) => (
                <Button type="primary" onClick={() => remove(index)} danger>
                    <DeleteFilled />
                </Button>
            ),
        },
    ];

    // Các bước của form
    const steps = [
        {
            title: "Thông tin cơ bản",
            content: (
                <div className="space-y-4">
                    <div className="space-y-4">
                        <Form.Item
                            label="Loại hợp đồng"
                            name="contractType"
                            rules={[{ required: true, message: "Vui lòng chọn loại hợp đồng!" }]}
                        >
                            <LazySelectContractType
                                loadDataCallback={loadContractTypeData}
                                options={contractTypeData}
                                showSearch
                                labelInValue
                                placeholder="chọn loại hợp đồng"
                                onChange={(option) => {
                                    form.setFieldsValue({ contractName: option?.label });
                                }}
                                dropdownRender={(menu) => (
                                    <>
                                        {menu}
                                        <Divider style={{ margin: "8px 0" }} />
                                        <Space style={{ padding: "0 8px 4px" }}>
                                            <Input
                                                placeholder="Nhập loại hợp đồng mới"
                                                ref={inputRef}
                                                value={newTypeCreate}
                                                onChange={onNewTypeChange}
                                                onKeyDown={(e) => e.stopPropagation()}
                                            />
                                            <Button
                                                type="text"
                                                icon={<PlusOutlined />}
                                                onClick={addNewType}
                                                loading={isLoadingCreateType}
                                            >
                                                Thêm
                                            </Button>
                                        </Space>
                                    </>
                                )}
                            />
                        </Form.Item>

                        <Form.Item shouldUpdate={(prevValues, currentValues) =>
                            prevValues.contractType !== currentValues.contractType
                        }>
                            {({ getFieldValue }) => {
                                return getFieldValue('contractType') ? (
                                    <>
                                        <Form.Item
                                            label="Chọn mẫu hợp đồng"
                                            name="templateId"
                                            rules={[{ required: true, message: "Vui lòng chọn mẫu hợp đồng!" }]}
                                        >
                                            <LazySelectContractTemplate
                                                onChange={handleSelectTemplate}
                                                loadDataCallback={loadTemplateData}
                                                options={templateData?.content}
                                                showSearch
                                                labelInValue
                                                placeholder="Chọn mẫu hợp đồng"
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Chọn đối tác"
                                            name="partnerId"
                                            rules={[{ required: true, message: "Vui lòng chọn đối tác!" }]}
                                        >
                                            <LazySelectPartner
                                                loadDataCallback={loadPartnerData}
                                                options={partnerData?.data.content}
                                                showSearch
                                                placeholder="Chọn thông tin khách hàng"
                                                dropdownRender={(menu) => (
                                                    <>
                                                        {menu}
                                                        <Divider style={{ margin: "8px 0" }} />
                                                        <Space style={{ padding: "0 8px 4px" }}>
                                                            <Button type="primary" icon={FcNext} onClick={handleCreatePartner}>
                                                                Thêm thông tin khách hàng
                                                            </Button>
                                                        </Space>
                                                    </>
                                                )}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            label="Tên hợp đồng"
                                            name="contractName"
                                            rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên hợp đồng!" }]}
                                        >
                                            <Input placeholder="Nhập tên hợp đồng" />
                                        </Form.Item>
                                    </>
                                ) : null;
                            }}
                        </Form.Item>
                    </div>
                </div>
            ),
        },
        {
            title: "Chi tiết hợp đồng",
            content: (
                <div className="space-y-4 w-full">
                    <Row gutter={16}>
                        <Col xs={24} md={5} className="sticky" style={{ top: '90px', maxHeight: 'calc(100vh - 40px)', overflow: 'auto', marginRight: '25px' }}>
                            <div className={`${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'} p-4 pb-1 rounded-md shadow-md mb-4`}>
                                <Timeline
                                    mode="left"
                                    className="mt-8 "
                                    items={[
                                        {
                                            color: 'green',
                                            children: (
                                                <div onClick={() => scrollToSection(generalInfoRef, 'general')}>
                                                    <p className={`cursor-pointer font-bold ${activeSection === 'general' ? 'font-bold text-blue-500' : ''}`}>
                                                        I. THÔNG TIN CHUNG
                                                    </p>
                                                    <div className="ml-4 mt-2 flex flex-col gap-1 text-sm">
                                                        <div className="mt-1 cursor-pointer">
                                                            {form.getFieldValue('contractName') ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) : <p className="mr-[5px]"></p>}
                                                            1. Tiêu đề hợp đồng
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {(form.getFieldValue('contractLocation') && form.getFieldValue('signingDate')) ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) : <p className="mr-[5px]"></p>}
                                                            2. Địa điểm, ngày ký
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {form.getFieldValue('partnerId') ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) : <p className="mr-[5px]"></p>}
                                                            2. Thông tin các bên
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {form.getFieldValue('legalBasisTerms') && form.getFieldValue('legalBasisTerms').length > 0 ? (
                                                                <CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />
                                                            ) : (
                                                                <span className="mr-[20px]"></span>
                                                            )}
                                                            3. Căn cứ pháp lý
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            color: 'blue',
                                            children: (
                                                <div
                                                    onClick={() => scrollToSection(mainContentRef, 'main')}
                                                >
                                                    <p className={`cursor-pointer font-bold ${activeSection === 'main' ? 'font-bold text-blue-500' : ''}`}>
                                                        II. NỘI DUNG CHÍNH
                                                    </p>
                                                    <div className="ml-4 mt-2 flex flex-col gap-1 text-sm">
                                                        <div className="mt-1 cursor-pointer">
                                                            {content ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
                                                            4. Nội dung hợp đồng
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {(form.getFieldValue('totalValue') && form.getFieldValue('payments') && form.getFieldValue('payments').length > 0) ? (
                                                                <CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />
                                                            ) : (
                                                                <span className="mr-[20px]"></span>
                                                            )}
                                                            5. Giá trị và thanh toán
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {(form.getFieldValue('effectiveDate') && form.getFieldValue('expiryDate')) ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
                                                            6. Thời gian hiệu lực
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            color: 'red',
                                            children: (
                                                <div

                                                    onClick={() => scrollToSection(termsRef, 'terms')}
                                                >
                                                    <p className={`cursor-pointer font-bold ${activeSection === 'terms' ? 'font-bold text-blue-500' : ''}`}>
                                                        III. ĐIỀU KHOẢN VÀ CAM KẾT
                                                    </p>
                                                    <div className="ml-4 mt-2 flex flex-col gap-1 text-sm">
                                                        <div className="mt-1 cursor-pointer">
                                                            {(form.getFieldValue('generalTerms') && form.getFieldValue('generalTerms').length > 0) ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
                                                            7. Điều khoản chung
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {selectedOthersTerms.length > 0 ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
                                                            8. Điều khoản khác
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            color: 'gray',
                                            children: (
                                                <div

                                                    onClick={() => scrollToSection(otherContentRef, 'other')}
                                                >
                                                    <p className={`cursor-pointer font-bold ${activeSection === 'other' ? 'font-bold text-blue-500' : ''}`}>
                                                        IV. CÁC NỘI DUNG KHÁC
                                                    </p>
                                                    <div className="ml-4 mt-2 flex flex-col gap-1 text-sm">
                                                        <div className="mt-1 cursor-pointer">
                                                            {isAppendixEnabled ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
                                                            10. Phụ lục
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {(isAutoRenew || isTransferEnabled || isViolate) ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
                                                            11. Các nội dung khác
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        },
                                        {
                                            children: <p className="cursor-pointer mt-6" onClick={() => scrollToSection(otherContentRef, 'other')}> Hoàn thành  </p>,
                                        }
                                    ]}
                                />
                            </div>

                        </Col>
                        <Col xs={24} md={18}>
                            <div ref={generalInfoRef}>
                                <div className="relative mt-[70px]">

                                    <Popover placement="topLeft" content={contentPopover} className="absolute top-3" title="Lưu ý khi tạo hợp đồng" trigger="click">
                                        <Button type="link" icon={<InfoCircleOutlined />}>Lưu ý</Button>
                                    </Popover>
                                    <div className={`${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'} p-4 py-10 rounded-md text-center mt-[-70px]`}>
                                        <p className="font-bold text-lg">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                        <p className="font-bold"> Độc lập - Tự do - Hạnh phúc</p>
                                        <p>-------------------</p>
                                        {/* <p className="text-right mr-[10%]">Ngày .... Tháng .... Năm .......</p> */}
                                        <p className="text-2xl font-bold mt-10">{form.getFieldValue('contractName')?.toUpperCase()}</p>
                                        <Form.Item
                                            name="contractNumberFormat"
                                            label="Cách tạo số hợp đồng"
                                            rules={[{ required: true, message: "Vui lòng chọn cách tạo số hợp đồng" }]}
                                        >
                                            <Select placeholder="Chọn cách tạo số hợp đồng">
                                                <Select.Option value="1">
                                                    [Tên viết tắt doanh nghiệp tạo] / [Tên viết tắt khách hàng] / [Loại hợp đồng] / [DDMMYY]-[Số thứ tự]
                                                </Select.Option>
                                                <Select.Option value="2">
                                                    [Viết tắt hợp đồng] - [Loại hợp đồng] / [Ngày/Tháng/Năm]-[Số thứ tự]
                                                </Select.Option>
                                                <Select.Option value="3">
                                                    [Viết tắt hợp đồng] / [Tên viết tắt khách hàng] / [Ngày/Tháng/Năm]-[Số thứ tự]
                                                </Select.Option>
                                                <Select.Option value="4">
                                                    [Loại hợp đồng] / [Tên viết tắt doanh nghiệp tạo] / [Ngày/Tháng/Năm]-[Số thứ tự]
                                                </Select.Option>
                                                <Select.Option value="5">
                                                    [Loại hợp đồng]-[Tên viết tắt doanh nghiệp tạo] / [Tên viết tắt khách hàng] / [DD/MM/YY]-[Số thứ tự]
                                                </Select.Option>
                                                <Select.Option value="6">
                                                    [Viết tắt hợp đồng] / [Tên viết tắt khách hàng] / [Loại hợp đồng] / [DDMMYY]-[Số thứ tự]
                                                </Select.Option>
                                            </Select>
                                        </Form.Item>

                                    </div>
                                </div>
                                <div className=" flex items-center gap-3 mt-5">
                                    <Form.Item
                                        label="Nơi ký kết"
                                        name="contractLocation"
                                        className="min-w-[250px]"
                                        rules={[{ required: true, message: "Vui lòng chọn nơi ký kết hợp đồng!" }]}
                                    >
                                        <Select
                                            showSearch
                                            placeholder="Chọn nơi ký kết"
                                            optionFilterProp="children"
                                            className="min-w-[170px]"
                                            filterOption={(input, option) =>
                                                (option?.value ?? '').toLowerCase().includes(input.toLowerCase())
                                            }
                                        >
                                            {VietnameseProvinces.map((province) => (
                                                <Option key={province} value={province}>
                                                    {province}
                                                </Option>
                                            ))}
                                        </Select>
                                    </Form.Item>

                                    <Form.Item style={{ display: 'none' }} name="contractNumber" />

                                    <Form.Item
                                        label="Ngày ký kết"
                                        name="signingDate"
                                        dependencies={['effectiveDate']} // Phụ thuộc vào ngày có hiệu lực
                                        rules={[
                                            { required: true, message: "Ngày ký kết không được để trống!" },
                                            ({ getFieldValue }) => ({
                                                validator(_, value) {
                                                    const effectiveDate = getFieldValue('effectiveDate');
                                                    if (!effectiveDate || !value) {
                                                        return Promise.resolve();
                                                    }
                                                    if (value.isBefore(effectiveDate) || value.isSame(effectiveDate)) {
                                                        return Promise.resolve();
                                                    }
                                                    return Promise.reject(new Error('Ngày ký kết phải trước hoặc cùng ngày có hiệu lực!'));
                                                },
                                            }),
                                        ]}

                                    >
                                        <DatePicker
                                            className="w-full"
                                            format="DD/MM/YYYY"
                                            disabledDate={(current) => {
                                                const isPast = current && current < dayjs().startOf('day');
                                                // const effectiveDate = form.getFieldValue('effectiveDate');
                                                // const isAfterEffective = effectiveDate && current && current > dayjs(effectiveDate).startOf('day');
                                                return isPast
                                            }}
                                        />

                                    </Form.Item>
                                </div>

                                {/* Render đoạn text hiển thị ngày và địa điểm khi cả 2 trường đã được chọn */}

                                <Form.Item
                                    className="w-full mt-3"
                                    label={
                                        <div className="flex justify-between items-center gap-4">
                                            <p>Căn phứ pháp lý</p>
                                        </div>
                                    }
                                    name='legalBasisTerms'
                                    rules={[{ required: true, message: "Vui lòng chọn căn cứ pháp lý!" }]}
                                >
                                    <LazyLegalSelect
                                        onChange={() => setChangeCCPL(!changeCCPL)}
                                        options={legalData?.data?.content}
                                        loadDataCallback={loadLegalData}
                                        showSearch
                                        autoClearSearchValue
                                        mode="multiple"
                                        placeholder="Chọn căn cứ pháp lý"
                                        dropdownRender={(menu) => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: "8px 0" }} />
                                                <Space style={{ padding: "0 8px 4px" }}>
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={hanldeOpenAddLegalModal}>
                                                        Thêm căn cứ
                                                    </Button>
                                                </Space>
                                            </>
                                        )}
                                    />
                                </Form.Item>

                                <div className={`px-4 pt-6 flex pl-10 flex-col gap-2 mt-10 rounded-md ${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'}`}>
                                    {renderLegalBasisTerms()}
                                    <Form.Item shouldUpdate={(prevValues, currentValues) =>
                                        prevValues.contractLocation !== currentValues.contractLocation ||
                                        prevValues.signingDate !== currentValues.signingDate
                                    }>
                                        {({ getFieldValue }) => {
                                            const contractLocation = getFieldValue('contractLocation');
                                            const signingDate = getFieldValue('signingDate');
                                            if (contractLocation && signingDate) {
                                                return (
                                                    <div className={` p-1 rounded-lg`}>
                                                        Hôm nay, Hợp đồng dịch vụ này được lập vào ngày{" "}
                                                        {dayjs(signingDate).format("DD")} tháng{" "}
                                                        {dayjs(signingDate).format("MM")} năm{" "}
                                                        {dayjs(signingDate).format("YYYY")}, tại {contractLocation}, bởi và giữa:
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    </Form.Item>
                                </div>

                                <div gutter={16} className={`${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'} p-6 rounded-md gap-7 mt-[-10px]`} justify={"center"}>
                                    {isLoadingBsData ? (
                                        <Skeleton active paragraph={{ rows: 4 }} />
                                    ) : (
                                        <div className="flex flex-col gap-2 pl-4 " md={10} sm={24} >
                                            <p className="font-bold text-lg "><u>BÊN CUNG CẤP (BÊN A)</u></p>
                                            <p className="text-sm "><b>Tên công ty:</b> {bsInfor?.data.partnerName}</p>
                                            <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {bsInfor?.data.address}</p>
                                            <p className="flex text-sm justify-between"><p><b>Người đại diện:</b> {bsInfor?.data.spokesmanName} </p></p>
                                            <p className="text-sm"><b>Chức vụ:</b> {bsInfor?.data.position || "chưa cập nhật"}</p>
                                            <p className='flex text-sm  justify-between'><p><b>Mã số thuế:</b> {bsInfor?.data.taxCode}</p></p>
                                            <p className="text-sm"><b>Email:</b> {bsInfor?.data.email}</p>
                                        </div>
                                    )}
                                    {isLoadingInfoPartner ? (
                                        <Skeleton active paragraph={{ rows: 4 }} />
                                    ) : (
                                        <div ref={containerRef} className="flex flex-col gap-2 mt-4 pl-4" md={10} sm={24}>
                                            <p className="font-bold text-lg "><u>Bên thuê (Bên B)</u></p>
                                            <p className="text-sm "><b>Tên công ty: </b>{partnerDetail?.data.partnerName}</p>
                                            <p className="text-sm"><b>Địa chỉ trụ sở chính: </b>{partnerDetail?.data.address}</p>
                                            <p className="flex  text-sm justify-between"><p><b>Người đại diện:</b> {partnerDetail?.data.spokesmanName}</p></p>
                                            <p className="text-sm"><b>Chức vụ: {partnerDetail?.data.position}</b> </p>
                                            <p className='flex text-sm justify-between'><p><b>Mã số thuế:</b> {partnerDetail?.data.taxCode}</p></p>
                                            <p className="text-sm"><b>Email:</b> {partnerDetail?.data.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div ref={mainContentRef}>
                                <Form.Item
                                    label=" Soạn thảo nội dung hợp đồng"
                                    name="contractContent"
                                    className="mt-5"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung hợp đồng!" }]}
                                >
                                    <Suspense fallback={<Skeleton active paragraph={{ rows: 10 }} />}>
                                        <RichTextEditor
                                            output="html"
                                            content={content}
                                            onChangeContent={onValueChange}
                                            extensions={extensions}
                                            dark={isDarkMode}
                                            hideBubble={true}
                                            dense={false}
                                            removeDefaultWrapper
                                            placeholder="Nhập nội dung hợp đồng tại đây..."
                                            contentClass="max-h-[400px] overflow-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-track]:bg-gray-200"
                                        />
                                    </Suspense>
                                </Form.Item>


                                <Divider orientation="center" className="text-lg">Thời gian và hiệu lực</Divider>
                                <Form.Item
                                    label="Thời gian hiệu lực hợp đồng"
                                    name="dateRange"
                                    rules={[
                                        { required: true, message: "Vui lòng chọn thời gian hiệu lực hợp đồng!" },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || value.length !== 2) {
                                                    return Promise.resolve();
                                                }
                                                const [effectiveDate, expiryDate] = value;
                                                const signingDate = getFieldValue('signingDate');

                                                // Kiểm tra effectiveDate phải sau signingDate
                                                if (signingDate && effectiveDate.isBefore(signingDate)) {
                                                    return Promise.reject(new Error('Ngày bắt đầu hiệu lực phải sau ngày ký kết!'));
                                                }

                                                // Kiểm tra expiryDate phải sau effectiveDate và không được trùng nhau
                                                if (expiryDate.isSame(effectiveDate) || expiryDate.isBefore(effectiveDate)) {
                                                    return Promise.reject(new Error('Ngày kết thúc hiệu lực phải sau ngày bắt đầu!'));
                                                }

                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <DatePicker.RangePicker
                                        className="w-full"
                                        showTime={{ format: 'HH:mm' }}
                                        format="DD/MM/YYYY HH:mm"
                                        placeholder={["Ngày bắt đầu có hiệu lực", "Ngày kết thúc hiệu lực"]}
                                        disabledDate={(current) => {
                                            const signingDate = form.getFieldValue('signingDate');
                                            if (!current) return false;
                                            // Không cho chọn ngày trước hôm nay hoặc trước signingDate
                                            return current < dayjs().startOf('day') || (signingDate && current <= signingDate);
                                        }}
                                        onChange={(dates) => {
                                            if (dates) {
                                                form.setFieldsValue({
                                                    effectiveDate: dates[0],
                                                    expiryDate: dates[1],
                                                });
                                                handleEffectiveDateChange(dates[0]);
                                                handleExpiryDateChange(dates[1]);
                                            } else {
                                                form.setFieldsValue({
                                                    effectiveDate: null,
                                                    expiryDate: null,
                                                    notifyEffectiveDate: null,
                                                    notifyExpiryDate: null,
                                                });
                                            }
                                        }}
                                    />
                                </Form.Item>
                                <Form.Item
                                    name="effectiveDate"
                                    hidden
                                    rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu hiệu lực!" }]}
                                />
                                <Form.Item
                                    name="expiryDate"
                                    hidden
                                    rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc hiệu lực!" }]}
                                />

                                <Form.Item
                                    label="Tự động gia hạn khi hết hạn mà không có khiếu nại"
                                    name="autoRenew"
                                    valuePropName="checked"
                                    noStyle

                                >
                                    <div className="flex items-center">
                                        <Switch
                                            className="mr-4"
                                            onChange={(checked) => {
                                                form.setFieldsValue({ autoRenew: checked });
                                                setIsAutoRenew(checked);
                                            }}
                                            checked={form.getFieldValue('autoRenew') ?? isAutoRenew} />
                                        <p className="text-sm">Tự động gia hạn khi hết hạn mà không có khiếu nại</p>
                                    </div>
                                </Form.Item>


                                <Divider orientation="center" className="text-lg">Hạng mục thanh toán</Divider>
                                <Form.List
                                    name="contractItems"
                                // rules={[
                                //     {
                                //         validator: async (_, contractItems) => {
                                //             if (!contractItems || contractItems.length < 1) {
                                //                 return Promise.reject(new Error('Phải có ít nhất một hạng mục'));
                                //             }
                                //         },
                                //     },
                                // ]}
                                >
                                    {(fields, { add, remove }) => {
                                        // Gán remove vào biến toàn cục để sử dụng trong cột "Hành động"
                                        window.remove = remove;
                                        return (
                                            <>
                                                <Table
                                                    dataSource={fields}
                                                    columns={columns}
                                                    pagination={false}
                                                    rowKey={(record) => record.key}
                                                />
                                                <Button type="primary" onClick={() => add()} style={{ marginTop: 16 }}>
                                                    <PlusOutlined />
                                                </Button>
                                            </>
                                        );
                                    }}
                                </Form.List>

                                <div className="mt-4    ">
                                    <Form.Item name="totalValue" label="Tổng giá trị hợp đồng">
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            readOnly
                                            formatter={(value) =>
                                                value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫' : ''
                                            }
                                        />
                                    </Form.Item>
                                    {textValue && (
                                        <div className="mt-1 ml-1" ref={mainContentRef}>
                                            <Typography.Text type="secondary">
                                                (Bằng chữ: <span className="font-bold">{textValue}</span>)
                                            </Typography.Text>
                                        </div>
                                    )}
                                </div>

                                <Divider orientation="center">Thanh toán</Divider>

                                {form.getFieldValue('totalValue') > 0 && (
                                    <div>
                                        <Tooltip title="chọn ngày có hiệu lực và hết hiệu lực trước khi chọn ngày thanh toán">
                                            <Button type="link" size="large">Lưu ý<InfoCircleOutlined /></Button>
                                        </Tooltip>
                                        <Form.List
                                            name="payments"
                                            className="w-full"
                                            rules={[
                                                {
                                                    validator: async (_, payments) => {

                                                        // const effectiveDate = form.getFieldValue('effectiveDate');
                                                        // if (!effectiveDate) {
                                                        //     return Promise.reject(
                                                        //         new Error('Vui lòng chọn ngày có hiệu lực hợp đồng trước khi tạo đợt thanh toán!')
                                                        //     );
                                                        // }

                                                        if (!payments || payments.length < 1) {
                                                            return Promise.reject(new Error('Vui lòng thêm ít nhất một đợt thanh toán phù hợp với hạng mục!'));
                                                        }

                                                        const totalValue = form.getFieldValue('totalValue');
                                                        if (!totalValue) {
                                                            return Promise.reject(new Error('Vui lòng nhập các hạng mục thanh toán trước trước!'));
                                                        }

                                                        const totalPayments = payments.reduce((sum, payment) => {
                                                            return sum + (Number(payment.amount) || 0);
                                                        }, 0);

                                                        if (Math.abs(totalPayments - totalValue) > 0.01) {
                                                            return Promise.reject(new Error(`Tổng số tiền các đợt thanh toán (${new Intl.NumberFormat('vi-VN').format(totalPayments)} VND) phải bằng tổng giá trị hợp đồng (${new Intl.NumberFormat('vi-VN').format(totalValue)} VND)!`));
                                                        }
                                                    },
                                                },
                                            ]}
                                        >
                                            {(fields, { add, remove }) => (
                                                <>
                                                    {fields.map(({ key, name, ...restField }) => (
                                                        <Space key={key} align="baseline" className="flex mb-4 items-center w-full">
                                                            {/* <Form.Item
                                                        {...restField}
                                                        name={[name, "paymentContent"]}
                                                        rules={[{ required: true, message: "Nhập nội dung thanh toán" }]}
                                                    >
                                                        <Input.TextArea placeholder="Nhập nội dung" rows={2} />
                                                    </Form.Item> */}
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, "amount"]}
                                                                rules={[{ required: true, message: "Nhập số tiền thanh toán" }]}
                                                            >
                                                                <InputNumber
                                                                    style={{ width: "100%" }}
                                                                    placeholder="Số tiền"
                                                                    min={0}
                                                                    max={1000000000000000}
                                                                    formatter={(value) =>
                                                                        value
                                                                            ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ₫"
                                                                            : ""
                                                                    }
                                                                    parser={(value) => value.replace(/\D/g, "")}
                                                                />
                                                            </Form.Item>

                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, "paymentDate"]}
                                                                rules={[
                                                                    { required: true, message: "Chọn ngày thanh toán" },
                                                                    ({ getFieldValue }) => ({
                                                                        validator(_, value) {
                                                                            const effectiveDate = getFieldValue('effectiveDate');
                                                                            const expiryDate = getFieldValue('expiryDate');

                                                                            // Nếu chưa chọn ngày hoặc chưa có ngày hiệu lực, không cần validate
                                                                            if (!value || !effectiveDate || !expiryDate) {
                                                                                return Promise.resolve();
                                                                            }

                                                                            // Kiểm tra nếu ngày nằm trong khoảng [effectiveDate, expiryDate]
                                                                            if (
                                                                                value.isSame(effectiveDate, 'day') ||
                                                                                value.isSame(expiryDate, 'day') ||
                                                                                (value.isAfter(effectiveDate, 'day') && value.isBefore(expiryDate, 'day'))
                                                                            ) {
                                                                                return Promise.resolve();
                                                                            }

                                                                            return Promise.reject(
                                                                                new Error('Ngày thanh toán phải nằm trong khoảng thời gian hiệu lực hợp đồng!')
                                                                            );
                                                                        },
                                                                    })

                                                                ]}
                                                            >
                                                                <DatePicker
                                                                    style={{ width: 150 }}
                                                                    placeholder="Ngày thanh toán"
                                                                    disabledDate={(current) => {
                                                                        const effectiveDate = form.getFieldValue('effectiveDate');
                                                                        const expiryDate = form.getFieldValue('expiryDate');
                                                                        if (current.isBefore(dayjs(), 'day')) {
                                                                            return true;
                                                                        }
                                                                        if (
                                                                            (effectiveDate && current.isBefore(effectiveDate, 'day')) ||
                                                                            (expiryDate && current.isAfter(expiryDate, 'day'))
                                                                        ) {
                                                                            return true;
                                                                        }
                                                                        return false;
                                                                    }}
                                                                    format="DD/MM/YYYY"
                                                                    onChange={(date) => handlePaymentDateChange(date, name)}
                                                                />

                                                            </Form.Item>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, "paymentMethod"]}
                                                                rules={[{ required: true, message: "Chọn phương thức thanh toán" }]}
                                                            >
                                                                <Select placeholder="Phương thức thanh toán" style={{ width: 200 }}>
                                                                    <Option value="transfer">Chuyển khoản</Option>
                                                                    <Option value="cash">Tiền mặt</Option>
                                                                    <Option value="creditCard">Thẻ tín dụng</Option>
                                                                </Select>
                                                            </Form.Item>
                                                            <Form.Item>
                                                                <Button type="primary" onClick={() => remove(name)} danger>
                                                                    <DeleteFilled />
                                                                </Button>
                                                            </Form.Item>
                                                        </Space>
                                                    ))}
                                                    <Button icon={<PlusOutlined />} type="primary" onClick={() => add()} block>
                                                        Thêm đợt thanh toán
                                                    </Button>
                                                </>
                                            )}
                                        </Form.List>
                                    </div>
                                )}
                                <div className="flex items-center gap-5 mt-[50px]">
                                    <Form.Item name="autoAddVAT" valuePropName="checked">
                                        <div className="flex items-center min-w-[350px]">
                                            <Switch
                                                className="mr-4"
                                                onChange={(checked) => {
                                                    form.setFieldsValue({ autoAddVAT: checked });
                                                    setIsVATChecked(checked);
                                                }}
                                                checked={form.getFieldValue("autoAddVAT") ?? isVATChecked}
                                            />
                                            <p className="text-sm">Tự động thêm VAT vào hợp đồng</p>
                                        </div>
                                    </Form.Item>

                                    {isVATChecked && (
                                        <Form.Item
                                            name="vatPercentage"
                                            rules={[{ required: true, message: "Vui lòng nhập phần trăm VAT!" }]}
                                        >
                                            <Input
                                                type="number"
                                                className="w-[150px]"
                                                placeholder="Nhập phần trăm VAT"
                                                addonAfter="%"
                                                max={100}
                                                min={0}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value, 10);
                                                    if (value < 0 || value > 100) {
                                                        message.error("Phần trăm VAT phải nằm trong khoảng 0 đến 100.");
                                                        form.setFieldsValue({ vatPercentage: null });
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    )}
                                </div>
                                <div className="flex items-center gap-5 mt-5">
                                    <Form.Item name="isDateLateChecked" valuePropName="checked">
                                        <div className="flex items-center min-w-[350px]">
                                            <Switch
                                                className="mr-4"
                                                onChange={(checked) => {
                                                    form.setFieldsValue({ isDateLateChecked: checked });
                                                    setIsDateLateChecked(checked);
                                                }}
                                                checked={form.getFieldValue("isDateLateChecked") ?? isDateLateChecked}
                                            />
                                            <p className="text-sm">Cho phép thanh toán trễ hạn tối đa (ngày)</p>
                                        </div>
                                    </Form.Item>

                                    {isDateLateChecked && (
                                        <Form.Item
                                            name="maxDateLate"
                                            rules={[{ required: true, message: "Vui lòng nhập số ngày trễ tối đa" }]}
                                        >
                                            <Input
                                                type="number"
                                                className="w-[150px]"
                                                placeholder="Vui lòng nhập số ngày trễ tối đa"
                                                addonAfter="ngày"
                                                min={0}
                                                onChange={(e) => {
                                                    const value = parseInt(e.target.value, 10);
                                                    if (value < 0) {
                                                        message.error("Phần trăm VAT phải nằm trong khoảng 0 đến 100.");
                                                        form.setFieldsValue({ maxDateLate: null });
                                                    }
                                                }}
                                            />
                                        </Form.Item>
                                    )}
                                </div>

                            </div>
                            <div ref={termsRef}>
                                <Divider ref={termsRef} orientation="center" className="text-lg">Điều khoản & Cam kết</Divider>
                                <div className=" ml-2 my-3 ">
                                    <p className="font-bold text-[16px] mb-1"> Điều khoản chung</p>
                                    <p className="">Mô tả: (Điều khoản được áp dụng cho cả 2 bên) </p>
                                </div>
                                <Form.Item
                                    label={
                                        <div className="flex justify-between items-center gap-4">
                                            <p>Điều khoản chung </p>
                                            {/* <Popover
                                                content={() => getTermsContent('generalTerms')}
                                                title="Danh sách Điều khoản chung đã chọn"
                                                trigger="hover"
                                                placement="right"
                                            >
                                                <Button icon={<EyeFilled />} />
                                            </Popover> */}
                                        </div>
                                    }
                                    name="generalTerms"
                                    rules={[{ required: true, message: "Vui lòng chọn điều khoản chung!" }]}
                                    className="ml-2"
                                >
                                    <LazySelect
                                        loadDataCallback={loadGenaralData}
                                        options={generalData?.data.content}
                                        showSearch
                                        mode="multiple"
                                        placeholder="Chọn điều khoản chung"
                                        onChange={handleSelectChange}
                                        dropdownRender={(menu) => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: "8px 0" }} />
                                                <Space style={{ padding: "0 8px 4px" }}>
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModalAddClause(9)}>
                                                        Thêm điều khoản
                                                    </Button>
                                                </Space>
                                            </>
                                        )}
                                    />
                                </Form.Item>
                                <div className={`px-4 py-6 flex pl-10 flex-col gap-2 mt-10 rounded-md ${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'}`}>
                                    {renderGenaralTerms()}
                                </div>

                                <Form.Item
                                    label={
                                        <div className="ml-2 my-3 font-bold text-[16px] flex justify-between items-center gap-5">
                                            <p> Các loại điều khoản </p>

                                            {selectedOthersTerms.length > 0 && (
                                                <Popover
                                                    content={getAllAdditionalTermsContent}
                                                    title="Xem trước tất cả điều khoản đã chọn"
                                                    trigger="click"
                                                    placement="right"
                                                    overlayStyle={{ maxWidth: '70vw' }}
                                                >
                                                    <Button icon={<EyeFilled />}>Xem trước tất cả</Button>
                                                </Popover>
                                            )}
                                        </div>
                                    }
                                    name="additionalTerms"
                                >
                                    <Checkbox.Group
                                        className="flex flex-col ml-4 gap-4"
                                        options={[
                                            { label: "ĐIỀU KHOẢN BỔ SUNG", value: 1 },
                                            { label: "QUYỀN VÀ NGHĨA VỤ CÁC BÊN", value: 2 },
                                            { label: "ĐIỀN KHOẢN BẢO HÀNH VÀ BẢO TRÌ", value: 3 },
                                            { label: "ĐIỀU KHOẢN VỀ VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI", value: 4 },
                                            { label: "ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG", value: 5 },
                                            { label: "ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP", value: 6 },
                                            { label: "ĐIỀU KHOẢN BẢO MẬT", value: 7 }
                                        ]}
                                        onChange={handleCheckboxChange}
                                    />
                                </Form.Item>

                                <div className="flex flex-col">
                                    {selectedOthersTerms.map(termId => (
                                        <TermSection
                                            key={termId}
                                            termId={termId}
                                            title={termConfigs[termId].title}
                                            form={form}
                                            loadDataCallback={termConfigs[termId].loadData}
                                        />
                                    ))}
                                </div>


                                <Divider orientation="center">Điều khoản khác</Divider>

                                <Form.Item
                                    label={
                                        <div className="flex justify-between items-center gap-4">
                                            <p>Điều khoản khác </p>
                                            {/* <Popover
                                                content={() => getTermsContent('generalTerms')}
                                                title="Danh sách Điều khoản chung đã chọn"
                                                trigger="hover"
                                                placement="right"
                                            >
                                                <Button icon={<EyeFilled />} />
                                            </Popover> */}
                                        </div>
                                    }
                                    name="otherTerms"
                                    // rules={[{ required: true, message: "Vui lòng chọn điều khoản khác!" }]}
                                    className="ml-2"
                                >
                                    <LazySelect
                                        loadDataCallback={loadDKKata}
                                        options={generalData?.data.content}
                                        showSearch
                                        mode="multiple"
                                        placeholder="Chọn điều khoản khác"
                                        onChange={handleSelectOthersTermsChange}
                                        dropdownRender={(menu) => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: "8px 0" }} />
                                                <Space style={{ padding: "0 8px 4px" }}>
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModalAddClause(10)}>
                                                        Thêm điều khoản
                                                    </Button>
                                                </Space>
                                            </>
                                        )}
                                    />
                                </Form.Item>
                                {/* <Form.Item
                                    label={
                                        <div className="ml-2 my-3">
                                            <p className="font-bold text-[16px]"> ĐIỀU KHOẢN ĐẶC BIỆT BÊN A</p>
                                            <p className="">Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên A) </p>
                                        </div>
                                    }
                                    name="specialTermsA"
                                >
                                    <TextArea rows={4}
                                        placeholder="Nhập điều khoản bên A"
                                    />
                                </Form.Item>
                                <Form.Item
                                    label={
                                        <div className="ml-2 my-3">
                                            <p className="font-bold text-[16px]"> ĐIỀU KHOẢN ĐẶC BIỆT BÊN B</p>
                                            <p className="">Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên B) </p>
                                        </div>
                                    }
                                    name="specialTermsB"
                                >
                                    <TextArea rows={4}
                                        placeholder="Nhập điều khoản bên B"
                                    />
                                </Form.Item> */}
                            </div>

                            <div ref={otherContentRef} className="py-[100px]">
                                <Divider orientation="center">Các nội dung khác</Divider>

                                {/* <Form.Item name="appendixEnabled" valuePropName="checked">
                                    <div className="flex items-center">
                                        <Switch
                                            className="mr-4"
                                            onChange={(checked) => {
                                                form.setFieldsValue({ appendixEnabled: checked });
                                                setIsAppendixEnabled(checked);
                                            }}
                                            checked={form.getFieldValue("appendixEnabled") ?? isAppendixEnabled}
                                        />
                                        <p className="text-sm">Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>
                                    </div>
                                </Form.Item> */}

                                <Form.Item name="transferEnabled" valuePropName="checked">
                                    <div className="flex items-center">
                                        <Switch
                                            className="mr-4"
                                            onChange={(checked) => {
                                                form.setFieldsValue({ transferEnabled: checked });
                                                setIsTransferEnabled(checked);
                                            }}
                                            checked={form.getFieldValue("transferEnabled") ?? isTransferEnabled}
                                        />
                                        <p className="text-sm"> Cho phép chuyển nhượng hợp đồng</p>
                                    </div>
                                </Form.Item>

                                <Form.Item name="violate" valuePropName="checked">
                                    <div className="flex items-center">
                                        <Switch
                                            className="mr-4"
                                            onChange={(checked) => {
                                                form.setFieldsValue({ violate: checked });
                                                setIsisViolate(checked);
                                            }}
                                            checked={form.getFieldValue("violate") ?? isViolate}
                                        />
                                        <p className="text-sm"> Cho phép đơn phương hủy hợp đồng nếu vi phạm các quy định trong điều khoản hợp đồng</p>
                                    </div>
                                </Form.Item>

                                <Form.Item name="suspend" valuePropName="checked">
                                    <div className="flex items-center">
                                        <Switch
                                            className="mr-4"
                                            onChange={(checked) => {
                                                form.setFieldsValue({ suspend: checked });
                                                setIsSuspend(checked);
                                            }}
                                            checked={form.getFieldValue("suspend") ?? isSuspend}
                                        />
                                        <p className="text-sm">Cho phép tạm ngưng hợp đồng trong các trường hợp bất khả kháng được ghi rõ</p>
                                    </div>
                                </Form.Item>

                                {isSuspend && (
                                    <Form.Item
                                        label="trường hợp"
                                        name="suspendContent"
                                        rules={[{ required: true, message: "Vui lòng nhập rõ trường hợp tạm ngưng!" }]}
                                    >
                                        <TextArea
                                            className="w-[450px]"
                                            placeholder="Nhập nội dung"
                                            rows={4}
                                        />
                                    </Form.Item>
                                )}
                            </div>
                        </Col>

                    </Row>
                    {showScroll && (
                        <button onClick={scrollToTop} type="button" style={{ position: 'fixed', bottom: '100px', right: '20px', zIndex: 100 }}>
                            <img src={topIcon} width={40} height={40} />
                        </button>
                    )}
                </div>
            ),
        },
        {
            title: "Xem lại hợp đồng",
            content: (
                <div>
                    <PreviewContract form={form} partnerId={form.getFieldValue('partnerId')} />
                </div>
            ),
        },
        {
            title: " Thời gian thông báo",
            content: (
                <div className="p-4 space-y-4">
                    <h3 className="font-bold">Thiết lập thời gian thông báo cho các mốc</h3>

                    {/* Ngày có hiệu lực */}
                    <Row gutter={16} justify={"center"}>
                        <Col span={6}>
                            <Form.Item
                                label="Ngày có hiệu lực (đã chọn)"
                                name="effectiveDate"
                            >
                                <DatePicker className="w-full" disabled format="DD/MM/YYYY " />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="Ngày thông báo"
                                name="notifyEffectiveDate"
                                rules={[{ required: true, message: "Vui lòng chọn ngày thông báo!" }]}
                            >
                                <DatePicker
                                    className="w-full"
                                    format="DD/MM/YYYY HH:mm:ss"
                                    showTime
                                    disabledDate={(current) => {
                                        const effectiveDate = form.getFieldValue('effectiveDate');
                                        return !current || current > effectiveDate || current < dayjs().startOf('day');
                                    }}
                                    onChange={(date) => {
                                        if (!date) {
                                            const effectiveDate = form.getFieldValue('effectiveDate');
                                            if (effectiveDate) {
                                                form.setFieldsValue({
                                                    notifyEffectiveDate: calculateNotificationDate(effectiveDate, notificationDays)
                                                });
                                            }
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Nội dung thông báo"
                                name="notifyEffectiveContent"
                                initialValue={`${DEFAULT_NOTIFICATIONS.effective}`}
                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung thông báo!" }]}
                            >
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Nhập nội dung thông báo"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Ngày hết hiệu lực */}
                    <Row gutter={16} justify={"center"}>
                        <Col span={6}>
                            <Form.Item
                                label="Ngày hết hiệu lực (đã chọn)"
                                name="expiryDate"
                            >
                                <DatePicker className="w-full" disabled format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="Ngày thông báo"
                                name="notifyExpiryDate"
                                rules={[{ required: true, message: "Vui lòng chọn ngày thông báo!" }]}
                            >
                                <DatePicker
                                    className="w-full"
                                    format="DD/MM/YYYY HH:mm:ss"
                                    showTime
                                    disabledDate={(current) => {
                                        const expiryDate = form.getFieldValue('expiryDate');
                                        return !current || current > expiryDate || current < dayjs().startOf('day');
                                    }}
                                    onChange={(date) => {
                                        if (!date) {
                                            const expiryDate = form.getFieldValue('expiryDate');
                                            if (expiryDate) {
                                                form.setFieldsValue({
                                                    notifyExpiryDate: calculateNotificationDate(expiryDate, notificationDays)
                                                });
                                            }
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Nội dung thông báo"
                                name="notifyExpiryContent"
                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung thông báo!" }]}
                                initialValue={`${DEFAULT_NOTIFICATIONS.expiry}`}
                            >
                                <Input.TextArea
                                    rows={2}
                                    placeholder="Nhập nội dung thông báo"
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Các đợt thanh toán */}
                    <Form.List name="payments">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <div key={key} className="border p-3 rounded mb-4">
                                        <h4 className="font-bold">Đợt thanh toán {index + 1}</h4>
                                        <Row gutter={16} justify={"center"}>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    label="Ngày thanh toán (đã chọn)"
                                                    name={[name, "paymentDate"]}
                                                >
                                                    <DatePicker className="w-full" disabled format="DD/MM/YYYY" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    label="Ngày thông báo"
                                                    name={[name, "notifyPaymentDate"]}
                                                    rules={[{ required: true, message: "Vui lòng chọn ngày thông báo!" }]}
                                                >
                                                    <DatePicker
                                                        className="w-full"
                                                        format="DD/MM/YYYY HH:mm:ss"
                                                        showTime
                                                        disabledDate={(current) => {
                                                            const paymentDate = form.getFieldValue(['payments', name, 'paymentDate']);
                                                            return !current || current > paymentDate || current < dayjs().startOf('day');
                                                        }}
                                                        onChange={(date) => {
                                                            if (!date) {
                                                                const paymentDate = form.getFieldValue(['payments', name, 'paymentDate']);
                                                                if (paymentDate) {
                                                                    form.setFieldsValue({
                                                                        payments: {
                                                                            [name]: {
                                                                                notifyPaymentDate: calculateNotificationDate(paymentDate, notificationDays)
                                                                            }
                                                                        }
                                                                    });
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    label="Nội dung thông báo"
                                                    name={[name, "notifyPaymentContent"]}
                                                    initialValue={`${DEFAULT_NOTIFICATIONS.payment} ${index + 1}`}
                                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung thông báo!" }]}
                                                >
                                                    <Input.TextArea
                                                        rows={2}
                                                        placeholder="Nhập nội dung thông báo"
                                                    />
                                                </Form.Item>
                                            </Col>
                                        </Row>

                                    </div>
                                ))}
                            </>
                        )}
                    </Form.List>
                    <Form.Item >
                        {notifications.map(notification => (
                            <div key={notification.id} style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                <DatePicker
                                    style={{ width: '200px' }}
                                    value={notification.date}
                                    showTime
                                    onChange={(date) => updateNotification(notification.id, 'date', date)}
                                    placeholder="Chọn ngày thông báo"
                                />
                                <Input
                                    style={{ flex: 1 }}
                                    value={notification.content}
                                    onChange={(e) => updateNotification(notification.id, 'content', e.target.value)}
                                    placeholder="Nhập nội dung thông báo"
                                />
                                <Button
                                    type="text"
                                    danger
                                    icon={<DeleteFilled />}
                                    onClick={() => removeNotification(notification.id)}
                                />
                            </div>
                        ))}
                        {/* <Button
                            type="dashed"
                            onClick={addNotification}
                            icon={<PlusOutlined />}
                        >
                            Thêm thông báo
                        </Button> */}
                    </Form.Item>
                </div>
            ),
        },

    ];

    useWarnOnLeave(shouldBlockNavigation);

    return (
        <div className="min-h-[100vh]">
            <Form form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={(changedValues, allValues) => {
                    if (changedValues.contractItems) {
                        const total = (allValues.contractItems || []).reduce(
                            (sum, item) => sum + (item.amount || 0),
                            0
                        );
                        handleChange(total)
                        form.setFieldsValue({ totalValue: total });
                    }
                }}
                initialValues={{
                    contractItems: [{ description: '', amount: null }],
                }}
            >
                <Steps current={currentStep} className="mb-8">
                    {steps.map((item, index) => (
                        <Step key={index} title={<p className="cursor-pointer">{item.title}</p>} />
                    ))}
                </Steps>
                <div className="mb-6">{steps[currentStep].content}</div>
                <div className="flex justify-end space-x-2">
                    {currentStep > 0 && (
                        <Button onClick={prev}> <CaretLeftOutlined /> Quay lại</Button>
                    )}
                    {currentStep < steps.length - 1 && (
                        <Button type="primary" onClick={next}>Tiếp theo <CaretRightOutlined /></Button>
                    )}
                    {currentStep === steps.length - 1 && (
                        <Button type="primary" htmlType="submit" loading={loadingCreateContract}>Gửi hợp đồng <CheckCircleOutlined /></Button>
                    )}
                </div>
            </Form>
            <Modal
                title="Thêm căn cứ pháp lý"
                open={isAddLegalModalOpen}
                onOk={handleAddOk}
                onCancel={() => setIsAddLegalModalOpen(false)}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form
                    layout="vertical"
                    form={formLegal}
                >
                    <Form.Item
                        name="legalLabel"
                        label="Tên căn cứ pháp lý"
                        rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên căn cứ!" }]}
                    >
                        <Input
                            value={newLegalBasis.name}
                            onChange={(e) => setNewLegalBasis({ ...newLegalBasis, name: e.target.value })}
                            placeholder="Nhập tên căn cứ pháp lý"
                        />
                    </Form.Item>
                    <Form.Item
                        rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung căn cứ!" }]}
                        label="Nội dung"
                        name="legalContent"
                    >
                        <TextArea
                            value={newLegalBasis.content}
                            onChange={(e) => setNewLegalBasis({ ...newLegalBasis, content: e.target.value })}
                            placeholder="Nhập nội dung"
                            rows={4}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <ModalAdd
                clauseId={adddClauseId}
                isModalAddOpen={isAddClasueModalOpen}
                closeModalAdd={() => setIsAddClauseModalOpen(false)}
                callBackCallAPI={adddClauseId == 9 ? () => loadGenaralData({ page: 0, size: 10 }) : () => loadDKKata({ page: 0, size: 10 })}
            />
        </div>
    );
};

export default CreateContractForm;
