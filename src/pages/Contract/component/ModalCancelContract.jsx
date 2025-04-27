import React, { useState } from 'react';
import { Modal, Upload, Input, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useCancelContractMutation } from '../../../services/uploadAPI';

const ModalCancelContract = ({ visible, onCancel, contractId, refetch }) => {
    const [fileList, setFileList] = useState([]);
    const [reason, setReason] = useState('');
    const [cancelContract, { isLoading: LoadingCancel }] = useCancelContractMutation();
    const handleUploadChange = ({ fileList }) => {
        setFileList(fileList);
    };

    const handleSubmitCancel = async () => {
        try {
            const formData = new FormData();

            fileList.forEach((file) => {
                formData.append("files", file.originFileObj);
            });

            formData.append(
                "contractCancelDTO",
                new Blob([JSON.stringify({ cancelReason: reason })], { type: "application/json" })
            );

            const res = await cancelContract({
                contractIdCancel: contractId,
                formData,
            }).unwrap();


            //////////////////////////////////////////////
            console.log(res);
            if (res.status == "OK") {
                message.success("Huỷ hợp đồng thành công!");
                onCancel()
                refetch();
            } else {
                message.error(res.data.message)
            }

            // setIsUpdateStatusModalVisible(false);
        } catch (error) {
            console.error("Lỗi khi tải lên file:", error);
            // message.error("Có lỗi xảy ra khi tải lên file!");
        }
    };



    return (
        <Modal
            title="Cập nhật trạng thái hủy hợp đồng"
            open={visible}
            onOk={handleSubmitCancel}
            onCancel={onCancel}
            okText="Xác nhận"
            cancelText="Hủy"
            className='min-w-[60vw]'
            loading={LoadingCancel}
        >
            <div className='flex flex-col gap-4 mt-7'>
                <p>Tải lên tài liệu hỗ trợ hủy hợp đồng:</p>
                <Upload.Dragger
                    multiple={true}
                    fileList={fileList}
                    onChange={handleUploadChange}
                    accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.gif"
                    beforeUpload={() => false}
                >
                    <p className="ant-upload-drag-icon">
                        <UploadOutlined />
                    </p>
                    <p className="ant-upload-text">Nhấp hoặc kéo file vào khu vực này để tải lên</p>
                    <p className="ant-upload-hint">Hỗ trợ tải lên một hoặc nhiều file cùng lúc.</p>
                </Upload.Dragger>
                <p style={{ marginTop: 16 }}>Lý do hủy hợp đồng:</p>
                <Input.TextArea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Nhập lý do hủy hợp đồng"
                />
            </div>
        </Modal>
    );
};

export default ModalCancelContract;