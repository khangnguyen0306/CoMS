import { useState } from "react";
import { Collapse, Spin, Tag, Button } from "antd";
import { CaretRightOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Panel } = Collapse;

const AuditrailContract = ({ auditTrails, getDetail, contractId }) => {
    const [details, setDetails] = useState({});
    const [loadingDetails, setLoadingDetails] = useState({});
    const [currentPages, setCurrentPages] = useState({});
    const [hasMore, setHasMore] = useState({});

    const handleClick = async (date, page = 0) => {
        const formattedDate = dayjs(date).format("YYYY-MM-DD");
        if (details[formattedDate] && page === 0) return;

        setLoadingDetails((prev) => ({ ...prev, [formattedDate]: true }));
        try {
            const response = await getDetail({
                id: contractId,
                params: { date: [formattedDate], page, size: 20 }, // Đảm bảo date là mảng
            });
            const newData = response.data.data.content; // Truy cập response.data.data.content
            const totalPages = response.data.data.totalPages; // Truy cập response.data.data.totalPages

            setDetails((prev) => ({
                ...prev,
                [formattedDate]: {
                    data: {
                        ...prev[formattedDate]?.data,
                        content: page === 0 ? newData : [...(prev[formattedDate]?.data?.content || []), ...newData],
                    },
                },
            }));

            setHasMore((prev) => ({
                ...prev,
                [formattedDate]: page + 1 < totalPages,
            }));

            setCurrentPages((prev) => ({
                ...prev,
                [formattedDate]: page,
            }));
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu:", error);
        }
        setLoadingDetails((prev) => ({ ...prev, [formattedDate]: false }));
    };

    const handleLoadMore = (date) => {
        const formattedDate = dayjs(date).format("YYYY-MM-DD");
        const nextPage = (currentPages[formattedDate] || 0) + 1;
        handleClick(date, nextPage);
    };

    const formatChangedAt = (changedAt) => {
        if (!Array.isArray(changedAt) || changedAt.length < 6) return "Invalid date";

        const [year, month, day, hour, minute, second] = changedAt;
        const date = new Date(year, month - 1, day, hour, minute, second);

        return dayjs(date).format("YYYY/MM/DD HH:mm:ss");
    };

    return (
        <Collapse
            accordion
            expandIcon={({ isActive }) => (
                <CaretRightOutlined rotate={isActive ? 90 : 0} />
            )}
            onChange={(key) => {
                if (key) handleClick(key);
            }}
        >
            {auditTrails?.map((item) => {
                const formattedDate = dayjs(item.date).format("YYYY-MM-DD");
                const detailsData = details[formattedDate]?.data?.content || [];

                const groupedChanges = detailsData.reduce((acc, change) => {
                    const formattedTime = formatChangedAt(change.changedAt);
                    if (!acc[formattedTime]) acc[formattedTime] = [];
                    acc[formattedTime].push(change);
                    return acc;
                }, {});

                return (
                    <Panel header={dayjs(item.date).format("DD/MM/YYYY")} key={item.date}>
                        {loadingDetails[formattedDate] ? (
                            <Spin />
                        ) : detailsData.length > 0 ? (
                            <>
                                {Object.entries(groupedChanges).map(([time, changes]) => (
                                    <div key={time} className="mb-4">
                                        <Tag className="mb-3" color="blue">{time}</Tag>
                                        <ul className="list-disc pl-5">
                                            {changes.map((change) => (
                                                <li key={change.id} className="break-words">
                                                    <p>
                                                        <strong>{change.changedBy}</strong> {change.changeSummary}
                                                        {/* <b>{change.fieldName}</b> */}
                                                    </p>
                                                    <div className="py-2">
                                                        <span className="text-red-500">{change.oldValue}</span> ➝{" "}
                                                        <span className="text-green-500">
                                                            {change?.newValue?.replace(/<[^>]+>/g, "")}
                                                        </span>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                                {hasMore[formattedDate] && (
                                    <div className="flex justify-center items-center">
                                        <Button onClick={() => handleLoadMore(item.date)}>Xem thêm</Button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <p>Không có dữ liệu</p>
                        )}
                    </Panel>
                );
            })}
        </Collapse>
    );
};

export default AuditrailContract;