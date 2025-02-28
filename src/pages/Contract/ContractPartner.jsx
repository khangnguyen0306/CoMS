import React, { useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag, Form, Select, InputNumber, Upload } from "antd";
import { EditOutlined, DeleteOutlined, SettingOutlined, FullscreenOutlined, EditFilled, DownloadOutlined, UploadOutlined } from "@ant-design/icons";
import { useGetAllContractPartnerQuery } from "../../services/ContractAPI";
import { BsClipboard2DataFill } from "react-icons/bs"
import { IoNotifications } from "react-icons/io5";
const { Search } = Input;

const ContractPartner = () => {
    const { data: contracts, isLoading, isError } = useGetAllContractPartnerQuery();
    const [searchText, setSearchText] = useState("");
    // console.log(contracts)
    const handleDelete = (record) => {
        if (record.status === "đang hiệu lực" || record.status === "đã thanh toán") {
            message.warning("Không thể xóa hợp đồng đang hiệu lực hoặc đã thanh toán.");
            return;
        }
        message.success("Xóa hợp đồng thành công!");
    };

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [fileList, setFileList] = useState([]);

    const onChange = ({ fileList }) => {
        setFileList(fileList);
        console.log("File list:", fileList);
    };


    const statusContract = {
        'Đang tạo': <Tag color="default"> Đang tạo </Tag>,
        'Đang hiệu lực': <Tag color="processing"> Đang hiệu lực </Tag>,
        'Đã thanh toán': <Tag color="success"> Đã thanh toán </Tag>,
        'Đã hủy': <Tag color="red-inverse"> Đã hủy </Tag>,
        'Chưa thanh toán': <Tag color="gold">Chưa thanh toán</Tag>,
        'Chờ phê duyệt': <Tag color="gold-inverse">Chờ phê duyệt</Tag>,
        'Đối tác ký': <Tag color="geekblue">Đối tác ký</Tag>,
        'Chưa thanh lý': <Tag color="lime">Chưa thanh lý</Tag>,
        'Đã thanh lý': <Tag color="pink">Đã thanh lý</Tag>,
        'Hết hiệu lực': <Tag color="red">Hết hiệu lực</Tag>,

    };

    const handleSubmit = (values) => {

        console.log("Form Data:", dataToSubmit);
        message.success("Dữ liệu hợp đồng đã được in ra console!");
        // Reset lại modal và form
        setIsModalVisible(false);
        form.resetFields();
        setFileList([]);
        setUploadedFile(null);
    };


    const columns = [
        {
            title: "Mã hợp đồng",
            dataIndex: "contract_code",
            key: "contract_code",
        },
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            sorter: (a, b) => new Date(b.created_at) - new Date(a.created_at),
            render: (text) => new Date(text).toLocaleDateString("vi-VN"),
            defaultSortOrder: 'ascend',
        },
        {
            title: "Tải file",
            dataIndex: "file_name",
            key: "file_name",
            render: (text, record) => (
                <div className="flex flex-col items-center gap-3">
                    <p>{text}</p>
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();

                            let downloadUrl = record.file_url;

                            // Kiểm tra nếu URL chứa "docs.google.com"
                            if (downloadUrl.includes("docs.google.com")) {
                                const fileIdMatch = downloadUrl.match(/\/d\/([^/]+)/);
                                if (fileIdMatch && fileIdMatch[1]) {
                                    const fileId = fileIdMatch[1];
                                    // Chuyển đổi URL xem sang URL tải về PDF (bạn có thể thay đổi định dạng nếu cần)
                                    downloadUrl = `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
                                }
                            }
                            // Tạo thẻ <a> ẩn để tải file
                            const link = document.createElement("a");
                            link.href = downloadUrl;
                            link.download = record.file_name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        Tải file
                    </Button>
                </div>
            ),
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "contract_name",
            key: "contract_name",
            sorter: (a, b) => a.contract_name.localeCompare(b.contract_name),
        },
        {
            title: "Đối tác",
            dataIndex: "partner",
            key: "partner",
            sorter: (a, b) => a.partner.localeCompare(b.partner),
        },
        {
            title: "Loại hợp đồng",
            dataIndex: "contract_type",
            key: "contract_type",
            render: (type) => <Tag color="blue">{type.replace(/^Hợp đồng\s*/, "")}</Tag>,
            filters: [...new Set(contracts?.map(contract => contract.contract_type))].map(type => ({
                text: type.replace(/^Hợp đồng\s*/, ""),
                value: type.replace(/^Hợp đồng\s*/, "")
            })),
            onFilter: (value, record) => record.contract_type.replace(/^Hợp đồng\s*/, "") === value,
        },

        {
            title: "Giá trị",
            dataIndex: "value",
            key: "value",
            render: (value) => value.toLocaleString("vi-VN") + " VND",
            sorter: (a, b) => a.value - b.value,
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            filters: Object.keys(statusContract).map(status => ({
                text: status,
                value: status,
            })),
            onFilter: (value, record) => record.status === value,
            render: (type) => statusContract[type],
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: "edit",
                                    icon: <EditFilled style={{ color: '#228eff' }} />,
                                    label: "Sửa",
                                    onClick: () => message.info("Cập nhật hợp đồng!"),
                                },
                                {
                                    key: "updateStatus",
                                    icon: <BsClipboard2DataFill />,
                                    label: "Cập nhật trạng thái",
                                    onClick: () => message.info("Cập nhật trạng thái hợp đồng!"),
                                },
                                {
                                    key: "updateNotification",
                                    icon: <IoNotifications />,
                                    label: "Cập nhật thông báo",
                                    onClick: () => message.info("Cập nhật thông báo hợp đồng!"),
                                },
                                {
                                    key: "delete",
                                    icon: <DeleteOutlined />,
                                    label: "Xóa",
                                    danger: true,
                                    onClick: () => handleDelete(record),
                                },
                            ],
                        }}
                    >
                        <Button><SettingOutlined /></Button>
                    </Dropdown>
                </Space>
            ),
        },
    ];

    return (
        <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    Quản lý hợp đồng đối tác
                </p>
                <div className="flex flex-row gap-4">
                    <Space style={{ marginBottom: 16 }}>
                        <Search
                            placeholder="Nhập tên hợp đồng, tên partner hoặc tên người tạo"
                            allowClear
                            onSearch={setSearchText}
                            style={{ width: "100%", minWidth: 500, maxWidth: 1200, marginBottom: 20 }}
                            enterButton="Tìm kiếm"
                            disabled={isLoading}
                        />
                    </Space>
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        style={{ marginBottom: 16 }}
                        onClick={() => setIsModalVisible(true)}
                    >
                        Tạo hợp đồng
                    </Button>
                </div>
                <Table
                    columns={columns}
                    dataSource={contracts?.filter(item =>
                        item.contract_name.toLowerCase().includes(searchText?.toLowerCase()) ||
                        item.partner.toLowerCase().includes(searchText?.toLowerCase()) ||
                        item.contract_code.toLowerCase().includes(searchText?.toLowerCase())
                    )}
                    rowKey="id"
                    loading={isLoading}
                    onRow={(record) => ({ onClick: () => setSelectedContract(record) })}
                />
                <Modal
                    title="Tạo hợp đồng"
                    visible={isModalVisible}
                    onCancel={() => setIsModalVisible(false)}
                    footer={null}
                >
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item
                            name="contract_code"
                            label="Mã hợp đồng"
                            rules={[{ required: true, message: "Vui lòng nhập mã hợp đồng" }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="contract_name"
                            label="Tên hợp đồng"
                            rules={[{ required: true, message: "Vui lòng nhập tên hợp đồng" }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="partner"
                            label="Đối tác"
                            rules={[{ required: true, message: "Vui lòng nhập tên đối tác" }]}
                        >
                            <Input />
                        </Form.Item>
                        <Form.Item
                            name="contract_type"
                            label="Loại hợp đồng"
                            rules={[{ required: true, message: "Vui lòng chọn loại hợp đồng" }]}
                        >
                            <Select placeholder="Chọn loại hợp đồng">
                                <Option value="Hợp đồng dịch vụ">Hợp đồng dịch vụ</Option>
                                <Option value="Hợp đồng mua bán">Hợp đồng mua bán</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="value"
                            label="Giá trị hợp đồng"
                            rules={[{ required: true, message: "Vui lòng nhập giá trị hợp đồng" }]}
                        >
                            <InputNumber style={{ width: "100%" }} />
                        </Form.Item>
                        <Form.Item label="File hợp đồng">
                            <Upload
                                onChange={onChange}
                                fileList={fileList}
                                accept="application/pdf"
                                listType="text" // hiển thị tên file đơn giản
                            >
                                <Button icon={<UploadOutlined />}>Chọn file PDF</Button>
                            </Upload>
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit">
                                Gửi
                            </Button>
                        </Form.Item>
                    </Form>
                </Modal>
            </div>

        </div>
    );
};

export default ContractPartner;
