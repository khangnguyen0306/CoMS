import React, { useState, useEffect } from 'react';
import { Radio, Steps, Form, Button, Select, message, Timeline, Card } from 'antd';
import { MinusCircleOutlined } from '@ant-design/icons';
import { useGetUserStaffManagerQuery } from "../../services/UserAPI";
import { useCreateProcessMutation, useGetProcessTemplatesQuery, useAssignProcessMutation, useGetProcessByContractTypeIdQuery } from "../../services/ProcessAPI";
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../slices/authSlice';
const { Step } = Steps;
const { Option } = Select;

const Process = ({ contractId, onProcessApplied, contractTypeId }) => {
    console.log("Contract ID:", contractTypeId);
    const user = useSelector(selectCurrentUser);

    const [selection, setSelection] = useState("auto");
    const [hideAddStage, setHideAddStage] = useState(false)
    const [isCreate, setIsCreate] = useState(false)
    const [selectedProcessId, setSelectedProcessId] = useState(null);

    // Lấy danh sách user từ API (dùng cho phần chọn manager)
    const { data: userData } = useGetUserStaffManagerQuery({
        keyword: "",
        page: 0,
        limit: 10,
    });
    const { data: approvalData } = useGetProcessByContractTypeIdQuery({ contractTypeId: contractTypeId });
    const { data: processTemplates, refetch } = useGetProcessTemplatesQuery();
    const [create] = useCreateProcessMutation();
    const [assign, { isLoading }] = useAssignProcessMutation();

    console.log(user)

    // Các state cho giao diện Steps (cho việc tạo/chỉnh sửa quy trình)
    const [current, setCurrent] = useState(0);
    const [form] = Form.useForm();
    const [approvals, setApprovals] = useState({

    });
    // Số bước ký duyệt tự tạo (không bao gồm bước cuối) - mặc định chỉ có 1 bước (stage1)
    const [customStagesCount, setCustomStagesCount] = useState(1);



    const getAvailableUsers = (currentStepKey) => {
        // Lấy danh sách các id đã được chọn ở các bước khác (ngoại trừ bước hiện tại)
        const selectedIds = Object.entries(approvals)
            .filter(([key, value]) => key !== currentStepKey && value != null)
            .map(([key, value]) =>
                typeof value === 'object' ? value.value : value
            );
        // Nếu ở bước hiện tại đã có giá trị, giữ lại giá trị đó trong danh sách để hiển thị trong select
        const currentValue = approvals[currentStepKey];
        return (userData?.data?.content || []).filter((manager) => {
            if (manager.id === user.id) {
                return false;
            }
            if (
                currentValue &&
                manager.id === (typeof currentValue === 'object' ? currentValue.value : currentValue)
            ) {
                return true;
            }
            return !selectedIds.includes(manager.id);
        });
    };


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
                            {getAvailableUsers(`stage${i}`).map((manager) => (
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
                <>
                    {!hideAddStage && (
                        <Form.Item
                            name="stageFinal"
                            label="Chọn manager duyệt đợt cuối"
                            rules={[{ required: true, message: "Vui lòng chọn manager!" }]}
                        >
                            <Select placeholder="Chọn manager">
                                {getAvailableUsers("stageFinal").map((manager) => (
                                    <Option key={manager.id} value={manager.id}>
                                        {manager.full_name}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}
                </>
            ),
        });
        return steps;
    };

    const stepsData = generateSteps();

    // Hàm xử lý xóa 1 bước ký duyệt (áp dụng cho các bước thuộc customStagesCount)
    const handleRemoveStage = (stageNumber) => {
        if (customStagesCount <= 1) {
            message.error("Phải có ít nhất 1 đợt ký duyệt!");
            return;
        }
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
        form.validateFields()
            .then(async (values) => {
                if (current < customStagesCount) {
                    const stageKey = `stage${current + 1}`;
                    setApprovals((prev) => ({ ...prev, [stageKey]: values[stageKey] }));
                    setCurrent(current + 1);
                    form.resetFields();
                } else {
                    // Ở bước "Đợt cuối": hoàn thành quy trình
                    const stageKey = "stageFinal";
                    setApprovals((prev) => ({ ...prev, [stageKey]: values[stageKey] }));
                    // Tổng số bước thực tế = customStagesCount (số bước tùy chỉnh) + 1 (bước cuối)
                    const totalStages = customStagesCount + 1;
                    const stagesArray = [];
                    for (let i = 1; i <= totalStages; i++) {
                        const key = i === totalStages ? "stageFinal" : `stage${i}`;
                        const fieldValue = approvals[key] || values[key];
                        const approverId =
                            fieldValue && typeof fieldValue === 'object'
                                ? fieldValue.value
                                : fieldValue || 0;
                        stagesArray.push({
                            stageOrder: i,
                            approverId,
                        });
                    }

                    const newProcess = {
                        name: "Quy trình mới",
                        stages: stagesArray,
                        contractTypeId: contractTypeId,
                    };
                    const result = await create(newProcess).unwrap();
                    console.log("New process:", result);

                    // Nếu ở chế độ custom thì lưu id quy trình mới vào state
                    setSelectedProcessId(result?.data?.id);
                    setIsCreate(true)
                    // setApprovals({});
                    // setCustomStagesCount(1);
                    // setCurrent(0);
                    form.resetFields();
                    setHideAddStage(true);
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
            form.validateFields()
                .then((values) => {
                    const stageKey = current < customStagesCount ? `stage${current + 1}` : "stageFinal";
                    setApprovals((prev) => ({ ...prev, [stageKey]: values[stageKey] }));
                    const newStageKey = newStep < customStagesCount ? `stage${newStep + 1}` : "stageFinal";
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

    // Hàm xử lý "Áp dụng quy trình" để console.log id của quy trình
    const handleApplyProcess = async () => {
        const workflowId = selection === "auto" ? 1 : selectedProcessId;
        console.log("Selected workflow ID:", workflowId);
        try {
            const result = await assign({ contractId, workflowId }).unwrap();
            message.success("Quy trình đã được áp dụng thành công!");
            if (onProcessApplied) {
                onProcessApplied();
            }
            setApprovals({});
            setCustomStagesCount(1);
            setCurrent(0);
            setSelectedProcessId(null);
            setHideAddStage(false);
        } catch (error) {
            console.error("Assign process failed:", error);
        }
    };

    // Lấy dữ liệu processTemplates (giả sử dữ liệu được trả về là mảng với một phần tử)
    const process = processTemplates?.data;
    const item =
        process?.stages?.map((stage) => {
            const isFinal = stage.stageOrder === process.customStagesCount;
            const foundUser = stage.approver
                ? userData?.data?.content?.find((user) => user.id === stage.approver)?.full_name
                : "";
            return {
                title: isFinal ? "Phê duyệt đợt cuối" : `Phê duyệt đợt ${stage.stageOrder}`,
                description: `Người duyệt: ${foundUser || ""}`,
            };
        }) || [];

    const formattedData = approvalData?.data?.map((process) => {
        return {
            id: process.id,
            name: process.name,
            customStagesCount: process.customStagesCount,
            createdAt: process.createdAt,
            stages: process.stages.map((stage) => {
                const foundUser = userData?.data?.content.find((user) => user.id === stage.approver)?.full_name;
                return {
                    stageId: stage.stageId,
                    stageOrder: stage.stageOrder,
                    approver: stage.approver,
                    approverName: foundUser || "Chưa xác định",
                    status: stage.status,
                    approvedAt: stage.approvedAt,
                    comment: stage.comment,
                };
            }),
        };
    }) || [];

    console.log("Formatted Data:", formattedData);

    const handleRadioChange = (e) => {
        setSelectedProcessId(e.target.value);
        console.log("Selected Process ID:", e.target.value);
    };
    const handleCardSelect = (id) => {
        if (selection === "recomment") {
            setSelectedProcessId(id);
            console.log("Selected Process ID:", id);
        }
    };

    return (
        <div >
            <div className="flex flex-col gap-2                  p-4 rounded-xl shadow-lg">
                <div className="flex items-center cursor-pointer">
                    <Radio checked={selection === "auto"} onChange={handleChange} value="auto">
                        Mặc định (Hệ thống tự tạo)
                    </Radio>
                </div>


                <div className='ml-8 my-4'>
                    <Steps current={item.length - 1} items={item} />
                </div>

                {/* <div className="flex items-center cursor-pointer">
                    <Radio checked={selection === "recomment"} onChange={handleChange} value="recomment">
                        Chọn quy trình đã có trước đó
                    </Radio>
                </div> */}
                <div>
                    {/* Radio "Đề xuất" */}
                    {formattedData.length > 0 && (
                        <div className="flex items-center cursor-pointer mb-4">
                            <Radio
                                value="recomment"
                                checked={selection === "recomment"}
                                onChange={(e) => setSelection(e.target.value)}
                            >
                                Đề xuất
                            </Radio>
                        </div>
                    )}

                    <div className="flex gap-4">
                        {formattedData.map((process) => (
                            <Card
                                key={process.id}
                                className={`mt-4 w-80 min-w-[355px] shadow-md cursor-pointer ${selection !== "recomment" ? "opacity-50 cursor-not-allowed" : ""
                                    } ${selectedProcessId === process.id ? "bg-green-100" : ""}`}
                                onClick={() => handleCardSelect(process.id)}
                            >
                                <Timeline
                                    items={process.stages.map((stage) => ({
                                        color: "blue",
                                        children: (
                                            <div>
                                                <strong>{`Phê duyệt đợt ${stage.stageOrder}`}</strong>
                                                <p>{`Người duyệt: ${stage.approverName}`}</p>
                                            </div>
                                        ),
                                    }))}
                                />
                            </Card>
                        ))}
                    </div>
                </div>
                <div className="flex items-center cursor-pointer mt-8">
                    <Radio checked={selection === "custom"} onChange={handleChange} value="custom">
                        Tùy chỉnh (Nhân viên tự tạo 1 quy trình riêng)
                    </Radio>
                </div>
                {selection === "custom" && (
                    <div>
                        <div className="flex-col pb-12">
                            <div className="mx-8 mr-4 h-auto ">
                                <Steps
                                    current={current}
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
                                                        ? `Người duyệt: ${userData?.data?.content?.find(
                                                            (m) => m.id === approvals[stageKey]
                                                        )?.full_name || ""}`
                                                        : ""
                                                }
                                            />
                                        );
                                    })}
                                </Steps>

                            </div>
                            <div className="flex-1">
                                <Form form={form} layout="vertical" style={{ marginTop: 24 }}>
                                    {stepsData[current]?.content}
                                    {!hideAddStage && (
                                        <div className='flex flex-row gap-4 mt-8'>
                                            <div className="flex gap-4 ">
                                                <Button type="primary" onClick={handleAddStage}>
                                                    Thêm đợt ký duyệt
                                                </Button>
                                            </div>
                                            <div>
                                                {current > 0 && (
                                                    <Button style={{ marginRight: 8 }} onClick={prev}>
                                                        Quay lại
                                                    </Button>
                                                )}
                                                <Button type="primary" onClick={next}>
                                                    {current === stepsData.length - 1 ? "Hoàn thành" : "Tiếp tục"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-center mt-12">
                <Button
                    className="bg-gradient-to-r from-blue-400 to-blue-700 text-white border-0 hover:from-blue-500 hover:to-blue-800"
                    onClick={handleApplyProcess}
                    loading={isLoading}
                    disabled={selectedProcessId === null && selection === "recomment"}
                >
                    Áp dụng quy trình
                </Button>
            </div>
        </div>
    );
};

export default Process;
