import React, { useEffect } from 'react';
import { Modal, Button, Card, Row, Col, Skeleton } from 'antd';
import { useGetContractInforCancelQuery, useLazyGetContractInforCancelQuery } from '../../../services/ContractAPI';
import { saveAs } from 'file-saver';
import { FaFileAlt } from "react-icons/fa";
const ModalCancelInformation = ({ contractId, visible, onCancel }) => {

    const [getcontractData, { data: contractData, isLoading: loadingDataContract, isError: contractError }] = useLazyGetContractInforCancelQuery(contractId, {
        skip: !contractId,
    });
   
    useEffect(() => {
        getcontractData(contractId)
    }, [contractId])


    const getFileNameFromUrl = (url) => {
        const parts = url.split('/');
        return parts[parts.length - 1];
    };

    const getFileTypeFromUrl = (url) => {
        const fileName = getFileNameFromUrl(url);
        const extension = fileName.split('.').pop().toLowerCase();
        return extension;
    };

    const groupFilesByType = (urls) => {
        const grouped = {};
        urls?.forEach((url) => {
            const type = getFileTypeFromUrl(url) || 'unknown';
            if (!grouped[type]) {
                grouped[type] = [];
            }
            grouped[type].push(url);
        });
        return grouped;
    };

    const handleDownload = (url) => {
        const fileName = getFileNameFromUrl(url);
        saveAs(url, fileName);
    };

    const handleDownloadAll = () => {
        contractData?.data?.urls.forEach((url) => {
            const fileName = getFileNameFromUrl(url);
            saveAs(url, fileName);
        });
    };
    const groupedFiles = groupFilesByType(contractData?.data?.urls);
    const formatDate = (dateArray) => {
        // Check if the array has at least 6 elements
        if (dateArray?.length < 6) {
            return null; // Return null if data is insufficient to avoid rendering an error
        }

        // Format the date if the array has enough elements
        return (
            <p>
                {dateArray[2] + "/" + dateArray[1] + "/" + dateArray[0] + "   lúc     " + dateArray[3] + ":" + dateArray[4] + ":" + dateArray[5]}
            </p>
        );
    };

    if (loadingDataContract) {
        return (
            <div className='flex justify-center items-center min-h-[100vh]'>
                <Skeleton active />
            </div>
        )
    }

    return (
        <Modal
            title="Thông tin hủy hợp đồng"
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="close" onClick={onCancel}>
                    Đóng
                </Button>,
            ]}
            width={800}
        >
            {loadingDataContract ? (
                <div className='flex justify-center items-center min-h-[100vh]'>
                    <Skeleton active />
                </div>
            ) : (
                contractData && contractData.data ? (
                    <>
                        <div className='flex flex-col gap-3'>
                            <h3>Danh sách file đính kèm</h3>
                            {
                                Object.keys(groupedFiles).map((fileType) => (
                                    <div key={fileType} className='mb-5 gap-3 flex flex-col'>
                                        <h4 >Loại file: <b>{` ${fileType.toUpperCase()}`}</b></h4>
                                        <Row gutter={[16, 16]}>
                                            {groupedFiles[fileType].map((url, index) => (
                                                <Col span={6} key={index}>
                                                    <Card
                                                        hoverable
                                                        className='flex items-center justify-center'
                                                    >
                                                        <div className='flex flex-col items-center gap-2'>
                                                            <p>{getFileNameFromUrl(url)}</p>
                                                            <p><FaFileAlt style={{ fontSize: 40 }} /></p>
                                                            <Button
                                                                type="primary"
                                                                className='mt-3'
                                                                onClick={() => handleDownload(url)}
                                                            >
                                                                Tải xuống
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                </Col>
                                            ))}
                                        </Row>
                                    </div>
                                ))
                            }
                            <Button type="primary" onClick={handleDownloadAll} style={{ marginTop: '10px' }}>
                                Tải xuống tất cả
                            </Button>
                        </div >
                        <div style={{ marginTop: '20px' }}>
                            <Card title="Lý do hủy hợp đồng">
                                <p className='flex gap-2 mb-4'><b>Thời gian hủy:</b> {contractData?.data.cancelAt[2] + "/" + contractData?.data.cancelAt[1] + "/" + contractData?.data.cancelAt[0] + "   lúc     " + contractData?.data.cancelAt[3] + ":" + contractData?.data.cancelAt[4] + ":" + contractData?.data.cancelAt[5]}</p>
                                <p>{contractData?.data?.cancelContent}</p>
                            </Card>
                        </div>
                    </>
                ) : (
                    <div>No contract data available.</div>
                )
            )}
        </Modal >
    );
};

export default ModalCancelInformation;