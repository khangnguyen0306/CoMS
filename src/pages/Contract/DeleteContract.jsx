// chưa gắn id để gọi template details, search BE, chưa phân trang 
import React, { useEffect, useState } from 'react';
import { Input, Button, Modal, List, Select, message, Skeleton, Card, Empty, Image, Pagination, Row, Col, Spin } from 'antd';
import 'tailwindcss/tailwind.css';
import { DeleteFilled, RedoOutlined } from '@ant-design/icons';
import TrashIcon from '../../assets/Image/delete.svg'
import { useDeleteContractMutation, useGetAllContractQuery, useGetContractDetailQuery, useReStoreContractMutation } from '../../services/ContractAPI';
import { useLazyGetTermDetailQuery } from '../../services/ClauseAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { numberToVietnamese } from '../../utils/ConvertMoney';

const { Option } = Select;
const { Search } = Input;
const DeletedContract = () => {
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [queryParams, setQueryParams] = useState({
        page: 0,
        size: 10,
        keyword: '',
        status: "DELETED",
    });
    const [allContractTypes, setAllContractTypes] = useState([]);
    const [visible, setVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const { data: contractData, isLoading: loadingTemplate, isError: DataError, refetch } = useGetAllContractQuery(queryParams);
    const { data: contractDetail, isLoading: isLoadingcontractDetail, isError: isErrorcontractDetail } =
        useGetContractDetailQuery(selectedContract, { skip: !selectedContract });
    const [fetchTerms] = useLazyGetTermDetailQuery();

    // console.log('contractDetail', contractDetail?.data)
    const [deleteContract] = useDeleteContractMutation()
    const [restoreContract, { isLoading: loadingRestore }] = useReStoreContractMutation()

    const [termsData, setTermsData] = useState({});
    const [loadingTerms, setLoadingTerms] = useState({})
    const [groupedTerms, setGroupedTerms] = useState({
        Common: [],
        A: [],
        B: []
    });

    useEffect(() => {
        if (contractData?.data?.content) {
            const newTypes = contractData.data.content.map(contract => ({
                id: contract.contractType.id,
                name: contract.contractType.name,
            }));
            setAllContractTypes(prevTypes => {
                const existingIds = new Set(prevTypes.map(type => type.id));
                const uniqueNewTypes = newTypes.filter(type => !existingIds.has(type.id));
                return [...prevTypes, ...uniqueNewTypes];
            });
        }
    }, [contractData]);

    const handleTypeChange = (value) => {
        setQueryParams(prev => {
            const updatedParams = { ...prev, type: value || null, page: 0 };
            console.log('Updated Query Params:', updatedParams);
            return updatedParams;
        });
    };

    useEffect(() => {
        refetch();
    }, [queryParams]);

    const handleSearch = (value) => {
        setQueryParams(prev => ({ ...prev, keyword: value, page: 0 }));
    };

    const showModal = (contract) => {
        setSelectedContract(contract.id);
        setVisible(true);
    };

    const handleRestore = async (templateId) => {
        try {
            const result = await restoreContract(templateId).unwrap()
            if (result.status === "OK") {
                message.success('Khôi phục thành công');
                setVisible(false);
            }

        } catch (error) {
            console.error(error);
            message.error(error.message);
        }

    };

    const handleDelete = (contractId) => {
        Modal.confirm({
            title: 'Bạn có chắc muốn xóa vĩnh viễn hợp đồng này không?',
            onOk: () => {
                deleteContract(contractId).unwrap();
                message.success('Xóa thành công');
                setVisible(false);
            },
        });
    };
    const loadTermDetail = async (termId) => {
        if (!termsData[termId]) {
            setLoadingTerms((prev) => ({ ...prev, [termId]: true }));
            try {
                const response = await fetchTerms(termId).unwrap();
                setTermsData((prev) => ({
                    ...prev,
                    [termId]: response.data
                }));
            } catch (error) {
                console.error(`Error loading term ${termId}:`, error);
            } finally {
                setLoadingTerms((prev) => ({ ...prev, [termId]: false }));
            }
        } else {
            setLoadingTerms((prev) => ({ ...prev, [termId]: false }));
        }
    };

    // Tải chi tiết các căn cứ pháp lý (legal_basis_terms là mảng object có trường original_term_id)
    useEffect(() => {
        if (contractDetail?.data?.legalBasisTerms) {
            contractDetail.data.legalBasisTerms.forEach((termObj) => {
                loadTermDetail(termObj.original_term_id);
            });
        }
    }, [contractDetail?.data?.legalBasisTerms]);

    // Nhóm các điều khoản từ additional_config
    useEffect(() => {
        if (contractDetail?.data?.additionalConfig) {
            const allGrouped = { Common: [], A: [], B: [] };
            // additionalConfig là object với các key (ví dụ: "1") chứa object với mảng Common, A, B
            Object.values(contractDetail.data.additionalConfig).forEach((config) => {
                if (config.Common && config.Common.length > 0) {
                    config.Common.forEach((termObj) => {
                        allGrouped.Common.push(termObj.original_term_id);
                    });
                }
                if (config.A && config.A.length > 0) {
                    config.A.forEach((termObj) => {
                        allGrouped.A.push(termObj.original_term_id);
                    });
                }
                if (config.B && config.B.length > 0) {
                    config.B.forEach((termObj) => {
                        allGrouped.B.push(termObj.original_term_id);
                    });
                }
            });
            // Loại bỏ trùng lặp
            allGrouped.A = [...new Set(allGrouped.A)];
            allGrouped.B = [...new Set(allGrouped.B)];
            setGroupedTerms(allGrouped);

            // Tải chi tiết cho các điều khoản bổ sung (bao gồm cả additional_terms)
            const additionalTermsIds =
                contractDetail?.data?.additional_terms?.map((termObj) => termObj.original_term_id) || [];
            const allTermIds = [
                ...allGrouped.Common,
                ...allGrouped.A,
                ...allGrouped.B,
                ...additionalTermsIds
            ];
            [...new Set(allTermIds)].forEach((termId) => {
                loadTermDetail(termId);
            });
        }
    }, [contractDetail?.data]);

    // Render các căn cứ pháp lý
    const renderLegalBasisTerms = () => {
        if (!contractDetail?.data?.legalBasisTerms || contractDetail.data.legalBasisTerms.length === 0) {
            return <p>Chưa có căn cứ pháp lý nào được chọn.</p>;
        }
        return contractDetail.data.legalBasisTerms.map((termObj, index) => {
            const termDetail = termsData[termObj.original_term_id];
            if (!termDetail) {
                return (
                    <div key={termObj.original_term_id} className="term-item p-1">
                        <Spin size="small" />
                    </div>
                );
            }
            return (
                <p key={index}>
                    <i>- {termDetail.value || termObj.label}</i>
                </p>
            );
        });
    };

    // Render một điều khoản (cho cả nhóm A và B)
    const renderTerm = (termId, index) => {
        if (loadingTerms[termId]) {
            return (
                <div key={termId} className="term-item p-1">
                    <Spin size="small" />
                </div>
            );
        }
        const termDetail = termsData[termId];
        if (!termDetail) return null;
        return (
            <div key={termId} className="term-item p-1">
                <div className="term-content">
                    <p>{index + 1}. {termDetail.value}</p>
                </div>
            </div>
        );
    };
    // Hàm chuyển mảng thành Date (lưu ý: month của Date là 0-indexed)
    const parseDate = (dateArray) => {
        if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
        const [year, month, day, hour, minute] = dateArray;
        return new Date(year, month - 1, day, hour, minute);
    };
    if (isLoadingcontractDetail) return <Skeleton active />;


    if (loadingTemplate) return (
        <div className='flex justify-center items-center min-h-[100vh]'>
            <Skeleton active />;
        </div>
    );
    if (DataError) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;
    return (
        <div className="p-4 min-h-[100vh]">
            <div className="font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent" style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                <div className="flex items-center gap-4">KHO LƯU TRỮ <Image className="mb-3" width={50} height={50} preview={false} src={TrashIcon} /></div>
            </div>
            <div className="flex w-3/5 gap-4">
                <Search
                    placeholder="Tìm kiếm tên hợp đồng"
                    onSearch={handleSearch}
                    enterButton="tìm kiếm"
                    allowClear
                    className="mb-4 max-w-[350px]"
                />
                <Select
                    placeholder="Chọn loại hợp đồng"
                    value={queryParams.type}
                    onChange={handleTypeChange}
                    className="mb-4 max-w-[250px] min-w-[170px]"
                    allowClear
                >
                    {allContractTypes.map((type, index) => (
                        <Option key={index} value={type.id}>
                            {type.name}
                        </Option>
                    ))}
                </Select>
            </div>
            <List
                itemLayout="horizontal"
                dataSource={contractData?.data.content || []}
                renderItem={contract => (
                    <List.Item
                        onClick={() => showModal(contract)}
                        className="hover:shadow-lg rounded-md shadow-sm mb-2"
                        actions={[
                            <div className="flex flex-col justify-center gap-y-2">
                                <div className="flex gap-2">
                                    <Button type="primary" loading={loadingRestore} icon={<RedoOutlined />} onClick={(e) => { e.stopPropagation(); handleRestore(contract.id); }}>
                                        Khôi phục
                                    </Button>
                                    <Button danger type="primary" onClick={(e) => { e.stopPropagation(); handleDelete(contract.id); }}>
                                        <DeleteFilled />
                                    </Button>
                                </div>
                                <p>Xóa {dayjs().diff(dayjs(contract.deletionDate), 'day') === 0 ? 'hôm nay' : `${dayjs().diff(dayjs(contract.deletionDate), 'day')} ngày trước`}</p>
                            </div>,
                        ]}
                    >
                        <div className='w-full'>

                            <List.Item.Meta
                                className="px-7 py-4"
                                title={<p className="font-bold text-[#2563eb] text-base">{contract.title}</p>}
                                description={`Loại: ${contract.contractType.name}`}
                            />
                        </div>
                    </List.Item>
                )}
            />
            <Pagination
                current={queryParams.page + 1}
                pageSize={queryParams.size}
                total={contractData?.data.totalElements || 0}
                onChange={(page, pageSize) => {
                    setQueryParams(prev => ({ ...prev, page: page - 1, size: pageSize }));
                }}
                showSizeChanger
                className="mt-4"
            />
            <Modal
                title={
                    <p className='flex justify-between'>Chi tiết hợp đồng <span className='mr-8'> (Người tạo : {contractDetail?.data.user.full_name})</span></p>
                }
                open={visible}
                onCancel={() => setVisible(false)}
                footer={false}
                loading={isLoadingcontractDetail}
                width="80%"
            >
                {selectedContract && (
                    <div className={`${isDarkMode ? 'bg-[#222222] text-white' : 'bg-gray-100'} shadow-md p-4 pb-16 rounded-md`}>
                        <div className="text-center">
                            <p className="font-bold text-xl pt-8">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                            <p className="font-bold text-lg mt-2">Độc lập - Tự do - Hạnh phúc</p>
                            <p>---------------------------------</p>
                            <p className='place-self-end mr-10'>
                                {contractDetail?.data.contractLocation}, Ngày {dayjs(parseDate(contractDetail?.data.createdAt)).format('DD')} Tháng {dayjs(parseDate(contractDetail?.data.createdAt)).format('MM')} năm {dayjs(parseDate(contractDetail?.data.createdAt)).format('YYYY')}
                            </p>
                            <p className="text-3xl font-bold mt-5">
                                {contractDetail?.data.title ? contractDetail?.data.title.toUpperCase() : ''}
                            </p>
                            <p className="mt-3 text-base">
                                <b>Số:</b> {contractDetail?.data.contractNumber}
                            </p>

                        </div>

                        <div className="px-4 flex pl-10 flex-col gap-2 mt-10">
                            {renderLegalBasisTerms()}
                        </div>

                        <Row gutter={16} className="flex flex-col mt-5 pl-10 gap-5" justify="center">
                            <Col className="flex flex-col gap-2" md={10} sm={24}>
                                <p className="font-bold text-lg"><u>BÊN CUNG CẤP (BÊN A)</u></p>
                                <p className="text-sm"><b>Tên công ty:</b> {contractDetail?.data?.partnerA.partnerName}</p>
                                <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {contractDetail?.data?.partnerA.partnerAddress}</p>
                                <p className="text-sm"><b>Người đại diện:</b> {contractDetail?.data?.partnerA.spokesmanName}</p>
                                <p className="text-sm"><b>Chức vụ:</b>{contractDetail?.data?.partnerA.position}</p>
                                <p className="text-sm"><b>Mã số thuế:</b> {contractDetail?.data?.partnerA.partnerTaxCode}</p>
                                <p className="text-sm"><b>Email:</b> {contractDetail?.data?.partnerA.partnerEmail}</p>
                            </Col>
                            <Col className="flex flex-col gap-2" md={10} sm={24}>
                                <p className="font-bold text-lg"><u>Bên thuê (Bên B)</u></p>
                                <p className="text-sm"><b>Tên công ty:</b> {contractDetail?.data?.partnerB.partnerName}</p>
                                <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {contractDetail?.data?.partnerB.partnerAddress}</p>
                                <p className="text-sm"><b>Người đại diện:</b> {contractDetail?.data?.partnerB.spokesmanName}</p>
                                <p className="text-sm"><b>Chức vụ:</b>{contractDetail?.data?.partnerB.position}</p>
                                <p className="text-sm"><b>Mã số thuế:</b> {contractDetail?.data?.partnerB.partnerTaxCode}</p>
                                <p className="text-sm"><b>Email:</b> {contractDetail?.data?.partnerB.partnerEmail}</p>
                            </Col>
                            <div className="pl-2">
                                <p>
                                    Sau khi bàn bạc và thống nhất, chúng tôi cùng thỏa thuận ký kết hợp đồng với nội dung và các điều khoản sau:
                                </p>
                                <p className="font-bold text-lg mt-4 mb-3"><u>NỘI DUNG HỢP ĐỒNG</u></p>
                                <div
                                    className="ml-1"
                                    dangerouslySetInnerHTML={{ __html: contractDetail?.data.contractContent || "Chưa nhập" }}
                                />
                                <div className="mt-4">
                                    <h4 className="font-bold text-lg"><u>GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</u></h4>
                                    <p className="mt-4">
                                        - Tổng giá trị hợp đồng: <b>{new Intl.NumberFormat('vi-VN').format(contractDetail?.data.amount)} VND</b>
                                        <span className="text-gray-600"> ( {numberToVietnamese(contractDetail?.data.amount)} )</span>
                                    </p>
                                    {contractDetail?.data?.payments && contractDetail?.data.payments.length > 0 && (
                                        <div className="mt-5 ml-2">
                                            <p className="font-bold text-base">
                                                Thanh toán qua {contractDetail?.data.payments.length} đợt:
                                            </p>
                                            {contractDetail?.data.payments.map((payment, index) => (
                                                <div key={index} className="mt-2 ml-6 flex flex-col gap-2">
                                                    <p><b>Đợt {index + 1}:</b></p>
                                                    <p>- <b>Số tiền:</b> {payment.amount.toLocaleString()} ₫</p>
                                                    <p>- <b>Ngày thanh toán:</b> {dayjs(payment.paymentDate).format('DD/MM/YYYY')}</p>
                                                    <p>
                                                        - <b>Phương thức thanh toán:</b> {payment.paymentMethod === 'cash'
                                                            ? 'Tiền mặt'
                                                            : payment.paymentMethod === 'creditCard'
                                                                ? 'Thẻ tín dụng'
                                                                : 'Chuyển khoản'}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div>
                                        {contractDetail?.data?.isDateLateChecked && (
                                            <p className="mt-3">
                                                - Trong quá trình thanh toán cho phép trễ hạn tối đa {contractDetail?.data.maxDateLate} (ngày)
                                            </p>
                                        )}
                                        {contractDetail?.data?.autoAddVAT && (
                                            <p className="mt-3">
                                                - Thuế VAT được tính ({contractDetail?.data.vatPercentage}%)
                                            </p>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        <h4 className="font-bold text-lg"><u>THỜI GIAN HIỆU LỰC LIÊN QUAN</u></h4>
                                        {contractDetail?.data?.effectiveDate && contractDetail?.data?.expiryDate && (
                                            <div className="mt-3">
                                                <p>
                                                    - Ngày bắt đầu hiệu lực: {dayjs(parseDate(contractDetail?.data.effectiveDate)).format('HH:mm')} ngày <b>{dayjs(parseDate(contractDetail?.data.effectiveDate)).format('DD/MM/YYYY')}</b>
                                                </p>
                                                <p>
                                                    - Ngày chấm dứt hiệu lực: {dayjs(parseDate(contractDetail?.data.expiryDate)).format('HH:mm')} ngày <b>{dayjs(parseDate(contractDetail?.data.expiryDate)).format('DD/MM/YYYY')}</b>
                                                </p>
                                            </div>
                                        )}
                                        {contractDetail?.data?.autoRenew && (
                                            <p className="mt-3">
                                                - Tự động gia hạn khi hợp đồng hết hạn nếu không có phản hồi từ các phía
                                            </p>
                                        )}
                                        {contractDetail?.data?.appendixEnabled && (
                                            <p className="mt-3">
                                                - Cho phép tạo phụ lục khi hợp đồng có hiệu lực
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <h4 className="font-bold text-lg mt-4"><u>CÁC LOẠI ĐIỀU KHOẢN</u></h4>
                                    <div className="ml-5 mt-3 flex flex-col gap-3">
                                        {groupedTerms.Common.length > 0 && (
                                            <div className="term-group mb-2">
                                                <p className="text-base font-bold">Điều khoản chung</p>
                                                {groupedTerms.Common.map((termId, index) => renderTerm(termId, index))}
                                            </div>
                                        )}
                                        {groupedTerms.A.length > 0 && (
                                            <div className="term-group mb-2">
                                                <p className="font-bold">Điều khoản riêng bên A</p>
                                                {groupedTerms.A.map((termId, index) => renderTerm(termId, index))}
                                                <p className="text-sm">- {contractDetail?.data.specialTermsA}</p>
                                            </div>
                                        )}
                                        {groupedTerms.B.length > 0 && (
                                            <div className="term-group mb-2">
                                                <p className="font-bold">Điều khoản riêng bên B</p>
                                                {groupedTerms.B.map((termId, index) => renderTerm(termId, index))}
                                                <p className="text-sm">- {contractDetail?.data.specialTermsB}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4">
                                        {(contractDetail?.data?.appendixEnabled ||
                                            contractDetail?.data?.transferEnabled ||
                                            contractDetail?.data?.violate ||
                                            contractDetail?.data?.suspend) && (
                                                <div>
                                                    <h4 className="font-bold text-lg"><u>CÁC THÔNG TIN KHÁC</u></h4>
                                                    {contractDetail?.data?.appendixEnabled && (
                                                        <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>
                                                    )}
                                                    {contractDetail?.data?.transferEnabled && (
                                                        <p className="mt-3">- Cho phép chuyển nhượng hợp đồng</p>
                                                    )}
                                                    {contractDetail?.data?.violate && (
                                                        <p className="mt-3">
                                                            - Cho phép đơn phương hủy hợp đồng nếu 1 trong 2 vi phạm các quy định trong điều khoản
                                                        </p>
                                                    )}
                                                    {contractDetail?.data?.suspend && (
                                                        <div>
                                                            <p className="mt-3">
                                                                - Cho phép tạm ngưng hợp đồng trong trường hợp bất khả kháng: {contractDetail?.data.suspendContent}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </Row>
                        <div className="flex justify-center mt-10 items-center pb-24">
                            <div className="flex flex-col gap-2 px-[18%] text-center">
                                <p className="text-lg"><b>ĐẠI DIỆN BÊN A</b></p>
                                <p><b>{contractDetail?.data?.partnerA.partnerName?.toUpperCase()}</b></p>
                                <i className="text-zinc-600">Ký và ghi rõ họ tên</i>
                            </div>
                            <div className="flex flex-col gap-2 px-[18%] text-center">
                                <p className="text-lg"><b>ĐẠI DIỆN BÊN B</b></p>
                                <p><b>{contractDetail?.data?.partnerB.partnerName?.toUpperCase()}</b></p>
                                <i className="text-zinc-600">Ký và ghi rõ họ tên</i>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default DeletedContract;