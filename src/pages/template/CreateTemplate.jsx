import React, { useState, useEffect, useCallback, useRef } from "react";
import { Steps, Button, Input, DatePicker, Checkbox, message, Form, Collapse, Skeleton, Empty, Card, Row, Col, Select, ConfigProvider, Radio, Switch, Spin, Divider, Space } from "antd";
import RichTextEditor, {
    BaseKit, Bold, BulletList, Clear, Color, ColumnActionButton, FontFamily, FontSize, Heading, Highlight, History, HorizontalRule, Image, ImportWord,
    Indent, Italic, LineHeight, Link, Mention, OrderedList, SearchAndReplace, SlashCommand, Strike, Table, TextAlign, Underline, ExportWord
} from 'reactjs-tiptap-editor';
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
    LineHeight,
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
import { useGetContractTypeQuery } from "../../services/ContractAPI";
import { PlusOutlined } from "@ant-design/icons";
const { Step } = Steps;

const CreateTemplate = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const [templateName, setTemplateName] = useState("");
    const { data: bsInfor, isLoading, isError } = useGetBussinessInformatinQuery()      ///fix rerendering
    const { data: contractType, isLoading: isLoadingType, isError: ErrorLoadingType } = useGetContractTypeQuery()
    const [content, setContent] = useState('');
    const [isVATChecked, setIsVATChecked] = useState(false);
    const [selectedGeneralTerms, setSelectedGeneralTerms] = useState([]);
    const [selectedlegalBasis, setSelectedlegalBasis] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("generalTermsOptions"); // New state for selected category
    const [isAppendixEnabled, setIsAppendixEnabled] = useState(false);
    const [isTransferEnabled, setIsTransferEnabled] = useState(false);
    const [isDateLateChecked, setIsDateLateChecked] = useState(false);
    const [isViolate, setIsisViolate] = useState(false);
    const [isAutoRenew, setIsAutoRenew] = useState(false);
    const [isSuspend, setIsSuspend] = useState(false);
    const [newType, setNewType] = useState("");
    const inputRef = useRef(null);
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


    // useEffect(() => {
    //     const getInitials = (name) => name.toUpperCase().split(' ').map(word => word[0]).join('');
    //     const currentDate = new Date();
    //     // Cập nhật định dạng ngày để bao gồm giờ, phút và giây
    //     const formattedDate = `${currentDate.getDate()}${currentDate.getMonth() + 1}${currentDate.getFullYear()}${currentDate.getHours()}${currentDate.getMinutes()}${currentDate.getSeconds()}`;
    //     setContractNumber(`${getInitials(templateName)}-${formattedDate}`);
    // }, [templateName]);

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

    // Hàm xử lý thay đổi tiêu đề hợp đồng và cập nhật số hợp đồng
    const handleContractTitleChange = (e) => {
        const newTitle = e.target.value;
        form.setFieldsValue({ contractTitle: newTitle });
        setTemplateName(e.target.value)
        // updateContractNumber(newTitle);
    };

    // Hàm cập nhật số hợp đồng dựa trên tên tiêu đề mới
    // const updateContractNumber = (newTitle) => {
    //     const getInitials = (name) => name.toUpperCase().split(' ').map(word => word[0]).join('');
    //     const formattedDate = `${currentDate.getDate()}${currentDate.getMonth() + 1}${currentDate.getFullYear()}`;
    //     setContractNumber(`${getInitials(newTitle)}${formattedDate}`);
    // };

    const [selectedOtherTypeTerms, setSelectedOtherTypeTerms] = useState([]);

    // Xử lý thay đổi checkbox
    const handleCheckboxChange = (checkedValues) => {
        setSelectedOtherTypeTerms(checkedValues);
        const currentFields = form.getFieldsValue(); // Lấy các giá trị hiện tại của form
        const newFields = {};

        if (checkedValues.includes("additional")) {
            newFields.additional = currentFields.additional || {
                additionalCommon: [],
                additionalA: [],
                additionalB: [],
            };
        }
        if (checkedValues.includes("RightsAndObligations")) {
            newFields.RightsAndObligations = currentFields.RightsAndObligations || {
                rightsCommon: [],
                rightsA: [],
                rightsB: [],
            };
        }
        if (checkedValues.includes("warrantyAndMaintenance")) {
            newFields.warrantyAndMaintenance = currentFields.warrantyAndMaintenance || {
                warrantyCommon: [],
                warrantyA: [],
                warrantyB: [],
            };
        }
        if (checkedValues.includes("breachAndDamages")) {
            newFields.breachAndDamages = currentFields.breachAndDamages || {
                breachCommon: [],
                breachA: [],
                breachB: [],
            };
        }
        if (checkedValues.includes("TerminationOfContract")) {
            newFields.TerminationOfContract = currentFields.TerminationOfContract || {
                terminationCommon: [],
                terminationA: [],
                terminationB: [],
            };
        }
        if (checkedValues.includes("DisputeResolutionClause")) {
            newFields.DisputeResolutionClause = currentFields.DisputeResolutionClause || {
                disputeCommon: [],
                disputeA: [],
                disputeB: [],
            };
        }
        if (checkedValues.includes("PrivacyPolicy")) {
            newFields.PrivacyPolicy = currentFields.PrivacyPolicy || {
                privacyCommon: [],
                privacyA: [],
                privacyB: [],
            };
        }

        form.setFieldsValue({
            ...currentFields,
            ...newFields,
        });
    };

    const optionsMap = {
        legalBasis: [
            {
                label: "Cam kết chung",
                value: "Các bên cam kết thực hiện đúng các điều khoản trong Hợp Đồng đã ký. Mọi điều chỉnh hay bổ sung chỉ có giá trị khi các bên đã thoả thuận bằng văn bản"
            },
            {
                label: "Hợp đồng này gắn với lợi ích và trách nhiệm của các bên tham gia ký kết. Từ những điều khoản đã nói ở trên, không bên nào có quyền chuyển nhượng một phần hoặc toàn bộ Hợp đồng này cho một bên khác nếu chưa có sự chấp thuận của bên kia",
                value: "Hợp đồng này gắn với lợi ích và trách nhiệm của các bên tham gia ký kết. Từ những điều khoản đã nói ở trên, không bên nào có quyền chuyển nhượng một phần hoặc toàn bộ Hợp đồng này cho một bên khác nếu chưa có sự chấp thuận của bên kia"
            },
            {
                label: "Điều khoản chung 3",
                value: "Căn cứ Luật Điện lực ngày 03 tháng 12 năm 2004"
            },
        ],
        additional: [
            { label: "Bổ sung chung", value: "additionalCommon" },
            { label: "Bổ sung riêng bên A", value: "additionalA" },
            { label: "Bổ sung riêng bên B", value: "additionalB" },
        ],
        specialConditions: [
            { label: "Đặc biệt chung", value: "specialCommon" },
            { label: "Đặc biệt riêng bên A", value: "specialA" },
            { label: "Đặc biệt riêng bên B", value: "specialB" },
        ],
        generalTermsOptions: [
            { label: "Điều khoản chung 1", value: "Căn cứ Bộ luật Dân sự năm 2015" },
            { label: "Điều khoản chung 2", value: "Căn cứ Luật Thương mại năm 2005" },
            { label: "Điều khoản chung 3", value: "Căn cứ Luật Điện lực ngày 03 tháng 12 năm 2004" },
        ],
        RightsAndObligations: [
            { label: "Điều khoản chung 1", value: "Căn cứ Bộ luật Dân sự năm 2015" },
            { label: "Điều khoản chung 2", value: "Căn cứ Luật Thương mại năm 2005" },
            { label: "Điều khoản chung 3", value: "Căn cứ Luật Điện lực ngày 03 tháng 12 năm 2004" },
        ],
        warrantyAndMaintenance: [
            { label: "Điều khoản chung 1", value: "Căn cứ Bộ luật Dân sự năm 2015" },
            { label: "Điều khoản chung 2", value: "Căn cứ Luật Thương mại năm 2005" },
            { label: "Điều khoản chung 3", value: "Căn cứ Luật Điện lực ngày 03 tháng 12 năm 2004" },
        ],
        breachAndDamages: [
            { label: "Điều khoản chung 1", value: "Căn cứ Bộ luật Dân sự năm 2015" },
            { label: "Điều khoản chung 2", value: "Căn cứ Luật Thương mại năm 2005" },
            { label: "Điều khoản chung 3", value: "Căn cứ Luật Điện lực ngày 03 tháng 12 năm 2004" },
        ],
        TerminationOfContract: [
            { label: "Điều khoản chung 1", value: "Căn cứ Bộ luật Dân sự năm 2015" },
            { label: "Điều khoản chung 2", value: "Căn cứ Luật Thương mại năm 2005" },
            { label: "Điều khoản chung 3", value: "Căn cứ Luật Điện lực ngày 03 tháng 12 năm 2004" },
        ],
        DisputeResolutionClause: [
            { label: "Điều khoản chung 1", value: "Căn cứ Bộ luật Dân sự năm 2015" },
            { label: "Điều khoản chung 2", value: "Căn cứ Luật Thương mại năm 2005" },
            { label: "Điều khoản chung 3", value: "Căn cứ Luật Điện lực ngày 03 tháng 12 năm 2004" },
        ],
        PrivacyPolicy: [
            { label: "Điều khoản chung 1", value: "Căn cứ Bộ luật Dân sự năm 2015" },
            { label: "Điều khoản chung 2", value: "Căn cứ Luật Thương mại năm 2005" },
            { label: "Điều khoản chung 3", value: "Căn cứ Luật Điện lực ngày 03 tháng 12 năm 2004" },
        ],
    };

    // Update the handleSelectChange function to filter based on selected category
    const handleCategoryChange = (value) => {
        setSelectedCategory(value);
        // form.setFieldsValue({ generalTerms: [] });
    };

    useEffect(() => {
        const initialTerms = form.getFieldValue('generalTerms') || [];
        setSelectedGeneralTerms(initialTerms);
    }, []);

    const handleSelectChange = (newValues) => {
        form.setFieldsValue({ generalTerms: newValues });
        setSelectedGeneralTerms(newValues);
    };

    const handleRemoveTerm = (termToRemove) => {
        const updatedTerms = selectedGeneralTerms.filter(term => term !== termToRemove);
        form.setFieldsValue({ generalTerms: updatedTerms });
        setSelectedGeneralTerms(updatedTerms);
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

    const handleChildSelectChange = (key, newValues) => {
        const currentValues = form.getFieldValue(key.split(',')[0]) || {};
        const updatedValues = {
            ...currentValues,
            [key]: newValues,
        };
        form.setFieldsValue({ [key.split(',')[0]]: updatedValues });
    };

    const displayLabels = {
        // 'legalBasisCommon': "Căn phứ pháp lý chung",
        // 'legalBasisA': "Căn cứ pháp lý chỉ riêng bên A",
        // 'legalBasisB': "Căn cứ pháp lý chỉ riêng bên B",
        'additionalCommon': "Bổ sung chung",
        'additionalA': "Bổ sung riêng bên A",
        'additionalB': "Bổ sung riêng bên B",
        'specialCommon': "Đặc biệt chung",
        'specialA': "Đặc biệt riêng bên A",
        'specialB': "Đặc biệt riêng bên B",
        'warrantyAndMaintenanceCommon': "Điền khoản bảo hành và bảo trì chung",
        'warrantyAndMaintenanceA': "Điều khoản bảo hành và bảo trì riêng bên A",
        'warrantyAndMaintenanceB': "Điều khoản bảo hành và bảo trì riêng bên B",
        'breachAndDamagesCommon': "Điều khoản pháp lý chung",
        'breachAndDamagesA': "Điều khoản pháp lý riêng bên A",
        'breachAndDamagesB': "Điều khoản pháp lý riêng bên B",
        'terminationOfContractCommon': "Điều khoản chấm dứt hợp đồng chung",
        'terminationOfContractA': "Điều khoản chấm dứt hợp đồng riêng bên A",
        'terminationOfContractB': "Điều khoản chấm dứt hợp đồng riêng bên B",
        'disputeResolutionClauseCommon': "Điều khoản giải quyết tranh chấp chung",
        'disputeResolutionClauseA': "Điều khoản giải quyết tranh chấp riêng bên A",
        'disputeResolutionClauseB': "Điều khoản giải quyết tranh chấp riêng bên B",
        'privacyPolicyCommon': "Điều khoản chính sách bảo mật chung",
        'privacyPolicyA': "Điều khoản chính sách bảo mật riêng bên A",
        'privacyPolicyB': "Điều khoản chính sách bảo mật riêng bên B",
    }

    const onNewTypeChange = (e) => {
        setNewType(e.target.value);
    };

    const addNewType = async () => {
        if (!newType.trim()) return message.warning("Vui lòng nhập loại hợp đồng!");
        try {
            //   await createContractType({ name: newType }).unwrap();
            message.success("Thêm loại hợp đồng thành công!");
            setNewType(""); // Reset input
            refetch(); // Reload danh sách từ API
        } catch (error) {
            message.error("Lỗi khi tạo loại hợp đồng!");
        }
    };
    console.log(form.getFieldsValue())
    // Steps content
    const steps = [
        {
            title: "Nhập tên template",
            content: (
                <Form form={form} layout="vertical">
                    <Form.Item
                        label="Tên template"
                        name="templateName"
                        rules={[{ required: true, message: "Vui lòng nhập tên template!" }]}
                    >
                        <Input placeholder="Nhập tên template" onChange={handleTemplateNameChange} />
                    </Form.Item>
                    <Form.Item
                        label="Loại hợp đồng"
                        name="contractType"
                        rules={[{ required: true, message: "Vui lòng chọn loại hợp đồng!" }]}
                    >
                        <Select
                            showSearch
                            style={{ width: "100%" }}
                            placeholder="Chọn loại hợp đồng"
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
                                            value={newType}
                                            onChange={onNewTypeChange}
                                            onKeyDown={(e) => e.stopPropagation()}
                                        />
                                        <Button type="text" icon={<PlusOutlined />} onClick={addNewType} >
                                            {/* loading={isCreating} */}
                                            Thêm
                                        </Button>
                                    </Space>
                                </>
                            )}
                            options={contractType?.contractTypes?.map((type) => ({
                                label: type,
                                value: type,
                            }))}
                        />
                    </Form.Item>
                </Form>
            ),
        },
        {
            title: "Thông tin hợp đồng",
            content: (
                <Form form={form} layout="vertical" className="flex flex-col gap-3">
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
                                            {/* <Form.Item
                                                label="Số hợp đồng "
                                                name="contractNumber"
                                            >
                                                <Input placeholder={contractNumber} disabled />
                                            </Form.Item> */}
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
                                            {/* <Form.Item
                                                label="Ngày ký kết hợp đồng"
                                                name="signDate"
                                                rules={[{ required: false, message: "Vui lòng chọn ngày ký kết hợp đồng!" }]}
                                            >
                                                <DatePicker className="w-full" disabled />
                                            </Form.Item> */}
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
                                            <Select
                                                showSearch
                                                labelInValue
                                                mode="multiple"
                                                placeholder={`Chọn căn cứ pháp lý`}
                                                options={optionsMap['legalBasis']}
                                                onChange={handleSelectlegalBasisChange}
                                            >
                                            </Select>
                                        </Form.Item>
                                        <div className="mt-4 shadow-md ml-2 mb-3 bg-[#f5f5f5] p-4 rounded-md max-h-[400px] overflow-y-auto">
                                            <h4 className="font-bold">Căn cứ pháp lý đã chọn:</h4>
                                            <ul className="mt-2 flex flex-col gap-3 ">
                                                {selectedlegalBasis.map((term, index) => (
                                                    <li key={term} className="flex justify-between p-2 items-center border-b-2 border-e-slate-100 hover:bg-[#d1d1d1]">
                                                        <p className="w-[90%]"> {index + 1}. {term.key}</p>
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
                                        <div className="mt-4 p-4 bg-[#f5f5f5] rounded shadow-md">
                                            <h4 className="font-bold text-lg">Xem trước nội dung hợp đồng:</h4>
                                            <div className="p-2 " dangerouslySetInnerHTML={{ __html: content }} />
                                        </div>
                                        <h3 className="font-bold text-[19px] mt-9 mb-3">4. GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</h3>
                                        {/* <Form.Item
                                            label="Phương thức thanh toán"
                                            name="paymentMethod"
                                            rules={[{ required: true, message: "Vui lòng chọn phương thức thanh toán!" }]}
                                        >
                                            <Radio.Group options={[
                                                { label: "Thanh toán 1 đợt", value: "one-time" },
                                                { label: "Thanh toán nhiều đợt", value: "multiple" }
                                            ]} />
                                        </Form.Item> */}
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
                                        {/* <Form.Item
                                            label="Thời gian hiệu lực"
                                            name="effectiveTime"
                                            rules={[{ required: true, message: "Vui lòng chọn thời gian hiệu lực!" }]}
                                        >
                                            <Radio.Group options={[
                                                { label: "Mốc bắt đầu và kết thúc", value: "fixed-dates" },
                                                { label: "Các mốc cụ thể", value: "specific-milestones" }
                                            ]} />
                                        </Form.Item> */}

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
                                        <div className="flex items-center mb-4 ml-2">
                                            <p className="text-sm font-bold mr-3"> Loại điều khoản </p>
                                            <Select
                                                onChange={handleCategoryChange}
                                                defaultValue={'generalTermsOptions'}
                                                options={[
                                                    { label: "Điều khoản chung", value: "generalTermsOptions" },
                                                    // { label: "Căn cứ pháp lý", value: "legalBasis" },
                                                    { label: "Điều khoản bổ sung", value: "additional" },
                                                    { label: "Điều khoản đặc biệt", value: "specialConditions" },
                                                ]}
                                                className=" w-2/6 "
                                            />
                                        </div>
                                        <Form.Item
                                            // label={
                                            //     <div className=" ml-2 my-3 ">
                                            //         <p className="font-bold text-[16px]"> Điều khoản chung</p>
                                            //         <p className="">Mô tả: (Điều khoản được áp dụng cho cả 2 bên) </p>
                                            //     </div>
                                            // }
                                            name="generalTerms"
                                            rules={[{ required: true, message: "Vui lòng chọn điều khoản chung!" }]}
                                            className="ml-2"
                                        >

                                            <Select
                                                mode="multiple"
                                                maxTagCount='responsive'
                                                showSearch
                                                placeholder={<div>Chọn điều khoản chung

                                                </div>}
                                                options={optionsMap[selectedCategory]}
                                                filterOption={(input, option) =>
                                                    option.label.toLowerCase().includes(input.toLowerCase())
                                                }
                                                onChange={handleSelectChange}
                                            >

                                            </Select>
                                        </Form.Item>


                                        <div className="mt-4 shadow-md ml-2 mb-3 bg-[#f5f5f5] p-4 rounded-md max-h-[400px] overflow-y-auto">
                                            <h4 className="font-bold">Điều khoản chung đã chọn:</h4>
                                            <ul className="mt-2 flex flex-col gap-3 ">
                                                {selectedGeneralTerms.map((term, index) => (
                                                    <li key={index + term} className="flex justify-between p-2 items-center border-b-2 border-e-slate-100 hover:bg-[#d1d1d1]">
                                                        <p className="w-[90%]"> {index + 1}. {term}</p>
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
                                                    // { label: "Căn cứ pháp lý", value: "legalBasis" },
                                                    { label: "ĐIỀU KHOẢN BỔ SUNG", value: "additional" },
                                                    { label: "QUYỀN VÀ NGHĨA VỤ CÁC BÊN", value: "RightsAndObligations" },
                                                    { label: "ĐIỀN KHOẢN BẢO HÀNH VÀ BẢO TRÌ", value: "warrantyAndMaintenance" },
                                                    { label: "ĐIỀU KHOẢN VỀ VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI", value: "breachAndDamages" },
                                                    { label: "ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG", value: "TerminationOfContract" },
                                                    { label: "ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP", value: "DisputeResolutionClause" },
                                                    { label: "ĐIỀU KHOẢN BẢO MẬT", value: "PrivacyPolicy" },
                                                ]}
                                                onChange={handleCheckboxChange}
                                            />
                                        </Form.Item>

                                        <div className="flex flex-col">
                                            {/* {selectedOtherTypeTerms.includes("legalBasis") && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold mb-2">Căn cứ pháp lý</h4>
                                                    {["legalBasisCommon", "legalBasisA", "legalBasisB"].map((key, index) => (
                                                        <Form.Item
                                                            key={index}
                                                            label={displayLabels[key]}
                                                            name={['legalBasis', key]}
                                                        >
                                                            <Select
                                                                showSearch
                                                                labelInValue
                                                                mode="multiple"
                                                                placeholder={`Chọn ${optionsMap.legalBasis[index].label}`}
                                                                options={optionsMap['legalBasis']}
                                                                onChange={(newValues) => handleChildSelectChange('legalBasis', newValues)}
                                                            >
                                                            </Select>
                                                        </Form.Item>
                                                    ))}
                                                </div>
                                            )} */}
                                            {selectedOtherTypeTerms.includes("additional") && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN BỔ SUNG</h4>
                                                    {["additionalCommon", "additionalA", "additionalB"].map((key, index) => (
                                                        <Form.Item
                                                            key={index}
                                                            label={displayLabels[key]}
                                                            name={['additional', key]}
                                                        >
                                                            <Select
                                                                showSearch
                                                                labelInValue
                                                                mode="multiple"
                                                                placeholder={displayLabels[key]}
                                                                options={optionsMap['additional']}
                                                                onChange={(newValues) => handleChildSelectChange(`additional`, newValues)}
                                                            >

                                                            </Select>
                                                        </Form.Item>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes("RightsAndObligations") && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">QUYỀN VÀ NGHĨA VỤ CÁC BÊN</h4>
                                                    {["specialCommon", "specialA", "specialB"].map((key, index) => (
                                                        <Form.Item
                                                            key={index}
                                                            label={displayLabels[key]}
                                                            name={['RightsAndObligations', key]}
                                                        >
                                                            <Select
                                                                showSearch
                                                                labelInValue
                                                                mode="multiple"
                                                                placeholder={displayLabels[key]}
                                                                options={optionsMap['RightsAndObligations']}
                                                                onChange={(newValues) => handleChildSelectChange(`RightsAndObligations`, newValues)}
                                                            >

                                                            </Select>
                                                        </Form.Item>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes("warrantyAndMaintenance") && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN BẢO HÀNH VÀ BẢO TRÌ</h4>
                                                    {["warrantyAndMaintenanceCommon", "warrantyAndMaintenanceA", "warrantyAndMaintenanceB"].map((key, index) => (
                                                        <Form.Item
                                                            key={index}
                                                            label={displayLabels[key]}
                                                            name={['warrantyAndMaintenance', key]}
                                                        >
                                                            <Select
                                                                showSearch
                                                                labelInValue
                                                                mode="multiple"
                                                                placeholder={displayLabels[key]}
                                                                options={optionsMap['warrantyAndMaintenance']}
                                                                onChange={(newValues) => handleChildSelectChange(`warrantyAndMaintenance`, newValues)}
                                                            >

                                                            </Select>
                                                        </Form.Item>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes("breachAndDamages") && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI</h4>
                                                    {["breachAndDamagesCommon", "breachAndDamagesA", "breachAndDamagesB"].map((key, index) => (
                                                        <Form.Item
                                                            key={index}
                                                            label={displayLabels[key]}
                                                            name={['breachAndDamages', key]}
                                                        >
                                                            <Select
                                                                showSearch
                                                                labelInValue
                                                                mode="multiple"
                                                                placeholder={displayLabels[key]}
                                                                options={optionsMap['breachAndDamages']}
                                                                onChange={(newValues) => handleChildSelectChange(`breachAndDamages`, newValues)}
                                                            >

                                                            </Select>
                                                        </Form.Item>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes("TerminationOfContract") && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG</h4>
                                                    {["TerminationOfContractCommon", "TerminationOfContractA", "TerminationOfContractB"].map((key, index) => (
                                                        <Form.Item
                                                            key={index}
                                                            label={displayLabels[key]}
                                                            name={['TerminationOfContract', key]}
                                                        >
                                                            <Select
                                                                showSearch
                                                                labelInValue
                                                                mode="multiple"
                                                                placeholder={displayLabels[key]}
                                                                options={optionsMap['TerminationOfContract']}
                                                                onChange={(newValues) => handleChildSelectChange(`TerminationOfContract`, newValues)}
                                                            >
                                                            </Select>
                                                        </Form.Item>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes("DisputeResolutionClause") && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP</h4>
                                                    {["DisputeResolutionClauseCommon", "DisputeResolutionClauseA", "DisputeResolutionClauseB"].map((key, index) => (
                                                        <Form.Item
                                                            key={index}
                                                            label={displayLabels[key]}
                                                            name={['DisputeResolutionClause', key]}
                                                        >
                                                            <Select
                                                                showSearch
                                                                labelInValue
                                                                mode="multiple"
                                                                placeholder={displayLabels[key]}
                                                                options={optionsMap['DisputeResolutionClause']}
                                                                onChange={(newValues) => handleChildSelectChange(`DisputeResolutionClause`, newValues)}
                                                            >
                                                            </Select>
                                                        </Form.Item>
                                                    ))}
                                                </div>
                                            )}
                                            {selectedOtherTypeTerms.includes("PrivacyPolicy") && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">ĐIỀU KHOẢN BẢO MẬT</h4>
                                                    {["PrivacyPolicyCommon", "PrivacyPolicyA", "PrivacyPolicyB"].map((key, index) => (
                                                        <Form.Item
                                                            key={index}
                                                            label={displayLabels[key]}
                                                            name={['PrivacyPolicy', key]}
                                                        >
                                                            <Select
                                                                showSearch
                                                                labelInValue
                                                                mode="multiple"
                                                                placeholder={displayLabels[key]}
                                                                options={optionsMap['PrivacyPolicy']}
                                                                onChange={(newValues) => handleChildSelectChange(`PrivacyPolicy`, newValues)}
                                                            >
                                                            </Select>
                                                        </Form.Item>
                                                    ))}
                                                </div>
                                            )}
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
                        {form.getFieldValue("legalBasis") ? form.getFieldValue("legalBasis").map(term => <p><i>- {term.value}</i></p>) : null}
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
                                            {form.getFieldValue("generalTerms")?.map((term, index) => (
                                                <li className="ml-2" key={term}>{index + 1}. {term}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("RightsAndObligations") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Quyền và nghĩa vụ các bên:</h5>
                                        <h4 className="font-bold mt-2 ml-2">Quyền và nghĩa vụ chung</h4>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("RightsAndObligations").specialCommon?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                        {form.getFieldValue("RightsAndObligations").specialA && <h4 className="font-bold mt-2 ml-2">Quyền và nghĩa vụ chỉ riêng bên A</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("RightsAndObligations").specialA?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                        {form.getFieldValue("RightsAndObligations").specialB && <h4 className="font-bold mt-2 ml-2">Quyền và nghĩa vụ chỉ riêng bên B</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("RightsAndObligations").specialB?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("DisputeResolutionClause") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản giải quyết tranh chấp:</h5>
                                        <h4 className="font-bold mt-2 ml-2">Điều khoản giải quyết tranh chấp chung</h4>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("DisputeResolutionClause").DisputeResolutionClauseCommon?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                        {form.getFieldValue("DisputeResolutionClause").DisputeResolutionClauseA && <h4 className="font-bold mt-2 ml-2">Điều khoản giải quyết tranh chấp chỉ riêng bên A</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("DisputeResolutionClause").DisputeResolutionClauseA?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                        {form.getFieldValue("DisputeResolutionClause").DisputeResolutionClauseB && <h4 className="font-bold mt-2 ml-2">Điều khoản giải quyết tranh chấp chỉ riêng bên B</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("DisputeResolutionClause").DisputeResolutionClauseB?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("additional") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản Bổ sung:</h5>
                                        <h4 className="font-bold mt-2 ml-2">Điều khoản Bổ sung chung</h4>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("additional").additionalCommon?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                        {form.getFieldValue("additional").additionalA && <h4 className="font-bold mt-2 ml-2">Điều khoản Bổ sung chỉ riêng bên A</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("additional").additionalA?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                        {form.getFieldValue("additional").additionalB && <h4 className="font-bold mt-2 ml-2">Điều khoản Bổ sung chỉ riêng bên B</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("additional").additionalB?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("breachAndDamages") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản pháp lý:</h5>
                                        <h4 className="font-bold mt-2 ml-2">Điều khoản pháp lý chung</h4>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("breachAndDamages").breachAndDamagesCommon?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                        {form.getFieldValue("breachAndDamages").breachAndDamagesA && <h4 className="font-bold mt-2 ml-2">Điều khoản pháp lý chỉ riêng bên A</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("breachAndDamages").breachAndDamagesA?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                        {form.getFieldValue("breachAndDamages").breachAndDamagesB && <h4 className="font-bold mt-2 ml-2">Điều khoản pháp lý chỉ riêng bên B</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("breachAndDamages").breachAndDamagesB?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("TerminationOfContract") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản chấm dứt hợp đồng:</h5>
                                        <h4 className="font-bold mt-2 ml-2">Điều khoản chấm dứt hợp đồng chung</h4>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("TerminationOfContract").TerminationOfContractCommon?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                        {form.getFieldValue("TerminationOfContract").TerminationOfContractA && <h4 className="font-bold mt-2 ml-2">Điều khoản chấm dứt hợp đồng chỉ riêng bên A</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("TerminationOfContract").TerminationOfContractA?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                        {form.getFieldValue("TerminationOfContract").TerminationOfContractB && <h4 className="font-bold mt-2 ml-2">Điều khoản chấm dứt hợp đồng chỉ riêng bên B</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("TerminationOfContract").TerminationOfContractB?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("warrantyAndMaintenance") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản bảo hành và bảo trì:</h5>
                                        <h4 className="font-bold mt-2 ml-2">Điều khoản bảo hành và bảo trì chung</h4>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("warrantyAndMaintenance").warrantyAndMaintenanceCommon?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                        {form.getFieldValue("warrantyAndMaintenance").warrantyAndMaintenanceA && <h4 className="font-bold mt-2 ml-2">Điều khoản bảo hành và bảo trì chỉ riêng bên A</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("warrantyAndMaintenance").warrantyAndMaintenanceA?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                        {form.getFieldValue("warrantyAndMaintenance").warrantyAndMaintenanceB && <h4 className="font-bold mt-2 ml-2">Điều khoản bảo hành và bảo trì chỉ riêng bên B</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("warrantyAndMaintenance").warrantyAndMaintenanceB?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("PrivacyPolicy") && (
                                    <div>
                                        <h5 className="font-semibold text-lg">Điều khoản chính sách bảo mật:</h5>
                                        <h4 className="font-bold mt-2 ml-2">Điều khoản chính sách bảo mật chung</h4>
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("PrivacyPolicy").PrivacyPolicyCommon?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            )) || <p className="ml-2">Không có</p>}
                                        </ul>
                                        {form.getFieldValue("PrivacyPolicy").PrivacyPolicyA && <h4 className="font-bold mt-2 ml-2">Điều khoản chính sách bảo mật chỉ riêng bên A</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("PrivacyPolicy").PrivacyPolicyA?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                        {form.getFieldValue("PrivacyPolicy").PrivacyPolicyB && <h4 className="font-bold mt-2 ml-2">Điều khoản chính sách bảo mật chỉ riêng bên B</h4>}
                                        <ul className="mt-2 flex flex-col gap-1">
                                            {form.getFieldValue("PrivacyPolicy").PrivacyPolicyB?.map((term, index) => (
                                                <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {form.getFieldValue("specialTermsA") && (
                                    <div className="mt-2">
                                        <h5 className="font-semibold text-lg">Điều khoản đặc biệt bên A</h5>
                                        <p>{form.getFieldValue("specialTermsB")}</p>
                                    </div>
                                )}
                                {form.getFieldValue("specialTermsB") && (
                                    <div className="mt-2">
                                        <h5 className="font-semibold text-lg">Điều khoản đặc biệt bên B</h5>
                                        <p>{form.getFieldValue("specialTermsB")}</p>
                                    </div>
                                )}
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
                        onClick={() => message.success("Lưu template thành công!")}
                        icon={<BsSave2Fill />}
                        iconPosition="end"
                    >
                        Lưu Template
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CreateTemplate;
