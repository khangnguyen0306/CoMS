"use client";
import React, { useEffect, useState } from 'react'
import { motion } from "framer-motion";
import { AuroraBackground } from '../../components/ui/BackgroundLogin';
import Logo from '../../assets/Image/Logo.png';
import { Alert, Button, Checkbox, Form, Image, Input, message, notification } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined, UserOutlined } from '@ant-design/icons';
import Cookies from "js-cookie";
import { TypewriterEffectSmooth } from "../../components/ui/TypeWriter";
import { FlipWords } from "../../components/ui/FlipWord";
import { useLoginUserMutation } from '../../services/AuthAPI';
import { selectCurrentToken, selectNotiNumber, setNotiNumber, setToken, setUser } from '../../slices/authSlice';
import ForgotPass from './ForgotPass';
import helloIcon from "./../../assets/Image/hello.svg"
import { useLazyGetNotificationsQuery } from '../../services/NotiAPI';




const Login = () => {
    const [form] = Form.useForm();
    const [error, setError] = useState(null);
    const dispatch = useDispatch();
    const location = useLocation()
    const navigate = useNavigate();
    const [rememberMe, setRememberMe] = useState(false);
    const token = useSelector(selectCurrentToken)
    const notiNumber = useSelector(selectNotiNumber);
    const [isForgotPass, setIsForgoPass] = useState(false);
    const [fetchNotifications, { data }] = useLazyGetNotificationsQuery();

    const handleGetNotiNumber = async () => {
        return fetchNotifications({ page: 0, pageSize: 10 }).unwrap();

        // dispatch(setNotiNumber(number));
    };

    useEffect(() => {
        if (token) {
            handleGetNotiNumber()
                .then(result => {
                    dispatch(setNotiNumber(result.data.content.filter(notification => notification.isRead === false).length));
                    console.log(result.data.content.filter(notification => notification.isRead === true).length);
                    navigate("/");
                })
                .catch(error => {
                    console.error(error);
                });
        }
    }, [token, navigate]);


    const [loginUser, { isLoading }] = useLoginUserMutation();
    // dispatch(setLocation(location.pathname));
    // const previousLocation = useSelector(selectLoacation);

    useEffect(() => {

        const savedEmail = Cookies.get("rememberEmail");
        const savedPassword = Cookies.get("rememberPassword");

        if (savedEmail && savedPassword) {
            form.setFieldsValue({
                login_identifier: savedEmail,
                password: savedPassword,
            });
            setRememberMe(true);
        }
    }, [form]);

    const handleLoginSuccess = (data) => {

        switch (data.data.roles[0]) {
            case "ROLE_ADMIN":
                setTimeout(() => {
                    navigate('/admin', { replace: true });
                }, 50);
                break;
            case "ROLE_MANAGER":
                setTimeout(() => {
                    navigate('/manager', { replace: true });
                }, 50);
                break;
            case "ROLE_STAFF":
                setTimeout(() => {
                    navigate('/');
                }, 50);
                break;
            default:
                break; // Xử lý trường hợp không có vai trò nào phù hợp
        }

        //   const avatar = data.data.avatar; // check for change
        dispatch(setUser(data.data));
        dispatch(setToken(data.data.token));

        // remember me
        if (rememberMe) {
            Cookies.set("rememberEmail", form.getFieldValue("login_identifier"), { expires: 1 });
            Cookies.set("rememberPassword", form.getFieldValue("password"), { expires: 1 });
        }

        notification.info({
            message: <span className='ml-[45px]'>Chào mừng trở lại !</span>,
            duration: 2,
            icon: <Image width={50} height={50} preview={false} src={helloIcon} />,
            description: (
                <div className="flex items-center relative ml-[45px]">
                    <p className="font-bold ">Chào mừng {data.data.fullName} </p>
                    {/* <Image className="ml-2 absolute bottom-[-10px]" width={35} src={null} /> */}
                </div>
            ),
        });
        //   handleCancel();

    };

    const handleLoginFailure = (error, email) => {
        if (error.data.status === "UNAUTHORIZED") {
            setError("Tài khoản hoặc mật khẩu không đúng. vui lòng thử lại!");
            // message.error(error.data.message);
        } else {
            setError("Tài khoản hoặc mật khẩu không đúng. vui lòng thử lại!");
            notification.error({
                message: "Lỗi đăng nhập",
                description: "Tài khoản hoặc mật khẩu không đúng. vui lòng thử lại!",
            });
        }

        form.resetFields();
    };

    const handleSubmit = async (values) => {
        try {
            const result = await loginUser({ login_identifier: values.login_identifier, password: values.password });
            console.log(result);

            if (result.data) {
                handleLoginSuccess(result.data);
            } else {
                handleLoginFailure(result.error, values.login_identifier);
            }
        } catch (error) {
            console.error("Login error:", error);
            message.error("An unexpected error occurred. Please try again later.");
        }
    };

    const handleForgotPass = () => {
        setIsForgoPass(!isForgotPass);
    }

    const words = [

        {
            text: "HỢP",
            className: "text-3xl md:text-5xl font-bold text-white text-center",
        },
        {
            text: "ĐỒNG",
            className: "text-3xl md:text-5xl font-bold text-white text-center",
        },
        {
            text: "THÔNG",
            className: "text-3xl md:text-5xl font-bold text-white text-center",
        },
        {
            text: "MINH",
            className: "text-3xl md:text-5xl font-bold text-white text-center",
        },

    ];
    const words2 = ["Nhanh chóng", "Tiện Lợi", "Đẹp mắt", "Hiện đại"];

    return (
        (
            <AuroraBackground >
                <motion.div
                    initial={{ opacity: 0.0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{
                        delay: 0.3,
                        duration: 0.8,
                        ease: "easeInOut",
                    }}
                    className="relative flex flex-col gap-4 items-center justify-center px-4 w-full mt-[-3rem]">

                    <div className="flex flex-col items-center justify-center w-full mb-5">
                        <TypewriterEffectSmooth words={words} />
                        <div className='text-2xl mx-auto font-thin text-gray-200 dark:text-neutral-400'>
                            Chúng tôi sẽ mang lại cho bạn sự
                            <FlipWords words={words2} /> <br />
                        </div>
                    </div>

                    <div className="flex flex-col text-center items-center justify-center w-full mt-5">
                        <div className="form-container">
                            {isForgotPass ? (
                                <ForgotPass setIsForgotPass={setIsForgoPass} />
                            ) : (
                                <Form form={form} onFinish={handleSubmit} className='min-w-[300px]'>
                                    {error && (
                                        <>
                                            <Alert message={error} type="error" showIcon />
                                            <br />
                                        </>
                                    )}
                                    <div className='flex flex-col gap-2'>
                                        <Form.Item
                                            style={{ marginBottom: '0.5rem' }}
                                            name="login_identifier"
                                            rules={[{ required: true, message: "Trường này không được để trống" }]}
                                        >

                                            <Input
                                                placeholder="  Email hoặc số điện thoại"
                                                size="large"
                                                className="form-Input py-3"
                                                prefix={<UserOutlined className='pr-2' />}

                                            />
                                        </Form.Item>

                                        <Form.Item
                                            name="password"
                                            rules={[{ required: true, message: "Trường này không được để trống" }]}
                                        >
                                            <Input.Password
                                                placeholder="  Mật khẩu"
                                                size="large" className="form-input py-3"

                                                prefix={<LockOutlined className='pr-2' />}
                                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                            />
                                        </Form.Item>
                                    </div>
                                    <Form.Item name="remember" valuePropName="checked">
                                        <Checkbox
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className='text-zinc-300'
                                        >
                                            Ghi nhớ đăng nhập
                                        </Checkbox>
                                    </Form.Item>

                                    <Form.Item>
                                        <Button
                                            size='large'
                                            className="
                                         w-[80%]
                                        bg-gradient-to-r 
                                        from-blue-500 to-cyan-400 text-white 
                                        font-medium rounded-full py-2 px-6 transition-transform duration-800
                                        hover:from-cyan-400 hover:to-blue-500 hover:scale-105 hover:shadow-cyan-200 hover:shadow-lg"
                                            type="primary"
                                            htmlType="submit"
                                            loading={isLoading}

                                        >
                                            Đăng nhập
                                        </Button>
                                    </Form.Item>
                                </Form>
                            )}
                        </div>
                        <div className="mb-4">
                            <button
                                className="mt-3"
                                onClick={handleForgotPass}
                            >
                                <u className="text-[#60a5fa] pl-1 text-[15px] font-SemiBold">
                                    {isForgotPass ? ('Đăng nhập') : ('Quên mật khẩu')}
                                </u>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </AuroraBackground >
        )
    )
}

export default Login



