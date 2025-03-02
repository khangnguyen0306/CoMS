import React, { useState, useEffect } from 'react';
import Logo from '../../assets/image/letterC.svg';
import { Form, Image, Input, Button, Alert, message } from 'antd';
import { useForm } from 'antd/es/form/Form';
import { UserOutlined } from '@ant-design/icons';
import { useChangePasswordByEmailMutation, useSendResetEmailMutation, useVerifyOtpMutation } from '../../services/AuthAPI';
import { validationPatterns } from '../../utils/ultil';

const ForgotPass = ({ setIsForgotPass }) => {
    const [form] = useForm();
    const [error, setError] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isCodeInput, setIsCodeInput] = useState(true);
    const [forgotpass, { isLoading }] = useSendResetEmailMutation();
    const [verifyCode, { isLoading: isLoadingVerify }] = useVerifyOtpMutation();
    const [changePassword, { isLoading: isLoadingChange }] = useChangePasswordByEmailMutation();
    const [isVerified, setIsVerified] = useState(false);
    const [codeVerify, setCodeVerify] = useState('')
    const [token, setToken] = useState('')
    console.log(token);
    // Hàm gửi mã
    const handleSendCode = async () => {
        const email = form.getFieldValue('email');
        if (email) {
            try {
                const sendEmail = await forgotpass(email);
                if (sendEmail.data.status === "OK") {
                    const messagesc = "Email đã được gửi đến bạn hãy kiểm tra !"
                    message.success(messagesc)
                    setIsCodeSent(true);
                    setTimerActive(true);
                    setCountdown(120);
                } else {
                    setError('Email không tồn tại.');
                }
            } catch (error) {
                setError('Gửi mã thất bại, vui lòng kiểm tra lại Email hoặc số điện thoại.');
            }
        } else {
            setError('Vui lòng nhập email hoặc số điện thoại');
        }
    };


    const handleInputChange = () => {
        const email = form.getFieldValue('email');
        setIsButtonDisabled(!email);
    };

    const handleInputCode = (values) => {
        setCodeVerify(values)
        const code = form.getFieldValue('verificationCode');
        setIsCodeInput(!isCodeInput);
    };

    const handleCheckOTP = async () => {
        const email = form.getFieldValue('email');
        if (codeVerify) {
            try {
                const codeCheck = await verifyCode({ email: email, otp: codeVerify });
                if (codeCheck.error) {
                    setError('Mã xác thực không đúng.');
                } else {
                    setToken(codeCheck.data.data);
                    setIsVerified(!isVerified);
                }
            } catch (e) {
                console.log(e);
            }
        };
    }
    const handleResetPassword = async () => {
        const email = form.getFieldValue('email');
        const newPassword = form.getFieldValue('new_password');
        const confirmPassword = form.getFieldValue('confirm_password');
        // console.log(email, newPassword, confirmPassword)
        if (codeVerify) {
            try {
                const changePass = await changePassword({ email: email, new_password: newPassword, confirm_password: confirmPassword, token: token });
                // console.log(changePass);
                if (changePass.data.status === "OK") {
                    const messagesc = "Mật khẩu đã được thay đổi !"
                    message.success(messagesc)
                    setIsForgotPass(false)
                    form.resetFields();
                } else {
                    const messagesc = "Vui lòng kiểm tra lại !"
                    message.error(messagesc)
                }
            } catch (e) {
                const messagesc = "Có lỗi xảy ra vui lòng thử lại !"
                message.error(messagesc)
            }
        };
    }

    useEffect(() => {
        let timer;
        if (timerActive && countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        } else if (countdown === 0) {
            setTimerActive(false);
        }
        return () => clearTimeout(timer);
    }, [countdown, timerActive]);

    return (
        <div className="h-[100%] flex flex-col items-center">
            {/* header */}
            <div className="flex flex-col text-center mb-7 items-center justify-center w-[80%] ">
                <Image
                    width={50}
                    height={40}
                    preview={false}
                    src={Logo}
                />
                <p className="text-3xl font-bold p-5">Quên mật khẩu</p>
                <p className="text-sm text-white">
                    Nhập email hoặc username của bạn và chúng tôi sẽ gửi cho bạn mã khôi phục mật khẩu.
                </p>
            </div>

            <Form
                form={form}
                onFinish={handleSendCode}
                className='w-[80%]'
                layout="vertical"
            >
                {error && (
                    <>
                        <Alert message={error} type="error" showIcon />
                        <br />
                    </>
                )}
                <Form.Item
                    label={<span className='text-white'>Email hoặc số điện thoại</span>}
                    style={{ marginBottom: '1.5rem' }}
                    name="email"
                    rules={[{ required: true, message: "Trường này không được để trống" }]}
                >
                    <Input
                        placeholder="    Email hoặc số điện thoại"
                        size="large"
                        className="form-input py-2"
                        prefix={<UserOutlined />}
                        onChange={handleInputChange}
                    />
                </Form.Item>

                {/* Nút Gửi mã + Input nhập mã */}
                {!isVerified && (
                    <Form.Item
                        className='w-full mb-[0.5rem]  '
                        name="verificationCode"
                        rules={[{ required: true, message: "Vui lòng nhập mã xác nhận" }]}
                    >
                        <div className='flex items-center'>
                            <div>
                                <Input.OTP
                                    disabled={!isCodeSent}
                                    placeholder="Nhập mã xác nhận"
                                    size="large"
                                    className="form-input"
                                    onChange={handleInputCode}
                                />
                            </div>
                            <div>
                                <Button
                                    type="primary"
                                    onClick={handleSendCode}
                                    disabled={isButtonDisabled || timerActive}
                                    className=" h-10 ml-2 "
                                    loading={isLoading}
                                >
                                    {timerActive ? `${countdown} giây` : 'Gửi mã'}
                                </Button>
                            </div>
                        </div>
                    </Form.Item>
                )}
                {isVerified && (
                    <>
                        <Form.Item
                            label={<span className='text-white'>Mật khẩu mới</span>}
                            name="new_password"
                            rules={[
                                {
                                    required: true,
                                    pattern: validationPatterns.password.pattern,
                                    message: validationPatterns.password.message

                                }
                            ]}
                        >
                            <Input.Password placeholder="Nhập mật khẩu mới" size="large" />
                        </Form.Item>
                        <Form.Item
                            label={<span className='text-white'> Xác nhận Mật khẩu mới</span>}
                            name="confirm_password"
                            rules={[
                                { required: true, message: 'Nhập lại mật khẩu để xác nhận!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('new_password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu không khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="Xác nhận mật khẩu" size="large" />
                        </Form.Item>
                    </>
                )}
                {!isVerified ? (
                    <Form.Item>
                        <Button
                            type="primary"
                            onClick={handleCheckOTP}
                            disabled={isCodeInput}
                            size="large"
                            className="
                        mt-5
                        w-full
                        bg-gradient-to-r 
                        from-blue-500 to-cyan-400 text-white 
                        font-medium rounded-full py-2 px-6 transition-transform duration-800
                         hover:from-cyan-400 hover:to-blue-500 hover:scale-105 hover:shadow-cyan-200 hover:shadow-lg"
                        >
                            Kiểm tra
                        </Button>
                    </Form.Item>
                ) : (
                    <Form.Item>
                        <Button
                            type="primary"
                            onClick={handleResetPassword}
                            size="large"
                            loading={isLoadingChange}
                            className="
                        mt-5
                        w-full
                        bg-gradient-to-r 
                        from-blue-500 to-cyan-400 text-white 
                        font-medium rounded-full py-2 px-6 transition-transform duration-800
                         hover:from-cyan-400 hover:to-blue-500 hover:scale-105 hover:shadow-cyan-200 hover:shadow-lg"
                        >
                            Đổi mật khẩu
                        </Button>
                    </Form.Item>
                )}
            </Form>
        </div>
    );
};

export default ForgotPass;
