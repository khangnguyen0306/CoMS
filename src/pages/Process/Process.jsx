import React, { useState, useEffect } from 'react';
import { Radio, Card } from 'antd';

const Process = () => {
    const [selection, setSelection] = useState("auto");
    const [defaultProcess, setDefaultProcess] = useState(null);

    useEffect(() => {
        // Giả sử dữ liệu quy trình mặc định lấy từ API hoặc nguồn khác
        setDefaultProcess({ id: 1, name: "Quy trình mặc định của admin" });
    }, []);

    return (
        <div>
            <Radio.Group
                value={selection}
                onChange={(e) => setSelection(e.target.value)}
                style={{ display: 'flex', flexDirection: 'column' }}
            >
                <Radio value="auto">Mặc định (hệ thống tự tạo)</Radio>
                {/* Nội dung chèm giữa 2 radio */}
                <div>
                    {defaultProcess ? (
                        <Card size="small" title="Quy trình đã chọn" bordered={false}>
                            <p>{defaultProcess.name}</p>
                        </Card>
                    ) : (
                        "Không có quy trình mặc định"
                    )}
                </div>
                <Radio value="custom">Tùy chỉnh</Radio>
            </Radio.Group>
        </div>
    );
};

export default Process;
