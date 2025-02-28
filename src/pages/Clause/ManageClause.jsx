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
// theem ngayf tao va sorter theo do
const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const ManageClause = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [sortOrder, setSortOrder] = useState('ascend');
    const [activeTab, setActiveTab] = useState("1");
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState("10");
    const [isModalOpenClause, setIsModalOpenClause] = useState(false);
    const [isModalOpenLegal, setIsModalOpenLegal] = useState(false);
    const [isModalOpenAdd, setIsModalOpenAdd] = useState(false);
    const [isModalOpenAddLegal, setIsModalOpenAddLegal] = useState(false);
    const { data: clauseData, isLoading: loadingClause, isError: DataError, refetch: refetchClause } = useGetClauseManageQuery({
        keyword: searchTerm,
        typeTermIds: selectedType,
        page,
        size: pageSize
    });
    const { data: legalData, isLoading: loadingLegal, refetch: refetchLegal } = useGetLegalQuery({ page: 0, size: 10 });
    const { data: typeData, isLoading: loadingType } = useGetAllTypeClauseQuery();
    const [createClause, { isLoading: loadingCreate }] = useCreateClauseMutation();
    const [updateClause, { isLoading: loadingUpdate }] = useUpdateClauseMutation();
    const [deleteClause, { isLoading: loadingDelete }] = useDeleteClauseMutation();
    const [form] = Form.useForm();


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

    const calculateDaysAgo = (createdAt) => {
        const createdDate = convertToDate(createdAt);
        const today = new Date();
        const differenceInMs = today - createdDate;
        const differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
        return differenceInDays === 0 ? "Được tạo hôm nay" : `Được tạo ${differenceInDays} ngày trước`;
    };


    // Sắp xếp dữ liệu theo createdAt dựa vào sortOrder
    const sortedClause = clauseData?.data?.content
        ?.slice()
        .filter(item => !item.isDelete)

    console.log("Total items:", sortedClause || 0);

    const sortedLegal = legalData?.data?.content
        ?.slice()
        .filter(item => !item.isDelete)
        .sort((a, b) => {
            const dateA = new Date(...a.createdAt);
            const dateB = new Date(...b.createdAt);
            return sortOrder === 'ascend' ? dateA - dateB : dateB - dateA;
        });

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
            form.setFieldsValue(clauseToEdit);

            setIsModalOpenLegal(true); // Hiển thị modal
        } else {
            message.error('Không tìm thấy Căn căn cứ!');
        }
    };

    const openAddClauseModal = () => {
        form.resetFields();
        setIsModalOpenAdd(true);
    };
    const openAddLagelModal = () => {
        form.resetFields();
        setIsModalOpenAddLegal(true);
    };

    useEffect(() => {

        refetchLegal();
    }, []);

    const handleSubmitAddClause = async (values) => {
        console.log('Form data:', values);
        try {
            const result = await createClause({ idType: values.type, label: values.label, value: values.value }).unwrap();
            message.success("Tạo điều khoản thành công");
            refetchClause();
            refetchLegal();
            setIsModalOpenAdd(false);
            setIsModalOpenAddLegal(false);
            form.resetFields();
        } catch (error) {
            console.error("Lỗi tạo điều khoản:", error);
            message.error("Có lỗi xảy ra khi tạo điều khoản");
        }
    };

    const handleSubmitUpdateClause = async (values) => {
        console.log('Form data:', values);
        try {
            const updatedData = await updateClause({ termId: values.id, label: values.label, value: values.value }).unwrap();
            console.log(updatedData);
            message.success("Cập nhật điều khoản thành công!");
            setIsModalOpenClause(false);
            setIsModalOpenLegal(false);
            refetchLegal();
            refetchClause()
            form.resetFields();
        } catch (error) {
            console.error("Lỗi cập nhật điều khoản:", error);
            message.error("Có lỗi xảy ra khi cập nhật điều khoản!");
        }
    };

    const handleDelete = async (contractId) => {
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
        setSortOrder(sortOrder === 'ascend' ? 'descend' : 'ascend');
    };


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
                                Quản Lý Điều Khoản
                            </div>
                        </div>
                        <div className='flex w-5/5 gap-4'>
                            <Search
                                placeholder="Tìm kiếm tên điều khoản"
                                onSearch={setSearchTerm}
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
                            <Button
                                type="primary"
                                onClick={openAddClauseModal}
                                className="mb-4 justify-self-end"
                            >
                                + Thêm điều khoản
                            </Button>
                            {/* Nút sắp xếp theo Ngày tạo */}
                            <Button
                                onClick={handleSortByCreatedAt}
                                className="mb-4 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow-md transition duration-200"
                            >
                                Sắp xếp theo Ngày tạo
                                {sortOrder === 'ascend' ? <FaSortUp size={16} /> : <FaSortDown size={16} />}
                            </Button>
                        </div>
                        <Modal
                            title="Thêm điều khoản"
                            open={isModalOpenAdd}
                            onCancel={() => setIsModalOpenAdd(false)}
                            footer={null}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={(values) => handleSubmitAddClause(values)}
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
                            onCancel={() => setIsModalOpenClause(false)}
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
                                        Cập Nhật Điều Khoản
                                    </Button>
                                </Form.Item>
                            </Form>
                        </Modal>
                        <List
                            itemLayout="horizontal"
                            pagination={{
                                current: page + 1,
                                pageSize: pageSize,
                                total: clauseData?.data?.totalElements || 0,
                                onChange: (newPage, newPageSize) => {
                                    console.log("Page changed:", newPage, "PageSize:", newPageSize);
                                    setPage(newPage - 1);
                                    setPageSize(newPageSize);
                                },
                            }}
                            dataSource={sortedClause}
                            renderItem={clause => (
                                <Popover
                                    content={
                                        <Card
                                            bordered
                                            className="shadow-lg rounded-lg"
                                            style={{ width: 320, backgroundColor: "#f9fafb", borderColor: "#d1d5db" }}
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
                                    placement="top-right"
                                    trigger="hover"
                                >
                                    <List.Item
                                        style={{ cursor: 'default' }}
                                        onClick={() => showModal(clause)}
                                        className="hover:shadow-lg rounded-md shadow-sm mb-2 cursor-pointer"
                                        actions={[
                                            <div className="flex flex-col justify-center gap-y-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateClause(clause.clauseCode);
                                                        }}
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
                                                    >
                                                        <DeleteFilled />
                                                    </Button>
                                                </div>
                                                <p>{calculateDaysAgo(clause.createdAt)}</p>
                                            </div>,
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
                        {/* <Pagination
                            current={page + 1}
                            pageSize={pageSize}
                            total={clauseData?.data?.length}
                            onChange={(newPage, newPageSize) => {
                                setPage(newPage - 1);
                                setPageSize(newPageSize);
                            }}
                            className="mt-4"
                        /> */}
                    </div>
                </TabPane>

                {/* Tab Căn cứ Pháp Lý */}
                <TabPane tab="Căn cứ Pháp Lý" key="2">
                    {/** Gọi component quản lý căn cứ pháp lý */}
                    <div className="p-4 min-h-[100vh]">
                        <div className='font-bold mb-10 text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                            <div className="flex items-center gap-4">
                                Quản Lý Căn Cứ Pháp Lý
                            </div>
                        </div>
                        <div className='flex w-3/5 gap-4'>
                            <Search
                                placeholder="Tìm kiếm tên căn cứ"
                                onSearch={setSearchTerm}
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
                                onClick={handleSortByCreatedAt}
                                className="mb-4 flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow-md transition duration-200"
                            >
                                Sắp xếp theo Ngày tạo
                                {sortOrder === 'ascend' ? <FaSortUp size={16} /> : <FaSortDown size={16} />}
                            </Button>
                        </div>
                        <Modal
                            title="Thêm Căn cứ Pháp Lý"
                            open={isModalOpenAddLegal}
                            onCancel={() => setIsModalOpenAddLegal(false)}
                            footer={null}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={(values) => handleSubmitAddClause(values)}
                                initialValues={{
                                    type: 8,
                                }}
                            >
                                <Form.Item
                                    name="label"
                                    label="Tên căn cứ"
                                    rules={[{ required: true, message: "Vui lòng nhập tên căn cứ!" }]}
                                >
                                    <Input placeholder="Nhập tên căn cứ" />
                                </Form.Item>

                                <Form.Item name="type" style={{ display: "none" }}>
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
                            onCancel={() => setIsModalOpenLegal(false)}
                            footer={null}
                        >
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={(values) => handleSubmitUpdateClause(values)}
                                initialValues={{
                                    type: 8,
                                }}
                            >
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
                            dataSource={sortedLegal}
                            renderItem={clause => (
                                <Popover
                                    content={
                                        <Card
                                            bordered
                                            className="shadow-lg rounded-lg"
                                            style={{ width: 320, backgroundColor: "#f9fafb", borderColor: "#d1d5db" }}
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
                                    placement="top-right"
                                    trigger="hover"
                                >
                                    <List.Item
                                        onClick={() => showModal(clause)}
                                        className="hover:shadow-lg rounded-md shadow-sm mb-2 cursor-pointer"
                                        actions={[
                                            <div className="flex flex-col justify-center gap-y-2">
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleUpdateLegal(clause.clauseCode);
                                                        }}
                                                    >
                                                        <GrUpdate />
                                                    </Button>
                                                    <Button
                                                        danger
                                                        type="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(clause.original_term_id);
                                                        }}
                                                    >
                                                        <DeleteFilled />
                                                    </Button>
                                                </div>
                                                <p>Xóa {clause.daysDeleted} ngày trước</p>
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