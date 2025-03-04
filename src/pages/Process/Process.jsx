import React, { useState, useEffect } from 'react';
import { Radio, Steps, Form, Button, Select } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons';
import { useGetAllUserQuery } from "../../services/UserAPI";
import { useCreateProcessMutation } from "../../services/ProcessAPI";
const { Step } = Steps;
const { Option } = Select;


const Process = () => {
    const [selection, setSelection] = useState("auto");

    // Lấy danh sách user từ API (dùng cho phần chọn manager)
    const { data: userData } = useGetAllUserQuery({
        keyword: "",
        page: 0,
        limit: 10,
    });
    const [create] = useCreateProcessMutation();


    // Lọc ra các user có role.id = 2 hoặc 3 (Manager)
    const filterUsers = (users) => users.filter((user) => [2, 3].includes(user.role.id));
    const filteredUsers = userData?.users ? filterUsers(userData.users) : [];

    console.log("Filtered users:", userData);

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
                    // Ở bước "Đợt cuối": hoàn thành quy trình
                    const stageKey = "stageFinal";
                    setApprovals((prev) => ({ ...prev, [stageKey]: values[stageKey] }));
                    const newProcess = {
                        name: "Quy trình của bạn",
                        customStagesCount,
                        createdAt: new Date().toISOString(),
                        approvals: { ...approvals, [stageKey]: values[stageKey] },
                        summary: [
                            ...Array(customStagesCount)
                                .fill(0)
                                .map((_, i) => {
                                    const key = `stage${i + 1}`;
                                    const manager = filteredUsers.find((m) => m.id === approvals[key]);
                                    return manager ? manager.full_name : "Chưa chọn";
                                }),
                            // Thêm thông tin cho bước cuối
                            (() => {
                                const manager = filteredUsers.find((m) => m.id === values[stageKey]);
                                return manager ? manager.full_name : "Chưa chọn";
                            })(),
                        ],
                    };

                    console.log("New process:", newProcess);
                    message.success("Quy trình của bạn đã được tạo thành công!");

                    // Reset lại state và form sau khi hoàn thành
                    setApprovals({
                        stage1: null,
                        stageFinal: null,
                    });
                    setCustomStagesCount(1);
                    setCurrent(0);
                    form.resetFields();
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
        if (customStagesCount < 5) {
            setCustomStagesCount(customStagesCount + 1);
            setApprovals((prev) => ({ ...prev, [`stage${customStagesCount + 1}`]: null }));
        } else {
            message.error("Chỉ được tạo tối đa 5 đợt ký duyệt");
        }
    };

    const handleChange = (e) => {
        setSelection(e.target.value);
    };

    return (
        <div>
            <div className="flex flex-col gap-2 border-2 border-gray-500 p-4 rounded-xl shadow-lg">

                <div className="flex items-center cursor-pointer">
                    <Radio checked={selection === "auto"} onChange={handleChange} value="auto">Mặc định (hệ thống tự tạo)</Radio>
                    {/* <span className="ml-2">Mặc định (hệ thống tự tạo)</span> */}
                </div>

                <div className='ml-8 my-4'>
                    <Steps
                        direction="vertical"
                        current={0}
                        items={[
                            {
                                title: 'Phê duyệt đợt 1',
                                description: 'Người duyệt: Manager'
                            },
                            {
                                title: 'Phê duyệt đợt 2',
                                description: 'Người duyệt: Manager'
                            },
                            {
                                title: 'Phê duyệt đợt cuối',
                                description: 'Người duyệt: Manager'
                            },
                        ]}
                    />
                </div>

                <div className="flex items-center cursor-pointer">
                    <Radio checked={selection === "custom"} onChange={handleChange} value="custom">Tùy chỉnh</Radio>
                    {/* <span className="ml-2">Tùy chỉnh</span> */}
                </div>
                <div>
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
                </div>

            </div>
            <div className="flex justify-center mt-12">
                <Button
                    className="bg-gradient-to-r from-blue-400 to-blue-700 text-white border-0 hover:from-blue-500 hover:to-blue-800"
                >
                    Áp dụng quy trình
                </Button>
            </div>
        </div>
    );
};

export default Process;
