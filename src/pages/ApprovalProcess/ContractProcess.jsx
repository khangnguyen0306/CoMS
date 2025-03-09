import React, { useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag } from "antd";
import { useGetAllContractQuery } from "../../services/ContractAPI";
import { Link } from "react-router-dom";
import Process from "../Process/Process";
const { Search } = Input;

const ContractProcess = () => {
    const { data: contracts, isLoading, isError } = useGetAllContractQuery();
    const [searchText, setSearchText] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const showModal = (record) => {
        setSelectedRecord(record);
        setIsModalVisible(true);
    };

    const handleOk = () => {
        setIsModalVisible(false);
        setSelectedRecord(null);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setSelectedRecord(null);
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
            title: "Người tạo",
            dataIndex: "creator",
            key: "creator",
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "contract_name",
            key: "name",
            sorter: (a, b) => a.contract_name.localeCompare(b.contract_name),
            render: (text) => <Link className="font-bold text-[#228eff]">{text}</Link>,
        },
        {
            title: "Loại hợp đồng",
            dataIndex: "contract_type",
            key: "contract_type",
            render: (type) => <Tag color="blue">{type}</Tag>,
            filters: [...new Set(contracts?.map(contract => contract.contract_type))].map(type => ({
                text: type,
                value: type,
            })),
            onFilter: (value, record) => record.contract_type === value,
        },
        {
            title: "Đối tác",
            dataIndex: "partner",
            key: "partner",
            sorter: (a, b) => a.partner.localeCompare(b.partner),
        },

        {
            title: "Giá trị",
            dataIndex: "value",
            key: "value",
            render: (value) => value.toLocaleString("vi-VN") + " VND",
            sorter: (a, b) => a.value - b.value,
        },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Button type="primary" onClick={() => showModal(record)}>
                        Chọn quy trình
                    </Button>
                </Space>
            ),
        },
    ];

    console.log(selectedRecord?.id);

    return (
        <div className="flex flex-col md:flex-row">
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    PHÊ DUYỆT HỢP ĐỒNG
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
                        item.contract_name.toLowerCase().includes(searchText.toLowerCase()) ||
                        item.partner.toLowerCase().includes(searchText.toLowerCase()) ||
                        item.creator.toLowerCase().includes(searchText.toLowerCase()) ||
                        item.contract_code.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    rowKey="id"
                    loading={isLoading}
                // onRow={(record) => ({ onClick: () => setSelectedContract(record) })}s
                />
                <Modal
                    title="Chi tiết bản ghi"
                    width={"80%"}
                    footer={null}
                    visible={isModalVisible}
                    onOk={handleOk}
                    onCancel={handleCancel}
                >
                    {/* <p>{selectedRecord ? JSON.stringify(selectedRecord) : "Không có dữ liệu"}</p> */}

                    <Process contractId={selectedRecord?.id} />
                </Modal>
            </div>

        </div>
    );
};

export default ContractProcess;
