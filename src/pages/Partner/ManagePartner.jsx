import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Input,
    Space,
    Tag,
    Typography,
    List,
    Dropdown,
    Modal,
    Form,
    Select,
    message,
    Row,
    Col,
    Tooltip,
    Skeleton,
    DatePicker
} from "antd";
import { PlusOutlined, EditFilled, DeleteFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCreatePartnerMutation, useEditPartnerMutation, useGetPartnerListQuery, useDeletePartnerMutation, useLazyGenerateReportPartnerQuery } from '../../services/PartnerAPI';
import { validationPatterns } from "../../utils/ultil";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../slices/authSlice";
import { FaFileExport } from "react-icons/fa6";
const { Link } = Typography;
const { Search } = Input;




const ManagePartner = () => {
    const navigate = useNavigate();
    const user = useSelector(selectCurrentUser)
    const isCEO = user?.roles?.includes("ROLE_DIRECTOR");
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [searchText, setSearchText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [modalVisible, setModalVisible] = useState(false);
    const [dateRange, setDateRange] = useState([null, null]);
    const [loading, setLoading] = useState(false);

    const { data: partnerData, isLoading: isFetching, error: fetchError, refetch } = useGetPartnerListQuery({
        keyword: searchQuery,
        page: currentPage - 1,
        size: pageSize,
    });

    const partnerDataReal = partnerData?.data?.content?.filter(partner => partner.partyId !== 1) || [];
    const [genarateReport, { data: reportData, isLoading: loadingGenarate }] = useLazyGenerateReportPartnerQuery()
    const [CreatePartner, { isCreating }] = useCreatePartnerMutation();
    // const { data: ReportData, isLoading: isFetching } = useGenarateReportPartnerQuery()
    const [EditPartner, { isLoading: isEditing }] = useEditPartnerMutation();
    const [DeletePartner, { isLoading: loadingDeleting }] = useDeletePartnerMutation();
    const [viewHistory, setViewHistory] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [bankAccounts, setBankAccounts] = useState([{ bankName: '', backAccountNumber: '' }]);
    const [editingPartner, setEditingPartner] = useState(null);



    useEffect(() => {
        refetch();
    }, [])

    const getViewHistory = () => {
        return JSON.parse(localStorage.getItem('viewHistory')) || [];
    };


    const handleDeleteItem = (partyId) => {
        const currentHistory = getViewHistory();
        const updatedHistory = currentHistory.filter(item => item.partyId !== partyId);
        localStorage.setItem('viewHistory', JSON.stringify(updatedHistory));
        setViewHistory(updatedHistory);
    };

    useEffect(() => {
        const syncViewHistoryWithAPI = () => {
            const initialHistory = getViewHistory();
            if (partnerData) {
                const validHistory = initialHistory.filter((item) =>
                    partnerData?.data?.content.some((partner) => partner.partyId === item.partyId)
                );
                if (validHistory.length !== initialHistory.length) {
                    localStorage.setItem('viewHistory', JSON.stringify(validHistory));
                }
                setViewHistory(validHistory);
            }
        };
        syncViewHistoryWithAPI();
    }, [partnerData]);

    const addViewHistory = (record) => {
        console.log('addViewHistory', record);
        const minimalRecord = {
            partyId: record.partyId,
            partnerName: record.partnerName,
            email: record.email,
            img: record.img,
        };
        const currentHistory = getViewHistory();
        if (!currentHistory.find((item) => item.partyId === minimalRecord.partyId)) {
            const updatedHistory = [minimalRecord, ...currentHistory];
            const limitedHistory = updatedHistory.slice(0, 10);
            localStorage.setItem('viewHistory', JSON.stringify(limitedHistory));
            setViewHistory(limitedHistory);
        }
    };

    const navigateToDetail = (record) => {
        addViewHistory(record);
        navigate(`/partner/${record.partyId}`);
    };


    // --- Modal: Tạo partner mới ---
    const showModal = () => {
        setIsModalVisible(true);
        form.resetFields();
        setBankAccounts([{ bankName: '', backAccountNumber: '' }]);
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            const bankingInfo = bankAccounts.map(account => ({
                bankName: account.bankName,
                backAccountNumber: account.backAccountNumber,
            }));
            const newPartnerData = {
                ...values,
                banking: bankingInfo,
            };
            // console.log(newPartnerData);
            const result = await CreatePartner(newPartnerData).unwrap();
            console.log(result)
            if (result.status === "CREATED") {
                message.success('Thêm mới đối tác thành công!');
                refetch();
                setIsModalVisible(false);
                form.resetFields();
                setBankAccounts([{ bankName: '', backAccountNumber: '' }]);
            }
        } catch (error) {
            message.error(error.data.message)
            console.error("Error creating partner:", error);
        }
    };

    const handleDelete = async (partnerId) => {
        Modal.confirm({
            title: 'xóa đối tác sẽ không thể phục hồi bạn có chắc muốn xóa không?',
            okText: "Xóa đối tác",
            okButtonProps: { style: { backgroundColor: 'red', color: 'white' } },
            cancelText: "Hủy",
            onOk: async () => {
                try {
                    const result = await DeletePartner({ partnerId: partnerId });
                    console.log(result);
                    if (result.error.originalStatus == 200) {
                        refetch();
                        message.success('Xóa thành công');
                    } else
                        message.error('Không thể xóa đối tác vì đang trong hợp đồng đang hoạt động. Vui lòng tạo phụ lục thay thế.');

                }
                catch (error) {
                    console.error("Error during delete:", error);
                    message.error('Xóa thất bại, vui lòng thử lại!');
                }
            },
        });
    };


    const handleCancel = () => {
        setIsModalVisible(false);
    };

    const addBankAccount = () => {
        setBankAccounts([...bankAccounts, { bankName: '', backAccountNumber: '' }]);
    };

    const removeBankAccount = (index) => {
        if (bankAccounts.length > 1) {
            const updatedBanks = bankAccounts.filter((_, i) => i !== index);
            setBankAccounts(updatedBanks);
            form.setFieldsValue({ banking: updatedBanks });
        }
    };


    const handleBankChange = (index, field, value) => {
        const newBankAccounts = bankAccounts.map((account, i) =>
            i === index ? { ...account, [field]: value } : account
        );

        setBankAccounts(newBankAccounts);
        form.setFieldsValue({ banking: newBankAccounts });
    };

    // --- Xử lý phân trang của table ---
    // Khi pageSize thay đổi, reset currentPage về 1
    const handleTableChange = (pagination, filters, sorter) => {
        if (pagination.pageSize !== pageSize) {
            setCurrentPage(1);
            setPageSize(pagination.pageSize);
        } else {
            setCurrentPage(pagination.current);
        }
    };

    // --- Modal: Chỉnh sửa partner --- 
    const showEditModal = (partner) => {
        const formattedData = {
            ...partner,
            bankAccounts: partner.banking || [],
        };

        setEditingPartner(formattedData);
        setBankAccounts(formattedData.bankAccounts);
        form.setFieldsValue(formattedData);
        setIsModalVisible(true);
    };

    const handleEditOk = async () => {
        try {
            const values = await form.validateFields();
            const bankingInfo = bankAccounts.map(account => ({
                bankName: account.bankName,
                backAccountNumber: account.backAccountNumber,
            }));
            const updatedPartnerData = {
                ...values,
                banking: bankingInfo,
            };
            console.log(updatedPartnerData);
            const result = await EditPartner({ ...updatedPartnerData, id: editingPartner.partyId }).unwrap();
            console.log(result);
            if (result.status === "OK") {
                message.success('Cập nhật thông tin đối tác thành công!');
                refetch();
                setIsModalVisible(false);
                form.resetFields();
                setBankAccounts([{ bankName: '', backAccountNumber: '' }]);
                setEditingPartner(null);
            }
        } catch (error) {
            message.error(error.data.message)

        }
    };

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
                <Link onClick={() => navigateToDetail(record)} className="font-medium hover:text-blue-600">
                    {text}
                </Link>
            ),
            width: '400px',
        },
        {
            title: 'Mã số thuế',
            dataIndex: 'taxCode',
            sorter: (a, b) => a.taxCode.localeCompare(b.taxCode),
            width: '200px',
        },
        {
            title: 'Loại Partner',
            dataIndex: 'partnerType',
            width: '150px',
            filters: [
                { text: 'Nhà cung cấp', value: 'PARTNER_A' },
                { text: 'Khách hàng', value: 'PARTNER_B' },
            ],
            onFilter: (value, record) => record.partnerType === value,
            render: (type) => (
                <Tag color={type === 'PARTNER_B' ? 'blue' : 'green'}>
                    {type === "PARTNER_A" ? "Nhà cung cấp" : "Khách hàng  "}
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
            width: 200,
            render: (text) => (
                <Tooltip title={text}>
                    <div style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 180
                    }}>
                        {text}
                    </div>
                </Tooltip>
            ),
        },
        ...(isCEO ? [] : [{
            title: 'Thao tác',
            width: '100px',
            render: (_, record) => (
                <Space className="flex justify-center">
                    <Button
                        type="primary"
                        icon={<EditFilled />}
                        onClick={() => showEditModal(record)}
                    />
                    <Button
                        type="primary"
                        danger
                        icon={<DeleteFilled />}
                        onClick={() => handleDelete(record.partyId)}
                    />
                </Space>
            ),
        }]),
    ];

    const handleNameChange = (e) => {
        console.log('handleNameChange e', e);
        const value = e.target.value;
        console.log('handleNameChange value', value);
        const abbreviation = value
            .split(' ')
            .filter((word) => word)
            .map((word) => word[0])
            .join('')
            .toUpperCase();
        form.setFieldsValue({ abbreviation: abbreviation });
    };

    if (isFetching)
        return (
            <div className='flex justify-center items-center min-h-[100vh]'>
                <Skeleton active />;
            </div>
        )

    return (
        <div className="min-h-[100vh]   w-full">
            <p
                className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent'
                style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}
            >
                QUẢN LÝ THÔNG TIN KHÁCH HÀNG
            </p>

            <div className="mb-4 flex justify-between items-center gap-2">
                <Dropdown
                    trigger={["click"]}
                    overlay={
                        <List
                            className="rounded-md "
                            dataSource={viewHistory}
                            renderItem={(item) => (
                                <List.Item
                                    className="rounded-md cursor-pointer hover:bg-slate-200 p-0 border border-gray-500"
                                    onClick={() => {
                                        setSearchText(item.partnerName);
                                        setSearchQuery(item.partnerName);
                                        setCurrentPage(1);
                                    }}
                                >
                                    <div className="flex items-center justify-between w-full text-black hover:text-blue-600 ">
                                        <p className=" ml-3">{item.partnerName}</p>
                                        <Button
                                            type="link"
                                            danger
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteItem(item.partyId);

                                            }}
                                        >
                                            <DeleteFilled />
                                        </Button>
                                    </div>
                                </List.Item>
                            )}
                            style={{
                                width: 300,
                                maxHeight: 200,
                                overflowY: "auto",
                                padding: "8px",
                                background: isDarkMode ? "#b4b4b4" : "#fff"
                            }}
                        />
                    }
                >
                    <Search
                        value={searchText}
                        placeholder="Tìm kiếm theo tên, công ty, email"
                        allowClear
                        enterButton
                        onChange={(e) => {
                            setSearchText(e.target.value);
                        }}
                        onSearch={(value) => {
                            setSearchQuery(value);
                            setCurrentPage(1);
                        }}
                        style={{ width: 350 }}
                    />
                </Dropdown>
                {!isCEO && (
                    <div className="flex gap-3">
                        <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                            Tạo khách hàng mới
                        </Button>

                    </div>
                )}

            </div>
            <div className="justify-self-end mb-2">
                {partnerData?.data.content && partnerData?.data.content.length > 0 && isCEO && (

                    <Button
                        type="primary"
                        icon={<FaFileExport />}
                        onClick={handleGenerateReport}
                        style={{ marginBottom: 8 }}
                    >
                        Xuất báo cáo
                    </Button>
                )}
            </div>

            <Table
                columns={columns}
                dataSource={partnerDataReal}
                loading={isFetching}
                onChange={handleTableChange}
                pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: partnerData?.data?.totalElements || 0,
                    showTotal: (total) => `Tổng ${total} bản ghi`,
                }}
                bordered
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
                                        : isDarkMode ? '#1f1f1f' : '#cdf2ff',
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
            <Modal
                className="w-full min-w-[800px]"
                title={editingPartner ? "Chỉnh sửa khách hàng" : "Tạo khách hàng Mới"}
                open={isModalVisible}
                okText={editingPartner ? "Chỉnh sửa khách hàng" : "Tạo khách hàng Mới"}
                onOk={editingPartner ? handleEditOk : handleOk}
                onCancel={handleCancel}
                cancelText={"Hủy"}
                loading={isCreating || isEditing}


            >
                <Form form={form} layout="vertical" className="w-full ">
                    {/* Các trường chung được chia thành 2 cột */}
                    <Row gutter={16} className="w-full">
                        <Col xs={24} md={12}>
                            <Form.Item name="partyId" style={{ display: 'none' }} />
                            <Form.Item
                                name="partnerType"
                                label="Loại đối tác"
                                rules={[{ required: true, message: "Vui lòng chọn loại đối tác" }]}
                            >
                                <Select placeholder="chọn loại">
                                    <Select.Option value="PARTNER_A">Nhà cung cấp</Select.Option>
                                    <Select.Option value="PARTNER_B">Khách hàng</Select.Option>
                                </Select>
                            </Form.Item>
                            <Form.Item
                                name="partnerName"
                                label="Tên đối tác"
                                rules={[
                                    { required: true, whitespace: true, message: "Vui lòng nhập tên đối tác" },
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve();
                                            const regex = /^[\p{L}0-9\s-]{2,100}$/u;
                                            return regex.test(value)
                                                ? Promise.resolve()
                                                : Promise.reject(
                                                    new Error(
                                                        "Tên đối tác không hợp lệ (chỉ chứa chữ, số, dấu cách, dấu gạch ngang, từ 2-100 ký tự)"
                                                    )
                                                );
                                        },
                                    },
                                ]}
                            >
                                <Input onChange={handleNameChange} placeholder="Nguyễn Văn A" />
                            </Form.Item>
                            <Form.Item
                                name="spokesmanName"
                                label="Người đại diện"
                                rules={[
                                    { required: true, whitespace: true, message: "Vui lòng nhập tên Người đại diện" },
                                    {
                                        validator: (_, value) => {
                                            if (!value) return Promise.resolve();
                                            const regex = /^[\p{L}\s-]{2,50}$/u;
                                            return regex.test(value)
                                                ? Promise.resolve()
                                                : Promise.reject(
                                                    new Error(
                                                        "Tên người đại diện không hợp lệ (chỉ chứa chữ, dấu cách, dấu gạch ngang, từ 2-50 ký tự)"
                                                    )
                                                );
                                        },
                                    },
                                ]}
                            >
                                <Input placeholder=" VD: Nguyễn Văn A" />
                            </Form.Item>
                            <Form.Item
                                name="address"
                                label="Địa chỉ"
                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập địa chỉ" }]}
                            >
                                <Input placeholder="Nhập địa chỉ" />
                            </Form.Item>
                            <Form.Item
                                name="email"
                                label="Email"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        pattern: validationPatterns.email.pattern,
                                        message: validationPatterns.email.message,
                                    },
                                ]}
                            >
                                <Input placeholder="Nhập email" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                name="position"
                                label="Chức vụ người đại diện"
                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập chức vụ" }]}
                            >
                                <Input placeholder="VD: Giám đốc" />
                            </Form.Item>
                            <Form.Item
                                name="abbreviation"
                                label="Viết tắt của partner"
                                rules={[{ required: true, whitespace: true, message: "Viết tắt không được để trống" }]}
                            >
                                <Input placeholder="VD: FAS" />
                            </Form.Item>
                            <Form.Item
                                name="taxCode"
                                label="Mã số thuế"
                                rules={[
                                    { required: true, whitespace: true, message: "Vui lòng nhập mã số thuế" },
                                    {
                                        validator: (_, value) => {
                                            if (!value || /^[0-9]{10}$/.test(value) || /^[0-9]{13}$/.test(value)) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error("Mã số thuế phải gồm 10 hoặc 13 chữ số"));
                                        },
                                    },
                                ]}
                            >
                                <Input placeholder="1234567xxx" />
                            </Form.Item>

                            <Form.Item
                                name="phone"
                                label="Điện thoại"
                                rules={[
                                    {
                                        required: true,
                                        whitespace: true,
                                        pattern: validationPatterns.phoneNumber.pattern,
                                        message: validationPatterns.phoneNumber.message,
                                    },
                                ]}
                            >
                                <Input placeholder="Nhập số điện thoại" />
                            </Form.Item>

                        </Col>
                    </Row>

                    {/* Phần ngân hàng */}
                    <div style={{ marginTop: 24 }} >
                        <h4 className="mb-4">Ngân hàng</h4>
                        {bankAccounts.map((bank, index) => (
                            <div key={index} className="flex items-center justify-center space-x-4">
                                <div className="w-full md:w-5/12">
                                    <Form.Item
                                        name={['banking', index, 'bankName']}
                                        rules={[
                                            {
                                                whitespace: true,
                                                pattern: /^[\p{L}\s.-]{3,100}$/u,
                                                message:
                                                    'Tên ngân hàng không hợp lệ (3-100 ký tự, chỉ chứa chữ, khoảng trắng, dấu gạch ngang, dấu chấm)',
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder="Tên ngân hàng"
                                            value={bank.bankName}
                                            onChange={(e) => handleBankChange(index, 'bankName', e.target.value)}
                                        />
                                    </Form.Item>
                                </div>

                                <div className="w-full md:w-5/12">
                                    <Form.Item
                                        name={['banking', index, 'backAccountNumber']}
                                        rules={[
                                            {
                                                whitespace: true,
                                                pattern: /^\d{6,20}$/,
                                                message:
                                                    'Số tài khoản không hợp lệ (chỉ chứa số, từ 6-20 ký tự)',
                                            },
                                        ]}
                                    >
                                        <Input
                                            placeholder="Số tài khoản"
                                            value={bank.backAccountNumber}
                                            onChange={(e) => handleBankChange(index, 'backAccountNumber', e.target.value)}
                                        />
                                    </Form.Item>
                                </div>

                                {bankAccounts.length > 1 && (
                                    <div>
                                        <Button
                                            type="primary"
                                            className="block"
                                            danger
                                            onClick={() => removeBankAccount(index)}
                                        >
                                            <DeleteFilled />
                                        </Button>
                                    </div>
                                )}
                            </div>

                        ))}
                        <Button icon={<PlusOutlined />} onClick={addBankAccount}>
                            Thêm ngân hàng
                        </Button>
                    </div>
                </Form>
            </Modal>

            <Modal
                title="Chọn khoảng thời gian xuất báo cáo"
                open={modalVisible}
                onOk={handleReportModalOk}
                confirmLoading={loading}
                onCancel={() => setModalVisible(false)}
                okText="Hoàn tất"
                cancelText="Hủy"
            >
                <div className="mt-6 flex flex-col gap-3">
                    <p>Chọn khoảng thời gian xuất báo cáo</p>
                    <DatePicker.RangePicker
                        className="w-full "
                        value={dateRange}
                        onChange={vals => setDateRange(vals)}
                        format="DD-MM-YYYY"
                    />
                </div>
            </Modal>
        </div>
    );
};

export default ManagePartner;
