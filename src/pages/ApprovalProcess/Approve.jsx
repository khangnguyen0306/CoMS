import React, { useState } from "react";
import { Button, Drawer, Form, Input, message, Space } from "antd";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useRejectProcessMutation, useApproveProcessMutation } from "../../services/ProcessAPI";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../slices/authSlice";

const Approve = () => {
    const { id } = useParams();
    const user = useSelector(selectCurrentUser);
    const location = useLocation();
    const { StageIdMatching } = location.state || {};
    console.log(StageIdMatching, id);
    const [form] = Form.useForm();

    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [scrolledToBottom, setScrolledToBottom] = useState(false);
    const [rejectProcess, { isLoading: rejectLoading }] = useRejectProcessMutation();
    const [approveProcess, { isLoading: approveLoading }] = useApproveProcessMutation();


    const handleReject = async (values) => {
        // Lấy comment từ form
        const { comment } = values;
        try {
            // Gọi mutation reject process với dữ liệu nhận được (ví dụ có thêm id hoặc thông tin cần thiết)
            console.log(comment);
            await rejectProcess({ comment: comment, contractId: id, stageId: StageIdMatching }).unwrap();
            message.success("Đã từ chối phê duyệt và gửi nhận xét thành công!");
            form.resetFields();
            onClose();
            if (user?.roles?.includes("ROLE_STAFF")) {
                navigate(`/approvalContract`);
            } else if (user?.roles?.includes("ROLE_MANAGER")) {
                navigate(`/manager/approvalContract`);
            }
        } catch (error) {
            console.log(error);
            message.error("Có lỗi xảy ra, vui lòng thử lại!");
        }
    };


    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    const handleScrollContainer = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        // Nếu cuộn đến cuối (có thể dùng threshold nhỏ)
        if (scrollTop + clientHeight >= scrollHeight - 10) {
            setScrolledToBottom(true);
        } else {
            setScrolledToBottom(false);
        }
    };

    // Ví dụ chuyển hướng khi ấn nút Đồng Ý Phê Duyệt
    const handleApprove = () => {
        try {
            approveProcess({ contractId: id, stageId: StageIdMatching }).unwrap();
            message.success("Đã đồng ý phê duyệt thành công!");
            onClose();
            if (user?.roles?.includes("ROLE_STAFF")) {
                navigate(`/approvalContract`);
            } else if (user?.roles?.includes("ROLE_MANAGER")) {
                navigate(`/manager/approvalContract`);
            }
        } catch (error) {
            console.log(error);
            message.error("Có lỗi xảy ra, vui lòng thử lại!");
        }
    };

    return (
        <div className="flex flex-col mb-1">
            <div className="relative flex justify-center items-center mb-4">
                <p className="font-bold text-[34px] text-center text-transparent bg-custom-gradient bg-clip-text">
                    PHÊ DUYỆT HỢP ĐỒNG
                </p>
                <Button
                    type="primary"
                    className="absolute right-0"
                    onClick={showDrawer}
                >
                    Mở ô nhận xét
                </Button>
                {/* kéo xuống hết thì mới able còn K disable hover vô thì hiện ra là kéo xuống cuối để thực hiện chức năng này */}
                {scrolledToBottom && (
                    <Button className="absolute right-40" loading={approveLoading} type="primary" onClick={handleApprove}>
                        Đồng Ý Phê Duyệt
                    </Button>
                )}
                <Drawer
                    size="large"
                    title="Lý do từ chối:"
                    onClose={onClose}
                    open={open}
                >
                    <Form form={form} layout="vertical" onFinish={handleReject}>
                        <Form.Item
                            name="comment"
                            label="Đề xuất cải tiến :"
                            rules={[{ required: true, message: "Vui lòng nhập nhận xét" }]}
                        >
                            <Input.TextArea rows={8} placeholder="Vui lòng để lại ghi chú" style={{ resize: "none" }} />
                        </Form.Item>

                        <Form.Item>
                            <Space style={{ display: "flex", justifyContent: "space-around" }}>
                                <Button danger type="primary" loading={rejectLoading} htmlType="submit" >
                                    Từ Chối Phê Duyệt
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Drawer>
            </div>

            {/* Container hình ảnh có sự kiện onScroll */}
            <div
                className="custom-scrollbar w-full h-[550px] overflow-y-auto bg-gray-200 rounded-[10px]"
                onScroll={handleScrollContainer}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                <div className="w-[70%] mx-auto grid grid-cols-1 justify-items-center py-8 gap-16">
                    <img
                        src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad"
                        alt="Hình 1"
                        className="w-full h-auto object-cover"
                    />
                    <img
                        src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad"
                        alt="Hình 2"
                        className="w-full h-auto object-cover"
                    />
                    <img
                        src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad"
                        alt="Hình 3"
                        className="w-full h-auto object-cover"
                    />
                    <img
                        src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad"
                        alt="Hình 4"
                        className="w-full h-auto object-cover"
                    />
                    <img
                        src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad"
                        alt="Hình 5"
                        className="w-full h-auto object-cover"
                    />
                    <img
                        src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad"
                        alt="Hình 6"
                        className="w-full h-auto object-cover"
                    />
                </div>
            </div>
            <style>{`
  .custom-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .custom-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`}</style>

        </div>
    );
};

export default Approve;
