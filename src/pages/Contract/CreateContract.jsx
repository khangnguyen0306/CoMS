import React, { useRef, useState } from "react";
import { Steps, Form, Input, Select, DatePicker, Checkbox, Button, Space, Divider, message, Row, Col, Spin } from "antd";
import dayjs from "dayjs";
import LazySelectContractTemplate from "../../hooks/LazySelectContractTemplate";
import { useNavigate } from "react-router-dom";
import { useLazyGetAllTemplateQuery } from "../../services/TemplateAPI";
import { FcNext } from "react-icons/fc";
import { useLazyGetPartnerListQuery } from "../../services/PartnerAPI";
import LazySelectPartner from "../../hooks/LazySelectPartner";
import LazySelectContractType from "../../hooks/LazySelectContractType";
import { useCreateContractTypeMutation, useLazyGetContractTypeQuery } from "../../services/ContractAPI";
import { PlusOutlined } from "@ant-design/icons";

const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

const CreateContractForm = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [form] = Form.useForm();
    const inputRef = useRef(null);
    const navigate = useNavigate()
    const [newTypeCreate, setNewTypeCreate] = useState('')
    const [getContractTypeData, { data: contractTypeData, isLoading: isLoadingContractType }] = useLazyGetContractTypeQuery()
    console.log(contractTypeData)
    const [getTemplateData, { data: templateData, isLoading }] = useLazyGetAllTemplateQuery()
    const [getPartnerData, { data: partnerData, isLoading: isLoadingParnerData }] = useLazyGetPartnerListQuery()
    const [createContractType, { isLoadingCreateType }] = useCreateContractTypeMutation()
    // chuyển trang tạo template
    const handleCreateTemplate = () => {
        navigate("/createtemplate")
    }

    // chuyển trang tạo partner
    const handleCreatePartner = () => {
        navigate("/partner")
    }

    const loadTemplateData = async ({ page, size, keyword }) => {
        return getTemplateData({ page, size, keyword }).unwrap();
    };

    const loadPartnerData = async ({ page, size, keyword }) => {
        return getPartnerData({ page, size, keyword }).unwrap();
    };
    const loadContractTypeData = async () => {
        return getContractTypeData().unwrap();
    };



    // Xử lý chuyển bước
    const next = async () => {
        try {
            // Validate current step fields (nếu cần)
            await form.validateFields();
            setCurrentStep(currentStep + 1);
        } catch (errorInfo) {
            message.error("Vui lòng kiểm tra lại các trường bắt buộc!");
        }
    };

    const prev = () => {
        setCurrentStep(currentStep - 1);
    };

    // Submit toàn bộ form
    const onFinish = (values) => {
        console.log("Form values: ", values);
        message.success("Hợp đồng đã được tạo thành công!");
        // Gửi values xuống backend theo yêu cầu
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


    console.log(form.getFieldsValue())

    if (isLoading) {
        return (
            <div className="flex justify-center items-center">
                <Spin size="large" />
            </div>
        )
    }
    // Các bước của form
    const steps = [
        {
            title: "Thông tin cơ bản",
            content: (
                <div className="space-y-4">
                    <Form.Item
                        label="Chọn mẫu hợp đồng"
                        name="templateId"
                        rules={[{ required: true, message: "Vui lòng chọn mẫu hợp đồng!" }]}
                    >
                        <LazySelectContractTemplate
                            loadDataCallback={loadTemplateData}
                            options={templateData?.data.content}
                            showSearch
                            labelInValue
                            placeholder="Chọn mẫu hợp đồng"
                            // dropdownRender={(menu) => (
                            //     <>
                            //         {menu}
                            //         <Divider style={{ margin: "8px 0" }} />
                            //         <Space style={{ padding: "0 8px 4px" }}>
                            //             <Button type="primary" icon={FcNext} onClick={handleCreateTemplate}>
                            //                 Thêm mẫu hợp đồng
                            //             </Button>
                            //         </Space>
                            //     </>
                            // )}
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
                            labelInValue
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
                        rules={[{ required: true, message: "Vui lòng nhập tên hợp đồng!" }]}
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
                            labelInValue
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
                <div className="space-y-4">
                    <Divider orientation="left">Thông tin từ Template & Đối tác</Divider>
                    <Form.Item
                        label="Căn cứ pháp lý"
                        name="legalBasis"
                        rules={[{ required: true, message: "Vui lòng chọn căn cứ pháp lý!" }]}
                    >
                        <Select placeholder="Chọn căn cứ pháp lý" allowClear>
                            <Option value="basis1">Bộ Luật Dân sự</Option>
                            <Option value="basis2">Luật Thương mại</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Nội dung hợp đồng"
                        name="contractContent"
                        rules={[{ required: true, message: "Vui lòng nhập nội dung hợp đồng!" }]}
                    >
                        <TextArea rows={4} placeholder="Nhập nội dung hợp đồng" />
                    </Form.Item>
                    <Form.Item
                        label="Tổng giá trị hợp đồng"
                        name="totalValue"
                        rules={[{ required: true, message: "Vui lòng nhập tổng giá trị hợp đồng!" }]}
                    >
                        <Input type="number" placeholder="Nhập tổng giá trị hợp đồng" />
                    </Form.Item>
                    <Divider orientation="left">Thanh toán</Divider>
                    {/* Sử dụng Form.List để cho phép thêm nhiều lần thanh toán */}
                    <Form.List name="payments">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} align="baseline" style={{ display: "flex", marginBottom: 8 }}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "amount"]}
                                            rules={[{ required: true, message: "Nhập số tiền thanh toán" }]}
                                        >
                                            <Input type="number" placeholder="Số tiền" />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "paymentDate"]}
                                            rules={[{ required: true, message: "Chọn ngày thanh toán" }]}
                                        >
                                            <DatePicker placeholder="Ngày thanh toán" />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, "paymentMethod"]}
                                            rules={[{ required: true, message: "Chọn phương thức thanh toán" }]}
                                        >
                                            <Select placeholder="Phương thức thanh toán" style={{ width: 150 }}>
                                                <Option value="transfer">Chuyển khoản</Option>
                                                <Option value="cash">Tiền mặt</Option>
                                                <Option value="creditCard">Thẻ tín dụng</Option>
                                            </Select>
                                        </Form.Item>
                                        <Button onClick={() => remove(name)} danger>
                                            Xóa
                                        </Button>
                                    </Space>
                                ))}
                                <Button type="dashed" onClick={() => add()} block>
                                    Thêm đợt thanh toán
                                </Button>
                            </>
                        )}
                    </Form.List>

                    <Divider orientation="left">Điều khoản & Cam kết</Divider>
                    <Form.Item
                        label="Điều khoản chung"
                        name="commonTerms"
                        rules={[{ required: true, message: "Chọn ít nhất một điều khoản chung!" }]}
                    >
                        <Select mode="multiple" placeholder="Chọn điều khoản chung" allowClear>
                            <Option value="common1">Điều khoản chung 1</Option>
                            <Option value="common2">Điều khoản chung 2</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Điều khoản bổ sung"
                        name="additionalTerms"
                    >
                        <Select mode="multiple" placeholder="Chọn điều khoản bổ sung" allowClear>
                            <Option value="additional1">Điều khoản bổ sung 1</Option>
                            <Option value="additional2">Điều khoản bổ sung 2</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Quyền và nghĩa vụ các bên"
                        name="rightsAndObligations"
                    >
                        <Select mode="multiple" placeholder="Chọn quyền và nghĩa vụ" allowClear>
                            <Option value="rights1">Quyền và nghĩa vụ 1</Option>
                            <Option value="rights2">Quyền và nghĩa vụ 2</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Điều khoản bảo hành và bảo trì"
                        name="warrantyTerms"
                    >
                        <Select mode="multiple" placeholder="Chọn điều khoản bảo hành" allowClear>
                            <Option value="warranty1">Điều khoản bảo hành 1</Option>
                            <Option value="warranty2">Điều khoản bảo hành 2</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Điều khoản về vi phạm và bồi thường thiệt hại"
                        name="breachTerms"
                    >
                        <Select mode="multiple" placeholder="Chọn điều khoản vi phạm" allowClear>
                            <Option value="breach1">Điều khoản vi phạm 1</Option>
                            <Option value="breach2">Điều khoản vi phạm 2</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Điều khoản về chấm dứt hợp đồng"
                        name="terminationTerms"
                    >
                        <Select mode="multiple" placeholder="Chọn điều khoản chấm dứt" allowClear>
                            <Option value="termination1">Điều khoản chấm dứt 1</Option>
                            <Option value="termination2">Điều khoản chấm dứt 2</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Điều khoản về giải quyết tranh chấp"
                        name="disputeTerms"
                    >
                        <Select mode="multiple" placeholder="Chọn điều khoản giải quyết tranh chấp" allowClear>
                            <Option value="dispute1">Điều khoản giải quyết tranh chấp 1</Option>
                            <Option value="dispute2">Điều khoản giải quyết tranh chấp 2</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label="Điều khoản bảo mật"
                        name="privacyTerms"
                    >
                        <Select mode="multiple" placeholder="Chọn điều khoản bảo mật" allowClear>
                            <Option value="privacy1">Điều khoản bảo mật 1</Option>
                            <Option value="privacy2">Điều khoản bảo mật 2</Option>
                        </Select>
                    </Form.Item>

                    <Divider orientation="left">Thông tin thời gian</Divider>
                    <Form.Item
                        label="Ngày có hiệu lực"
                        name="effectiveDate"
                        rules={[{ required: true, message: "Chọn ngày có hiệu lực!" }]}
                    >
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item
                        label="Ngày hết hiệu lực"
                        name="expiryDate"
                        rules={[{ required: true, message: "Chọn ngày hết hiệu lực!" }]}
                    >
                        <DatePicker className="w-full" />
                    </Form.Item>
                    <Form.Item
                        label="Ngày ký kết"
                        name="signingDate"
                        initialValue={dayjs()}  // Lấy ngày hiện tại
                        rules={[{ required: true, message: "Ngày ký kết không được để trống!" }]}
                    >
                        <DatePicker className="w-full" disabled />
                    </Form.Item>

                    <Divider orientation="left">Điều khoản đặc biệt</Divider>
                    <Form.Item
                        label="Điều khoản đặc biệt bên A"
                        name="specialTermsA"
                    >
                        <Input placeholder="Nhập điều khoản đặc biệt cho bên A" />
                    </Form.Item>
                    <Form.Item
                        label="Điều khoản đặc biệt bên B"
                        name="specialTermsB"
                    >
                        <Input placeholder="Nhập điều khoản đặc biệt cho bên B" />
                    </Form.Item>
                </div>
            ),
        },
        {
            title: "Xem lại hợp đồng",
            content: (
                <div className="p-4">
                    <h3 className="font-bold">Tóm tắt hợp đồng</h3>
                    <pre>{JSON.stringify(form.getFieldsValue(), null, 2)}</pre>
                </div>
            ),
        },
        {
            title: " Thời gian thông báo",
            content: (
                <div className="p-4 space-y-4">
                    <h3 className="font-bold">Thiết lập thời gian thông báo cho các mốc</h3>

                    {/* Hiển thị và chọn ngày thông báo cho Ngày có hiệu lực */}
                    <Row gutter={16} justify={"center"}>
                        <Col span={6}>
                            <Form.Item
                                label="Ngày có hiệu lực (đã chọn)"
                                name="effectiveDate"
                            >
                                <DatePicker className="w-full" disabled />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="Ngày thông báo"
                                name="notifyEffectiveDate"
                                rules={[{ required: true, message: "Vui lòng chọn ngày thông báo cho ngày có hiệu lực!" }]}
                            >
                                <DatePicker className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Hiển thị và chọn ngày thông báo cho Ngày hết hiệu lực */}
                    <Row gutter={16} justify={"center"}>
                        <Col span={6}>
                            <Form.Item
                                label="Ngày hết hiệu lực (đã chọn)"
                                name="expiryDate"
                            >
                                <DatePicker className="w-full" disabled />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item
                                label="Ngày thông báo"
                                name="notifyExpiryDate"
                                rules={[{ required: true, message: "Vui lòng chọn ngày thông báo cho ngày hết hiệu lực!" }]}
                            >
                                <DatePicker className="w-full" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {/* Các đợt thanh toán: Mỗi đợt được hiển thị trong 1 row gồm ngày thanh toán và ngày thông báo tương ứng */}
                    <Form.List name="payments">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }, index) => (
                                    <div key={key} className="border p-3 rounded mb-4 ">
                                        <h4 className="font-bold">Đợt thanh toán {index + 1}</h4>
                                        <Row gutter={16} justify={"center"}>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    label="Ngày thanh toán (đã chọn)"
                                                    name={[name, "paymentDate"]}
                                                >
                                                    <DatePicker className="w-full" disabled />
                                                </Form.Item>
                                            </Col>
                                            <Col span={6}>
                                                <Form.Item
                                                    {...restField}
                                                    label="Ngày thông báo"
                                                    name={[name, "notifyPaymentDate"]}
                                                    rules={[{ required: true, message: "Vui lòng chọn ngày thông báo cho đợt thanh toán!" }]}
                                                >
                                                    <DatePicker className="w-full" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block>
                                        Thêm đợt thanh toán
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </div>
            ),
        },
        {
            title: "Quy trình ký duyệt",
            content: (
                <div className="p-4 space-y-4">
                    <h3 className="font-bold">Chọn quy trình ký duyệt</h3>
                    <Form.Item
                        label="Quy trình ký duyệt"
                        name="approvalProcess"
                        rules={[{ required: true, message: "Vui lòng chọn quy trình ký duyệt!" }]}
                    >
                        <Select placeholder="Chọn quy trình ký duyệt" allowClear>
                            <Option value="sequential">Theo thứ tự (Sequential)</Option>
                            <Option value="parallel">Song song (Parallel)</Option>
                        </Select>
                    </Form.Item>
                </div>
            ),
        },
    ];

    return (
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
    );
};

export default CreateContractForm;
