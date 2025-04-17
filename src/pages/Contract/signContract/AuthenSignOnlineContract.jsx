import { Button, Form, Input } from "antd";

export const AuthenSignContractOnline = ({ onAuth, isLoading, error }) => {

    const handleAuth = async (values) => {
        onAuth(values);
    };

    return (
        <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <Form
                layout="vertical"
                onFinish={handleAuth}
                className="space-y-4"
            >
                <Form.Item
                    label="Tài khoản"
                    name="username"
                    rules={[{ required: true, message: 'Vui lòng nhập tài khoản!' }]}
                >
                    <Input
                        placeholder="Nhập tài khoản"
                        className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                </Form.Item>
                <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                >
                    <Input.Password
                        placeholder="Nhập mật khẩu"
                        className="w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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