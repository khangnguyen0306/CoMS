import React, { useState, useEffect, useMemo } from "react";
import { Button, Form, Select, Steps, message, Skeleton } from "antd";
import { EditFilled, MinusCircleFilled, PlusOutlined, SaveFilled } from "@ant-design/icons";
import { useGetUserManagerQuery, useLazyGetDetailUserByIdQuery } from "../../services/UserAPI";
import { useGetProcessTemplatesQuery, useUpdateProcessMutation } from "../../services/ProcessAPI";

const { Step } = Steps;
const { Option } = Select;

const ApprovalProcess = () => {
    // Lấy danh sách user và dữ liệu quy trình từ API
    const { data: userData, isLoading: isLoadingUser, refetch: refetchUser } = useGetUserManagerQuery({
        keyword: "",
        page: 0,
        size: 1000
    },
        {
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true,
        }
    );
    const [getUserDetail, { isLoading: isLoadingUserDetail }] = useLazyGetDetailUserByIdQuery();

    useEffect(() => {
        refetchUser()
    }, []);

    const { data: processData, isLoading, refetch } = useGetProcessTemplatesQuery({});
    const [updateProcess] = useUpdateProcessMutation();
    const [form] = Form.useForm();
    const [current, setCurrent] = useState(0);
    const [approvalStages, setApprovalStages] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [numberStage, setNumberStage] = useState(0)
    const [userDetails, setUserDetails] = useState({});
    const director = processData?.data?.stages[processData?.data.stages.length - 1]
    console.log(director)

    useEffect(() => {
        if (processData && processData.data) {
            const process = processData.data;
            setNumberStage(process.stages.length);
            setApprovalStages(process.stages);
            if (process.stages.length > 0) {
                const updatedStages = process.stages
                setApprovalStages(updatedStages);
                setNumberStage(updatedStages.length);
            }
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
            form.setFieldsValue(initialValues); // mảng chứa dữ liệu người duyệt so sánh từ user Id APi call đang call 
        }
    }, [processData, userData, form]);


    useEffect(() => {
        approvalStages.forEach((stage) => {
            if (stage.approver && !userDetails[stage.approver]) {
                getUserDetail({ id: stage.approver }).then((result) => {
                    if (result?.data?.full_name) {
                        setUserDetails((prev) => ({
                            ...prev,
                            [stage.approver]: result.data.full_name,
                        }));
                    }
                });
            }
        });
    }, [approvalStages, getUserDetail, userDetails]);
    
    // Hàm thêm đợt phê duyệt mới

    const handleAddStage = () => {
        if (approvalStages.length === 0) {
            // Nếu không có stage nào, thêm stage đầu tiên
            const newStage = { stageOrder: 1, approver: null };
            setApprovalStages([newStage]);
            setNumberStage(1);
        } else if (approvalStages.length === 1) {
            const newStage = { stageOrder: 1, approver: null };
            const updatedStages = [
                newStage,
                { ...approvalStages[0], stageOrder: 2 },
            ];
            setApprovalStages(updatedStages);
            setNumberStage(2);
        } else {
            // Nếu có từ 2 stage trở lên, chèn stage mới vào vị trí kế cuối
            const newStageOrder = approvalStages[approvalStages.length - 2].stageOrder + 1;
            const newStage = { stageOrder: newStageOrder, approver: null };
    
            // Chèn stage mới vào vị trí kế cuối
            const updatedStages = [
                ...approvalStages.slice(0, -1), 
                newStage,
                { ...approvalStages[approvalStages.length - 1], stageOrder: newStageOrder + 1 }, 
            ];
    
            // Đánh lại stageOrder cho tất cả stages
            const finalStages = updatedStages.map((stage, index) => ({
                ...stage,
                stageOrder: index + 1,
            }));
    
            setApprovalStages(finalStages);
            setNumberStage(finalStages.length);
        }
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
        setNumberStage(updatedStages.length)
        // console.log(updatedStages)
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
            const isFinal = stage.stageOrder === approvalStages[approvalStages.length - 1].stageOrder;
            const key = isFinal ? 'stageFinal' : `stage${stage.stageOrder}`;
            const formValue = form.getFieldValue(key);

            // Lấy thông tin người duyệt
            const foundUser =
                formValue?.label ||
                (stage.approver
                    ? userDetails[stage.approver] || (isLoadingUserDetail ? 'Đang tải...' : 'Chưa có')
                    : 'Chưa có');

            return {
                key,
                title: (
                    <div className="flex justify-between items-center">
                        <span>{isFinal ? 'Đợt cuối' : `Ký duyệt đợt ${stage.stageOrder}`}</span>
                        {approvalStages.length > 1 && isEditing && !isFinal && (
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
                description: `Người duyệt: ${foundUser}`,
                content: (
                    <Form.Item
                        name={key}
                        label={`Chọn người duyệt ${isFinal ? 'Đợt cuối' : `Đợt ${stage.stageOrder}`}`}
                        rules={[{ required: true, message: 'Vui lòng chọn người duyệt!' }]}
                    >
                        {isFinal ? (
                            <Select disabled defaultValue={{ value: director?.approver, label: 'Giám đốc' }}>
                                <Option value={director?.approver}>Giám đốc</Option>
                            </Select>
                        ) : (
                            <Select labelInValue placeholder="Chọn người duyệt">
                                {getAvailableUsers(key).map((user) => (
                                    <Option key={user.id} value={user.id}>
                                        {user.full_name.charAt(0).toUpperCase() + user.full_name.slice(1)}
                                    </Option>
                                ))}
                            </Select>
                        )}
                    </Form.Item>
                ),
            };
        });
    };
    const stepsData = useMemo(() => generateSteps(), [approvalStages, userDetails, form, isEditing]);

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
            const result = await updateProcess({ payload, id: process.id }).unwrap();
            // console.log(result)
            setIsEditing(false)
            message.success("Cập nhật quy trình thành công!");
            refetch();
        } catch (error) {
            console.log(error)
            message.error(error.data.message.includes("Trùng ID người duyệt") ? "Người duyệt trùng nhau trong 2 đợt" : error.data.message);
        }
    };

    // Hàm thay đổi bước hiện tại
    const handleStepChange = (newStep) => {
        setCurrent(newStep);
    };

    if (isLoading || isLoadingUser) {
        return (
            <div className="flex min-h-[100vh] justify-center items-center">
                <Skeleton active />
            </div>
        )
    }

    return (
        <div className="min-h-[100vh] p-6">
            <div
                className="font-bold mb-4 text-[34px] pb-7 bg-custom-gradient bg-clip-text text-transparent"
                style={{ textShadow: "8px 8px 8px rgba(0, 0, 0, 0.2)" }}
            >
                <div >
                    <div className="flex-1 text-center font-bold text-[34px] whitespace-nowrap">
                        QUẢN LÝ QUY TRÌNH DUYỆT MẶC ĐỊNH
                    </div>
                    {isEditing == false && (
                        <div className="flex-1 text-right mt-5">
                            <Button icon={<EditFilled />} type="primary" onClick={() => setIsEditing(true)}>
                                Chỉnh sửa quy trình
                            </Button>
                        </div>
                    )}
                </div>


            </div>


            {/* Steps hiển thị theo chiều ngang */}
            <div className="mb-6">
                <Steps current={current} onChange={handleStepChange}>
                    {stepsData.map((item, index) => (
                        <Step
                            key={item.key || index}
                            title={item.title}
                            description={item.description || ""}

                        />
                    ))}
                </Steps>
            </div>
            {/* Nội dung form hiển thị bên dưới Steps */}
            {isEditing && (
                <div>
                    <Form form={form} layout="vertical">
                        {stepsData[current]?.content}
                        <div className="mt-5 flex justify-between">
                            {numberStage < 4 && (
                                <Button onClick={handleAddStage} icon={<PlusOutlined />}>
                                    Thêm đợt phê duyệt
                                </Button>
                            )}
                            <Button type="primary" onClick={handleUpdateProcess} icon={<SaveFilled />}>
                                Lưu quy trình
                            </Button>
                        </div>
                    </Form>
                </div>
            )}
        </div>
    );
};

export default ApprovalProcess;
