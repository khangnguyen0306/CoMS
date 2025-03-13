// isDelete sẽ có 3 trạng thái : đang hoạt động, đã xóa(khi user xóa đk), đã cũ(khi user edit thì đk cũ sẽ chuyển sang trạng thái đã cũ và tạo đk mới)
import React, { useState, useEffect } from 'react';
import { Input, Button, Modal, List, Select, message, Skeleton, Card, Empty, ConfigProvider, Tag, Popover, Typography, Form, Tabs, Pagination } from 'antd';
import 'tailwindcss/tailwind.css';
import { DeleteFilled, EditFilled } from '@ant-design/icons';
import { GrUpdate } from "react-icons/gr";
import { useGetClauseManageQuery } from '../../services/ClauseAPI';
import { useGetAllTypeClauseQuery, useCreateClauseMutation, useUpdateClauseMutation, useGetLegalQuery, useDeleteClauseMutation } from '../../services/ClauseAPI';
import TabPane from 'antd/es/tabs/TabPane';
import dayjs from 'dayjs';
import { FaSortDown, FaSortUp } from 'react-icons/fa';
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

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
    const { data: clauseData, isLoading: loadingClause, isError: DataError, refetch: refetchClause } = useGetClauseManageQuery({
        keyword: searchTermClause,
        typeTermIds: selectedType,
        page: pageClause,
        size: pageSizeClause,
        order: sortOrderClause,
        sortBy: sortByClause
    });
    const { data: legalData, isLoading: loadingLegal, refetch: refetchLegal } = useGetLegalQuery({ page: pageLegal, size: pageSizeLegal, keyword: searchTermLegal, order: sortOrderLegal });
    const { data: typeData, isLoading: loadingType } = useGetAllTypeClauseQuery();
    const [createClause, { isLoading: loadingCreate }] = useCreateClauseMutation();
    const [updateClause, { isLoading: loadingUpdate }] = useUpdateClauseMutation();
    const [deleteClause, { isLoading: loadingDelete }] = useDeleteClauseMutation();
    const [form] = Form.useForm();
    console.log(typeData);


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
            setPageClause(0);
            form.setFieldsValue(clauseToEdit);

            setIsModalOpenClause(true); // Hiển thị modal
        } else {
            message.error('Không tìm thấy điều khoản!');
        }
    };

    const handleUpdateLegal = (clauseCode) => {
        const clauseToEdit = legalData?.data?.content?.find(clause => clause.clauseCode === clauseCode);
        console.log(clauseToEdit);
        if (clauseToEdit) {
            setSortOrderLegal('desc');
            form.setFieldsValue(clauseToEdit);

            setIsModalOpenLegal(true); // Hiển thị modal
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


    const handleSubmitAddClause = async (values) => {
        console.log('Form data:', values);
        try {
            const result = await createClause({ typeTermId: values.type, label: values.label, value: values.value }).unwrap();
            message.success("Tạo điều khoản thành công");
            refetchClause();
            refetchLegal();
            // setPageClause(0);
            setIsModalOpenAdd(false);
            setIsModalOpenAddLegal(false);
            form.resetFields();
        } catch (error) {
            console.error("Lỗi tạo điều khoản:", error);
            message.error("Có lỗi xảy ra khi tạo điều khoản");
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
        console.log('Form data:', values);
        try {
            const typeTermId = getTypeTermId(values.type);
            console.log('Type term ID:', typeTermId);
            const updatedData = await updateClause({ termId: values.id, label: values.label, value: values.value, typeTermId: typeTermId }).unwrap();
            console.log(updatedData);
            message.success("Cập nhật điều khoản thành công!");
            refetchClause();
            console.log(pageClause)
            refetchLegal();
            setIsModalOpenClause(false);
            setIsModalOpenLegal(false);
            form.resetFields();
        } catch (error) {
            console.error("Lỗi cập nhật điều khoản:", error);
            message.error("Có lỗi xảy ra khi cập nhật điều khoản!");
            setIsModalOpenClause(false);
            setIsModalOpenLegal(false);
        }
    };

    const handleDelete = async (contractId) => {
        console.log("Delete contract ID:", contractId);
        Modal.confirm({
            title: 'Bạn có chắc muốn xóa không?',
            onOk: async () => {
                try {
                    const result = await deleteClause({ termId: contractId });
                    if (result.error.originalStatus == 200) {
                        refetchClause();
                        refetchLegal();
                        message.success('Xóa thành công');
                    } else
                        message.error('Xóa thất bại vui lòng thử lại');

                }
                catch (error) {
                    console.error("Error during delete:", error);
                    message.error('Xóa thất bại, vui lòng thử lại!');
                }
            },
        });
    };


    const handleSortByCreatedAt = () => {
        console.log("Sort order:", sortOrderClause);
        setSortByClause('id');
        setSortOrderClause(sortOrderClause === 'asc' ? 'desc' : 'asc');
    };

    const handleSortByContractCount = () => {

        setSortByClause('contractCount');
        setSortOrderClause(sortOrderClause === 'asc' ? 'desc' : 'asc');
    };

    const handleSortByCreatedAtLegal = () => {
        setSortOrderLegal(sortOrderLegal === 'asc' ? 'desc' : 'asc');
    };
    const handlePageChange = (newPage, newPageSize) => {
        console.log("Page changed:", newPage, "PageSize:", newPageSize);
        setPageLegal(newPage - 1);
        setPageSizeLegal(newPageSize);
    }
    const handlePageClauseChange = (newPage, newPageSize) => {
        console.log("Page changed:", newPage, "PageSize:", newPageSize);
        setPageClause(newPage - 1);
        setPageSizeClause(newPageSize);
    }


    if (loadingClause || loadingType || loadingLegal) return <Skeleton active />;
    // if (DataError) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;
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
                        <div className='flex justify-between w-full gap-4'>
                          
                            <div className='flex gap-2 w-[80%]'>
                            <Search
                                placeholder="Tìm kiếm tên điều khoản"
                                onSearch={setSearchTermClause}
                                enterButton="tìm kiếm"
                                allowClear
                                className="mb-4 max-w-[350px]"
                            />
                                <Select
                                    placeholder="Chọn loại điều khoản"
                                    value={selectedType}
                                    onChange={(value) => setSelectedType(value || "")}
                                    className="mb-4 max-w-[250px] min-w-[170px]"
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
                                <button
                                    onClick={handleSortByContractCount}
                                    className={`mb-4 h-[32px] flex items-center gap-2 font-semibold py-2 px-4 rounded shadow-md transition duration-200 ${sortByClause === 'contractCount'
                                        ? sortOrderClause === 'asc'
                                            ? 'bg-red-500 hover:bg-red-600'
                                            : 'bg-blue-500 hover:bg-blue-600'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                        }`}
                                >
                                    <span className="text-white">
                                        {sortByClause === 'contractCount'
                                            ? sortOrderClause === 'asc'
                                                ? 'Ít hợp đồng nhất'
                                                : 'Nhiều hợp đồng nhất'
                                            : 'Sắp xếp theo số hợp đồng'}
                                    </span>
                                </button>
                            </div>
                            <Button
                                type="primary"
                                onClick={openAddClauseModal}
                                className="mb-4 justify-self-end"
                            >
                                + Thêm điều khoản
                            </Button>
                        </div>

                        <Modal
                            title="Thêm điều khoản"
                            open={isModalOpenAdd}
                            onCancel={() => {
                                form.resetFields();
                                setIsModalOpenAdd(false);
                            }}
                            footer={null}
                            afterOpenChange={(open) => {
                                if (open) form.resetFields();
                            }}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={(values) => {
                                    form.resetFields();
                                    handleSubmitAddClause(values)
                                }}
                            >
                                <Form.Item
                                    name="label"
                                    label="Tên điều khoản"
                                    rules={[{ required: true, message: "Vui lòng nhập tên điều khoản!" }]}
                                >
                                    <Input placeholder="Nhập tên điều khoản" />
                                </Form.Item>

                                <Form.Item name="type" label="Loại điều khoản">
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
                                    rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
                                >
                                    <Input.TextArea rows={4} />
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
                                form.resetFields();
                                setIsModalOpenClause(false)
                            }}
                            footer={null}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={(values) => {
                                    form.resetFields();
                                    handleSubmitUpdateClause(values)
                                }}
                            >
                                <Form.Item
                                    name="id"
                                />

                                <Form.Item
                                    name="label"
                                    label="Tên điều khoản"
                                    rules={[{ required: true, message: "Vui lòng nhập tên điều khoản!" }]}
                                >
                                    <Input placeholder="Nhập tên điều khoản" />
                                </Form.Item>

                                <Form.Item
                                    name="type"
                                    label="Loại điều khoản"
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
                                    rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
                                >
                                    <Input.TextArea rows={4} />
                                </Form.Item>


                                <Form.Item>
                                    <Button type="primary" htmlType="submit">
                                        Cập Nhật Điều Khoản
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Modal>
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
                                            className="shadow-lg rounded-lg"
                                            style={{ width: 550, borderColor: "#d1d5db" }}
                                        >
                                            <Title level={4} className="text-blue-600">Chi tiết điều khoản</Title>
                                            <div className="mt-2 space-y-1">
                                                <p>
                                                    <Text strong>Mã: </Text> {clause.clauseCode}
                                                </p>
                                                <p>
                                                    <Text strong>Loại: </Text> <Tag color={colorMap[clause.type] || "default"} className="w-fit">
                                                        {clause.type}
                                                    </Tag>
                                                </p>
                                                <p>
                                                    <Text strong>Tên: </Text> {clause.label}
                                                </p>
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
                                                            console.log(clause)
                                                            handleDelete(clause.id);
                                                        }}
                                                        className="flex items-center justify-center"
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
                                                        <p className="text-gray-400 text-sm">Nội dung: {clause.value}</p>
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
                        <div className='flex w-3/5 gap-4'>
                            <Search
                                placeholder="Tìm kiếm tên căn cứ"
                                onSearch={setSearchTermLegal}
                                enterButton="Tìm kiếm"
                                allowClear
                                className="mb-4 max-w-[350px]"
                            />
                            <Button
                                type="primary"
                                onClick={openAddLagelModal}
                                className="mb-4"
                            >
                                + Thêm Căn cứ
                            </Button>
                            <Button
                                onClick={handleSortByCreatedAtLegal}
                                className="mb-4 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow-md transition duration-200"
                            >
                                {/* Sắp xếp theo Ngày tạo */}
                                {sortOrderClause === 'asc' ? 'Cũ nhất' : 'Mới nhất'}
                            </Button>
                        </div>
                        <Modal
                            title="Thêm Căn cứ Pháp Lý"
                            open={isModalOpenAddLegal}
                            onCancel={() => {
                                form.resetFields();
                                setIsModalOpenAddLegal(false)
                            }}
                            footer={null}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={(values) => {
                                    form.resetFields();
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
                                    rules={[{ required: true, message: "Vui lòng nhập tên căn cứ!" }]}
                                >
                                    <Input placeholder="Nhập tên căn cứ" />
                                </Form.Item>

                                <Form.Item
                                    name="value"
                                    label="Nội dung"
                                    rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
                                >
                                    <Input.TextArea rows={4} />
                                </Form.Item>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit">
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
                                    form.resetFields();
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
                                    rules={[{ required: true, message: "Vui lòng nhập tên căn cứ!" }]}
                                >
                                    <Input placeholder="Nhập tên căn cứ" />
                                </Form.Item>

                                <Form.Item
                                    name="value"
                                    label="Nội dung"
                                    rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
                                >
                                    <Input.TextArea rows={4} />
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
                                            <Title level={4} className="text-blue-600">Chi tiết căn cứ</Title>
                                            <div className="mt-2 space-y-1">
                                                <p>
                                                    <Text strong>Mã: </Text> {clause.clauseCode}
                                                </p>
                                                <p>
                                                    <Text strong>Loại: </Text> <Tag color={colorMap[clause.type] || "default"} className="w-fit">
                                                        {clause.type}
                                                    </Tag>
                                                </p>
                                                <p>
                                                    <Text strong>Tên: </Text> {clause.label}
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
                                                        <p className="text-gray-400 text-sm">Nội dung: {clause.value}</p>
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
            </Tabs>
        </ConfigProvider>
    );
};

export default ManageClause;