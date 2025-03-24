import React, { useState } from "react";
import {
    Table, Input, Space, Button, Modal, Tag, Form, Upload, Row, Col, DatePicker,
    message,
    Tooltip
} from "antd";
import {
    EditFilled, DownloadOutlined, UploadOutlined,
    LoadingOutlined,
    StopOutlined,
    DeleteFilled
} from "@ant-design/icons";
import { useCreateContractPartnerMutation, useDeleteContractPartnerMutation, useGetAllContractPartnerQuery, useGetContractPartnerQueryQuery, useUpdateContractPartnerMutation } from "../../services/ContractAPI";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useUploadFilePDFMutation } from "../../services/uploadAPI";
import dayjs from "dayjs";

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
    const { data: contracts, isLoading, refetch } = useGetContractPartnerQueryQuery();
    const [uploadFilePDF, { isLoading: uploadLoading }] = useUploadFilePDFMutation();
    const [createContractPartner] = useCreateContractPartnerMutation();
    const [updateContractPartner] = useUpdateContractPartnerMutation();
    const [deleteContractPartner] = useDeleteContractPartnerMutation();
    const [searchText, setSearchText] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [formUpload] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [Loading, setLoading] = useState(false);
    // const [extractedData, setExtractedData] = useState(null);
    const [url, setUrl] = useState(null);

    console.log("contracts data:", contracts);
    // Xử lý upload file
    const onChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        console.log("File list:", newFileList);
    };

    const closeModel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setFileList([]);
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
    const handleSubmit = async (values) => {
        if (fileList.length === 0) {
            message.error("Vui lòng chọn file PDF");
            return;
        }
        try {
            let values = form.getFieldsValue();
            values.fileUrl = url;
            values.effectiveDate = values.effectiveDate
                ? [values.effectiveDate.year(), values.effectiveDate.month() + 1, values.effectiveDate.date(), 0, 0, 0]
                : [0, 0, 0, 0, 0, 0];
            values.expiryDate = values.expiryDate
                ? [values.expiryDate.year(), values.expiryDate.month() + 1, values.expiryDate.date(), 0, 0, 0]
                : [0, 0, 0, 0, 0, 0];
            values.signingDate = values.signingDate
                ? [values.signingDate.year(), values.signingDate.month() + 1, values.signingDate.date(), 0, 0, 0]
                : [0, 0, 0, 0, 0, 0];

            console.log("Transformed form values:", values);

            await createContractPartner(values).unwrap();
            message.success("Hợp đồng đã được tạo thành công!");
        } catch (error) {
            console.error(error);
            message.error("Lỗi khi xử lý file hoặc tạo hợp đồng.");
        }
        finally {
            refetch();
            setIsModalVisible(false);
            form.resetFields();
            setFileList([]);
        }
    };

    const isDateEmpty = (dateArray) =>
        Array.isArray(dateArray) &&
        dateArray.length === 6 &&
        dateArray.every((val) => val === 0);


    const fillFormWithExtractedData = (extractedData) => {
        form.setFieldsValue({
            title: extractedData.title,
            partnerName: extractedData.partnerName,
            contractNumber: extractedData.contractNumber,
            amount: extractedData.amount,
            effectiveDate:
                extractedData.effectiveDate && !isDateEmpty(extractedData.effectiveDate)
                    ? dayjs(new Date(...extractedData.effectiveDate))
                    : null,
            expiryDate:
                extractedData.expiryDate && !isDateEmpty(extractedData.expiryDate)
                    ? dayjs(new Date(...extractedData.expiryDate))
                    : null,
            signingDate:
                extractedData.signingDate && !isDateEmpty(extractedData.signingDate)
                    ? dayjs(new Date(...extractedData.signingDate))
                    : null,
        });
    };

    const handleDelete = async (userId) => {
        Modal.confirm({
            title: 'Bạn có chắc muốn xóa hợp đồng này không?',
            onOk: async () => {
                try {
                    const result = await deleteContractPartner({ contractPartnerId: userId });
                    console.log(result);
                    refetch();
                    message.success(result?.data?.message);
                }
                catch (error) {
                    console.error("Error during delete:", error);
                    message.error('Cấm thất bại, vui lòng thử lại!');
                }
            },
            okText: "Cấm",
            cancelText: "Hủy"

        });
    };

    const columns = [
        {
            title: "Mã hợp đồng",
            dataIndex: "contractNumber",
            key: "contractNumber",
        },
        {
            title: "Ngày ký",
            dataIndex: "signingDate",
            key: "signingDate",
            sorter: (a, b) => new Date(b.signingDate) - new Date(a.signingDate),
            render: (text) => {
                if (Array.isArray(text) && text.length >= 3) {
                    return dayjs(new Date(text[0], text[1] - 1, text[2])).format('DD/MM/YYYY');
                }
                return 'Không có dữ liệu';
            },
            defaultSortOrder: 'ascend',
        },
        {
            title: "Tải file",
            dataIndex: "fileUrl",
            key: "fileUrl",
            render: (text, record) => (
                <div className="flex flex-col items-center gap-3">
                    {/* <p>{text}</p> */}
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement("a");
                            link.href = record.fileUrl;
                            // Nếu có tên file, bạn có thể set thuộc tính download
                            link.download = record.fileUrl.split("/").pop();
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
            dataIndex: "title",
            key: "title",
            sorter: (a, b) => a.title.localeCompare(b.title),
        },
        {
            title: "Đối tác",
            dataIndex: "partnerName",
            key: "partnerName",
            sorter: (a, b) => a.partnerName.localeCompare(b.partnerName),
        },
        {
            title: "Ngày có hiệu lực",
            dataIndex: "effectiveDate",
            key: "effectiveDate",
            sorter: (a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate),
            render: (text) => {
                if (Array.isArray(text) && text.length >= 3) {
                    return dayjs(new Date(text[0], text[1] - 1, text[2])).format('DD/MM/YYYY');
                }
                return 'Không có dữ liệu';
            },
            defaultSortOrder: 'ascend',
        },
        {
            title: "Ngày hết hiệu lực",
            dataIndex: "expiryDate",
            key: "expiryDate",
            sorter: (a, b) => new Date(b.expiryDate) - new Date(a.expiryDate),
            render: (text) => {
                if (Array.isArray(text) && text.length >= 3) {
                    return dayjs(new Date(text[0], text[1] - 1, text[2])).format('DD/MM/YYYY');
                }
                return 'Không có dữ liệu';
            },
            defaultSortOrder: 'ascend',
        },
        {
            title: "Giá trị",
            dataIndex: "amount",
            key: "amount",
            render: (amount) => amount.toLocaleString("vi-VN") + " VND",
            sorter: (a, b) => a.amount - b.amount,
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space className="flex justify-center">
                    <Tooltip title="Cập nhật">
                        <Button
                            icon={<EditFilled style={{ color: '#2196f3' }} />}
                        // onClick={() => showEditModal(record)}
                        />
                    </Tooltip>

                    <Tooltip title="Xóa">
                        <Button
                            icon={<DeleteFilled style={{ color: "#2196f3" }} />}
                            onClick={() => handleDelete(record.id)}
                        />
                    </Tooltip>


                </Space>
            ),
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
                    dataSource={contracts?.data?.filter(item =>
                        item.title.toLowerCase().includes(searchText?.toLowerCase()) ||
                        item.partnerName.toLowerCase().includes(searchText?.toLowerCase()) ||
                        item.contractNumber.toLowerCase().includes(searchText?.toLowerCase())
                    )}
                    rowKey="id"
                    loading={isLoading}
                />
                <Modal
                    title="Tạo hợp đồng"
                    open={isModalVisible}
                    onCancel={closeModel}
                    footer={null}
                >
                    <Form form={formUpload} layout="vertical">
                        <Form.Item >
                            <Upload
                                beforeUpload={async (file) => {
                                    setLoading(true);
                                    try {
                                        const extractedData = await callAIForExtraction(file);
                                        console.log("Extracted data:", extractedData);
                                        // setExtractedData(extractedData);

                                        fillFormWithExtractedData(extractedData);

                                        const formData = new FormData();
                                        formData.append("file", file);
                                        const url = await uploadFilePDF({ formData }).unwrap();
                                        setUrl(url);
                                        console.log("Uploaded file URL:", url);



                                        console.log("Form values:", form.getFieldsValue());
                                    } catch (error) {
                                        console.error("Lỗi khi xử lý file:", error);
                                    } finally {
                                        setLoading(false);
                                    }
                                    return false;
                                }}
                                onChange={onChange}
                                fileList={fileList}
                                accept="application/pdf"
                                listType="text"
                                maxCount={1}
                            >
                                <Button icon={Loading ? <LoadingOutlined /> : <UploadOutlined />}>
                                    {Loading ? "AI đang xử lý..." : "Chọn file PDF"}
                                </Button>
                            </Upload>
                        </Form.Item>
                    </Form>
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item label="Tên đối tác" name="partnerName">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Mã hợp đồng" name="contractNumber">
                                    <Input />
                                </Form.Item>
                                <Form.Item label="Tổng giá trị" name="amount">
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item label="Ngày có hiệu lực" name="effectiveDate">
                                    <DatePicker className="w-[100%]" />
                                </Form.Item>
                                <Form.Item label="Ngày hết hiệu lực" name="expiryDate">
                                    <DatePicker className="w-[100%]" />
                                </Form.Item>
                                <Form.Item label="Ngày ký" name="signingDate">
                                    <DatePicker className="w-[100%]" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label="Tên hợp đồng" name="title">
                            <Input />
                        </Form.Item>
                        <Form.Item>
                            <Button disabled={Loading} type="primary" htmlType="submit">
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
