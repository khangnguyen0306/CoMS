import React, { useState } from "react";
import { Form, Input, Button, message, Space, Skeleton, DatePicker, Select, Divider, Tabs, Upload, Spin } from "antd";
import { useLocation, useParams } from "react-router-dom";
import { useGetUserByIdQuery, useUpdateAvatarMutation, useUpdateUserMutation } from "../../services/UserAPI";
import dayjs from "dayjs";
import { useGetDepartmentsQuery } from "../../services/Department";
import partnerIMG from "../../assets/Image/partner.jpg";
import { EditFilled, MailFilled, SaveFilled, SettingOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons";
import { MdPlace } from "react-icons/md";
import utc from "dayjs/plugin/utc";
import ChangePassword from "./ChangePassWord";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser, setAvatar } from "../../slices/authSlice";
import { validationPatterns } from "../../utils/ultil";
dayjs.extend(utc);
const { TabPane } = Tabs;

const Profile = () => {
    const location = useLocation();
    const { id } = location.state || {};
    const { data, isLoading, refetch } = useGetUserByIdQuery({ skip: !id });
    const { data: departmentData, isLoading: DepartmentLoading } = useGetDepartmentsQuery();
    const [updateAvatar, { isLoadingUpdateAvatar }] = useUpdateAvatarMutation();
    const dispatch = useDispatch()
    const [updateUser] = useUpdateUserMutation();
    const [isEditing, setIsEditing] = useState(false);
    const [form] = Form.useForm();
    const [hover, setHover] = useState(false);
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [loadingUpdate, setLoadingUpdate] = useState(false)
    const user = useSelector(selectCurrentUser)
    // console.log(user)

    const handleEditClick = () => {
        setIsEditing(true);
        form.setFieldsValue({
            full_name: data?.full_name,
            department_id: data?.department?.id,
            dateOfBirth: data?.date_of_birth
                ? dayjs(
                    `${data.date_of_birth[0]}-${data.date_of_birth[1].toString().padStart(2, "0")}-${data.date_of_birth[2].toString().padStart(2, "0")}`
                )
                : null,
            phone_number: data?.phone_number,
            address: data?.address,
            email: data?.email,
            gender: data?.gender,
            is_ceo: data?.isCeo,
            role_id: data?.role.id
        });
    };

    // Khi nhấn nút "Lưu"
    const handleSaveClick = async () => {
        try {
            const values = await form.validateFields(true);
            console.log("form", values);
            await updateUser({ body: values, userId: id }).unwrap();
            message.success("Cập nhật hồ sơ thành công!");
            setIsEditing(false);
            refetch();
        } catch (error) {
            message.error("Cập nhật thất bại, vui lòng thử lại.");
        }
    };

    // Khi nhấn nút "Hủy"
    const handleCancelClick = () => {
        setIsEditing(false);
        form.resetFields();
    };

    const handleUpload = async (file) => {
        const formData = new FormData();
        formData.append("avatar", file);
        setLoadingUpdate(true)
        try {
            const result = await updateAvatar({ formData, userId: data?.id }).unwrap();
            if (result.status == "OK") {
                message.success(result.message);
                dispatch(setAvatar(result.data.avatar))
                refetch()
            }

        } catch (error) {
            message.error(error.data.message);
        } finally {
            setLoadingUpdate(false)
        }
    };
    const dislayGender = {
        "MALE": "Nam",
        "FEMALE": "Nữ",
        "OTHER": "Khác"
    }

    if (isLoading || DepartmentLoading)
        return (
            <div className='flex justify-center items-center min-h-[100vh]'>
                <Skeleton active />;
            </div>
        );

    return (
        <div className="p-6 min-h-screen">
            <Tabs defaultActiveKey="1">
                {/* Tab Thông tin cá nhân */}
                <TabPane tab="Thông tin cá nhân" key="1" icon={<UserOutlined />}>
                    <div className="flex">
                        {/* Thanh bên */}
                        <div className="w-[30%] p-6 rounded-lg">
                            <div className="flex flex-col items-center">
                                {loadingUpdate ? (<Spin size="large" />) : (
                                    <Upload
                                        showUploadList={false}
                                        disabled={isLoadingUpdateAvatar}
                                        beforeUpload={(file) => {
                                            handleUpload(file);
                                            return false; // Ngăn Upload tự động
                                        }}
                                    >
                                        <div
                                            className="relative w-[220px] h-[220px] mb-[60px] cursor-pointer"
                                            onMouseEnter={() => setHover(true)}
                                            onMouseLeave={() => setHover(false)}
                                        >
                                            <img
                                                src={data?.avatar || partnerIMG}
                                                alt="Hồ sơ"
                                                className="w-full h-full border-4 border-white shadow-md object-cover rounded-md"
                                            />
                                            {hover && (
                                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md transition-opacity duration-300">
                                                    <UploadOutlined className="text-white text-4xl" />
                                                </div>
                                            )}
                                        </div>
                                    </Upload>
                                )}
                                <Divider className="mt-[40px]">
                                    <p>Liên lạc</p>
                                </Divider>
                                {user.id == !id && (
                                    <div className="mt-4 flex flex-col gap-2 w-full">
                                        <Button
                                            type="primary"
                                            icon={<MailFilled />}
                                            onClick={() => (window.location.href = `mailto:${data?.email}`)}
                                        >
                                            Gửi email
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Khu vực nội dung chính */}
                        <div className="w-[70%] ml-6 p-6 rounded-lg relative mt-5">
                            {!isEditing ? (
                                <Button type="primary" icon={<EditFilled />} onClick={handleEditClick} className="absolute right-0">
                                    Cập nhật thông tin
                                </Button>
                            ) : (
                                <Space className="absolute right-0 top-0">
                                    <Button type="primary" onClick={handleSaveClick} icon={<SaveFilled />} className="bg-[#007bff]">
                                        Lưu
                                    </Button>
                                    <Button onClick={handleCancelClick}>Hủy</Button>
                                </Space>
                            )}
                            <Form form={form} layout="vertical">
                                <Form.Item name="is_ceo" hidden />
                                <Form.Item name="role_id" hidden />
                                <div className="space-y-6">
                                    <div className="flex items-end gap-8">
                                        {isEditing ? (
                                            <Form.Item label="Tên nhân viên" name="full_name" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập tên đầy đủ!" }]}>
                                                <Input placeholder="Nhập tên đầy đủ" className="w-[200px]" />
                                            </Form.Item>
                                        ) : (
                                            <p className="font-semibold text-3xl">{data?.full_name}</p>
                                        )}
                                        {isEditing ? (
                                            <Form.Item label="Địa chỉ" name="address" rules={[{ required: true, whitespace: true, message: "Vui lòng nhập địa chỉ!" }]}>
                                                <Input placeholder="Nhập địa chỉ" className="w-[300px]" />
                                            </Form.Item>
                                        ) : (
                                            <p className="flex mb-1 items-center text-gray-700 text-sm">
                                                <MdPlace style={{ fontSize: '20px', marginBottom: '5px', color: 'grey', marginRight: '7px' }} />
                                                {data?.address || "Chưa cập nhật"}
                                            </p>
                                        )}
                                    </div>

                                    <p className="py-3 pt-0">
                                        <span className="font-semibold text-gray-500 text-base">THÔNG TIN CƠ BẢN</span>
                                        <hr className="mt-4" />
                                    </p>
                                    <div className="ml-3">
                                        <div className="flex items-center mb-2">
                                            <span className={`inline-block w-[200px] font-bold`}>Mã nhân viên:</span>
                                            <span className={isDarkMode ? "text-gray-300" : "text-gray-800"}>{data?.staff_code || "EMP123"}</span>
                                        </div>

                                        <div className="flex items-center mb-2">
                                            <span className={`inline-block w-[200px] font-bold`}>Ngày tháng năm sinh:</span>
                                            {isEditing ? (
                                                <Form.Item
                                                    name="dateOfBirth"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: "Vui lòng chọn ngày sinh!"
                                                        },
                                                        {
                                                            validator: (_, value) => {
                                                                if (!value || dayjs().diff(value, 'year') < 18) {
                                                                    return Promise.reject(new Error("Bạn phải ít nhất 18 tuổi!"));
                                                                }
                                                                return Promise.resolve();
                                                            }
                                                        }
                                                    ]}
                                                >
                                                    <DatePicker
                                                        className="w-[200px]"
                                                        placeholder="Chọn ngày"
                                                        format="DD-MM-YYYY"
                                                        disabledDate={(current) => current && current > dayjs().endOf('day')}
                                                    />
                                                </Form.Item>
                                            ) : (
                                                <span className={isDarkMode ? "text-gray-300" : "text-gray-800"}>
                                                    {data?.date_of_birth
                                                        ? dayjs(
                                                            new Date(
                                                                data.date_of_birth[0],
                                                                data.date_of_birth[1] - 1,
                                                                data.date_of_birth[2]
                                                            )
                                                        ).format("DD/MM/YYYY")
                                                        : "05/06/1982"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center mb-2">
                                            <span className={`inline-block w-[200px] font-bold`}>Giới tính:</span>
                                            {isEditing ? (
                                                <Form.Item name="gender" rules={[{ required: true, message: "Vui lòng chọn giới tính" }]}>
                                                    <Select placeholder="Chọn giới tính" className="w-[200px]">
                                                        <Select.Option value="MALE">Nam</Select.Option>
                                                        <Select.Option value="FEMALE">Nữ</Select.Option>
                                                        <Select.Option value="OTHER">Khác</Select.Option>
                                                    </Select>
                                                </Form.Item>
                                            ) : (
                                                <span className={isDarkMode ? "text-gray-300" : "text-gray-800"}>{dislayGender[data?.gender] || "Chưa cập nhật"}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center mb-2">
                                            <span className={`inline-block w-[200px] font-bold`}>Phòng ban:</span>
                                            {/* {isEditing ? (
                                                <Form.Item name="department_id" rules={[{ required: true, message: "Vui lòng chọn phòng ban" }]}>
                                                    <Select placeholder="Chọn phòng ban" className="w-[200px]">
                                                        {departmentData?.data?.map((dept) => (
                                                            <Select.Option key={dept.departmentName} value={dept.departmentId}>
                                                                {dept.departmentName}
                                                            </Select.Option>
                                                        ))}
                                                    </Select>
                                                </Form.Item>
                                            ) : ( */}
                                            <span className={isDarkMode ? "text-gray-300" : "text-gray-800"}>{data?.department?.departmentName || "Chưa cập nhật"}</span>
                                            {/* )} */}
                                        </div>
                                    </div>
                                    <p className="py-6">
                                        <span className="font-semibold text-gray-500 text-base">THÔNG TIN LIÊN HỆ</span>
                                        <hr className="mt-4" />
                                    </p>
                                    <div className="ml-3">
                                        <div className="flex items-center mb-2">
                                            <span className="inline-block w-[200px] font-bold">Số điện thoại:</span>
                                            {isEditing ? (
                                                <Form.Item
                                                    name="phone_number"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            whitespace: true,
                                                            pattern: validationPatterns.phoneNumber.pattern,
                                                            message: validationPatterns.phoneNumber.message,
                                                        },
                                                    ]}
                                                >
                                                    <Input placeholder="Nhập số điện thoại" className="w-[200px]" />
                                                </Form.Item>
                                            ) : (
                                                <a href={`tel:${data?.phone_number}`} className="text-[#007bff] underline">
                                                    {data?.phone_number || "Chưa cập nhật"}
                                                </a>
                                            )}
                                        </div>

                                        <div className="flex items-center mb-2">
                                            <span className="inline-block w-[200px] font-bold">Email:</span>
                                            {isEditing ? (
                                                <Form.Item
                                                    name="email"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            whitespace: true,
                                                            pattern: validationPatterns.email.pattern,
                                                            message: validationPatterns.email.message,
                                                        },
                                                    ]}
                                                >
                                                    <Input placeholder="Nhập email" className="w-[200px]" />
                                                </Form.Item>
                                            ) : (
                                                <a href={`mailto:${data?.email}`} className="text-[#007bff] underline">
                                                    {data?.email}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Form>
                        </div>
                    </div>
                </TabPane>
                {/* Tab Cài đặt */}
                <TabPane tab="Cài đặt" key="2" icon={<SettingOutlined />}>
                    <div className=" p-6 rounded-lg">
                        <ChangePassword />
                        {/* Các cài đặt khác có thể được bổ sung ở đây */}
                        <Divider>Các cài đặt khác</Divider>
                    </div>
                </TabPane>
            </Tabs>
        </div >
    );
};

export default Profile;
