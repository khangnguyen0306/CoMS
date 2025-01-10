import React, { useRef, useState } from "react";
import { Row, Col, Card, Statistic, Table, Button, Input, Space } from "antd";
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Tooltip, Cell } from "recharts";

const Home = () => {
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);
    const handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };
    const handleReset = (clearFilters) => {
        clearFilters();
        setSearchText('');
    };
    const getColumnSearchProps = (dataIndex) => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
            <div
                style={{
                    padding: 8,
                }}
                onKeyDown={(e) => e.stopPropagation()}
            >
                <Input
                    ref={searchInput}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{
                        marginBottom: 8,
                        display: 'block',
                    }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Search
                    </Button>
                    <Button
                        onClick={() => clearFilters && handleReset(clearFilters)}
                        size="small"
                        style={{
                            width: 90,
                        }}
                    >
                        Reset
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            confirm({
                                closeDropdown: false,
                            });
                            setSearchText(selectedKeys[0]);
                            setSearchedColumn(dataIndex);
                        }}
                    >
                        Filter
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            close();
                        }}
                    >
                        close
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered) => (
            <SearchOutlined
                style={{
                    color: filtered ? '#1677ff' : undefined,
                }}
            />
        ),

    });
    // Dữ liệu thống kê
    const statisticsData = [
        { title: "TỔNG HỢP HỢP ĐỒNG", count: 10, value: "2.278.563.100" },
        { title: "CÒN HIỆU LỰC", count: 7, value: "23.278.563" },
        { title: "HẾT HIỆU LỰC", count: 3, value: "100" },
        { title: "ĐÃ THANH LÝ", count: 0, value: "0" },
        { title: "CHƯA THANH LÝ", count: 10, value: "0" },
        { title: "ĐÃ THANH TOÁN", count: 0, value: "105.020.000" },
        { title: "CHƯA THANH TOÁN", count: 0, value: "0" },
        { title: "  CHỜ ĐỐI TÁC KÝ", count: 0, value: "0" },
    ];

    // Cột dữ liệu cho bảng
    const columns = [
        {
            title: "STT",
            dataIndex: "key",
            key: "key",
        },
        {
            title: "Tên nhân viên",
            dataIndex: "staffName",
            key: "staffName",
            render: (text) => (
                <span
                    style={{
                        fontWeight: 'bold'
                    }}
                >
                    {text}
                </span>
            ),
            ...getColumnSearchProps('name'),
        },
        {
            title: "Tổng hợp hợp đồng",
            children: [
                {
                    title: "Số lượng",
                    dataIndex: "totalCount",
                    key: "totalCount",
                    className: "special-header",
                    sorter: (a, b) => parseFloat(a.totalCount.replace(/\./g, '')) - parseFloat(b.totalCount.replace(/\./g, '')),
                },
                {
                    title: "Giá trị",
                    dataIndex: "totalValue",
                    key: "totalValue",
                    className: "special-header",
                    sorter: (a, b) => parseFloat(a.totalValue.replace(/\./g, '')) - parseFloat(b.totalValue.replace(/\./g, '')),
                },
            ],
        },
        {
            title: "Còn hiệu lực",
            children: [
                {
                    title: "Số lượng",
                    dataIndex: "activeCount",
                    key: "activeCount",
                    className: "special-header",
                    sorter: (a, b) => parseFloat(a.activeCount.replace(/\./g, '')) - parseFloat(b.activeCount.replace(/\./g, '')),
                },
                {
                    title: "Giá trị",
                    dataIndex: "activeValue",
                    key: "activeValue",
                    className: "special-header",
                    sorter: (a, b) => parseFloat(a.activeValue.replace(/\./g, '')) - parseFloat(b.activeValue.replace(/\./g, '')),
                },
            ],
        },
        {
            title: "Hết hiệu lực",
            children: [
                {
                    title: "Số lượng",
                    dataIndex: "expiredCount",
                    key: "expiredCount",
                    className: "special-header",
                    sorter: (a, b) => parseFloat(a.expiredCount.replace(/\./g, '')) - parseFloat(b.expiredCount.replace(/\./g, '')),
                },
                {
                    title: "Giá trị",
                    dataIndex: "expiredValue",
                    key: "expiredValue",
                    className: "special-header",
                    sorter: (a, b) => parseFloat(a.expiredValue.replace(/\./g, '')) - parseFloat(b.expiredValue.replace(/\./g, '')),
                },
            ],
        },
        {
            title: "Đã thanh lý",
            children: [
                {
                    title: "Số lượng",
                    dataIndex: "liquidatedCount",
                    key: "liquidatedCount",
                    className: "special-header",
                    sorter: (a, b) => parseFloat(a.liquidatedCount.replace(/\./g, '')) - parseFloat(b.liquidatedCount.replace(/\./g, '')),
                },
                {
                    title: "Giá trị",
                    dataIndex: "liquidatedValue",
                    key: "liquidatedValue",
                    className: "special-header",
                    sorter: (a, b) => parseFloat(a.liquidatedValue.replace(/\./g, '')) - parseFloat(b.liquidatedValue.replace(/\./g, '')),
                },
            ],
        },
        {
            title: "Chưa thanh lý",
            children: [
                {
                    title: "Số lượng",
                    dataIndex: "unliquidatedCount",
                    key: "unliquidatedCount",
                    className: "special-header",
                    sorter: (a, b) => parseFloat(a.unliquidatedCount.replace(/\./g, '')) - parseFloat(b.unliquidatedCount.replace(/\./g, '')),
                },
                {
                    title: "Giá trị",
                    dataIndex: "unliquidatedValue",
                    key: "unliquidatedValue",
                    className: "special-header",
                    sorter: (a, b) => parseFloat(a.unliquidatedValue.replace(/\./g, '')) - parseFloat(b.unliquidatedValue.replace(/\./g, '')),
                },
            ],
        },
    ];
    // Dữ liệu cho biểu đồ
    const lineData = [
        { month: "Jan", contracts: 10 },
        { month: "Feb", contracts: 15 },
        { month: "Mar", contracts: 12 },
        { month: "Apr", contracts: 18 },
        { month: "May", contracts: 20 },
        { month: "Jun", contracts: 25 },
        { month: "Jul", contracts: 22 },
        { month: "Aug", contracts: 27 },
        { month: "Sep", contracts: 30 },
        { month: "Oct", contracts: 28 },
    ];
    // Dữ liệu cho biểu đồ tròn
    const pieData = [
        { name: "Còn hiệu lực", value: 40 },
        { name: "Hết hiệu lực", value: 30 },
        { name: "Đã thanh toán", value: 20 },
        { name: "Chưa thanh toán", value: 10 },
        { name: "Đã thanh lý", value: 10 },
        { name: "Chưa thanh lý", value: 10 },
        { name: "Chờ đối tác ký", value: 10 },
    ];
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

    // Dữ liệu cho bảng
    const tableData = [
        {
            key: "1",
            staffName: "Staff 1",
            totalCount: 2,
            totalValue: "100",
            activeCount: 1,
            activeValue: "20.000.000",
            expiredCount: 1,
            expiredValue: "100",
            liquidatedCount: 0,
            liquidatedValue: "0",
            unliquidatedCount: 2,
            unliquidatedValue: "105.020.000",
        },
        {
            key: "2",
            staffName: "Staff 2",
            totalCount: 1,
            totalValue: "10",
            activeCount: 0,
            activeValue: "0",
            expiredCount: 1,
            expiredValue: "10",
            liquidatedCount: 0,
            liquidatedValue: "0",
            unliquidatedCount: 0,
            unliquidatedValue: "0",
        },
        {
            key: "3",
            staffName: "Staff 3",
            totalCount: 4,
            totalValue: "2.278.563",
            activeCount: 3,
            activeValue: "2.278.563",
            expiredCount: 1,
            expiredValue: "1.000.000",
            liquidatedCount: 0,
            liquidatedValue: "0",
            unliquidatedCount: 4,
            unliquidatedValue: "2.258.563",
        },
    ];

    return (
        <div >
            {/* Thống kê */}
            <Row gutter={16} >
                {statisticsData.map((stat, index) => (
                    <Col className="mb-4" span={6} key={index}>
                        <Card className="flex items-center justify-center border-gray-300">
                            <h3 className="text-sm font-medium">{stat.title}</h3>
                            <a
                                href="/desired-link"
                                className="flex items-center justify-center text-2xl font-bold text-blue-500 hover:underline"
                            >
                                {stat.count}
                            </a>
                            <span className="text-gray-600 text-sm flex items-center justify-center">{stat.value}</span>
                        </Card>
                    </Col>
                ))}
            </Row>
            <div className="flex flex-wrap gap-4 mb-4">
                {/* Biểu dồ đường */}
                <div className="p-4 bg-white rounded shadow-[0px_-4px_10px_rgba(0,0,0,0.1),0px_4px_10px_rgba(0,0,0,0.1)] flex-1">
                    <h3 className="text-xl font-semibold mb-4">Tổng số lượng hợp đồng theo thời gian</h3>
                    <LineChart
                        width={660}
                        height={300}
                        data={lineData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="contracts" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </LineChart>
                </div>

                {/* Biểu đồ hình tròn */}
                <div className="p-4 bg-white rounded shadow-[0px_-4px_10px_rgba(0,0,0,0.1),0px_4px_10px_rgba(0,0,0,0.1)] flex-1">
                    <h3 className="text-xl font-semibold mb-4">Tỷ lệ trạng thái hợp đồng</h3>
                    <PieChart width={500} height={350}>
                        <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={150}
                            label
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend layout="vertical" align="right" className="ml-10" verticalAlign="middle" />
                    </PieChart>
                </div>
            </div>


            {/* Bảng dữ liệu */}
            <Table
                columns={columns}
                dataSource={tableData}
                bordered
                pagination={false}
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

export default Home;
