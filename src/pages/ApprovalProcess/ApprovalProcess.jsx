import React, { useState, useEffect } from "react";
import { Button, Form, Select, Steps, message, Alert } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";
import { useGetAllUserQuery } from "../../services/UserAPI";
import { useGetProcessTemplatesQuery } from "../../services/ProcessAPI";
import dayjs from "dayjs";

const { Step } = Steps;
const { Option } = Select;

const ApprovalProcess = () => {
    // Lấy dữ liệu mẫu quy trình từ API (nếu có)
    const { data: processTemplatesData } = useGetProcessTemplatesQuery();
    // Lấy danh sách user từ API (dùng cho phần chọn manager)
    const { data: userData } = useGetAllUserQuery({
        keyword: "",
        page: 0,
        limit: 10,
    });

    // Lọc ra các user có role.id = 2 hoặc 3 (Manager)
    const filterUsers = (users) => users.filter((user) => [2, 3].includes(user.role.id));
    const filteredUsers = userData?.users ? filterUsers(userData.users) : [];

    // State chứa danh sách mẫu quy trình (đã tạo từ API hoặc tạo mới)
    const [processes, setProcesses] = useState([]);
    useEffect(() => {
        if (processTemplatesData) {
            setProcesses(processTemplatesData);
        }
    }, [processTemplatesData]);

    // State xác định chế độ tạo/chỉnh sửa quy trình
    const [isCreating, setIsCreating] = useState(false);
    // Các state cho giao diện Steps (cho việc tạo/chỉnh sửa quy trình)
    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm();
    // Lưu các lựa chọn của từng bước; mặc định chỉ có đợt 1 và đợt cuối
    const [approvals, setApprovals] = useState({
        stage1: null,
        stageFinal: null,
    });
    // Số bước ký duyệt tự tạo (không bao gồm bước cuối) - mặc định chỉ có 1 bước (stage1)
    const [customStagesCount, setCustomStagesCount] = useState(1);

    // Hàm tạo mảng các bước (Steps) dựa trên customStagesCount hiện tại
    const generateSteps = () => {
        const steps = [];
        for (let i = 1; i <= customStagesCount; i++) {
            steps.push({
                key: `stage${i}`,
                title: (
                    <div className="flex items-center">
                        {`Ký duyệt đợt ${i}`}
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

    // Hàm xử lý xóa 1 bước ký duyệt (áp dụng cho các bước thuộc customStagesCount)
    const handleRemoveStage = (stageNumber) => {
        let newCurrent = current;
        if (current >= stageNumber) {
            newCurrent = Math.max(0, current - 1);
            setCurrent(newCurrent);
        }
        setCustomStagesCount((prev) => prev - 1);
        setApprovals((prev) => {
            const newApprovals = {};
            for (let i = 1; i <= customStagesCount; i++) {
                if (i < stageNumber) {
                    newApprovals[`stage${i}`] = prev[`stage${i}`];
                } else if (i > stageNumber) {
                    newApprovals[`stage${i - 1}`] = prev[`stage${i}`];
                }
            }
            newApprovals.stageFinal = prev.stageFinal;
            return newApprovals;
        });
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
                    // Sau khi tạo, cập nhật lại state để hiển thị quy trình vừa tạo (chế độ edit)
                    setApprovals(newProcess.approvals);
                    setCustomStagesCount(newProcess.customStagesCount);
                    setCurrent(0);
                    form.setFieldsValue(newProcess.approvals);
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

    // Hàm xử lý thêm đợt ký duyệt (thêm vào cuối danh sách)
    const handleAddStage = () => {
        setCustomStagesCount(customStagesCount + 1);
        setApprovals((prev) => ({ ...prev, [`stage${customStagesCount + 1}`]: null }));
    };

    return (
        <div>
            <div
                className="font-bold mb-10 text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent"
                style={{ textShadow: "8px 8px 8px rgba(0, 0, 0, 0.2)" }}
            >
                <div className="flex items-center gap-4">Quản Lý Quy Trình Ký Duyệt</div>
            </div>

            {/* Nếu chưa ở chế độ tạo mới, hiển thị thông báo + nút tạo mới */}
            {!isCreating ? (
                <div className="flex flex-col items-center gap-4">
                    <Alert message="Chưa có quy trình nào" type="info" showIcon />
                    <Button type="primary" onClick={() => setIsCreating(true)}>
                        Tạo mới quy trình
                    </Button>
                </div>
            ) : (
                // Nếu đang ở chế độ tạo mới, hiển thị giao diện Steps
                <div className="flex pb-12">
                    {/* Cột hiển thị Steps */}
                    <div className="mr-4 h-auto max-w-[50%]">
                        <Steps
                            current={current}
                            direction="vertical"
                            style={{ height: "100%" }}
                            onChange={handleStepChange}
                        >
                            {stepsData.map((item, index) => {
                                const stageKey =
                                    index < customStagesCount ? `stage${index + 1}` : "stageFinal";
                                return (
                                    <Step
                                        key={item.key || index}
                                        title={item.title}
                                        description={
                                            approvals[stageKey]
                                                ? `Người duyệt: ${filteredUsers.find((m) => m.id === approvals[stageKey])
                                                    ?.full_name || ""}`
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
                    {/* Cột hiển thị Form của bước hiện tại */}
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
            )}
        </div>
    );
};

export default ApprovalProcess;
