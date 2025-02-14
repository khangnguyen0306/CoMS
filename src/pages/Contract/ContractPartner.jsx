import React, { useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag } from "antd";
import { EditOutlined, DeleteOutlined, SettingOutlined, FullscreenOutlined, EditFilled, DownloadOutlined } from "@ant-design/icons";
import { useGetAllContractPartnerQuery } from "../../services/ContractAPI";
import { BsClipboard2DataFill } from "react-icons/bs"
import { IoNotifications } from "react-icons/io5";
const { Search } = Input;

const ContractPartner = () => {
    const { data: contracts, isLoading, isError } = useGetAllContractPartnerQuery();
    const [searchText, setSearchText] = useState("");
    console.log(contracts)
    const handleDelete = (record) => {
        if (record.status === "đang hiệu lực" || record.status === "đã thanh toán") {
            message.warning("Không thể xóa hợp đồng đang hiệu lực hoặc đã thanh toán.");
            return;
        }
        message.success("Xóa hợp đồng thành công!");
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
                            // Tạo một thẻ <a> ẩn để tải file
                            const link = document.createElement("a");
                            link.href = record.fileURL;
                            link.download = record.file_name;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                    >
                        Tải file
                    </Button>

                </div>
            )
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
            </div>

        </div>
    );
};

export default ContractPartner;
