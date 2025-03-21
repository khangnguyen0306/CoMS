import React, { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, DatePicker, Select, message, Divider, Space, Spin, Modal } from 'antd';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import RichTextEditor from 'reactjs-tiptap-editor';
import 'reactjs-tiptap-editor/style.css';
import 'katex/dist/katex.min.css';
import { extensions } from "../../utils/textEditor";
import { debounce } from "lodash";
import { useCreateAppendixMutation, useCreateAppendixTypeMutation, useDeleteAppendixTypeMutation, useEditAppendixTypeMutation, useGetAllAppendixTypeQuery } from '../../services/AppendixAPI';
import { useLocation, useNavigate } from 'react-router-dom';
import { DeleteFilled, EditFilled, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

const ContractAppendixPage = () => {
    const [form] = Form.useForm();
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [content, setContent] = useState('');
    const [newTypeCreate, setNewTypeCreate] = useState('');
    const [createAppendix, { isLoading: LoadingCreate }] = useCreateAppendixMutation();
    const { data: appenditType, isLoading: isLoadingappendixType, refetch: refecthAppendixType } = useGetAllAppendixTypeQuery();
    const [createAppendixType, { isLoading: isLoadingCreateAppendixType }] = useCreateAppendixTypeMutation();
    const [updateAppendixType, { isLoading: isLoadingUpdateAppendixType }] = useEditAppendixTypeMutation();
    const [deleteAppendixType, { isLoading: isLoadingDeleteAppendixType }] = useDeleteAppendixTypeMutation();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const contractId = queryParams.get('contractId');

    // State cho modal
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [currentAppendixType, setCurrentAppendixType] = useState(null);
    const [editForm] = Form.useForm();

    const onValueChange = useCallback(
        debounce((value) => {
            setContent(value);
            form.setFieldsValue({ content: value });
        }, 300),
        []
    );

    const onNewTypeChange = (e) => {
        setNewTypeCreate(e.target.value);
    };

    useEffect(() => {
        return () => onValueChange.cancel();
    }, []);

    const addNewType = async () => {
        if (!newTypeCreate.trim()) return message.warning("Vui lòng nhập loại phụ lục!");
        try {
            const result = await createAppendixType({ name: newTypeCreate });
            if (result.error?.originalStatus === 200) {
                refecthAppendixType();
                setNewTypeCreate("");
                message.success("Thêm loại phụ lục thành công!");
            }
        } catch (error) {
            if (error.data === "exist") {
                message.error("Loại phụ lục đã tồn tại!");
            } else {
                message.error("Lỗi khi tạo loại phụ lục!");
            }
        }
    };

    const handleEdit = (id) => {
        const appendixType = appenditType.data.find(item => item.addendumTypeId === id);
        setCurrentAppendixType(appendixType);
        editForm.setFieldsValue({ name: appendixType.name });
        setIsEditModalVisible(true);
    };

    const handleDelete = (id) => {
        const appendixType = appenditType.data.find(item => item.addendumTypeId === id);
        setCurrentAppendixType(appendixType);
        setIsDeleteModalVisible(true);
    };

    const handleUpdate = async () => {
        try {
            const values = await editForm.validateFields();
            const result = await updateAppendixType({ id: currentAppendixType.addendumTypeId, name: values.name });
            if (result.error?.originalStatus === 200) {
                message.success("Cập nhật loại phụ lục thành công!");
                refecthAppendixType();
                setIsEditModalVisible(false);
            }
        } catch (error) {
            message.error("Lỗi khi cập nhật loại phụ lục!");
        }
    };

    const handleConfirmDelete = async () => {
        try {
            const result = await deleteAppendixType(currentAppendixType.addendumTypeId);
            console.log(result);
            if (result.data?.status === "OK") {
                message.success("Xóa loại phụ lục thành công!");
                refecthAppendixType();
                setIsDeleteModalVisible(false);
            }
        } catch (error) {
            message.error("Lỗi khi xóa loại phụ lục!");
        }
    };

    const onFinish = async (values) => {
        const appendixData = {
            ...values,
            contractId: contractId,
        };
        try {
            const result = await createAppendix(appendixData).unwrap();
            if (result.status === 'CREATED') {
                message.success('Phụ lục đã được tạo thành công!');
                navigate('/contract');
                form.resetFields();
            }
        } catch (error) {
            message.error(error?.data?.message);
        }
    };

    if (isLoadingappendixType) {
        return (
            <div className='flex justify-center items-center'>
                <Spin />
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-[#141414]' : ''}`}>
            <div className={`max-w-4xl mx-auto ${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5] border'} shadow-lg rounded-lg p-6`}>
                <h1 className="text-3xl font-bold mb-6 text-center">TẠO PHỤ LỤC HỢP ĐỒNG</h1>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Tên Phụ Lục"
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tên phụ lục!' }]}
                    >
                        <Input placeholder="Nhập tên phụ lục" />
                    </Form.Item>

                    <Form.Item
                        label="Ngày Hiệu Lực"
                        name="effectiveDate"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày hiệu lực!' }]}
                    >
                        <DatePicker
                            className="w-full"
                            disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Loại Phụ Lục"
                        name="addendumTypeId"
                        rules={[{ required: true, message: "Vui lòng chọn loại phụ lục!" }]}
                    >
                        <Select
                            placeholder="Chọn loại phụ lục"
                            options={appenditType?.data?.map((item) => ({
                                value: item.addendumTypeId,
                                label: (
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span>{item.name}</span>
                                        <Space>
                                            <Button
                                                type="text"
                                                icon={<EditFilled style={{ color: '#2196f3' }} />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEdit(item.addendumTypeId);
                                                }}
                                            />
                                            <Button
                                                type="text"
                                                danger
                                                icon={<DeleteFilled />}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(item.addendumTypeId);
                                                }}
                                            />
                                        </Space>
                                    </div>
                                ),
                            }))}
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    <Divider style={{ margin: "8px 0" }} />
                                    <Space style={{ padding: "0 8px 4px" }}>
                                        <Input
                                            placeholder="Nhập loại phụ lục mới"
                                            value={newTypeCreate}
                                            onChange={onNewTypeChange}
                                            onKeyDown={(e) => e.stopPropagation()}
                                        />
                                        <Button
                                            type="text"
                                            icon={<PlusOutlined />}
                                            onClick={addNewType}
                                            loading={isLoadingCreateAppendixType}
                                        >
                                            Thêm
                                        </Button>
                                    </Space>
                                </>
                            )}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Nội Dung"
                        name="content"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung phụ lục!' }]}
                    >
                        <RichTextEditor
                            output="html"
                            content={content}
                            onChangeContent={onValueChange}
                            extensions={extensions}
                            dark={isDarkMode}
                            hideBubble={true}
                            dense={false}
                            removeDefaultWrapper
                            placeholder="Nhập nội dung phụ lục tại đây..."
                            contentClass="max-h-[400px] overflow-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-track]:bg-gray-200"
                        />
                    </Form.Item>

                    <Form.Item className="text-center">
                        <Button type="primary" htmlType="submit" className="w-1/2">
                            Tạo Phụ Lục
                        </Button>
                    </Form.Item>
                </Form>
            </div>

            {/* Modal chỉnh sửa */}
            <Modal
                title="Chỉnh sửa loại phụ lục"
                open={isEditModalVisible}
                onOk={handleUpdate}
                onCancel={() => setIsEditModalVisible(false)}
                confirmLoading={isLoadingUpdateAppendixType}
                okText="Cập nhật"
                cancelText="Hủy"
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item
                        label="Tên loại phụ lục"
                        name="name"
                        rules={[{ required: true, message: 'Vui lòng nhập tên loại phụ lục!' }]}
                    >
                        <Input placeholder="Nhập tên loại phụ lục" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Modal xác nhận xóa */}
            <Modal
                title="Xác nhận xóa"
                open={isDeleteModalVisible}
                onOk={handleConfirmDelete}
                onCancel={() => setIsDeleteModalVisible(false)}
                confirmLoading={isLoadingDeleteAppendixType}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
            >
                <p>Bạn có chắc chắn muốn xóa loại phụ lục <strong>{currentAppendixType?.name}</strong> không?</p>
            </Modal>
        </div>
    );
};

export default ContractAppendixPage;