import React, { useState } from 'react';
import { Modal, Upload, Input, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useCancelContractMutation, useLiquidatedContractMutation } from '../../../services/uploadAPI';

const ModalCancelContract = ({ visible, onCancel, contractId, refetch, type, setType }) => {
    const [fileList, setFileList] = useState([]);
    const [reason, setReason] = useState('');
    const [cancelContract, { isLoading: LoadingCancel }] = useCancelContractMutation();
    const [liquidatedContract, { isLoading: Loadingliquidated }] = useLiquidatedContractMutation();
    const handleUploadChange = ({ fileList }) => {
        setFileList(fileList);
    };


    const displayText = {
        'liquidated': 'Thanh lý'
    }


    // console.log(type)

    const handleSubmitCancel = async () => {
        try {

            const formData = new FormData();
            fileList.forEach((file) => {
                formData.append("files", file.originFileObj);
            });

            if (type == "liquidated") {

                formData.append(
                    "contractLiquidateDTO ",
                    new Blob([JSON.stringify({ liquidateReason: reason })], { type: "application/json" })
                );

                const res = await liquidatedContract({
                    contractIdLiquidated: contractId,
                    formData,
                }).unwrap();
                if (res.status == "OK") {
                    message.success(`Hợp đồng đã cập nhật sang ${displayText[type] || "Hủy"}!`);
                    onCancel()
                    refetch();
                    setType('')
                }


            } else {
                formData.append(
                    "contractCancelDTO",
                    new Blob([JSON.stringify({ cancelReason: reason })], { type: "application/json" })
                );

                const res = await cancelContract({
                    contractIdCancel: contractId,
                    formData,
                }).unwrap();
                if (res.status == "OK") {
                    message.success(`Hợp đồng đã cập nhật sang ${displayText[type] || "Hủy"}!`);
                    onCancel()
                    refetch();
                }

            }

            // console.log(res);

            // setIsUpdateStatusModalVisible(false);
        } catch (error) {
            message.error(error.data.message)
            console.error("Lỗi khi tải lên file:", error);
            // message.error("Có lỗi xảy ra khi tải lên file!");
        }
    };



    return (
        <Modal
            title={`Cập nhật trạng thái ${displayText[type] || "hủy"} hợp đồng`}
            open={visible}
            onOk={handleSubmitCancel}
            onCancel={onCancel}
            okText="Xác nhận"
            cancelText="Hủy"
            className='min-w-[60vw]'
            loading={LoadingCancel || Loadingliquidated}
        >
            <div className='flex flex-col gap-4 mt-7'>
                <p>Tải lên tài liệu hỗ trợ {displayText[type] || "hủy"} hợp đồng:</p>
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
                <p style={{ marginTop: 16 }}>Lý do {displayText[type] || "hủy"} hợp đồng:</p>
                <Input.TextArea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={`Nhập lý do ${displayText[type] || "hủy"} hợp đồng`}
                />
            </div>
        </Modal>
    );
};

export default ModalCancelContract;