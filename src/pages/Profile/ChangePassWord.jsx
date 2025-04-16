import React, { useCallback } from "react";
import { Form, Input, Button, message, Typography, Modal, notification } from "antd";
import { useChangePassWordMutation } from "../../services/UserAPI";
import { useDispatch, useSelector } from "react-redux";
import { logOut, selectCurrentUser } from "../../slices/authSlice";

const { Title } = Typography;

const ChangePassword = () => {
    const user = useSelector(selectCurrentUser)
    const [form] = Form.useForm();
    const [updatePassWord] = useChangePassWordMutation()
    const dispatch = useDispatch()
    const handleLogout = useCallback(() => {
        dispatch(logOut());
    }, [dispatch]);


    const handleChangePassword = async () => {
        try {
            const values = await form.validateFields(true);
            const result = await updatePassWord({ body: values, userId: user.id })
            console.log(result)
            if(!result.error){
                message.success("Đổi mật khẩu thành công vui lòng đăng nhập lại !");
                form.resetFields();
                handleLogout();
            }else{
                message.error(result.error.data.message);
            }
           
        } catch (error) {
            message.error("Đổi mật khẩu thất bại, vui lòng thử lại.");
        }
    };

    return (
        <div>
            <Title level={4} >Thay đổi mật khẩu</Title>
            <Form form={form} layout="vertical" className="mt-6">
                <Form.Item
                    label="Mật khẩu cũ"
                    name="old_password"
                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập mật khẩu cũ!" }]}
                >
                    <Input.Password placeholder="Nhập mật khẩu cũ" />
                </Form.Item>
                <Form.Item
                    label="Mật khẩu mới"
                    name="new_password"
                    rules={[{ required: true, whitespace: true, message: "Vui lòng nhập mật khẩu mới!" }]}
                >
                    <Input.Password placeholder="Nhập mật khẩu mới" />
                </Form.Item>
                <Form.Item
                    label="Xác nhận mật khẩu mới"
                    name="confirm_password"
                    rules={[
                        { required: true, whitespace: true, message: "Vui lòng xác nhận mật khẩu mới!" },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue("new_password") === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error("Mật khẩu xác nhận không khớp!"));
                            },
                        }),
                    ]}
                >
                    <Input.Password placeholder="Xác nhận mật khẩu mới" />
                </Form.Item>
                <Button type="primary" onClick={handleChangePassword}>
                    Đổi mật khẩu
                </Button>
            </Form>

        </div>
    );
};

export default ChangePassword;
