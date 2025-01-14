import React, { useRef, useState } from "react";
import { Row, Col, Card, Statistic, Table, Button, Input, Space, Tag, Typography, Modal, List, Menu, Dropdown } from "antd";
import { SearchOutlined, EyeOutlined, HistoryOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';

const { Link } = Typography;
const { Search } = Input;

const ManagePartner = () => {
    const navigate = useNavigate();
    const [searchText, setSearchText] = useState("");
    const [searchHistory, setSearchHistory] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [tableData, setTableData] = useState([
        {
            key: '1',
            partnerCode: 'P001',
            partnerName: 'Nguyễn Văn A',
            partnerType: 'Nhà cung cấp',
            company: 'Công ty TNHH ABC',
            position: 'Giám đốc',
            age: 45,
            phone: '0901234567',
            email: 'nguyenvana@abc.com',
            totalContracts: 20,
            activeContracts: 8,
            contractValue: 500000000,
            createdAt: '2024-01-10'
        },
        {
            key: '2',
            partnerCode: 'P002',
            partnerName: 'Trần Thị B',
            partnerType: 'Khách hàng',
            company: 'Công ty CP XYZ',
            position: 'Trưởng phòng',
            age: 35,
            phone: '0912345678',
            email: 'tranthib@xyz.com',
            totalContracts: 10,
            activeContracts: 2,
            contractValue: 180000000,
        },
        {
            key: '3',
            partnerCode: 'P003',
            partnerName: 'Lê Văn C',
            partnerType: 'Nhà cung cấp',
            company: 'Công ty TNHH DEF',
            position: 'Nhân viên kinh doanh',
            age: 28,
            phone: '0987654321',
            email: 'levanc@def.com',
            totalContracts: 12,
            activeContracts: 6,
            contractValue: 17000000,
        },
        {
            key: '4',
            partnerCode: 'P004',
            partnerName: 'Phạm Thị D',
            partnerType: 'Khách hàng',
            company: 'Công ty CP GHI',
            position: 'Phó giám đốc',
            age: 40,
            phone: '0923456789',
            email: 'phamthid@ghi.com',
            totalContracts: 18,
            activeContracts: 3,
            contractValue: 900000000,
        },
    ]);

    const navigateToDetail = (record) => {
        navigate(`/partner/${record.key}`, { state: record });
    };

    // Hàm thêm từ khóa vào lịch sử
    const addSearchHistory = (keyword) => {
        if (!keyword) return;

        setSearchHistory((prev) => {
            const updatedHistory = [{ keyword, timestamp: new Date().toISOString() }, ...prev];
            if (updatedHistory.length > 10) updatedHistory.pop(); // Giới hạn tối đa 10 mục
            return updatedHistory;
        });
    };

    // Hàm xử lý tìm kiếm
    const handleSearch = debounce((value) => {
        if (value) {
            const filtered = tableData.filter(
                (item) =>
                    item.partnerName.toLowerCase().includes(value.toLowerCase()) ||
                    item.company.toLowerCase().includes(value.toLowerCase()) ||
                    item.email.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredData(filtered);
            addSearchHistory(value); // Thêm từ khóa vào lịch sử
        } else {
            setFilteredData(tableData); // Hiển thị toàn bộ dữ liệu nếu không nhập
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
            width: '150px',
        },
        {
            title: 'Loại Partner',
            dataIndex: 'partnerType',
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
            title: "Công ty",
            dataIndex: "company",
            sorter: (a, b) => a.company.localeCompare(b.company),
            width: '200px',
        },
        {
            title: "Chức vụ",
            dataIndex: "position",
            filters: [
                { text: 'Giám đốc', value: 'Giám đốc' },
                { text: 'Trưởng phòng', value: 'Trưởng phòng' },
                { text: 'Nhân viên', value: 'Nhân viên' },
            ],
            onFilter: (value, record) => record.position === value,
        },
        {
            title: "Tuổi",
            dataIndex: "age",
            sorter: (a, b) => a.age - b.age,
            filters: [
                { text: '< 30', value: 'under30' },
                { text: '30-50', value: 'middle' },
                { text: '> 50', value: 'over50' },
            ],
            onFilter: (value, record) => {
                if (value === 'under30') return record.age < 30;
                if (value === 'middle') return record.age >= 30 && record.age <= 50;
                return record.age > 50;
            },
        },
        {
            title: "Điện thoại",
            dataIndex: "phone",
        },
        {
            title: "Email",
            dataIndex: "email",
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            render: (date) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Thao tác',
            fixed: 'right',
            width: '100px',
            render: (_, record) => (
                <Space className="flex justify-center">
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => navigateToDetail(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div className="text-lg font-bold text-blue-700 mb-4">Manage Partner</div>

            {/* Search section */}
            <div className="mb-4 flex items-center gap-2">
                <Dropdown
                    trigger={["click"]}
                    overlay={
                        <List
                            dataSource={searchHistory}
                            renderItem={(item) => (
                                <List.Item
                                    onClick={() => {
                                        setSearchText(item.keyword);
                                        handleSearch(item.keyword);
                                    }}
                                >
                                    <Space>
                                        <SearchOutlined />
                                        <span>{item.keyword}</span>
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
                        placeholder="Tìm kiếm theo tên, công ty, email..."
                        allowClear
                        enterButton
                        onChange={(e) => setSearchText(e.target.value)}
                        onSearch={(value) => {
                            handleSearch(value);
                            setSearchText(value);
                        }}
                        style={{ width: 300 }}
                    />


                </Dropdown>

            </div>

            <Table
                columns={columns}
                dataSource={filteredData.length > 0 ? filteredData : tableData}
                bordered
                scroll={{ x: 1500 }}
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
                                    borderWidth: '1px',
                                }}
                            />
                        ),
                    },
                    header: {
                        cell: (props) => (
                            <th
                                {...props}
                                style={{
                                    backgroundColor: '#cdf2ff',
                                    color: '#005580',
                                    borderColor: '#89c4d9',
                                    borderStyle: 'solid',
                                    borderWidth: '1px',
                                }}
                            />
                        ),
                    },
                }}
            />


        </div>
    );
};

export default ManagePartner;