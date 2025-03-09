import { Button, Drawer, Form, Input, Space } from 'antd'
import React, { useState } from 'react'

const Approve = () => {
    const [open, setOpen] = useState(false);

    const showDrawer = () => {
        setOpen(true);
    };

    const onClose = () => {
        setOpen(false);
    };

    // const handleReject = () => {
    //     setIsTextAreaDisabled(false);
    // };

    // const handleApprove = () => {
    //     setIsTextAreaDisabled(true);
    // };

    return (
        <div className="flex flex-col mb-1">
            <div className="relative flex justify-center items-center mb-8">
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
                <Button className="absolute right-40" type="primary" >
                    Đồng Ý Phê Duyệt
                </Button>
                <Drawer size='large' title="Đưa ra nhận xét:" onClose={onClose} open={open}>
                    <Form layout="vertical">
                        {/* Label + TextArea */}
                        <Form.Item label="Để lại nhận xét cho Staff :">
                            <Input.TextArea
                                rows={8}
                                placeholder="Vui lòng để lại ghi chú"
                                style={{ resize: "none" }}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Space style={{ display: "flex", justifyContent: "space-around" }}>
                                <Button danger type="primary">
                                    Từ Chối Phê Duyệt
                                </Button>

                            </Space>
                        </Form.Item>
                    </Form>
                </Drawer>
            </div>


            <div className="custom-scrollbar w-full h-[430px] overflow-y-auto bg-gray-200 rounded-[10px]">
                <div className="w-[80%] mx-auto grid grid-cols-1 justify-items-center pt-8 gap-16">
                    <img src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad" alt="Hình 1" className="w-full h-auto object-cover" />
                    <img src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad" alt="Hình 2" className="w-full h-auto object-cover" />
                    <img src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad" alt="Hình 3" className="w-full h-auto object-cover" />
                    <img src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad" alt="Hình 4" className="w-full h-auto object-cover" />
                    <img src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad" alt="Hình 5" className="w-full h-auto object-cover" />
                    <img src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad" alt="Hình 6" className="w-full h-auto object-cover" />
                    <img src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad" alt="Hình 7" className="w-full h-auto object-cover" />
                    <img src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad" alt="Hình 8" className="w-full h-auto object-cover" />
                    <img src="https://noithatmanhhe.vn/wp-content/uploads/2024/03/mau-hop-dong-thi-cong-noi-that.jpg?width=494.69964664310953&height=700&rmode=boxpad" alt="Hình 9" className="w-full h-auto object-cover" />
                </div>
            </div>
            <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .custom-scrollbar {
          -ms-overflow-style: none;  /* IE và Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

        </div>
    )
}

export default Approve