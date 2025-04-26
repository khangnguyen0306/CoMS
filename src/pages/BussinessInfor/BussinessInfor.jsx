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
import { useEditPartnerMutation, useGetPartnerInfoDetailQuery } from '../../services/PartnerAPI';
import { PlusOutlined } from '@ant-design/icons';

const BussinessInfor = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [bankAccounts, setBankAccounts] = useState([{ bankName: '', backAccountNumber: '' }]);
    const [form] = Form.useForm();
    const { data: Data, isLoading, refetch } = useGetPartnerInfoDetailQuery({ id: 1 });
    console.log(Data)
    const initialValues = Data?.data || {};
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [updateInformation] = useEditPartnerMutation();

    useEffect(() => {
        if (Data) {
            form.setFieldsValue({
                businessName: Data.data.partnerName || '',
                taxCode: Data.data.taxCode || '',
                address: Data.data.address || '',
                representativeName: Data.data.spokesmanName || '',
                representativeTitle: Data.data.position || '',
                phone: Data.data.phone || '',
                email: Data.data.email || '',
                bankAccounts: Data.data.banking || [{ bankName: '', backAccountNumber: '' }],
            });
            setBankAccounts(Data.data.banking || [{ bankName: '', backAccountNumber: '' }]);
        }
    }, [Data, form]);


    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = async () => {
        // Lấy toàn bộ giá trị từ form
        const values = form.getFieldsValue(true);

        // Chuyển đổi dữ liệu từ form sang định dạng mà API mong đợi
        const payload = {
            partnerName: values.businessName,               // chuyển businessName thành partnerName
            taxCode: values.taxCode,
            address: values.address,
            spokesmanName: values.representativeName,         // chuyển representativeName thành spokesmanName
            phone: values.phone,
            email: values.email,
            banking: values.bankAccounts,                     // sử dụng key banking thay vì bankAccounts
            position: values.representativeTitle,
            partnerType: initialValues.partnerType || 'PARTY_B'
        };

        console.log("Payload:", payload);

        try {
            const result = await updateInformation({ id: 1, ...payload }).unwrap();
            if (result.status === "OK") {
                message.success('Thông tin đã được cập nhật thành công!');
                // form.resetFields()
                refetch();

                setIsEditing(false);
            } else {
                message.error(result.data.message)
            }

        } catch (error) {
            console.error("Update error:", error);
            message.error("Có lỗi xảy ra khi cập nhật thông tin!");
        }
    };
    const addBankAccount = () => {
        const newBankAccounts = [...bankAccounts, { bankName: '', backAccountNumber: '' }];
        setBankAccounts(newBankAccounts);
        form.setFieldsValue({ bankAccounts: newBankAccounts });
    };

    const handleBankChange = (index, field, value) => {
        const newBankAccounts = bankAccounts.map((account, i) =>
            i === index ? { ...account, [field]: value } : account
        );
        setBankAccounts(newBankAccounts);
        form.setFieldsValue({ bankAccounts: newBankAccounts });
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
                                rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên doanh nghiệp!' }]}
                            >
                                <Input placeholder="Tên đầy đủ của doanh nghiệp" />
                            </Form.Item>
                            <Form.Item
                                label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <MdConfirmationNumber fontSize={20} /> Mã số thuế:</p>}
                                name="taxCode"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập mã số thuế!' },
                                    {
                                        validator: (_, value) => {
                                            if (!value || value.length === 10 || value.length === 13) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Mã số thuế phải có 10 hoặc 13 số!'));
                                        }
                                    }
                                ]}
                            >
                                <Input placeholder="Mã số thuế của doanh nghiệp" />
                            </Form.Item>
                            <Form.Item
                                label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                                    rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên doanh nghiệp!' }]}
                                >
                                    <FaMapMarkerAlt fontSize={20} /> Địa chỉ trụ sở chính:</p>} name="address">
                                <Input placeholder="Địa chỉ liên lạc chính thức" />
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
                            <Form.Item
                                label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <FaPhone fontSize={20} /> Số điện thoại:</p>}
                                name="phone"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập số điện thoại!' },
                                    {
                                        validator: (_, value) => {
                                            const phoneRegex = /^[0-9]{10,15}$/; // Adjust the regex as needed
                                            if (!value || phoneRegex.test(value)) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('Số điện thoại không hợp lệ!'));
                                        }
                                    }
                                ]}
                            >
                                <Input placeholder="Số điện thoại liên hệ chính" />
                            </Form.Item>
                            <Form.Item
                                label={<p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    <FaEnvelope fontSize={20} /> Email:</p>}
                                name="email"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập email!' },
                                    {
                                        type: 'email',
                                        message: 'Email không hợp lệ!',
                                    },
                                ]}
                            >
                                <Input placeholder="Email chính thức" />
                            </Form.Item>
                            <div className='mb-4'>
                                <h4>Ngân hàng</h4>
                                {bankAccounts.map((bank, index) => (
                                    <div key={index} style={{ marginBottom: '10px' }}>
                                        <Form.Item className="mt-2">
                                            <div className="flex flex-col gap-2 w-[70%] ml-[10px]">
                                                <Input
                                                    placeholder="Tên ngân hàng"
                                                    value={bank.bankName}
                                                    onChange={(e) => handleBankChange(index, 'bankName', e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Số tài khoản"
                                                    value={bank.backAccountNumber}
                                                    onChange={(e) => handleBankChange(index, 'backAccountNumber', e.target.value)}
                                                />
                                            </div>
                                        </Form.Item>
                                    </div>
                                ))}
                                <Button icon={<PlusOutlined />} onClick={addBankAccount}>Thêm ngân hàng</Button>
                            </div>
                            <Form.Item>
                                <Button type="primary" htmlType="submit" className="w-full" icon={<FaSave />}>
                                    Lưu thông tin
                                </Button>
                            </Form.Item>
                        </Form>
                    ) : (
                        <div className={`w-full ml-[60px] rounded-lg p-10 ${isDarkMode ? "bg-[#222222]" : "bg-[#fffff]"}`}>
                            <div className="text-right mb-2 absolute top-0 right-0">
                                <Button
                                    icon={<FaEdit />}
                                    type="primary"
                                    onClick={handleEdit}

                                >
                                    Chỉnh sửa
                                </Button>
                            </div>
                            <Row gutter={[16, 24]} justify={"center"}>
                                <Col xs={24} md={10} className='w-fit flex flex-col gap-5'>
                                    <div>
                                        <p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <FaHouseUser fontSize={20} /> Tên doanh nghiệp:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.partnerName || 'Chưa có thông tin'}
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
                                            <FaUserTie fontSize={20} /> Người đại diện pháp luật:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.spokesmanName || 'Chưa có thông tin'}
                                        </p>
                                    </div>

                                </Col>
                                <Col xs={24} md={12} className='w-fit flex flex-col gap-4'>
                                    <div>
                                        <p className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            <FaUser fontSize={20} /> Chức danh:
                                        </p>
                                        <p className={`ml-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {initialValues.position || 'Chưa có thông tin'}
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
                                    {/* <div>
                                        <h4>Ngân hàng</h4>
                                        {bankAccounts.map((bank, index) => (
                                            <div key={index} style={{ marginBottom: '10px' }}>
                                                <Form.Item className="mt-2">
                                                    <div className="flex flex-col gap-2 w-[70%] ml-[10px]">
                                                        <Input
                                                            placeholder="Tên ngân hàng"
                                                            value={bank.bankName}
                                                            onChange={(e) => handleBankChange(index, 'bankName', e.target.value)}
                                                        />
                                                        <Input
                                                            placeholder="Số tài khoản"
                                                            value={bank.backAccountNumber}
                                                            onChange={(e) => handleBankChange(index, 'backAccountNumber', e.target.value)}
                                                        />
                                                    </div>
                                                </Form.Item>
                                            </div>
                                        ))}
                                        <Button icon={<PlusOutlined />} onClick={addBankAccount}>Thêm ngân hàng</Button>
                                    </div> */}
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
