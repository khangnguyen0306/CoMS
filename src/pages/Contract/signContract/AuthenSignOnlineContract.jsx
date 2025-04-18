import { Button, Form, Input } from "antd";
import { useSelector } from "react-redux";

export const AuthenSignContractOnline = ({ onAuth, isLoading, error }) => {

    const isDarkMode = useSelector((state) => state.theme.isDarkMode);

    const handleAuth = async (values) => {
        onAuth(values);
    };

    return (
        <div className={`w-full max-w-md mx-auto p-6 rounded-lg ${isDarkMode ? 'bg-[#222222] text-white' : 'bg-white text-black'}`}>
            <Form
                layout="vertical"
                onFinish={handleAuth}
                className="space-y-4"
            >
                <Form.Item
                    label="Tài khoản"
                    name="username"
                    rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập !' }]}
                >
                    <Input
                        placeholder="Nhập tài khoản"
                        className={`w-full rounded-md focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                    />
                </Form.Item>
                <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                >
                    <Input.Password
                        placeholder="Nhập mật khẩu"
                        className={`w-full rounded-md focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-white text-black'}`}
                    />
                </Form.Item>
                {error && (
                    <p className="text-red-500 text-sm text-center">{error}</p>
                )}
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={isLoading}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-md"
                    >
                        {isLoading ? 'Đang xác thực...' : 'Xác thực'}
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};