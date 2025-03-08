import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGetContractDetailQuery } from '../../services/ContractAPI';
import { useSelector } from 'react-redux';
import { Col, Row, Spin } from 'antd';
import { useGetBussinessInformatinQuery } from '../../services/BsAPI';
import { useLazyGetTermDetailQuery } from '../../services/ClauseAPI';
import { numberToVietnamese } from '../../utils/ConvertMoney';
import dayjs from 'dayjs';

const ContractDetail = () => {
    const { id } = useParams();
    const { data: contractData, isLoading: loadingDataContract } = useGetContractDetailQuery(id);
    const [termsData, setTermsData] = useState({});
    const [loadingTerms, setLoadingTerms] = useState({});
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);

    // Nhóm các điều khoản từ additional_config (dùng cho bổ sung chung, riêng bên A, B)
    const [groupedTerms, setGroupedTerms] = useState({
        Common: [],
        A: [],
        B: []
    });

    // Lấy thông tin bên thuê theo party_id
    const { data: bsInfor, isLoading: isLoadingBsData } = useGetBussinessInformatinQuery();
    const [fetchTerms] = useLazyGetTermDetailQuery();

    // Hàm tải chi tiết điều khoản dựa theo termId (original_term_id)
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
        if (contractData?.data?.legalBasisTerms) {
            contractData.data.legalBasisTerms.forEach((termObj) => {
                loadTermDetail(termObj.original_term_id);
            });
        }
    }, [contractData?.data?.legalBasisTerms]);

    // Nhóm các điều khoản từ additional_config
    useEffect(() => {
        if (contractData?.data?.additionalConfig) {
            const allGrouped = { Common: [], A: [], B: [] };
            // additionalConfig là object với các key (ví dụ: "1") chứa object với mảng Common, A, B
            Object.values(contractData.data.additionalConfig).forEach((config) => {
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
                contractData?.data?.additional_terms?.map((termObj) => termObj.original_term_id) || [];
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
    }, [contractData?.data]);

    // Render các căn cứ pháp lý
    const renderLegalBasisTerms = () => {
        if (!contractData?.data?.legalBasisTerms || contractData.data.legalBasisTerms.length === 0) {
            return <p>Chưa có căn cứ pháp lý nào được chọn.</p>;
        }
        return contractData.data.legalBasisTerms.map((termObj, index) => {
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

    // Trong trường hợp không có dữ liệu, hiển thị loading
    if (isLoadingBsData || loadingDataContract) {
        return (
            <div className="flex justify-center items-center">
                <Spin />
            </div>
        );
    }

    return (
        <div className={`${isDarkMode ? 'bg-[#222222] text-white' : 'bg-gray-100'} shadow-md p-4 pb-16 rounded-md`}>
            <div className="text-center">
                <p className="font-bold text-xl pt-8">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-lg mt-2">Độc lập - Tự do - Hạnh phúc</p>
                <p>---------------------------------</p>
                <p className='place-self-end mr-10'>
                    {contractData.data.contractLocation}, Ngày {dayjs(parseDate(contractData.data.createdAt)).format('DD')} Tháng {dayjs(parseDate(contractData.data.createdAt)).format('MM')} năm {dayjs(parseDate(contractData.data.createdAt)).format('YYYY')}
                </p>
                <p className="text-3xl font-bold mt-5">
                    {contractData.data.title ? contractData.data.title.toUpperCase() : ''}
                </p>
                <p className="mt-3 text-base">
                    <b>Số:</b> {contractData.data.contractNumber}
                </p>

            </div>

            <div className="px-4 flex pl-10 flex-col gap-2 mt-10">
                {renderLegalBasisTerms()}
            </div>

            <Row gutter={16} className="flex flex-col mt-5 pl-10 gap-5" justify="center">
                <Col className="flex flex-col gap-2" md={10} sm={24}>
                    <p className="font-bold text-lg"><u>BÊN CUNG CẤP (BÊN A)</u></p>
                    <p className="text-sm"><b>Tên công ty:</b> {bsInfor?.businessName}</p>
                    <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {bsInfor?.address}</p>
                    <p className="text-sm"><b>Người đại diện:</b> {bsInfor?.representativeName}</p>
                    <p className="text-sm"><b>Chức vụ:</b> {bsInfor?.representativeTitle}</p>
                    <p className="text-sm"><b>Mã số thuế:</b> {bsInfor?.taxCode}</p>
                    <p className="text-sm"><b>Email:</b> {bsInfor?.email}</p>
                </Col>
                <Col className="flex flex-col gap-2" md={10} sm={24}>
                    <p className="font-bold text-lg"><u>Bên thuê (Bên B)</u></p>
                    <p className="text-sm"><b>Tên công ty:</b> {contractData?.data?.party.partnerName}</p>
                    <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {contractData?.data?.party.address}</p>
                    <p className="text-sm"><b>Người đại diện:</b> {contractData?.data?.party.spokesmanName}</p>
                    <p className="text-sm"><b>Chức vụ:</b> {/* Thiếu thông tin chức vụ */}</p>
                    <p className="text-sm"><b>Mã số thuế:</b> {contractData?.data?.party.taxCode}</p>
                    <p className="text-sm"><b>Email:</b> {contractData?.data?.party.email}</p>
                </Col>
                <div className="pl-2">
                    <p>
                        Sau khi bàn bạc và thống nhất, chúng tôi cùng thỏa thuận ký kết hợp đồng với nội dung và các điều khoản sau:
                    </p>
                    <p className="font-bold text-lg mt-4 mb-3"><u>NỘI DUNG HỢP ĐỒNG</u></p>
                    <div
                        className="ml-1"
                        dangerouslySetInnerHTML={{ __html: contractData.data.contractContent || "Chưa nhập" }}
                    />
                    <div className="mt-4">
                        <h4 className="font-bold text-lg"><u>GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</u></h4>
                        <p className="mt-4">
                            - Tổng giá trị hợp đồng: <b>{new Intl.NumberFormat('vi-VN').format(contractData.data.amount)} VND</b>
                            <span className="text-gray-600"> ( {numberToVietnamese(contractData.data.amount)} )</span>
                        </p>
                        {contractData.data?.payments && contractData.data.payments.length > 0 && (
                            <div className="mt-5 ml-2">
                                <p className="font-bold text-base">
                                    Thanh toán qua {contractData.data.payments.length} đợt:
                                </p>
                                {contractData.data.payments.map((payment, index) => (
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
                            {contractData.data?.isDateLateChecked && (
                                <p className="mt-3">
                                    - Trong quá trình thanh toán cho phép trễ hạn tối đa {contractData.data.maxDateLate} (ngày)
                                </p>
                            )}
                            {contractData.data?.autoAddVAT && (
                                <p className="mt-3">
                                    - Thuế VAT được tính ({contractData.data.vatPercentage}%)
                                </p>
                            )}
                        </div>
                        <div className="mt-4">
                            <h4 className="font-bold text-lg"><u>THỜI GIAN HIỆU LỰC LIÊN QUAN</u></h4>
                            {contractData.data?.effectiveDate && contractData.data?.expiryDate && (
                                <div className="mt-3">
                                    <p>
                                        - Ngày bắt đầu hiệu lực: {dayjs(parseDate(contractData.data.effectiveDate)).format('HH:mm')} ngày <b>{dayjs(parseDate(contractData.data.effectiveDate)).format('DD/MM/YYYY')}</b>
                                    </p>
                                    <p>
                                        - Ngày chấm dứt hiệu lực: {dayjs(parseDate(contractData.data.expiryDate)).format('HH:mm')} ngày <b>{dayjs(parseDate(contractData.data.expiryDate)).format('DD/MM/YYYY')}</b>
                                    </p>
                                </div>
                            )}
                            {contractData.data?.autoRenew && (
                                <p className="mt-3">
                                    - Tự động gia hạn khi hợp đồng hết hạn nếu không có phản hồi từ các phía
                                </p>
                            )}
                            {contractData.data?.appendixEnabled && (
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
                                    <p className="text-sm">- {contractData.data.specialTermsA}</p>
                                </div>
                            )}
                            {groupedTerms.B.length > 0 && (
                                <div className="term-group mb-2">
                                    <p className="font-bold">Điều khoản riêng bên B</p>
                                    {groupedTerms.B.map((termId, index) => renderTerm(termId, index))}
                                    <p className="text-sm">- {contractData.data.specialTermsB}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            {(contractData.data?.appendixEnabled ||
                                contractData.data?.transferEnabled ||
                                contractData.data?.violate ||
                                contractData.data?.suspend) && (
                                    <div>
                                        <h4 className="font-bold text-lg"><u>CÁC THÔNG TIN KHÁC</u></h4>
                                        {contractData.data?.appendixEnabled && (
                                            <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>
                                        )}
                                        {contractData.data?.transferEnabled && (
                                            <p className="mt-3">- Cho phép chuyển nhượng hợp đồng</p>
                                        )}
                                        {contractData.data?.violate && (
                                            <p className="mt-3">
                                                - Cho phép đơn phương hủy hợp đồng nếu 1 trong 2 vi phạm các quy định trong điều khoản
                                            </p>
                                        )}
                                        {contractData.data?.suspend && (
                                            <div>
                                                <p className="mt-3">
                                                    - Cho phép tạm ngưng hợp đồng trong trường hợp bất khả kháng: {contractData.data.suspendContent}
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
                    <p><b>{contractData?.data?.party.partnerName?.toUpperCase()}</b></p>
                    <i className="text-zinc-600">Ký và ghi rõ họ tên</i>
                </div>
                <div className="flex flex-col gap-2 px-[18%] text-center">
                    <p className="text-lg"><b>ĐẠI DIỆN BÊN B</b></p>
                    <p><b>{bsInfor?.representativeName?.toUpperCase()}</b></p>
                    <i className="text-zinc-600">Ký và ghi rõ họ tên</i>
                </div>
            </div>
        </div>
    );
};

export default ContractDetail;
