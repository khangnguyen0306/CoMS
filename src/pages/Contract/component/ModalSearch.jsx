import { Button, Form, Input, message, Modal, Select, Table } from 'antd';
import React, { useState, useEffect } from 'react';
import { useCreateClauseMutation, useGetAllTypeClauseQuery, useSearchTermsByHoverQuery } from '../../../services/ClauseAPI';
import { debounce } from 'lodash';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
const { Search } = Input;


const ModalSearch = ({ searchModalVisible, setSearchModalVisible, selectedText, setSelectedText }) => {

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [debouncedText, setDebouncedText] = useState(selectedText);
    const [addTermModalVisible, setAddTermModalVisible] = useState(false);
    const [form] = Form.useForm();

    const debouncedSearch = debounce((text) => {
        setDebouncedText(text);
    }, 500);


    useEffect(() => {
        debouncedSearch(selectedText);
    }, [selectedText]);


    const { data: contracts, isLoading, isError, refetch } = useSearchTermsByHoverQuery({
        page: currentPage - 1,
        size: pageSize,
        keyword: debouncedText,
    });
    const { data: typeData, isLoading: loadingType } = useGetAllTypeClauseQuery();
    const [createClause, { isLoading: loadingCreate }] = useCreateClauseMutation();

    const handleTableChange = (pagination) => {
        setCurrentPage(pagination.current);
        setPageSize(pagination.pageSize);
    };


    // Hàm mở modal "Thêm điều khoản" và đặt giá trị mặc định
    const openAddTermModal = () => {
        form.setFieldsValue({ value: selectedText }); // Đặt giá trị mặc định cho trường "Nội dung"
        setAddTermModalVisible(true);
    };

    // Hàm xử lý khi nhấn "Lưu" trong modal thêm điều khoản
    const handleSubmitAddClause = async (values) => {
        try {
            await createClause({ typeTermId: values.type, label: values.label, value: values.value }).unwrap();
            message.success("Tạo điều khoản thành công");
            setAddTermModalVisible(false);
            form.resetFields();
            refetch();  
        } catch (error) {
            console.log(error)
        }
    };
    const locale = {
        emptyText: (
            <div>
                <p className='mb-5'>Không có dữ liệu</p>
                <Button type="primary" icon={<PlusOutlined/>} onClick={openAddTermModal}>
                    Thêm điều khoản
                </Button>
            </div>
        ),
    };

    return (
        <div>
            <Modal
                className='w-full min-w-[60vw]'
                title="Tìm kiếm điều khoản"
                open={searchModalVisible}
                onCancel={() => setSearchModalVisible(false)}
                footer={null}
            >
                <Search
                    placeholder="Nhập điều khoản để tìm kiếm"
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    enterButton={<SearchOutlined />}
                    className='mb-6'
                />

                <Table
                    dataSource={contracts?.data.content || []}
                    columns={[
                        { title: 'Tên điều khoản', dataIndex: 'label', key: 'label' },
                        { title: 'Nội dung', dataIndex: 'value', key: 'value' },
                    ]}
                    rowKey="id"
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: contracts?.data.totalElements || 0,
                        showSizeChanger: true,
                    }}
                    onChange={handleTableChange}
                    loading={isLoading}
                    locale={locale}
                />
            </Modal>
            <Modal
                title="Thêm điều khoản"
                open={addTermModalVisible}
                onCancel={() => setAddTermModalVisible(false)}
                onOk={() => form.submit()}
                okText={<p><PlusOutlined />Tạo mới</p>}
                cancelText="Hủy"
            >
                <Form form={form}
                    layout="vertical"
                    onFinish={(values) => {
                        form.resetFields();
                        handleSubmitAddClause(values)
                    }}>
                    <Form.Item
                        name="label"
                        label="Tên điều khoản"
                        rules={[{ required: true, message: 'Vui lòng nhập tên điều khoản' }]}
                    >
                        <Input placeholder="Nhập tên điều khoản" />
                    </Form.Item>
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
                        name="value"
                        label="Nội dung"
                        rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                    >
                        <Input.TextArea rows={4} placeholder="Nhập nội dung điều khoản" />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default ModalSearch;