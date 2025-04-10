import React, { useState } from 'react';
import { Button, Modal, Radio, Select, message } from 'antd';
import { useDuplicateContractMutation, useDuplicateContractWithNewPartnerMutation } from '../../../services/ContractAPI';
import { useGetPartnerListByPartnerTypeQuery } from '../../../services/PartnerAPI';

const { Option } = Select;

const DuplicateContractModal = ({ visible, onCancel, contractId, refetch, refetchNoti }) => {
    const [duplicateType, setDuplicateType] = useState('same');
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [duplicateContract] = useDuplicateContractMutation();
    const [duplicateContractWithNewPartner] = useDuplicateContractWithNewPartnerMutation();
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });

    const { data: partners, isLoading: isLoadingPartners } = useGetPartnerListByPartnerTypeQuery({
        page: pagination.current - 1,
        size: pagination.pageSize,
        partnerType: "PARTNER_B"
    });

    console.log(partners)

    const handleOk = async () => {
        if (duplicateType === 'different' && !selectedPartner) {
            message.warning("Vui lòng chọn đối tác!");
            return;
        }
        if (duplicateType == "same") {
            try {
                const result = await duplicateContract(contractId).unwrap();

                if (result?.status === "OK") {
                    message.success("Nhân bản hợp đồng thành công!");
                    refetch();
                    refetchNoti();
                    onCancel();
                    setSelectedPartner(null)       
                }
            } catch (error) {
                console.error("Error duplicating contract:", error);
                message.error("Lỗi khi nhân bản hợp đồng!");
            }
        } else {
            try {
                const result = await duplicateContractWithNewPartner({ contractId: contractId, partnerId: selectedPartner }).unwrap();
                if (result?.status === "OK") {
                    message.success("Nhân bản hợp đồng thành công!");
                    refetch();
                    refetchNoti();
                    onCancel();
                    setSelectedPartner(null)
                }
            } catch (error) {
                console.error("Error duplicating contract:", error);
                message.error("Lỗi khi nhân bản hợp đồng!");
            }
        }
    };

    const handlePartnerSearch = (value) => {
        // Reset pagination when searching
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handlePartnerChange = (value) => {
        setSelectedPartner(value);
    };

    return (
        <Modal
            title="Nhân bản hợp đồng"
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
            okText="Nhân bản"
            cancelText="Hủy"
        >
            <div className='flex flex-col gap-3'>
                <Radio.Group
                    className='flex flex-col gap-1 mt-5'
                    onChange={(e) => setDuplicateType(e.target.value)}
                    value={duplicateType}
                >
                    <Radio value="same">
                        Nhân bản cho cùng đối tác
                    </Radio>
                    <Radio value="different">
                        Nhân bản cho đối tác khác
                    </Radio>
                </Radio.Group>

                {duplicateType === 'different' && (
                    <Select
                        placeholder="Chọn đối tác"
                        style={{ width: '100%', marginTop: 16 }}
                        onChange={handlePartnerChange}
                        onSearch={handlePartnerSearch}
                        loading={isLoadingPartners}
                        showSearch
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {partners?.data?.content?.map((partner) => (
                            <Option key={partner.partyId} value={partner.partyId}>
                                {partner.partnerName}
                            </Option>
                        ))}
                    </Select>
                )}
            </div>
        </Modal>
    );
};

export default DuplicateContractModal; 