import React, { useState } from "react";
import {
    Table, Input, Space, Button, Modal, Tag, Form, Upload, Row, Col, DatePicker
} from "antd";
import {
    EditFilled, DownloadOutlined, UploadOutlined
} from "@ant-design/icons";
import { useGetAllContractPartnerQuery } from "../../services/ContractAPI";
import { GoogleGenerativeAI } from "@google/generative-ai";



// Lấy API key từ biến môi trường (lưu ý rủi ro bảo mật nếu dùng trên FE)
const apiKey = import.meta.env.VITE_AI_KEY_UPLOAD;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-pro-exp-02-05",
});

// Cấu hình generationConfig theo yêu cầu
const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema: {
        type: "object",
        properties: {
            title: { type: "string" },
            partnerName: { type: "string" },
            contractNumber: { type: "string" },
            amount: { type: "number" },
            effectiveDate: { type: "array", items: { type: "integer" } },
            expiryDate: { type: "array", items: { type: "integer" } },
            signingDate: { type: "array", items: { type: "integer" } },
            paymentSchedules: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        amount: { type: "number" },
                        paymentDate: { type: "array", items: { type: "integer" } },
                        paymentMethod: { type: "string" },
                    },
                    required: ["amount", "paymentDate", "paymentMethod"],
                },
            },
        },
        required: [
            "title",
            "partnerName",
            "contractNumber",
            "amount",
            "effectiveDate",
            "expiryDate",
            "signingDate",
            "paymentSchedules",
        ],
    },
};

const { Search } = Input;

const statusContract = {
    "Đang tạo": <Tag color="default">Đang tạo</Tag>,
    "Đang hiệu lực": <Tag color="processing">Đang hiệu lực</Tag>,
    "Đã thanh toán": <Tag color="success">Đã thanh toán</Tag>,
    "Đã hủy": <Tag color="red-inverse">Đã hủy</Tag>,
    "Chưa thanh toán": <Tag color="gold">Chưa thanh toán</Tag>,
    "Chờ phê duyệt": <Tag color="gold-inverse">Chờ phê duyệt</Tag>,
    "Đối tác ký": <Tag color="geekblue">Đối tác ký</Tag>,
    "Chưa thanh lý": <Tag color="lime">Chưa thanh lý</Tag>,
    "Đã thanh lý": <Tag color="pink">Đã thanh lý</Tag>,
    "Hết hiệu lực": <Tag color="red">Hết hiệu lực</Tag>,
};


const ContractPartner = () => {
    const { data: contracts, isLoading } = useGetAllContractPartnerQuery();
    const [searchText, setSearchText] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [formUpload] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    // Xử lý upload file
    const onChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        console.log("File list:", newFileList);
    };

    const text = `Vui lòng đọc file PDF hợp đồng tôi vừa upload và trích xuất các thông tin chính sau đây. Đối với mỗi trường, nếu không tìm thấy giá trị trong tài liệu, hãy trả về chữ null thay vì các giá trị mặc định như "unknown" hoặc các mảng mặc định.

Trích xuất các trường sau:

title: tiêu đề hợp đồng (string)

partnerName: tên đối tác (string) là tên bên A

contractNumber: số hợp đồng (string)

signingDate: một mảng biểu diễn ngày ký hợp đồng theo định dạng [năm, tháng, ngày, giờ, phút, giây]. Nếu không có giá trị của giờ, phút hoặc giây, hãy trả về null cho toàn bộ trường thay vì mảng mặc định.

amount: giá trị hợp đồng (number)

effectiveDate: một mảng biểu diễn ngày có hiệu lực của hợp đồng theo định dạng [năm, tháng, ngày, giờ, phút, giây] (default hour, minute, second to 0 if missing)

expiryDate: một mảng biểu diễn ngày hết hiệu lực của hợp đồng theo định dạng [năm, tháng, ngày, giờ, phút, giây] (default hour, minute, second to 0 if missing)

signingDate: một mảng biểu diễn ngày kí của hợp đồng theo định dạng [năm, tháng, ngày, giờ, phút, giây] (default hour, minute, second to 0 if missing)

paymentSchedules: một mảng các đối tượng lịch thanh toán, mỗi đối tượng chứa:

amount: số tiền thanh toán (number)

paymentDate: một mảng biểu diễn ngày thanh toán theo định dạng [năm, tháng, ngày, giờ, phút, giây].(default hour, minute, second to 0 if missing)

paymentMethod: phương thức thanh toán (string)

Trả về dữ liệu đã trích xuất sử dụng cấu trúc JSON như sau. Chỉ trả về đối tượng JSON với key "response" chứa dữ liệu đã trích xuất:

{
"response": {
"title": "string",
"partnerName": "string",
"contractNumber": "string",
"amount": "number",
"effectiveDate": ["number", "number", "number", "number?", "number?", "number?"],
"expiryDate": ["number", "number", "number", "number?", "number?", "number?"],
"signingDate": ["number", "number", "number", "number?", "number?", "number?"],
"paymentSchedules": [
{
"amount": "number",
"paymentDate": ["number", "number", "number", "number?", "number?", "number?"],
"paymentMethod": "string",
}
]
}
}

Hãy đảm bảo rằng nếu bất kỳ trường nào không có giá trị trong file PDF, hãy trả về chữ null thay vì "unknown" . Và hãy đọc thật kỹ thông tin
chỗ ...Date nếu k có giá trị trả về cho tôi [0,0,0,0,0,0]`;

    // Hàm gọi AI trực tiếp từ FE để trích xuất thông tin từ file PDF
    const callAIForExtraction = async (file) => {
        try {
            // Tạo URL tạm thời cho file bằng URL.createObjectURL
            const fileUri = URL.createObjectURL(file);
            // Khởi tạo phiên chat với AI, chèn file vào history cùng prompt yêu cầu
            const chatSession = model.startChat({
                generationConfig,
                history: [],
            });
            const response = await chatSession.sendMessage(text, { file: fileUri });
            const aiResponseText =
                response.response.candidates[0]?.content?.parts[0]?.text || "";
            const aiResponse =
                typeof aiResponseText === "string" ? JSON.parse(aiResponseText) : aiResponseText;
            return aiResponse;
        } catch (error) {
            console.error("Lỗi gọi AI:", error);
            throw error;
        }
    };

    // Hàm submit form: gọi AI để trích xuất dữ liệu, gán vào form, và gọi API tạo hợp đồng
    const handleSubmit = async () => {
        if (fileList.length === 0) {
            message.error("Vui lòng chọn file PDF");
            return;
        }
        const file = fileList[0].originFileObj;
        try {
            // Bước 1: Gọi AI để trích xuất thông tin từ file PDF
            const extractedData = await callAIForExtraction(file);
            console.log("Extracted data:", extractedData);
            // Bước 2: Gán dữ liệu trả về vào form
            form.setFieldsValue({
                field1: extractedData.partnerName,
                field2: extractedData.contractNumber,
                field3: extractedData.amount,
                field4: extractedData.effectiveDate
                    ? dayjs(new Date(...extractedData.effectiveDate))
                    : null,
                field5: extractedData.expiryDate
                    ? dayjs(new Date(...extractedData.expiryDate))
                    : null,
                field6: extractedData.signingDate
                    ? dayjs(new Date(...extractedData.signingDate))
                    : null,

                contractName: extractedData.title,
            });
            message.success("Đã trích xuất thông tin hợp đồng thành công!");
            // Bước 3: Gọi API CreateContract với dữ liệu đã trích xuất
            //   await axios.post("/api/create-contract", extractedData, {
            //     headers: { "Content-Type": "application/json" },
            //   });
            message.success("Hợp đồng đã được tạo thành công!");
        } catch (error) {
            console.error(error);
            message.error("Lỗi khi xử lý file hoặc tạo hợp đồng.");
        }
        //  finally {
        //     // Reset lại modal và form
        //     setIsModalVisible(false);
        //     form.resetFields();
        //     setFileList([]);
        // }
    };


    const columns = [
        {
            title: "Mã hợp đồng",
            dataIndex: "contract_code",
            key: "contract_code",
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            sorter: (a, b) => new Date(b.created_at) - new Date(a.created_at),
            render: (text) => new Date(text).toLocaleDateString("vi-VN"),
            defaultSortOrder: 'ascend',
        },
        {
            title: "Tải file",
            dataIndex: "file_name",
            key: "file_name",
            render: (text, record) => (
                <div className="flex flex-col items-center gap-3">
                    <p>{text}</p>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();

                            let downloadUrl = record.file_url;

                            // Kiểm tra nếu URL chứa "docs.google.com"
                            if (downloadUrl.includes("docs.google.com")) {
                                const fileIdMatch = downloadUrl.match(/\/d\/([^/]+)/);
                                if (fileIdMatch && fileIdMatch[1]) {
                                    const fileId = fileIdMatch[1];
                                    // Chuyển đổi URL xem sang URL tải về PDF (bạn có thể thay đổi định dạng nếu cần)
                                    downloadUrl = `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
                                }
                            }
                            // Tạo thẻ <a> ẩn để tải file
                            const link = document.createElement("a");
                            link.href = downloadUrl;
                            link.download = record.file_name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        Tải file
                    </Button>
                </div>
            ),
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "contract_name",
            key: "contract_name",
            sorter: (a, b) => a.contract_name.localeCompare(b.contract_name),
        },
        {
            title: "Đối tác",
            dataIndex: "partner",
            key: "partner",
            sorter: (a, b) => a.partner.localeCompare(b.partner),
        },
        {
            title: "Loại hợp đồng",
            dataIndex: "contract_type",
            key: "contract_type",
            render: (type) => <Tag color="blue">{type.replace(/^Hợp đồng\s*/, "")}</Tag>,
            filters: [...new Set(contracts?.map(contract => contract.contract_type))].map(type => ({
                text: type.replace(/^Hợp đồng\s*/, ""),
                value: type.replace(/^Hợp đồng\s*/, "")
            })),
            onFilter: (value, record) => record.contract_type.replace(/^Hợp đồng\s*/, "") === value,
        },

        {
            title: "Giá trị",
            dataIndex: "value",
            key: "value",
            render: (value) => value.toLocaleString("vi-VN") + " VND",
            sorter: (a, b) => a.value - b.value,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            filters: Object.keys(statusContract).map(status => ({
                text: status,
                value: status,
            })),
            onFilter: (value, record) => record.status === value,
            render: (type) => statusContract[type],
        },

    ];

    return (
        <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    QUẢN LÝ HỢP ĐỒNG ĐỐI TÁC
                </p>
                <div className="flex flex-row gap-4">
                    <Space style={{ marginBottom: 16 }}>
                        <Search
                            placeholder="Nhập tên hợp đồng, tên partner hoặc tên người tạo"
                            allowClear
                            onSearch={setSearchText}
                            style={{ width: "100%", minWidth: 500, maxWidth: 1200, marginBottom: 20 }}
                            enterButton="Tìm kiếm"
                            disabled={isLoading}
                        />
                    </Space>
                    <div className="flex-1 flex justify-end">
                        <Button
                            type="primary"
                            icon={<EditFilled />}
                            style={{ marginBottom: 16 }}
                            onClick={() => setIsModalVisible(true)}
                        >
                            Tạo hợp đồng
                        </Button>
                    </div>
                </div>
                <Table
                    columns={columns}
                    dataSource={contracts?.filter(item =>
                        item.contract_name.toLowerCase().includes(searchText?.toLowerCase()) ||
                        item.partner.toLowerCase().includes(searchText?.toLowerCase()) ||
                        item.contract_code.toLowerCase().includes(searchText?.toLowerCase())
                    )}
                    rowKey="id"
                    loading={isLoading}
                    onRow={(record) => ({ onClick: () => setSelectedContract(record) })}
                />
                <Modal
                    title="Tạo hợp đồng"
                    open={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    footer={null}
                >
                    <Form form={formUpload} layout="vertical">
                        <Form.Item >
                            <Upload
                                onChange={onChange}
                                fileList={fileList}
                                accept="application/pdf"
                                listType="text"
                            >
                                <Button icon={<UploadOutlined />}>Chọn file PDF</Button>
                            </Upload>
                        </Form.Item>
                    </Form>
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Tên đối tác"
                                    name="field1"

                                // initialValue={aiResponse?.field1}
                                >
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item
                                    label="Mã hợp đồng"
                                    name="field2"
                                // initialValue={aiResponse?.field2}
                                >
                                    <Input disabled />
                                </Form.Item>
                                <Form.Item
                                    label="Tổng giá trị"
                                    name="field3"
                                // initialValue={aiResponse?.field3}
                                >
                                    <Input disabled />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Ngày có hiệu lực"
                                    name="field4"
                                // initialValue={aiResponse?.field4}
                                >
                                    <DatePicker disabled className="w-[100%]" />
                                </Form.Item>
                                <Form.Item
                                    label="Ngày hết hiệu lực"
                                    name="field5"
                                // initialValue={aiResponse?.field5}
                                >
                                    <DatePicker disabled className="w-[100%]" />
                                </Form.Item>
                                <Form.Item
                                    label="Ngày ký"
                                    name="field6"
                                // initialValue={aiResponse?.field6}
                                >
                                    <DatePicker disabled className="w-[100%]" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            label="Tên hợp đồng"
                            name="contractName"
                        // initialValue={aiResponse?.contractName}
                        >
                            <Input disabled />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Tạo hợp đồng
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>

        </div>
    );
};

export default ContractPartner;
