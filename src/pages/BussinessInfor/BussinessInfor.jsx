import { Form, Input, Button, Skeleton, Row, Col, message } from 'antd';
import React, { useEffect, useState } from 'react';
import { useGetBussinessInformatinQuery } from '../../services/BsAPI';
import { FaEdit } from 'react-icons/fa';
import { FaHouseUser } from "react-icons/fa6";
import { MdConfirmationNumber } from "react-icons/md";
import { FaMapMarkerAlt } from "react-icons/fa";
import { FaIndustry } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import { FaUserTie } from "react-icons/fa6";
import { FaPhone } from "react-icons/fa";
import { FaEnvelope } from "react-icons/fa";
import { FaSave } from "react-icons/fa";
import { useSelector } from 'react-redux';
const BussinessInfor = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const { data: Data, isLoading } = useGetBussinessInformatinQuery();
    const initialValues = Data || {};
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    useEffect(() => {
        if (Data) {
            form.setFieldsValue({
                businessName: Data.businessName || '',
                taxCode: Data.taxCode || '',
                address: Data.address || '',
                businessField: Data.businessField || '',
                representativeName: Data.representativeName || '',
                representativeTitle: Data.representativeTitle || '',
                phone: Data.phone || '',
                email: Data.email || '',
            });
        }
    }, [Data, form]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = (values) => {
        {/* thêm api nha bây */ }
        message.success('Thông tin đã được cập nhật thành công!');
        console.log('Saved values:', values);
        setIsEditing(false);

    };

    if (isLoading) {
        return <Skeleton active />;
    }

    return (
        <div className="p-1 min-h-[100vh] flex justify-start w-full">
            <div className="w-[95%]">
                <div className='relative max-w-full w-full'>
                    <p className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent'
                        style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                        THÔNG TIN DOANH NGHIỆP
                    </p>
                    {isEditing ? (
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSave}
                            className={`shadow-md rounded-lg p-8 `}
                        >
                            <Form.Item
                                label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <FaHouseUser fontSize={20} /> Tên doanh nghiệp:</p>}
                                name="businessName"
                                rules={[{ required: true, message: 'Vui lòng nhập tên doanh nghiệp!' }]}
                            >
                                <Input placeholder="Tên đầy đủ của doanh nghiệp" />
                            </Form.Item>
                            <Form.Item
                                label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <MdConfirmationNumber fontSize={20} /> Mã số thuế:</p>}
                                name="taxCode"
                                rules={[{ required: true, message: 'Vui lòng nhập mã số thuế!' }]}
                            >
                                <Input placeholder="Mã định danh của doanh nghiệp" />
                            </Form.Item>
                            <Form.Item label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <FaMapMarkerAlt fontSize={20} /> Địa chỉ trụ sở chính:</p>} name="address">
                                <Input placeholder="Địa chỉ liên lạc chính thức" />
                            </Form.Item>
                            <Form.Item label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <FaIndustry fontSize={20} />Lĩnh vực kinh doanh:</p>} name="businessField">
                                <Input placeholder="Lĩnh vực kinh doanh chính của doanh nghiệp" />
                            </Form.Item>
                            <Row gutter={16}>
                                <Col xs={24} md={12}>
                                    <Form.Item
                                        label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <FaUser fontSize={20} /> Họ và tên người đại diện:</p>}
                                        name="representativeName"
                                        rules={[{ required: true, message: 'Vui lòng nhập họ và tên!' }]}
                                    >
                                        <Input placeholder="Họ và tên" />
                                    </Form.Item>
                                </Col>
                                <Col xs={24} md={12}>
                                    <Form.Item label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        <FaUserTie fontSize={20} /> Chức danh:</p>} name="representativeTitle">
                                        <Input placeholder="Ví dụ: Giám đốc, Tổng giám đốc" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Form.Item label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <FaPhone fontSize={20} /> Số điện thoại:</p>} name="phone">
                                <Input placeholder="Số điện thoại liên hệ chính" />
                            </Form.Item>
                            <Form.Item label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <FaEnvelope fontSize={20} /> Email:</p>} name="email">
                                <Input placeholder="Email chính thức" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" className="w-full" icon={<FaSave />}>
                                    Lưu thông tin
                                </Button>
                            </Form.Item>
                        </Form>
                    ) : (
                        <div className={`w-full ml-[60px] rounded-lg p-6 ${isDarkMode ? "bg-[#222222]" : "bg-[#fffff]"}`}>
                            <div className="text-right mb-4 absolute top-0 right-0">
                                <Button
                                    icon={<FaEdit />}
                                    type="primary"
                                    onClick={handleEdit}

                                >
                                    Chỉnh sửa
                                </Button>
                            </div>
                            <Row gutter={[16, 24]} className=''>
                                <Col xs={24} md={12} className='w-fit flex flex-col gap-4'>
                                    <div>
                                        <p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <FaHouseUser fontSize={20} /> Tên doanh nghiệp:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.businessName || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <MdConfirmationNumber fontSize={20} /> Mã số thuế:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.taxCode || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <FaMapMarkerAlt fontSize={20} /> Địa chỉ trụ sở chính:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.address || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <FaIndustry fontSize={20} /> Ngành nghề kinh doanh:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.businessField || 'Chưa có thông tin'}
                                        </p>
                                    </div>

                                </Col>
                                <Col xs={24} md={12} className='w-fit flex flex-col gap-4'>
                                    <div>
                                        <p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <FaUser fontSize={20} /> Chức danh:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.representativeTitle || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <FaPhone fontSize={20} /> Số điện thoại:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.phone || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                    <div>

                                        <p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <FaEnvelope fontSize={20} /> Email:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.email || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <FaUserTie fontSize={20} /> Người đại diện pháp luật:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.representativeName || 'Chưa có thông tin'}
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BussinessInfor;
