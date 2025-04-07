import React, { useCallback, useEffect, useRef, useState } from "react";
import { Steps, Form, Input, Select, DatePicker, Checkbox, Button, Space, Divider, message, Modal, Popover, Switch, Collapse, ConfigProvider, Timeline, Row, Col } from "antd";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { useEditTemplateMutation, useGetAllTemplateQuery, useLazyGetAllTemplateQuery, useLazyGetTemplateDataDetailQuery } from "../../services/TemplateAPI";
import LazySelectContractType from "../../hooks/LazySelectContractType";
import { useCreateContractTypeMutation, useLazyGetContractTypeQuery } from "../../services/ContractAPI";
import { CheckCircleFilled, EyeFilled, PlusOutlined } from "@ant-design/icons";
import LazySelect from "../../hooks/LazySelect";
import { useCreateClauseMutation, useLazyGetClauseManageQuery, useLazyGetLegalCreateContractQuery, useLazyGetLegalQuery } from "../../services/ClauseAPI";
import LazyLegalSelect from "../../hooks/LazyLegalSelect";
import RichTextEditor, {
} from 'reactjs-tiptap-editor';
import 'reactjs-tiptap-editor/style.css';
import 'katex/dist/katex.min.css';
import { extensions } from "../../utils/textEditor";
import { PreviewSection } from "../../components/ui/PreviewSection";
import { TermSection } from "../../config/TermConfig";
import PreviewContract from "../../components/ui/PreviewContract";
import { useDispatch, useSelector } from "react-redux";

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

// Thêm các constant cho nội dung thông báo mặc định
const DEFAULT_NOTIFICATIONS = {
    effective: "Hợp đồng sẽ có hiệu lực vào ngày",
    expiry: "Hợp đồng sẽ hết hiệu lực vào ngày",
    payment: "Đến hạn thanh toán đợt"
};

const EditTemplate = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const { id } = useParams();
    const inputRef = useRef(null);
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [newTypeCreate, setNewTypeCreate] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [templateDataSelected, setTemplateDataSelected] = useState(null);
    const [isAddLegalModalOpen, setIsAddLegalModalOpen] = useState(false);
    const [newLegalBasis, setNewLegalBasis] = useState({ name: '', content: '' });
    const [content, setContent] = useState('')
    const [isVATChecked, setIsVATChecked] = useState(false);
    const [isDateLateChecked, setIsDateLateChecked] = useState(false);
    const [isAutoRenew, setIsAutoRenew] = useState(false);
    const [selectedOthersTerms, setSelectedOthersTerms] = useState([]);
    const [isAppendixEnabled, setIsAppendixEnabled] = useState(false);
    const [isTransferEnabled, setIsTransferEnabled] = useState(false);
    const [isSuspend, setIsSuspend] = useState(false);
    const [isViolate, setIsisViolate] = useState(false);
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [getContractTypeData, { data: contractTypeData, isLoading: isLoadingContractType }] = useLazyGetContractTypeQuery()
    const [getTemplateData, { data: templateData, isLoading }] = useLazyGetAllTemplateQuery()
    const [createContractType, { isLoadingCreateType }] = useCreateContractTypeMutation()
    const [getTemplateDetail, { data }] = useLazyGetTemplateDataDetailQuery();
    const [getContractLegal] = useLazyGetLegalCreateContractQuery();
    const [getGeneralTerms, { data: generalData, isLoading: loadingGenaral, refetch: refetchGenaral }] = useLazyGetClauseManageQuery();
    const [newGeneralTerm, setNewGeneralTerm] = useState({ name: "", typeId: null, content: "" });
    const [isAddGeneralModalOpen, setIsAddGeneralModalOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('general');
    const generalInfoRef = useRef(null);
    const mainContentRef = useRef(null);
    const termsRef = useRef(null);
    const otherContentRef = useRef(null);
    const containerRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [showScroll, setShowScroll] = useState(false);

    const [createClause] = useCreateClauseMutation();
    const [editTemplate, { isLoading: loadingEdit }] = useEditTemplateMutation();
    const { data: templatedata, refetch: refetchDataTable } = useGetAllTemplateQuery();

    // Thêm useEffect để lấy số ngày thông báo từ API

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

    const loadContractTypeData = async () => {
        return getContractTypeData().unwrap();
    };
    const loadContractTemplateDetail = async (templateId) => {
        return getTemplateDetail(templateId).unwrap();
    };


    const handleSelectChange = (newValues) => {
        form.setFieldsValue({ generalTerms: newValues });
    };


    // Xử lý chuyển bước
    const next = async () => {
        try {
            // Validate current step fields (nếu cần)
            await form.validateFields();
            setCurrentStep(currentStep + 1);
        } catch (errorInfo) {
            console.log(errorInfo)
            message.error(errorInfo.errorFields.length > 1 ? errorInfo.errorFields[0].errors[0] + " và các trường bắt buộc khác" : errorInfo.errorFields[0].errors[0]);
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    const onFinish = async () => {
        const data = form.getFieldsValue(true);
        // console.log(data)
        // Xử lý additionalConfig: chuyển các key số thành "additionalPropX"
        const additionalConfig = Object.keys(data)
            .filter(key => !isNaN(key)) // Lọc các key là số
            .reduce((acc, key) => {
                const { A = [], B = [], Common = [] } = data[key];

                if (A.length > 0 || B.length > 0 || Common.length > 0) {
                    acc[key] = {
                        ...(Common.length > 0 && { Common: Common.map(id => ({ id })) }),
                        ...(A.length > 0 && { A: A.map(id => ({ id })) }),
                        ...(B.length > 0 && { B: B.map(id => ({ id })) }),
                    };
                }
                return acc;
            }, {});

        // Xây dựng object template theo đúng định dạng yêu cầu
        const template = {
            templateId: parseInt(id, 10),
            contractTitle: data.contractTitle,
            contractTypeId: data.contractType,
            legalBasisTerms: data.legalBasisTerms ? data.legalBasisTerms.map(item => item) : [],
            appendixEnabled: data.appendixEnabled,
            transferEnabled: data.transferEnabled,
            violate: data.violate,
            suspend: data.suspend,
            suspendContent: data.suspendContent,
            generalTerms: data.generalTerms ? data.generalTerms.map(item => item) : [],
            additionalTerms: data.additionalTerms ? data.additionalTerms.map(item => item) : [],
            otherTerms: data.otherTerms ? data.otherTerms.map(item => item) : [],
            additionalConfig: additionalConfig,
            specialTermsA: data.specialTermsA,
            specialTermsB: data.specialTermsB,
            contractContent: data.contractContent,
            autoAddVAT: data.autoAddVAT,
            vatPercentage: data.vatPercentage,
            isDateLateChecked: data.isDateLateChecked,
            maxDateLate: data.maxDateLate,
            autoRenew: data.autoRenew,
        };
        const response = await editTemplate(template).unwrap();
        if (response.status === "CREATED") {
            form.resetFields();
            navigate('/managetemplate');
            message.success("Cập nhật mẫu hợp đồng thành công!");
        } else {
            message.error(response.message);
        }
        await refetchDataTable()
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
        let name = form.getFieldValue('legalLabel') || '';
        let content = form.getFieldValue('legalContent') || '';
        try {
            const result = await createClause({ idType: 8, label: name, value: content }).unwrap();
            if (result.status === "CREATED") {
                message.success("Tạo điều khoản thành công");
            }
            loadLegalData();
            setIsAddLegalModalOpen(false);
            form.resetFields();
        } catch (error) {
            console.error("Lỗi tạo điều khoản:", error);
            message.error("Có lỗi xảy ra khi tạo điều khoản");
        }

    };

    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        }
    }

    const onValueChange = useCallback(debounce((value) => {
        setContent(value);
        form.setFieldsValue({ contractContent: value });
    }, 100), []);


    useEffect(() => {
        if (id) {
            loadContractTemplateDetail(id)
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
                        contractTitle: data.data.contractTitle,
                        specialTermsA: data.data?.specialTermsA,
                        specialTermsB: data.data?.specialTermsB,
                        appendixEnabled: data.data?.appendixEnabled,
                        transferEnabled: data.data?.transferEnabled,
                        contractType: data.data?.contractTypeId,
                        legalBasisTerms: data.data.legalBasisTerms?.map(term => term.original_term_id),
                        // contractContent: data.data.contractContent,
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
    }, [id]);


    const hanldeOpenAddLegalModal = () => {
        setIsAddLegalModalOpen(true);
    };
    const getAllAdditionalTermsContent = () => {
        // Ánh xạ termId với tiêu đề tương ứng
        const termTitles = {
            1: 'ĐIỀU KHOẢN BỔ SUNG',
            2: 'QUYỀN VÀ NGHĨA VỤ CÁC BÊN',
            3: 'ĐIỀU KHOẢN BẢO HÀNH VÀ BẢO TRÌ',
            4: 'ĐIỀU KHOẢN VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI',
            5: 'ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG',
            6: 'ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP',
            7: 'ĐIỀU KHOẢN BẢO MẬT'
        };

        // Hàm hỗ trợ kết hợp và loại bỏ các mục trùng lặp
        const combineUniqueTerms = (formTerms, templateTerms) => {
            const uniqueTerms = new Map();

            // Thêm các mục từ template
            if (templateTerms && templateTerms.length > 0) {
                templateTerms.forEach(term => {
                    const termId = term.original_term_id;
                    if (termId && !uniqueTerms.has(termId)) {
                        uniqueTerms.set(termId, term);
                    }
                });
            }

            // Thêm các mục từ form nếu chưa có
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

        // Hàm giúp hiển thị một loại điều khoản
        const renderTermSection = (termId) => {
            // Chỉ hiển thị các điều khoản đã chọn
            if (!selectedOthersTerms.includes(termId)) {
                return null;
            }

            // Lấy dữ liệu từ form
            const formData = form.getFieldValue(String(termId)) || {
                A: [],
                B: [],
                Common: []
            };

            // Lấy dữ liệu từ template
            const templateData = templateDataSelected?.additionalConfig?.[String(termId)] || {
                A: [],
                B: [],
                Common: []
            };

            // Kết hợp dữ liệu từ form và template, loại bỏ trùng lặp
            const commonTerms = combineUniqueTerms(formData.Common, templateData.Common);
            const aTerms = combineUniqueTerms(formData.A, templateData.A);
            const bTerms = combineUniqueTerms(formData.B, templateData.B);

            // Kiểm tra xem có dữ liệu nào để hiển thị không
            const hasCommonTerms = commonTerms.length > 0;
            const hasATerms = aTerms.length > 0;
            const hasBTerms = bTerms.length > 0;
            const hasNoTerms = !hasCommonTerms && !hasATerms && !hasBTerms;

            if (hasNoTerms) {
                return null;
            }

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

        // Hiển thị tất cả các loại điều khoản đã chọn
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
            rightsAndObligations: 'Quyền và nghĩa vụ các bên',
            warrantyTerms: 'Điều khoản bảo hành và bảo trì',
            breachTerms: 'Điều khoản về vi phạm và bồi thường',
            terminationTerms: 'Điều khoản về chấm dứt hợp đồng',
            disputeTerms: 'Điều khoản về giải quyết tranh chấp',
            privacyTerms: 'Điều khoản bảo mật'
        };

        // Mapping from field names to template data properties
        const templateDataMapping = {
            legalBasis: 'legalBasisTerms',
            generalTerms: 'generalTerms',
            additionalTerms: 'additionalTerms',
            rightsAndObligations: 'rightsAndObligationsTerms',
            warrantyTerms: 'warrantyTerms',
            breachTerms: 'breachTerms',
            terminationTerms: 'terminationTerms',
            disputeTerms: 'disputeTerms',
            privacyTerms: 'privacyTerms'
        };

        const terms = form.getFieldValue(fieldName) || [];

        // Dynamically get the corresponding template data based on the field name
        const templateProperty = templateDataMapping[fieldName];
        const valuefromDetail = templateDataSelected?.[templateProperty] || [];

        // Create a set to track unique term IDs
        const uniqueTermIds = new Set();
        const allUniqueTerms = [];

        // First add terms from template data
        if (valuefromDetail.length > 0) {
            valuefromDetail.forEach(term => {
                const termId = term.original_term_id;
                if (!uniqueTermIds.has(termId)) {
                    uniqueTermIds.add(termId);
                    allUniqueTerms.push(term);
                }
            });
        }

        // Then add terms from form that aren't already included
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
                    <div className="text-gray-500 italic">Chưa có {fieldLabels[fieldName].toLowerCase()} nào được chọn</div>
                )}
            </div>
        );
    };

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
        form.setFieldsValue({ contractNumber });
    }, [form, form.getFieldValue('contractName'), form.getFieldValue('signingDate')]);

    useEffect(() => {
        if (containerRef.current) {
            const containerHeight = containerRef.current.scrollHeight;
            setIsOverflowing(containerHeight > 270);
        }
    }, [form.getFieldValue('legalBasisTerms')]);

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


    // Check which section is visible when scrolling
    const handleScroll = () => {
        const scrollPosition = window.scrollY + 100; // Add offset for better detection

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
        if (window.scrollY > 450) {
            setShowScroll(true);
        } else {
            setShowScroll(false);
        }
    };

    // Add scroll event listener
    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const showAddGeneralModal = async (value) => {
        setNewGeneralTerm({ name: "", typeId: value, content: "" });
        setIsAddGeneralModalOpen(true);
    }
    const handleAddOkGeneralTerm = async () => {
        const { name, typeId, content } = newGeneralTerm;
        if (!name || !typeId || !content) {
            message.error("Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        try {
            const result = await createClause({ typeTermId: typeId, label: name, value: content }).unwrap();
            // console.log(result);
            if (result.status === "CREATED") {
                message.success("Tạo điều khoản thành công");
            }
            handleAddGeneralCancel()
            await refetchGenaral();
            handleAddGeneralCancel();

        } catch (error) {
            console.error("Lỗi tạo điều khoản:", error);
            message.error(error.data.message);
        }
    };

    const handleAddGeneralCancel = () => {
        setIsAddGeneralModalOpen(false);
        setNewGeneralTerm({ name: "", typeId: null, content: "" });
    };


    // Các bước của form
    const steps = [
        {
            title: "Thông tin cơ bản",
            content: (
                <div className="space-y-4">
                    <Form.Item
                        label="Tên mẫu hợp đồng"
                        name="contractTitle"
                        rules={[{ required: true,whitespace: true, message: "Vui lòng nhập tên hợp đồng!" }]}
                    >
                        <Input placeholder="Nhập tên hợp đồng" />
                    </Form.Item>
                    <Form.Item
                        label="Loại hợp đồng"
                        name="contractType"
                        rules={[{ required: true, message: "Vui lòng chọn loại hợp đồng!" }]}
                    >
                        {/* chưa có phân trang và search  */}
                        <LazySelectContractType
                            loadDataCallback={loadContractTypeData}
                            options={contractTypeData}
                            showSearch
                            // labelInValue
                            placeholder="chọn loại hợp đồng"
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
                                        <Button type="text" icon={<PlusOutlined />} onClick={addNewType} loading={isLoadingCreateType} >
                                            Thêm
                                        </Button>
                                    </Space>
                                </>
                            )}
                        />
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
                                                            {form.getFieldValue('contractTitle') ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) : <p className="mr-[5px]"></p>}
                                                            1. Tiêu đề hợp đồng
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {form.getFieldValue('contractTitle') ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) : <p className="mr-[5px]"></p>}
                                                            2. Thông tin các bên
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {(form.getFieldValue('legalBasis') && (form.getFieldValue('legalBasis').length > 0)) ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
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
                                                            {(isVATChecked || isDateLateChecked) ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
                                                            5. Giá trị và thanh toán
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {isAutoRenew ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
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
                                                            {(form.getFieldValue('generalTerms') && (form.getFieldValue('generalTerms').length > 0)) ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
                                                            7. Điều khoản chung
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {selectedOthersTerms.length > 0 ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
                                                            8. Điều khoản khác
                                                        </div>
                                                        <div className="mt-1 cursor-pointer">
                                                            {selectedOthersTerms.length > 0 ? (<CheckCircleFilled style={{ marginRight: '5px', color: '#5edd60' }} />) :
                                                                <span className="mr-[20px]"></span>}
                                                            9. Điều khoản đặc biệt
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
                                        },
                                    ]}
                                />
                            </div>
                        </Col>

                        <Col xs={24} md={18}>
                            <Form.Item
                                className="w-full"
                                label={
                                    <div className="flex justify-between items-center gap-4">
                                        <p>Căn phứ pháp lý</p>
                                        <Popover
                                            content={() => getTermsContent('legalBasis')}
                                            title="Danh sách căn cứ pháp lý đã chọn"
                                            trigger="hover"
                                            placement="right"
                                        >
                                            <Button icon={<EyeFilled />} />
                                        </Popover>
                                    </div>
                                }
                                name='legalBasisTerms'
                                rules={[{ required: true, message: "Vui lòng chọn căn cứ pháp lý!" }]}
                            >
                                <LazyLegalSelect
                                    loadDataCallback={loadLegalData}
                                    showSearch
                                    mode="multiple"
                                    defaultValue={templateDataSelected?.legalBasisTerms?.map(term => term.original_term_id) || []}
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
                            <Form.Item
                                label={
                                    <div className="flex justify-between items-center gap-4">
                                        <p>Soạn thảo nội dung hợp đồng</p>
                                        <Popover
                                            content={
                                                <PreviewSection className='w-[80%]' content={content} isDarkMode={isDarkMode} />
                                            }
                                            trigger="hover"
                                            placement="right"
                                        >
                                            <Button icon={<EyeFilled />} />
                                        </Popover>
                                    </div>
                                }
                                name="contractContent"
                                className="mt-5"
                                rules={[{ required: true, message: "Vui lòng nhập nội dung hợp đồng!" }]}
                            >
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

                            </Form.Item>
                            <Divider orientation="center">Thanh toán</Divider>
                            {/* Sử dụng Form.List để cho phép thêm nhiều lần thanh toán */}

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


                            <Divider orientation="center" className="text-lg">Thời gian và hiệu lực</Divider>
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


                            <Divider orientation="center" className="text-lg">Điều khoản & Cam kết</Divider>
                            <div className=" ml-2 my-3 ">
                                <p className="font-bold text-[16px] mb-1"> Điều khoản chung</p>
                                <p className="">Mô tả: (Điều khoản được áp dụng cho cả 2 bên) </p>
                            </div>
                            <Form.Item
                                label={
                                    <div className="flex justify-between items-center gap-4">
                                        <p>Điều khoản chung </p>
                                        <Popover
                                            content={() => getTermsContent('generalTerms')}
                                            title="Danh sách Điều khoản chung đã chọn"
                                            trigger="hover"
                                            placement="right"
                                        >
                                            <Button icon={<EyeFilled />} />
                                        </Popover>
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
                                    labelInValue
                                    mode="multiple"
                                    placeholder="Chọn điều khoản chung"
                                    onChange={handleSelectChange}
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <Divider style={{ margin: "8px 0" }} />
                                            <Space style={{ padding: "0 8px 4px" }}>
                                                <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddGeneralModal(9)}>
                                                    Thêm điều khoản
                                                </Button>
                                            </Space>
                                        </>
                                    )}
                                />
                            </Form.Item>

                            <Form.Item
                                label={
                                    <div className="ml-2 my-3 font-bold text-[16px] flex justify-between items-center gap-5">
                                        <p> Các điều khoản khác</p>

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


                            <Divider orientation="center">Điều khoản đặc biệt</Divider>
                            <Form.Item
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
                            </Form.Item>

                            <Divider orientation="center">Các nội dung khác</Divider>

                            <Form.Item name="appendixEnabled" valuePropName="checked">
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
                            </Form.Item>

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
                        </Col>
                    </Row>
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
    ];

    return (
        <div className="min-h-[100vh]">
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Steps current={currentStep} className="mb-8">
                    {steps.map((item, index) => (
                        <Step key={index} title={item.title} />
                    ))}
                </Steps>
                <div className="mb-6">{steps[currentStep].content}</div>
                <div className="flex justify-end space-x-2">
                    {currentStep > 0 && (
                        <Button onClick={prev}>Quay lại</Button>
                    )}
                    {currentStep < steps.length - 1 && (
                        <Button type="primary" onClick={next}>Tiếp theo</Button>
                    )}
                    {currentStep === steps.length - 1 && (
                        <Button type="primary" htmlType="submit">Gửi hợp đồng</Button>
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
                    form={form}
                >
                    <Form.Item
                        name="legalLabel"
                        label="Tên căn cứ pháp lý"
                        rules={[{ required: true, message: "Vui lòng nhập tên căn cứ!" }]}
                    >
                        <Input
                            value={newLegalBasis.name}
                            onChange={(e) => setNewLegalBasis({ ...newLegalBasis, name: e.target.value })}
                            placeholder="Nhập tên căn cứ pháp lý"
                        />
                    </Form.Item>
                    <Form.Item
                        rules={[{ required: true, message: "Vui lòng nhập nội dung căn cứ!" }]}
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

            <Modal
                title="Thêm điều khoản chung"
                open={isAddGeneralModalOpen}
                onOk={handleAddOkGeneralTerm}
                onCancel={handleAddGeneralCancel}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Tên điều khoản"
                        rules={[{ required: true, message: "Vui lòng nhập tên điều khoản!" }]}
                    >
                        <Input
                            value={newGeneralTerm.name}
                            onChange={(e) => setNewGeneralTerm({ ...newGeneralTerm, name: e.target.value })}
                            placeholder="Nhập tên điều khoản"
                        />
                    </Form.Item>
                    <Form.Item
                        label="Nội dung điều khoản"
                        rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
                    >
                        <TextArea
                            value={newGeneralTerm.content}
                            onChange={(e) => setNewGeneralTerm({ ...newGeneralTerm, content: e.target.value })}
                            placeholder="Nhập nội dung"
                            rows={4}
                        />
                    </Form.Item>
                </Form>
            </Modal>

        </div>
    );
};

export default EditTemplate;
