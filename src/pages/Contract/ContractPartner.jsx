import React, { useEffect, useState } from "react";
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
    Collapse,
    Image,
    Select,
    InputNumber
} from "antd";
import {
    EditFilled,
    DownloadOutlined,
    UploadOutlined,
    LoadingOutlined,
    DeleteFilled,
    PlusCircleFilled,
    InboxOutlined,
    DeleteOutlined,
    PlusOutlined,
    FilePdfOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import {
    useCreateContractPartnerMutation,
    useDeleteContractPartnerMutation,
    useGetContractPartnerQueryQuery,
    useGetImgBillQuery,
    useSetContractToPartnerMutation,
    useUpdateContractPartnerMutation,
} from "../../services/ContractAPI";
import { validationPatterns } from "../../utils/ultil";
import { useUploadFilePDFMutation, useUploadBillingContractMutation } from "../../services/uploadAPI";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useCheckExistPartnerAMutation, useCreatePartnerMutation, useGetPartnerListQuery } from "../../services/PartnerAPI";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../slices/authSlice";
import { ConsoleLogger } from "@microsoft/signalr/dist/esm/Utils";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
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
    // maxOutputTokens: 8192,
    responseMimeType: "application/json",
    responseSchema: {
        type: "object",
        properties: {
            title: { type: "string" },
            partner: {
                type: "object",
                properties: {
                    partnerName: { type: "string" },
                    spokesmanName: { type: "string" },
                    address: { type: "string" },
                    email: { type: "string" },
                    position: { type: "string" },
                    taxCode: { type: "string" },
                    phone: { type: "string" },
                    banking: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                bankName: { type: "string" },
                                backAccountNumber: { type: "string" }
                            },
                            required: ["bankName", "backAccountNumber"]
                        }
                    }
                },
                required: [
                    "partnerName",
                    "spokesmanName",
                    "address",
                    "email",
                    "position",
                    "taxCode",
                    "phone",
                    "banking"
                ]
            },
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
            "partner",
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
    const { Panel } = Collapse;
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);

    const [uploadFilePDF, { isLoading: uploadLoading }] = useUploadFilePDFMutation();
    const [createContractPartner] = useCreateContractPartnerMutation();
    const [updateContractPartner] = useUpdateContractPartnerMutation();
    const [deleteContractPartner] = useDeleteContractPartnerMutation();
    const [uploadBill, { isLoading: LoadingBill }] = useUploadBillingContractMutation();
    const [setContractToPartner, { isLoading: LoadingContractPartner }] = useSetContractToPartnerMutation();
    const [searchText, setSearchText] = useState("");
    const [page, setPage] = useState(1);
    const [size, setSize] = useState(10);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isModalPartner, setIsModalPartner] = useState(false);
    const [isModalUpdate, setIsModalUpdate] = useState(false);
    const [form] = Form.useForm();
    const [formUpload] = Form.useForm();
    const [formPartner] = Form.useForm();
    const [fileList, setFileList] = useState([]);
    const [activePanel, setActivePanel] = useState([]);

    const [paymentId, setPaymentId] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const [partnerID, setPartnerID] = useState(null);
    const [contractID, setContractID] = useState(null);
    const [Loading, setLoading] = useState(false);
    const [isLoadingCreate, setIsLoadingCreate] = useState(false);
    const [extractedData, setExtractedData] = useState(null);
    const [bankAccounts, setBankAccounts] = useState([{ bankName: '', backAccountNumber: '' }]);
    const [newCustomerData, setNewCustomerData] = useState(null);
    const [partnerName, setPartnerName] = useState(null);
    const [url, setUrl] = useState(null);
    const [taxCode, setTaxCode] = useState(null);
    const { data: contracts, isLoading, refetch } = useGetContractPartnerQueryQuery({
        search: searchText,
        page: page - 1,
        size
    });

    const user = useSelector(selectCurrentUser);

    const isStaff = user?.roles?.includes("ROLE_STAFF");
    const isCEO = user?.roles?.includes("ROLE_DIRECTOR");
    const isManager = user?.roles?.includes("ROLE_MANAGER");
    const { data: dataBill, refetch: refetchBill } = useGetImgBillQuery(paymentId, {
        skip: !paymentId,
    });


    const [CreatePartner, { isCreating }] = useCreatePartnerMutation();

    const [checkExistPartner] = useCheckExistPartnerAMutation();




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
partner: đối tượng chứa thông tin bên A, gồm:

    -partnerName: tên đối tác bên A 

    -spokesmanName: tên người đại diện bên A 

    -address: địa chỉ bên A 

    -email: email bên A

    -position: vị trí của người đại diện trong công ty bên A

    -taxCode: mã số thuế bên A

    -phone: số điện thoại bên A

    -bank: một mảng các tài khoản ngân hàng bên A :
        - bankName: tên ngân hàng bên A
        - backAccountNumber: số tài khoản ngân hàng bên A
contractNumber: mã số của hợp đồng 
totalValue:tổng giá trị hợp đồng (number)
effectiveDate: mảng biểu diễn ngày có hiệu lực của hợp đồng theo định dạng [năm, tháng, ngày, giờ, phút, giây]. Nếu không có giá trị của giờ, phút hoặc giây, trả về [0, 0, 0, 0, 0, 0].
expiryDate: mảng biểu diễn ngày hết hiệu lực của hợp đồng theo định dạng [năm, tháng, ngày, giờ, phút, giây]. Nếu không có giá trị, trả về [0, 0, 0, 0, 0, 0].
signingDate: mảng biểu diễn ngày ký hợp đồng theo định dạng [năm, tháng, ngày, giờ, phút, giây]. Nếu không có giá trị, trả về [0, 0, 0, 0, 0, 0].
items: một mảng các hạng mục thanh toán của hợp đồng, mỗi hạng mục chứa:
  - description: nội dung hạng mục 
  - amount: số tiền của hạng mục (number)
paymentSchedules: một mảng các đối tượng thanh toán, mỗi đối tượng chứa:
  - paymentOrder: số thứ tự của đợt thanh toán (number)
  - paymentDate: mảng biểu diễn ngày thanh toán theo định dạng [năm, tháng, ngày, giờ, phút, giây]. Nếu không có giá trị, trả về [0, 0, 0, 0, 0, 0].
  - paymentMethod: phương thức thanh toán (string)
  - amount: số tiền của mỗi đợt


đảm bảo rằng tổng số tiền tất cả hạng mục bằng tổng số tiền của số lần thanh toán

Trả về dữ liệu đã trích xuất sử dụng cấu trúc JSON như sau

{
  "response": {
    "title": "string",
    "partnerName": "string",
    "partner": {
        "partnerName": "string",
        "spokesmanName": "string",
        "address": "string",
        "email": "string",
        "position": "string",
        "taxCode": "string",
        "phone": "string",
        "banking": [
            {
            "bankName": "string",
            "backAccountNumber": "string"
            }
        // ... Add more bank accounts if the partner has more accounts
    ],
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
        setIsLoadingCreate(true);
        const formData = new FormData();
        fileList.forEach((file) => {
            formData.append("file", file);
        });

        const url = await uploadFilePDF({ formData }).unwrap();
        console.log("url nè", url.data)
        try {
            let values = form.getFieldsValue();
            console.log(values.effectiveDate)
            values.fileUrl = url.data;
            values.partnerName = partnerName;
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
                    amountItem: schedule.amount,
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


            const res = await createContractPartner(values).unwrap();
            console.log("Create contract response:", res);
            setContractID(res.data.partnerContractId);
            message.success("Hợp đồng đã được tạo thành công!");


        } catch (error) {
            console.error(error);
            message.error("Lỗi khi xử lý file hoặc tạo hợp đồng.");
        } finally {
            setIsLoadingCreate(false);
            refetch();
            setIsModalVisible(false);
            form.resetFields();
            setFileList([]);
            checkPartner(taxCode);
        }
    };

    useEffect(() => {
        if (isModalPartner) {
            formPartner.setFieldsValue({
                partnerName: newCustomerData.partnerName,
                spokesmanName: newCustomerData.spokesmanName,
                address: newCustomerData.address,
                email: newCustomerData.email,
                position: newCustomerData.position,
                taxCode: newCustomerData.taxCode,
                phone: newCustomerData.phone,
                banking: newCustomerData.banking,
            });

            setBankAccounts(newCustomerData.banking || []);


            // Nếu `abbreviation` chưa có, tự động tạo từ `spokesmanName`
            if (newCustomerData.spokesmanName) {
                const abbreviation = newCustomerData.spokesmanName
                    .split(' ')
                    .filter((word) => word)
                    .map((word) => word[0])
                    .join('')
                    .toUpperCase();

                // Kiểm tra nếu abbreviation chưa có giá trị trong form
                if (!newCustomerData.abbreviation) {
                    formPartner.setFieldsValue({ abbreviation });
                } else {
                    // Nếu đã có `abbreviation`, sử dụng giá trị có sẵn
                    formPartner.setFieldsValue({ abbreviation: newCustomerData.abbreviation });
                }
            }
        }
    }, [isModalPartner, formPartner, newCustomerData]);


    const checkPartner = async (taxCode) => {
        console.log("Checking partner with tax code:", taxCode);
        try {
            const response = await checkExistPartner(taxCode).unwrap();
            console.log("Check partner response:", response);
            if (response?.data === false) {
                setIsModalPartner(true);
            } else {
                setNewCustomerData(null);
            }
        } catch (error) {
            console.error("Error checking partner:", error);
            message.error("Có lỗi xảy ra khi kiểm tra đối tác!");
        }
    }

    // Hàm kiểm tra mảng ngày rỗng ([0,0,0,0,0,0])
    const isDateEmpty = (dateArray) =>
        Array.isArray(dateArray) &&
        dateArray.length === 6 &&
        dateArray.every((val) => val === 0);

    // Hàm điền dữ liệu trích xuất vào form
    const fillFormWithExtractedData = (extractedData) => {
        console.log("Extracted data:", extractedData.partner.partnerName);
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
            partner: {
                partnerName: extractedData.partner?.partnerName,
            },

            contractNumber: extractedData.contractNumber,
            totalValue: extractedData?.totalValue ? extractedData?.totalValue.toString() : "",
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
                    const result = await deleteContractPartner({ partnerContractId: userId });
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
            partnerContractId: record.partnerContractId,
            fileUrl: record.fileUrl,
            partnerName: record.partnerName,
            contractNumber: record.contractNumber,
            // totalValue: record.totalValue,
            totalValue: record?.totalValue ? record?.totalValue.toString() : "",

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

            const { partnerContractId, ...body } = transformedValues;
            console.log("Transformed values:", body);
            await updateContractPartner({ partnerContractId, body }).unwrap();
            message.success("Cập nhật hợp đồng thành công!");
            setIsModalUpdate(false);
            form.resetFields();
            refetch();
        } catch (error) {
            console.error("Lỗi cập nhật hợp đồng:", error);
            message.error("Có lỗi xảy ra khi cập nhật hợp đồng!");
        }
    };



    const handleOk = async () => {
        try {
            const values = await formPartner.validateFields();
            const bankingInfo = bankAccounts.map(acc => ({
                bankName: acc.bankName,
                backAccountNumber: acc.backAccountNumber,
            }));
            const newPartnerData = {
                ...values,
                partnerType: "PARTNER_A",
                banking: bankingInfo,
            };

            console.log("Creating partner with:", newPartnerData);
            const result = await CreatePartner(newPartnerData).unwrap();
            console.log("Create partner result:", result);

            if (result.status !== "CREATED") {
                message.error("Thêm mới thất bại, vui lòng thử lại!");
                return;
            }

            const newPartnerId = result.data.partyId;
            message.success("Thêm mới thành công!");
            setPartnerID(newPartnerId);
            setIsModalPartner(false);
            formPartner.resetFields();
            setBankAccounts([{ bankName: "", backAccountNumber: "" }]);

            if (contractID && newPartnerId) {
                try {
                    console.log("Bắt đầu gán hợp đồng", contractID, newPartnerId);
                    const assignRes = await setContractToPartner({
                        partnerContractId: contractID,
                        partnerId: newPartnerId,
                    }).unwrap();
                    console.log("Set contract to partner result:", assignRes);

                    if (assignRes.status === "OK") {
                        message.success("Gán hợp đồng thành công!");
                    } else {
                        message.error("Gán hợp đồng thất bại!");
                    }
                } catch (assignError) {
                    console.error("Lỗi khi gán hợp đồng:", assignError);
                    message.error("Không thể gán hợp đồng. Vui lòng thử lại!");
                } finally {
                    refetch();
                }
            } else {
                console.warn("Thiếu contractID hoặc partnerID, bỏ qua gán hợp đồng.");
            }

        } catch (error) {
            console.error("Error creating partner:", error);
            message.error(
                error?.data?.message || "Lỗi tạo đối tác. Vui lòng kiểm tra lại!"
            );
        }
    };

    const handleCancel = () => {
        setIsModalPartner(false);
        formPartner.resetFields();
    };

    const addBankAccount = () => {
        setBankAccounts([...bankAccounts, { bankName: '', backAccountNumber: '' }]);
    };
    const removeBankAccount = (index) => {
        if (bankAccounts.length > 1) {
            const updatedBanks = bankAccounts.filter((_, i) => i !== index);
            setBankAccounts(updatedBanks);
            formPartner.setFieldsValue({ banking: updatedBanks });
        }
    };


    const handleBankChange = (index, field, value) => {
        const newBankAccounts = bankAccounts.map((account, i) =>
            i === index ? { ...account, [field]: value } : account
        );

        setBankAccounts(newBankAccounts);
        formPartner.setFieldsValue({ banking: newBankAccounts });
    };

    const handleNameChange = (e) => {
        console.log("handleNameChange e", e);
        const value = e?.target.value;
        console.log("handleNameChange value", value);
        const abbreviation = value
            .split(' ')
            .filter((word) => word)
            .map((word) => word[0])
            .join('')
            .toUpperCase();
        formPartner.setFieldsValue({ abbreviation: abbreviation });
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
            sorter: (a, b) => {
                const dateA = new Date(a.signingDate[0], a.signingDate[1] - 1, a.signingDate[2]);
                const dateB = new Date(b.signingDate[0], b.signingDate[1] - 1, b.signingDate[2]);
                return dateB - dateA;
            },
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
            render: (_, record) => {
                let urls = [];
                try {
                    urls = JSON.parse(record.fileUrl);
                } catch {
                    urls = record.fileUrl
                        .replace(/^\[|\]$/g, '')
                        .split(/\s*,\s*/)
                        .filter(u => u);
                }


                const downloadAllAsZip = async () => {
                    const zip = new JSZip();
                    // Fetch tất cả file về dưới dạng Blob và thêm vào ZIP
                    await Promise.all(
                        urls.map(async (url) => {
                            const res = await fetch(url);
                            const blob = await res.blob();

                            const match = url.match(/fl_attachment:([^/]+)/);
                            const attachmentKey = match ? match[1] : null;

                            const ext = url.split('.').pop();

                            const filename = attachmentKey
                                ? `${attachmentKey}.${ext}`
                                : url.split('/').pop();

                            zip.file(filename, blob);
                        })
                    );

                    // Tạo file ZIP và save
                    const content = await zip.generateAsync({ type: "blob" });
                    saveAs(content, "Contract-partner-files.zip");
                };

                return (
                    <div className="flex flex-col items-center gap-2">
                        {/* Nút tải tất cả */}
                        {urls.length > 1 && (
                            <Button
                                type="dashed"
                                icon={<DownloadOutlined />}
                                onClick={downloadAllAsZip}
                            >
                                Tải tất cả ({urls.length})
                            </Button>
                        )}


                    </div>
                );
            }
        },

        {
            title: "Tên hợp đồng",
            dataIndex: "title",
            key: "title",
        },
        {
            title: "Đối tác",
            dataIndex: "partnerName",
            key: "partnerName",
        },

        {
            title: "Ngày có hiệu lực",
            dataIndex: "effectiveDate",
            key: "effectiveDate",
            sorter: (a, b) => {
                const dateA = new Date(a.effectiveDate[0], a.effectiveDate[1] - 1, a.effectiveDate[2]);
                const dateB = new Date(b.effectiveDate[0], b.effectiveDate[1] - 1, b.effectiveDate[2]);
                return dateB - dateA;
            },
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
            sorter: (a, b) => {
                const dateA = new Date(a.expiryDate[0], a.expiryDate[1] - 1, a.expiryDate[2]);
                const dateB = new Date(b.expiryDate[0], b.expiryDate[1] - 1, b.expiryDate[2]);
                return dateB - dateA;
            },
            render: (text) => {
                if (Array.isArray(text) && text.length >= 3) {
                    return dayjs(new Date(text[0], text[1] - 1, text[2])).format("DD/MM/YYYY");
                }
                return "Không có dữ liệu";
            },
            defaultSortOrder: "ascend"
        },
        // {
        //     title: "Giá trị",
        //     dataIndex: "totalValue",
        //     key: "totalValue",
        //     render: (value) => value?.toLocaleString("vi-VN") + " VND",
        //     sorter: (a, b) => a.totalValue - b.totalValue
        // },
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
                            onClick={() => handleDelete(record.partnerContractId)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];



    const handleUploadAll = async (paymentScheduleId) => {
        try {
            // Tạo FormData và append tất cả file vào cùng một key (ví dụ: "files")
            const formData = new FormData();
            fileList.forEach((file) => {
                formData.append("files", file);
            });

            // Gọi API upload file, truyền paymentScheduleId và formData
            const res = await uploadBill({ paymentScheduleId, formData }).unwrap();
            const parsedRes = JSON.parse(res);

            message.success(parsedRes.message);
            setFileList([]);
            setActivePanel([]);
            refetch();
            refetchBill();
        } catch (error) {
            console.error("Lỗi khi tải lên file:", error);
            message.error("Có lỗi xảy ra khi tải lên file!");
        }
    };


    const handleBeforeUpload = (file) => {
        const isValidType =
            file.type === "image/png" || file.type === "image/jpeg";
        if (!isValidType) {
            message.error("Bạn chỉ có thể tải file PNG hoặc JPEG!");
            return Upload.LIST_IGNORE;
        }

        // Thêm file vào state
        setFileList((prev) => [...prev, file]);

        return false; // Ngăn không cho Upload.Dragger tự động tải lên
    };

    const handleDeleteImg = (index) => {
        setFileList((prev) => prev.filter((_, i) => i !== index));
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
                        {isStaff && (<Button
                            type="primary"
                            icon={<EditFilled />}
                            style={{ marginBottom: 16 }}
                            onClick={() => setIsModalVisible(true)}
                        >
                            Tạo hợp đồng
                        </Button>
                        )}


                    </div>
                </div>
                <Table
                    columns={columns}
                    dataSource={contracts?.data?.content.filter(
                        (item) =>
                            item?.title?.toLowerCase().includes(searchText?.toLowerCase()) ||
                            item?.partner?.partnerName?.toLowerCase().includes(searchText?.toLowerCase()) ||
                            item?.contractNumber?.toLowerCase().includes(searchText?.toLowerCase())
                    )}
                    pagination={{
                        current: page,
                        pageSize: size,
                        total: contracts?.data?.totalElements
                    }}
                    expandable={{
                        expandedRowRender: (record) => {
                            console.log("record when expanding row", record);
                            if (!record?.paymentSchedules || record.paymentSchedules.length === 0) {
                                return <Empty description="Không có lịch thanh toán" />;
                            }

                            return (
                                <div className="relative p-4">
                                    <h3 className="text-xl font-semibold text-center mb-4">
                                        Các đợt thanh toán
                                    </h3>

                                    <Collapse
                                        bordered
                                        accordion
                                        className={` ${isDarkMode ? '' : 'bg-[#fafafa]'}  border border-gray-300 rounded-lg shadow-sm [&_.ant-collapse-arrow]:!text-[#1e1e1e]`}
                                        onChange={(key) => setActivePanel(key)}
                                    >
                                        {record?.paymentSchedules.map((schedule, index) => (
                                            <Panel
                                                key={schedule.id || index}
                                                header={
                                                    <div className={`${isDarkMode ? '!text-white' : '!text-black'} flex items-center justify-between w-full`}>
                                                        {/* Số tiền */}

                                                        <Tooltip title={`${schedule.amount.toLocaleString()} VND`}>
                                                            <span
                                                                className="font-bold  text-lg whitespace-nowrap overflow-hidden text-ellipsis"
                                                                style={{ maxWidth: "250px" }}
                                                            >
                                                                {schedule.amount.toLocaleString()} VND
                                                            </span>
                                                        </Tooltip>
                                                        {/* Ngày thanh toán */}
                                                        <span className="text-base ">
                                                            {schedule.paymentDate
                                                                ? dayjs(
                                                                    new Date(
                                                                        schedule.paymentDate[0],
                                                                        schedule.paymentDate[1] - 1,
                                                                        schedule.paymentDate[2]
                                                                    )
                                                                ).format("DD/MM/YYYY")
                                                                : "Không có dữ liệu"}
                                                        </span>
                                                        {/* Tag trạng thái */}
                                                        <div>
                                                            {schedule.status === "UNPAID" ? (
                                                                <Tag color="red">Chưa thanh toán</Tag>
                                                            ) : schedule.status === "PAID" ? (
                                                                <Tag color="green">Đã thanh toán</Tag>
                                                            ) : schedule.status === "OVERDUE" ? (
                                                                <Tag color="red">Quá hạn</Tag>
                                                            ) : (
                                                                schedule.status
                                                            )}
                                                        </div>
                                                    </div>
                                                }
                                                onClick={() => {
                                                    setPaymentId(schedule.id);
                                                    // Mở panel này nếu chưa mở, hoặc đóng nếu đã mở
                                                    setActivePanel((prev) =>
                                                        prev.includes(schedule.id) ? [] : [schedule.id]
                                                    );
                                                }}                                            >
                                                {schedule.status === "PAID" ? (
                                                    // Nếu đã thanh toán, chỉ hiển thị danh sách ảnh từ API
                                                    <div>

                                                        <div className="text-gray-500 italic text-center mb-3">
                                                            Đợt thanh toán này đã hoàn thành, danh sách hóa đơn:
                                                        </div>
                                                        <div className="image-preview" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                                            {dataBill?.data && dataBill.data.length > 0 ? (
                                                                dataBill.data.map((imgUrl, idx) => (
                                                                    <Image
                                                                        key={idx}
                                                                        src={imgUrl}
                                                                        alt={`Uploaded ${idx}`}
                                                                        style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                                                                    />
                                                                ))
                                                            ) : (
                                                                <div className="text-gray-500">Không có đợt thanh toán nào cho hợp đồng này.</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // Nếu chưa thanh toán, hiển thị form tải lên
                                                    <>
                                                        <Upload.Dragger
                                                            name="invoice"
                                                            accept="image/png, image/jpeg"
                                                            beforeUpload={handleBeforeUpload}
                                                            showUploadList={false} // Không để Ant Design quản lý danh sách file
                                                        >
                                                            <p className="ant-upload-drag-icon">
                                                                <InboxOutlined />
                                                            </p>
                                                            <div className="ant-upload-text">
                                                                Click hoặc kéo file vào đây để tải lên
                                                            </div>
                                                            <p className="ant-upload-hint">Hỗ trợ tải lên một hoặc nhiều file.</p>
                                                        </Upload.Dragger>

                                                        {/* Hiển thị danh sách ảnh đã chọn */}
                                                        <div className="image-preview" style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "15px" }}>
                                                            {fileList.map((file, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="image-item"
                                                                    onMouseEnter={() => setHoveredIndex(index)}
                                                                    onMouseLeave={() => setHoveredIndex(null)}
                                                                    style={{ position: "relative", display: "inline-block" }}
                                                                >
                                                                    <Image
                                                                        src={URL.createObjectURL(file)}
                                                                        alt="Uploaded"
                                                                        style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px" }}
                                                                    />
                                                                    {hoveredIndex === index && (
                                                                        <Button
                                                                            icon={<DeleteOutlined />}
                                                                            onClick={() => handleDeleteImg(index)}
                                                                            style={{
                                                                                position: "absolute",
                                                                                top: "5px",
                                                                                right: "5px",
                                                                                backgroundColor: "red",
                                                                                color: "white",
                                                                                borderRadius: "50%",
                                                                                padding: "5px",
                                                                                border: "none",
                                                                            }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        {/* Nút tải lên */}
                                                        <Button
                                                            type="primary"
                                                            icon={LoadingBill ? <LoadingOutlined /> : <UploadOutlined />}
                                                            onClick={() => handleUploadAll(schedule.id)}
                                                            disabled={fileList.length === 0 || LoadingBill}
                                                            style={{ marginTop: "10px" }}
                                                        >
                                                            {LoadingBill ? "Đang tải lên..." : "Tải lên"}
                                                        </Button>
                                                    </>
                                                )}
                                            </Panel>
                                        ))}
                                    </Collapse>
                                </div>

                            );
                        },


                    }}
                    onChange={handleTableChange}
                    rowKey={(record) => record.partnerContractId}
                    loading={isLoading}
                />

                {/* Modal tạo hợp đồng */}
                <Modal
                    title="Tạo hợp đồng"
                    open={isModalVisible}
                    onCancel={closeModel}
                    footer={null}
                    width="90%"
                >
                    <Form form={formUpload} layout="vertical">
                        <Form.Item>
                            <Upload.Dragger
                                multiple
                                disabled={isManager || isCEO}
                                name="files"
                                accept="image/png,image/jpeg,application/pdf"
                                beforeUpload={(file) => {
                                    const isImage = file.type === "image/png" || file.type === "image/jpeg";
                                    const isPDF = file.type === "application/pdf";

                                    if (!isImage && !isPDF) {
                                        message.error(`${file.name} không phải là hình PNG/JPG hoặc file PDF!`);
                                        return Upload.LIST_IGNORE;
                                    }
                                    setFileList((prev) => [...prev, file]);
                                    return false;
                                }}
                                showUploadList={false}
                            >
                                <p className="ant-upload-drag-icon">
                                    <InboxOutlined />
                                </p>
                                <div className="ant-upload-text">Click hoặc kéo file vào đây để tải lên</div>
                                <p className="ant-upload-hint">Hỗ trợ tải lên nhiều file hình hoặc PDF.</p>
                            </Upload.Dragger>

                            {fileList.length > 0 && (
                                <div className="file-preview mt-4" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                    {fileList.map((file, index) => {
                                        const isImage = file.type.startsWith("image/");
                                        return (
                                            <div
                                                key={index}
                                                onMouseEnter={() => setHoveredIndex(index)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                                style={{ position: "relative" }}
                                            >
                                                {isImage ? (
                                                    <Image
                                                        src={URL.createObjectURL(file)}
                                                        alt="Preview"
                                                        style={{
                                                            width: "100px",
                                                            height: "100px",
                                                            objectFit: "cover",
                                                            borderRadius: "8px"
                                                        }}
                                                    />
                                                ) : (
                                                    <div
                                                        style={{
                                                            width: "100px",
                                                            height: "100px",
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                            border: "1px solid #ddd",
                                                            borderRadius: "8px",
                                                            backgroundColor: "#f5f5f5"
                                                        }}
                                                    >
                                                        <FilePdfOutlined style={{ fontSize: "30px", color: "#e74c3c" }} />
                                                    </div>
                                                )}
                                                {hoveredIndex === index && (
                                                    <Button
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleDeleteImg(index)}
                                                        style={{
                                                            position: "absolute",
                                                            top: "5px",
                                                            right: "5px",
                                                            backgroundColor: "red",
                                                            color: "white",
                                                            borderRadius: "50%",
                                                            padding: "5px",
                                                            border: "none"
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                            <Upload
                                accept="application/pdf"
                                maxCount={1}
                                showUploadList={false}
                                beforeUpload={async (file) => {
                                    setLoading(true);
                                    try {
                                        const extractedData = await callAIForExtraction(file);
                                        console.log("Extracted data:", extractedData);
                                        setExtractedData(extractedData);
                                        setPartnerName(extractedData?.partner.partnerName);
                                        setTaxCode(extractedData?.partner?.taxCode || "");
                                        setNewCustomerData(extractedData?.partner || {});
                                        fillFormWithExtractedData(extractedData);
                                    } catch (error) {
                                        console.error("Lỗi khi xử lý file:", error);
                                    } finally {
                                        setLoading(false);
                                    }
                                    return false;
                                }}
                            >
                                <Button
                                    disabled={Loading}
                                    icon={Loading ? <LoadingOutlined /> : <UploadOutlined />}
                                    className="mt-10"
                                >
                                    {Loading ? "AI đang xử lý..." : "Dùng AI đọc thông tin"}
                                </Button>
                            </Upload>
                            {/* <Upload
                                beforeUpload={async (file) => {
                                    setLoading(true);
                                    try {
                                        const extractedData = await callAIForExtraction(file);
                                        console.log("Extracted data:", extractedData);
                                        setExtractedData(extractedData);
                                        setPartnerName(extractedData?.partner.partnerName);
                                        setTaxCode(extractedData?.partner?.taxCode || "");
                                        setNewCustomerData(extractedData?.partner || {});
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
                            </Upload> */}
                        </Form.Item>
                    </Form>

                    <Form
                        form={form}
                        layout="vertical"

                        onFinish={handleSubmit}
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Tên đối tác"
                                    name={["partner", "partnerName"]}
                                    placeholder="Nhập tên đối tác"
                                    rules={[
                                        { required: true, whitespace: true, message: "Vui lòng nhập tên đối tác!" },
                                        // {
                                        //     pattern: /^[A-Za-zÀ-ỹ\s]+$/,
                                        //     message: "Tên chỉ được chứa chữ và khoảng trắng!",
                                        // },
                                    ]}
                                >
                                    <Input />
                                </Form.Item>
                                <Form.Item
                                    label="Mã hợp đồng"
                                    name="contractNumber"
                                    placeholder="Nhập mã hợp đồng"
                                    rules={[
                                        { required: true, whitespace: true, message: "Vui lòng nhập mã hợp đồng!" },
                                        // {
                                        //     pattern: /^[A-Z0-9\-]{3,}$/,
                                        //     message:
                                        //         "Mã hợp đồng tối thiểu 3 ký tự, chỉ gồm chữ in hoa, số và '-'!",
                                        // },
                                    ]}

                                >
                                    <Input />
                                </Form.Item>

                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    label="Ngày ký"
                                    name="signingDate"
                                    dependencies={['effectiveDate']}
                                    placeholder="Nhập ngày ký"
                                    rules={[

                                        { required: true, message: "Vui lòng chọn ngày ký!" },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                const effectiveDate = getFieldValue('effectiveDate');
                                                console.log("effectiveDate", effectiveDate)
                                                if (!effectiveDate || !value) {
                                                    return Promise.resolve();
                                                }

                                                if (value.isBefore(effectiveDate) || value.isSame(effectiveDate)) {
                                                    return Promise.resolve();
                                                }
                                                return Promise.reject(new Error('Ngày ký kết phải trước hoặc cùng ngày có hiệu lực!'));
                                            },
                                        }),
                                    ]}
                                >
                                    <DatePicker
                                        className="w-[100%]"
                                        showTime={{ format: 'HH:mm:ss' }}
                                        format="DD/MM/YYYY HH:mm:ss"
                                    />
                                </Form.Item>
                                <Form.Item
                                    label="Ngày có hiệu lực"
                                    name="effectiveDate"
                                    dependencies={['signingDate']}
                                    placeholder="Nhập ngày có hiệu lực"
                                    rules={[
                                        { required: true, message: "Vui lòng chọn ngày có hiệu lực!" },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value) {
                                                    return Promise.resolve();
                                                }

                                                const signingDate = getFieldValue('signingDate');
                                                if (signingDate && value.isBefore(signingDate, 'day')) {
                                                    return Promise.reject(
                                                        new Error('Ngày có hiệu lực phải sau hoặc cùng ngày ký kết!')
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <DatePicker
                                        className="w-[100%]"
                                        showTime={{ format: 'HH:mm:ss' }}
                                        format="DD/MM/YYYY HH:mm:ss"
                                        disabledDate={(current) => {
                                            const signingDate = form.getFieldValue('signingDate');
                                            return (
                                                current &&
                                                signingDate &&
                                                current.isBefore(signingDate.startOf('day'))
                                            );
                                        }}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label="Ngày hết hiệu lực"
                                    name="expiryDate"
                                    dependencies={['effectiveDate']}
                                    placeholder="Nhập ngày hết hiệu lực"
                                    rules={[
                                        { required: true, message: "Vui lòng chọn ngày hết hiệu lực!" },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value) {
                                                    return Promise.resolve();
                                                }

                                                const effectiveDate = getFieldValue('effectiveDate');
                                                if (effectiveDate && !value.isAfter(effectiveDate, 'day')) {
                                                    return Promise.reject(
                                                        new Error('Ngày hết hiệu lực phải sau ngày có hiệu lực!')
                                                    );
                                                }
                                                return Promise.resolve();
                                            },
                                        }),
                                    ]}
                                >
                                    <DatePicker
                                        className="w-[100%]"
                                        showTime={{ format: 'HH:mm:ss' }}
                                        format="DD/MM/YYYY HH:mm:ss"
                                        disabledDate={(current) => {
                                            const effectiveDate = form.getFieldValue('effectiveDate');
                                            if (!current) return false;
                                            const isBeforeOrSameStart =
                                                effectiveDate && current <= effectiveDate.startOf('day');
                                            return isBeforeOrSameStart;
                                        }}
                                    />
                                </Form.Item>

                            </Col>
                        </Row>
                        <Form.Item
                            label="Tên hợp đồng"
                            name="title"
                            rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên hợp đồng!" }]}
                        >
                            <Input />
                        </Form.Item>

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
                                                    noStyle
                                                    rules={[{ required: true, message: "Vui lòng nhập số đợt thanh toán!" }]}
                                                >
                                                    <Input style={{ width: 100 }} placeholder={`${index + 1}`} />
                                                </Form.Item>
                                            </Space>


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
                                                placeholder="Nhập ngày thanh toán"
                                                dependencies={['effectiveDate', 'expiryDate']}
                                                rules={[
                                                    { required: true, message: "Vui lòng chọn ngày thanh toán!" },
                                                    ({ getFieldValue }) => ({
                                                        validator(_, value) {
                                                            if (!value) {
                                                                return Promise.resolve();
                                                            }

                                                            const effectiveDate = getFieldValue('effectiveDate');
                                                            const expiryDate = getFieldValue('expiryDate');
                                                            if (!effectiveDate || !expiryDate) {
                                                                return Promise.resolve();
                                                            }

                                                            const sameOrAfterStart = value.isAfter(effectiveDate, 'day');
                                                            const sameOrBeforeEnd = value.isBefore(expiryDate, 'day');
                                                            if (sameOrAfterStart && sameOrBeforeEnd) {
                                                                return Promise.resolve();
                                                            }
                                                            return Promise.reject(
                                                                new Error("Ngày thanh toán phải nằm trong khoảng hiệu lực hợp đồng!")
                                                            );
                                                        }
                                                    })
                                                ]}
                                            >
                                                <DatePicker
                                                    className="w-[100%]"
                                                    showTime={{ format: 'HH:mm:ss' }}
                                                    format="DD/MM/YYYY HH:mm:ss"
                                                    disabledDate={(current) => {
                                                        const effectiveDate = form.getFieldValue('effectiveDate');
                                                        const expiryDate = form.getFieldValue('expiryDate');
                                                        if (!current || !effectiveDate || !expiryDate) {
                                                            return false;
                                                        }
                                                        return (
                                                            current.isBefore(effectiveDate.startOf('day'), 'day') ||
                                                            current.isAfter(expiryDate.endOf('day'), 'day')
                                                        );
                                                    }}
                                                />

                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                label="Số tiền thanh toán"
                                                name={[name, "amount"]}
                                                rules={[
                                                    { required: true, message: "Vui lòng nhập số tiền thanh toán!" },
                                                    {
                                                        validator(_, value) {
                                                            const num = parseFloat(value);
                                                            if (isNaN(num) || num <= 0) {
                                                                return Promise.reject(new Error("Số tiền phải lớn hơn 0!"));
                                                            }
                                                            return Promise.resolve();
                                                        },
                                                    },
                                                ]}
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
                            <Button disabled={isLoadingCreate} type="primary" htmlType="submit">
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
                    <Form
                        form={form}
                        layout="vertical"

                        onFinish={handleSubmitEditContractPartner}
                    >
                        <Form.Item name="partnerContractId" style={{ display: "none" }}>
                            <Input />
                        </Form.Item>
                        <Form.Item name="fileUrl" style={{ display: "none" }}>
                            <Input />
                        </Form.Item>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label="Tên đối tác"
                                    name={"partnerName"}
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên đối tác!" }]}
                                >
                                    <Input placeholder="Nhập tên đối tác" />
                                </Form.Item>
                                <Form.Item
                                    label="Mã hợp đồng"
                                    name="contractNumber"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập mã hợp đồng!" }]}
                                >
                                    <Input placeholder="Nhập mã hợp đồng" />
                                </Form.Item>
                                <Form.Item
                                    label="Tổng giá trị"
                                    name="totalValue"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tổng giá trị!" }]}
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND'}
                                        parser={value => value.replace(/\s?VND|\./g, '')}
                                    />
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
                                                <InputNumber
                                                    style={{ width: '100%' }}
                                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' VND'}
                                                    parser={value => value.replace(/\s?VND|\./g, '')}
                                                />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                label="Nội dung hạng mục"
                                                name={[name, "description"]}
                                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung hạng mục!" }]}
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
                                                    noStyle
                                                    rules={[{ required: true, message: "Vui lòng nhập số đợt thanh toán!" }]}
                                                >
                                                    <Input style={{ width: 100 }} placeholder={`${index + 1}`} />
                                                </Form.Item>
                                            </Space>


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

                {/* Modal tạo khách hàng */}
                <Modal
                    className="w-full"
                    title="Tạo khách hàng Mới"
                    open={isModalPartner}
                    okText="Tạo khách hàng Mới"
                    onOk={handleOk}
                    onCancel={handleCancel}
                    cancelText="Hủy"
                    loading={isCreating}
                >
                    <Form form={formPartner} layout="vertical" className="w-full">
                        {/* Các trường chung được chia thành 2 cột */}
                        <Row gutter={16} className="w-full">
                            <Col xs={24} md={12}>
                                <Form.Item name="partyId" style={{ display: "none" }} />

                                <Form.Item
                                    name="partnerName"
                                    label="Tên đối tác"
                                    rules={[
                                        { required: true, whitespace: true, message: "Vui lòng nhập tên đối tác" },
                                        {
                                            validator: (_, value) => {
                                                if (!value) return Promise.resolve();
                                                const regex = /^[\p{L}0-9\s-]{2,100}$/u;
                                                return regex.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject(
                                                        new Error(
                                                            "Tên đối tác không hợp lệ (chỉ chứa chữ, số, dấu cách, dấu gạch ngang, từ 2-100 ký tự)"
                                                        )
                                                    );
                                            },
                                        },
                                    ]}
                                >
                                    <Input onChange={handleNameChange} placeholder="Nhập tên đối tác" />
                                </Form.Item>
                                <Form.Item
                                    name="spokesmanName"
                                    label="Người đại diện"
                                    rules={[
                                        { required: true, whitespace: true, message: "Vui lòng nhập tên Người đại diện" },
                                        {
                                            validator: (_, value) => {
                                                if (!value) return Promise.resolve();
                                                const regex = /^[\p{L}\s-]{2,50}$/u;
                                                return regex.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject(
                                                        new Error(
                                                            "Tên người đại diện không hợp lệ (chỉ chứa chữ, dấu cách, dấu gạch ngang, từ 2-50 ký tự)"
                                                        )
                                                    );
                                            },
                                        },
                                    ]}
                                >
                                    <Input placeholder="Nhập tên người đại diện" />
                                </Form.Item>
                                <Form.Item
                                    name="address"
                                    label="Địa chỉ"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập địa chỉ" }]}
                                >
                                    <Input placeholder="Nhập địa chỉ" />
                                </Form.Item>
                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[
                                        {
                                            required: true,
                                            whitespace: true,
                                            pattern: validationPatterns.email.pattern,
                                            message: validationPatterns.email.message,
                                        },
                                    ]}
                                >
                                    <Input placeholder="Nhập email" />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="position"
                                    label="Chức vụ người đại diện"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập chức vụ" }]}
                                >
                                    <Input placeholder="Nhập chức vụ" />
                                </Form.Item>
                                <Form.Item
                                    name="abbreviation"
                                    label="Viết tắt của partner"
                                    rules={[{ required: true, whitespace: true, message: "Viết tắt không được để trống" }]}
                                >
                                    <Input placeholder="Nhập viết tắt của đối tác" />
                                </Form.Item>
                                <Form.Item
                                    name="taxCode"
                                    label="Mã số thuế"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập mã số thuế" }]}
                                >
                                    <Input placeholder="Nhập mã số thuế" />
                                </Form.Item>
                                <Form.Item
                                    name="phone"
                                    label="Điện thoại"
                                    rules={[
                                        {
                                            required: true,
                                            whitespace: true,
                                            pattern: validationPatterns.phoneNumber.pattern,
                                            message: validationPatterns.phoneNumber.message,
                                        },
                                    ]}
                                >
                                    <Input placeholder="Nhập số điện thoại" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* Phần ngân hàng */}
                        <div style={{ marginTop: 24 }}>
                            <h4 className="mb-4">Ngân hàng</h4>
                            {bankAccounts.map((bank, index) => (
                                <div key={index} className="flex items-center justify-center space-x-4">
                                    <div className="w-full md:w-5/12">
                                        <Form.Item
                                            name={["banking", index, "bankName"]}
                                            rules={[
                                                {
                                                    whitespace: true,
                                                    pattern: /^[\p{L}\s.-]{3,100}$/u,
                                                    message:
                                                        "Tên ngân hàng không hợp lệ (3-100 ký tự, chỉ chứa chữ, khoảng trắng, dấu gạch ngang, dấu chấm)",
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder="Tên ngân hàng"
                                                value={bank.bankName}
                                                onChange={(e) => handleBankChange(index, "bankName", e.target.value)}
                                            />
                                        </Form.Item>
                                    </div>

                                    <div className="w-full md:w-5/12">
                                        <Form.Item
                                            name={["banking", index, "backAccountNumber"]}
                                            rules={[
                                                {
                                                    whitespace: true,
                                                    pattern: /^\d{6,20}$/,
                                                    message: "Số tài khoản không hợp lệ (chỉ chứa số, từ 6-20 ký tự)",
                                                },
                                            ]}
                                        >
                                            <Input
                                                placeholder="Số tài khoản"
                                                value={bank.backAccountNumber}
                                                onChange={(e) => handleBankChange(index, "backAccountNumber", e.target.value)}
                                            />
                                        </Form.Item>
                                    </div>

                                    {bankAccounts.length > 1 && (
                                        <div>
                                            <Button
                                                type="primary"
                                                className="block"
                                                danger
                                                onClick={() => removeBankAccount(index)}
                                            >
                                                <DeleteFilled />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <Button icon={<PlusOutlined />} onClick={addBankAccount}>
                                Thêm ngân hàng
                            </Button>
                        </div>
                    </Form>
                </Modal>

            </div>
        </div>
    );
};

export default ContractPartner;
