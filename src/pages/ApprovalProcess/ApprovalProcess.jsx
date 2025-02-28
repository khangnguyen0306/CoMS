import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form, Select, Steps, message } from "antd";
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons";
import { useGetAllUserQuery } from "../../services/UserAPI";
import { useGetProcessTemplatesQuery } from "../../services/ProcessAPI";
import dayjs from "dayjs";

const { Step } = Steps;
const { Option } = Select;

const ApprovalProcess = () => {
    // Lấy dữ liệu mẫu quy trình từ API
    const { data: processTemplatesData } = useGetProcessTemplatesQuery();
    // Lấy danh sách user từ API (dùng cho phần chọn manager)
    const { data: userData } = useGetAllUserQuery({
        keyword: "",
        page: 0,
        limit: 10,
    });

    // Lọc ra các user có role.id = 2 (Manager)
    const filterUsers = (users) => users.filter((user) => user.role.id === 2);
    const filteredUsers = userData?.users ? filterUsers(userData.users) : [];

    // State chứa danh sách mẫu quy trình (khởi tạo từ API nếu có)
    const [processes, setProcesses] = useState([]);
    useEffect(() => {
        if (processTemplatesData) {
            setProcesses(processTemplatesData);
        }
    }, [processTemplatesData]);

    // State hiển thị modal thêm quy trình
    const [isModalVisible, setIsModalVisible] = useState(false);

    // States cho modal tạo quy trình (Steps + Form)
    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm();
    // Lưu các lựa chọn của từng bước; ban đầu có 3 bước + bước cuối tự động
    const [approvals, setApprovals] = useState({
        stage1: null,
        stage2: null,
        stage3: null,
        stageFinal: null,
    });
    // Số bước ký duyệt tự tạo (không bao gồm bước cuối)
    const [customStagesCount, setCustomStagesCount] = useState(3);

    // Hàm tạo mảng các bước (Steps) dựa trên customStagesCount hiện tại
    const generateSteps = () => {
        const steps = [];
        for (let i = 1; i <= customStagesCount; i++) {
            steps.push({
                key: `stage${i}`,
                title: (
                    <div className="flex items-center">
                        {`Ký duyệt đợt ${i}`}
                        {/* Hiển thị icon dấu trừ nếu có hơn 1 bước */}
                        {customStagesCount > 1 && (
                            <MinusCircleOutlined
                                className="ml-2 text-red-500 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveStage(i);
                                }}
                            />
                        )}
                    </div>
                ),
                content: (
                    <Form.Item
                        name={`stage${i}`}
                        label={`Chọn manager duyệt đợt ${i}`}
                        rules={[{ required: true, message: "Vui lòng chọn manager!" }]}
                    >
                        <Select placeholder="Chọn manager">
                            {filteredUsers.map((manager) => (
                                <Option key={manager.id} value={manager.id}>
                                    {manager.full_name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                ),
            });
        }
        // Bước cuối tự động (không có icon xóa)
        steps.push({
            key: "stageFinal",
            title: "Đợt cuối",
            content: (
                <Form.Item
                    name="stageFinal"
                    label="Chọn manager duyệt đợt cuối"
                    rules={[{ required: true, message: "Vui lòng chọn manager!" }]}
                >
                    <Select placeholder="Chọn manager">
                        {filteredUsers.map((manager) => (
                            <Option key={manager.id} value={manager.id}>
                                {manager.full_name}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
            ),
        });
        return steps;
    };

    const stepsData = generateSteps();

    // Hàm xử lý xóa 1 bước ký duyệt (chỉ áp dụng cho các bước trong customStagesCount)
    const handleRemoveStage = (stageNumber) => {
        // Nếu xóa bước đang hiển thị, chuyển current về bước trước nếu cần
        let newCurrent = current;
        if (current >= stageNumber) {
            newCurrent = Math.max(0, current - 1);
            setCurrent(newCurrent);
        }
        // Giảm số bước ký duyệt
        setCustomStagesCount((prev) => prev - 1);

        // Cập nhật state approvals: xóa key tương ứng và dịch chuyển các bước sau nó
        setApprovals((prev) => {
            const newApprovals = {};
            // Duyệt qua các bước mới sau khi xóa
            for (let i = 1; i <= customStagesCount; i++) {
                if (i < stageNumber) {
                    newApprovals[`stage${i}`] = prev[`stage${i}`];
                } else if (i > stageNumber) {
                    // Dịch chuyển giá trị từ bước i sang bước i-1
                    newApprovals[`stage${i - 1}`] = prev[`stage${i}`];
                }
            }
            // Giữ lại stageFinal
            newApprovals.stageFinal = prev.stageFinal;
            return newApprovals;
        });
        message.info(`Đã xóa bước ký duyệt đợt ${stageNumber}`);
    };

    // Xử lý bước "Tiếp tục"
    const next = () => {
        form
            .validateFields()
            .then((values) => {
                if (current < customStagesCount) {
                    const stageKey = `stage${current + 1}`;
                    setApprovals((prev) => ({ ...prev, [stageKey]: values[stageKey] }));
                    setCurrent(current + 1);
                    form.resetFields();
                } else {
                    // Ở bước "Đợt cuối": lưu dữ liệu và tạo mẫu quy trình mới
                    const stageKey = "stageFinal";
                    setApprovals((prev) => ({ ...prev, [stageKey]: values[stageKey] }));
                    const newProcess = {
                        id: processes.length + 1,
                        name: `Mẫu quy trình chuẩn ${processes.length + 1}`,
                        customStagesCount,
                        createdAt: new Date().toISOString(),
                        approvals: { ...approvals, [stageKey]: values[stageKey] },
                        summary: [...Array(customStagesCount).keys()].map((i) => {
                            const key = `stage${i + 1}`;
                            const manager = filteredUsers.find((m) => m.id === approvals[key]);
                            return manager ? manager.full_name : "Chưa chọn";
                        }).concat(
                            (() => {
                                const manager = filteredUsers.find((m) => m.id === values[stageKey]);
                                return manager ? manager.full_name : "Chưa chọn";
                            })()
                        ),
                    };
                    setProcesses([...processes, newProcess]);
                    message.success("Mẫu quy trình đã được tạo thành công!");
                    // Reset modal
                    setCurrent(0);
                    setApprovals({
                        stage1: null,
                        stage2: null,
                        stage3: null,
                        stageFinal: null,
                    });
                    form.resetFields();
                    setIsModalVisible(false);
                    // Reset số bước về mặc định (3 bước)
                    setCustomStagesCount(3);
                }
            })
            .catch((error) => {
                console.log("Validation Failed:", error);
            });
    };

    const prev = () => {
        setCurrent(current - 1);
    };

    // Xử lý chuyển bước khi click vào Steps (validate bước hiện tại)
    const handleStepChange = (newStep) => {
        if (newStep !== current) {
            form
                .validateFields()
                .then((values) => {
                    const stageKey =
                        current < customStagesCount ? `stage${current + 1}` : "stageFinal";
                    setApprovals((prev) => ({ ...prev, [stageKey]: values[stageKey] }));
                    const newStageKey =
                        newStep < customStagesCount ? `stage${newStep + 1}` : "stageFinal";
                    form.setFieldsValue({ [newStageKey]: approvals[newStageKey] });
                    setCurrent(newStep);
                })
                .catch((error) => {
                    console.log("Validation Failed:", error);
                });
        }
    };

    // Hàm xử lý thêm đợt ký duyệt (chỉ thêm vào cuối danh sách bước ký duyệt)
    const handleAddStage = () => {
        setCustomStagesCount(customStagesCount + 1);
        setApprovals((prev) => ({ ...prev, [`stage${customStagesCount + 1}`]: null }));
    };

    // Các cột của bảng mẫu quy trình
    const columns = [
        {
            title: "Mã quy trình",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "Tên mẫu quy trình",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Số bước ký duyệt",
            dataIndex: "customStagesCount",
            key: "customStagesCount",
            render: (text) => `${text} đợt + 1 (đợt cuối)`,
        },
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (date) => dayjs(date).format("DD-MM-YYYY"),
        },
        {
            title: "Danh sách duyệt",
            dataIndex: "summary",
            key: "summary",
            render: (summary) => summary.join(" -> "),
        },
    ];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h2 className="font-bold text-2xl">Quản Lý Mẫu Quy Trình Ký Duyệt</h2>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
                    Thêm quy trình
                </Button>
            </div>

            {/* Bảng hiển thị danh sách mẫu quy trình */}
            <Table dataSource={processes} columns={columns} rowKey="id" />

            {/* Modal thêm mẫu quy trình */}
            <Modal
                title="Tạo Mẫu Quy Trình Ký Duyệt"
                visible={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setCurrent(0);
                    form.resetFields();
                }}
                footer={null}
            >
                <div className="mb-4">
                    <h3 className="font-bold text-xl">Chọn Quy Trình Ký Duyệt</h3>
                </div>
                <div className="flex pb-12">
                    {/* Steps hiển thị các bước */}
                    <div className="mr-4 h-auto max-w-[50%]">
                        <Steps current={current} direction="vertical" style={{ height: "100%" }} onChange={handleStepChange}>
                            {stepsData.map((item, index) => {
                                const stageKey = index < customStagesCount ? `stage${index + 1}` : "stageFinal";
                                return (
                                    <Step
                                        key={item.key || index}
                                        title={item.title}
                                        description={
                                            approvals[stageKey]
                                                ? `Người duyệt: ${filteredUsers.find((m) => m.id === approvals[stageKey])?.full_name || ""}`
                                                : ""
                                        }
                                    />
                                );
                            })}
                        </Steps>
                        <div className="flex gap-4 mt-4">
                            <Button type="primary" onClick={handleAddStage}>
                                Thêm đợt ký duyệt
                            </Button>
                            <Button>Áp dụng quy trình</Button>
                        </div>
                    </div>
                    {/* Form hiển thị nội dung bước hiện tại */}
                    <div className="flex-1">
                        <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                            {stepsData[current].content}
                            <div style={{ marginTop: 24 }}>
                                {current > 0 && (
                                    <Button style={{ marginRight: 8 }} onClick={prev}>
                                        Quay lại
                                    </Button>
                                )}
                                <Button type="primary" onClick={next}>
                                    {current === stepsData.length - 1 ? "Hoàn thành" : "Tiếp tục"}
                                </Button>
                            </div>
                        </Form>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ApprovalProcess;
