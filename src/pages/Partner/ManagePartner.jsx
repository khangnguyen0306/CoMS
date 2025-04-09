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
    Tooltip
} from "antd";
import { PlusOutlined, EditFilled, DeleteFilled, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useCreatePartnerMutation, useEditPartnerMutation, useGetPartnerListQuery, useDeletePartnerMutation } from '../../services/PartnerAPI';
import { validationPatterns } from "../../utils/ultil";
import { useSelector } from "react-redux";
import partnerIMG from "../../assets/Image/partner.jpg"
const { Link } = Typography;
const { Search } = Input;

const ManagePartner = () => {
    const navigate = useNavigate();
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [searchText, setSearchText] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const { data: partnerData, isLoading: isFetching, error: fetchError, refetch } = useGetPartnerListQuery({
        keyword: searchQuery,
        page: currentPage - 1,
        size: pageSize,
    });

    const [CreatePartner, { isCreating }] = useCreatePartnerMutation();
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
            const result = await CreatePartner(newPartnerData).unwrap();
            if (result.status === "CREATED") {
                message.success('Thêm mới thành công!');
                refetch();
                setIsModalVisible(false);
                form.resetFields();
                setBankAccounts([{ bankName: '', backAccountNumber: '' }]);
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
                    console.log(result);
                    if (result.error.originalStatus == 200) {
                        refetch();
                        message.success('Xóa thành công');
                    } else
                        if (result.error.data == "Kh�ng th? x�a ??i t�c v� ?ang trong h?p ??ng ?ang ho?t ??ng. Vui l�ng t?o ph? l?c thay th?.") {
                            message.error('Không thể xóa đối tác vì đang trong hợp đồng đang hoạt động. Vui lòng tạo phụ lục thay thế.');
                        }

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
            const result = await EditPartner({ ...updatedPartnerData, id: editingPartner.partyId });
            console.log(result);
            if (result.data.status === "OK") {
                message.success('Cập nhật thành công!');
                refetch();
                setIsModalVisible(false);
                form.resetFields();
                setBankAccounts([{ bankName: '', backAccountNumber: '' }]);
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

        {
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
        },
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

    return (
        <div className="min-h-[100vh]   -full">
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
                                        setCurrentPage(1);
                                    }}
                                >
                                    <Space style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                                        {/* <img
                                            src={item.img || partnerIMG}
                                            alt={item.partnerName}
                                            style={{ width: 30, height: 30, borderRadius: '50%' }}
                                        /> */}
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
                        }}
                        onSearch={(value) => {
                            setSearchQuery(value);
                            setCurrentPage(1);
                        }}
                        style={{ width: 350 }}
                    />
                </Dropdown>
                <Button type="primary" icon={<PlusOutlined />} onClick={showModal}>
                    Tạo khách hàng mới
                </Button>
            </div>



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
            <Modal
                className="w-full"
                title={editingPartner ? "Chỉnh sửa khách hàng" : "Tạo khách hàng Mới"}
                open={isModalVisible}
                okText={editingPartner ? "Chỉnh sửa khách hàng" : "Tạo khách hàng Mới"}
                onOk={editingPartner ? handleEditOk : handleOk}
                onCancel={handleCancel}
                cancelText={"Hủy"}
                loading={isCreating || isEditing}

            >
                <Form form={form} layout="vertical" className="w-full">
                    {/* Các trường chung được chia thành 2 cột */}
                    <Row gutter={16} className="w-full">
                        <Col xs={24} md={12}>
                            <Form.Item name="partyId" style={{ display: 'none' }} />
                            <Form.Item
                                name="partnerType"
                                label="Loại đối tác"
                                rules={[{ required: true, message: "Vui lòng chọn loại đối tác" }]}
                            >
                                <Select>
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
                                <Input onChange={handleNameChange} />
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
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="address"
                                label="Địa chỉ"
                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập địa chỉ" }]}
                            >
                                <Input />
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
                                <Input />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item
                                name="position"
                                label="Chức vụ người đại diện"
                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập chức vụ" }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="abbreviation"
                                label="Viết tắt của partner"
                                rules={[{ required: true, whitespace: true, message: "Viết tắt không được để trống" }]}
                            >
                                <Input />
                            </Form.Item>
                            <Form.Item
                                name="taxCode"
                                label="Mã số thuế"
                                rules={[{ required: true, whitespace: true, message: "Vui lòng nhập mã số thuế" }]}
                            >
                                <Input />
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
                                <Input />
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
        </div>
    );
};

export default ManagePartner;
