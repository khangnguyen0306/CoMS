import React, { useState, useEffect } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Card, Descriptions, Tag, Typography, Breadcrumb, Tabs, Empty, ConfigProvider, Skeleton, Row, Col, message, Form, Button, Input } from 'antd';
import { PhoneOutlined, MailOutlined, EditFilled, SaveFilled } from '@ant-design/icons';
import { FaUserTie } from "react-icons/fa6";
import { useGetPartnerInfoDetailQuery } from '../../services/PartnerAPI';
import ContractPartner from './ContractPartner';

const { Title } = Typography;

const PartnerDetail = () => {
    const partnerId = useParams(); // chua su dung thieu useEffect thay doi id can reload
    const { data: partnerData, isLoading: isFetching, error: fetchError } = useGetPartnerInfoDetailQuery();
    // const [updatePartner, { isLoading: isUpdating }] = useUpdatePartnerInfoMutation();
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();

    // Thêm useEffect để cảnh báo khi người dùng cố gắng tải lại trang
    useEffect(() => {
        const handleBeforeUnload = (event) => {
            if (isEditing) {
                const message = "Bạn có chắc chắn muốn rời khỏi trang này? Thay đổi của bạn sẽ không được lưu.";
                event.returnValue = message;
                return message;
            }
        };

        const handleRouteChange = (event) => {
            if (isEditing) {
                const confirmLeave = window.confirm("Bạn có chắc chắn muốn rời khỏi trang này? Thay đổi của bạn sẽ không được lưu.");
                if (!confirmLeave) {
                    event.returnValue = message;
                    return message;
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handleRouteChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handleRouteChange);
        };
    }, [isEditing]);

    const getPartnerTypeColor = (type) => {
        switch (type) {
            case 'Nhà cung cấp':
                return 'blue';
            case 'Khách hàng':
                return 'green';
            default:
                return 'default';
        }
    };

   
    if (isFetching) return <Skeleton active />;
    if (fetchError) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;
    if (!partnerData) return <Card><Empty description="Không có dữ liệu để hiển thị" /></Card>;

    const handleEditClick = () => {
        setIsEditing(true);
        form.setFieldsValue({
            partnerName: partnerData.partnerName,
            partnerCode: partnerData.partnerCode,
            taxCode: partnerData.taxCode,
            spokesmanName: partnerData.spokesmanName,
            spokesmanPosition: partnerData.spokesmanPosition,
            businessField: partnerData.businessField,
            address: partnerData.address,
            phone: partnerData.phone,
            email: partnerData.email,
            note: partnerData.note,
        });
    };

    const handleSaveClick = async () => {
        try {
            const updatedValues = await form.validateFields();
            // await updatePartner(updatedValues).unwrap();
            message.success('Cập nhật thông tin thành công!');
            setIsEditing(false); // Tắt chế độ chỉnh sửa
        } catch (error) {
            message.error('Cập nhật thất bại');
        }
    };
    return (
        <div className="site-card-wrapper min-h-[70vh]">
            <Breadcrumb
                items={[
                    {
                        title: <Link to={"/"} >Trang chủ</Link>,
                    },
                    {
                        title: <Link to={"/partner"} >Khách hàng</Link>,
                    },
                    {
                        title: <p className='font-bold'>{partnerData.partnerName}</p>,
                    },
                ]}
                style={{
                    margin: '0 0 20px 0',
                }}
            />

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
                    items={[
                        {
                            label: 'Thông tin đối tác',
                            key: '1',
                            children: (
                                <Card
                                    type='inner'
                                    className='shadow-lg '
                                    title={
                                        <Title level={4} className='flex items-center justify-between'>
                                            <div className='flex items-center font-bold mt-3 p-1 '>
                                                <FaUserTie className='mr-3' />
                                                {partnerData.partnerName}
                                            </div>
                                            <div>
                                                {!isEditing ? (
                                                    <Button
                                                        type="primary"
                                                        onClick={handleEditClick}
                                                        disabled={isEditing}
                                                        icon={<EditFilled />}
                                                    >
                                                        Chỉnh sửa
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        type="primary"
                                                        onClick={handleSaveClick}
                                                        icon={<SaveFilled />}
                                                    // {/* loading={isUpdating} */}
                                                    >
                                                        Lưu thay đổi
                                                    </Button>
                                                )}
                                            </div>
                                        </Title>
                                    }
                                >
                                    {isEditing ? (
                                        <Form
                                            form={form}
                                            layout="vertical"
                                            initialValues={{
                                                partnerName: partnerData.partnerName,
                                                partnerCode: partnerData.partnerCode,
                                                taxCode: partnerData.taxCode,
                                                spokesmanName: partnerData.spokesmanName,
                                                spokesmanPosition: partnerData.spokesmanPosition,
                                                businessField: partnerData.businessField,
                                                address: partnerData.address,
                                                phone: partnerData.phone,
                                                email: partnerData.email,
                                                note: partnerData.note,
                                            }}
                                        >
                                            <Form.Item label="Tên Partner" name="partnerName" rules={[{ required: true, message: 'Vui lòng nhập tên đối tác!' }]}>
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Mã Partner" name="partnerCode">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Mã số thuế" name="taxCode">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Tên đại diện" name="spokesmanName">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Chức vụ đại diện" name="spokesmanPosition">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Lĩnh vực kinh doanh" name="businessField">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Địa chỉ" name="address">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Điện thoại" name="phone">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Email" name="email">
                                                <Input />
                                            </Form.Item>
                                            <Form.Item label="Ghi chú" name="note">
                                                <Input.TextArea />
                                            </Form.Item>

                                        </Form>
                                    ) : (
                                        <Descriptions
                                            bordered
                                            column={2}
                                        >

                                            <Descriptions.Item
                                                label="Tên Partner"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                {partnerData.partnerName}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label="Mã Partner"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                <Tag color="purple">{partnerData.partnerCode}</Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label="Mã số thuế"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                {partnerData.taxCode}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label="Tên đại diện"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                {partnerData.spokesmanName}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label="Chức vụ đại diện"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                {partnerData.spokesmanPosition}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label="Lĩnh vực kinh doanh"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                {partnerData.businessField}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label="Địa chỉ"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                {partnerData.address}
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label="Ngân hàng"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                <Row className='flex gap-x-4 w-[70%]'>
                                                    <Col > <p className='font-bold '>Tên ngân hàng: </p>  <p className='font-bold'>Số tài khoản: </p></Col>
                                                    <Col > <p>{partnerData.Banking.bankName}</p> <p>{partnerData.Banking.accountNumber}</p></Col>
                                                </Row>
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label="Loại Partner"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                <Tag color={getPartnerTypeColor(partnerData.partnerType)}>
                                                    {partnerData.partnerType}
                                                </Tag>
                                            </Descriptions.Item>


                                            <Descriptions.Item
                                                label="Điện thoại"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                <PhoneOutlined className="mr-2" />
                                                {partnerData.phone}
                                            </Descriptions.Item>

                                            <Descriptions.Item
                                                label="Email"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                <a href={`mailto:${partnerData.email}`}> <MailOutlined className="mr-2" />{partnerData.email}</a>
                                            </Descriptions.Item>

                                            <Descriptions.Item
                                                label="Ghi chú"
                                                style={{
                                                    border: '1px solid #89c4d9',
                                                }}
                                                styles={{
                                                    label: {
                                                        backgroundColor: '#cdf2ff',
                                                        color: '#005580',
                                                        fontWeight: 'bold',
                                                    },
                                                }}
                                            >
                                                {partnerData.note || " Không có ghi chú "}
                                            </Descriptions.Item>
                                        </Descriptions>
                                    )}
                                </Card>
                            ),
                        },
                        {
                            label: 'Lịch sử hợp đồng',
                            key: '2',
                            children: (
                                <Card>
                                   <ContractPartner partnerId={partnerId}/>
                                </Card>
                            ),
                        },
                    ]}
                />
            </ConfigProvider>
        </div>
    );
};

export default PartnerDetail;