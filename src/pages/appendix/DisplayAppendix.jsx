import { Card, Image, List, Modal, Spin, Tag } from 'antd';
import dayjs from 'dayjs';
import React, { useState } from 'react';
import { useGetAppendixDetailQuery } from '../../services/AppendixAPI';
import appendixIcon from "../../assets/Image/appendix.svg"

const DisplayAppendix = ({ appendices }) => {
    const [selectedId, setSelectedId] = useState(null);
    const [visible, setVisible] = useState(false);

    // Gọi API khi có selectedId
    const { data: appendixDetail } = useGetAppendixDetailQuery({ id: selectedId }, {
        skip: !selectedId,
    });

    const handleCardClick = (id) => {
        setSelectedId(id);
        setVisible(true);
    };

    const handleModalClose = () => {
        setVisible(false);
        setSelectedId(null);
    };

    function convertDate(dateArray) {
        if (!dateArray || !Array.isArray(dateArray)) {
            return "Không có dữ liệu";
        }

        // Ensure the array has at least 6 elements, filling with 0 if necessary
        const filledDateArray = [...dateArray, 0, 0, 0, 0, 0].slice(0, 6);
        const [year, month, day, hour, minute, second] = filledDateArray;

        return dayjs(new Date(year, month - 1, day, hour, minute, second)).format("DD-MM-YYYY vào lúc HH:mm:ss");
    }

    return (
        <div className="p-6">
            <List
                grid={{ gutter: 16, column: 1 }}
                dataSource={appendices}
                renderItem={(item) => (
                    <List.Item>
                        <Card
                            onClick={() => handleCardClick(item.addendumId)}
                            hoverable
                            className="shadow-md rounded-md cursor-pointer"
                        >
                            <div clas>
                                <div className='flex items-center gap-3 mb-4'>
                                    <Image src={appendixIcon} width={40} height={40} />
                                    <Tag className='w-fit h-fit'>Phụ lục hợp đồng</Tag>
                                </div>
                                <p className="text-lg ml-3 font-semibold break-words">{item.title}</p>
                            </div>
                        </Card>
                    </List.Item>
                )}
            />

            <Modal
                // title={appendixDetail?.data.title || 'Chi tiết phụ lục'}
                open={visible}
                onCancel={handleModalClose}
                footer={null}
            >
                <div className="p-2">
                    {/* Tiêu đề của card */}
                    <div className="mb-4 border-b border-gray-200 pb-3">
                        <h2 className="text-2xl font-bold ">{appendixDetail?.data.title || 'Chi tiết phụ lục'}</h2>
                    </div>
                    <div className="space-y-6">
                        {/* Hiển thị ngày hiệu lực */}
                        <div className="flex items-center">
                            <span className="text-sm font-medium ">Ngày Hiệu Lực:</span>
                            <span className="ml-3  font-semibold ">
                                {convertDate(appendixDetail?.data.effectiveDate)}
                            </span>
                        </div>
                        {/* Hiển thị nội dung phụ lục */}
                        <div>
                            <h3 className="text-lg font-semibold ">Nội Dung phụ lục:</h3>
                            <div className="mt-2 prose prose-sm " dangerouslySetInnerHTML={{ __html: appendixDetail?.data.content }} />
                        </div>
                    </div>
                </div>

            </Modal>
        </div>
    );
};

export default DisplayAppendix;
