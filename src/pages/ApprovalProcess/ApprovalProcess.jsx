import React, { useState, useEffect } from "react";
import { Button, Form, Select, Steps, message, Empty, Skeleton } from "antd";
import { EditFilled, MinusCircleFilled, MinusCircleOutlined } from "@ant-design/icons";
import { useGetUserStaffManagerQuery, useGetUserManagerQuery } from "../../services/UserAPI";
import { useGetProcessTemplatesQuery, useUpdateProcessMutation } from "../../services/ProcessAPI";

const { Step } = Steps;
const { Option } = Select;

const ApprovalProcess = () => {
    // Lấy danh sách user và dữ liệu quy trình từ API
    const { data: userData, isLoading: isLoadingUser } = useGetUserManagerQuery({
        keyword: "",
        page: 0,
        limit: 10,
    },
        {
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true,
        }
    );
    useEffect(() => {
        userData
    }, []);
    const { data: processData, isLoading, refetch } = useGetProcessTemplatesQuery({});
    const [updateProcess] = useUpdateProcessMutation();
    const [form] = Form.useForm();
    const [current, setCurrent] = useState(0);
    const [approvalStages, setApprovalStages] = useState([]);
    const [isEditing, setIsEditing] = useState(false);

    
    useEffect(() => {
        if (processData && processData.data) {
            const process = processData.data;
            console.log("Approval stages:", process);
            // Giả sử process.stages có cấu trúc [{ stageOrder, approver }, ...]
            setApprovalStages(process.stages);
            // Khởi tạo giá trị mặc định cho form dựa trên process.stages
            const initialValues = {};
            process.stages.forEach((stage) => {
                const key =
                    stage.stageOrder === process.customStagesCount
                        ? "stageFinal"
                        : `stage${stage.stageOrder}`;
                const foundUser = userData?.data?.content?.find((user) => user.id === stage.approver);
                if (foundUser) {
                    initialValues[key] = { value: foundUser.id, label: foundUser.full_name };
                }
            });
            form.setFieldsValue(initialValues);
        }
    }, [processData, userData, form]);

    // Hàm thêm đợt phê duyệt mới
    const handleAddStage = () => {
        if (approvalStages.length >= 5) {
            message.error("Chỉ được thêm tối đa 5 đợt phê duyệt");
            return;
        }
        const newStageOrder =
            approvalStages.length > 0
                ? approvalStages[approvalStages.length - 1].stageOrder + 1
                : 1;
        const newStage = { stageOrder: newStageOrder, approver: null };
        setApprovalStages([...approvalStages, newStage]);
    };


    // Hàm xóa một đợt phê duyệt theo stageOrder và đánh lại thứ tự các bước
    const handleRemoveStage = (stageOrderToRemove) => {
        if (approvalStages.length <= 1) {
            message.error("Phải có ít nhất 1 đợt phê duyệt!");
            return;
        }
        const updatedStages = approvalStages
            .filter((stage) => stage.stageOrder !== stageOrderToRemove)
            .map((stage, index) => ({
                ...stage,
                stageOrder: index + 1,
            }));
        setApprovalStages(updatedStages);
    };


    const getAvailableUsers = (currentStageKey) => {
        // Lấy danh sách các giá trị đã chọn từ form
        const allValues = form.getFieldsValue();
        const selectedIds = Object.entries(allValues)
            .filter(([key, value]) => key !== currentStageKey && value != null)
            .map(([key, value]) =>
                typeof value === "object" ? value.value : value
            );
        const currentValue = form.getFieldValue(currentStageKey);
        return (userData?.data?.content || []).filter((user) => {
            // Nếu ở bước hiện tại đã chọn user, giữ lại để hiển thị
            if (
                currentValue &&
                (typeof currentValue === "object" ? currentValue.value : currentValue) === user.id
            ) {
                return true;
            }
            return !selectedIds.includes(user.id);
        });
    };

    // Hàm render Steps dựa trên danh sách approvalStages
    const generateSteps = () => {
        return approvalStages.map((stage) => {
            // Xem bước cuối là bước có stageOrder lớn nhất
            const isFinal = stage.stageOrder === approvalStages[approvalStages.length - 1].stageOrder;
            const key = isFinal ? "stageFinal" : `stage${stage.stageOrder}`;
            // Lấy thông tin user từ form (nếu đã cập nhật) hoặc từ dữ liệu ban đầu của quy trình
            const formValue = form.getFieldValue(key);
            const foundUser =
                formValue?.label ||
                (stage.approver
                    ? userData?.data?.content?.find((user) => user.id === stage.approver)?.full_name
                    : "");
            return {
                key,
                title: (
                    <div className="flex justify-between items-center">
                        <span>{isFinal ? "Đợt cuối" : `Ký duyệt đợt ${stage.stageOrder}`}</span>
                        {approvalStages.length > 1 && (
                            <MinusCircleFilled
                                className="ml-4 text-red-500 cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveStage(stage.stageOrder);
                                }}
                            />
                        )}
                    </div>
                ),
                description: `Người duyệt: ${foundUser || ""}`,
                content: (
                    <Form.Item
                        name={key}
                        label={`Chọn người duyệt ${isFinal ? "đợt cuối" : `đợt ${stage.stageOrder}`}`}
                        rules={[{ required: true, message: "Vui lòng chọn người duyệt!" }]}
                    >
                        <Select labelInValue placeholder="Chọn người duyệt">
                            {getAvailableUsers(key).map((user) => (
                                <Option key={user.id} value={user.id}>
                                    {user.full_name}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                ),
            };
        });
    };


    const stepsData = generateSteps();

    // Hàm cập nhật quy trình lên BE, kết hợp dữ liệu từ form và approvalStages
    const handleUpdateProcess = async () => {
        try {
            await form.validateFields();
            const updatedStages = approvalStages.map((stage) => {
                const key =
                    stage.stageOrder === approvalStages[approvalStages.length - 1].stageOrder
                        ? "stageFinal"
                        : `stage${stage.stageOrder}`;
                const fieldValue = form.getFieldValue(key);
                return {
                    stageOrder: stage.stageOrder,
                    approverId: fieldValue ? fieldValue.value : stage.approver,
                };
            });
            const process = processData.data;
            const payload = {
                name: process.name,
                stages: updatedStages,
            };
            console.log("Payload:", payload);
            await updateProcess({ payload, id: process.id }).unwrap();
            message.success("Cập nhật quy trình thành công!");
            refetch();
        } catch (error) {
            console.error("Cập nhật quy trình thất bại:", error);
            message.error("Cập nhật quy trình thất bại!");
        }
    };

    // Hàm thay đổi bước hiện tại
    const handleStepChange = (newStep) => {
        setCurrent(newStep);
    };

    if (isLoading || isLoadingUser) {
        return <Skeleton active />;
    }

    return (
        <div className="min-h-[100vh] p-6">
            <div
                className="font-bold mb-4 text-[34px] pb-7 bg-custom-gradient bg-clip-text text-transparent"
                style={{ textShadow: "8px 8px 8px rgba(0, 0, 0, 0.2)" }}
            >
                <div className="flex items-center">
                    <div className="flex-1"></div>
                    <div className="flex-1 text-center font-bold text-[34px] whitespace-nowrap">
                        Quản Lý Quy Trình Ký Duyệt
                    </div>
                    <div className="flex-1 text-right">
                        <Button icon={<EditFilled />} type="primary" onClick={() => setIsEditing(true)}>
                            Chỉnh sửa quy trình
                        </Button>
                    </div>
                </div>


            </div>


            {/* Steps hiển thị theo chiều ngang */}
            <div className="mb-6">
                <Steps current={current} onChange={handleStepChange}>
                    {stepsData.map((item, index) => (
                        <Step key={item.key || index} title={item.title} description={item.description || ""} />
                    ))}
                </Steps>
            </div>
            {/* Nội dung form hiển thị bên dưới Steps */}
            {isEditing && (
                <div>
                    <Form form={form} layout="vertical">
                        {stepsData[current]?.content}
                        <div style={{ marginTop: 24 }}>
                            <Button type="primary" onClick={handleUpdateProcess}>
                                Thay đổi quy trình
                            </Button>
                            <Button style={{ marginLeft: 8 }} onClick={handleAddStage}>
                                Thêm đợt phê duyệt
                            </Button>
                        </div>
                    </Form>
                </div>
            )}
        </div>
    );
};

export default ApprovalProcess;
