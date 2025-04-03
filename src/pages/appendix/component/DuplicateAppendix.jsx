import React, { useState } from 'react';
import { Button, Empty, message, Modal, Radio, Select, Skeleton } from 'antd';
import { IoDuplicate } from 'react-icons/io5';
import { useGetAllContractQuery } from '../../../services/ContractAPI';
import { useDuplicateAppendixMutation } from '../../../services/AppendixAPI';
import { PlusOutlined } from '@ant-design/icons';

const DuplicateModal = ({ visible, handleCancelDuplicate, record, refetch }) => {

    const [duplicateType, setDuplicateType] = useState('current');
    const [selectedContract, setSelectedContract] = useState(null);

    const { data: contracts, isLoading: isLoadingContracts } = useGetAllContractQuery(
        { status: "ACTIVE" },
        { skip: !!record }
    );
    
    const [duplicateAppendix] = useDuplicateAppendixMutation();

    const handleOk = async () => {
        if (duplicateType === 'another' && !selectedContract) {
            message.warning("Vui lòng chọn hợp đồng cần tạo bản sao!");
            return;
        }

        let appendixId = record?.addendumId;
        let currentContractId = record?.contractId;

        try {
            const result = await duplicateAppendix({
                appendixId: appendixId,
                contractId: duplicateType === 'another' ? selectedContract : currentContractId
            }).unwrap();

            message.success(result.message);
            setDuplicateType('current');
            setSelectedContract(null);
            handleCancelDuplicate();
            refetch();
        } catch (error) {
            console.log(error);
            message.error(error.data.message);
        }
    };

    return (
        <>
            <Modal
                title="Tạo bản sao của phụ lục"
                open={visible}
                onCancel={handleCancelDuplicate}
                onOk={handleOk}
                okText={<p><PlusOutlined />  Tạo bản sao </p>}
                cancelText="Hủy"
            >
                {isLoadingContracts ? (
                    <Skeleton />
                ) : (
                    <div className='flex flex-col gap-3'>
                        <Radio.Group
                            className='flex flex-col gap-1 mt-5'
                            onChange={(e) => setDuplicateType(e.target.value)}
                            value={duplicateType}
                        >
                            <Radio value="current">
                                Tạo bản sao phụ lục cho hợp đồng hiện tại
                            </Radio>
                            <Radio value="another">
                                Tạo bản sao phụ lục cho hợp đồng khác
                            </Radio>
                        </Radio.Group>


                        {duplicateType === 'another' && (
                            contracts?.data.content.length > 0 ? (
                                <Select
                                    placeholder="Chọn hợp đồng"
                                    style={{ width: '100%', marginTop: 16 }}
                                    onChange={(value) => setSelectedContract(value)}
                                >
                                    {contracts.data.content.map((contract) => (
                                        <Option key={contract.id} value={contract.id}>
                                            {contract.title}
                                        </Option>
                                    ))}
                                </Select>
                            ) : (
                                <Empty />
                            )
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
};

export default DuplicateModal;
