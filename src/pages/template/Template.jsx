import React, { useState, useEffect, useCallback } from "react";
import { Steps, Button, Input, DatePicker, Checkbox, message, Form, Collapse, Skeleton, Empty, Card, Row, Col, Select, ConfigProvider, Radio, Switch } from "antd";
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
const { Step } = Steps;

const Template = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const currentDate = new Date();
    const [templateName, setTemplateName] = useState("");
    const [contractNumber, setContractNumber] = useState("");
    const { data: bsInfor, isLoading, isError } = useGetBussinessInformatinQuery()      ///fix rerendering
    const [content, setContent] = useState('');
    const [isVATChecked, setIsVATChecked] = useState(false);
    const [selectedGeneralTerms, setSelectedGeneralTerms] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("generalTermsOptions"); // New state for selected category

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
        const getInitials = (name) => name.toUpperCase().split(' ').map(word => word[0]).join('');
        const currentDate = new Date();
        const formattedDate = `${currentDate.getDate()}${currentDate.getMonth() + 1}${currentDate.getFullYear()}`;
        setContractNumber(`${getInitials(templateName)}-${formattedDate}`);
    }, [templateName]);

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
        updateContractNumber(newTitle);
    };

    // Hàm cập nhật số hợp đồng dựa trên tên tiêu đề mới
    const updateContractNumber = (newTitle) => {
        const getInitials = (name) => name.toUpperCase().split(' ').map(word => word[0]).join('');
        const formattedDate = `${currentDate.getDate()}${currentDate.getMonth() + 1}${currentDate.getFullYear()}`;
        setContractNumber(`${getInitials(newTitle)}${formattedDate}`);
    };

    const [selectedOtherTypeTerms, setSelectedOtherTypeTerms] = useState([]);

    // Xử lý thay đổi checkbox
    const handleCheckboxChange = (checkedValues) => {
        setSelectedOtherTypeTerms(checkedValues);
        const newFields = {};
        checkedValues.forEach((value) => {
            if (value === "legalBasis") {
                newFields.legalBasis = {
                    legalBasisCommon: [],
                    legalBasisA: [],
                    legalBasisB: [],
                };
            }
            if (value === "additional") {
                newFields.additional = {
                    additionalCommon: [],
                    additionalA: [],
                    additionalB: [],
                };
            }
            if (value === "RightsAndObligations") {
                newFields.RightsAndObligations = {
                    rightsCommon: [],
                    rightsA: [],
                    rightsB: [],
                };
            }
            if (value === "warrantyAndMaintenance") {
                newFields.warrantyAndMaintenance = {
                    warrantyCommon: [],
                    warrantyA: [],
                    warrantyB: [],
                };
            }
            if (value === "breachAndDamages") {
                newFields.breachAndDamages = {
                    breachCommon: [],
                    breachA: [],
                    breachB: [],
                };
            }
            if (value === "TerminationOfContract") {
                newFields.TerminationOfContract = {
                    terminationCommon: [],
                    terminationA: [],
                    terminationB: [],
                };
            }
            if (value === "DisputeResolutionClause") {
                newFields.DisputeResolutionClause = {
                    disputeCommon: [],
                    disputeA: [],
                    disputeB: [],
                };
            }
            if (value === "PrivacyPolicy") {
                newFields.PrivacyPolicy = {
                    privacyCommon: [],
                    privacyA: [],
                    privacyB: [],
                };
            }
        });
        form.setFieldsValue({ ...form.getFieldsValue(), ...newFields });
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

    const handleChildSelectChange = (key, newValues) => {
        const currentValues = form.getFieldValue(key.split(',')[0]) || {};
        const updatedValues = {
            ...currentValues,
            [key]: newValues,
        };
        form.setFieldsValue({ [key.split(',')[0]]: updatedValues });
    };

    const displayLabels = {
        'legalBasisCommon': "Căn phứ pháp lý chung",
        'legalBasisA': "Căn cứ pháp lý chỉ riêng bên A",
        'legalBasisB': "Căn cứ pháp lý chỉ riêng bên B",
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
                                    label: <p className="font-bold"> Thông tin chung</p>,
                                    children: <div>
                                        <h3 className="font-bold text-[19px]">1. Tiêu đề hợp đồng</h3>
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
                                            <p className="text-right mr-[10%]">Ngày {currentDate.getDate()} Tháng {currentDate.getMonth() + 1} Năm {currentDate.getFullYear()}</p>
                                            <p className="text-2xl font-bold mt-3">{templateName.toUpperCase()}</p>
                                            <p className="mt-1"><b>Số:</b> {contractNumber}</p>
                                        </div>

                                        <h3 className="font-bold text-[19px] my-6">2. Thông tin các bên tham gia</h3>

                                        <Form.Item
                                            // label="Thông tin bên ta"
                                            name="partyInfo"
                                            initialValue="Công ty ABC - Địa chỉ: 123 Đường ABC, TP. Hồ Chí Minh"
                                        >
                                            <Input disabled />
                                        </Form.Item>

                                        <Row gutter={16} className="bg-[#f5f5f5] shadow-md p-4 rounded-md gap-7" justify={"center"}>
                                            <Col className="flex flex-col gap-2 " md={10} sm={24} >
                                                <p className="font-bold text-lg "><u>Bên cung cấp (Bên A)</u></p>
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
                                    </div>
                                },
                            ]}
                        />
                        <Collapse
                            size="large"
                            items={[
                                {
                                    key: '2',
                                    label: <p className="font-bold"> Nội dung chính</p>,
                                    children: <div>
                                        <h3 className="font-bold text-[19px]">3. Nội dung hợp đồng</h3>
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
                                        <h3 className="font-bold text-[19px] mt-9 mb-3">4. Giá trị hợp đồng và phương thức thanh toán</h3>
                                        <Form.Item
                                            label="Phương thức thanh toán"
                                            name="paymentMethod"
                                            rules={[{ required: true, message: "Vui lòng chọn phương thức thanh toán!" }]}
                                        >
                                            <Radio.Group options={[
                                                { label: "Thanh toán 1 đợt", value: "one-time" },
                                                { label: "Thanh toán nhiều đợt", value: "multiple" }
                                            ]} />
                                        </Form.Item>

                                        <Form.Item
                                            // label="Tự động thêm VAT"
                                            name="autoAddVAT"
                                            valuePropName="checked"
                                            initialValue={isVATChecked}
                                        >
                                            <div className="flex items-center">
                                                <Switch className="mr-4"
                                                    onChange={(checked) => {
                                                        form.setFieldsValue({ autoAddVAT: checked });
                                                        setIsVATChecked(checked);
                                                    }}
                                                    checked={form.getFieldValue('autoAddVAT')}
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
                                                    className="w-[100px]"
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

                                        <h3 className="font-bold text-[19px] mt-6 mb-3">5. Thời gian hiệu lực</h3>
                                        <Form.Item
                                            label="Thời gian hiệu lực"
                                            name="effectiveTime"
                                            rules={[{ required: true, message: "Vui lòng chọn thời gian hiệu lực!" }]}
                                        >
                                            <Radio.Group options={[
                                                { label: "Mốc bắt đầu và kết thúc", value: "fixed-dates" },
                                                { label: "Các mốc cụ thể", value: "specific-milestones" }
                                            ]} />
                                        </Form.Item>

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
                                                    }}
                                                    checked={form.getFieldValue('autoRenew')} />
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
                                    label: <p className="font-bold"> Điều khoản và các cam kết </p>,
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
                                                    { label: "Căn cứ pháp lý", value: "legalBasis" },
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
                                                    <li key={term} className="flex justify-between p-2 items-center border-b-2 border-e-slate-100">
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
                                                    { label: "Căn cứ pháp lý", value: "legalBasis" },
                                                    { label: "Điều khoản bổ sung", value: "additional" },
                                                    { label: "Quyền và nghĩa vụ các bên", value: "RightsAndObligations" },
                                                    { label: "Điền khoản bảo hành và bảo trì", value: "warrantyAndMaintenance" },
                                                    { label: "Điều khoản về vi phạm và bồi thường thiệt hại", value: "breachAndDamages" },
                                                    { label: "Điều khoản về chấm dứt hợp đồng", value: "TerminationOfContract" },
                                                    { label: "Điều khoản về Giải quyết tranh chấp", value: "DisputeResolutionClause" },
                                                    { label: "Điều khoản bảo mật", value: "PrivacyPolicy" },
                                                ]}
                                                onChange={handleCheckboxChange}
                                            />
                                        </Form.Item>

                                        <div className="flex flex-col">
                                            {selectedOtherTypeTerms.includes("legalBasis") && (
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
                                            )}
                                            {selectedOtherTypeTerms.includes("additional") && (
                                                <div className="mt-4">
                                                    <h4 className="font-bold">Điều khoản bổ sung</h4>
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
                                                    <h4 className="font-bold">Quyền và nghĩa vụ các bên</h4>
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
                                                    <h4 className="font-bold">Điền khoản bảo hành và bảo trì</h4>
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
                                                    <h4 className="font-bold">Điều khoản về vi phạm và bồi thường thiệt hại</h4>
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
                                                    <h4 className="font-bold">Điều khoản về chấm dứt hợp đồng</h4>
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
                                                    <h4 className="font-bold">Điều khoản về Giải quyết tranh chấp</h4>
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
                                                    <h4 className="font-bold">Điều khoản bảo mật</h4>
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
                                                    <p className="font-bold text-[16px]"> Điều khoản đặc biệt bên A</p>
                                                    <p className="">Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên A) </p>
                                                </div>
                                            }
                                            name="specialTermsA"
                                        // rules={[{ required: true, message: "Vui lòng chọn điều khoản đặc biệt bên A!" }]}
                                        >
                                            <Select
                                                showSearch
                                                placeholder="Chọn điều khoản bên A"
                                                options={optionsMap['specialConditions']}
                                                filterOption={(input, option) =>
                                                    option.label.toLowerCase().includes(input.toLowerCase())
                                                }
                                                onChange={handleSelectChange}
                                            />
                                        </Form.Item>
                                        <Form.Item
                                            label={
                                                <div className="ml-2 my-3">
                                                    <p className="font-bold text-[16px]"> Điều khoản đặc biệt bên B</p>
                                                    <p className="">Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên B) </p>
                                                </div>
                                            }
                                            name="specialTermsB"
                                        // rules={[{ required: fa, message: "Vui lòng chọn điều khoản đặc biệt bên B!" }]}
                                        >
                                            <Select
                                                showSearch
                                                placeholder="Chọn điều khoản bên B"
                                                options={optionsMap['specialConditions']}
                                                filterOption={(input, option) =>
                                                    option.label.toLowerCase().includes(input.toLowerCase())
                                                }
                                                onChange={handleSelectChange}
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
                                    label: <p className="font-bold"> Nội dung khác </p>,
                                    children: <div>
                                        <h3 className="font-bold text-[19px] mb-3">7. Chữ ký và con dấu</h3>
                                        <p className="text-sm ml-2">Tích hợp sử dụng chữ ký số vào hợp đồng </p>
                                        <p className="font-bold text-[19px] my-4">8. Phụ lục</p>
                                        <Form.Item
                                            name="appendixEnabled"
                                            valuePropName="checked"
                                            initialValue={false}
                                            className="ml-2"
                                        >
                                            <Checkbox>Cho phép tạo phụ lục khi hợp đồng có hiệu lực</Checkbox>
                                        </Form.Item>
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
                <div className="p-20 space-y-4">
                    <div className=" p-4 rounded-md text-center">
                        <p className="font-bold text-lg">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                        <p className="font-bold text-[16px] mt-1"> Độc lập - Tự do - Hạnh phúc</p>
                        <p>-------------------</p>
                        <p className="text-right mr-[10%]">Ngày {currentDate.getDate()} Tháng {currentDate.getMonth() + 1} Năm {currentDate.getFullYear()}</p>
                        <p className="text-2xl font-bold mt-3">{templateName.toUpperCase()}</p>
                        <p className="mt-2">(<b> Số:</b> {contractNumber} )</p>
                    </div>
                    <div className="p-4 rounded-md flex flex-col gap-4">
                        <div className="flex flex-col gap-2 " md={10} sm={24} >
                            <p className="font-bold text-lg "><u>Bên cung cấp (Bên A)</u></p>
                            <p className="text-sm "><b>Tên công ty:</b> {bsInfor?.businessName}</p>
                            <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {bsInfor?.address}</p>
                            <p className="flex text-sm justify-between"><p><b>Người đại diện:</b> {bsInfor?.representativeName} </p></p>
                            <p className="text-sm"><b>Chức vụ:</b> {bsInfor?.representativeTitle}</p>
                            <p className='flex text-sm  justify-between'><p><b>Mã số thuế:</b> {bsInfor?.taxCode}</p></p>
                            <p className="text-sm"><b>Email:</b> {bsInfor?.email}</p>
                        </div>
                        <div className="flex flex-col gap-2" md={10} sm={24}>
                            <p className="font-bold text-lg "><u>Bên thuê (Bên B)</u></p>
                            <p className="text-sm "><b>Tên công ty: </b>....................................................................................................................................</p>
                            <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> .......................................................................................................................</p>
                            <p className="flex  text-sm justify-between"><p><b>Người đại diện:</b> ...............................................................................................................................</p></p>
                            <p className="text-sm"><b>Chức vụ:</b> ..........................................................................................................................................</p>
                            <p className='flex text-sm justify-between'><p><b>Mã số thuế:</b> .....................................................................................................................................</p></p>
                            <p className="text-sm"><b>Email:</b> ...............................................................................................................................................</p>
                        </div>

                        <p>Sau khi bàn bạc và thống nhất chúng tôi cùng thỏa thuận ký kết bản hợp đồng với nội dung và các điều khoản sau: </p>

                        <p className="font-bold text-lg ">Nội dung hợp đồng</p>

                        <div className="ml-1" dangerouslySetInnerHTML={{ __html: form.getFieldValue("contractContent") || "Chưa nhập" }} />

                    </div>

                    <h3 className="font-bold mb-4">Tên Template: {form.getFieldValue("templateName")}</h3>
                    <h4 className="font-bold">1. Tiêu đề hợp đồng:</h4>
                    <p>{form.getFieldValue("contractTitle") || "Chưa nhập"}</p>
                    <p>Số hợp đồng: {contractNumber}</p>
                    <p>Ngày ký kết: {form.getFieldValue("signDate") ? form.getFieldValue("signDate").format("DD/MM/YYYY") : "Chưa chọn"}</p>
                    <h4 className="font-bold">2. Thông tin bên ta:</h4>
                    <p>{form.getFieldValue("partyInfo")}</p>
                    <h4 className="font-bold">3. Nội dung hợp đồng:</h4>
                    <p>{form.getFieldValue("contractContent") || "Chưa nhập"}</p>
                    <h4 className="font-bold">4. Giá trị hợp đồng và phương thức thanh toán:</h4>
                    <ul>
                        {/* {form.getFieldValue("paymentMethod")?.length
                            ? form.getFieldValue("paymentMethod").map((method) => (
                                <li key={method}>
                                    {method === "one-time" ? "Thanh toán 1 đợt" : "Thanh toán nhiều đợt"}
                                </li>
                            ))
                            : "Chưa chọn"} */}
                    </ul>
                    <h4 className="font-bold">5. Thời gian hiệu lực:</h4>
                    {/* <p>
                        {form.getFieldValue("effectiveTime")?.includes("fixed-dates")
                            ? `Từ ngày ${form.getFieldValue("effectiveDates")[0]?.startDate?.format("DD/MM/YYYY") || "Chưa chọn"} đến ngày ${form.getFieldValue("effectiveDates")[0]?.endDate?.format("DD/MM/YYYY") || "Chưa chọn"}`
                            : "Chưa chọn"}
                    </p> */}
                </div>
            ),
        },
    ];


    if (isLoading) return <Skeleton active />;
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

export default Template;
