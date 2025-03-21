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

    const generateColor = (id) => {
        const hue = (id * 137.508) % 360;
        return `hsl(${hue}, 65%, 75%)`;
    };

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
                            <div >
                                <div className='flex items-center gap-3 mb-4'>
                                    <Image preview={false} src={appendixIcon} width={40} height={40} />
                                    <Tag color={generateColor(item.addendumType.addendumTypeId)} className='w-fit h-fit'>{item.addendumType.name}</Tag>
                                </div>
                                <p className="text-lg ml-3 font-semibold break-words">{item.title}</p>
                            </div>
                        </Card>
                    </List.Item>
                )}
            />

            <Modal
                open={visible}
                onCancel={handleModalClose}
                footer={null}
                width={'80vw'}
            >
                <div className="p-2">
                    {/* Tiêu đề của card */}
                    <div className="mb-4 pb-3 flex flex-col gap-2">
                        <Tag color={generateColor(appendixDetail?.data.addendumType.addendumTypeId)} className='w-fit h-fit'>{appendixDetail?.data.addendumType.name}</Tag>
                        <h2 className="text-2xl font-bold ">{appendixDetail?.data.title || 'Chi tiết phụ lục'}</h2>
                        <p className="text-[13px]  ">Ngày Hiệu Lực:   
                            <span className="ml-1  font-semibold ">
                            {convertDate(appendixDetail?.data.effectiveDate)}
                        </span></p>
                    </div>
                    <div className="space-y-6">
                        {/* Hiển thị ngày hiệu lực */}
                        <div className="flex items-center">


                        </div>
                        {/* Hiển thị nội dung phụ lục */}
                        <div>
                            <h3 className="text-lg font-semibold mb-5">Nội Dung phụ lục:</h3>
                            <div className="mt-2 prose prose-sm " dangerouslySetInnerHTML={{ __html: appendixDetail?.data.content }} />
                        </div>
                    </div>
                </div>

            </Modal>
        </div>
    );
};

export default DisplayAppendix;
