// isDelete sẽ có 3 trạng thái : đang hoạt động, đã xóa(khi user xóa đk), đã cũ(khi user edit thì đk cũ sẽ chuyển sang trạng thái đã cũ và tạo đk mới)
import React, { useState, useEffect } from 'react';
import { Input, Button, Modal, List, Select, message, Skeleton, Card, ConfigProvider, Tag, Popover, Typography, Form, Tabs, Divider, Upload } from 'antd';
import 'tailwindcss/tailwind.css';
import { DeleteFilled, DownloadOutlined, EditFilled, PlusCircleFilled, UploadOutlined, WarningOutlined } from '@ant-design/icons';
import { useGetClauseManageQuery, useUpdateClauseMutation } from '../../services/ClauseAPI';
import { useGetAllTypeClauseQuery, useCreateClauseMutation, useGetLegalQuery, useDeleteClauseMutation } from '../../services/ClauseAPI';
import TabPane from 'antd/es/tabs/TabPane';
import dayjs from 'dayjs';
import { useGetContractTypeQuery, useEditContractTypeMutation, useCreateContractTypeMutation } from '../../services/ContractAPI';
import { useUploadClauseBFileMutation } from '../../services/uploadAPI';
const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
// import file from "../../assets/file/sample_file.xlsx"

const ManageClause = () => {
    const [searchTermClause, setSearchTermClause] = useState('');
    const [searchTermLegal, setSearchTermLegal] = useState('');
    const [selectedType, setSelectedType] = useState('');

    const [sortOrderClause, setSortOrderClause] = useState('desc');
    const [sortByClause, setSortByClause] = useState('id');

    const [sortOrderLegal, setSortOrderLegal] = useState('desc');
    const [activeTab, setActiveTab] = useState("1");
    const [pageClause, setPageClause] = useState(0);
    const [pageSizeClause, setPageSizeClause] = useState(10);
    const [pageLegal, setPageLegal] = useState(0);
    const [pageSizeLegal, setPageSizeLegal] = useState(10);
    const [isModalOpenClause, setIsModalOpenClause] = useState(false);
    const [isModalOpenLegal, setIsModalOpenLegal] = useState(false);
    const [isModalOpenAdd, setIsModalOpenAdd] = useState(false);
    const [isModalOpenAddLegal, setIsModalOpenAddLegal] = useState(false);
    const [idClauseToEdit, setIdClauseToEdit] = useState('')

    // const [searchTermContractType, setSearchTermContractType] = useState('');
    const [isModalOpenAddContractType, setIsModalOpenAddContractType] = useState(false);
    const [isModalOpenContractType, setIsModalOpenContractType] = useState(false);
    const [currentContractType, setCurrentContractType] = useState(null);

    const [isModalOpenImport, setIsModalOpenImport] = useState(false);

    const { data: clauseData, isLoading: loadingClause, isError: DataError, refetch: refetchClause } = useGetClauseManageQuery({
        keyword: searchTermClause,
        typeTermIds: selectedType,
        page: pageClause,
        size: pageSizeClause,
        order: sortOrderClause,
        sortBy: sortByClause
    });

    const { data: legalData, isLoading: loadingLegal, refetch: refetchLegal } = useGetLegalQuery({ page: pageLegal, size: pageSizeLegal, keyword: searchTermLegal, order: sortOrderLegal });
    const { data: typeContractData, isLoading: loadingTypeContract, refetch } = useGetContractTypeQuery();
    const { data: typeData, isLoading: loadingType } = useGetAllTypeClauseQuery();
    const [createContractType, { isLoading: loadingCreateType }] = useCreateContractTypeMutation();
    const [editContractType, { isLoading: loadingEdit }] = useEditContractTypeMutation();
    const [createClause, { isLoading: loadingCreate }] = useCreateClauseMutation();
    const [updateClause, { isLoading: loadingUpdate }] = useUpdateClauseMutation();
    const [deleteClause, { isLoading: loadingDelete }] = useDeleteClauseMutation();
    const [importClause, { isLoading: loadingUploadFile }] = useUploadClauseBFileMutation();
    const [form] = Form.useForm();
    const [formCreate] = Form.useForm();
    const [formCreateLegal] = Form.useForm();
    const [formImport] = Form.useForm();


    // Hàm chuyển mảng ngày thành Date (chú ý trừ 1 cho tháng)
    const convertToDate = (dateArr) => {
        return new Date(
            dateArr[0],
            dateArr[1] - 1,
            dateArr[2],
            dateArr[3],
            dateArr[4],
            dateArr[5],
        );
    };

    useEffect(() => {
        refetchClause()
        refetchLegal()
    }, [])

    const calculateDaysAgo = (createdAt) => {
        const createdDate = convertToDate(createdAt);
        const now = new Date();
        const diffMs = now - createdDate;

        // Tính theo giây
        const diffSeconds = Math.floor(diffMs / 1000);
        if (diffSeconds < 60) {
            return "Được tạo vài giây trước";
        }

        // Tính theo phút
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        if (diffMinutes < 60) {
            return `Được tạo ${diffMinutes} phút trước`;
        }

        // Tính theo giờ
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours < 24) {
            return `Được tạo ${diffHours} giờ trước`;
        }

        // Tính theo ngày
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays < 30) {
            return `Được tạo ${diffDays} ngày trước`;
        }

        // Tính theo tháng (ước tính 30 ngày mỗi tháng)
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) {
            return `Được tạo ${diffMonths} tháng trước`;
        }

        // Tính theo năm (ước tính 12 tháng mỗi năm)
        const diffYears = Math.floor(diffMonths / 12);
        return `Được tạo ${diffYears} năm trước`;
    };



    // Sắp xếp dữ liệu theo createdAt dựa vào sortOrder
    const sortedClause = clauseData?.data?.content
        ?.slice()
        .filter(item => !item.isDelete)


    const sortedLegal = legalData?.data?.content
        ?.slice()
        .filter(item => !item.isDelete)


    const colorMap = {
        "Điều khoản thêm": "volcano",
        "Quyền và nghĩa vụ": "geekblue",
        "Bảo hành và bảo trì": "green",
        "Vi phạm và thiệt hại": "red",
        "Chấm dứt hợp đồng": "orange",
        "Điều khoản giải quyết tranh chấp": "blue",
        "Chính sách bảo mật": "purple",
        "Căn cứ pháp lí": "lime",
        "Điều khoản chung": "cyan",
        "Các điều khoản khác": "magenta"
    };


    const handleUpdateClause = (clauseCode) => {
        const clauseToEdit = clauseData?.data?.content?.find(clause => clause.clauseCode === clauseCode);
        if (clauseToEdit) {
            setSortOrderClause('desc');
            form.setFieldsValue(clauseToEdit);
            setIsModalOpenClause(true);
            setPageClause(0);
        } else {
            message.error('Không tìm thấy điều khoản!');
        }
    };

    const handleUpdateLegal = (clauseCode) => {
        const clauseToEdit = legalData?.data?.content?.find(clause => clause.clauseCode === clauseCode);
        if (clauseToEdit) {
            setSortOrderLegal('desc');
            form.setFieldsValue(clauseToEdit);

            setIsModalOpenLegal(true);
        } else {
            message.error('Không tìm thấy Căn căn cứ!');
        }
    };

    const openAddClauseModal = () => {
        form.resetFields();
        setSortOrderClause('desc');
        setIsModalOpenAdd(true);
        setPageClause(0);
    };
    const openAddLagelModal = () => {
        form.resetFields();
        setSortOrderLegal('desc');
        setIsModalOpenAddLegal(true);
    };
    const handleEditContractType = (record) => {
        setCurrentContractType(record);
        form.setFieldsValue({ name: record.name });
        setIsModalOpenContractType(true);
    };

    const handleAddContractType = () => {
        form.resetFields();
        setIsModalOpenAddContractType(true);
    };

    const handleOkAdd = async () => {
        try {

            const values = await form.validateFields();
            console.log("values", values);
            const processedValues = {
                ...values,
                name: values.name ? values.name.charAt(0).toUpperCase() + values.name.slice(1) : values.name,
            };
            await createContractType(processedValues).unwrap();
            message.success("Thêm loại hợp đồng thành công!");
            setIsModalOpenAddContractType(false);
            refetch();
        } catch (error) {
            message.error("Thêm loại hợp đồng thất bại!");
        }
    };

    const handleOkEdit = async () => {
        try {
            const values = await form.validateFields();
            const processedValues = {
                ...values,
                name: values.name ? values.name.charAt(0).toUpperCase() + values.name.slice(1) : values.name,
            };
            // Gọi API update
            await editContractType({ id: currentContractType.id, ...processedValues }).unwrap();
            message.success("Cập nhật loại hợp đồng thành công!");
            setIsModalOpenContractType(false);
            refetch(); // Tải lại danh sách
        } catch (error) {
            message.error("Cập nhật loại hợp đồng thất bại!");
        }
    };


    const handleSubmitAddClause = async (values) => {
        console.log(values)
        try {
            const result = await createClause({ typeTermId: values.type, label: values.label, value: values.value }).unwrap();
            console.log(result)
            if (result.status == "CREATED") {
                message.success("Tạo điều khoản thành công");
                refetchClause();
                refetchLegal();
                setIsModalOpenAdd(false);
                setIsModalOpenAddLegal(false);
                formCreate.resetFields();
                formCreateLegal.resetFields()
            }
        } catch (error) {
            console.log(error)
            message.error(error.data.message || "Có lỗi xảy ra khi tạo điều khoản!");
        }
    };

    const getTypeTermId = (typeValue) => {
        // Nếu typeValue là chuỗi "Căn cứ pháp lí", trả về số 8
        if (typeof typeValue === "string" && typeValue.trim() === "Căn cứ pháp lí") {
            return 8;
        }
        // Nếu typeValue là một object (sử dụng labelInValue), lấy thuộc tính value
        if (typeof typeValue === "object" && typeValue !== null) {
            return typeValue.value;
        }
        // Nếu typeValue có thể chuyển thành số, chuyển nó
        if (!isNaN(typeValue)) {
            return Number(typeValue);
        }
        // Nếu typeValue là chuỗi khác, tìm trong typeData dựa trên trường name
        const found = typeData?.data?.find((item) => item.name === typeValue);
        return found ? found.original_term_id : typeValue;
    };

    const handleSubmitUpdateClause = async (values) => {
        try {
            const typeTermId = await getTypeTermId(values.type);
            setIdClauseToEdit(typeTermId)
            const updatedData = await updateClause({ termId: values.id, label: values.label, value: values.value, typeTermId: idClauseToEdit }).unwrap();
            // console.log(updatedData)
            if (updatedData.status == "OK") {
                setIsModalOpenClause(false);
                setIsModalOpenLegal(false);
                setIdClauseToEdit('')
                message.success("Cập nhật điều khoản thành công!");
                refetchClause();
                refetchLegal();
                form.resetFields();
            }

        } catch (error) {
            message.error(error.data.message);

        }
    };

    const handleDelete = async (contractId) => {
        Modal.confirm({
            title: 'Bạn có chắc muốn xóa không?',
            onOk: async () => {
                try {
                    const result = await deleteClause({ termId: contractId });

                    if (result.data) {
                        // Thành công
                        console.log(result);
                        refetchClause();
                        refetchLegal();
                        message.success(result.data.message || 'Xóa thành công');
                    } else if (result.error && result.error.status === 409) {
                        // Lỗi 409
                        message.error(result.error.data.message);
                    } else {
                        // Lỗi khác
                        message.error(result.error?.data?.message || 'Xóa thất bại, vui lòng thử lại');
                    }
                } catch (error) {
                    console.error("Lỗi trong quá trình xóa:", error);
                    message.error("Đã xảy ra lỗi, vui lòng thử lại");
                }
            },

            okText: 'Xóa',
            cancelText: 'Hủy',
        });
    };


    const handleSortByCreatedAt = () => {
        setSortByClause('id');
        setSortOrderClause(sortOrderClause === 'asc' ? 'desc' : 'asc');
    };

    // const handleSortByContractCount = () => {

    //     setSortByClause('contractCount');
    //     setSortOrderClause(sortOrderClause === 'asc' ? 'desc' : 'asc');
    // };

    const handleSortByCreatedAtLegal = () => {
        setSortOrderLegal(sortOrderLegal === 'asc' ? 'desc' : 'asc');
    };
    const handlePageChange = (newPage, newPageSize) => {
        setPageLegal(newPage - 1);
        setPageSizeLegal(newPageSize);
    }
    const handlePageClauseChange = (newPage, newPageSize) => {
        setPageClause(newPage - 1);
        setPageSizeClause(newPageSize);
    }


    const handleImportFile = async (values) => {
        // Lấy file gốc từ values.file
        const fileObj = Array.isArray(values.file) ? values.file[0].originFileObj : values.file;

        // Kiểm tra xem fileObj có phải là File object hợp lệ không
        if (!(fileObj instanceof File)) {
            console.error("Giá trị file không hợp lệ:", fileObj);
            message.error("Đã có lỗi với file upload, vui lòng kiểm tra lại.");
            return;
        }

        try {
            // Gửi file trực tiếp lên server mà không đọc nội dung
            const result = await importClause({
                typeTermId: values.type,
                file: fileObj,
            }).unwrap();
            message.success("Tải điều khoản từ file lên thành công !");
            refetchClause()
            formImport.resetFields()
        } catch (error) {
            console.error("Error importing file:", error);
            message.error("Failed to import file.");
        }
        setIsModalOpenImport(false);
    };


    if (loadingClause || loadingType || loadingLegal || loadingTypeContract) return <Skeleton active />;

    return (
        <ConfigProvider
            theme={{
                components: {
                    Tabs: {
                        cardBg: "#6a7584",
                        itemColor: "#ffff",
                        colorBgContainer: '#1667ff',
                        itemSelectedColor: "#ffff",
                        motionDurationMid: '0.1s',
                        motionDurationSlow: '0.1s',
                        itemHoverColor: null,
                        itemActiveColor: '#ffff',
                    },
                },
                token: { fontFamily: "Roboto, sans-serif" }
            }}
        >
            <Tabs
                defaultActiveKey="1"
                type="card"
                style={{ marginBottom: 32 }}
                tabBarStyle={{}}
                className='mt-10'
                activeKey={activeTab}
                onChange={setActiveTab}
            >

                {/* Tab Điều Khoản */}
                <TabPane tab="Điều Khoản" key="1">
                    {/** Gọi component quản lý điều khoản */}
                    <div className="p-4 min-h-[100vh]">
                        {/* Sửa nested <p> thành <div> */}
                        <div className='font-bold mb-10  text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                            <div className="flex items-center gap-4">
                                QUẢN LÝ ĐIỀU KHOẢN
                            </div>
                        </div>
                        <div className='flex justify-between w-full gap-4 mb-2'>

                            <div className='flex gap-2 w-[80%]'>
                                <Search
                                    placeholder="Tìm kiếm tên điều khoản"
                                    onSearch={setSearchTermClause}
                                    enterButton="tìm kiếm"
                                    allowClear
                                    className="mb-4 max-w-[700px]"
                                />
                                <Select
                                    placeholder="Chọn loại điều khoản"
                                    value={selectedType || undefined}
                                    onChange={(value) => setSelectedType(value || "")}
                                    className="mb-4 min-w-[270px]"
                                    allowClear
                                >

                                    {typeData?.data.map(item => (
                                        <Option key={item.original_term_id} value={item.original_term_id}>
                                            {item.name}
                                        </Option>
                                    ))}
                                </Select>

                                {/* Nút sắp xếp theo Ngày tạo */}
                                <button
                                    onClick={handleSortByCreatedAt}
                                    className={`mb-4 h-[32px] flex items-center gap-2 font-semibold py-2 px-4 rounded shadow-md transition duration-200 ${sortOrderClause === 'asc'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-blue-500 hover:bg-blue-600'
                                        }`}
                                >
                                    <span className="text-white opacity-100">
                                        {sortOrderClause === 'asc' ? 'Cũ nhất' : 'Mới nhất'}
                                    </span>
                                </button>
                            </div>

                            <Button
                                type="primary"
                                onClick={openAddClauseModal}
                                className="mb-4 justify-self-end"
                                icon={<PlusCircleFilled />}
                            >
                                Thêm điều khoản
                            </Button>
                            <Button
                                type="primary"
                                onClick={() => setIsModalOpenImport(true)}
                                className="mb-4"
                                icon={<UploadOutlined />}
                            >
                                Tải lên Điều Khoản
                            </Button>
                        </div>


                        <List
                            itemLayout="horizontal"
                            pagination={{
                                current: pageClause + 1,
                                pageSize: pageSizeClause,
                                total: clauseData?.data?.totalElements || 0,
                                onChange: (newPage, newPageSize) => {
                                    handlePageClauseChange(newPage, newPageSize)
                                },
                            }}
                            dataSource={sortedClause}
                            renderItem={clause => (
                                <Popover
                                    content={
                                        <Card
                                            bordered
                                            className="shadow-lg rounded-lg min-w-[650px] max-w-[50vw]"
                                        >
                                            <p className="text-blue-600 text-base font-bold">{clause.label.toUpperCase()}</p>
                                            <div className="mt-2 space-y-1 flex flex-col gap-2">
                                                <p>
                                                    <Text strong>Mã: </Text> {clause.clauseCode}
                                                </p>
                                                <p>
                                                    <Text strong>Loại: </Text> <Tag color={colorMap[clause.type] || "default"} className="w-fit">
                                                        {clause.type}
                                                    </Tag>
                                                </p>
                                                {/* <p>
                                                    <Text strong>Tên: </Text> 
                                                </p> */}
                                                <p>
                                                    <Text strong>Nội dung: </Text> {clause.value}
                                                </p>
                                                <p>
                                                    <Text strong>Ngày tạo: </Text>{dayjs(new Date(
                                                        clause.createdAt[0],
                                                        clause.createdAt[1] - 1,
                                                        clause.createdAt[2]
                                                    )).format("DD/M/YYYY")}
                                                </p>
                                            </div>
                                        </Card>

                                    }
                                    placement="bottomRight"
                                    trigger="hover"
                                >
                                    <List.Item
                                        style={{ cursor: 'default' }}
                                        // onClick={() => showModal(clause)}
                                        className="hover:shadow-lg rounded-md shadow-sm mb-2 cursor-pointer"
                                        actions={[
                                            <div className="flex flex-col items-center gap-2 mr-3">
                                                <div className="flex gap-3 mb-3">
                                                    <Button
                                                        type="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateClause(clause.clauseCode);
                                                        }}
                                                        className="flex items-center justify-center"
                                                    >
                                                        <EditFilled />
                                                    </Button>
                                                    <Button
                                                        danger
                                                        type="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(clause.id);
                                                        }}
                                                        className="flex items-center justify-center"
                                                        loading={loadingDelete}
                                                    >
                                                        <DeleteFilled />
                                                    </Button>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm mb-2">{calculateDaysAgo(clause.createdAt)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm mb-2">Có {clause.contractCount} hợp đồng đang dùng điều khoản này</p>
                                                </div>
                                            </div>

                                        ]}
                                    >
                                        <List.Item.Meta
                                            className="px-7 py-4"
                                            title={
                                                <div className="flex flex-row items-center gap-8">
                                                    {/* Cột mã điều khoản */}
                                                    <div className=" flex flex-col items-center min-w-[100px]">
                                                        <p>Mã ĐK</p>
                                                        <p className="font-bold text-base">{clause.clauseCode}</p>
                                                    </div>
                                                    {/* Cột thông tin điều khoản (loại và tên) */}
                                                    <div className="flex flex-col gap-[6px]">
                                                        <Tag color={colorMap[clause.type] || "default"} className="w-fit">
                                                            {clause.type}
                                                        </Tag>
                                                        <p className="text-[#3378cc] font-bold text-base">{clause.label}</p>
                                                        <p className="text-gray-400 text-sm">Nội dung: {clause.value.length > 200 ? `${clause.value.substring(0, 200)}...` : clause.value}</p>
                                                        <p className="text-gray-400 text-sm">
                                                            Ngày tạo: {dayjs(new Date(
                                                                clause.createdAt[0],
                                                                clause.createdAt[1] - 1,
                                                                clause.createdAt[2]
                                                            )).format("DD/M/YYYY")}
                                                        </p>


                                                    </div>
                                                </div>
                                            }
                                        />
                                    </List.Item>

                                </Popover>
                            )}
                        />

                    </div>
                    <Modal
                        title="Thêm điều khoản"
                        open={isModalOpenAdd}
                        onCancel={() => {
                            formCreate.resetFields();
                            setIsModalOpenAdd(false);
                        }}
                        footer={null}
                        width={600}
                    >
                        <Form
                            form={formCreate}
                            layout="vertical"
                            onFinish={(values) => {
                                handleSubmitAddClause(values)
                            }}
                        >
                            <Form.Item
                                name="label"
                                label="Tên điều khoản"
                                rules={[
                                    { required: true, whitespace: true, message: "Vui lòng nhập tên điều khoản!" }
                                ]}
                            >
                                <Input placeholder="Nhập tên điều khoản" />
                            </Form.Item>


                            <Form.Item
                                name="type"
                                label="Loại điều khoản"
                                rules={[{ required: true, message: "Vui lòng chọn loại điều khoản!" }]}
                            >
                                <Select placeholder="Chọn loại điều khoản">
                                    {typeData?.data.map(item => (
                                        <Option key={item.original_term_id} value={item.original_term_id}>
                                            {item.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>


                            <Form.Item
                                name="value"
                                label="Nội dung"
                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập mô tả!" }]}
                            >
                                <Input.TextArea rows={5} />
                            </Form.Item>


                            <Form.Item>
                                <Button type="primary" htmlType="submit">
                                    Tạo Điều Khoản
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>

                    <Modal
                        title="Cập nhật điều khoản"
                        open={isModalOpenClause}
                        onCancel={() => {
                            setIsModalOpenClause(false)
                        }}
                        footer={null}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={(values) => handleSubmitUpdateClause(values)}
                        >
                            <Form.Item
                                name="id"
                            />

                            <Form.Item
                                name="label"
                                label="Tên điều khoản"
                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên điều khoản!" }]}
                            >
                                <Input placeholder="Nhập tên điều khoản" />
                            </Form.Item>

                            <Form.Item
                                name="value"
                                label="Nội dung"
                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập mô tả!" }]}
                            >
                                <Input.TextArea rows={5} />
                            </Form.Item>


                            <Form.Item>
                                <Button loading={loadingUpdate} type="primary" htmlType="submit">
                                    Cập Nhật Điều Khoản
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>
                </TabPane>

                {/* Tab Căn cứ Pháp Lý */}
                <TabPane tab="Căn cứ Pháp Lý" key="2">
                    {/** Gọi component quản lý căn cứ pháp lý */}
                    <div className="p-4 min-h-[100vh]">
                        <div className='font-bold mb-10 text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                            <div className="flex items-center gap-4">
                                QUẢN LÝ CĂN CỨ PHÁP LÝ
                            </div>
                        </div>
                        <div className='flex gap-4 items-center'>
                            <Search
                                placeholder="Tìm kiếm tên căn cứ"
                                onSearch={setSearchTermLegal}
                                enterButton="Tìm kiếm"
                                allowClear
                                className="mb-4 max-w-[800px]"
                            />

                            <Button
                                onClick={handleSortByCreatedAtLegal}
                                className="mb-4 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow-md transition duration-200"
                            >
                                {/* Sắp xếp theo Ngày tạo */}
                                {sortOrderClause === 'asc' ? 'Cũ nhất' : 'Mới nhất'}
                            </Button>
                            <div className='flex justify-end w-full gap-4'>
                                <Button
                                    type="primary"
                                    onClick={openAddLagelModal}
                                    className="mb-4"
                                    icon={<PlusCircleFilled />}
                                >
                                    Thêm Căn cứ
                                </Button>
                            </div>
                        </div>

                        <Modal
                            title="Thêm Căn cứ Pháp Lý"
                            open={isModalOpenAddLegal}
                            onCancel={() => {
                                formCreateLegal.resetFields();
                                setIsModalOpenAddLegal(false)
                            }}
                            footer={null}
                        >
                            <Form
                                form={formCreateLegal}
                                layout="vertical"
                                onFinish={(values) => {
                                    handleSubmitAddClause(values)
                                }}
                                initialValues={{
                                    type: 8,
                                }}
                            >
                                <Form.Item name="type" hidden>
                                    <Input />
                                </Form.Item>

                                <Form.Item
                                    name="label"
                                    label="Tên căn cứ"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên căn cứ!" }]}
                                >
                                    <Input placeholder="Nhập tên căn cứ" />
                                </Form.Item>

                                <Form.Item
                                    name="value"
                                    label="Nội dung"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung!" }]}
                                >
                                    <Input.TextArea rows={5} />
                                </Form.Item>

                                <Form.Item>
                                    <Button loading={loadingCreate} type="primary" htmlType="submit">
                                        Tạo Căn cứ
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Modal>
                        <Modal
                            title="Cập Nhật Căn cứ"
                            open={isModalOpenLegal}
                            onCancel={() => {
                                form.resetFields();
                                setIsModalOpenLegal(false)
                            }}
                            footer={null}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={(values) => {
                                    handleSubmitUpdateClause(values)
                                }}
                                initialValues={{
                                    type: 8,
                                }}
                            >
                                <Form.Item name="type" hidden>
                                    <Input type="hidden" />
                                </Form.Item>

                                <Form.Item
                                    name="id"
                                />
                                <Form.Item
                                    name="label"
                                    label="Tên căn cứ"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên căn cứ!" }]}
                                >
                                    <Input placeholder="Nhập tên căn cứ" />
                                </Form.Item>

                                <Form.Item
                                    name="value"
                                    label="Nội dung"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung!" }]}
                                >
                                    <Input.TextArea rows={5} />
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit">
                                        Cập Nhật Căn cứ
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Modal>
                        <List
                            itemLayout="horizontal"
                            pagination={{
                                current: pageLegal + 1,
                                pageSize: pageSizeLegal,
                                total: legalData?.data?.totalElements || 0,
                                onChange: (newPage, newPageSize) => {
                                    handlePageChange(newPage, newPageSize)
                                },
                            }}
                            dataSource={sortedLegal}
                            renderItem={clause => (
                                <Popover
                                    content={
                                        <Card
                                            bordered
                                            className="shadow-lg rounded-lg"
                                            style={{ width: 550, borderColor: "#d1d5db" }}
                                        >
                                            <p className="text-blue-600 text-base font-bold">{clause.label.toUpperCase()}</p>
                                            <div className="mt-2 space-y-1 flex flex-col gap-2">
                                                <p>
                                                    <Text strong>Mã: </Text> {clause.clauseCode}
                                                </p>
                                                <p>
                                                    <Text strong>Loại: </Text> <Tag color={colorMap[clause.type] || "default"} className="w-fit">
                                                        {clause.type}
                                                    </Tag>
                                                </p>
                                                <p>
                                                    <Text strong>Nội dung: </Text> {clause.value}
                                                </p>
                                                <p>
                                                    <Text strong>Ngày tạo: </Text> {dayjs(new Date(
                                                        clause.createdAt[0],
                                                        clause.createdAt[1] - 1,
                                                        clause.createdAt[2]
                                                    )).format("DD/M/YYYY")}
                                                </p>
                                            </div>
                                        </Card>
                                    }
                                    placement="bottomRight"
                                    trigger="hover"
                                >
                                    <List.Item
                                        // onClick={() => showModal(clause)}
                                        className="hover:shadow-lg rounded-md shadow-sm mb-2 cursor-pointer"
                                        actions={[
                                            <div className="flex flex-col items-center gap-2 mr-3">
                                                <div className="flex gap-3 mb-3">
                                                    <Button
                                                        type="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateLegal(clause.clauseCode);
                                                        }}
                                                        className="flex items-center justify-center"

                                                    >
                                                        <EditFilled />
                                                    </Button>
                                                    <Button
                                                        danger
                                                        type="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(clause.id);
                                                        }}
                                                        className="flex items-center justify-center"
                                                        loading={loadingDelete}
                                                    >
                                                        <DeleteFilled />
                                                    </Button>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm mb-2">{calculateDaysAgo(clause.createdAt)}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-sm mb-2">Có {clause.contractCount} hợp đồng đang dùng căn cứ này</p>
                                                </div>
                                            </div>,


                                        ]}
                                    >
                                        <List.Item.Meta
                                            className="px-7 py-4"
                                            title={
                                                <div className="flex flex-row items-center gap-8">
                                                    <div className=" flex flex-col items-center">
                                                        <p>Mã CC</p>
                                                        <p className="font-bold text-base">{clause.clauseCode}</p>
                                                    </div>
                                                    <div className="flex flex-col gap-[6px]">
                                                        <Tag color={colorMap[clause.type] || "default"} className="w-fit">
                                                            {clause.type}
                                                        </Tag>
                                                        <p className="text-[#3378cc] font-bold text-base">{clause.label}</p>
                                                        <p className="text-gray-400 text-sm">Nội dung: {clause.value.length > 200 ? `${clause.value.substring(0, 200)}...` : clause.value}</p>
                                                        <p className="text-gray-400 text-sm">Ngày tạo: {dayjs(new Date(
                                                            clause.createdAt[0],
                                                            clause.createdAt[1] - 1,
                                                            clause.createdAt[2]
                                                        )).format("DD/M/YYYY")}</p>
                                                    </div>
                                                </div>
                                            }
                                        />
                                    </List.Item>
                                </Popover>
                            )}
                        />
                    </div>
                </TabPane>
                <TabPane tab="Loại Hợp Đồng" key="3">
                    <div className="p-6 min-h-[100vh] ">
                        {/* Tiêu đề */}
                        <div className='font-bold mb-10 text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                            <div className="flex items-center gap-4">
                                QUẢN LÝ LOẠI HỢP ĐỒNG
                            </div>
                        </div>
                        {/* Nút Thêm Loại Hợp Đồng */}
                        <div className="mb-6 flex justify-end">
                            <Button loading={loadingCreateType} icon={<PlusCircleFilled />} type="primary" onClick={handleAddContractType}>
                                Thêm Loại Hợp Đồng
                            </Button>
                        </div>
                        <Modal
                            title="Thêm Loại Hợp Đồng"
                            open={isModalOpenAddContractType}
                            onCancel={() => {
                                form.resetFields();
                                setIsModalOpenAddContractType(false)
                            }}
                            onOk={handleOkAdd}
                            confirmLoading={loadingCreate}
                            okText="Lưu"
                            cancelText="Hủy"
                        >

                            <Form form={form} layout="vertical">
                                <Form.Item
                                    label="Tên Loại Hợp Đồng"
                                    name="name"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên loại hợp đồng!" }]}
                                >
                                    <Input placeholder="Ví dụ: Hợp đồng thuê phần mềm" />
                                </Form.Item>
                            </Form>
                        </Modal>

                        {/* Modal Sửa */}
                        <Modal
                            title="Chỉnh Sửa Loại Hợp Đồng"
                            open={isModalOpenContractType}
                            onCancel={() => setIsModalOpenContractType(false)}
                            onOk={handleOkEdit}
                            confirmLoading={loadingEdit}
                            okText="Cập nhật"
                            cancelText="Hủy"
                        >
                            <Form form={form} layout="vertical">
                                <Form.Item
                                    label="Tên Loại Hợp Đồng"
                                    name="name"
                                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên loại hợp đồng!" }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Form>
                        </Modal>
                        {/* Bọc List trong div có lề trái */}
                        <div>
                            <List
                                dataSource={typeContractData}
                                renderItem={(item, index) => (
                                    <>
                                        <List.Item
                                            actions={[
                                                <Button type='primary' icon={<EditFilled />} onClick={() => handleEditContractType(item)}>
                                                    Sửa
                                                </Button>,
                                            ]}
                                            className=" shadow-md border rounded-lg p-4 m-3"
                                        >
                                            <List.Item.Meta
                                                title={<span className="ml-4 font-semibold text-lg">{item.name}</span>}
                                            />
                                        </List.Item>

                                        {/* Divider hiển thị sau mỗi item trừ item cuối cùng */}
                                        {index !== typeContractData.length - 1 && <Divider style={{ margin: 0 }} />}
                                    </>
                                )}
                            />
                        </div>

                    </div>
                </TabPane>

                {/* Add Import Button */}


                {/* Import Modal */}


            </Tabs>
            <Modal
                title="Tải lên File Điều Khoản"
                open={isModalOpenImport}
                onCancel={() => setIsModalOpenImport(false)}
                footer={null}
            >
                <Form
                    form={formImport}
                    layout="vertical"
                    onFinish={handleImportFile}
                >
                    <Button
                        className='my-3'
                        icon={<DownloadOutlined />}
                        type="link"
                        href="https://res.cloudinary.com/dret7pl7j/raw/upload/v1744610186/term_test_cwltv4.xlsx"
                        download
                    >
                        Tải xuống file mẫu
                    </Button>

                    <Form.Item
                        name="type"
                        label="Loại Điều Khoản"
                        rules={[{ required: true, message: "Vui lòng chọn loại điều khoản!" }]}
                    >
                        <Select placeholder="Chọn loại điều khoản">
                            {typeData?.data.map(item => (
                                <Option key={item.original_term_id} value={item.original_term_id}>
                                    {item.name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="file"
                        label="Tải lên File"
                        valuePropName="fileList"
                        getValueFromEvent={e => Array.isArray(e) ? e : e && e.fileList}
                        rules={[{ required: true, message: "Vui lòng tải lên file!" }]}
                    >
                        <Upload
                            beforeUpload={() => false}
                            accept=".xlsx"
                            maxCount={1}
                        >
                            <Button icon={<UploadOutlined />}>Chọn File</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" loading={loadingUploadFile} htmlType="submit">
                            Tải lên
                        </Button>

                    </Form.Item>
                </Form>
            </Modal>
        </ConfigProvider>
    );
};

export default ManageClause;