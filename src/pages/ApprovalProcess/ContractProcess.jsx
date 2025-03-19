import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag, ConfigProvider } from "antd";
import { useGetContractStatusQuery } from "../../services/ContractAPI";
import { Link, useNavigate } from "react-router-dom";
import Process from "../Process/Process";
import dayjs from "dayjs";
import { CheckCircleFilled, EditFilled, ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { useResubmitProcessMutation } from "../../services/ProcessAPI";
const { Search } = Input;

const ContractProcess = () => {
    const { data: contractsStatus, isLoading, isError, refetch } = useGetContractStatusQuery();

    const [resubmitProcess, { isLoading: loadingResubmit }] = useResubmitProcessMutation();
    const [searchText, setSearchText] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    useEffect(() => {
        refetch();
    }, [contractsStatus]);
    const contracts = contractsStatus?.data?.content

    console.log(contracts);
    const navigate = useNavigate();
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
        refetch();

    };
    const resendProcess = async (record) => {
        try {
            await resubmitProcess({ contractId: record.id });
            refetch();

            message.success("Gửi lại yêu cầu phê duyệt thành công");
        } catch (error) {
            console.error("Lỗi khi gửi lại yêu cầu:", error);
            message.error("Gửi lại yêu cầu phê duyệt thất bại. Vui lòng thử lại!");
        }
    };


    const columns = [
        {
            title: "MHĐ",
            dataIndex: "contractNumber",
            key: "contractNumber",
            width: "8%",
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            width: "12%",
            render: (createdAt) =>
                createdAt
                    ? dayjs(
                        new Date(createdAt[0], createdAt[1] - 1, createdAt[2])
                    ).format("DD/MM/YYYY")
                    : "Chưa cập nhật",
            sorter: (a, b) => {
                const dateA = new Date(a.createdAt[0], a.createdAt[1] - 1, a.createdAt[2], a.createdAt[3], a.createdAt[4], a.createdAt[5]);
                const dateB = new Date(b.createdAt[0], b.createdAt[1] - 1, b.createdAt[2], b.createdAt[3], b.createdAt[4], b.createdAt[5]);
                return dateA - dateB;
            },
            defaultSortOrder: "ascend",
        },
        {
            title: "Người tạo",
            dataIndex: ["user", "full_name"],
            key: "user?.full_name",
            width: "10%",
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "title",
            key: "title",
            width: "20%",
            sorter: (a, b) => a.title.localeCompare(b.title),
            render: (text, record) => {
                if (record.status === "REJECTED") {
                    return (
                        <Link
                            className="font-bold text-[#228eff] block truncate max-w-[200px]"
                            to={`/EditContract/${record.id}`}
                            title={text}
                        >
                            {text}
                        </Link>
                    );
                } else if (record.status === "CREATED" || record.status === "UPDATED" || record.status === "FIXED") {
                    return (
                        <span className="block truncate max-w-[200px]" title={text}>
                            {text}
                        </span>
                    );
                }
            },
        },


        {
            title: "Loại hợp đồng",
            dataIndex: ["contractType", "name"],
            key: "contractType.name",
            width: "17%",
            render: (type) => <Tag color="blue">{type}</Tag>,
            // filters: [...new Set(contracts?.map(contract => contract.contract_type))].map(type => ({
            //     text: type,
            //     value: type,
            // })),
            onFilter: (value, record) => record.contract_type === value,
        },
        {
            title: "Đối tác",
            dataIndex: ["partner", "partnerName"],
            key: "partner.partnerName",
            width: "18%",
            sorter: (a, b) => a.partner.localeCompare(b.partner),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            width: "10%",
            filters: [
                { text: "Đã tạo", value: "CREATED" },
                { text: "Chưa được duyệt", value: "REJECTED" },
                { text: "Đã cập nhật", value: "UPDATED" },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status) => {
                let color = "green";
                let text = "Đã tạo";

                if (status === "REJECTED") {
                    color = "red";
                    text = "Đã bị từ chối";
                } else if (status === "UPDATED") {
                    color = "blue";
                    text = "Đã cập nhật";
                } else if (status === "FIXED") {
                    color = "orange";
                    text = "Đã sửa lỗi";
                }

                return <Tag color={color}>{text}</Tag>;
            },
        },


        {
            title: "Phiên bản",
            dataIndex: "version",
            key: "version",
            width: "15%",
            render: (value) => value + ".0.0",
            sorter: (a, b) => a.value - b.value,
        },
        // {
        //     title: "Giá trị",
        //     dataIndex: "amount",
        //     key: "amount",
        //     width: "15%",
        //     render: (value) => value.toLocaleString("vi-VN") + " VND",
        //     sorter: (a, b) => a.value - b.value,
        // },
        {
            title: "Hành động",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Dropdown menu={{
                        items: record.status === "REJECTED"
                            ? [
                                {
                                    key: "resend-process",
                                    icon: loadingResubmit ? <Spin size="small" /> : <ReloadOutlined style={{ color: "#F59E0B" }} />,
                                    label: (
                                        <span onClick={() => resendProcess(record)}>
                                            Gửi lại yêu cầu phê duyệt
                                        </span>
                                    ),
                                },
                                {
                                    key: "edit-contract",
                                    icon: <EditFilled style={{ color: "#228eff" }} />,
                                    label: (
                                        <span onClick={() => navigate(`/EditContract/${record.id}`)}>
                                            Chỉnh sửa hợp đồng
                                        </span>

                                    ),
                                },
                            ]
                            : [

                                ...(record?.approvalWorkflowId == null
                                    ? [
                                        {
                                            key: "select-process",
                                            icon: <CheckCircleFilled style={{ color: "#00FF33" }} />,
                                            label: (
                                                <span onClick={() => showModal(record)}>
                                                    Yêu cầu phê duyệt
                                                </span>
                                            ),
                                        },
                                    ]
                                    : [
                                        {
                                            key: "resend-process",
                                            icon: loadingResubmit ? <Spin size="small" /> : <ReloadOutlined style={{ color: "#F59E0B" }} />,
                                            label: (
                                                <span onClick={() => resendProcess(record)}>
                                                    Gửi lại yêu cầu phê duyệt
                                                </span>
                                            ),
                                        },
                                    ]),
                                {
                                    key: "update-contract",
                                    icon: <EditFilled style={{ color: "#228eff" }} />,
                                    label: (
                                        <span onClick={() => navigate(`/EditContract/${record.id}`)}>
                                            Cập nhật hợp đồng
                                        </span>
                                    ),
                                },
                            ]

                    }} trigger={["hover"]}>
                        <Button icon={<SettingOutlined />} />
                    </Dropdown>
                </Space >
            ),
        }


    ];

    console.log(selectedRecord?.contractType?.id);

    return (
        <div className="flex flex-col md:flex-row min-h-[100vh]">
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
                        item?.title?.toLowerCase().includes(searchText.toLowerCase()) ||
                        item?.partner?.partnerName?.toLowerCase().includes(searchText.toLowerCase()) ||
                        item?.user?.full_name?.toLowerCase().includes(searchText.toLowerCase())
                    )}
                    rowKey="id"
                    loading={isLoading}
                // onRow={(record) => ({ onClick: () => setSelectedContract(record) })}s
                />
                <Modal
                    title="Chi tiết bản ghi"
                    width={"80%"}
                    footer={null}
                    open={isModalVisible}
                    onOk={handleOk}
                    onCancel={handleCancel}
                >
                    {/* <p>{selectedRecord ? JSON.stringify(selectedRecord) : "Không có dữ liệu"}</p> */}

                    <Process
                        contractId={selectedRecord?.id}
                        contractTypeId={selectedRecord?.contractType?.id}
                        onProcessApplied={() => {
                            handleCancel();
                            refetch();
                        }}
                    />
                </Modal>
            </div>

        </div>
    );
};

export default ContractProcess;
