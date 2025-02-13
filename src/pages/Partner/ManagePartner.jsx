import React, { useEffect, useState } from "react";
import { Row, Col, Card, Statistic, Table, Button, Input, Space, Tag, Typography, List, Dropdown } from "antd";
import { SearchOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { useGetPartnerListQuery } from '../../services/PartnerAPI';

const { Link } = Typography;
const { Search } = Input;

const ManagePartner = () => {
    const navigate = useNavigate();
    const { data: partnerData, isLoading: isFetching, error: fetchError } = useGetPartnerListQuery();
    const [viewHistory, setViewHistory] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [filteredData, setFilteredData] = useState([]);




    const handleDeleteItem = (key) => {
        const currentHistory = getViewHistory();
        const updatedHistory = currentHistory.filter(item => item.key !== key);
        localStorage.setItem('viewHistory', JSON.stringify(updatedHistory));
        setViewHistory(updatedHistory);
    };

    // Lấy danh sách viewHistory khi component được mount
    useEffect(() => {
        // Hàm đồng bộ viewHistory với partnerData
        const syncViewHistoryWithAPI = () => {
            const initialHistory = getViewHistory();
            if (partnerData) {
                // Lọc ra những item có trong partnerData
                const validHistory = initialHistory.filter((item) =>
                    partnerData.some((partner) => partner.key === item.key)
                );
                // Nếu có sự thay đổi, cập nhật lại localStorage và state
                if (validHistory.length !== initialHistory.length) {
                    localStorage.setItem('viewHistory', JSON.stringify(validHistory));
                }
                setViewHistory(validHistory);
            }
        };

        // Đồng bộ hóa khi partnerData thay đổi
        syncViewHistoryWithAPI();
    }, [partnerData]);

    //lấy viewHistory từ localStorage
    const getViewHistory = () => {
        return JSON.parse(localStorage.getItem('viewHistory')) || [];
    };

    //thêm viewHistory vào localStorage
    const addViewHistory = (record) => {
        const minimalRecord = {
            key: record.key,
            partnerName: record.partnerName,
            email: record.email,
            img: record.img,
        };
        const currentHistory = getViewHistory();

        // Kiểm tra nếu item chưa có trong danh sách viewHistory
        if (!currentHistory.find((item) => item.key === minimalRecord.key)) {
            // Thêm mới vào đầu danh sách
            const updatedHistory = [minimalRecord, ...currentHistory];

            // Giới hạn số lượng lịch sử là 10
            const limitedHistory = updatedHistory.slice(0, 10);

            // Lưu vào localStorage và cập nhật state
            localStorage.setItem('viewHistory', JSON.stringify(limitedHistory));
            setViewHistory(limitedHistory);
        }
    };


    const navigateToDetail = (record) => {
        addViewHistory(record);
        navigate(`/partner/${record.key}`, { state: record });
    };

    const handleSearch = debounce((value) => {
        if (value) {
            const filtered = partnerData.filter(
                (item) =>
                    item.partnerName.toLowerCase().includes(value.toLowerCase()) ||
                    item.spokesmanName.toLowerCase().includes(value.toLowerCase()) ||
                    item.email.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredData(filtered);
        } else {
            setFilteredData([]); // Reset to empty filtered data
        }
    }, 300);

    const columns = [
        {
            title: 'Mã Partner',
            dataIndex: 'partnerCode',
            sorter: (a, b) => a.partnerCode.localeCompare(b.partnerCode),
            width: '120px',
        },
        {
            title: 'Tên Partner',
            dataIndex: 'partnerName',
            sorter: (a, b) => a.partnerName.localeCompare(b.partnerName),
            render: (text, record) => (
                <Link
                    onClick={() => navigateToDetail(record)}
                    className="font-medium hover:text-blue-600"
                >
                    {text}
                </Link>
            ),
            width: '200px',
        },
        {
            title: 'Loại Partner',
            dataIndex: 'partnerType',
            width: '150px',
            filters: [
                { text: 'Nhà cung cấp', value: 'Nhà cung cấp' },
                { text: 'Khách hàng', value: 'Khách hàng' },
            ],
            onFilter: (value, record) => record.partnerType === value,
            render: (type) => (
                <Tag color={type === 'Nhà cung cấp' ? 'blue' : 'green'}>
                    {type}
                </Tag>
            ),
        },
        {
            title: 'Người đại diện',
            dataIndex: 'spokesmanName',
            sorter: (a, b) => a.spokesmanName.localeCompare(b.spokesmanName),
            width: '170px',
        },
        {
            title: 'Điện thoại',
            dataIndex: 'phone',
            width: '150px',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            width: '200px',
        },
        {
            title: 'Địa chỉ',
            dataIndex: 'address',
            sorter: (a, b) => (a.address || '').localeCompare(b.address || ''),
            width: '200px',
        },
        {
            title: 'Ngân hàng',
            dataIndex: 'Banking',
            render: (banking) =>
                banking
                    ? `${banking.bankName || 'Không rõ'} - ${banking.accountNumber || 'Không rõ'}`
                    : 'Không có thông tin',
            width: '250px',
        },

        {
            title: 'Thao tác',
            width: '100px',
            render: (_, record) => (
                <Space className="flex justify-center">
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => {
                            addViewHistory(record);
                            navigateToDetail(record);
                        }}
                    />
                </Space>
            ),
        },
    ];



    return (
        <div>
               <p className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                QUẢN LÝ THÔNG TIN KHÁCH HÀNG
                </p>

            <div className="mb-4 flex items-center gap-2">
                <Dropdown
                    trigger={["click"]}
                    overlay={
                        <List
                            dataSource={viewHistory}
                            renderItem={(item) => (
                                <List.Item
                                    style={{ cursor: 'pointer', border: '1.5px solid #89c4d9', borderRadius: '5px', marginBottom: '8px' }}
                                    onClick={() => {
                                        setSearchText(item.partnerName);
                                        handleSearch(item.partnerName);
                                    }}
                                >
                                    <Space style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                                        <img
                                            src={item.img || 'https://faceinch.vn/upload/elfinder/%E1%BA%A2nh/chup-chan-dung-5.jpg'}
                                            alt={item.partnerName}
                                            style={{ width: 30, height: 30, borderRadius: '50%' }}
                                        />
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 'bold' }}>{item.partnerName}</span>
                                            <span style={{ fontSize: '12px', color: 'gray' }}>{item.email}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <span
                                                style={{
                                                    color: 'red',
                                                    cursor: 'pointer',
                                                    fontSize: '16px',
                                                }}
                                                onClick={(e) => {
                                                    handleDeleteItem(item.key);
                                                    e.stopPropagation();
                                                }}
                                            >
                                                ✕
                                            </span>
                                        </div>
                                    </Space>


                                </List.Item>
                            )}
                            style={{
                                width: 300,
                                maxHeight: 200,
                                overflowY: "auto",
                                padding: "8px",
                                background: "#fff",
                            }}
                        />
                    }
                >
                    <Search
                        value={searchText}
                        placeholder="Tìm kiếm theo tên, công ty, email"
                        allowClear
                        enterButton
                        onChange={(e) => setSearchText(e.target.value)}
                        onSearch={(value) => {
                            handleSearch(value);
                        }}
                        style={{ width: 350 }}
                    />
                </Dropdown>
            </div>

            <Table
                columns={columns}
                dataSource={filteredData.length > 0 ? filteredData : partnerData}
                loading={isFetching}
                bordered
                pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `Tổng ${total} bản ghi`,
                }}
                components={{
                    body: {
                        cell: (props) => (
                            <td
                                {...props}
                                style={{
                                    borderColor: '#89c4d9',
                                    borderStyle: 'solid',
                                    borderWidth: '1px'
                                }}
                            />
                        )
                    },
                    header: {
                        cell: (props) => (
                            <th
                                {...props}
                                style={{
                                    backgroundColor: props.className?.includes('special-header')
                                        ? '#8dd4ff '
                                        : '#cdf2ff',
                                    color: props.className?.includes('special-header')
                                        ? '#004d80'
                                        : '#005580',
                                    backgroundColor: '#2196f3',
                                    color: '#fff',
                                    borderColor: '#89c4d9',
                                    borderStyle: 'solid',
                                    borderWidth: '1px'
                                }}
                            />
                        )
                    }
                }}
            />

        </div>
    );
};

export default ManagePartner;
