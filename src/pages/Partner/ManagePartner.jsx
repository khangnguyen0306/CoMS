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
    message
} from "antd";
import { PlusOutlined, EditFilled, DeleteFilled } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCreatePartnerMutation, useEditPartnerMutation, useGetPartnerListQuery, useDeletePartnerMutation } from '../../services/PartnerAPI';
import { validationPatterns } from "../../utils/ultil";
import { useSelector } from "react-redux";

const { Link } = Typography;
const { Search } = Input;

const ManagePartner = () => {
    const navigate = useNavigate();
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    // --- State cho search & phân trang ---
    const [searchText, setSearchText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    // currentPage được lưu dạng 1-based để hiển thị trên UI
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Gọi API: API yêu cầu page theo dạng 0-based nên truyền currentPage - 1
    const { data: partnerData, isLoading: isFetching, error: fetchError, refetch } = useGetPartnerListQuery({
        keyword: searchQuery,
        page: currentPage - 1,
        size: pageSize,
    });
    // //////////////////////////////////// //////////////////////// ////////////////////////////////// chua co search
    const [CreatePartner, { isLoading }] = useCreatePartnerMutation();
    const [EditPartner, { isLoading: isLoadingEdit }] = useEditPartnerMutation();
    const [DeletePartner, { isLoading: loadingDelete }] = useDeletePartnerMutation();
    const [viewHistory, setViewHistory] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [bankAccounts, setBankAccounts] = useState([{ bankName: '', backAccountNumber: '' }]);
    const [editingPartner, setEditingPartner] = useState(null);



    useEffect(()=>{
        refetch();
    },[])

    const getViewHistory = () => {
        return JSON.parse(localStorage.getItem('viewHistory')) || [];
    };


    const handleDeleteItem = (key) => {
        const currentHistory = getViewHistory();
        const updatedHistory = currentHistory.filter(item => item.key !== key);
        localStorage.setItem('viewHistory', JSON.stringify(updatedHistory));
        setViewHistory(updatedHistory);
    };

    useEffect(() => {
        const syncViewHistoryWithAPI = () => {
            const initialHistory = getViewHistory();
            if (partnerData) {
                const validHistory = initialHistory.filter((item) =>
                    partnerData?.data?.content.some((partner) => partner.key === item.key)
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
            console.log(newPartnerData);
            const result = await CreatePartner(newPartnerData);
            if (result.data.status === "CREATED") {
                message.success('Thêm mới thành công!');
                refetch();
                form.resetFields();
                setBankAccounts([{ bankName: '', backAccountNumber: '' }]);
                setIsModalVisible(false);
            } else {
                message.error('Thêm mới thất bại vui lòng thử lại!');
            }
        } catch (error) {
            console.error("Error creating partner:", error);
        }
    };

    const handleDelete = async (partnerId) => {
        Modal.confirm({
            title: 'Bạn có chắc muốn xóa không?',
            onOk: async () => {
                try {
                    const result = await DeletePartner({ partnerId: partnerId });
                    if (result.error.originalStatus == 200) {
                        refetch();
                        message.success('Xóa thành công');
                    } else
                        message.success('Xóa thất bại vui lòng thử lại');

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

    const handleBankChange = (index, field, value) => {
        const newBankAccounts = bankAccounts.map((account, i) =>
            i === index ? { ...account, [field]: value } : account
        );
        setBankAccounts(newBankAccounts);
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
        setEditingPartner(partner);
        form.setFieldsValue(partner);
        setBankAccounts(partner.banking || [{ bankName: '', backAccountNumber: '' }]);
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
            const result = await EditPartner({ ...updatedPartnerData, id: editingPartner.partyId });
            console.log(result);
            if (result.data.status === "OK") {
                message.success('Cập nhật thành công!');
                refetch();
                form.resetFields();
                setBankAccounts([{ bankName: '', backAccountNumber: '' }]);
                setIsModalVisible(false);
                setEditingPartner(null);
            } else {
                message.error('Cập nhật thất bại vui lòng thử lại!');
            }
        } catch (error) {
            console.error("Error updating partner:", error);
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
            width: '200px',
        },
        {
            title: 'Loại Partner',
            dataIndex: 'partnerType',
            width: '150px',
            filters: [
                { text: 'Nhà cung cấp', value: 'PARTY_B' },
                { text: 'Khách hàng', value: 'PARTY_A' },
            ],
            onFilter: (value, record) => record.partnerType === value,
            render: (type) => (
                <Tag color={type === 'PARTY_B' ? 'blue' : 'green'}>
                    {type === "PARTY_B" ? "Nhà cung cấp" : "Khách hàng  "}
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
            title: 'Thao tác',
            width: '100px',
            render: (_, record) => (
                <Space className="flex justify-center">
                    <Button
                        icon={<EditFilled style={{ color: '#2196f3' }} />}
                        onClick={() => showEditModal(record)}
                    />
                    <Button
                        icon={<DeleteFilled style={{ color: '#2196f3' }} />}
                        onClick={() => handleDelete(record.partyId)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className="min-h-[100vh]">
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
                            dataSource={viewHistory}
                            renderItem={(item) => (
                                <List.Item
                                    style={{
                                        cursor: 'pointer',
                                        border: '1.5px solid #89c4d9',
                                        borderRadius: '5px',
                                        marginBottom: '8px'
                                    }}
                                    onClick={() => {
                                        setSearchText(item.partnerName);
                                        setSearchQuery(item.partnerName);
                                        // Reset lại trang về 1 khi chọn từ viewHistory
                                        setCurrentPage(1);
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
                                                style={{ color: 'red', cursor: 'pointer', fontSize: '16px' }}
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
                                background: "#fff"
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
                            //   debouncedSearch(e.target.value);
                        }}
                        onSearch={(value) => {
                            setSearchQuery(value);
                            setCurrentPage(1);
                        }}
                        style={{ width: 350 }}
                    />
                </Dropdown>
                <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                    Tạo partner mới
                </Button>
            </div>

            <Modal title={editingPartner ? "Chỉnh sửa Partner" : "Tạo Partner Mới"} open={isModalVisible} onOk={editingPartner ? handleEditOk : handleOk} onCancel={handleCancel}>
                <Form form={form} layout="vertical">
                    <Form.Item name="partyId" />
                    <Form.Item name="partnerType" label="Loại Partner" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="PARTY_B">Nhà cung cấp</Select.Option>
                            <Select.Option value="PARTY_A">Khách hàng</Select.Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="partnerName" label="Tên Partner" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="position" label="Chức vụ" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="spokesmanName" label="Người đại diện">
                        <Input />
                    </Form.Item>
                    <Form.Item name="address" label="Địa chỉ" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="taxCode" label="Mã số thuế" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Điện thoại"
                        rules={[{
                            required: true,
                            pattern: validationPatterns.phoneNumber.pattern,
                            message: validationPatterns.phoneNumber.message
                        }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{
                            required: true,
                            pattern: validationPatterns.email.pattern,
                            message: validationPatterns.email.message
                        }]}
                    >
                        <Input />
                    </Form.Item>
                    <div>
                        <h4>Ngân hàng</h4>
                        {bankAccounts.map((bank, index) => (
                            <div key={index} style={{ marginBottom: '10px' }}>
                                <Form.Item className="mt-2">
                                    <div className="flex flex-col gap-2 w-[70%] ml-[10px]">
                                        <Input
                                            placeholder="Tên ngân hàng"
                                            value={bank.bankName}
                                            onChange={(e) => handleBankChange(index, 'bankName', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Số tài khoản"
                                            value={bank.backAccountNumber}
                                            onChange={(e) => handleBankChange(index, 'backAccountNumber', e.target.value)}
                                        />
                                    </div>
                                </Form.Item>
                            </div>
                        ))}
                        <Button icon={<PlusOutlined />} onClick={addBankAccount}>Thêm ngân hàng</Button>
                    </div>
                </Form>
            </Modal>

            <Table
                columns={columns}
                dataSource={partnerData?.data?.content}
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
        </div>
    );
};

export default ManagePartner;
