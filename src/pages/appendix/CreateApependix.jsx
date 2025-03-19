import React, { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, DatePicker, Select, message, Card } from 'antd';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import RichTextEditor, {
} from 'reactjs-tiptap-editor';
import 'reactjs-tiptap-editor/style.css';
import 'katex/dist/katex.min.css';
import { extensions } from "../../utils/textEditor";
import { debounce, throttle } from "lodash";
import { useCreateAppendixMutation, useGetAppendixDetailQuery } from '../../services/AppendixAPI';
import { useLocation, useNavigate } from 'react-router-dom';
const { Option } = Select;

const ContractAppendixPage = () => {
    const [form] = Form.useForm();
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [content, setContent] = useState('')
    const [createAppendix, { isLoading: LoadingCreate }] = useCreateAppendixMutation();
    const { data: appendixDetail, isLoading: isLoadingappendixDetail} = useGetAppendixDetailQuery();
    const navigate= useNavigate()
    // Get query parameters from the URL
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const contractId = queryParams.get('contractId');
    const contractNumber = queryParams.get('contractNumber');

    const onValueChange = useCallback(
        debounce((value) => {
            setContent(value);
            form.setFieldsValue({ content: value });
        }, 300),
        []
    );

    useEffect(() => {
        return () => onValueChange.cancel();
    }, []);

    const onFinish = async (values) => {
        const appendixData = {
            ...values,
            contractId: contractId,
            // contractNumber: contractNumber,
        };

        try {
            const result = await createAppendix(appendixData).unwrap();
            // console.log('Result:', result);
            if (result.status === 'CREATED') {
                message.success('Phụ lục đã được tạo thành công!');
                navigate('/contract')
                form.resetFields();
                
                
            }

        } catch (error) {
            // console.error('Error creating appendix:', error);
            message.error(error?.data.message);
        }
    };

    return (
        <div className={`min-h-screen p-8 ${isDarkMode ? 'bg-[#141414]' : ''}`}>
            < div className={`max-w-4xl mx-auto ${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5] border'} shadow-lg rounded-lg p-6`}>
                <h1 className="text-3xl font-bold mb-6 text-center">TẠO PHỤ LỤC HỢP ĐỒNG</h1>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Form.Item
                        label="Tên Phụ Lục"
                        name="title"
                        rules={[{ required: true, message: 'Vui lòng nhập tên phụ lục!' }]}
                    >
                        <Input placeholder="Nhập tên phụ lục" />
                    </Form.Item>

                    {/* <Form.Item
            label="Số Hợp Đồng"
            name="contractNumber"
            rules={[{ required: true, message: 'Vui lòng nhập số hợp đồng!' }]}
          >
            <Input placeholder="Nhập số hợp đồng" />
          </Form.Item> */}

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

                    {/* <Form.Item
            label="Loại Phụ Lục"
            name="appendixType"
            rules={[{ required: true, message: 'Vui lòng chọn loại phụ lục!' }]}
          >
            <Select placeholder="Chọn loại phụ lục">
              <Option value="thaydoi">Thay đổi điều khoản</Option>
              <Option value="them">Thêm điều khoản</Option>
              <Option value="bot">Bớt điều khoản</Option>
            </Select>
          </Form.Item> */}

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
        </div >
    );
};

export default ContractAppendixPage;
