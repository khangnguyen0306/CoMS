import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGetContractDetailQuery } from '../../../services/ContractAPI';
import { useGetAppendixDetailQuery, useUpdateAppendixMutation } from '../../../services/AppendixAPI';
import { Button, Card, Checkbox, DatePicker, Divider, Drawer, Form, Input, InputNumber, message, Popover, Select, Skeleton, Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import RichTextEditor from 'reactjs-tiptap-editor';
import 'reactjs-tiptap-editor/style.css';
import 'katex/dist/katex.min.css'
import { TermsectionForAppendix } from '../../../config/TermsectionForAppendix';
import LazySelect from '../../../hooks/LazySelect';
import { DeleteFilled, EyeFilled, LeftOutlined, PlusOutlined } from '@ant-design/icons';
import { useLazyGetClauseManageQuery } from '../../../services/ClauseAPI';
import { numberToVietnamese } from '../../../utils/ConvertMoney';

import ModalAdd from "../../Contract/component/ModalAdd";
import { debounce } from 'lodash';
import { extensions } from '../../../utils/textEditor';
import { useSelector } from 'react-redux';
import { useGetAppendixCommentQuery } from '../../../services/ProcessAPI';
import { FaCommentDots } from 'react-icons/fa';

const EditAppendix = () => {
    const { contractId, appendixId } = useParams()
    const [form] = Form.useForm()
    const navigate = useNavigate()
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isAddClasueModalOpen, setIsAddClauseModalOpen] = useState(false);
    const [content, setContent] = useState('');
    const [contentSell, setContentSell] = useState('');
    const [selectedOthersTerms, setSelectedOthersTerms] = useState([]);
    const [contractExpiryDate, setContractExpiryDate] = useState(null);
    const [textValue, setTextValue] = useState("");
    const [adddClauseId, setIsAddClauseId] = useState(0);

    const { data: contractDetailData, isLoading: isLoadingContractDetail, refetch: refecthContractDetail } = useGetContractDetailQuery(contractId, { skip: !contractId });
    // console.log(contractDetailData)
    const { data: appendixData, isLoading: isLoadingAppendix, refetch } = useGetAppendixDetailQuery({ id: appendixId }, { skip: !appendixId });
    const [getGeneralTerms, { data: generalData, isLoading: loadingGenaral, refetch: refetchGenaral }] = useLazyGetClauseManageQuery();

    const [updateAppendix, { isLoading }] = useUpdateAppendixMutation()
    const { data: cmtData, isLoadingCommentAppendix, error } = useGetAppendixCommentQuery({ appendixId: appendixId }, { skip: !appendixId });
    console.log(cmtData)

    useEffect(() => {
        refetch(),
            refecthContractDetail();
    }, [appendixId, contractId])


    const loadDKKata = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 10 }).unwrap();
    };

    const handleOpenModalAddClause = (clauseId) => {
        setIsAddClauseModalOpen(true)
        setIsAddClauseId(clauseId)
    }

    const handleSelectChange = (newValues) => {
        form.setFieldsValue({ generalTerms: newValues });
    };

    const handleSelectOthersTermsChange = (newValues) => {
        form.setFieldsValue({ otherTerms: newValues });
    };

    const handleClauseCheckboxChange = (checkedValues) => {
        setSelectedOthersTerms(checkedValues);
        const currentFields = form.getFieldsValue();
        const newFields = {};

        checkedValues.forEach((value) => {
            newFields[value] = currentFields[value] || { Common: [], A: [], B: [] };
        });

        form.setFieldsValue({ ...currentFields, ...newFields });
    };

    const onFinish = async (values) => {
        try {
            // await form.validateFields();
            // Calculate total value of contract items
            const contractItems = form.getFieldValue('contractItems') || [];
            const totalContractItemsValue = contractItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

            // Calculate total value of payments
            const payments = form.getFieldValue('payments') || [];
            const totalPaymentsValue = payments.reduce((sum, payment) => sum + (Number(payment.amount) || 0), 0);

            // Check if totals match
            if (Math.abs(totalContractItemsValue - totalPaymentsValue) > 0.01) {
                message.error(`Tổng số tiền các hạng mục (${new Intl.NumberFormat('vi-VN').format(totalContractItemsValue)} VND) phải bằng tổng số tiền các đợt thanh toán (${new Intl.NumberFormat('vi-VN').format(totalPaymentsValue)} VND)!`);
                return;
            }

            const data = form.getFieldsValue(true);

            const additionalConfig = Object.keys(data)
                .filter(key => !isNaN(key))
                .reduce((acc, key) => {
                    const { A, B, Common } = data[key];
                    if (A.length > 0 || B.length > 0 || Common.length > 0) {
                        acc[key] = {
                            ...(A.length > 0 && { A: A.map(id => ({ id })) }),
                            ...(B.length > 0 && { B: B.map(id => ({ id })) }),
                            ...(Common.length > 0 && { Common: Common.map(id => ({ id })) }),
                        };
                    }
                    return acc;
                }, {});


            const appendixData = {
                ...values,
                ...(contractId ? { contractId } : {}),
                additionalConfig,
                content: data.content,
                contractContent: data.contractContent
            };

            console.log(appendixData);
            try {
                const result = await updateAppendix({ appendixId: appendixId, ...appendixData });
                if (result.error?.originalStatus === 200) {
                    message.success('Phụ lục đã được cập nhật thành công!');
                    navigate('/appendix');
                }
            } catch (error) {
                console.log(error)
                message.error(error?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau!');
            }
        } catch (errorInfo) {
            console.log(errorInfo);
            // const errorMessages = errorInfo.errorFields.map(field => field.errors[0]).join(' và ');
            // message.error(errorMessages);
        }
    };

    useEffect(() => {
        if (appendixData && contractDetailData) {
            // console.log(appendixData)
            setContent(appendixData?.data.contractContent || appendixData.data.content);
            setContentSell(appendixData?.data.content);
            setSelectedOthersTerms(appendixData?.data.additionalTerms?.map(term => term.original_term_id));
            setContractExpiryDate(contractDetailData?.data.expiryDate ? dayjs(new Date(
                contractDetailData.data.expiryDate[0],
                contractDetailData.data.expiryDate[1] - 1,
                contractDetailData.data.expiryDate[2],
                contractDetailData.data.expiryDate[3],
                contractDetailData.data.expiryDate[4]
            ))
                : null,);
            const totalValue = appendixData?.data.contractItems.reduce((sum, item) => sum + item.amount, 0);
            const payments = appendixData?.data.paymentSchedules.map(schedule => {
                return {
                    amount: schedule.amount,
                    paymentDate: schedule.paymentDate ? dayjs(new Date(
                        schedule.paymentDate[0],
                        schedule.paymentDate[1] - 1,
                        schedule.paymentDate[2],
                        schedule.paymentDate[3],
                        schedule.paymentDate[4]
                    ))
                        : null,
                    notifyPaymentDate: schedule.notifyPaymentDate ? dayjs(new Date(
                        schedule.notifyPaymentDate[0],
                        schedule.notifyPaymentDate[1] - 1,
                        schedule.notifyPaymentDate[2],
                        schedule.notifyPaymentDate[3],
                        schedule.notifyPaymentDate[4]
                    ))
                        : null,
                    paymentMethod: schedule.paymentMethod,
                };
            });
            form.setFieldsValue({
                extendDateRange: [
                    appendixData.data.extendContractDate ? dayjs(new Date(
                        appendixData.data?.extendContractDate[0],
                        appendixData.data?.extendContractDate[1] - 1,
                        appendixData.data?.extendContractDate[2],
                        appendixData.data?.extendContractDate[3],
                        appendixData.data?.extendContractDate[4]
                    ))
                        : null,
                    appendixData.data.contractExpirationDate ? dayjs(new Date(
                        appendixData.data?.contractExpirationDate[0],
                        appendixData.data?.contractExpirationDate[1] - 1,
                        appendixData.data?.contractExpirationDate[2],
                        appendixData.data?.contractExpirationDate[3],
                        appendixData.data?.contractExpirationDate[4]
                    ))
                        : null,
                ],
                extendContractDate: appendixData.data.extendContractDate ? dayjs(new Date(
                    appendixData.data?.extendContractDate[0],
                    appendixData.data?.extendContractDate[1] - 1,
                    appendixData.data?.extendContractDate[2],
                    appendixData.data?.extendContractDate[3],
                    appendixData.data?.extendContractDate[4]
                ))
                    : null,
                contractExpirationDate: appendixData.data.contractExpirationDate ? dayjs(new Date(
                    appendixData.data?.contractExpirationDate[0],
                    appendixData.data?.contractExpirationDate[1] - 1,
                    appendixData.data?.contractExpirationDate[2],
                    appendixData.data?.contractExpirationDate[3],
                    appendixData.data?.contractExpirationDate[4]
                ))
                    : null,
                contractItems: appendixData?.data.contractItems?.map((item, index) => ({
                    id: item.id,
                    amount: item.amount,
                    description: item.description,
                    itemOrder: item.itemOrder
                })) || [],
                totalValue,
                payments,
                title: appendixData.data.title,
                content: appendixData.data.content
            });

            const generalTerms = appendixData?.data.generalTerms.map(term => term.original_term_id);

            form.setFieldsValue({
                contractContent: appendixData?.data.contractContent,
                generalTerms,
                additionalTerms: appendixData?.data.additionalTerms?.map(term => term.original_term_id) || [],
                otherTerms: appendixData?.data.otherTerms?.map(term => term.original_term_id) || [],
                "1": {
                    A: appendixData?.data.additionalConfig?.["1"]?.A?.map(item => item.original_term_id) || [],
                    B: appendixData?.data.additionalConfig?.["1"]?.B?.map(item => item.original_term_id) || [],
                    Common: appendixData?.data.additionalConfig?.["1"]?.Common?.map(item => item.original_term_id) || []
                },
                "2": {
                    A: appendixData?.data.additionalConfig?.["2"]?.A?.map(item => item.original_term_id) || [],
                    B: appendixData?.data.additionalConfig?.["2"]?.B?.map(item => item.original_term_id) || [],
                    Common: appendixData?.data.additionalConfig?.["2"]?.Common?.map(item => item.original_term_id) || []
                },
                "3": {
                    A: appendixData?.data.additionalConfig?.["3"]?.A?.map(item => item.original_term_id) || [],
                    B: appendixData?.data.additionalConfig?.["3"]?.B?.map(item => item.original_term_id) || [],
                    Common: appendixData?.data.additionalConfig?.["3"]?.Common?.map(item => item.original_term_id) || []
                },
                "4": {
                    A: appendixData?.data.additionalConfig?.["4"]?.A?.map(item => item.original_term_id) || [],
                    B: appendixData?.data.additionalConfig?.["4"]?.B?.map(item => item.original_term_id) || [],
                    Common: appendixData?.data.additionalConfig?.["4"]?.Common?.map(item => item.original_term_id) || []
                },
                "5": {
                    A: appendixData?.data.additionalConfig?.["5"]?.A?.map(item => item.original_term_id) || [],
                    B: appendixData?.data.additionalConfig?.["5"]?.B?.map(item => item.original_term_id) || [],
                    Common: appendixData?.data.additionalConfig?.["5"]?.Common?.map(item => item.original_term_id) || []
                },
                "6": {
                    A: appendixData?.data.additionalConfig?.["6"]?.A?.map(item => item.original_term_id) || [],
                    B: appendixData?.data.additionalConfig?.["6"]?.B?.map(item => item.original_term_id) || [],
                    Common: appendixData?.data.additionalConfig?.["6"]?.Common?.map(item => item.original_term_id) || []
                },
                "7": {
                    A: appendixData?.data.additionalConfig?.["7"]?.A?.map(item => item.original_term_id) || [],
                    B: appendixData?.data.additionalConfig?.["7"]?.B?.map(item => item.original_term_id) || [],
                    Common: appendixData?.data.additionalConfig?.["7"]?.Common?.map(item => item.original_term_id) || []
                },
            });
        }
    }, [appendixData, form]);

    const handleTitleChange = (e) => {
        form.setFieldsValue({ title: e.target.value });
    };

    const onValueChange = useCallback(debounce((value) => {
        setContent(value);
        form.setFieldsValue({ contractContent: value });
    }, 100), []);

    const onValueSellChange = useCallback(debounce((value) => {
        setContentSell(value);
        form.setFieldsValue({ content: value });
    }, 100), []);

    useEffect(() => {
        const contractItems = form.getFieldValue('contractItems') || [];
        const totalValue = contractItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
        form.setFieldsValue({ totalValue });
    }, [form.getFieldValue('contractItems')]);

    const loadLegalData = async ({ page, size, keyword }) => {
        return getContractLegal({ page, size, keyword }).unwrap();
    };

    const loadDKBSData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 1, order: 'desc' }).unwrap();
    };

    const loadQVNVCBData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 2, order: 'desc' }).unwrap();
    };

    const loadBHVBTData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 3, order: 'desc' }).unwrap();
    };

    const loadVPBTTHData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 4, order: 'desc' }).unwrap();
    };

    const loadCDHDData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 5, order: 'desc' }).unwrap();
    };

    const loadGQTCData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 6, order: 'desc' }).unwrap();
    };

    const loadBMData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 7, order: 'desc' }).unwrap();
    };

    const loadGenaralData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 9, order: 'desc' }).unwrap();
    };

    const termConfigs = {
        "1": { title: "ĐIỀU KHOẢN BỔ SUNG", loadData: loadDKBSData },
        "2": { title: "QUYỀN VÀ NGHĨA VỤ CÁC BÊN", loadData: loadQVNVCBData },
        "3": { title: "ĐIỀU KHOẢN BẢO HÀNH VÀ BẢO TRÌ", loadData: loadBHVBTData },
        "4": { title: "ĐIỀU KHOẢN VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI", loadData: loadVPBTTHData },
        "5": { title: "ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG", loadData: loadCDHDData },
        "6": { title: "ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP", loadData: loadGQTCData },
        "7": { title: "ĐIỀU KHOẢN BẢO MẬT", loadData: loadBMData },
    };


    const columns = [
        {
            title: 'STT',
            dataIndex: 'index',
            key: 'index',
            render: (text, record, index) => index + 1,
        },
        {
            title: 'Nội dung',
            dataIndex: 'description',
            key: 'description',
            render: (text, record, index) => (
                <Form.Item
                    name={[index, 'description']}
                    rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập nội dung' }]}
                    noStyle
                >
                    <Input.TextArea placeholder="Nhập nội dung" rows={2} />
                </Form.Item>

            ),
        },
        {
            title: 'Giá tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (text, record, index) => (
                <Form.Item
                    name={[index, 'amount']}
                    rules={[
                        { required: true, message: 'Vui lòng nhập giá tiền' },

                    ]}

                    noStyle
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="Nhập giá tiền"
                        min={0}
                        max={100000000000}
                        onChange={(value) => {
                            if (value > 100000000000) {
                                message.warning('Giá tiền không được vượt quá 100 tỷ');
                            }
                        }}
                        formatter={(value) =>
                            value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫' : ''
                        }
                        parser={(value) => value.replace(/\D/g, '')}
                    />
                </Form.Item>
            ),
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (text, record, index) => (
                <Button type="primary" onClick={() => remove(index)} danger>
                    <DeleteFilled />
                </Button>
            ),
        },
    ];

    const showDrawer = () => {
        setDrawerVisible(true);
    };
    const closeDrawer = () => {
        setDrawerVisible(false);
    };

    const handleChange = (value) => {
        if (value) {
            setTextValue(numberToVietnamese(value));
        } else {
            setTextValue("");
        }
    };
    const formatDate = (date) => {
        if (!date) return null;

        if (Array.isArray(date)) {
            const [year, month, day, hour, minute, second] = date;
            return dayjs(new Date(year, month - 1, day, hour, minute, second)).format("DD-MM-YYYY hh:mm:ss");
        }
        return dayjs(date).format("DD-MM-YYYY hh:mm:ss");
    };

    if (isLoadingAppendix || isLoadingContractDetail || isLoadingCommentAppendix) {
        return (
            <div className='flex justify-center items-center min-h-[100vh]'><Skeleton active /></div>
        )
    }
    else


        return (
            <div className='min-h-[100vh]'>
                <p className='font-bold text-[34px] text-center mb-10 text-transparent bg-custom-gradient bg-clip-text' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                    CHỈNH SỬA PHỤ LỤC
                </p>
                {cmtData?.data[0] && (
                    <div className="fixed top-20 right-4 z-50">
                        <Button
                            className={`w-fit h-fit py-1 border-[#00a6ff] ${!isDarkMode ? "bg-[#e6f7ff]" : null}`}
                            onClick={showDrawer}>
                            <p className="flex justify-center items-center py-2"><LeftOutlined style={{ fontSize: 20 }} />
                                <FaCommentDots style={{ fontSize: 30, marginLeft: 10, color: '#00a6ff' }} />
                            </p>
                        </Button>
                    </div>
                )}
                <Form
                    form={form}
                    onFinishFailed={(errorInfo) => {
                        console.log(errorInfo);
                        const errorMessages = errorInfo.errorFields.map(field => field.errors[0]).join(' và ');
                        message.error(errorMessages);
                    }}
                    layout="vertical"
                    onFinish={onFinish}
                    onValuesChange={(changedValues, allValues) => {
                        if (changedValues.contractItems) {
                            console.log(changedValues.contractItems)
                            const total = (allValues.contractItems || []).reduce(
                                (sum, item) => sum + (item.amount || 0),
                                0
                            );
                            handleChange(total)
                            form.setFieldsValue({ totalValue: total });
                        }
                    }}
                    initialValues={{
                        contractItems: [{ description: '', amount: null }],
                    }}
                >
                    <Form.Item
                        label="Tên Phụ Lục"
                        name="title"
                        rules={[{ required: true, whitespace: true, message: 'Vui lòng nhập tên phụ lục!' }]}
                    >
                        <Input
                            placeholder="Nhập tên phụ lục"
                            onChange={handleTitleChange}
                        />
                    </Form.Item>

                    {form.getFieldValue('extendDateRange') && form.getFieldValue('extendContractDate') && form.getFieldValue('contractExpirationDate') && (
                        <>
                            <Form.Item
                                label="Thời gian gia hạn hợp đồng"
                                name="extendDateRange"
                                rules={[
                                    { required: true, message: 'Vui lòng chọn thời gian gia hạn hợp đồng!' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || value.length !== 2) {
                                                return Promise.resolve();
                                            }
                                            const [startDate, endDate] = value;
                                            if (endDate.isBefore(startDate)) {
                                                return Promise.reject(new Error('Ngày kết thúc gia hạn phải sau ngày bắt đầu!'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <DatePicker.RangePicker
                                    className="w-full"
                                    showTime={{ format: 'HH:mm' }}
                                    format="DD/MM/YYYY HH:mm"
                                    placeholder={["Ngày bắt đầu gia hạn", "Ngày kết thúc gia hạn"]}
                                    disabledDate={(current) => {
                                        if (!current) return false;

                                        const today = dayjs().startOf('day');
                                        if (current < today) return true;

                                        if (!contractExpiryDate) return false;

                                        const nextDay = contractExpiryDate.startOf('day');
                                        const expiredDate = contractDetailData.data.expiryDate ? dayjs(new Date(
                                            contractDetailData.data?.expiryDate[0],
                                            contractDetailData.data?.expiryDate[1] - 1,
                                            contractDetailData.data?.expiryDate[2],
                                            contractDetailData.data?.expiryDate[3],
                                            contractDetailData.data?.expiryDate[4]
                                        )) : null;

                                        return current < nextDay || (expiredDate && current < expiredDate);
                                    }}

                                    onChange={(dates) => {
                                        if (dates) {
                                            form.setFieldsValue({
                                                extendContractDate: dates[0],
                                                contractExpirationDate: dates[1],
                                            });
                                        } else {
                                            form.setFieldsValue({
                                                extendContractDate: null,
                                                contractExpirationDate: null,
                                            });
                                        }
                                    }}
                                />
                            </Form.Item>
                            <Form.Item name="extendContractDate" hidden rules={[{ required: true, message: "Vui lòng chọn ngày bắt đầu gia hạn!" }]} />
                            <Form.Item name="contractExpirationDate" hidden rules={[{ required: true, message: "Vui lòng chọn ngày kết thúc gia hạn!" }]} />
                        </>
                    )}
                    {form.getFieldValue('contractContent') && (
                        <Form.Item
                            label=" Soạn thảo nội dung"
                            name="contractContent"
                            className="mt-5"
                            rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung!" }]}
                        >
                            <RichTextEditor
                                output="html"
                                content={content}
                                onChangeContent={onValueChange}
                                extensions={extensions}
                                dark={isDarkMode}
                                hideBubble={true}
                                dense={false}
                                removeDefaultWrapper
                                placeholder="Nhập nội dung tại đây..."
                                contentClass="max-h-[400px] overflow-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-track]:bg-gray-200"
                            />
                        </Form.Item>
                    )}

                    {form.getFieldValue('content') && (
                        <Form.Item
                            label=" Soạn thảo nội dung thanh lý"
                            name="content"
                            className="mt-5"
                            rules={[{ required: true, whitespace: true, message: "Vui lòng nhập nội dung thanh lý!" }]}
                        >
                            <RichTextEditor
                                output="html"
                                content={contentSell}
                                onChangeContent={onValueSellChange}
                                extensions={extensions}
                                dark={isDarkMode}
                                hideBubble={true}
                                dense={false}
                                removeDefaultWrapper
                                placeholder="Nhập nội dung thanh lý tại đây..."
                                contentClass="max-h-[400px] overflow-auto [&::-webkit-scrollbar]:hidden hover:[&::-webkit-scrollbar]:block [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-500 [&::-webkit-scrollbar-track]:bg-gray-200"
                            />
                        </Form.Item>
                    )}

                    {form.getFieldValue('contractItems') && form.getFieldValue('contractItems').length > 0 && form.getFieldValue('payments') && form.getFieldValue('payments').length > 0 && (
                        <>
                            < Divider orientation="center" className="text-lg">Hạng mục thanh toán</Divider>
                            <Form.List
                                name="contractItems"
                                rules={[
                                    {
                                        validator: async (_, contractItems) => {
                                            if (!contractItems || contractItems.length < 1) {
                                                return Promise.reject(new Error('Phải có ít nhất một hạng mục'));
                                            }
                                        },
                                    },
                                ]}
                            >
                                {(fields, { add, remove }) => {
                                    window.remove = remove;
                                    return (
                                        <>
                                            <Table
                                                dataSource={fields}
                                                columns={columns}
                                                pagination={false}
                                                rowKey={(record) => record.key}
                                            />
                                            <Button type="primary" onClick={() => add()} style={{ marginTop: 16 }}>
                                                <PlusOutlined /> Thêm hạng mục
                                            </Button>
                                        </>
                                    );
                                }}
                            </Form.List>

                            <div className="mt-4    ">
                                <Form.Item name="totalValue" label="Tổng giá trị hợp đồng">
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        readOnly
                                        formatter={(value) =>
                                            value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫' : ''
                                        }
                                    />
                                </Form.Item>
                                {textValue && (
                                    <div className="mt-1 ml-1" >
                                        <Typography.Text type="secondary">
                                            (Bằng chữ: <span className="font-bold">{textValue}</span>)
                                        </Typography.Text>
                                    </div>
                                )}
                            </div>

                            <Divider orientation="center">Thanh toán</Divider>
                            <Form.List
                                name="payments"
                                rules={[
                                    {
                                        validator: async (_, payments) => {
                                            // if (!payments || payments.length < 1) {
                                            //     return Promise.reject(new Error('Vui lòng thêm ít nhất một đợt thanh toán!'));
                                            // }

                                            const totalValue = form.getFieldValue('totalValue');
                                            if (!totalValue) {
                                                return Promise.reject(new Error('Vui lòng nhập các hạng mục thanh toán trước!'));
                                            }

                                            const totalPayments = payments.reduce((sum, payment) => {
                                                return sum + (Number(payment.amount) || 0);
                                            }, 0);

                                            if (Math.abs(totalPayments - totalValue) > 0.01) {
                                                return Promise.reject(
                                                    new Error(
                                                        `Tổng số tiền các đợt thanh toán (${new Intl.NumberFormat('vi-VN').format(totalPayments)} VND) phải bằng tổng giá trị hợp đồng (${new Intl.NumberFormat('vi-VN').format(totalValue)} VND)!`
                                                    )
                                                );
                                            }
                                        },
                                    },
                                ]}
                            >
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }) => (
                                            <Space key={key} align="baseline" className="flex mb-4 items-center w-full">
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "amount"]}
                                                    rules={[{ required: true, message: "Nhập số tiền thanh toán" }]}
                                                >
                                                    <InputNumber
                                                        style={{ width: "100%" }}
                                                        placeholder="Số tiền"
                                                        min={0}
                                                        formatter={(value) =>
                                                            value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' ₫' : ''
                                                        }
                                                        parser={(value) => value.replace(/\D/g, '')}
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "paymentDate"]}
                                                    rules={[
                                                        { required: true, message: "Chọn ngày thanh toán" },
                                                        {
                                                            validator: (_, value) => {
                                                                const extendStart = form.getFieldValue("extendContractDate");
                                                                const extendEnd = form.getFieldValue("contractExpirationDate");

                                                                // Nếu chưa chọn thời gian gia hạn hoặc ngày thanh toán, không kiểm tra
                                                                if (!extendStart || !extendEnd || !value) {
                                                                    return Promise.resolve();
                                                                }

                                                                // Kiểm tra xem ngày thanh toán có nằm trong khoảng thời gian gia hạn hay không
                                                                if (value.isBefore(extendStart) || value.isAfter(extendEnd)) {
                                                                    return Promise.reject(new Error("Ngày thanh toán phải nằm trong thời gian gia hạn"));
                                                                }

                                                                return Promise.resolve();
                                                            },
                                                        },
                                                    ]}
                                                >
                                                    <DatePicker
                                                        style={{ width: 150 }}
                                                        placeholder="Ngày thanh toán"
                                                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                                                        format="DD/MM/YYYY"
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "notifyPaymentDate"]}
                                                    rules={[
                                                        { required: true, message: "Chọn ngày thông báo thanh toán" },
                                                        {
                                                            validator: (_, value) => {
                                                                const extendStart = form.getFieldValue("extendContractDate");
                                                                const extendEnd = form.getFieldValue("contractExpirationDate");
                                                                const paymentDate = form.getFieldValue(["payments", name, "paymentDate"]);

                                                                // Skip validation if the date or extension period is not set
                                                                if (!value || !extendStart || !extendEnd) {
                                                                    return Promise.resolve();
                                                                }

                                                                // Check if notifyPaymentDate is within the extension period
                                                                if (value.isBefore(extendStart) || value.isAfter(extendEnd)) {
                                                                    return Promise.reject(new Error("Ngày thông báo thanh toán phải nằm trong thời gian gia hạn"));
                                                                }

                                                                // Check if notifyPaymentDate is before paymentDate (if set)
                                                                if (paymentDate && !(value.isBefore(paymentDate) || value.isSame(paymentDate))) {
                                                                    return Promise.reject(new Error("Ngày thông báo thanh toán phải trước hoặc cùng ngày với ngày thanh toán"));
                                                                }

                                                                return Promise.resolve();
                                                            },
                                                            // Re-validate when these fields change
                                                            dependencies: ["extendContractDate", "contractExpirationDate", ["payments", name, "paymentDate"]],
                                                        },
                                                    ]}
                                                >
                                                    <DatePicker
                                                        style={{ width: 150 }}
                                                        showTime
                                                        placeholder="Ngày thông báo thanh toán"
                                                        disabledDate={(current) => current && current < dayjs().startOf('day')}
                                                        format="DD/MM/YYYY"
                                                    />
                                                </Form.Item>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, "paymentMethod"]}
                                                    rules={[{ required: true, message: "Chọn phương thức thanh toán" }]}
                                                >
                                                    <Select placeholder="Phương thức thanh toán" style={{ width: 200 }}>
                                                        <Option value="transfer">Chuyển khoản</Option>
                                                        <Option value="cash">Tiền mặt</Option>
                                                        <Option value="creditCard">Thẻ tín dụng</Option>
                                                    </Select>
                                                </Form.Item>
                                                <Form.Item>
                                                    <Button type="primary" onClick={() => remove(name)} danger>
                                                        <DeleteFilled />
                                                    </Button>
                                                </Form.Item>
                                            </Space>
                                        ))}
                                        <Button icon={<PlusOutlined />} type="primary" onClick={() => add()} block>
                                            Thêm đợt thanh toán
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </>
                    )}

                    {form.getFieldValue('generalTerms') && form.getFieldValue('generalTerms').length > 0 &&
                        form.getFieldValue('additionalTerms') && form.getFieldValue('additionalTerms').length > 0 && (
                            <>
                                <Divider orientation="center" className="text-lg">Điều khoản & Cam kết</Divider>
                                <div className="ml-2 my-3">
                                    <p className="font-bold text-[16px] mb-1">Điều khoản chung</p>
                                    <p>Mô tả: (Điều khoản được áp dụng cho cả 2 bên)</p>
                                </div>
                                <Form.Item
                                    label={<div className="flex justify-between items-center gap-4">
                                        <p>Điều khoản chung</p>
                                        <Popover
                                            // content={() => getTermsContent('generalTerms')}
                                            title="Danh sách Điều khoản chung đã chọn"
                                            trigger="hover"
                                            placement="right"
                                        >
                                            <Button icon={<EyeFilled />} />
                                        </Popover>
                                    </div>}
                                    name="generalTerms"
                                    rules={[{ required: true, message: "Vui lòng chọn điều khoản chung!" }]}
                                    className="ml-2"
                                >
                                    <LazySelect
                                        loadDataCallback={loadGenaralData}
                                        options={generalData?.data.content}
                                        showSearch
                                        mode="multiple"
                                        placeholder="Chọn điều khoản chung"
                                        onChange={handleSelectChange}
                                        dropdownRender={(menu) => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: "8px 0" }} />
                                                <Space style={{ padding: "0 8px 4px" }} onClick={() => handleOpenModalAddClause(9)}>
                                                    <Button type="primary" icon={<PlusOutlined />}>Thêm điều khoản</Button>
                                                </Space>
                                            </>
                                        )}
                                    />
                                </Form.Item>

                                <Form.Item
                                    label={<div className="ml-2 my-3 font-bold text-[16px] flex justify-between items-center gap-5">
                                        <p>Các điều khoản khác</p>
                                    </div>}
                                    name="additionalTerms"
                                >
                                    <Checkbox.Group
                                        className="flex flex-col ml-4 gap-4"
                                        options={[
                                            { label: "ĐIỀU KHOẢN BỔ SUNG", value: 1 },
                                            { label: "QUYỀN VÀ NGHĨA VỤ CÁC BÊN", value: 2 },
                                            { label: "ĐIỀN KHOẢN BẢO HÀNH VÀ BẢO TRÌ", value: 3 },
                                            { label: "ĐIỀU KHOẢN VỀ VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI", value: 4 },
                                            { label: "ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG", value: 5 },
                                            { label: "ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP", value: 6 },
                                            { label: "ĐIỀU KHOẢN BẢO MẬT", value: 7 }
                                        ]}
                                        onChange={handleClauseCheckboxChange}
                                    />
                                </Form.Item>

                                <div className="flex flex-col">
                                    {selectedOthersTerms.map(termId => (
                                        <TermsectionForAppendix
                                            key={termId}
                                            termId={termId}
                                            title={termConfigs[termId].title}
                                            form={form}
                                            loadDataCallback={termConfigs[termId].loadData}
                                        />
                                    ))}
                                </div>

                                <Divider orientation="center">Điều khoản khác</Divider>
                                <Form.Item
                                    label={
                                        <div className="flex justify-between items-center gap-4">
                                            <p>Điều khoản khác </p>
                                            {/* <Popover
                                                content={() => getTermsContent('generalTerms')}
                                                title="Danh sách Điều khoản chung đã chọn"
                                                trigger="hover"
                                                placement="right"
                                            >
                                                <Button icon={<EyeFilled />} />
                                            </Popover> */}
                                        </div>
                                    }
                                    name="otherTerms"
                                    // rules={[{ required: true, message: "Vui lòng chọn điều khoản khác!" }]}
                                    className="ml-2"
                                >
                                    <LazySelect
                                        loadDataCallback={loadDKKata}
                                        options={generalData?.data.content}
                                        showSearch
                                        mode="multiple"
                                        placeholder="Chọn điều khoản khác"
                                        onChange={handleSelectOthersTermsChange}
                                        dropdownRender={(menu) => (
                                            <>
                                                {menu}
                                                <Divider style={{ margin: "8px 0" }} />
                                                <Space style={{ padding: "0 8px 4px" }}>
                                                    <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModalAddClause(10)}>
                                                        Thêm điều khoản
                                                    </Button>
                                                </Space>
                                            </>
                                        )}
                                    />
                                </Form.Item>
                                {/* <Form.Item
                                label={<div className="ml-2 my-3">
                                    <p className="font-bold text-[16px]">ĐIỀU KHOẢN ĐẶC BIỆT BÊN A</p>
                                    <p>Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên A)</p>
                                </div>}
                                name="specialTermsA"
                            >
                                <TextArea rows={4} placeholder="Nhập điều khoản bên A" />
                            </Form.Item>

                            <Form.Item
                                label={<div className="ml-2 my-3">
                                    <p className="font-bold text-[16px]">ĐIỀU KHOẢN ĐẶC BIỆT BÊN B</p>
                                    <p>Mô tả: (Điều khoản được áp dụng cho chỉ riêng bên B)</p>
                                </div>}
                                name="specialTermsB"
                            >
                                <TextArea rows={4} placeholder="Nhập điều khoản bên B" />
                            </Form.Item> */}
                            </>
                        )}
                    <Form.Item className="text-center mt-5">
                        <Button type="primary" htmlType="submit" className="w-1/2 " loading={isLoading}>
                            {/* <Button type="primary" htmlType="submit" className="w-1/2 " loading={LoadingUpdate}> */}
                            Cập Nhật Phụ Lục
                        </Button>
                    </Form.Item>
                </Form>


                <Drawer
                    title="Bình luận phụ lục hợp đồng"
                    placement="right"
                    loading={isLoadingCommentAppendix}
                    onClose={closeDrawer}
                    open={drawerVisible}
                    width={600}
                >
                    <div className="p-4 min-h-full">
                        {cmtData?.data ? (
                            cmtData?.data?.map((cmt, index) => (
                                <div className=" rounded-md ">
                                    <div className="font-semibold  text-base mb-2">
                                        <p>{cmt.commenter}</p>
                                    </div>
                                    <div className="text-xs mb-4">
                                        {formatDate(cmt.commentedAt)}
                                    </div>
                                    <Card
                                        className="w-full min-h-3 resize-none shadow-lg"
                                        readOnly
                                    >
                                        {cmt.comment}
                                    </Card>
                                </div>
                            ))
                        ) : (
                            <p className="">Không có bình luận nào</p>
                        )}
                    </div>
                </Drawer>

                <ModalAdd
                    clauseId={adddClauseId}
                    isModalAddOpen={isAddClasueModalOpen}
                    closeModalAdd={() => setIsAddClauseModalOpen(false)}
                    callBackCallAPI={adddClauseId == 9 ? () => loadGenaralData({ page: 0, size: 10 }) : () => loadDKKata({ page: 0, size: 10 })}
                />
            </div >
        )
}

export default EditAppendix