import React, { useState } from 'react';
import { Input, Button, Modal, List, Select, message, Skeleton, Card, Empty, Image, Tag, Popover, Typography, Form } from 'antd';
import 'tailwindcss/tailwind.css';
import { DeleteFilled } from '@ant-design/icons';
import { GrUpdate } from "react-icons/gr";
import { useGetClauseManageQuery } from '../../services/ClauseAPI';
import TrashIcon from '../../assets/Image/delete.svg';
import { useGetContractTypeQuery } from '../../services/ContractAPI';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Search } = Input;

const ManageClause = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { data: clauseData, isLoading: loadingClause, isError: DataError } = useGetClauseManageQuery();
    const { data: typeData, isLoading: loadingType } = useGetContractTypeQuery();
    const [form] = Form.useForm();
    console.log(typeData);
    const filteredClause = clauseData?.filter(contract =>
        contract.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (selectedType ? contract.type === selectedType : true)
    );

    const colorMap = {
        "General Clause": "blue",
        "Warranty Clause": "green",
        "Financial Clause": "volcano",
        "Other Clause": "purple",
    };

    const handleUpdate = (id) => {
        const clauseToEdit = clauseData.find(clause => clause.id === id);

        if (clauseToEdit) {
            form.setFieldsValue(clauseToEdit); // Đặt dữ liệu vào form
            setIsModalVisible(true); // Hiển thị modal
        } else {
            message.error('Không tìm thấy điều khoản!');
        }
    };


    const openAddClauseModal = () => {
        setIsModalOpen(true);
    };

    const handleDelete = (contractId) => {
        Modal.confirm({
            title: 'Bạn có chắc muốn xóa điều khoản này không?',
            onOk: () => {
                // Logic để xóa hợp đồng
                message.success('Xóa thành công');
            },
        });
    };

    if (loadingClause) return <Skeleton active />;
    if (DataError) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;
    return (
        <div className="p-4 min-h-[100vh]">
            {/* Sửa nested <p> thành <div> */}
            <div className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                <div className="flex items-center gap-4">
                    Quản Lý Điều Khoản
                </div>
            </div>
            <div className='flex w-3/5 gap-4'>
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
                    onChange={setSelectedType}
                    className="mb-4 max-w-[250px] min-w-[170px]"
                    allowClear
                >
                    {[...new Set(clauseData?.map(contract => contract.type))].map((type, index) => (
                        <Option key={index} value={type}>{type}</Option>
                    ))}
                </Select>
                <Button
                    type="primary"
                    onClick={openAddClauseModal}
                    className="mb-4"
                >
                    + Thêm điều khoản
                </Button>
            </div>
            <Modal
                title="Thêm điều khoản"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={form} layout="vertical" >
                    <Form.Item
                        name="name"
                        label="Tên điều khoản"
                        rules={[{ required: true, message: "Vui lòng nhập tên điều khoản!" }]}
                    >
                        <Input placeholder="Nhập tên điều khoản" />
                    </Form.Item>

                    <Form.Item name="type" label="Loại điều khoản">
                        <Select placeholder="Chọn loại điều khoản">
                            {typeData?.contractTypes.map(item => (
                                <Select.Option key={item} value={item}>
                                    {item}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>


                    <Form.Item
                        name="content"
                        label="Nội dung"
                        rules={[{ required: true, message: "Vui lòng nhập mô tả!" }]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>


                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Tạo Task
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            <List
                itemLayout="horizontal"
                dataSource={filteredClause}
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
                                        <Text strong>Tên: </Text> {clause.name}
                                    </p>
                                    <p>
                                        <Text strong>Nội dung: </Text> {clause.content}
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
                                                handleUpdate(clause.id);
                                            }}
                                        >
                                            <GrUpdate />
                                        </Button>
                                        <Button
                                            danger
                                            type="primary"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(clause.id);
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
                                        {/* Cột mã điều khoản */}
                                        <div className=" flex flex-col items-center">
                                            <p>Mã ĐK</p>
                                            <p className="font-bold text-base">{clause.clauseCode}</p>
                                        </div>
                                        {/* Cột thông tin điều khoản (loại và tên) */}
                                        <div className="flex flex-col gap-[6px]">
                                            <Tag color={colorMap[clause.type] || "default"} className="w-fit">
                                                {clause.type}
                                            </Tag>
                                            <p className="text-[#3378cc] font-bold text-base">{clause.name}</p>
                                            <p className="text-gray-400 text-sm">Nội dung: {clause.content}</p>
                                        </div>
                                    </div>
                                }
                            />
                        </List.Item>

                    </Popover>
                )}
            />
        </div>
    );
};

export default ManageClause;
