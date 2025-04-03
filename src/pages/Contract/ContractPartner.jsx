import React, { useState } from "react";
import {
    Table,
    Input,
    Space,
    Button,
    Modal,
    Tag,
    Form,
    Upload,
    Row,
    Col,
    DatePicker,
    message,
    Tooltip,
    Empty,
    Descriptions,
    Timeline
} from "antd";
import {
    EditFilled,
    DownloadOutlined,
    UploadOutlined,
    LoadingOutlined,
    DeleteFilled,
    PlusCircleFilled
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    useCreateContractPartnerMutation,
    useDeleteContractPartnerMutation,
    useGetContractPartnerQueryQuery,
    useUpdateContractPartnerMutation,
} from "../../services/ContractAPI";
import { useUploadFilePDFMutation, useUploadBillingContractMutation } from "../../services/uploadAPI";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Lấy API key từ biến môi trường
const apiKey = import.meta.env.VITE_AI_KEY_UPLOAD;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-pro-exp-02-05",
});

// Cấu hình generationConfig theo schema mới
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
            totalValue: { type: "number" },
            effectiveDate: { type: "array", items: { type: "integer" } },
            expiryDate: { type: "array", items: { type: "integer" } },
            signingDate: { type: "array", items: { type: "integer" } },
            items: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        description: { type: "string" },
                        amount: { type: "number" }
                    },
                    required: ["description", "amount"]
                }
            },
            paymentSchedules: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        paymentOrder: { type: "number" },
                        paymentPercentage: { type: "number" },
                        paymentDate: { type: "array", items: { type: "integer" } },
                        paymentMethod: { type: "string" },
                        amount: { type: "number" }
                    },
                    required: [
                        "paymentOrder",
                        "paymentPercentage",
                        "paymentDate",
                        "paymentMethod",
                        "amount"
                    ]
                }
            }
        },
        required: [
            "title",
            "partnerName",
            "contractNumber",
            "totalValue",
            "effectiveDate",
            "expiryDate",
            "signingDate",
            "items",
            "paymentSchedules"
        ]
    }
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
    "Hết hiệu lực": <Tag color="red">Hết hiệu lực</Tag>
};

const ContractPartner = () => {
    const [uploadFilePDF, { isLoading: uploadLoading }] = useUploadFilePDFMutation();
    const [createContractPartner] = useCreateContractPartnerMutation();
    const [updateContractPartner] = useUpdateContractPartnerMutation();
    const [deleteContractPartner] = useDeleteContractPartnerMutation();
    const [uploadBill, { isLoading: LoadingBill }] = useUploadBillingContractMutation();
    const [searchText, setSearchText] = useState("");
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalUpdate, setIsModalUpdate] = useState(false);
    const [form] = Form.useForm();
    const [formUpload] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [Loading, setLoading] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [url, setUrl] = useState(null);
    const { data: contracts, isLoading, refetch } = useGetContractPartnerQueryQuery({
        search: searchText,
        page: page - 1,
        size
    });

    const onChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
        console.log("File list:", newFileList);
    };

    const onSearch = (value) => {
        setSearchText(value);
        setPage(1);
    };

    const handleTableChange = (pagination) => {
        setPage(pagination.current);
        setSize(pagination.pageSize);
    };

    const closeModel = () => {
        setIsModalVisible(false);
        form.resetFields();
        setFileList([]);
    };

    const text = `Vui lòng đọc file PDF hợp đồng mà tôi vừa upload và trích xuất các thông tin chính sau đây. Đối với mỗi trường, nếu không tìm thấy giá trị trong tài liệu, hãy trả về giá trị null đối với các trường kiểu chuỗi hoặc số. Tuy nhiên, với các trường ngày (các trường ...Date), nếu không có giá trị, hãy trả về mảng [0, 0, 0, 0, 0, 0] thay vì mảng mặc định hoặc null.

Trích xuất các trường sau:

title: tiêu đề hợp đồng (string)
partnerName: tên đối tác (string) – là tên bên A
contractNumber: số hợp đồng (string)
totalValue: giá trị hợp đồng (number)
effectiveDate: mảng biểu diễn ngày có hiệu lực của hợp đồng theo định dạng [năm, tháng, ngày, giờ, phút, giây]. Nếu không có giá trị của giờ, phút hoặc giây, trả về [0, 0, 0, 0, 0, 0].
expiryDate: mảng biểu diễn ngày hết hiệu lực của hợp đồng theo định dạng [năm, tháng, ngày, giờ, phút, giây]. Nếu không có giá trị, trả về [0, 0, 0, 0, 0, 0].
signingDate: mảng biểu diễn ngày ký hợp đồng theo định dạng [năm, tháng, ngày, giờ, phút, giây]. Nếu không có giá trị, trả về [0, 0, 0, 0, 0, 0].
items: một mảng các hạng mục của hợp đồng, mỗi hạng mục chứa:
  - description: nội dung hạng mục (string)
  - amount: số tiền của hạng mục (number)
paymentSchedules: một mảng các đối tượng lịch thanh toán, mỗi đối tượng chứa:
  - paymentOrder: số thứ tự của đợt thanh toán (number)
  - paymentPercentage: phần trăm thanh toán của đợt đó (number)
  - paymentDate: mảng biểu diễn ngày thanh toán theo định dạng [năm, tháng, ngày, giờ, phút, giây]. Nếu không có giá trị, trả về [0, 0, 0, 0, 0, 0].
  - paymentMethod: phương thức thanh toán (string)
  - amount: được tính bằng cách lấy totalValue nhân với paymentPercentage (number)


đảm bảo rằng tất cả paymentPercentage các đợt cộng lại bằng 100% và paymentOrder các đợt được sắp xếp theo thứ tự tăng dần và tổng amount của tất cả các đợt cộng lại bằng totalValue
amount của các hạng mục trong items cộng lại bằng totalValue

Trả về dữ liệu đã trích xuất sử dụng cấu trúc JSON như sau (chỉ trả về đối tượng JSON với key "response"):

{
  "response": {
    "title": "string",
    "partnerName": "string",
    "contractNumber": "string",
    "totalValue": "number",
    "effectiveDate": [ "number", "number", "number", "number", "number", "number" ],
    "expiryDate": [ "number", "number", "number", "number", "number", "number" ],
    "signingDate": [ "number", "number", "number", "number", "number", "number" ],
    "items": [
      {
        "description": "string",
        "amount": "number"
      }
      // ... Add more items if the contract has more items
    ],
    "paymentSchedules": [
      {
        "paymentOrder": "number",
        "paymentPercentage": "number",
        "paymentDate": [ "number", "number", "number", "number", "number", "number" ],
        "paymentMethod": "string",
        "amount": "number"
      }
      // ... Add more payment schedules if the contract has more payment schedules
    ]
  }
}

Hãy đảm bảo rằng nếu bất kỳ trường nào không có giá trị trong file PDF, bạn trả về null (đối với kiểu chuỗi hoặc số) và với các trường ngày nếu không có giá trị, trả về [0, 0, 0, 0, 0, 0].`;

    // Hàm gọi AI để trích xuất thông tin từ file PDF
    const callAIForExtraction = async (file) => {
        try {
            const fileUri = URL.createObjectURL(file);
            const chatSession = model.startChat({
                generationConfig,
                history: []
            });
            const response = await chatSession.sendMessage(text, { file: fileUri });
            const aiResponseText =
                response.response.candidates[0]?.content?.parts[0]?.text || "";
            const aiResponse =
                typeof aiResponseText === "string"
                    ? JSON.parse(aiResponseText)
                    : aiResponseText;
            return aiResponse;
        } catch (error) {
            console.error("Lỗi gọi AI:", error);
            throw error;
        }
    };

    // Hàm submit tạo hợp đồng
    const handleSubmit = async () => {
        try {
            let values = form.getFieldsValue();
            values.fileUrl = url;
            values.effectiveDate = values.effectiveDate
                ? [
                    values.effectiveDate.year(),
                    values.effectiveDate.month() + 1,
                    values.effectiveDate.date(),
                    0,
                    0,
                    0
                ]
                : [0, 0, 0, 0, 0, 0];
            values.expiryDate = values.expiryDate
                ? [
                    values.expiryDate.year(),
                    values.expiryDate.month() + 1,
                    values.expiryDate.date(),
                    0,
                    0,
                    0
                ]
                : [0, 0, 0, 0, 0, 0];
            values.signingDate = values.signingDate
                ? [
                    values.signingDate.year(),
                    values.signingDate.month() + 1,
                    values.signingDate.date(),
                    0,
                    0,
                    0
                ]
                : [0, 0, 0, 0, 0, 0];

            // Lưu ý: Đảm bảo rằng tên trường của tổng giá trị hợp đồng là "totalValue"
            const total = Number(values.totalValue) || 0;
            if (values.paymentSchedules && Array.isArray(values.paymentSchedules)) {
                values.paymentSchedules = values.paymentSchedules.map((schedule) => ({
                    ...schedule,
                    amountItem: total * (Number(schedule.paymentPercentage) || 0) / 100,
                    paymentDate: schedule.paymentDate
                        ? [
                            schedule.paymentDate.year(),
                            schedule.paymentDate.month() + 1,
                            schedule.paymentDate.date(),
                            0,
                            0,
                            0
                        ]
                        : [0, 0, 0, 0, 0, 0]
                }));
            }
            console.log("Transformed form values:", values);
            await createContractPartner(values).unwrap();
            message.success("Hợp đồng đã được tạo thành công!");
        } catch (error) {
            console.error(error);
            message.error("Lỗi khi xử lý file hoặc tạo hợp đồng.");
        } finally {
            refetch();
            setIsModalVisible(false);
            form.resetFields();
            setFileList([]);
        }
    };


    // Hàm kiểm tra mảng ngày rỗng ([0,0,0,0,0,0])
    const isDateEmpty = (dateArray) =>
        Array.isArray(dateArray) &&
        dateArray.length === 6 &&
        dateArray.every((val) => val === 0);

    // Hàm điền dữ liệu trích xuất vào form
    const fillFormWithExtractedData = (extractedData) => {
        console.log("Extracted data:", extractedData);
        const paymentSchedulesConverted = extractedData.paymentSchedules
            ? extractedData.paymentSchedules.map((schedule) => ({
                ...schedule,
                paymentDate:
                    schedule.paymentDate && !isDateEmpty(schedule.paymentDate)
                        ? dayjs(new Date(...schedule.paymentDate))
                        : null
            }))
            : [];
        form.setFieldsValue({
            title: extractedData.title,
            partnerName: extractedData.partnerName,
            contractNumber: extractedData.contractNumber,
            totalValue: extractedData.totalValue,
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
            items: extractedData.items || [],
            paymentSchedules: paymentSchedulesConverted
        });
        console.log("Form data:", form.getFieldsValue());
    };

    // Hàm xóa hợp đồng
    const handleDelete = async (userId) => {
        Modal.confirm({
            title: "Bạn có chắc muốn xóa hợp đồng này không?",
            onOk: async () => {
                try {
                    const result = await deleteContractPartner({ contractPartnerId: userId });
                    console.log(result);
                    refetch();
                    message.success(result?.data?.message);
                } catch (error) {
                    console.error("Error during delete:", error);
                    message.error("Xóa thất bại, vui lòng thử lại!");
                }
            },
            okText: "Xóa",
            cancelText: "Hủy"
        });
    };

    // Hàm mở modal cập nhật, chuyển đổi các giá trị ngày sang dayjs
    const showEditModal = (record) => {
        console.log("Record:", record);
        setIsModalUpdate(true);
        form.resetFields();
        form.setFieldsValue({
            contractPartnerId: record.contractPartnerId,
            fileUrl: record.fileUrl,
            partnerName: record.partnerName,
            contractNumber: record.contractNumber,
            totalValue: record.totalValue,
            effectiveDate: record.effectiveDate
                ? dayjs(new Date(...record.effectiveDate))
                : null,
            expiryDate: record.expiryDate
                ? dayjs(new Date(...record.expiryDate))
                : null,
            signingDate: record.signingDate
                ? dayjs(new Date(...record.signingDate))
                : null,
            title: record.title,
            items: record.items || [],
            paymentSchedules: record.paymentSchedules
                ? record.paymentSchedules.map((schedule) => ({
                    ...schedule,
                    paymentDate:
                        schedule.paymentDate && !isDateEmpty(schedule.paymentDate)
                            ? dayjs(new Date(...schedule.paymentDate))
                            : null
                }))
                : []
        });
        console.log("Form set with record:", form.getFieldsValue());
    };

    // Hàm submit cập nhật hợp đồng
    const handleSubmitEditContractPartner = async () => {
        try {
            let values = form.getFieldsValue();
            console.log("Form values:", values);

            // Tính toán total từ values.totalValue (đảm bảo tên trường chính xác)
            const total = Number(values.totalValue) || 0;

            const transformedValues = {
                ...values,
                fileUrl: values.fileUrl,
                effectiveDate: values.effectiveDate
                    ? [
                        values.effectiveDate.year(),
                        values.effectiveDate.month() + 1,
                        values.effectiveDate.date(),
                        0,
                        0,
                        0
                    ]
                    : [0, 0, 0, 0, 0, 0],
                expiryDate: values.expiryDate
                    ? [
                        values.expiryDate.year(),
                        values.expiryDate.month() + 1,
                        values.expiryDate.date(),
                        0,
                        0,
                        0
                    ]
                    : [0, 0, 0, 0, 0, 0],
                signingDate: values.signingDate
                    ? [
                        values.signingDate.year(),
                        values.signingDate.month() + 1,
                        values.signingDate.date(),
                        0,
                        0,
                        0
                    ]
                    : [0, 0, 0, 0, 0, 0],
                paymentSchedules: values.paymentSchedules
                    ? values.paymentSchedules.map((schedule) => ({
                        ...schedule,
                        // Ép kiểu paymentPercentage về số nếu cần
                        amount: total * (Number(schedule.paymentPercentage) || 0) / 100,
                        paymentDate: schedule.paymentDate
                            ? [
                                schedule.paymentDate.year(),
                                schedule.paymentDate.month() + 1,
                                schedule.paymentDate.date(),
                                0,
                                0,
                                0
                            ]
                            : [0, 0, 0, 0, 0, 0]
                    }))
                    : []
            };

            const { contractPartnerId, ...body } = transformedValues;
            console.log("Transformed values:", body);
            await updateContractPartner({ contractPartnerId, body }).unwrap();
            message.success("Cập nhật hợp đồng thành công!");
            setIsModalUpdate(false);
            form.resetFields();
            refetch();
        } catch (error) {
            console.error("Lỗi cập nhật hợp đồng:", error);
            message.error("Có lỗi xảy ra khi cập nhật hợp đồng!");
        }
    };


    // Định nghĩa các cột của Table
    const columns = [
        {
            title: "Mã hợp đồng",
            dataIndex: "contractNumber",
            key: "contractNumber"
        },
        {
            title: "Ngày ký",
            dataIndex: "signingDate",
            key: "signingDate",
            sorter: (a, b) => new Date(b.signingDate) - new Date(a.signingDate),
            render: (text) => {
                if (Array.isArray(text) && text.length >= 3) {
                    return dayjs(new Date(text[0], text[1] - 1, text[2])).format("DD/MM/YYYY");
                }
                return "Không có dữ liệu";
            },
            defaultSortOrder: "ascend"
        },
        {
            title: "Tải file",
            dataIndex: "fileUrl",
            key: "fileUrl",
            render: (text, record) => (
                <div className="flex flex-col items-center gap-3">
                    <Button
                        type="primary"
                        className="px-2"
                        icon={<DownloadOutlined style={{ fontSize: "20px" }} />}
                        onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement("a");
                            link.href = record.fileUrl;
                            link.download = record.fileUrl.split("/").pop();
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        Tải file
                    </Button>
                </div>
            )
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "title",
            key: "title",
            sorter: (a, b) => a.title.localeCompare(b.title)
        },
        {
            title: "Đối tác",
            dataIndex: "partnerName",
            key: "partnerName",
            sorter: (a, b) => a.partnerName.localeCompare(b.partnerName)
        },
        {
            title: "Ngày có hiệu lực",
            dataIndex: "effectiveDate",
            key: "effectiveDate",
            sorter: (a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate),
            render: (text) => {
                if (Array.isArray(text) && text.length >= 3) {
                    return dayjs(new Date(text[0], text[1] - 1, text[2])).format("DD/MM/YYYY");
                }
                return "Không có dữ liệu";
            },
            defaultSortOrder: "ascend"
        },
        {
            title: "Ngày hết hiệu lực",
            dataIndex: "expiryDate",
            key: "expiryDate",
            sorter: (a, b) => new Date(b.expiryDate) - new Date(a.expiryDate),
            render: (text) => {
                if (Array.isArray(text) && text.length >= 3) {
                    return dayjs(new Date(text[0], text[1] - 1, text[2])).format("DD/MM/YYYY");
                }
                return "Không có dữ liệu";
            },
            defaultSortOrder: "ascend"
        },
        {
            title: "Giá trị",
            dataIndex: "totalValue",
            key: "totalValue",
            render: (value) => value?.toLocaleString("vi-VN") + " VND",
            sorter: (a, b) => a.totalValue - b.totalValue
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space className="flex justify-center">
                    <Tooltip title="Cập nhật">
                        <Button
                            icon={<EditFilled style={{ color: "#2196f3" }} />}
                            onClick={() => showEditModal(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa">
                        <Button
                            icon={<DeleteFilled style={{ color: "#2196f3" }} />}
                            onClick={() => handleDelete(record.contractPartnerId)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    const uploadFile = async (file, paymentScheduleId) => {
        console.log("File:", file);
        console.log("Payment Schedule ID:", paymentScheduleId);
        try {
            const formData = new FormData();
            formData.append("file", file);
            // Gọi API upload file, truyền paymentScheduleId và formData
            const res = await uploadBill({ paymentScheduleId, formData }).unwrap();
            const parsedRes = JSON.parse(res);
            message.success(parsedRes.message);

            refetch();
        } catch (error) {
            console.error("Lỗi upload file:", error);
            message.error("Upload thất bại!");
        }
    };



    return (
        <div className="flex flex-col md:flex-row min-h-[100vh]">
            <div className="flex-1 p-4">
                <p
                    className="font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text"
                    style={{ textShadow: "8px 8px 8px rgba(0, 0, 0, 0.2)" }}
                >
                    QUẢN LÝ HỢP ĐỒNG ĐỐI TÁC
                </p>
                <div className="flex flex-row gap-4">
                    <Space style={{ marginBottom: 16 }}>
                        <Search
                            placeholder="Nhập tên hợp đồng, tên partner hoặc tên người tạo"
                            allowClear
                            onSearch={onSearch}
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
                    dataSource={contracts?.data?.content.filter(
                        (item) =>
                            item.title.toLowerCase().includes(searchText?.toLowerCase()) ||
                            item.partnerName.toLowerCase().includes(searchText?.toLowerCase()) ||
                            item.contractNumber.toLowerCase().includes(searchText?.toLowerCase())
                    )}
                    pagination={{
                        current: page,
                        pageSize: size,
                        total: contracts?.data?.totalElements
                    }}
                    expandable={{
                        expandedRowRender: (record) => {
                            if (!record?.paymentSchedules || record.paymentSchedules.length === 0) {
                                return <Empty description="Không có lịch thanh toán" />;
                            }
                            console.log("Record:", record);
                            console.log("Payment Schedules:", record.paymentSchedules);
                            return (
                                <div className="relative p-4">
                                    <h3 className="text-xl font-semibold text-center mb-4">
                                        Các đợt thanh toán
                                    </h3>
                                    <Timeline mode="left" className="mt-8 -ml-[20%]">
                                        {record.paymentSchedules.map((schedule, index) => (
                                            <Timeline.Item
                                                key={schedule.id || index}
                                                label={
                                                    schedule.paymentDate
                                                        ? dayjs(
                                                            new Date(
                                                                schedule.paymentDate[0],
                                                                schedule.paymentDate[1] - 1,
                                                                schedule.paymentDate[2]
                                                            )
                                                        ).format("DD/MM/YYYY")
                                                        : "Không có dữ liệu"
                                                }
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <Tooltip title={`${schedule.amount.toLocaleString()} VND`}>
                                                        <span
                                                            className="font-bold text-gray-800 text-lg whitespace-nowrap overflow-hidden text-ellipsis"
                                                            style={{ maxWidth: "200px", display: "inline-block", whiteSpace: "nowrap", minWidth: "150px" }}
                                                            title={`${schedule.amount.toLocaleString()} VND`}
                                                        >
                                                            {schedule.amount.toLocaleString()} VND
                                                        </span>
                                                    </Tooltip>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                        {schedule.status === "UNPAID" ? (
                                                            <>
                                                                <Tag color="gold">Chưa thanh toán</Tag>
                                                                <Upload
                                                                    name="invoice"
                                                                    accept="image/png, image/jpeg"
                                                                    beforeUpload={(file) => {
                                                                        const isValidType =
                                                                            file.type === "image/png" ||
                                                                            file.type === "image/jpeg";
                                                                        if (!isValidType) {
                                                                            message.error(
                                                                                "Bạn chỉ có thể tải file PNG hoặc JPEG!"
                                                                            );
                                                                            return Upload.LIST_IGNORE;
                                                                        }
                                                                        uploadFile(file, schedule.id);
                                                                        return false;
                                                                    }}
                                                                    showUploadList={false}
                                                                >
                                                                    <Button icon={LoadingBill ? <LoadingOutlined /> : <UploadOutlined />}>
                                                                        {LoadingBill ? "Đang tải..." : "Tải hình ảnh"}
                                                                    </Button>
                                                                </Upload>
                                                            </>
                                                        ) : schedule.status === "PAID" ? (
                                                            <Tag color="green">Đã thanh toán</Tag>
                                                        ) : schedule.status === "OVERDUE" ? (
                                                            <Tag color="red">Quá hạn</Tag>
                                                        ) : (
                                                            schedule.status
                                                        )}
                                                    </div>
                                                </div>
                                            </Timeline.Item>
                                        ))}
                                    </Timeline>
                                </div>

                            );
                        }
                    }}
                    onChange={handleTableChange}
                    rowKey={(record) => record.contractPartnerId}
                    loading={isLoading}
                />

                {/* Modal tạo hợp đồng */}
                <Modal
                    title="Tạo hợp đồng"
                    open={isModalVisible}
                    onCancel={closeModel}
                    footer={null}
                >
                    <Form form={formUpload} layout="vertical">
                        <Form.Item>
                            <Upload
                                beforeUpload={async (file) => {
                                    setLoading(true);
                                    try {
                                        const extractedData = await callAIForExtraction(file);
                                        console.log("Extracted data:", extractedData);
                                        setExtractedData(extractedData);
                                        fillFormWithExtractedData(extractedData);
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        const url = await uploadFilePDF({ formData }).unwrap();
                                        setUrl(url);
                                        console.log("Uploaded file URL:", url);
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
                                <Form.Item
                                    label="Tên đối tác"
                                    name="partnerName"
                                    rules={[{ required: true, message: "Vui lòng nhập tên đối tác!" }]}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    label="Mã hợp đồng"
                                    name="contractNumber"
                                    rules={[{ required: true, message: "Vui lòng nhập mã hợp đồng!" }]}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    label="Tổng giá trị"
                                    name="totalValue"
                                    rules={[{ required: true, message: "Vui lòng nhập tổng giá trị!" }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Ngày có hiệu lực"
                                    name="effectiveDate"
                                    rules={[{ required: true, message: "Vui lòng chọn ngày có hiệu lực!" }]}
                                >
                                    <DatePicker className="w-[100%]" />
                                </Form.Item>
                                <Form.Item
                                    label="Ngày hết hiệu lực"
                                    name="expiryDate"
                                    rules={[{ required: true, message: "Vui lòng chọn ngày hết hiệu lực!" }]}
                                >
                                    <DatePicker className="w-[100%]" />
                                </Form.Item>
                                <Form.Item
                                    label="Ngày ký"
                                    name="signingDate"
                                    rules={[{ required: true, message: "Vui lòng chọn ngày ký!" }]}
                                >
                                    <DatePicker className="w-[100%]" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item
                            label="Tên hợp đồng"
                            name="title"
                            rules={[{ required: true, message: "Vui lòng nhập tên hợp đồng!" }]}
                        >
                            <Input />
                        </Form.Item>


                        {/* Nhập liệu cho items của hợp đồng */}
                        <Form.List name="items">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }, index) => (
                                        <div key={key} style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "16px" }}>
                                            <h4>Hạng mục {index + 1}</h4>
                                            <Form.Item
                                                {...restField}
                                                label="Giá trị hạng mục"
                                                name={[name, "amount"]}
                                                rules={[{ required: true, message: "Vui lòng nhập giá trị hạng mục!" }]}
                                            >
                                                <Input suffix=" VND" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                label="Nội dung hạng mục"
                                                name={[name, "description"]}
                                                rules={[{ required: true, message: "Vui lòng nhập nội dung hạng mục!" }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                            <Button
                                                type="dashed"
                                                onClick={() => remove(name)}
                                                icon={<DeleteFilled />}
                                                style={{ marginBottom: 8 }}
                                            >
                                                Xóa hạng mục
                                            </Button>
                                        </div>
                                    ))}
                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            block
                                            icon={<PlusCircleFilled />}
                                        >
                                            Thêm hạng mục
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>

                        {/* Nhập liệu cho paymentSchedules */}
                        <Form.List name="paymentSchedules">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }, index) => (
                                        <div key={key} style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "16px" }}>
                                            <Space align="baseline">
                                                <span>Thanh toán đợt</span>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "paymentOrder"]}
                                                    initialValue={index + 1}
                                                    noStyle
                                                    rules={[{ required: true, message: "Vui lòng nhập số đợt thanh toán!" }]}
                                                >
                                                    <Input style={{ width: 100 }} />
                                                </Form.Item>
                                            </Space>

                                            <Form.Item
                                                {...restField}
                                                label="Tỷ lệ thanh toán"
                                                name={[name, "paymentPercentage"]}
                                                rules={[{ required: true, message: "Vui lòng nhập tỷ lệ thanh toán!" }]}
                                            >
                                                <Input suffix="%" />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                label="Phương thức thanh toán"
                                                name={[name, "paymentMethod"]}
                                                rules={[{ required: true, message: "Vui lòng nhập phương thức thanh toán!" }]}
                                            >
                                                <Input />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                label="Ngày thanh toán"
                                                name={[name, "paymentDate"]}
                                                rules={[{ required: true, message: "Vui lòng chọn ngày thanh toán!" }]}
                                            >
                                                <DatePicker className="w-[100%]" />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                label="Số tiền thanh toán"
                                                name={[name, "amount"]}
                                                rules={[{ required: true, message: "Vui lòng nhập số tiền thanh toán!" }]}
                                            >
                                                <Input suffix=" VND" />
                                            </Form.Item>

                                            <Button
                                                type="dashed"
                                                onClick={() => remove(name)}
                                                icon={<DeleteFilled />}
                                                style={{ marginTop: 8 }}
                                            >
                                                Xóa đợt thanh toán
                                            </Button>
                                        </div>
                                    ))}
                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            block
                                            icon={<PlusCircleFilled />}
                                        >
                                            Thêm đợt thanh toán
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>

                        <Form.Item>
                            <Button disabled={Loading} type="primary" htmlType="submit">
                                Tạo hợp đồng
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Modal cập nhật hợp đồng */}
                <Modal
                    title="Cập nhật hợp đồng đối tác"
                    open={isModalUpdate}
                    onCancel={() => {
                        setIsModalUpdate(false);
                        form.resetFields();
                    }}
                    footer={null}
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmitEditContractPartner}>
                        <Form.Item name="contractPartnerId" style={{ display: "none" }}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="fileUrl" style={{ display: "none" }}>
                            <Input />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Tên đối tác"
                                    name="partnerName"
                                    rules={[{ required: true, message: "Vui lòng nhập tên đối tác!" }]}
                                >
                                    <Input placeholder="Nhập tên đối tác" />
                                </Form.Item>
                                <Form.Item
                                    label="Mã hợp đồng"
                                    name="contractNumber"
                                    rules={[{ required: true, message: "Vui lòng nhập mã hợp đồng!" }]}
                                >
                                    <Input placeholder="Nhập mã hợp đồng" />
                                </Form.Item>
                                <Form.Item
                                    label="Tổng giá trị"
                                    name="totalValue"
                                    rules={[{ required: true, message: "Vui lòng nhập tổng giá trị!" }]}
                                >
                                    <Input placeholder="Nhập tổng giá trị" />
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

                        <Form.Item
                            label="Tên hợp đồng"
                            name="title"
                            rules={[{ required: true, message: "Vui lòng nhập tên hợp đồng!" }]}
                        >
                            <Input placeholder="Nhập tên hợp đồng" />
                        </Form.Item>

                        {/* Nhập liệu cho items */}
                        <Form.List name="items">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }, index) => (
                                        <div key={key} style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "16px" }}>
                                            <h4>Hạng mục {index + 1}</h4>
                                            <Form.Item
                                                {...restField}
                                                label="Giá trị hạng mục"
                                                name={[name, "amount"]}
                                                rules={[{ required: true, message: "Vui lòng nhập giá trị hạng mục!" }]}
                                            >
                                                <Input suffix=" VND" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                label="Nội dung hạng mục"
                                                name={[name, "description"]}
                                                rules={[{ required: true, message: "Vui lòng nhập nội dung hạng mục!" }]}
                                            >
                                                <Input />
                                            </Form.Item>
                                            <Button
                                                type="dashed"
                                                onClick={() => remove(name)}
                                                icon={<DeleteFilled />}
                                                style={{ marginBottom: 8 }}
                                            >
                                                Xóa hạng mục
                                            </Button>
                                        </div>
                                    ))}
                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            block
                                            icon={<PlusCircleFilled />}
                                        >
                                            Thêm hạng mục
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>

                        {/* Nhập liệu cho paymentSchedules */}
                        <Form.List name="paymentSchedules">
                            {(fields, { add, remove }) => (
                                <>
                                    {fields.map(({ key, name, ...restField }, index) => (
                                        <div key={key} style={{ border: "1px solid #ccc", padding: "16px", marginBottom: "16px" }}>
                                            <Space align="baseline">
                                                <span>Thanh toán đợt</span>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "paymentOrder"]}
                                                    initialValue={index + 1}
                                                    noStyle
                                                    rules={[{ required: true, message: "Vui lòng nhập số đợt thanh toán!" }]}
                                                >
                                                    <Input style={{ width: 100 }} />
                                                </Form.Item>
                                            </Space>

                                            <Form.Item
                                                {...restField}
                                                label="Tỷ lệ thanh toán"
                                                name={[name, "paymentPercentage"]}
                                                rules={[{ required: true, message: "Vui lòng nhập tỷ lệ thanh toán!" }]}
                                            >
                                                <Input suffix="%" />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                label="Phương thức thanh toán"
                                                name={[name, "paymentMethod"]}
                                                rules={[{ required: true, message: "Vui lòng nhập phương thức thanh toán!" }]}
                                            >
                                                <Input />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                label="Ngày thanh toán"
                                                name={[name, "paymentDate"]}
                                                rules={[{ required: true, message: "Vui lòng chọn ngày thanh toán!" }]}
                                            >
                                                <DatePicker className="w-[100%]" />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                label="Số tiền thanh toán"
                                                name={[name, "amount"]}
                                                rules={[{ required: true, message: "Vui lòng nhập số tiền thanh toán!" }]}
                                            >
                                                <Input suffix=" VND" />
                                            </Form.Item>

                                            <Button
                                                type="dashed"
                                                onClick={() => remove(name)}
                                                icon={<DeleteFilled />}
                                                style={{ marginTop: 8 }}
                                            >
                                                Xóa đợt thanh toán
                                            </Button>
                                        </div>
                                    ))}
                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => add()}
                                            block
                                            icon={<PlusCircleFilled />}
                                        >
                                            Thêm đợt thanh toán
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>

                        <Form.Item>
                            <div className="flex justify-center">
                                <Button type="primary" htmlType="submit">
                                    Cập nhật
                                </Button>
                            </div>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>
        </div>
    );
};

export default ContractPartner;
