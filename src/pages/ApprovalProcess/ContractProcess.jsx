import React, { useEffect, useState } from "react";
import { Table, Input, Space, Button, Dropdown, message, Spin, Modal, Tag, ConfigProvider, Form, Tooltip } from "antd";
import { useGetContractStatusQuery } from "../../services/ContractAPI";
import { Link, useNavigate } from "react-router-dom";
import Process from "../Process/Process";
import dayjs from "dayjs";
import { CheckCircleFilled, EditFilled, ReloadOutlined, SettingOutlined } from "@ant-design/icons";
import { useResubmitProcessMutation } from "../../services/ProcessAPI";
import { useGetNumberNotiForAllQuery } from "../../services/NotiAPI";
const { Search } = Input;

const ContractProcess = () => {

    const [resubmitProcess, { isLoading: loadingResubmit }] = useResubmitProcessMutation();
    const [searchText, setSearchText] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const { refetch: refetchNoti } = useGetNumberNotiForAllQuery();

    const [filters, setFilters] = useState({
        statuses: ['CREATED', 'UPDATED', 'REJECTED', 'FIXED', 'SIGN_OVERDUE']
    });

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
    });
    const { data: contractsStatus, isLoading, isError, refetch } = useGetContractStatusQuery({
        page: pagination.current - 1,
        size: pagination.pageSize,
        statuses: filters.statuses,
        keyword: searchText
    });
    const [form] = Form.useForm();

    useEffect(() => {
        refetch();
    }, [contractsStatus, pagination]);

    const contracts = contractsStatus?.data?.content

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
        form.resetFields();
        setIsModalVisible(false);
        setSelectedRecord(null);
        refetch();

    };
    const resendProcess = async (record) => {
        try {
            await resubmitProcess({ contractId: record.id });
            refetch();
            message.success("Gửi lại yêu cầu phê duyệt thành công");
            refetchNoti()
        } catch (error) {
            console.error("Lỗi khi gửi lại yêu cầu:", error);
            message.error("Gửi lại yêu cầu phê duyệt thất bại. Vui lòng thử lại!");
        }
    };

    const handleTableChange = (pagination, filters, sorter) => {
        // console.log(filters)
        setPagination({
            current: pagination.current,
            pageSize: pagination.pageSize,
        });
        setFilters({
            statuses: filters.status
        });
    };

    const displayColorStatus = {
        "CREATED": { color: 'default', text: 'Đã tạo' },
        "REJECTED": { color: 'red', text: 'Đã bị từ chối duyệt' },
        "UPDATED": { color: 'blue', text: 'Đã cập nhật' },
        "FIXED": { color: 'blue', text: 'Đã sửa đổi' },
        "SIGN_OVERDUE": { color: 'orange', text: 'Đã quá hạn ký' }
    }

    const columns = [
        {
            title: "Mã hợp đồng",
            dataIndex: "contractNumber",
            key: "contractNumber",
            render: (text) => (
                <Tooltip title={text}>
                    <div style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 100
                    }}>
                        {text}
                    </div>
                </Tooltip>
            ),
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
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
            defaultSortOrder: "descend",
        },
        {
            title: "Người tạo",
            dataIndex: ["user", "full_name"],
            key: "full_name",
            render: (text) => <span className="text-[#40a9ff] font-bold">{text}</span>, // Change color to light blue
        },
        {
            title: "Tên hợp đồng",
            dataIndex: "title",
            key: "title",
            // sorter: (a, b) => a.title.localeCompare(b.title),
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
                } else {
                    // } else if (record.status === "CREATED" || record.status === "UPDATED" || record.status === "FIXED") {
                    return (
                        <Link
                            className="font-bold text-[#228eff] block truncate max-w-[200px]"
                            to={`/contractDetail/${record.id}`}
                            title={text}
                        >
                            {text}
                        </Link>
                    );
                }
            },
        },


        {
            title: "Loại hợp đồng",
            dataIndex: ["contractType", "name"],
            key: "contractType.name",
            render: (type) => <Tag color="blue">{type}</Tag>,
            filters: [...new Set(contracts?.map(contract => contract.contractType.name))].map(type => ({
                text: type,
                value: type,
            })),
            onFilter: (value, record) => record.contractType.name === value,
        },
        {
            title: "Đối tác",
            dataIndex: ["partnerB", "partnerName"],
            key: "partnerB.partnerName",
            sorter: (a, b) => a.partner.localeCompare(b.partner),
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            key: "status",
            filters: [
                { text: "Đã tạo", value: "CREATED" },
                { text: "Chưa được duyệt", value: "REJECTED" },
                { text: "Đã cập nhật", value: "UPDATED" },
                { text: "Đã sửa lỗi", value: "FIXED" },
                { text: "Quá hạn", value: "SIGN_OVERDUE" },
            ],
            onFilter: (value, record) => record.status === value,
            render: (status) => {

                return <Tag color={displayColorStatus[status]?.color}>{displayColorStatus[status]?.text}</Tag>;
            },
        },


        {
            title: "Phiên bản",
            dataIndex: "version",
            key: "version",
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


    return (
        <div className="flex flex-col md:flex-row min-h-[100vh]">
            <div className="flex-1 p-4 px-7">
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
                    dataSource={contracts}
                    rowKey="id"
                    loading={isLoading}
                    onChange={handleTableChange}
                    pagination={{
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: contractsStatus?.data.totalElements,
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total) => `Tổng ${total} hợp đồng`,
                    }}
                />

                <Modal
                    title="Chi tiết bản ghi"
                    width={"80%"}
                    footer={null}
                    open={isModalVisible}
                    onOk={handleOk}
                    onCancel={handleCancel}
                >

                    <Process
                        contractId={selectedRecord?.id}
                        contractTypeId={selectedRecord?.contractType?.id}
                        onProcessApplied={() => {
                            handleCancel();
                            refetch();
                            refetchNoti();
                        }}

                    />
                </Modal>
            </div>

        </div>
    );
};

export default ContractProcess;
