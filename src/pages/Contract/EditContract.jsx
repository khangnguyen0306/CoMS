import React, { useCallback, useEffect, useRef, useState } from "react";
import { Steps, Form, Input, Select, DatePicker, Checkbox, Button, Space, Divider, message, Row, Col, Spin, Modal, Popover, InputNumber, Typography, Switch, Collapse, ConfigProvider } from "antd";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { useLazyGetAllTemplateQuery } from "../../services/TemplateAPI";
import { FcNext } from "react-icons/fc";
import { useLazyGetPartnerListQuery } from "../../services/PartnerAPI";
import LazySelectPartner from "../../hooks/LazySelectPartner";
import LazySelectContractType from "../../hooks/LazySelectContractType";
import { useCreateContractMutation, useCreateContractTypeMutation, useLazyGetContractDetailQuery, useLazyGetContractTypeQuery, useUpdateContractMutation } from "../../services/ContractAPI";
import { DeleteFilled, EyeFilled, PlusOutlined } from "@ant-design/icons";
import LazySelect from "../../hooks/LazySelect";
import { useCreateClauseMutation, useLazyGetClauseManageQuery, useLazyGetLegalCreateContractQuery } from "../../services/ClauseAPI";
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

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const DEFAULT_NOTIFICATIONS = {
    effective: "Hợp đồng sẽ có hiệu lực vào ngày",
    expiry: "Hợp đồng sẽ hết hiệu lực vào ngày",
    payment: "Đến hạn thanh toán đợt"
};

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
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [notificationDays, setNotificationDays] = useState(null);
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

    console.log(contractData)

    // Fetch contract data in edit mode
    useEffect(() => {
        if (id) {
            getContract(id);
        }
    }, [id]);

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
    const formatDate = (date) => date ? dayjs(date).format("YYYY-MM-DDTHH:mm:ss[Z]") : null;
    const onFinish = async (values) => {
        const data = form.getFieldsValue(true);
        console.log(data)
        const additionalConfig = Object.keys(data)
            .filter(key => !isNaN(key))
            .reduce((acc, key) => {
                const { A, B, Common } = data[key];
                if (A.length > 0 || B.length > 0 || Common.length > 0) {
                    acc[key] = {
                        ...(A.length > 0 && { A }),
                        ...(B.length > 0 && { B }),
                        ...(Common.length > 0 && { Common }),
                    };
                }
                return acc;
            }, {});

        const templateData = {
            specialTermsA: data.specialTermsA,
            specialTermsB: data.specialTermsB,
            appendixEnabled: data.appendixEnabled,
            transferEnabled: data.transferEnabled,
            violate: data.violate,
            suspend: data.suspend,
            suspendContent: data.suspendContent,
            contractContent: data.contractContent,
            autoAddVAT: data.autoAddVAT,
            vatPercentage: data.vatPercentage,
            isDateLateChecked: data.isDateLateChecked,
            maxDateLate: data.maxDateLate,
            autoRenew: data.autoRenew,
            legalBasisTerms: data.legalBasisTerms,
            generalTerms: data.generalTerms,
            additionalTerms: data.additionalTerms,
            contractTypeId: data.contractTypeId,
            additionalConfig,
            status: data.status
        };

        const excludedFields = [
            "specialTermsA", "specialTermsB", "appendixEnabled", "transferEnabled", "violate", "suspend",
            "suspendContent", "contractContent", "autoAddVAT", "vatPercentage", "isDateLateChecked",
            "maxDateLate", "autoRenew", "legalBasis", "generalTerms", "additionalTerms", "contractType",
            "1", "2", "3", "4", "5", "6", "7", "effectiveDate&expiryDate",
        ];

        const formattedData = Object.keys(data).reduce((acc, key) => {
            if (!excludedFields.includes(key)) {
                if (key === 'templateId') {
                    acc[key] = data[key].value;
                } else if (key === 'partnerId') {
                    acc['partyId'] = data[key];
                } else if (key === "contractName") {
                    acc['title'] = data[key];
                } else if (["effectiveDate", "expiryDate", "signingDate", "notifyEffectiveDate", "notifyExpiryDate"].includes(key)) {
                    acc[key] = formatDate(data[key]);
                } else if (key === "payments" && Array.isArray(data[key])) {
                    acc[key] = data[key].map(payment => ({
                        ...payment,
                        paymentDate: formatDate(payment.paymentDate),
                        notifyPaymentDate: formatDate(payment.notifyPaymentDate),
                    }));
                }
                else {
                    acc[key] = data[key];
                }
            }
            return acc;
        }, {});

        formattedData.TemplateData = templateData;
        formattedData.customNotifications = data.customNotifications;
        console.log(formattedData)

        try {
            const response = await UpdateContract(formattedData).unwrap();
            console.log(response)
            if (response.status === "OK") {
                message.success("Cập nhật hợp đồng thành công!");
                navigate('/contract');
            }
        } catch (error) {
            message.error("Đã xảy ra lỗi khi lưu hợp đồng!");
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
    console.log(form.getFieldsValue(true))
    const steps = [
        {
            title: "Thông tin cơ bản",
            content: (
                <div className="space-y-4">
                    <Form.Item hidden name="contractId" />

                    <Form.Item label="Chọn đối tác" name="partnerId" rules={[{ required: true, message: "Vui lòng chọn đối tác!" }]}>
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
                    <Form.Item label="Tên hợp đồng" name="contractName" rules={[{ required: true, message: "Vui lòng nhập tên hợp đồng!" }]}>
                        <Input placeholder="Nhập tên hợp đồng" />
                    </Form.Item>
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
                </div>
            ),
        },
        {
            title: "Chi tiết hợp đồng",
            content: (
                <div className="space-y-4 w-full">
                    <ConfigProvider>
                        <Collapse defaultActiveKey={['1']}>
                            <Collapse.Panel header="Thông tin cơ bản" key="1">
                                <Form.Item style={{ display: 'none' }} name="contractNumber" />
                                <Form.Item className="mt-5" label="Ngày ký kết" name="signingDate" rules={[{ required: true, message: "Ngày ký kết không được để trống!" }]}>
                                    <DatePicker className="w-full" format="DD/MM/YYYY" disabledDate={(current) => current && current < dayjs().startOf('day')} />
                                </Form.Item>
                                <Form.Item label="Nơi ký kết" name="contractLocation" rules={[{ required: true, message: "Vui lòng chọn nơi ký kết hợp đồng!" }]}>
                                    <Select showSearch placeholder="Chọn nơi ký kết" optionFilterProp="children" filterOption={(input, option) => (option?.value ?? '').toLowerCase().includes(input.toLowerCase())}>
                                        {VietnameseProvinces.map(province => <Option key={province} value={province}>{province}</Option>)}
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    className="w-full"
                                    label={
                                        <div className="flex justify-between items-center gap-4">
                                            <p>Căn cứ pháp lý
                                            </p>
                                            <Popover content={() => getTermsContent('legalBasisTerms')} title="Danh sách căn cứ pháp lý đã chọn" trigger="hover" placement="right">
                                                <Button icon={<EyeFilled />} />
                                            </Popover>
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
                                <Form.Item label={<div className="flex justify-between items-center gap-4"><p>Soạn thảo nội dung hợp đồng</p><Popover content={<PreviewSection className='w-[80%]' content={content} isDarkMode={isDarkMode} />} trigger="hover" placement="right"><Button icon={<EyeFilled />} /></Popover></div>} name="contractContent" className="mt-5" rules={[{ required: true, message: "Vui lòng nhập nội dung hợp đồng!" }]}>
                                    <RichTextEditor output="html" content={content} onChangeContent={onValueChange} extensions={extensions} dark={isDarkMode} hideBubble={true} dense={false} removeDefaultWrapper placeholder="Nhập nội dung hợp đồng tại đây..." contentClass="max-h-[400px] overflow-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-track]:bg-gray-200" />
                                </Form.Item>
                                <Form.Item label="Tổng giá trị hợp đồng" name="totalValue" rules={[{ required: true, message: "Vui lòng nhập tổng giá trị hợp đồng!" }]}>
                                    <InputNumber style={{ width: "100%" }} placeholder="Nhập tổng giá trị hợp đồng" min={0} max={1000000000000000} formatter={(value) => value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " ₫" : ""} parser={(value) => value.replace(/\D/g, "")} onChange={handleChange} />
                                </Form.Item>
                                {textValue && <div className="mt-1 ml-1"><Typography.Text type="secondary">(Bằng chữ: <span className="font-bold">{textValue}</span>)</Typography.Text></div>}
                                <Divider orientation="center">Thanh toán</Divider>
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
                            </Collapse.Panel>
                            <Collapse.Panel header="Thời gian và hiệu lực" key="2">
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
                            </Collapse.Panel>
                            <Collapse.Panel header="Điều khoản & Cam kết" key="3">
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
                                <Form.Item label={<div className="ml-2 my-3"><p className="font-bold text-[16px]">ĐIỀU KHOẢN ĐẶC BIỆT BÊN A</p><p>Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên A)</p></div>} name="specialTermsA">
                                    <TextArea rows={4} placeholder="Nhập điều khoản bên A" />
                                </Form.Item>
                                <Form.Item label={<div className="ml-2 my-3"><p className="font-bold text-[16px]">ĐIỀU KHOẢN ĐẶC BIỆT BÊN B</p><p>Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên B)</p></div>} name="specialTermsB">
                                    <TextArea rows={4} placeholder="Nhập điều khoản bên B" />
                                </Form.Item>
                            </Collapse.Panel>
                            <Collapse.Panel header="Phụ lục & các loại khác" key="4">
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
                            </Collapse.Panel>
                        </Collapse>
                    </ConfigProvider>
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
                            <Form.Item label="Nội dung thông báo" name="notifyExpiryContent" rules={[{ required: true, message: "Vui lòng nhập nội dung thông báo!" }]} >
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
                                                <Form.Item {...restField} label="Ngày thông báo" name={[name, "notifyPaymentDate"]} rules={[{ required: true, message: "Vui lòng chọn ngày thông báo!" }]}>
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
                                                <Form.Item {...restField} label="Nội dung thông báo" name={[name, "notifyPaymentContent"]} rules={[{ required: true, message: "Vui lòng nhập nội dung thông báo!" }]} >
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
                                        <Form.Item {...restField} name={[name, "content"]} rules={[{ required: true, message: "Nhập nội dung thông báo" }]}>
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
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Steps current={currentStep} className="mb-8">
                    {steps.map((item, index) => <Step key={index} title={item.title} />)}
                </Steps>
                <div className="mb-6">{steps[currentStep].content}</div>
                <div className="flex justify-end space-x-2">
                    {currentStep > 0 && <Button onClick={prev}>Quay lại</Button>}
                    {currentStep < steps.length - 1 && <Button type="primary" onClick={next}>Tiếp theo</Button>}
                    {currentStep === steps.length - 1 && (
                        <Button type="primary" htmlType="submit" loading={loadingUpdateContract}>{"Cập nhật hợp đồng"}</Button>
                    )}
                </div>
            </Form>
            <Modal title="Thêm căn cứ pháp lý" open={isAddLegalModalOpen} onOk={handleAddOk} onCancel={() => setIsAddLegalModalOpen(false)} okText="Lưu" cancelText="Hủy">
                <Form layout="vertical" form={form}>
                    <Form.Item name="legalLabel" label="Tên căn cứ pháp lý" rules={[{ required: true, message: "Vui lòng nhập tên căn cứ!" }]}>
                        <Input value={newLegalBasis.name} onChange={(e) => setNewLegalBasis({ ...newLegalBasis, name: e.target.value })} placeholder="Nhập tên căn cứ pháp lý" />
                    </Form.Item>
                    <Form.Item name="legalContent" label="Nội dung" rules={[{ required: true, message: "Vui lòng nhập nội dung căn cứ!" }]}>
                        <TextArea value={newLegalBasis.content} onChange={(e) => setNewLegalBasis({ ...newLegalBasis, content: e.target.value })} placeholder="Nhập nội dung" rows={4} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default EditContract;