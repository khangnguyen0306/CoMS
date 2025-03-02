import React, { useState, useEffect, useCallback, useRef } from "react";
import { Steps, Button, Input, DatePicker, Checkbox, message, Form, Collapse, Skeleton, Empty, Card, Row, Col, Select, ConfigProvider, Radio, Switch, Spin, Divider, Space, Popconfirm, Modal, Popover } from "antd";

import {
    BaseKit,
    Bold,
    BulletList,
    Clear,
    Color,
    ColumnActionButton,
    ExportWord,
    FontFamily,
    FontSize,
    Heading,
    Highlight,
    History,
    HorizontalRule,
    Image,
    ImportWord,
    Indent,
    Italic,
    Link,
    Mention,
    OrderedList,
    SearchAndReplace,
    SlashCommand,
    Strike,
    Table,
    TextAlign,
    Underline,
} from 'reactjs-tiptap-editor/extension-bundle'
import RichTextEditor from 'reactjs-tiptap-editor'
import 'reactjs-tiptap-editor/style.css';
import 'katex/dist/katex.min.css';
import { FaDeleteLeft } from "react-icons/fa6";
import { GrNext } from "react-icons/gr";
import { GrPrevious } from "react-icons/gr";
import { BsSave2Fill } from "react-icons/bs";

const extensions = [
    BaseKit.configure({
    }),
    History,
    SearchAndReplace,
    Clear,
    FontFamily,
    Heading.configure({ spacer: true }),
    FontSize,
    Bold,
    Italic,
    Underline,
    Strike,
    Color.configure({ spacer: true }),
    Highlight,
    BulletList,
    OrderedList,
    TextAlign.configure({ types: ['heading', 'paragraph'], spacer: true }),
    Indent,
    Link,
    Image.configure({
        upload: (files) =>
            new Promise((resolve) => {
                setTimeout(() => {
                    resolve(URL.createObjectURL(files));
                }, 500);
            }),
    }),
    SlashCommand,
    HorizontalRule,
    ColumnActionButton,
    Table,
    ImportWord.configure({
        upload: (files) => {
            console.log("Files received for upload:", files);
            const f = files.map((file) => {
                const url = URL.createObjectURL(file);
                return {
                    src: url,
                    alt: file.name,
                };
            });
            return Promise.resolve(f);
        },
    }),
    ExportWord,
    Mention,
];

import { useGetBussinessInformatinQuery } from "../../services/BsAPI";
import TextArea from "antd/es/input/TextArea";
import { useCreateContractTypeMutation, useDeleteContractTypeMutation, useEditContractTypeMutation, useGetContractTypeQuery } from "../../services/ContractAPI";
import { DeleteOutlined, EditFilled, PlusOutlined } from "@ant-design/icons";
import { useCreateClauseMutation, useGetAllTypeClauseQuery, useGetClauseManageQuery, useLazyGetAllTypeClauseQuery, useLazyGetClauseManageQuery, useLazyGetLegalQuery } from "../../services/ClauseAPI";
import LazySelect from "../../hooks/LazySelect";
import { useCreateTemplateMutation } from "../../services/TemplateAPI";
import { useNavigate } from "react-router-dom";
import { PreviewSection } from "../../components/ui/PreviewSection";
const { Step } = Steps;

const CreateTemplate = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const containerRef = useRef(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [templateName, setTemplateName] = useState("");
    const { data: bsInfor, isLoading, isError } = useGetBussinessInformatinQuery()      ///fix rerendering
    const { data: contractType, isLoading: isLoadingType, isError: ErrorLoadingType, refetch } = useGetContractTypeQuery()
    const [getAllTypeClause, { data: allTypeClause, isLoading: loadingType }] = useLazyGetAllTypeClauseQuery();
    const [getContractLegal, { data: legalData, isLoading: loadingLegal }] = useLazyGetLegalQuery();
    const [getGeneralTerms, { data: generalData, isLoading: loadingGenaral, refetch: refetchGenaral }] = useLazyGetClauseManageQuery({ typeTermIds: 9 });
    const [CreateTemplate, { isLoading: loadingCreateTemplate }] = useCreateTemplateMutation()
    const [content, setContent] = useState('');
    const [isVATChecked, setIsVATChecked] = useState(false);
    const [selectedGeneralTerms, setSelectedGeneralTerms] = useState([]);
    const [selectedlegalBasis, setSelectedlegalBasis] = useState([]);
    const [selectedOthersTerms, setSelectedOthersTerms] = useState([]);
    const [isAppendixEnabled, setIsAppendixEnabled] = useState(false);
    const [isTransferEnabled, setIsTransferEnabled] = useState(false);
    const [isDateLateChecked, setIsDateLateChecked] = useState(false);
    const [isViolate, setIsisViolate] = useState(false);
    const [isAutoRenew, setIsAutoRenew] = useState(false);
    const [isSuspend, setIsSuspend] = useState(false);
    const [newType, setNewType] = useState("");
    const [newTypeCreate, setNewTypeCreate] = useState('')
    const inputRef = useRef(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const navigate = useNavigate()
    const [editValue, setEditValue] = useState({
        label: '',
        value: ''
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newLegalBasis, setNewLegalBasis] = useState({ name: '', content: '' });

    const [isAddGeneralModalOpen, setIsAddGeneralModalOpen] = useState(false);
    const [newGeneralTerm, setNewGeneralTerm] = useState({ name: "", typeId: null, content: "" });

    const [createClause, { isLoading: loadingCreate }] = useCreateClauseMutation();
    const [createContractType, { isLoadingCreateType }] = useCreateContractTypeMutation()
    const [editContractType, { isLoadingEditType }] = useEditContractTypeMutation()
    const [deleteContractType, { isLoadingDeleteType }] = useDeleteContractTypeMutation()

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

    useEffect(() => {
        if (containerRef.current) {
            const containerHeight = containerRef.current.scrollHeight;
            setIsOverflowing(containerHeight > 270);
        }
    }, [selectedlegalBasis]);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    const showAddGeneralModal = async (value) => {
        setNewGeneralTerm({ name: "", typeId: value, content: "" });
        setIsAddGeneralModalOpen(true);
    }

    const handleAddGeneralCancel = () => {
        setIsAddGeneralModalOpen(false);
        setNewGeneralTerm({ name: "", typeId: null, content: "" });
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


    // Move to next step
    const next = () => {
        form
            .validateFields()
            .then(() => {
                setCurrentStep(currentStep + 1);
            })
            .catch(() => {
                message.error("Vui lòng kiểm tra lại các trường.");
            });
    };

    // Move to previous step
    const prev = () => setCurrentStep(currentStep - 1);

    // Update the templateName state when the input changes
    const handleTemplateNameChange = (e) => {
        setTemplateName(e.target.value);
    };
    const handleTypeChange = (e) => {
        setEditValue({
            label: e.target.value,
            value: editValue.value
        });
    };

    // Hàm xử lý thay đổi tiêu đề hợp đồng và cập nhật số hợp đồng
    const handleContractTitleChange = (e) => {
        const newTitle = e.target.value;
        form.setFieldsValue({ contractTitle: newTitle });
        setTemplateName(e.target.value)
    };


    const handleContractTypeChange = (e) => {
        const newType = e;
        form.setFieldsValue({ contractTypeId: newType });
        setNewType(e)
    };

    const [selectedOtherTypeTerms, setSelectedOtherTypeTerms] = useState([]);

    // Xử lý thay đổi checkbox
    const handleCheckboxChange = (checkedValues) => {
        setSelectedOtherTypeTerms(checkedValues);
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

    useEffect(() => {
        const initialTerms = form.getFieldValue('generalTerms') || [];
        setSelectedGeneralTerms(initialTerms);
    }, []);

    const handleSelectChange = (newValues) => {
        form.setFieldsValue({ generalTerms: newValues });
        setSelectedGeneralTerms(newValues);
    };

    const handleSelectDKKChange = (newValues) => {
        form.setFieldsValue({ otherTerms: newValues });
        setSelectedOthersTerms(newValues);
    };

    const handleRemoveTerm = (termToRemove) => {
        const updatedTerms = selectedGeneralTerms.filter(term => term !== termToRemove);
        form.setFieldsValue({ generalTerms: updatedTerms });
        setSelectedGeneralTerms(updatedTerms);
        // handleSelectChange(updatedTerms);
    };

    const handleRemoveDKKTerm = (termToRemove) => {
        const updatedTerms = selectedOtherTypeTerms.filter(term => term !== termToRemove);
        form.setFieldsValue({ otherTerms: updatedTerms });
        setSelectedOtherTypeTerms(updatedTerms);
        // handleSelectChange(updatedTerms);
    };

    useEffect(() => {
        const initialTerms = form.getFieldValue('legalBasis') || [];
        setSelectedlegalBasis(initialTerms);
    }, []);


    const handleSelectlegalBasisChange = (newValues) => {
        form.setFieldsValue({ legalBasis: newValues });
        setSelectedlegalBasis(newValues);
    };

    const handleRemovelegalBasisTerm = (termToRemove) => {
        const updatedTerms = selectedlegalBasis.filter(term => term !== termToRemove);
        form.setFieldsValue({ legalBasis: updatedTerms });
        setSelectedlegalBasis(updatedTerms);
        // handleSelectChange(updatedTerms);
    };

    const handleChildSelectChange = (typeKey, fieldKey, newValues) => {
        const currentFormValues = form.getFieldsValue(true);

        // Lấy tất cả giá trị đã chọn từ các field con khác trong cùng loại điều khoản
        const otherFieldsInSameType = ["Common", "A", "B"].filter((key) => key !== fieldKey);
        const selectedValuesInSameType = otherFieldsInSameType.reduce((acc, key) => {
            const values = (currentFormValues[typeKey]?.[key] || []).map((item) => item.value);
            acc[key] = values;
            return acc;
        }, {});

        // Kiểm tra xem có giá trị nào trong newValues đã tồn tại ở các field con khác không
        const duplicateValues = newValues.filter((item) => {
            return Object.entries(selectedValuesInSameType).some(([key, values]) => {
                if (values.includes(item.value)) {
                    item.duplicateField = key;
                    return true;
                }
                return false;
            });
        });

        // Nếu có giá trị trùng, hiển thị cảnh báo và lọc giá trị
        if (duplicateValues.length > 0) {
            duplicateValues.forEach((item) => {
                message.error(
                    `Điều khoản đã được chọn ở ${displayLabels[typeKey][item.duplicateField]}. Bạn không thể chọn cùng 1 điều khoản ở 2 bên.`
                );
            });

            // Lọc bỏ các giá trị trùng
            const validValues = newValues.filter(
                (item) => !Object.values(selectedValuesInSameType).flat().includes(item.value)
            );

            // Cập nhật form với giá trị đã lọc
            form.setFieldsValue({
                [typeKey]: {
                    ...(currentFormValues[typeKey] || {}),
                    [fieldKey]: validValues,
                },
            });
        } else {
            // Cập nhật form bình thường nếu không có trùng
            form.setFieldsValue({
                [typeKey]: {
                    ...(currentFormValues[typeKey] || {}),
                    [fieldKey]: newValues,
                },
            });
        }
    };

    const displayLabels = {
        '1': {
            "Common": "Điều khoản bổ sung chung",
            "A": "Điều khoản bổ sung riêng bên A",
            "B": "Điều khoản bổ sung riêng bên B",
        },
        '2': {
            "Common": "Quyền và nghĩa vụ chung",
            "A": "Quyền và nghĩa vụ riêng bên A",
            "B": "Quyền và nghĩa vụ riêng bên B",
        },
        '3': {
            "Common": "Điều khoản Bảo hành và bảo trì chung",
            "A": "Điều khoản Bảo hành và bảo trì riêng bên A",
            "B": "Điều khoản Bảo hành và bảo trì riêng bên B",
        },
        '4': {
            "Common": "Điều khoản vi phạm và thiệt hại chung",
            "A": "Điều khoản vi phạm và thiệt hại riêng bên A",
            "B": "Điều khoản vi phạm và thiệt hại riêng bên B",
        },
        '5': {
            "Common": "Điều khoản chấm dứt hợp đồng chung",
            "A": "Điều khoản chấm dứt hợp đồng riêng bên A",
            "B": "Điều khoản chấm dứt hợp đồng riêng bên B",
        },
        '6': {
            "Common": "Điều khoản giải quyết tranh chấp chung",
            "A": "Điều khoản giải quyết tranh chấp riêng bên A",
            "B": "Điều khoản giải quyết tranh chấp riêng bên B",
        },
        '7': {
            "Common": "Điều khoản bảo mật chung",
            "A": "Điều khoản bảo mật riêng bên A",
            "B": "Điều khoản bảo mật riêng bên B",
        }
    }

    const onNewTypeChange = (e) => {
        console.log(e)
        setNewTypeCreate(e.target.value);
    };

    const addNewType = async () => {
        if (!newTypeCreate.trim()) return message.warning("Vui lòng nhập loại hợp đồng!");
        try {
            await createContractType({ name: newTypeCreate }).unwrap();
            setNewTypeCreate("");
            message.success("Thêm loại hợp đồng thành công!");
            refetch();
        } catch (error) {
            if (error.data == "exist") {
                message.error("Loại hợp đồng đã tồn tại!");
            } else {
                message.error("Lỗi khi tạo loại hợp đồng!");
            }

        }
    };


    const showEditModal = (option) => {
        // setIsDropdownOpen(false)
        setEditValue(option);
        setIsEditModalOpen(true);

    };

    const handleEditOk = async () => {
        if (!editValue.label || !editValue.value) {
            message.warning("Tên loại hợp đồng không được để trống!");
            return;
        }
        try {
            await editContractType({ name: editValue.label, id: editValue.value }).unwrap();
            message.success("Sửa hợp đồng thành công!");
            setEditValue({
                label: '',
                value: ''
            });
            refetch();
            setIsEditModalOpen(false);
        } catch (error) {
            console.log(error);
            if (error.data == "exist") {
                message.error("Loại hợp đồng đã tồn tại!");
            } else {
                message.error("Lỗi khi tạo loại hợp đồng!");
            }
        }
    };

    const handleDeleteType = async (id) => {
        try {
            await deleteContractType(id).unwrap();
            message.success("Xóa hợp đồng thành công!");
            refetch();
            if (form.getFieldValue("contractType") === id) {
                form.setFieldsValue({ contractType: undefined });
            }
        } catch (error) {
            console.log(error);
            message.error("Lỗi khi xóa loại hợp đồng!");
        }
    };


    const showAddModal = () => {
        setIsAddModalOpen(true);
    };

    const handleAddOk = async () => {
        let name = form.getFieldValue('legalLabel') || '';
        let content = form.getFieldValue('legalContent') || '';
        console.log(name, content);
        try {
            const result = await createClause({ idType: 8, label: name, value: content }).unwrap();
            console.log(result);
            if (result.status === "CREATED") {
                message.success("Tạo điều khoản thành công");
            }
            loadLegalData();
            setIsAddModalOpen(false);
            form.resetFields();
        } catch (error) {
            console.error("Lỗi tạo điều khoản:", error);
            message.error("Có lỗi xảy ra khi tạo điều khoản");
        }

    };

    const handleAddCancel = () => {
        setIsAddModalOpen(false);
    };

    const handleAddOkGeneralTerm = async () => {
        const { name, typeId, content } = newGeneralTerm;
        if (!name || !typeId || !content) {
            message.error("Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        try {
            const result = await createClause({ idType: typeId, label: name, value: content }).unwrap();
            if (result.status === "CREATED") {
                message.success("Tạo điều khoản thành công");
            }
            switch (typeId.toString()) {
                case "1":
                    await loadDKBSData({ page: 0, size: 10 });
                    break;
                case "2":
                    await loadQVNVCBData({ page: 0, size: 10 });
                    break;
                case "3":
                    await loadBHVBTData({ page: 0, size: 10 });
                    break;
                case "4":
                    await loadVPBTTHData({ page: 0, size: 10 });
                    break;
                case "5":
                    await loadCDHDData({ page: 0, size: 10 });
                    break;
                case "6":
                    await loadGQTCData({ page: 0, size: 10 });
                    break;
                case "7":
                    await loadBMData({ page: 0, size: 10 });
                    break;
                case "9":
                    await loadGenaralData({ page: 0, size: 10 });
                    break;
                case "10":
                    await loadDKKata({ page: 0, size: 10 });
                    break;
                default:
                    console.warn("Không tìm thấy typeId phù hợp:", typeId);
            }

            handleAddGeneralCancel();

        } catch (error) {
            console.error("Lỗi tạo điều khoản:", error);
            message.error("Có lỗi xảy ra khi tạo điều khoản");
        }
    };

    console.log(form.getFieldsValue())

    const steps = [
        {
            title: "Nhập tên template",
            content: (
                <Form form={form} layout="vertical" onFinish={(values) => handleSubmit(values)}>
                    <Form.Item
                        label="Tên template"
                        name="templateName"
                        rules={[{ required: true, message: "Vui lòng nhập tên template!" }]}
                    >
                        <Input placeholder="Nhập tên template" onChange={handleTemplateNameChange} />
                    </Form.Item>
                    <Form.Item
                        label="Loại hợp đồng"
                        name="contractTypeId"
                        rules={[{ required: true, message: "Vui lòng chọn loại hợp đồng!" }]}
                    >
                        <Select
                            showSearch
                            style={{ width: "100%" }}
                            placeholder="Chọn loại hợp đồng"
                            onChange={handleContractTypeChange}
                            loading={isLoadingType}
                            notFoundContent={isLoadingType ? <Spin size="small" /> : "Không có dữ liệu"}
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
                            options={contractType?.map((type) => ({
                                label: type.name,
                                value: type.id,
                                key: type.id,
                                disabled: isLoadingCreateType,
                                loading: isLoadingType,
                            }))}
                            optionRender={(option) => (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{option.label}</span>
                                    <div>
                                        <Button
                                            loading={isLoadingEditType}
                                            type="link"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                showEditModal(option);
                                            }}
                                        >
                                            <EditFilled />
                                        </Button>


                                        <Popconfirm
                                            title="Bạn có chắc chắn muốn xóa?"
                                            onConfirm={(e) => {
                                                e.stopPropagation();
                                                handleDeleteType(option.value);
                                            }}
                                            okText="Xóa"
                                            cancelText="Hủy"
                                        >
                                            <Button
                                                loading={isLoadingDeleteType}
                                                type="link"
                                                danger
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <DeleteOutlined />
                                            </Button>
                                        </Popconfirm>

                                    </div>
                                </div>
                            )}
                        />
                    </Form.Item>
                </Form>
            ),
        },
        {
            title: "Thông tin hợp đồng",
            content: (
                <Form form={form} layout="vertical" className="flex flex-col gap-3" onFinish={(values) => handleSubmit(values)}>
                    <ConfigProvider
                        theme={{
                            components: {
                                Collapse: {
                                    headerBg: '#27a2f0',
                                    colorTextHeading: '#ffffff',
                                    motionDurationMid: '0.15s',
                                    motionDurationSlow: '0.15s',
                                },
                            },
                        }}
                    >
                        <Collapse
                            defaultActiveKey={['1']}
                            size="large"
                            items={[
                                {
                                    key: '1',
                                    label: <p className="font-bold"> THÔNG TIN CHUNG</p>,
                                    children: <div>
                                        <h3 className="font-bold text-[19px]">1. TIÊU ĐỀ HỢP ĐỒNG</h3>
                                        <div className="ml-6 mt-3">
                                            <Form.Item
                                                label="Tiêu đề hợp đồng"
                                                name="contractTitle"
                                                initialValue={templateName}
                                                rules={[{ required: true, message: "Vui lòng nhập tiêu đề hợp đồng!" }]}
                                            >
                                                <Input
                                                    onChange={handleContractTitleChange}
                                                    placeholder="Tên hợp đồng (VD: Hợp đồng Mua Bán Hàng Hóa)"
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                name="contractTypeId"
                                                initialValue={newType}
                                            />

                                        </div>
                                        <div className="bg-[#f5f5f5] shadow-md p-4 rounded-md text-center">
                                            <p className="font-bold text-lg">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                            <p className="font-bold"> Độc lập - Tự do - Hạnh phúc</p>
                                            <p>-------------------</p>
                                            <p className="text-right mr-[10%]">Ngày .... Tháng .... Năm .......</p>
                                            <p className="text-2xl font-bold mt-3">{templateName.toUpperCase()}</p>
                                            <p className="mt-3"><b>Số:</b> Tên HD viết tắt / ngày tháng năm</p>
                                        </div>
                                        <h3 className="font-bold text-[19px] my-6">2. THÔNG TIN CÁC BÊN THAM GIA</h3>

                                        <Form.Item
                                            // label="Thông tin bên ta"
                                            name="partyInfo"
                                            initialValue="Công ty ABC - Địa chỉ: 123 Đường ABC, TP. Hồ Chí Minh"
                                        >
                                            <Input disabled />
                                        </Form.Item>
                                        <Form.Item
                                            name="contractType"

                                        />

                                        <Row gutter={16} className="bg-[#f5f5f5] shadow-md p-4 rounded-md gap-7" justify={"center"}>
                                            <Col className="flex flex-col gap-2 " md={10} sm={24} >
                                                <p className="font-bold text-lg "><u>BÊN CUNG CẤP (BÊN A)</u></p>
                                                <p className="text-sm "><b>Tên công ty:</b> {bsInfor?.businessName}</p>
                                                <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {bsInfor?.address}</p>
                                                <p className="flex text-sm justify-between"><p><b>Người đại diện:</b> {bsInfor?.representativeName} </p></p>
                                                <p className="text-sm"><b>Chức vụ:</b> {bsInfor?.representativeTitle}</p>
                                                <p className='flex text-sm  justify-between'><p><b>Mã số thuế:</b> {bsInfor?.taxCode}</p></p>
                                                <p className="text-sm"><b>Email:</b> {bsInfor?.email}</p>
                                            </Col>
                                            <Col className="flex flex-col gap-2" md={10} sm={24}>
                                                <p className="font-bold text-lg "><u>Bên thuê (Bên B)</u></p>
                                                <p className="text-sm "><b>Tên công ty: </b>.............................................</p>
                                                <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> .............................................</p>
                                                <p className="flex  text-sm justify-between"><p><b>Người đại diện:</b> .............................................</p></p>
                                                <p className="text-sm"><b>Chức vụ:</b> .............................................</p>
                                                <p className='flex text-sm justify-between'><p><b>Mã số thuế:</b> .............................................</p></p>
                                                <p className="text-sm"><b>Email:</b> .............................................</p>
                                            </Col>
                                        </Row>
                                        <h3 className="font-bold text-[19px] my-6">3. CĂN CỨ PHÁP LÝ</h3>
                                        <Form.Item
                                            label={"Căn phứ pháp lý"}
                                            name='legalBasis'
                                            rules={[{ required: true, message: "Vui lòng chọn căn cứ pháp lý!" }]}
                                        >
                                            <LazySelect
                                                loadDataCallback={loadLegalData}
                                                options={legalData?.data.content}
                                                showSearch
                                                labelInValue
                                                mode="multiple"
                                                placeholder="Chọn căn cứ pháp lý"
                                                onChange={handleSelectlegalBasisChange}
                                                dropdownRender={(menu) => (
                                                    <>
                                                        {menu}
                                                        <Divider style={{ margin: "8px 0" }} />
                                                        <Space style={{ padding: "0 8px 4px" }}>
                                                            <Button type="primary" icon={<PlusOutlined />} onClick={showAddModal}>
                                                                Thêm căn cứ
                                                            </Button>
                                                        </Space>
                                                    </>
                                                )}
                                            />
                                        </Form.Item>
                                        <div className="mt-4 shadow-md ml-2 mb-3 bg-[#f5f5f5] p-4 rounded-md">
                                            <div
                                                ref={containerRef}
                                                className="overflow-y-auto"
                                                style={{ maxHeight: isExpanded ? 'none' : '270px' }}
                                            >
                                                <h4 className="font-bold">Căn cứ pháp lý đã chọn:</h4>
                                                <ul className="mt-2 flex flex-col gap-3">
                                                    {selectedlegalBasis.map((term, index) => (
                                                        <li
                                                            key={term}
                                                            className="flex justify-between p-2 items-center border-b-2 border-e-slate-100 hover:bg-[#d1d1d1]"
                                                        >
                                                            <p className="w-[90%]"> {index + 1}. {term.title}</p>
                                                            <Button
                                                                type="primary"
                                                                danger
                                                                size="small"
                                                                onClick={() => handleRemovelegalBasisTerm(term)}
                                                                icon={<FaDeleteLeft />}
                                                            >
                                                                Xóa
                                                            </Button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {isOverflowing && (
                                                <div className="flex justify-center mt-2">
                                                    <Button
                                                        type="link"
                                                        onClick={toggleExpand}
                                                        className="text-[#1677ff] font-medium"
                                                    >
                                                        {isExpanded ? 'Thu gọn ▲' : 'Xem thêm ▼'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                },
                            ]}
                        />
                        <Collapse
                            size="large"
                            items={[
                                {
                                    key: '2',
                                    label: <p className="font-bold"> NỘI DUNG CHÍNH</p>,
                                    children: <div>
                                        <h3 className="font-bold text-[19px]">3. NỘI DUNG HỢP ĐỒNG</h3>
                                        <Form.Item
                                            label="Soạn thảo nội dung hợp đồng "
                                            name="contractContent"
                                            className="mt-5"
                                            rules={[{ required: true, message: "Vui lòng nhập nội dung hợp đồng!" }]}
                                        >
                                            <RichTextEditor
                                                output="html"
                                                content={content}
                                                onChangeContent={onValueChange}
                                                extensions={extensions}
                                                dark={false}
                                                hideBubble={true}
                                                dense={false}
                                                removeDefaultWrapper
                                                placeholder="Nhập nội dung hợp đồng tại đây..."
                                            />
                                        </Form.Item>

                                        <PreviewSection content={content} />

                                        <h3 className="font-bold text-[19px] mt-9 mb-3">4. GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</h3>

                                        <Form.Item name="autoAddVAT" valuePropName="checked">
                                            <div className="flex items-center">
                                                <Switch
                                                    className="mr-4"
                                                    onChange={(checked) => {
                                                        form.setFieldsValue({ autoAddVAT: checked });
                                                        setIsVATChecked(checked);
                                                    }}
                                                    checked={form.getFieldValue("autoAddVAT") ?? isVATChecked}
                                                />
                                                <p className="text-sm">Tự động thêm VAT</p>
                                            </div>
                                        </Form.Item>

                                        {isVATChecked && (
                                            <Form.Item
                                                label="Phần trăm VAT"
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
                                                            // e.target.value = '';
                                                        }
                                                    }}
                                                />
                                            </Form.Item>
                                        )}

                                        <Form.Item name="isDateLateChecked" valuePropName="checked">
                                            <div className="flex items-center">
                                                <Switch
                                                    className="mr-4"
                                                    onChange={(checked) => {
                                                        form.setFieldsValue({ isDateLateChecked: checked });
                                                        setIsDateLateChecked(checked);
                                                    }}
                                                    checked={form.getFieldValue("isDateLateChecked") ?? isDateLateChecked}
                                                />
                                                <p className="text-sm">Cho phép thanh toán trễ hạn (ngày)</p>
                                            </div>
                                        </Form.Item>

                                        {isDateLateChecked && (
                                            <Form.Item
                                                label="Ngày trễ"
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
                                                            // e.target.value = '';
                                                        }
                                                    }}
                                                />
                                            </Form.Item>
                                        )}

                                        <h3 className="font-bold text-[19px] mt-6 mb-3">5. THỜI GIAN HIỆU LỰC</h3>

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
                                    </div>
                                },
                            ]}
                        />
                        {/* ///////////////////////////////////thêm search và chọn thể loại điều khoản cho hợp đồng */}
                        <Collapse
                            size="large"
                            items={[
                                {
                                    key: '3',
                                    label: <p className="font-bold"> ĐIỀU KHOẢN VÀ CAM KẾT </p>,
                                    children: <div>
                                        <h3 className="font-bold text-[19px]">6. Điều khoản</h3>
                                        <div className=" ml-2 my-3 ">
                                            <p className="font-bold text-[16px] mb-1"> Điều khoản chung</p>
                                            <p className="">Mô tả: (Điều khoản được áp dụng cho cả 2 bên) </p>
                                        </div>
                                        <Form.Item
                                            label={"Điều khoản chung"}
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
                                        <div className="mt-4 shadow-md ml-2 mb-3 bg-[#f5f5f5] p-4 rounded-md max-h-[400px] overflow-y-auto">
                                            <h4 className="font-bold">Điều khoản chung đã chọn:</h4>
                                            <ul className="mt-2 flex flex-col gap-3 ">
                                                {selectedGeneralTerms.map((term, index) => (
                                                    <li key={index + term} className="flex justify-between p-2 items-center border-b-2 border-e-slate-100 hover:bg-[#d1d1d1]">
                                                        <p className="w-[90%]"> {index + 1}. {term.title}</p>
                                                        <Button
                                                            type="primary"
                                                            danger
                                                            size="small"
                                                            onClick={() => handleRemoveTerm(term)}
                                                            icon={<FaDeleteLeft />}
                                                        >
                                                            Xóa
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <Form.Item
                                            label={
                                                <div className="ml-2 my-3 font-bold text-[16px]">
                                                    Các điều khoản khác
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
                                            {selectedOtherTypeTerms.includes(1) && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN BỔ SUNG</h4>
                                                    {["Common", "A", "B"].map((key, index) => {
                                                        // Tính toán các giá trị đã chọn từ các trường còn lại trong cùng loại
                                                        const otherSelectedValues = [];
                                                        ["Common", "A", "B"].forEach((k) => {
                                                            if (k !== key) {
                                                                const values = (form.getFieldValue(['1', k]) || []).map(
                                                                    (item) => item.value
                                                                );
                                                                otherSelectedValues.push(...values);
                                                            }
                                                        });

                                                        return (
                                                            <Form.Item
                                                                key={index}
                                                                label={displayLabels["1"][key]}
                                                                name={["1", key]}
                                                            >
                                                                <LazySelect
                                                                    loadDataCallback={loadDKBSData}
                                                                    options={generalData?.data.content}
                                                                    globalSelected={[...otherSelectedValues]}
                                                                    showSearch
                                                                    labelInValue
                                                                    placeholder={displayLabels["1"][key]}
                                                                    mode="multiple"
                                                                    onChange={(newValues) =>
                                                                        handleChildSelectChange("1", key, newValues)
                                                                    }
                                                                    dropdownRender={(menu) => (
                                                                        <>
                                                                            {menu}
                                                                            <Divider style={{ margin: "8px 0" }} />
                                                                            <Space style={{ padding: "0 8px 4px" }}>
                                                                                <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddGeneralModal(1)}>
                                                                                    Thêm điều khoản
                                                                                </Button>
                                                                            </Space>
                                                                        </>
                                                                    )}
                                                                />
                                                            </Form.Item>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {selectedOtherTypeTerms.includes(2) && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">QUYỀN VÀ NGHĨA VỤ CÁC BÊN</h4>
                                                    {["Common", "A", "B"].map((key, index) => {
                                                        const otherSelectedValues = [];
                                                        ["Common", "A", "B"].forEach((k) => {
                                                            if (k !== key) {
                                                                const values = (form.getFieldValue(['2', k]) || []).map(
                                                                    (item) => item.value
                                                                );
                                                                otherSelectedValues.push(...values);
                                                            }
                                                        });
                                                        return (
                                                            <Form.Item
                                                                key={index}
                                                                label={displayLabels['2'][key]}
                                                                name={['2', key]}
                                                            >
                                                                <LazySelect
                                                                    loadDataCallback={loadQVNVCBData}
                                                                    options={generalData?.data.content}
                                                                    globalSelected={[...otherSelectedValues]}
                                                                    showSearch
                                                                    labelInValue
                                                                    placeholder={displayLabels["2"][key]}
                                                                    mode="multiple"
                                                                    onChange={(newValues) =>
                                                                        handleChildSelectChange("2", key, newValues)
                                                                    }
                                                                    dropdownRender={(menu) => (
                                                                        <>
                                                                            {menu}
                                                                            <Divider style={{ margin: "8px 0" }} />
                                                                            <Space style={{ padding: "0 8px 4px" }}>
                                                                                <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddGeneralModal(2)}>
                                                                                    Thêm điều khoản
                                                                                </Button>
                                                                            </Space>
                                                                        </>
                                                                    )}
                                                                />
                                                            </Form.Item>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes(3) && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN BẢO HÀNH VÀ BẢO TRÌ</h4>
                                                    {["Common", "A", "B"].map((key, index) => {
                                                        const otherSelectedValues = [];
                                                        ["Common", "A", "B"].forEach((k) => {
                                                            if (k !== key) {
                                                                const values = (form.getFieldValue(['3', k]) || []).map(
                                                                    (item) => item.value
                                                                );
                                                                otherSelectedValues.push(...values);
                                                            }
                                                        });
                                                        return (
                                                            <Form.Item
                                                                key={index}
                                                                label={displayLabels['3'][key]}
                                                                name={['3', key]}
                                                            >
                                                                <LazySelect
                                                                    loadDataCallback={loadBHVBTData}
                                                                    options={generalData?.data.content}
                                                                    globalSelected={[...otherSelectedValues]}
                                                                    showSearch
                                                                    labelInValue
                                                                    placeholder={displayLabels["3"][key]}
                                                                    mode="multiple"
                                                                    onChange={(newValues) =>
                                                                        handleChildSelectChange("3", key, newValues)
                                                                    }
                                                                    dropdownRender={(menu) => (
                                                                        <>
                                                                            {menu}
                                                                            <Divider style={{ margin: "8px 0" }} />
                                                                            <Space style={{ padding: "0 8px 4px" }}>
                                                                                <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddGeneralModal(3)}>
                                                                                    Thêm điều khoản
                                                                                </Button>
                                                                            </Space>
                                                                        </>
                                                                    )}
                                                                />
                                                            </Form.Item>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes(4) && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI</h4>
                                                    {["Common", "A", "B"].map((key, index) => {
                                                        const otherSelectedValues = [];
                                                        ["Common", "A", "B"].forEach((k) => {
                                                            if (k !== key) {
                                                                const values = (form.getFieldValue(['4', k]) || []).map(
                                                                    (item) => item.value
                                                                );
                                                                otherSelectedValues.push(...values);
                                                            }
                                                        });
                                                        return (
                                                            <Form.Item
                                                                key={index}
                                                                label={displayLabels['4'][key]}
                                                                name={['4', key]}
                                                            >
                                                                <LazySelect
                                                                    loadDataCallback={loadVPBTTHData}
                                                                    options={generalData?.data.content}
                                                                    globalSelected={[...otherSelectedValues]}
                                                                    showSearch
                                                                    labelInValue
                                                                    placeholder={displayLabels["4"][key]}
                                                                    mode="multiple"
                                                                    onChange={(newValues) =>
                                                                        handleChildSelectChange("4", key, newValues)
                                                                    }
                                                                    dropdownRender={(menu) => (
                                                                        <>
                                                                            {menu}
                                                                            <Divider style={{ margin: "8px 0" }} />
                                                                            <Space style={{ padding: "0 8px 4px" }}>
                                                                                <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddGeneralModal(4)}>
                                                                                    Thêm điều khoản
                                                                                </Button>
                                                                            </Space>
                                                                        </>
                                                                    )}
                                                                />
                                                            </Form.Item>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes(5) && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG</h4>
                                                    {["Common", "A", "B"].map((key, index) => {
                                                        const otherSelectedValues = [];
                                                        ["Common", "A", "B"].forEach((k) => {
                                                            if (k !== key) {
                                                                const values = (form.getFieldValue(['5', k]) || []).map(
                                                                    (item) => item.value
                                                                );
                                                                otherSelectedValues.push(...values);
                                                            }
                                                        });
                                                        return (
                                                            <Form.Item
                                                                key={index}
                                                                label={displayLabels['5'][key]}
                                                                name={['5', key]}
                                                            >
                                                                <LazySelect
                                                                    loadDataCallback={loadCDHDData}
                                                                    options={generalData?.data.content}
                                                                    globalSelected={[...otherSelectedValues]}
                                                                    showSearch
                                                                    labelInValue
                                                                    placeholder={displayLabels["5"][key]}
                                                                    mode="multiple"
                                                                    onChange={(newValues) =>
                                                                        handleChildSelectChange("5", key, newValues)
                                                                    }
                                                                    dropdownRender={(menu) => (
                                                                        <>
                                                                            {menu}
                                                                            <Divider style={{ margin: "8px 0" }} />
                                                                            <Space style={{ padding: "0 8px 4px" }}>
                                                                                <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddGeneralModal(5)}>
                                                                                    Thêm điều khoản
                                                                                </Button>
                                                                            </Space>
                                                                        </>
                                                                    )}
                                                                />
                                                            </Form.Item>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes(6) && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP</h4>
                                                    {["Common", "A", "B"].map((key, index) => {
                                                        const otherSelectedValues = [];
                                                        ["Common", "A", "B"].forEach((k) => {
                                                            if (k !== key) {
                                                                const values = (form.getFieldValue(['6', k]) || []).map(
                                                                    (item) => item.value
                                                                );
                                                                otherSelectedValues.push(...values);
                                                            }
                                                        });
                                                        return (
                                                            <Form.Item
                                                                key={index}
                                                                label={displayLabels['6'][key]}
                                                                name={['6', key]}
                                                            >
                                                                <LazySelect
                                                                    loadDataCallback={loadGQTCData}
                                                                    options={generalData?.data.content}
                                                                    globalSelected={[...otherSelectedValues]}
                                                                    showSearch
                                                                    labelInValue
                                                                    placeholder={displayLabels["6"][key]}
                                                                    mode="multiple"
                                                                    onChange={(newValues) =>
                                                                        handleChildSelectChange("6", key, newValues)
                                                                    }
                                                                    dropdownRender={(menu) => (
                                                                        <>
                                                                            {menu}
                                                                            <Divider style={{ margin: "8px 0" }} />
                                                                            <Space style={{ padding: "0 8px 4px" }}>
                                                                                <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddGeneralModal(6)}>
                                                                                    Thêm điều khoản
                                                                                </Button>
                                                                            </Space>
                                                                        </>
                                                                    )}
                                                                />
                                                            </Form.Item>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes(7) && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN BẢO MẬT</h4>
                                                    {["Common", "A", "B"].map((key, index) => {
                                                        const otherSelectedValues = [];
                                                        ["Common", "A", "B"].forEach((k) => {
                                                            if (k !== key) {
                                                                const values = (form.getFieldValue(['7', k]) || []).map(
                                                                    (item) => item.value
                                                                );
                                                                otherSelectedValues.push(...values);
                                                            }
                                                        });
                                                        return (
                                                            <Form.Item
                                                                key={index}
                                                                label={displayLabels['7'][key]}
                                                                name={['7', key]}
                                                            >
                                                                <LazySelect
                                                                    loadDataCallback={loadBMData}
                                                                    options={generalData?.data.content}
                                                                    globalSelected={[...otherSelectedValues]}
                                                                    showSearch
                                                                    labelInValue
                                                                    placeholder={displayLabels["7"][key]}
                                                                    mode="multiple"
                                                                    onChange={(newValues) =>
                                                                        handleChildSelectChange("7", key, newValues)
                                                                    }
                                                                    dropdownRender={(menu) => (
                                                                        <>
                                                                            {menu}
                                                                            <Divider style={{ margin: "8px 0" }} />
                                                                            <Space style={{ padding: "0 8px 4px" }}>
                                                                                <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddGeneralModal(7)}>
                                                                                    Thêm điều khoản
                                                                                </Button>
                                                                            </Space>
                                                                        </>
                                                                    )}
                                                                />
                                                            </Form.Item>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                        <div className=" ml-2 my-3 ">
                                            <p className="font-bold text-[16px] mb-1"> Điều khoản khác</p>
                                            {/* <p className="">Mô tả: (Điều khoản được áp dụng cho cả 2 bên) </p> */}
                                        </div>
                                        <Form.Item
                                            label={"Điều khoản khác"}
                                            name="othersTerms"
                                            rules={[{ required: true, message: "Vui lòng chọn điều khoản khác!" }]}
                                            className="ml-2"
                                        >
                                            <LazySelect
                                                loadDataCallback={loadDKKata}
                                                showSearch
                                                labelInValue
                                                mode="multiple"
                                                placeholder="Chọn điều khoản khác"
                                                onChange={handleSelectDKKChange}
                                                dropdownRender={(menu) => (
                                                    <>
                                                        {menu}
                                                        <Divider style={{ margin: "8px 0" }} />
                                                        <Space style={{ padding: "0 8px 4px" }}>
                                                            <Button type="primary" icon={<PlusOutlined />} onClick={() => showAddGeneralModal(10)}>
                                                                Thêm điều khoản
                                                            </Button>
                                                        </Space>
                                                    </>
                                                )}
                                            />
                                        </Form.Item>
                                        <div className="mt-4 shadow-md ml-2 mb-3 bg-[#f5f5f5] p-4 rounded-md max-h-[400px] overflow-y-auto">
                                            <h4 className="font-bold">Điều khoản khác đã chọn:</h4>
                                            <ul className="mt-2 flex flex-col gap-3 ">
                                                {selectedOthersTerms.map((term, index) => (
                                                    <li key={index + term} className="flex justify-between p-2 items-center border-b-2 border-e-slate-100 hover:bg-[#d1d1d1]">
                                                        <p className="w-[90%]"> {index + 1}. {term.title}</p>
                                                        <Button
                                                            type="primary"
                                                            danger
                                                            size="small"
                                                            onClick={() => handleRemoveDKKTerm(term)}
                                                            icon={<FaDeleteLeft />}
                                                        >
                                                            Xóa
                                                        </Button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <Form.Item
                                            label={
                                                <div className="ml-2 my-3">
                                                    <p className="font-bold text-[16px]"> ĐIỀU KHOẢN ĐẶC BIỆT BÊN A</p>
                                                    <p className="">Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên A) </p>
                                                </div>
                                            }
                                            name="specialTermsA"
                                        // rules={[{ required: true, message: "Vui lòng chọn điều khoản đặc biệt bên A!" }]} // Changed to optional
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
                                        // rules={[{ required: true, message: "Vui lòng chọn điều khoản đặc biệt bên B!" }]} // Changed to optional
                                        >
                                            <TextArea rows={4}
                                                placeholder="Nhập điều khoản bên B"
                                            />
                                        </Form.Item>
                                    </div>
                                },
                            ]}
                        />
                        <Collapse
                            size="large"
                            items={[
                                {
                                    key: '4',
                                    label: <p className="font-bold"> CÁC NỘI DUNG KHÁC </p>,
                                    children:
                                        <div>

                                            <p className="font-bold text-[19px] my-4">8. Phụ lục</p>

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
                                        </div>
                                }
                            ]}
                        />
                    </ConfigProvider>
                </Form>
            ),
        },
        {
            title: "Xem lại mẫu hợp đồng",
            content: (
                <div className="p-20 space-y-4 text-[16px]">
                    <div className=" p-4 rounded-md text-center">
                        <p className="font-bold text-[22px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                        <p className="font-bold text-[18px] mt-1"> Độc lập - Tự do - Hạnh phúc</p>
                        <p>-------------------</p>
                        <p className="text-right mr-[10%]">Ngày .... Tháng .... Năm ......</p>
                        <p className="text-[28px] font-bold mt-3">{templateName.toUpperCase()}</p>
                        <p className="mt-2">(<b> Số:</b> Tên HD viết tắt / ngày tháng năm )</p>
                    </div>
                    <div className=" px-4 pt-[100px] flex flex-col gap-2">
                        {form.getFieldValue("legalBasis") ? form.getFieldValue("legalBasis").map(term => <p><i>- {term.title}</i></p>) : null}
                    </div>
                    <div className="p-4 rounded-md flex flex-col gap-4">
                        <div className="flex flex-col gap-2 " md={10} sm={24} >
                            <p className="font-bold text-lg "><u>BÊN CUNG CẤP (BÊN A)</u></p>
                            <p className=" "><b>Tên công ty:</b> {bsInfor?.businessName}</p>
                            <p className=""><b>Địa chỉ trụ sở chính:</b> {bsInfor?.address}</p>
                            <p className="flex  justify-between"><p><b>Người đại diện:</b> {bsInfor?.representativeName} </p></p>
                            <p className=""><b>Chức vụ:</b> {bsInfor?.representativeTitle}</p>
                            <p className='flex   justify-between'><p><b>Mã số thuế:</b> {bsInfor?.taxCode}</p></p>
                            <p className=""><b>Email:</b> {bsInfor?.email}</p>
                        </div>
                        <div className="flex flex-col gap-2" md={10} sm={24}>
                            <p className="font-bold text-lg "><u>Bên thuê (Bên B)</u></p>
                            <p className=" "><b>Tên công ty: </b>....................................................................................................................................</p>
                            <p className=""><b>Địa chỉ trụ sở chính:</b> .......................................................................................................................</p>
                            <p className="flex   justify-between"><p><b>Người đại diện:</b> ...............................................................................................................................</p></p>
                            <p className=""><b>Chức vụ:</b> ..........................................................................................................................................</p>
                            <p className='flex  justify-between'><p><b>Mã số thuế:</b> .....................................................................................................................................</p></p>
                            <p className=""><b>Email:</b> ...............................................................................................................................................</p>
                        </div>

                        <p>Sau khi bàn bạc và thống nhất chúng tôi cùng thỏa thuận ký kết bản hợp đồng với nội dung và các điều khoản sau: </p>

                        <p className="font-bold text-lg "><u>NỘI DUNG HỢP ĐỒNG</u></p>

                        <div className="ml-1" dangerouslySetInnerHTML={{ __html: form.getFieldValue("contractContent") || "Chưa nhập" }} />

                        <div className="mt-4">
                            <h4 className="font-bold text-lg placeholder:"><u>GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</u></h4>
                            <div>
                                {form.getFieldValue("autoAddVAT") && <p className="mt-3">- Tự động thêm thuế VAT khi tạo hợp đồng ({form.getFieldValue("vatPercentage")}%)</p>}
                                {form.getFieldValue("autoRenew") && <p className="mt-3">- Tự động gia hạn khi hợp đồng hết hạn nếu không có bất kỳ phản hồi nào từ các phía</p>}
                                {form.getFieldValue("appendixEnabled") && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực </p>}
                                {form.getFieldValue("isDateLateChecked") && <p className="mt-3">- Trong quá trình thanh toán cho phép trễ hạn tối đa {form.getFieldValue("maxDateLate")} (ngày) </p>}
                            </div>
                        </div>
                        <div className="mt-4">
                            <h4 className="font-bold text-lg placeholder:"><u>CÁC LOẠI ĐIỀU KHOẢN</u></h4>
                            <div className="ml-5 mt-3 flex flex-col gap-3">
                                {form.getFieldValue("generalTerms") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản chung:</h5>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("generalTerms") ? form.getFieldValue("generalTerms").map(term => <p><i>- {term.title}</i></p>) : null}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("2") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Quyền và nghĩa vụ các bên:</h5>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("2").Common?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>- {term.title}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("6") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản giải quyết tranh chấp:</h5>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("6").Common?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>- {term.title}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("1") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản Bổ sung:</h5>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("1").Common?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>- {term.title}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("breachAndDamages") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản pháp lý:</h5>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("breachAndDamages").breachAndDamagesCommon?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>- {term.title}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("5") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản chấm dứt hợp đồng:</h5>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("5").Common?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>- {term.title}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("3") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản bảo hành và bảo trì:</h5>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("3").Common?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>- {term.title}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("4") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản vi phạm và thiệt hại</h5>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("4").Common?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>- {term.title}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("7") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản chính sách bảo mật:</h5>
                                        {/* <h4 className="font-bold mt-2 ml-2">Điều khoản chính sách bảo mật chung</h4> */}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("7").Common?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>- {term.title}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                    </div>
                                )}

                                <div className="mt-2">
                                    <h5 className="font-semibold text-lg">Điều khoản áp dụng chỉ riêng bên A</h5>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("1") && form.getFieldValue("1").A?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("2") && form.getFieldValue("2").A?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("3") && form.getFieldValue("3").A?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("4") && form.getFieldValue("4").A?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("5") && form.getFieldValue("5").A?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("6") && form.getFieldValue("6").A?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("7") && form.getFieldValue("7").A?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    {form.getFieldValue("specialTermsA") && (<p className="ml-3">{form.getFieldValue("specialTermsA")}</p>)}
                                </div>


                                <div className="mt-2">
                                    <h5 className="font-semibold text-lg">Điều khoản áp dụng chỉ riêng bên B</h5>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("1") && form.getFieldValue("1").B?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("2") && form.getFieldValue("2").B?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("3") && form.getFieldValue("3").B?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("4") && form.getFieldValue("4").B?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("5") && form.getFieldValue("5").B?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("6") && form.getFieldValue("6").B?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    <ul className="mt-2 flex flex-col gap-1">
                                        {form.getFieldValue("7") && form.getFieldValue("7").B?.map((term, index) => (
                                            <li className="ml-2" key={term.value}>- {term.title}</li>
                                        ))}
                                    </ul>
                                    {form.getFieldValue("specialTermsB") && (<p className="ml-3">{form.getFieldValue("specialTermsB")}</p>)}
                                </div>

                            </div>

                        </div>
                        <div className="mt-4">
                            <h4 className="font-bold text-lg placeholder:"><u>CÁC THÔNG TIN KHÁC</u></h4>
                            {form.getFieldValue("appendixEnabled") && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>}
                            {form.getFieldValue("transferEnabled") && <p className="mt-3">- Cho phép chuyển nhượng hợp đồng</p>}
                            {form.getFieldValue("violate") && <p className="mt-3">- Cho phép đơn phương hủy hợp đồng nếu 1 trong 2 vi phạm các quy định trong điều khoản được ghi trong hợp đồng</p>}
                            {form.getFieldValue("suspend") && <div>
                                <p className="mt-3">- Cho phép tạm ngưng hợp đồng trong các trường hợp bất khả kháng sau: {form.getFieldValue("suspendContent")}</p>

                            </div>}
                        </div>
                    </div>
                </div>
            ),
        },
    ];



    const handleSubmit = async () => {
        try {
            // Lấy từng giá trị cụ thể từ form và gán giá trị mặc định nếu không tồn tại
            const contractTitle = form.getFieldValue('contractTitle') || '';
            const partyInfo = form.getFieldValue('partyInfo') || '';
            const legalBasis = form.getFieldValue('legalBasis') || [];
            const appendixEnabled = form.getFieldValue('appendixEnabled') || false;
            const transferEnabled = form.getFieldValue('transferEnabled') || false;
            const violate = form.getFieldValue('violate') || false;
            const suspend = form.getFieldValue('suspend') || false;
            const suspendContent = form.getFieldValue('suspendContent') || '';
            const generalTerms = form.getFieldValue('generalTerms') || [];
            const otherTerms = form.getFieldValue('otherTerms') || [];
            const additionalTerms = form.getFieldValue('additionalTerms') || [];
            const contractContent = form.getFieldValue('contractContent') || '';
            const autoAddVAT = form.getFieldValue('autoAddVAT') || false;
            const vatPercentage = form.getFieldValue('vatPercentage') || '0';
            const isDateLateChecked = form.getFieldValue('isDateLateChecked') || false;
            const maxDateLate = form.getFieldValue('maxDateLate') || '0';
            const autoRenew = form.getFieldValue('autoRenew') || false;
            const specialTermsA = form.getFieldValue('specialTermsA') || '';
            const contractTypeId = form.getFieldValue('contractTypeId') || '';
            const specialTermsB = form.getFieldValue('specialTermsB') || '';

            // Lấy additionalConfig từ các key cụ thể (ví dụ: "1", "2", "3")
            const configKeys = ["1", "2", "3", "4", "5", "6", "7"];
            const additionalConfig = {};
            configKeys.forEach(key => {
                const fieldData = form.getFieldValue(key) || {};
                const commonData = fieldData.Common || [];
                const aData = fieldData.A || [];
                const bData = fieldData.B || [];

                // Chỉ thêm key vào additionalConfig nếu có ít nhất một mảng chứa dữ liệu
                if (commonData.length > 0 || aData.length > 0 || bData.length > 0) {
                    additionalConfig[key] = {
                        Common: commonData.map(item => ({ id: item.value })),
                        A: aData.map(item => ({ id: item.value })),
                        B: bData.map(item => ({ id: item.value })),
                    };
                }
            });

            // Chuyển đổi dữ liệu
            const transformedData = {
                contractTitle,
                partyInfo,
                legalBasis: legalBasis.map(item => (item.value)),
                appendixEnabled,
                transferEnabled,
                violate,
                contractTypeId,
                suspend,
                suspendContent,
                generalTerms: generalTerms.map(item => item.value),
                otherTerms: otherTerms.map(item => item.value),
                additionalTerms,
                additionalConfig: Object.keys(additionalConfig).reduce((acc, key) => {
                    acc[key] = {
                        Common: additionalConfig[key].Common.map(item => ({ id: item.value })),
                        A: additionalConfig[key].A.map(item => ({ id: item.value })),
                        B: additionalConfig[key].B.map(item => ({ id: item.value }))
                    };
                    return acc;
                }, {}),
                specialTermsA: specialTermsA,
                specialTermsB: specialTermsB,
                contractContent,
                autoAddVAT,
                vatPercentage,
                isDateLateChecked,
                maxDateLate,
                autoRenew,
                additionalConfig
            };

            console.log("Transformed Data:", transformedData);

            const response = await CreateTemplate(transformedData).unwrap();
            console.log(response);
            form.resetFields();
            message.success("Lưu template thành công!");
            navigate('/managetemplate')

        } catch (error) {
            console.error("Error:", error);
            message.error("Lỗi khi tạo loại hợp đồng!");
        }
    };



    if (isLoading || isLoadingType) return <Skeleton active />;
    if (isError) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;
    if (!bsInfor) return <Card><Empty description="Không có dữ liệu để hiển thị" /></Card>;

    return (
        <div className="p-8 bg-white shadow rounded-md">
            <Steps current={currentStep} className="mb-8">
                {steps.map((item, index) => (
                    <Step key={index} title={item.title} />
                ))}
            </Steps>
            <div className="mb-6">{steps[currentStep].content}</div>
            <div className="flex justify-end">
                {currentStep > 0 && (
                    <Button onClick={prev} className="mr-2" icon={<GrPrevious />} iconPosition="start">
                        Quay lại
                    </Button>
                )}
                {currentStep < steps.length - 1 && (
                    <Button type="primary" onClick={next} icon={<GrNext />} iconPosition="end">
                        Tiếp theo
                    </Button>
                )}
                {currentStep === steps.length - 1 && (
                    <Button
                        type="primary"
                        htmlType="submit"
                        onClick={handleSubmit}
                        icon={<BsSave2Fill />}
                        iconPosition="end"
                    >
                        Lưu Template
                    </Button>
                )}
            </div>
            <Modal
                title="Chỉnh sửa loại hợp đồng"
                open={isEditModalOpen}
                onOk={handleEditOk}
                onCancel={() => setIsEditModalOpen(false)}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Input
                    value={editValue?.label}
                    onChange={handleTypeChange}
                    placeholder="Nhập tên mới"
                />
            </Modal>
            <Modal
                title="Thêm căn cứ pháp lý"
                open={isAddModalOpen}
                onOk={handleAddOk}
                onCancel={handleAddCancel}
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


            {/* đang hơi lag do sử dụng state */}

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

export default CreateTemplate;



