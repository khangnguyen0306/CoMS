import React, { useState, useEffect } from "react";
import { Button, Form, Select, Steps, message, Alert, Empty, Typography } from "antd";
import { MinusCircleOutlined } from "@ant-design/icons";
import { useGetAllUserQuery } from "../../services/UserAPI";
import { useCreateProcessMutation, useGetProcessTemplatesQuery } from "../../services/ProcessAPI";


const { Step } = Steps;
const { Option } = Select;

const ApprovalProcess = () => {
    // Lấy danh sách user từ API (dùng cho phần chọn manager)
    const { data: userData, isLoadingUSer } = useGetAllUserQuery({
        keyword: "",
        page: 0,
        limit: 10,
    });

    const { data: processData, isLoading, isError } = useGetProcessTemplatesQuery({});

    console.log("Process data:", processData);

    const [createProcess] = useCreateProcessMutation();

    // Lọc ra các user có role.id = 2 hoặc 3 (Manager)
    // const filterUsers = (users) => users.filter((user) => [2, 3].includes(user.role.id));
    // const filteredUsers = userData?.users ? filterUsers(userData.users) : [];
    // console.log("Filtered users:", filteredUsers);

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
        // Nếu có dữ liệu quy trình từ API, sử dụng dữ liệu đó
        if (processData) {
            const process = processData.data[0];
            const { customStagesCount, stages } = process;
            console.log("Process data:", process);
            // Giả sử trong JSON, stages đã bao gồm tất cả các bước (tùy chỉnh và đợt cuối)
            const steps = stages.map((stage) => {
                console.log("Stage data:", stage, stage.approver);
                // Sử dụng process.customStagesCount hoặc state customStagesCount nếu giống nhau
                const isFinal = stage.stageOrder === customStagesCount;
                const foundUser = userData?.users.find((user) => user.id === stage.approver);
                console.log("Found user:", foundUser);
                return {
                    key: isFinal ? "stageFinal" : `stage${stage.stageOrder}`,
                    title: isFinal ? "Đợt cuối" : `Ký duyệt đợt ${stage.stageOrder}`,
                    description: `Người duyệt: ${foundUser?.full_name || ""}`,
                    content: processData
                        ? null
                        : (
                            <Form.Item
                                name={isFinal ? "stageFinal" : `stage${stage.stageOrder}`}
                                label={`Chọn người duyệt ${isFinal ? "đợt cuối" : `đợt ${stage.stageOrder}`}`}
                                rules={[{ required: true, message: "Vui lòng chọn người duyệt!" }]}
                            >
                                <Select placeholder="Chọn người duyệt">
                                    {userData?.users.map((user) => (
                                        <Option key={user.id} value={user.id}>
                                            {user.full_name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        ),
                };
            });
            return steps;
        }

        // Nếu không có processData, sử dụng state tạo quy trình mới (chế độ tạo)
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
                            {userData?.map((manager) => (
                                <Option key={manager.id} value={manager.id}>
                                    {manager.full_name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                ),
            });
        }
        // Thêm bước cuối
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
                        {userData?.map((manager) => (
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
    console.log("Steps data:", stepsData);
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
    const next = async () => {
        try {
            const values = await form.validateFields();
            if (current < customStagesCount) {
                // Chưa đến bước cuối: lưu giá trị của bước hiện tại và chuyển sang bước kế tiếp
                const stageKey = `stage${current + 1}`;
                setApprovals((prev) => ({ ...prev, [stageKey]: values[stageKey] }));
                setCurrent(current + 1);
                form.resetFields();
            } else {
                // Ở bước cuối: lưu giá trị của bước cuối và tạo JSON quy trình
                const finalStageKey = "stageFinal";
                setApprovals((prev) => ({ ...prev, [finalStageKey]: values[finalStageKey] }));

                // Xây dựng mảng stages: các bước tùy chỉnh và bước cuối
                const stagesArray = [];
                for (let i = 1; i <= customStagesCount; i++) {
                    // Ưu tiên lấy giá trị đã lưu trong approvals, nếu chưa có thì lấy từ values
                    const approverId = approvals[`stage${i}`] || values[`stage${i}`];
                    stagesArray.push({
                        stageOrder: i,
                        approverId,
                    });
                }
                // Thêm bước cuối với stageOrder = customStagesCount + 1
                stagesArray.push({
                    stageOrder: customStagesCount + 1,
                    approverId: values[finalStageKey],
                });

                // Tạo đối tượng quy trình theo mẫu BE yêu cầu
                const newProcess = {
                    name: `Quy trình 1`, // Hoặc lấy từ form nếu cần
                    stages: stagesArray,
                };

                // Gọi API tạo quy trình (giả sử bạn có hook createProcess)
                const result = await createProcess(newProcess).unwrap();
                console.log("Final process data:", newProcess);
                message.success("Quy trình đã được tạo thành công!");

                // Reset lại form và các state liên quan sau khi tạo
                setApprovals({ stage1: null, stageFinal: null });
                setCustomStagesCount(1);
                setCurrent(0);
                form.resetFields();
            }
        } catch (error) {
            console.log("Validation Failed:", error);
        }
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

    if (isLoading || isLoadingUSer) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div
                className="font-bold mb-4 text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent"
                style={{ textShadow: "8px 8px 8px rgba(0, 0, 0, 0.2)" }}
            >
                <div className="flex items-center gap-4">Quản Lý Quy Trình Ký Duyệt</div>
            </div>
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
                            return (
                                <Step
                                    key={item.key || index}
                                    title={item.title}
                                    description={
                                        item.description || ""
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
                        {!processData && (
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
                        )}

                    </Form>
                </div>
            </div>
        </div>
    );
};

export default ApprovalProcess;
