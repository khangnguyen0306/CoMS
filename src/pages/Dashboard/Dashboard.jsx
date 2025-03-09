import React, { useRef, useState } from "react";
import { Row, Col, Card, Statistic, Table, Button, Input, Space } from "antd";
import { AreaChartOutlined, SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Tooltip, Cell } from "recharts";
import { GlowingEffectDemoSecond, GridItem, GridItemCustom } from "../../components/ui/ComponentEffect";
import { useSelector } from "react-redux";

const Home = () => {
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
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
                    placeholder={`Search Staff`}
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
        onFilter: (value, record) =>
            record[dataIndex]?.toString().toLowerCase().includes(value.toLowerCase()),
        filterDropdownProps: {
            onOpenChange(open) {
                if (open) {
                    setTimeout(() => searchInput.current?.select(), 100);
                }
            },
        },
        render: (text) =>
            searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{
                        backgroundColor: '#ffc069',
                        padding: 0,
                    }}
                    searchWords={[searchText]}
                    autoEscape
                    textToHighlight={text ? text.toString() : ''}
                />
            ) : (
                text
            ),
    });
    // Dữ liệu thống kê

    // thiếu icon
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
            ...getColumnSearchProps('staffName'),
        },
        {
            title: "Tổng hợp hợp đồng",
            children: [
                {
                    title: "Số lượng",
                    dataIndex: "totalCount",
                    key: "totalCount",
                    className: "special-header",
                    sorter: (a, b) => a.totalCount - b.totalCount,
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
                    sorter: (a, b) => a.activeCount - b.activeCount,
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
                    sorter: (a, b) => a.expiredCount - b.expiredCount,
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
                    sorter: (a, b) => a.liquidatedCount - b.liquidatedCount,
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
                    sorter: (a, b) => a.unliquidatedCount - b.unliquidatedCount,
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
        <div className={`${isDarkMode ? 'dark' : ''}`}>
            {/* Thống kê */}
            <p className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}
                >THỐNG KÊ
                </p>
            <Row gutter={[16, 16]} className="mb-5 ">
                {statisticsData.map((stat, index) => (
                    <Col
                        key={index}
                        xs={24}
                        sm={12}
                        md={12}
                        lg={6}
                    >
                        <GridItemCustom
                            icon={null}
                            title={stat?.title}
                            description={
                                <div className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    <a
                                        href="/desired-link"
                                        className={`flex items-center justify-center text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-500'
                                            } hover:underline`}
                                    >
                                        {stat.count}
                                    </a>
                                    <span className={`text-sm flex items-center justify-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        {stat.value}
                                    </span>
                                </div>
                            }
                            className={`${isDarkMode ? 'bg-dark-card' : 'bg-white'}`}
                        />
                    </Col>
                ))}
            </Row>
            <Row gutter={[16, 16]} className="mb-4 flex gap-5 justify-center">
                {/* Biểu dồ đường */}
                <GridItem
                    description={
                        <Col xs={24} md={12} lg={12}>
                            <div className={`p-4 rounded ${isDarkMode ? 'bg-dark-card' : 'bg-white'}`}>
                                <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                    Tổng số lượng hợp đồng theo thời gian
                                </h3>
                                <LineChart
                                    width={500}
                                    height={300}
                                    data={lineData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke={isDarkMode ? "#404040" : "#e5e5e5"}
                                    />
                                    <XAxis
                                        dataKey="month"
                                        stroke={isDarkMode ? "#d1d5db" : "#666"}
                                        tick={{ fill: isDarkMode ? "#d1d5db" : "#666" }}
                                    />
                                    <YAxis
                                        stroke={isDarkMode ? "#d1d5db" : "#666"}
                                        tick={{ fill: isDarkMode ? "#d1d5db" : "#666" }}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
                                            border: isDarkMode ? '1px solid #404040' : '1px solid #e5e5e5',
                                            borderRadius: '4px',
                                            color: isDarkMode ? '#d1d5db' : '#666'
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{
                                            color: isDarkMode ? "#d1d5db" : "#666"
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="contracts"
                                        stroke={isDarkMode ? "#60a5fa" : "#8884d8"}
                                        activeDot={{ r: 8 }}
                                    />
                                </LineChart>
                            </div>
                        </Col>
                    } />

                {/* Biểu đồ hình tròn */}
                <GridItem
                    description={
                        <Col xs={24} md={12} lg={12}>
                            <div className={`p-4 rounded  ${isDarkMode ? 'bg-dark-card' : 'bg-white'
                                }`}>
                                <h3 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'
                                    }`}>
                                    Tỷ lệ trạng thái hợp đồng
                                </h3>
                                <PieChart width={500} height={350}>
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        label={{
                                            fill: isDarkMode ? '#d1d5db' : '#666',
                                        }}

                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={isDarkMode ?
                                                    DARK_COLORS[index % DARK_COLORS.length] :
                                                    COLORS[index % COLORS.length]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: isDarkMode ? '#fff' : '#fff',
                                            border: isDarkMode ? '1px solid #404040' : '1px solid #e5e5e5',
                                            borderRadius: '4px',
                                            color: isDarkMode ? '#d1d5db' : '#666'
                                        }}
                                    />
                                    <Legend
                                        layout="vertical"
                                        align="right"
                                        verticalAlign="top"
                                        wrapperStyle={{
                                            color: isDarkMode ? '#d1d5db' : '#666'
                                        }}
                                    />
                                </PieChart>
                            </div>
                        </Col>
                    } />


            </Row>



            {/* Bảng dữ liệu */}
            <Table
                columns={columns}
                dataSource={tableData}
                bordered
                pagination={false}
                className={isDarkMode ? 'dark-table' : ''}
                components={{
                    body: {
                        cell: (props) => (
                            <td
                                {...props}
                                style={{
                                    borderColor: isDarkMode ? '#404040' : '#89c4d9',
                                    borderStyle: 'solid',
                                    borderWidth: '1px',
                                    backgroundColor: isDarkMode ? '#141414' : undefined,
                                    color: isDarkMode ? '#d1d5db' : undefined
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
                                        ? isDarkMode ? '#1f1f1f' : '#8dd4ff'
                                        : isDarkMode ? '#141414' : '#cdf2ff',
                                    color: isDarkMode ? '#d1d5db' : '#005580',
                                    borderColor: isDarkMode ? '#404040' : '#89c4d9',
                                    borderStyle: 'solid',
                                    borderWidth: '1px'
                                }}
                            />
                        )
                    }
                }}
            />

        </div >

    );
};

// Thêm màu sắc cho dark mode
const DARK_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#fb923c"];

export default Home;
