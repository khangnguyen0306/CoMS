import React, { useRef, useState } from "react";
import { Row, Col, Button, Input, Space, Spin, Skeleton, Modal, DatePicker, Select } from "antd";
import { SearchOutlined } from '@ant-design/icons';
import Highlighter from 'react-highlight-words';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, PieChart, Pie, Tooltip, Cell } from "recharts";
import { GridItem, GridItemCustom } from "../../components/ui/ComponentEffect";
import { useSelector } from "react-redux";
import { useGetDashboardataQuery } from "../../services/BsAPI";
import { useGetAllContractQuery } from "../../services/ContractAPI";
import ContractList from "./ContractList";
import { FaFileExport } from "react-icons/fa";
import { useLazyGenerateReportDashboardQuery } from "../../services/PartnerAPI";

const Home = () => {
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef(null);
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const currentYear = new Date().getFullYear();
    const { data: dashboardData, isLoading: loadingDashboard } = useGetDashboardataQuery({ year: currentYear });
    const { data: contracts, isLoading, isError, refetch } = useGetAllContractQuery({
        page: 0,
        size: 10,
        isCEO: true
    },
        {
            refetchOnMountOrArgChange: true,
            refetchOnReconnect: true,
        }
    );
    const [genarateReport, { isLoading: loadingGenarate }] = useLazyGenerateReportDashboardQuery()

    const [modalVisible, setModalVisible] = useState(false);
    const [dateRange, setDateRange] = useState([null, null]);
    const [periodType, setPeriodType] = useState('')
    // console.log(contracts)


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

    // Dữ liệu cho biểu đồ tròn
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

    const statusTitles = {
        APPROVAL_PENDING: 'CHỜ PHÊ DUYỆT',
        COMPLETED: 'HOÀN THÀNH',
        EXPIRED: 'ĐÃ HẾT HẠN',
        ENDED: 'ĐÃ KẾT THÚC',
        CANCELLED: 'ĐÃ HỦY',
        ACTIVE: 'ĐANG HOẠT ĐỘNG',
        SIGNED: 'ĐÃ KÝ',
        APPROVED: 'ĐÃ PHÊ DUYỆT',
        LIQUIDATED:'ĐÃ THANH LÝ'
    };

    const hiddenStatuses = ['DELETED', 'PENDING', 'CREATED', 'FIXED', 'REJECTED', 'UPDATED'];
    const statusCountsArray = Object.entries(dashboardData?.data?.statusCounts || {})
        .filter(([status]) => !hiddenStatuses.includes(status))
        .map(([status, count]) => ({
            status,
            count
        }));

    const pieChartData = dashboardData?.data?.pieChartData?.map(item => ({
        ...item,
        name: statusTitles[item.name] || item.name // Chuyển đổi tên trạng thái
    }));



    const handleGenerateReport = () => {
        setDateRange([null, null]);
        setModalVisible(true);
    };

    const handleReportModalOk = async () => {
        const [start, end] = dateRange;
        if (!start || !end) {
            return message.warning('Vui lòng chọn ngày bắt đầu và kết thúc!');
        }
        try {
            const arrayBuffer = await genarateReport({
                from: start.format('YYYY-MM-DDTHH:mm:ss'),
                to: end.format('YYYY-MM-DDTHH:mm:ss'),
                groupBy: periodType
            }).unwrap();

            const blob = new Blob([arrayBuffer], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `report_${start.format('YYYYMMDD')}_${end.format('YYYYMMDD')}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setModalVisible(false);
        } catch (e) {
            console.log(e)
            message.error('Xuất báo cáo thất bại, thử lại sau.');
        }
    };

    if (loadingDashboard || isLoading) {
        return (
            <div className='flex justify-center items-center min-h-[100vh]'>
                <Skeleton active />;
            </div>
        )
    }

    return (
        <div className={`${isDarkMode ? 'dark' : ''}`}>
            {/* Thống kê */}
            <p className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}
            >THỐNG KÊ
            </p>
            <div className="justify-self-end mb-2">
                <Button
                    type="primary"
                    icon={<FaFileExport />}
                    onClick={handleGenerateReport}
                    style={{ marginBottom: 8 }}
                >
                    Xuất báo cáo
                </Button>
            </div>
            <Row gutter={[16, 16]} className="mb-5">
                {statusCountsArray?.map((stat, index) => (
                    <Col key={index} xs={24} sm={12} md={12} lg={6}>
                        <GridItemCustom
                            icon={null}
                            title={statusTitles[stat.status] || stat.status}
                            description={
                                <div className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    <p
                                        href="/desired-link"
                                        className={`flex items-center justify-center text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-500'} hover:underline`}
                                    >
                                        {stat.count}
                                    </p>
                                    <p>Hợp đồng</p>
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
                                    data={dashboardData?.data.monthlyCounts}
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
                                        data={pieChartData}
                                        dataKey="value"
                                        nameKey={(entry) => statusTitles[entry.name]}
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        label={({ value, x, y, index }) => (
                                            <text
                                                x={x}
                                                y={y}
                                                fill={isDarkMode ? '#d1d5db' : '#666'}
                                                textAnchor="middle"
                                                dominantBaseline="central"
                                                fontSize={12}
                                            >
                                                {`${parseFloat(value).toFixed(2)}%`}
                                            </text>
                                        )}
                                    >
                                        {pieChartData?.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={
                                                    isDarkMode
                                                        ? DARK_COLORS[index % DARK_COLORS.length]
                                                        : COLORS[index % COLORS.length]
                                                }
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name, props) => `${Number(value).toFixed(2)}%`}

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
                                            color: isDarkMode ? '#d1d5db' : '#666',
                                            right: -30,
                                        }}
                                    />
                                </PieChart>

                            </div>
                        </Col>
                    } />
            </Row>

            <p className='font-bold text-[25px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent mt-10' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}
            >CÁC HỢP ĐỒNG GẦN ĐÂY
            </p>
            <div className="flex justify-center ">
                <ContractList contracts={contracts?.data.content} />
            </div>

            <Modal
                title="Chọn khoảng thời gian xuất báo cáo"
                open={modalVisible}
                onOk={handleReportModalOk}
                confirmLoading={loadingGenarate}
                onCancel={() => setModalVisible(false)}
                okText="Hoàn tất"
                cancelText="Hủy"
            >
                <div className="mt-6 flex flex-col gap-3">
                    <p>Chọn kiểu báo cáo</p>
                    <Select
                        value={periodType}
                        onChange={(value) => setPeriodType(value)}
                        className="w-full"
                        style={{ marginBottom: 16 }}
                    >
                        <Option value="MONTH">Theo tháng</Option>
                        <Option value="YEAR">Theo năm</Option>
                    </Select>
                    <p>Chọn khoảng thời gian xuất báo cáo</p>
                    <DatePicker.RangePicker
                        className="w-full "
                        value={dateRange}
                        onChange={vals => setDateRange(vals)}
                        format="DD-MM-YYYY"
                    />
                </div>

            </Modal>
            {/* Bảng dữ liệu */}
            {/* <Table
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
            /> */}

        </div >

    );
};

// Thêm màu sắc cho dark mode
const DARK_COLORS = ["#60a5fa", "#34d399", "#fbbf24", "#fb923c"];

export default Home;
