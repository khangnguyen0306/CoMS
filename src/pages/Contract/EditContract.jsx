import React, { useCallback, useEffect, useRef, useState } from "react";
import { Steps, Form, Input, Select, DatePicker, Checkbox, Button, Space, Divider, message, Row, Col, Spin, Modal, Popover, InputNumber, Typography, Switch, Collapse, ConfigProvider, Timeline, Drawer, Image, Card, Table } from "antd";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { useLazyGetAllTemplateQuery } from "../../services/TemplateAPI";
import { FcNext } from "react-icons/fc";
import { useLazyGetPartnerListQuery } from "../../services/PartnerAPI";
import LazySelectPartner from "../../hooks/LazySelectPartner";
import LazySelectContractType from "../../hooks/LazySelectContractType";
import { useCreateContractMutation, useCreateContractTypeMutation, useLazyGetContractDetailQuery, useLazyGetContractTypeQuery, useUpdateContractMutation } from "../../services/ContractAPI";
import { CaretLeftOutlined, CaretRightOutlined, CheckCircleFilled, CheckCircleOutlined, DeleteFilled, EyeFilled, LeftOutlined, PlusOutlined } from "@ant-design/icons";
import LazySelect from "../../hooks/LazySelect";
import { useCreateClauseMutation, useLazyGetClauseManageQuery, useLazyGetLegalCreateContractQuery, useLazyGetTermDetailQuery } from "../../services/ClauseAPI";
import LazyLegalSelect from "../../hooks/LazyLegalSelect";
import RichTextEditor from 'reactjs-tiptap-editor';
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
import topIcon from "../../assets/Image/top.svg"
import { useGetBussinessInformatinQuery } from "../../services/BsAPI";
import { useGetcommentQuery } from "../../services/ProcessAPI";
import viewComment from "../../assets/Image/view.svg"

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;


const EditContract = () => {
    const { id } = useParams()
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const [newTypeCreate, setNewTypeCreate] = useState('');
    const [templateDataSelected, setTemplateDataSelected] = useState(null);
    const [isAddLegalModalOpen, setIsAddLegalModalOpen] = useState(false);
    const [newLegalBasis, setNewLegalBasis] = useState({ name: '', content: '' });
    const [content, setContent] = useState('');
    const [textValue, setTextValue] = useState("");
    const [isVATChecked, setIsVATChecked] = useState(false);
    const [isDateLateChecked, setIsDateLateChecked] = useState(false);
    const [isAutoRenew, setIsAutoRenew] = useState(false);
    const [selectedOthersTerms, setSelectedOthersTerms] = useState([]);
    const [isAppendixEnabled, setIsAppendixEnabled] = useState(false);
    const [isTransferEnabled, setIsTransferEnabled] = useState(false);
    const [isSuspend, setIsSuspend] = useState(false);
    const [isViolate, setIsisViolate] = useState(false);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [notificationDays, setNotificationDays] = useState(null);
    const [termsData, setTermsData] = useState({});

    const [getContractTypeData, { data: contractTypeData, isLoading: isLoadingContractType }] = useLazyGetContractTypeQuery();
    const [getTemplateData, { data: templateData, isLoading }] = useLazyGetAllTemplateQuery();
    const [getPartnerData, { data: partnerData, isLoading: isLoadingParnerData }] = useLazyGetPartnerListQuery();
    const [createContractType, { isLoadingCreateType }] = useCreateContractTypeMutation();
    const [getContractLegal] = useLazyGetLegalCreateContractQuery();
    const [getGeneralTerms, { data: generalData, isLoading: loadingGenaral, refetch: refetchGenaral }] = useLazyGetClauseManageQuery();
    const [getDateNotification] = useLazyGetDateNofitifationQuery();
    const [createClause] = useCreateClauseMutation();
    const [UpdateContract, { isLoading: loadingUpdateContract }] = useUpdateContractMutation();/////
    const [getContract, { data: contractData, isLoading: isLoadingContract }] = useLazyGetContractDetailQuery();
    const { data: cmtData, error } = useGetcommentQuery({ contractId: id }); const { data: bsInfor, isLoading: isLoadingBsData } = useGetBussinessInformatinQuery();
    const [fetchTerms] = useLazyGetTermDetailQuery();

    const [showScroll, setShowScroll] = useState(false)
    const [activeSection, setActiveSection] = useState('general');
    const generalInfoRef = useRef(null);
    const mainContentRef = useRef(null);
    const containerRef = useRef(null)
    const termsRef = useRef(null);
    const otherContentRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [changeCCPL, setChangeCCPL] = useState(false);
    const [loadingTerms, setLoadingTerms] = useState({});

    const formatDate = (date) => {
        if (!date) return null;

        if (Array.isArray(date)) {
            const [year, month, day, hour, minute, second] = date;
            return dayjs(new Date(year, month - 1, day, hour, minute, second)).format("DD-MM-YYYY hh:mm:ss");
        }
        return dayjs(date).format("DD-MM-YYYY hh:mm:ss");
    };
    console.log(cmtData)

    // Fetch contract data in edit mode
    useEffect(() => {
        if (id) {
            getContract(id);
        }
    }, [id]);
    const showDrawer = () => {
        setDrawerVisible(true);
    };
    const closeDrawer = () => {
        setDrawerVisible(false);
    };

    // Populate form with contract data
    useEffect(() => {
        if (contractData) {
            form.setFieldsValue({
                status: contractData.data.status,
                contractTypeId: contractData?.data.contractTypeId,
                partnerId: contractData?.data.partner.id,
                contractName: contractData?.data.title,
                contractType: contractData?.data.contractTypeId,
                contractNumber: contractData?.data.contractNumber,
                signingDate: contractData?.data.signingDate
                    ? dayjs(new Date(
                        contractData.data.signingDate[0],
                        contractData.data.signingDate[1] - 1,
                        contractData.data.signingDate[2],
                        contractData.data.signingDate[3],
                        contractData.data.signingDate[4]
                    ))
                    : null,
                contractLocation: contractData?.data.contractLocation,
                legalBasisTerms: contractData?.data.legalBasisTerms?.map(term => term.original_term_id) || [],
                contractContent: contractData?.data.contractContent,
                totalValue: contractData?.data.amount,
                payments: contractData?.data.paymentSchedules?.map((payment, index) => ({
                    id: payment.id,
                    paymentOrder: payment.paymentOrder,
                    amount: payment.amount,
                    overdueEmailSent: payment.overdueEmailSent,
                    reminderEmailSent: payment.reminderEmailSent,
                    status: payment.status,
                    paymentDate: payment.paymentDate
                        ? dayjs(new Date(
                            payment.paymentDate[0],
                            payment.paymentDate[1] - 1,
                            payment.paymentDate[2],
                            payment.paymentDate[3],
                            payment.paymentDate[4]
                        ))
                        : null,
                    paymentMethod: payment.paymentMethod,
                    notifyPaymentDate: payment.notifyPaymentDate
                        ? dayjs(new Date(
                            payment.notifyPaymentDate[0],
                            payment.notifyPaymentDate[1] - 1,
                            payment.notifyPaymentDate[2],
                            payment.notifyPaymentDate[3],
                            payment.notifyPaymentDate[4]
                        ))
                        : null,
                    notifyPaymentContent: payment.notifyPaymentContent,
                })) || [],

                contractItems: contractData?.data.contractItems?.map((item, index) => ({
                    id: item.id,
                    amount: item.amount,
                    description: item.description,
                    itemOrder: item.itemOrder
                })) || [],

                effectiveDateExpiryDate: [
                    dayjs(new Date(
                        contractData?.data.effectiveDate[0],
                        contractData?.data.effectiveDate[1] - 1,
                        contractData?.data.effectiveDate[2],
                        contractData?.data.effectiveDate[3],
                        contractData?.data.effectiveDate[4]
                    )),
                    dayjs(new Date(
                        contractData?.data.expiryDate[0],
                        contractData?.data.expiryDate[1] - 1,
                        contractData?.data.expiryDate[2],
                        contractData?.data.expiryDate[3],
                        contractData?.data.expiryDate[4]
                    ))

                ],

                effectiveDate: contractData?.data.effectiveDate
                    ? dayjs(new Date(
                        contractData.data.effectiveDate[0],
                        contractData.data.effectiveDate[1] - 1,
                        contractData.data.effectiveDate[2],
                        contractData.data.effectiveDate[3],
                        contractData.data.effectiveDate[4]
                    ))
                    : null,

                expiryDate: contractData?.data.expiryDate
                    ? dayjs(new Date(
                        contractData.data.expiryDate[0],
                        contractData.data.expiryDate[1] - 1,
                        contractData.data.expiryDate[2],
                        contractData.data.expiryDate[3],
                        contractData.data.expiryDate[4]
                    ))
                    : null,

                notifyEffectiveDate: contractData?.data.notifyEffectiveDate
                    ? dayjs(new Date(
                        contractData.data.notifyEffectiveDate[0],
                        contractData.data.notifyEffectiveDate[1] - 1,
                        contractData.data.notifyEffectiveDate[2],
                        contractData.data.notifyEffectiveDate[3],
                        contractData.data.notifyEffectiveDate[4]
                    ))
                    : null,
                notifyEffectiveContent: contractData?.data.notifyEffectiveContent,
                notifyExpiryDate: contractData?.data.notifyExpiryDate
                    ? dayjs(new Date(
                        contractData.data.notifyExpiryDate[0],
                        contractData.data.notifyExpiryDate[1] - 1,
                        contractData.data.notifyExpiryDate[2],
                        contractData.data.notifyExpiryDate[3],
                        contractData.data.notifyExpiryDate[4]
                    ))
                    : null,
                notifyExpiryContent: contractData?.data.notifyExpiryContent,
                autoRenew: contractData?.data.autoRenew,
                autoAddVAT: contractData?.data.autoAddVAT,
                vatPercentage: contractData?.data.vatPercentage,
                isDateLateChecked: contractData?.data.isDateLateChecked,
                maxDateLate: contractData?.data.maxDateLate,
                appendixEnabled: contractData?.data.appendixEnabled,
                transferEnabled: contractData?.data.transferEnabled,
                violate: contractData?.data.violate,
                suspend: contractData?.data.suspend,
                suspendContent: contractData?.data.suspendContent,
                generalTerms: contractData?.data.generalTerms?.map(term => term.original_term_id) || [],
                additionalTerms: contractData?.data.additionalTerms?.map(term => term.original_term_id) || [],
                specialTermsA: contractData?.data.specialTermsA,
                specialTermsB: contractData?.data.specialTermsB,
                contractId: contractData?.data.id,
                customNotifications: contractData?.data.customNotifications?.map(notif => ({
                    date: notif.date ? dayjs(new Date(notif.date)) : null,
                    content: notif.content,
                })) || [],
                "1": {
                    A: contractData?.data.additionalConfig?.["1"]?.A?.map(item => item.original_term_id) || [],
                    B: contractData?.data.additionalConfig?.["1"]?.B?.map(item => item.original_term_id) || [],
                    Common: contractData?.data.additionalConfig?.["1"]?.Common?.map(item => item.original_term_id) || []
                },
                "2": {
                    A: contractData?.data.additionalConfig?.["2"]?.A?.map(item => item.original_term_id) || [],
                    B: contractData?.data.additionalConfig?.["2"]?.B?.map(item => item.original_term_id) || [],
                    Common: contractData?.data.additionalConfig?.["2"]?.Common?.map(item => item.original_term_id) || []
                },
                "3": {
                    A: contractData?.data.additionalConfig?.["3"]?.A?.map(item => item.original_term_id) || [],
                    B: contractData?.data.additionalConfig?.["3"]?.B?.map(item => item.original_term_id) || [],
                    Common: contractData?.data.additionalConfig?.["3"]?.Common?.map(item => item.original_term_id) || []
                },
                "4": {
                    A: contractData?.data.additionalConfig?.["4"]?.A?.map(item => item.original_term_id) || [],
                    B: contractData?.data.additionalConfig?.["4"]?.B?.map(item => item.original_term_id) || [],
                    Common: contractData?.data.additionalConfig?.["4"]?.Common?.map(item => item.original_term_id) || []
                },
                "5": {
                    A: contractData?.data.additionalConfig?.["5"]?.A?.map(item => item.original_term_id) || [],
                    B: contractData?.data.additionalConfig?.["5"]?.B?.map(item => item.original_term_id) || [],
                    Common: contractData?.data.additionalConfig?.["5"]?.Common?.map(item => item.original_term_id) || []
                },
                "6": {
                    A: contractData?.data.additionalConfig?.["6"]?.A?.map(item => item.original_term_id) || [],
                    B: contractData?.data.additionalConfig?.["6"]?.B?.map(item => item.original_term_id) || [],
                    Common: contractData?.data.additionalConfig?.["6"]?.Common?.map(item => item.original_term_id) || []
                },
                "7": {
                    A: contractData?.data.additionalConfig?.["7"]?.A?.map(item => item.original_term_id) || [],
                    B: contractData?.data.additionalConfig?.["7"]?.B?.map(item => item.original_term_id) || [],
                    Common: contractData?.data.additionalConfig?.["7"]?.Common?.map(item => item.original_term_id) || []
                },
            });
            setContent(contractData?.data.contractContent);
            setIsVATChecked(contractData?.data.autoAddVAT);
            setIsDateLateChecked(contractData?.data.isDateLateChecked);
            setIsAutoRenew(contractData?.data.autoRenew);
            setSelectedOthersTerms(contractData?.data.additionalTerms?.map(term => term.original_term_id));
            setIsAppendixEnabled(contractData?.data.appendixEnabled);
            setIsTransferEnabled(contractData?.data.transferEnabled);
            setIsSuspend(contractData?.data.suspend);
            setIsisViolate(contractData?.data.violate);
        }
    }, [contractData, form]);



    const handlePaymentDateChange = (date, name) => {
        if (date) {
            const notifyDate = date;
            const payments = form.getFieldValue('payments') || [];
            const updatedPayments = [...payments];
            updatedPayments[name] = { ...updatedPayments[name], notifyPaymentDate: notifyDate };
            form.setFieldsValue({ payments: updatedPayments });
        }
    };

    const handleCreatePartner = () => {
        navigate("/partner");
    };

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

    const loadTemplateData = async ({ page, size, keyword }) => {
        return getTemplateData({ page, size, keyword }).unwrap();
    };

    const loadPartnerData = async ({ page, size, keyword }) => {
        return getPartnerData({ page, size, keyword }).unwrap();
    };

    const loadContractTypeData = async () => {
        return getContractTypeData().unwrap();
    };

    const handleSelectChange = (newValues) => {
        form.setFieldsValue({ generalTerms: newValues });
    };

    const handleChange = (value) => {
        if (value) {
            setTextValue(numberToVietnamese(value));
        } else {
            setTextValue("");
        }
    };

    const next = async () => {
        try {
            await form.validateFields();
            setCurrentStep(currentStep + 1);
        } catch (errorInfo) {
            message.error(errorInfo.errorFields.length > 1 ? errorInfo.errorFields[0].errors[0] + " và các trường bắt buộc khác" : errorInfo.errorFields[0].errors[0]);
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const onFinish = async (values) => {
        const data = form.getFieldsValue(true);
        console.log(data);
        const formatDateArray = (date) => {
            if (!date) return null;
            const d = new Date(date);
            return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
        };

        // Xử lý additionalConfig
        const additionalConfig = Object.keys(data)
            .filter(key => !isNaN(key))
            .reduce((acc, key) => {
                const { A, B, Common } = data[key];
                if (A.length > 0 || B.length > 0 || Common.length > 0) {
                    acc[key] = {
                        ...(A.length > 0 && { A: A.map(id => ({ id })) }),
                        ...(B.length > 0 && { B: B.map(id => ({ id })) }),
                        ...(Common.length > 0 && { Common: Common.map(id => ({ id })) }),
                    };
                }
                return acc;
            }, {});

        const formattedData = {
            // contractNumberFormat: data.contractNumberFormat,
            contractTypeId: data.contractTypeId,
            contractId: data.contractId,
            title: data.contractName,
            contractNumber: data.contractNumber,
            signingDate: formatDateArray(data.signingDate),
            contractLocation: data.contractLocation,
            totalValue: data.totalValue,
            effectiveDate: formatDateArray(data.effectiveDate),
            expiryDate: formatDateArray(data.expiryDate),
            notifyEffectiveDate: formatDateArray(data.notifyEffectiveDate),
            notifyExpiryDate: formatDateArray(data.notifyExpiryDate),
            notifyEffectiveContent: data.notifyEffectiveContent,
            notifyExpiryContent: data.notifyExpiryContent,
            specialTermsA: data.specialTermsA,
            specialTermsB: data.specialTermsB,
            contractContent: data.contractContent,
            appendixEnabled: data.appendixEnabled,
            transferEnabled: data.transferEnabled,
            autoAddVAT: data.autoAddVAT,
            vatPercentage: data.vatPercentage,
            isDateLateChecked: data.isDateLateChecked,
            maxDateLate: data.maxDateLate,
            autoRenew: data.autoRenew,
            violate: data.violate,
            suspend: data.suspend,
            suspendContent: data.suspendContent,
            status: data.status,
            payments: data.payments.map((payment, index) => ({
                id: payment.id,
                paymentOrder: index + 1,
                amount: payment.amount,
                notifyPaymentDate: formatDateArray(payment.notifyPaymentDate),
                paymentDate: formatDateArray(payment.paymentDate),
                status: payment.status || "UNPAID",
                paymentMethod: payment.paymentMethod,
                notifyPaymentContent: payment.notifyPaymentContent,
                reminderEmailSent: payment.reminderEmailSent,
                overdueEmailSent: payment.overdueEmailSent,
            })),
            contractItems: data.contractItems.map((item, index) => ({
                id: item.id,
                itemOrder: index + 1,
                amount: item.amount,
                description: item.description,
            })),
            legalBasisTerms: data.legalBasisTerms,
            generalTerms: data.generalTerms,
            otherTerms: data.otherTerms || [],
            additionalTerms: data.additionalTerms,
            additionalConfig,
        };

        console.log("Formatted Data:", formattedData);

        try {
            const response = await UpdateContract(formattedData).unwrap();
            if (response.status === "OK") {
                message.success("Cập nhật hợp đồng thành công!");
                navigate('/contract');
            }
        } catch (error) {
            message.error(error?.data?.message || "Có lỗi xảy ra khi cập nhật hợp đồng!");
            console.error(error);
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
            if (error.data === "exist") {
                message.error("Loại hợp đồng đã tồn tại!");
            } else {
                message.error("Lỗi khi tạo loại hợp đồng!");
            }
        }
    };


    const handleAddOk = async () => {
        let name = form.getFieldValue('legalLabel') || '';
        let content = form.getFieldValue('legalContent') || '';
        try {
            const result = await createClause({ idType: 8, label: name, value: content }).unwrap();
            if (result.status === "CREATED") {
                message.success("Tạo điều khoản thành công");
            }
            loadLegalData();
            setIsAddLegalModalOpen(false);
            form.resetFields(['legalLabel', 'legalContent']);
        } catch (error) {
            message.error("Có lỗi xảy ra khi tạo điều khoản");
        }
    };

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    const onValueChange = useCallback(debounce((value) => {
        setContent(value);
        form.setFieldsValue({ contractContent: value });
    }, 100), []);


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
            7: 'ĐIỀU KHOẢN BẢO MẬT'
        };

        const combineUniqueTerms = (formTerms, templateTerms) => {
            const uniqueTerms = new Map();
            if (templateTerms && templateTerms.length > 0) {
                templateTerms.forEach(term => {
                    const termId = term.original_term_id;
                    if (termId && !uniqueTerms.has(termId)) {
                        uniqueTerms.set(termId, term);
                    }
                });
            }
            if (formTerms && formTerms.length > 0) {
                formTerms.forEach(term => {
                    const termId = term.value || term.original_term_id;
                    if (termId && !uniqueTerms.has(termId)) {
                        uniqueTerms.set(termId, term);
                    }
                });
            }
            return Array.from(uniqueTerms.values());
        };

        const renderTermSection = (termId) => {
            if (!selectedOthersTerms.includes(termId)) return null;
            const formData = form.getFieldValue(String(termId)) || { A: [], B: [], Common: [] };
            const templateData = templateDataSelected?.additionalConfig?.[String(termId)] || { A: [], B: [], Common: [] };
            const commonTerms = combineUniqueTerms(formData.Common, templateData.Common);
            const aTerms = combineUniqueTerms(formData.A, templateData.A);
            const bTerms = combineUniqueTerms(formData.B, templateData.B);
            const hasCommonTerms = commonTerms.length > 0;
            const hasATerms = aTerms.length > 0;
            const hasBTerms = bTerms.length > 0;
            const hasNoTerms = !hasCommonTerms && !hasATerms && !hasBTerms;

            if (hasNoTerms) return null;

            return (
                <div key={termId} className="mb-6 border-b pb-4">
                    <div className="font-bold text-lg mb-3">{termTitles[termId]}</div>
                    {hasCommonTerms && (
                        <div className="mb-4">
                            <div className="font-semibold border-b pb-1 mb-2">Điều khoản chung</div>
                            {commonTerms.map((term, index) => (
                                <div key={`common-${index}`} className="mb-2 pl-3">
                                    {term?.label && <div className="text-gray-600">{index + 1}. {term.label}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                    {hasATerms && (
                        <div className="mb-4">
                            <div className="font-semibold border-b pb-1 mb-2">Điều khoản riêng bên A</div>
                            {aTerms.map((term, index) => (
                                <div key={`a-${index}`} className="mb-2 pl-3">
                                    {term?.label && <div className="text-gray-600">{index + 1}. {term.label}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                    {hasBTerms && (
                        <div className="mb-4">
                            <div className="font-semibold border-b pb-1 mb-2">Điều khoản riêng bên B</div>
                            {bTerms.map((term, index) => (
                                <div key={`b-${index}`} className="mb-2 pl-3">
                                    {term?.label && <div className="text-gray-600">{index + 1}. {term.label}</div>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        };

        const allTermSections = Object.keys(termTitles).map(termId => renderTermSection(Number(termId)));
        const hasAnyTerms = allTermSections.some(section => section !== null);

        return (
            <div className="max-w-2xl max-h-[500px] overflow-auto px-4">
                {!hasAnyTerms && (
                    <div className="text-gray-500 italic">Chưa có điều khoản nào được chọn</div>
                )}
                {allTermSections}
            </div>
        );
    };

    const getTermsContent = (fieldName) => {
        const fieldLabels = {
            legalBasis: 'Căn cứ pháp lý',
            generalTerms: 'Điều khoản chung',
            additionalTerms: 'Điều khoản bổ sung',
        };

        const templateDataMapping = {
            legalBasis: 'legalBasisTerms',
            generalTerms: 'generalTerms',
            additionalTerms: 'additionalTerms',
        };

        const terms = form.getFieldValue(fieldName) || [];
        const templateProperty = templateDataMapping[fieldName];
        const valuefromDetail = templateDataSelected?.[templateProperty] || [];

        const uniqueTermIds = new Set();
        const allUniqueTerms = [];

        if (valuefromDetail.length > 0) {
            valuefromDetail.forEach(term => {
                const termId = term.original_term_id;
                if (!uniqueTermIds.has(termId)) {
                    uniqueTermIds.add(termId);
                    allUniqueTerms.push(term);
                }
            });
        }

        if (terms.length > 0) {
            terms.forEach(term => {
                const termId = term.value || term.original_term_id;
                if (termId && !uniqueTermIds.has(termId)) {
                    uniqueTermIds.add(termId);
                    allUniqueTerms.push(term);
                }
            });
        }

        return (
            <div className="max-w-md max-h-96 overflow-auto">
                {allUniqueTerms.length > 0 ? (
                    allUniqueTerms.map((term, index) => (
                        <div key={index} className="mb-2 p-1 border-b last:border-b-0">
                            {term?.label && <div className="text-gray-600">{index + 1}. {term?.label}</div>}
                        </div>
                    ))
                ) : (
                    <div className="text-gray-500 italic">Chưa có {fieldLabels[fieldName]?.toLowerCase()} nào được chọn</div>
                )}
            </div>
        );
    };

    const handleCheckboxChange = (checkedValues) => {
        setSelectedOthersTerms(checkedValues);
        const currentFields = form.getFieldsValue();
        const newFields = {};

        checkedValues.forEach((value) => {
            newFields[value] = currentFields[value] || { Common: [], A: [], B: [] };
        });

        form.setFieldsValue({ ...currentFields, ...newFields });
    };

    const termConfigs = {
        "1": { title: "ĐIỀU KHOẢN BỔ SUNG", loadData: loadDKBSData },
        "2": { title: "QUYỀN VÀ NGHĨA VỤ CÁC BÊN", loadData: loadQVNVCBData },
        "3": { title: "ĐIỀU KHOẢN BẢO HÀNH VÀ BẢO TRÌ", loadData: loadBHVBTData },
        "4": { title: "ĐIỀU KHOẢN VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI", loadData: loadVPBTTHData },
        "5": { title: "ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG", loadData: loadCDHDData },
        "6": { title: "ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP", loadData: loadGQTCData },
        "7": { title: "ĐIỀU KHOẢN BẢO MẬT", loadData: loadBMData },
    };

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

    useEffect(() => {
        const legalBasis = form.getFieldValue('legalBasisTerms');
        if (legalBasis && legalBasis.length > 0) {
            legalBasis.forEach(termId => {
                loadTermDetail(termId);
            });
        }
    }, [form.getFieldValue('legalBasisTerms'), changeCCPL]);

    const handleScroll = () => {
        const scrollPosition = window.scrollY + 50;

        // Get positions of each section
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
    };

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);


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


    useEffect(() => {
        if (containerRef.current) {
            const containerHeight = containerRef.current.scrollHeight;
            setIsOverflowing(containerHeight > 50);
        }
    }, [form.getFieldValue('legalBasis')]);

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
                console.error(`Error loading term ${termId}:`, error);
            } finally {
                setLoadingTerms(prev => ({ ...prev, [termId]: false }));
            }
        }
    };

    const parseDate = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
        const [year, month, day, hour, minute] = dateArray;
        return new Date(year, month - 1, day, hour, minute);
    };


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
                    rules={[{ required: true,whitespace: true, message: 'Vui lòng nhập nội dung' }]}
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


    console.log(form.getFieldsValue(true))
    const steps = [
        {
            title: "Thông tin cơ bản",
            content: (
                <div className="space-y-4">
                    <Form.Item hidden name="contractId" />
                    <Form.Item label="Loại hợp đồng" name="contractTypeId" rules={[{ required: true, message: "Vui lòng chọn loại hợp đồng!" }]}>
                        <LazySelectContractType loadDataCallback={loadContractTypeData} options={contractTypeData} showSearch labelInValue placeholder="Chọn loại hợp đồng" dropdownRender={(menu) => (
                            <>
                                {menu}
                                <Divider style={{ margin: "8px 0" }} />
                                <Space style={{ padding: "0 8px 4px" }}>
                                    <Input placeholder="Nhập loại hợp đồng mới" ref={inputRef} value={newTypeCreate} onChange={onNewTypeChange} onKeyDown={(e) => e.stopPropagation()} />
                                    <Button type="text" icon={<PlusOutlined />} onClick={addNewType} loading={isLoadingCreateType}>Thêm</Button>
                                </Space>
                            </>
                        )} />
                    </Form.Item>
                    <Form.Item
                        label="Chọn đối tác"
                        name="partnerId"
                        rules={[{ required: true, message: "Vui lòng chọn đối tác!" }]}>
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
                                        <Button type="primary" icon={<FcNext />} onClick={handleCreatePartner}>Thêm thông tin khách hàng</Button>
                                    </Space>
                                </>
                            )} />
                    </Form.Item>
                    <Form.Item
                        label="Tên hợp đồng"
                        name="contractName" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên hợp đồng!" }]}>
                        <Input placeholder="Nhập tên hợp đồng" />
                    </Form.Item>

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
                                                            11. Trường hợp đặc biệt
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
                        <Col xs={24} md={18} className="mb-[50px]">
                            <div ref={generalInfoRef}>
                                <Form.Item style={{ display: 'none' }} name="contractNumber" />

                                <div className={`${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'} p-4 py-10 rounded-md text-center relative`}>
                                    <p className="font-bold text-lg">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                    <p className="font-bold"> Độc lập - Tự do - Hạnh phúc</p>
                                    <p>-------------------</p>
                                    <p className="text-2xl font-bold mt-10">{form.getFieldValue('contractName')?.toUpperCase()}</p>
                                    <p className="mt-3"><b>Số:</b> {form.getFieldValue('contractNumber')}  </p>

                                </div>
                                <div className=" flex items-center mt-5 right-9 gap-3">
                                    <Form.Item
                                        label="Nơi ký kết"
                                        name="contractLocation"
                                        rules={[{ required: true, whitespace: true, message: "Vui lòng chọn nơi ký kết hợp đồng!" }]}>
                                        <Select showSearch placeholder="Chọn nơi ký kết" optionFilterProp="children" filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}>
                                            {VietnameseProvinces.map(province => <Option key={province} value={province}>{province}</Option>)}
                                        </Select>
                                    </Form.Item>
                                    <Form.Item label="Ngày ký kết" name="signingDate" rules={[{ required: true, message: "Ngày ký kết không được để trống!" }]}>
                                        <DatePicker className="w-full" format="DD/MM/YYYY" disabledDate={(current) => current && current < dayjs().startOf('day')} />
                                    </Form.Item>
                                </div>
                                <Form.Item
                                    className="w-full mt-6"
                                    label={
                                        <div className="flex justify-between items-center gap-4">
                                            <p>Căn cứ pháp lý
                                            </p>
                                        </div>}
                                    name='legalBasisTerms'
                                    rules={[{ required: true, message: "Vui lòng chọn căn cứ pháp lý!" }]}>
                                    <LazyLegalSelect
                                        loadDataCallback={loadLegalData}
                                        showSearch
                                        mode="multiple"
                                        placeholder="Chọn căn cứ pháp lý"
                                        dropdownRender={(menu) => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: "8px 0" }} />
                                                <Space style={{ padding: "0 8px 4px" }}>
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={hanldeOpenAddLegalModal}>Thêm căn cứ</Button>
                                                </Space>
                                            </>
                                        )} />
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
                                    <div className="flex flex-col gap-2 pl-4 " md={10} sm={24} >
                                        <p className="font-bold text-lg "><u>BÊN CUNG CẤP (BÊN A)</u></p>
                                        <p className="text-sm "><b>Tên công ty:</b> {bsInfor?.data.partnerName}</p>
                                        <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {bsInfor?.data.address}</p>
                                        <p className="flex text-sm justify-between"><p><b>Người đại diện:</b> {bsInfor?.data.spokesmanName} </p></p>
                                        <p className="text-sm"><b>Chức vụ:</b> {bsInfor?.data.position || "chưa cập nhật"}</p>
                                        <p className='flex text-sm  justify-between'><p><b>Mã số thuế:</b> {bsInfor?.data.taxCode}</p></p>
                                        <p className="text-sm"><b>Email:</b> {bsInfor?.data.email}</p>
                                    </div>
                                    <div ref={containerRef} className="flex flex-col gap-2 mt-4 pl-4" md={10} sm={24}>
                                        <p className="font-bold text-lg "><u>Bên thuê (Bên B)</u></p>
                                        <p className="text-sm "><b>Tên công ty: </b>{contractData?.data.partner.partnerName}</p>
                                        <p className="text-sm"><b>Địa chỉ trụ sở chính: </b>{contractData?.data.partner.address}</p>
                                        <p className="flex  text-sm justify-between"><p><b>Người đại diện:</b> {contractData?.data.partner.spokesmanName}</p></p>
                                        <p className="text-sm"><b>Chức vụ: {contractData?.data.partner.position}</b> </p>
                                        <p className='flex text-sm justify-between'><p><b>Mã số thuế:</b> {contractData?.data.partner.taxCode}</p></p>
                                        <p className="text-sm"><b>Email:</b> {contractData?.data.partner.email}</p>
                                    </div>
                                </div>
                            </div>
                            <div ref={mainContentRef}>
                                <Form.Item label={<div className="flex justify-between items-center gap-4"><p>Soạn thảo nội dung hợp đồng</p><Popover content={<PreviewSection className='w-[80%]' content={content} isDarkMode={isDarkMode} />} trigger="hover" placement="right"><Button icon={<EyeFilled />} /></Popover></div>} name="contractContent" className="mt-5" rules={[{ required: true, message: "Vui lòng nhập nội dung hợp đồng!" }]}>
                                    <RichTextEditor output="html" content={content} onChangeContent={onValueChange} extensions={extensions} dark={isDarkMode} hideBubble={true} dense={false} removeDefaultWrapper placeholder="Nhập nội dung hợp đồng tại đây..." contentClass="max-h-[400px] overflow-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-track]:bg-gray-200" />
                                </Form.Item>
                                {/* <Form.Item label="Tổng giá trị hợp đồng" name="totalValue" rules={[{ required: true, message: "Vui lòng nhập tổng giá trị hợp đồng!" }]}>
                                    <InputNumber style={{ width: "100%" }} placeholder="Nhập tổng giá trị hợp đồng" min={0} max={1000000000000000} formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ₫" : ""} parser={(value) => value.replace(/\D/g, "")} onChange={handleChange} />
                                </Form.Item>
                                {textValue && <div className="mt-1 ml-1"><Typography.Text type="secondary">(Bằng chữ: <span className="font-bold">{textValue}</span>)</Typography.Text></div>} */}
                                {/* <Divider orientation="center">Thanh toán</Divider>
                                <Form.List name="payments" rules={[{ validator: async (_, payments) => { if (!payments || payments.length < 1) return Promise.reject(new Error('Vui lòng thêm ít nhất một đợt thanh toán!')); } }]}>
                                    {(fields, { add, remove }) => (
                                        <>
                                            {fields.map(({ key, name, ...restField }) => (
                                                <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                                                    <Form.Item {...restField} name={[name, "amount"]} rules={[{ required: true, message: "Nhập số tiền thanh toán" }]}>
                                                        <InputNumber style={{ width: "100%" }} placeholder="Số tiền" min={0} max={1000000000000000} formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ₫" : ""} parser={(value) => value.replace(/\D/g, "")} />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, "paymentDate"]} rules={[{ required: true, message: "Chọn ngày thanh toán" }]}>
                                                        <DatePicker style={{ width: 150 }}
                                                            placeholder="Ngày thanh toán"
                                                            disabledDate={(current) => current && current < dayjs().startOf('day')} format="DD/MM/YYYY HH:mm:ss" onChange={(date) => handlePaymentDateChange(date, name)} />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, "paymentMethod"]} rules={[{ required: true, message: "Chọn phương thức thanh toán" }]}>
                                                        <Select placeholder="Phương thức thanh toán" style={{ width: 200 }}>
                                                            <Option value="transfer">Chuyển khoản</Option>
                                                            <Option value="cash">Tiền mặt</Option>
                                                            <Option value="creditCard">Thẻ tín dụng</Option>
                                                        </Select>
                                                    </Form.Item>
                                                    <Button type="primary" onClick={() => remove(name)} danger><DeleteFilled /></Button>
                                                </Space>
                                            ))}
                                            <Button icon={<PlusOutlined />} type="primary" onClick={() => add()} block>Thêm đợt thanh toán</Button>
                                        </>
                                    )}
                                </Form.List> */}
                                <Divider orientation="center" className="text-lg">Hạng mục thanh toán</Divider>
                                <Form.List
                                    name="contractItems"
                                    rules={[
                                        {

                                            validator: async (_, contractItems) => {
                                                if (!contractItems || contractItems.length < 1) {
                                                    return Promise.reject(new Error('Phải có ít nhất một hạng mục'));
                                                }
                                            },
                                        },
                                    ]}
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
                                <Form.List
                                    name="payments"
                                    className="w-full"
                                    rules={[
                                        {
                                            validator: async (_, payments) => {
                                                if (!payments || payments.length < 1) {
                                                    return Promise.reject(new Error('Vui lòng thêm ít nhất một đợt thanh toán!'));
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
                                                        rules={[{ required: true, message: "Chọn ngày thanh toán" }]}
                                                    >
                                                        <DatePicker
                                                            style={{ width: 150 }}
                                                            placeholder="Ngày thanh toán"
                                                            disabledDate={(current) => current && current < dayjs().startOf('day')}
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

                                <div className="flex items-center gap-5 mt-[50px]">
                                    <Form.Item name="autoAddVAT" valuePropName="checked">
                                        <div className="flex items-center min-w-[350px]">
                                            <Switch className="mr-4" onChange={(checked) => { form.setFieldsValue({ autoAddVAT: checked }); setIsVATChecked(checked); }} checked={form.getFieldValue("autoAddVAT") ?? isVATChecked} />
                                            <p className="text-sm">Tự động thêm VAT vào hợp đồng</p>
                                        </div>
                                    </Form.Item>
                                    {isVATChecked && (
                                        <Form.Item name="vatPercentage" rules={[{ required: true, message: "Vui lòng nhập phần trăm VAT!" }]}>
                                            <Input type="number" className="w-[150px]" placeholder="Nhập phần trăm VAT" addonAfter="%" max={100} min={0} onChange={(e) => { const value = parseInt(e.target.value, 10); if (value < 0 || value > 100) { message.error("Phần trăm VAT phải nằm trong khoảng 0 đến 100."); form.setFieldsValue({ vatPercentage: null }); } }} />
                                        </Form.Item>
                                    )}
                                </div>
                                <div className="flex items-center gap-5 mt-5">
                                    <Form.Item name="isDateLateChecked" valuePropName="checked">
                                        <div className="flex items-center min-w-[350px]">
                                            <Switch className="mr-4" onChange={(checked) => { form.setFieldsValue({ isDateLateChecked: checked }); setIsDateLateChecked(checked); }} checked={form.getFieldValue("isDateLateChecked") ?? isDateLateChecked} />
                                            <p className="text-sm">Cho phép thanh toán trễ hạn tối đa (ngày)</p>
                                        </div>
                                    </Form.Item>
                                    {isDateLateChecked && (
                                        <Form.Item name="maxDateLate" rules={[{ required: true, message: "Vui lòng nhập số ngày trễ tối đa" }]}>
                                            <Input type="number" className="w-[150px]" placeholder="Vui lòng nhập số ngày trễ tối đa" addonAfter="ngày" min={0} onChange={(e) => { const value = parseInt(e.target.value, 10); if (value < 0) { message.error("Số ngày trễ tối đa phải lớn hơn 0."); form.setFieldsValue({ maxDateLate: null }); } }} />
                                        </Form.Item>
                                    )}
                                </div>


                                <Divider orientation="center" className="text-lg">Thời gian và hiệu lực</Divider>
                                <Form.Item label="Thời gian hiệu lực hợp đồng" required className="mb-4" name="effectiveDateExpiryDate">
                                    <DatePicker.RangePicker
                                        className="w-full"
                                        showTime={{ format: 'HH:mm:ss' }}
                                        format="DD/MM/YYYY HH:mm:ss"
                                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                                        placeholder={["Ngày bắt đầu có hiệu lực", "Ngày kết thúc hiệu lực"]} onChange={(dates) => {
                                            if (dates) {
                                                form.setFieldsValue({ effectiveDate: dates[0], expiryDate: dates[1] });
                                                // handleEffectiveDateChange(dates[0]);
                                                // handleExpiryDateChange(dates[1]);
                                            } else {
                                                // form.setFieldsValue({ effectiveDate: null, expiryDate: null, notifyEffectiveDate: null, notifyExpiryDate: null });
                                            }
                                        }} />
                                </Form.Item>
                                <Form.Item name="effectiveDate" hidden rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu hiệu lực!" }]} />
                                <Form.Item name="expiryDate" hidden rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc hiệu lực!" }]} />
                                <Form.Item name="autoRenew" valuePropName="checked">
                                    <div className="flex items-center">
                                        <Switch className="mr-4" onChange={(checked) => { form.setFieldsValue({ autoRenew: checked }); setIsAutoRenew(checked); }} checked={form.getFieldValue('autoRenew') ?? isAutoRenew} />
                                        <p className="text-sm">Tự động gia hạn khi hết hạn mà không có khiếu nại</p>
                                    </div>
                                </Form.Item>
                            </div>
                            <div ref={termsRef}>
                                <Divider orientation="center" className="text-lg">Điều khoản & Cam kết</Divider>
                                <div className="ml-2 my-3">
                                    <p className="font-bold text-[16px] mb-1">Điều khoản chung</p>
                                    <p>Mô tả: (Điều khoản được áp dụng cho cả 2 bên)</p>
                                </div>
                                <Form.Item label={<div className="flex justify-between items-center gap-4"><p>Điều khoản chung</p><Popover content={() => getTermsContent('generalTerms')} title="Danh sách Điều khoản chung đã chọn" trigger="hover" placement="right"><Button icon={<EyeFilled />} /></Popover></div>} name="generalTerms" rules={[{ required: true, message: "Vui lòng chọn điều khoản chung!" }]} className="ml-2">
                                    <LazySelect loadDataCallback={loadGenaralData} options={generalData?.data.content} showSearch mode="multiple" placeholder="Chọn điều khoản chung" onChange={handleSelectChange} dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <Divider style={{ margin: "8px 0" }} />
                                            <Space style={{ padding: "0 8px 4px" }}>
                                                <Button type="primary" icon={<PlusOutlined />}>Thêm điều khoản</Button>
                                            </Space>
                                        </>
                                    )} />
                                </Form.Item>
                                <Form.Item label={<div className="ml-2 my-3 font-bold text-[16px] flex justify-between items-center gap-5"><p>Các điều khoản khác</p>{selectedOthersTerms.length > 0 && <Popover content={getAllAdditionalTermsContent} title="Xem trước tất cả điều khoản đã chọn" trigger="click" placement="right" overlayStyle={{ maxWidth: '70vw' }}><Button icon={<EyeFilled />}>Xem trước tất cả</Button></Popover>}</div>} name="additionalTerms">
                                    <Checkbox.Group className="flex flex-col ml-4 gap-4" options={[
                                        { label: "ĐIỀU KHOẢN BỔ SUNG", value: 1 },
                                        { label: "QUYỀN VÀ NGHĨA VỤ CÁC BÊN", value: 2 },
                                        { label: "ĐIỀN KHOẢN BẢO HÀNH VÀ BẢO TRÌ", value: 3 },
                                        { label: "ĐIỀU KHOẢN VỀ VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI", value: 4 },
                                        { label: "ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG", value: 5 },
                                        { label: "ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP", value: 6 },
                                        { label: "ĐIỀU KHOẢN BẢO MẬT", value: 7 }
                                    ]} onChange={handleCheckboxChange} />
                                </Form.Item>
                                <div className="flex flex-col">
                                    {selectedOthersTerms.map(termId => (
                                        <TermSection key={termId} termId={termId} title={termConfigs[termId].title} form={form} loadDataCallback={termConfigs[termId].loadData} />
                                    ))}
                                </div>
                                <Divider orientation="center">Điều khoản đặc biệt</Divider>
                                <Form.Item
                                    label={<div className="ml-2 my-3"><p className="font-bold text-[16px]">ĐIỀU KHOẢN ĐẶC BIỆT BÊN A</p><p>Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên A)</p></div>} name="specialTermsA">
                                    <TextArea rows={4} placeholder="Nhập điều khoản bên A" />
                                </Form.Item>
                                <Form.Item label={<div className="ml-2 my-3"><p className="font-bold text-[16px]">ĐIỀU KHOẢN ĐẶC BIỆT BÊN B</p><p>Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên B)</p></div>} name="specialTermsB">
                                    <TextArea rows={4} placeholder="Nhập điều khoản bên B" />
                                </Form.Item>
                            </div>
                            <div ref={otherContentRef} className="pt-[50px] pb-[400px]">
                                <Divider orientation="center">Các nội dung khác</Divider>
                                <Form.Item name="appendixEnabled" valuePropName="checked">
                                    <div className="flex items-center">
                                        <Switch className="mr-4" onChange={(checked) => { form.setFieldsValue({ appendixEnabled: checked }); setIsAppendixEnabled(checked); }} checked={form.getFieldValue("appendixEnabled") ?? isAppendixEnabled} />
                                        <p className="text-sm">Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>
                                    </div>
                                </Form.Item>
                                <Form.Item name="transferEnabled" valuePropName="checked">
                                    <div className="flex items-center">
                                        <Switch className="mr-4" onChange={(checked) => { form.setFieldsValue({ transferEnabled: checked }); setIsTransferEnabled(checked); }} checked={form.getFieldValue("transferEnabled") ?? isTransferEnabled} />
                                        <p className="text-sm">Cho phép chuyển nhượng hợp đồng</p>
                                    </div>
                                </Form.Item>
                                <Form.Item name="violate" valuePropName="checked">
                                    <div className="flex items-center">
                                        <Switch className="mr-4" onChange={(checked) => { form.setFieldsValue({ violate: checked }); setIsisViolate(checked); }} checked={form.getFieldValue("violate") ?? isViolate} />
                                        <p className="text-sm">Cho phép đơn phương hủy hợp đồng nếu vi phạm các quy định trong điều khoản hợp đồng</p>
                                    </div>
                                </Form.Item>
                                <Form.Item name="suspend" valuePropName="checked">
                                    <div className="flex items-center">
                                        <Switch className="mr-4" onChange={(checked) => { form.setFieldsValue({ suspend: checked }); setIsSuspend(checked); }} checked={form.getFieldValue("suspend") ?? isSuspend} />
                                        <p className="text-sm">Cho phép tạm ngưng hợp đồng trong các trường hợp bất khả kháng được ghi rõ</p>
                                    </div>
                                </Form.Item>
                                {isSuspend && (
                                    <Form.Item label="Trường hợp" name="suspendContent" rules={[{ required: true, message: "Vui lòng nhập rõ trường hợp tạm ngưng!" }]}>
                                        <TextArea className="w-[450px]" placeholder="Nhập nội dung" rows={4} />
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
            title: "Thời gian thông báo",
            content: (
                <div className="p-4 space-y-4">
                    <h3 className="font-bold">Thiết lập thời gian thông báo cho các mốc</h3>
                    <Row gutter={16} justify={"center"}>
                        <Col span={6}>
                            <Form.Item label="Ngày có hiệu lực (đã chọn)" name="effectiveDate">
                                <DatePicker className="w-full" disabled format="DD/MM/YYYY HH:mm:ss" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Ngày thông báo"
                                name="notifyEffectiveDate"
                                rules={[{ required: true, message: "Vui lòng chọn ngày thông báo!" }]}>
                                <DatePicker className="w-full"
                                    format="DD/MM/YYYY HH:mm:ss"
                                    showTime
                                    disabledDate={(current) => {
                                        const effectiveDate = form.getFieldValue('effectiveDate');
                                        return !current || current > effectiveDate || current < dayjs().startOf('day');
                                    }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Nội dung thông báo"
                                name="notifyEffectiveContent"
                                rules={[{ required: true, message: "Vui lòng nhập nội dung thông báo!" }]} >
                                <Input.TextArea rows={2} placeholder="Nhập nội dung thông báo" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16} justify={"center"}>
                        <Col span={6}>
                            <Form.Item label="Ngày hết hiệu lực (đã chọn)" name="expiryDate">
                                <DatePicker className="w-full" disabled format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item label="Ngày thông báo" name="notifyExpiryDate" rules={[{ required: true, message: "Vui lòng chọn ngày thông báo!" }]}>
                                <DatePicker className="w-full"
                                    format="DD/MM/YYYY HH:mm:ss"
                                    showTime disabledDate={(current) => {
                                        const expiryDate = form.getFieldValue('expiryDate');
                                        return !current || current > expiryDate || current < dayjs().startOf('day');
                                    }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Nội dung thông báo" name="notifyExpiryContent" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung thông báo!" }]} >
                                <Input.TextArea rows={2} placeholder="Nhập nội dung thông báo" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.List name="payments">
                        {(fields) => (
                            <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <div key={key} className="border p-3 rounded mb-4">
                                        <h4 className="font-bold">Đợt thanh toán {index + 1}</h4>
                                        <Row gutter={16} justify={"center"}>
                                            <Col span={6}>
                                                <Form.Item {...restField} label="Ngày thanh toán (đã chọn)" name={[name, "paymentDate"]}>
                                                    <DatePicker className="w-full" disabled format="DD/MM/YYYY HH:mm:ss" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item {...restField}
                                                    label="Ngày thông báo"
                                                    name={[name, "notifyPaymentDate"]}
                                                    rules={[{ required: true, message: "Vui lòng chọn ngày thông báo!" }]}>
                                                    <DatePicker
                                                        className="w-full"
                                                        format="DD/MM/YYYY HH:mm:ss"
                                                        showTime
                                                        disabledDate={(current) => {
                                                            const paymentDate = form.getFieldValue(['payments', name, 'paymentDate']);
                                                            return !current || current > paymentDate || current < dayjs().startOf('day');
                                                        }} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item {...restField}
                                                    label="Nội dung thông báo"
                                                    name={[name, "notifyPaymentContent"]}
                                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung thông báo!" }]} >
                                                    <Input.TextArea rows={2} placeholder="Nhập nội dung thông báo" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                            </>
                        )}
                    </Form.List>
                    <Form.List name="customNotifications">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                                        <Form.Item {...restField} name={[name, "date"]} rules={[{ required: true, message: "Chọn ngày thông báo" }]}>
                                            <DatePicker style={{ width: 200 }} showTime placeholder="Chọn ngày thông báo" />
                                        </Form.Item>
                                        <Form.Item {...restField}
                                            name={[name, "content"]}
                                            rules={[{ required: true, whitespace: true, message: "Nhập nội dung thông báo" }]}>
                                            <Input style={{ flex: 1 }} placeholder="Nhập nội dung thông báo" />
                                        </Form.Item>
                                        <Button type="text" danger icon={<DeleteFilled />} onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>Thêm thông báo</Button>
                            </>
                        )}
                    </Form.List>
                </div>
            ),
        },
    ];

    return (
        <div className="min-h-[100vh]">
            {isLoadingContract && <Spin tip="Đang tải dữ liệu hợp đồng..." />}
            <Form form={form}
                layout="vertical"
                onFinish={onFinish}
                onValuesChange={(changedValues, allValues) => {
                    if (changedValues.contractItems) {
                        const total = (allValues.contractItems || []).reduce(
                            (sum, item) => sum + (item.amount || 0),
                            0
                        );
                        // console.log(total)
                        handleChange(total)
                        form.setFieldsValue({ totalValue: total });
                    }
                }}
                initialValues={{
                    contractItems: [{ description: '', amount: null }],
                }}
            >
                {cmtData?.data[0] && (
                    <div className="fixed top-20 right-4 z-50">
                        <Button
                            className="w-fit h-fit"
                            onClick={showDrawer}>
                            <p className="flex justify-center items-center py-2"><LeftOutlined style={{ fontSize: 20 }} /><Image preview={false} width={40} height={40} src={viewComment} /></p>
                        </Button>
                    </div>
                )}

                <Steps current={currentStep} className="mb-8">
                    {steps.map((item, index) => <Step key={index} title={item.title} />)}
                </Steps>
                <div className="mb-6">{steps[currentStep].content}</div>
                <div className="flex justify-end space-x-2">
                    {currentStep > 0 && <Button onClick={prev}><CaretLeftOutlined /> Quay lại</Button>}
                    {currentStep < steps.length - 1 && <Button type="primary" onClick={next}>Tiếp theo <CaretRightOutlined /></Button>}
                    {currentStep === steps.length - 1 && (
                        <Button type="primary" htmlType="submit" loading={loadingUpdateContract}>Cập nhật hợp đồng <CheckCircleOutlined /></Button>
                    )}
                </div>
            </Form>
            <Modal title="Thêm căn cứ pháp lý" open={isAddLegalModalOpen} onOk={handleAddOk} onCancel={() => setIsAddLegalModalOpen(false)} okText="Lưu" cancelText="Hủy">
                <Form layout="vertical" form={form}>
                    <Form.Item
                        name="legalLabel"
                        label="Tên căn cứ pháp lý"
                        rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên căn cứ!" }]}>
                        <Input value={newLegalBasis.name} onChange={(e) => setNewLegalBasis({ ...newLegalBasis, name: e.target.value })} placeholder="Nhập tên căn cứ pháp lý" />
                    </Form.Item>
                    <Form.Item
                        name="legalContent"
                        label="Nội dung"
                        rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung căn cứ!" }]}>
                        <TextArea value={newLegalBasis.content} onChange={(e) => setNewLegalBasis({ ...newLegalBasis, content: e.target.value })} placeholder="Nhập nội dung" rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
            <Drawer
                title="Bình luận hợp đồng"
                placement="right"
                onClose={closeDrawer}
                open={drawerVisible}
                width={600}
            >
                <div className="p-4 min-h-full">
                    {cmtData?.data ? (
                        cmtData?.data?.map((cmt, index) => (
                            <div className=" rounded-md ">
                                {/* Tên người bình luận */}
                                <div className="font-semibold  text-base mb-2">
                                    <p>{cmt.commenter}</p>
                                </div>
                                <div className="text-xs mb-4">
                                    {formatDate(cmt.commentedAt)}
                                </div>
                                <Card
                                    className="w-full min-h-3 resize-none shadow-lg"
                                    readOnly
                                >
                                    {cmt.comment}
                                </Card>
                            </div>
                        ))

                    ) : (
                        <p className="">Không có bình luận nào</p>
                    )}
                </div>
            </Drawer>
        </div>
    );
};

export default EditContract;