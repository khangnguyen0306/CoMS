import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Divider, Typography, Table, Row, Col, Spin } from 'antd';
import { useGetPartnerInfoDetailQuery } from '../../services/PartnerAPI';
import { useGetBussinessInformatinQuery } from '../../services/BsAPI';
import { useLazyGetTermDetailQuery } from '../../services/ClauseAPI';
import dayjs from 'dayjs';
import { numberToVietnamese } from '../../utils/ConvertMoney';
import { useSelector } from 'react-redux';

const { Title, Text } = Typography;

const PreviewContract = ({ form, partnerId }) => {
    const [termsData, setTermsData] = useState({});
    const [loadingTerms, setLoadingTerms] = useState({});
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    const [groupedTerms, setGroupedTerms] = useState({
        Common: [],
        A: [],
        B: []
    });
    // Lưu thông tin về loại của điều khoản Common
    const [termTypesMap, setTermTypesMap] = useState({});

    const { data: partnerDetail, isLoading: isLoadingInfoPartner } = useGetPartnerInfoDetailQuery({ id: partnerId });
    const { data: bsInfor, isLoading: isLoadingBsData } = useGetBussinessInformatinQuery();
    const [fetchTerms] = useLazyGetTermDetailQuery();

    const formValues = form.getFieldsValue(true);


    // Load term details for legal basis
    useEffect(() => {
        if (formValues?.legalBasis) {
            formValues.legalBasis.forEach(termId => {
                loadTermDetail(termId);
            });
        }
    }, [formValues.legalBasis]);

    // Render the legal basis terms
    const renderLegalBasisTerms = () => {
        if (!formValues?.legalBasis || formValues.legalBasis.length === 0) {
            return <p>Chưa có căn cứ pháp lý nào được chọn.</p>;
        }

        return formValues.legalBasis.map((termId, index) => {
            const term = termsData[termId];
            if (!term) {
                return (
                    <div key={termId} className="term-item p-1">
                        <Spin size="small" />
                    </div>
                );
            }

            return (
                <p key={index}>
                    <i>- {term.value}</i>
                </p>
            );
        });
    };

    // Tải chi tiết điều khoản
    const loadTermDetail = async (termId) => {
        if (!termsData[termId]) {
            setLoadingTerms(prev => ({ ...prev, [termId]: true }));
            try {
                const response = await fetchTerms(termId).unwrap();
                setTermsData(prev => ({
                    ...prev,
                    [termId]: response.data
                }));
            } catch (error) {
                console.error(`Error loading term ${termId}:`, error);
            } finally {
                setLoadingTerms(prev => ({ ...prev, [termId]: false }));
            }
        }
    };

    // Gom tất cả các ID điều khoản theo nhóm A, B, Common từ tất cả các loại
    useEffect(() => {
        const allGrouped = {
            Common: [],
            A: [],
            B: []
        };

        // Dùng để lưu thông tin loại của điều khoản
        const typesMap = {};

        // Tên chính xác của các loại điều khoản
        const typeNames = {
            "1": "ĐIỀU KHOẢN BỔ SUNG",
            "2": "QUYỀN VÀ NGHĨA VỤ CÁC BÊN",
            "3": "ĐIỀU KHOẢN BẢO HÀNH VÀ BẢO TRÌ",
            "4": "ĐIỀU KHOẢN VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI",
            "5": "ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG",
            "6": "ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP",
            "7": "ĐIỀU KHOẢN BẢO MẬT"
        };

        // Thu thập từ tất cả các loại (1-7)
        for (let typeKey = 1; typeKey <= 7; typeKey++) {
            const typeData = formValues[typeKey];
            if (typeData) {
                // Thu thập từ nhóm Common
                if (typeData.Common?.length > 0) {
                    typeData.Common.forEach(termId => {
                        allGrouped.Common.push(termId);
                        // Lưu thông tin loại của điều khoản
                        typesMap[termId] = {
                            typeKey: typeKey.toString(),
                            typeName: typeNames[typeKey.toString()]
                        };
                    });
                }
                // Thu thập từ nhóm A
                if (typeData.A?.length > 0) {
                    allGrouped.A.push(...typeData.A);
                }
                // Thu thập từ nhóm B
                if (typeData.B?.length > 0) {
                    allGrouped.B.push(...typeData.B);
                }
            }
        }

        // Loại bỏ các ID trùng lặp
        // Đối với Common, chúng ta sẽ giữ nguyên nếu có trùng lặp vì có thể cùng ID nhưng khác loại
        allGrouped.A = [...new Set(allGrouped.A)];
        allGrouped.B = [...new Set(allGrouped.B)];

        setGroupedTerms(allGrouped);
        setTermTypesMap(typesMap);

        // Tải tất cả điều khoản
        const allTermIds = [
            ...allGrouped.Common,
            ...allGrouped.A,
            ...allGrouped.B,
            ...(formValues.additionalTerms || [])
        ];

        // Loại bỏ trùng lặp trước khi tải
        [...new Set(allTermIds)].forEach(termId => {
            loadTermDetail(termId);
        });
    }, [formValues]);

    // Render một điều khoản trong nhóm A hoặc B
    const renderTerm = (termId, index) => {
        if (loadingTerms[termId]) {
            return (
                <div key={termId} className="term-item p-1">
                    <Spin size="small" />
                </div>
            );
        }

        const term = termsData[termId];
        if (!term) return null;

        return (
            <div key={termId} className="term-item p-1">
                <div className="term-content">
                    <p>{index + 1}. {term.value}</p>
                </div>
            </div>
        );
    };

    // Render một điều khoản trong nhóm Common với thông tin loại
    const renderCommonTerm = (termId, index) => {
        if (loadingTerms[termId]) {
            return (
                <div key={termId} className="term-item p-4">
                    <Spin size="small" />
                </div>
            );
        }

        const term = termsData[termId];
        const typeInfo = termTypesMap[termId];

        if (!term) return null;

        return (
            <div key={termId} className="term-item ">
                <div className="term-content mt-2">
                    <p>{index + 1}. {term.value}</p>
                </div>
            </div>
        );
    };

    // Tổ chức các điều khoản Common theo loại
    const organizeCommonTermsByType = () => {
        const organizedTerms = {};

        // Nhóm các điều khoản theo loại
        groupedTerms.Common.forEach(termId => {
            const typeInfo = termTypesMap[termId];
            if (typeInfo) {
                const typeKey = typeInfo.typeKey;
                if (!organizedTerms[typeKey]) {
                    organizedTerms[typeKey] = {
                        typeName: typeInfo.typeName,
                        terms: []
                    };
                }
                organizedTerms[typeKey].terms.push(termId);
            }
        });

        return organizedTerms;
    };

    if (isLoadingBsData || isLoadingInfoPartner) {
        return (
            <div className='flex justify-center items-center'>
                <Spin />
            </div>
        );
    }

    // Tổ chức điều khoản Common theo loại
    const organizedCommonTerms = organizeCommonTermsByType();

    return (
        <div className={`${isDarkMode ? 'bg-gray-[#141414] text-white' : 'bg-[#f5f5f5]'} shadow-md p-4 pb-16 rounded-md`}>
            <div className="text-center">
                <p className={`font-bold text-xl pt-8 ${isDarkMode ? 'text-white' : ''}`}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className={`font-bold text-lg mt-2 ${isDarkMode ? 'text-white' : ''}`}>Độc lập - Tự do - Hạnh phúc</p>
                <p className={isDarkMode ? 'text-gray-400' : ''}>---------------------------------</p>
                <p className={`text-right mr-[10%] ${isDarkMode ? 'text-gray-300' : ''}`}>
                    <i>{formValues?.contractLocation}, Ngày {formValues?.signingDate?.format('DD')} Tháng {formValues?.signingDate?.format('MM')} Năm {formValues?.signingDate?.format('YYYY')}</i>
                </p>
                <p className={`text-3xl font-bold mt-5 ${isDarkMode ? 'text-white' : ''}`}>{formValues.contractName ? formValues.contractName.toUpperCase() : ''}</p>
                <p className={`mt-3 text-base ${isDarkMode ? 'text-white' : ''}`}><b>Số:</b> {formValues?.contractNumber}</p>
            </div>

            <div className="px-4 flex pl-10 flex-col gap-2 mt-10">
                {renderLegalBasisTerms()}
            </div>

            <Row gutter={16} className='flex flex-col mt-5 pl-10 gap-5' justify={"center"}>
                <Col className={`flex flex-col gap-2 ${isDarkMode ? 'text-gray-300' : ''}`} md={10} sm={24}>
                    <p className="font-bold text-lg "><u>BÊN CUNG CẤP (BÊN A)</u></p>
                    <p className="text-sm "><b>Tên công ty:</b> {bsInfor?.businessName}</p>
                    <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {bsInfor?.address}</p>
                    <p className="flex text-sm justify-between"><p><b>Người đại diện:</b> {bsInfor?.representativeName} </p></p>
                    <p className="text-sm"><b>Chức vụ:</b> {bsInfor?.representativeTitle}</p>
                    <p className='flex text-sm  justify-between'><p><b>Mã số thuế:</b> {bsInfor?.taxCode}</p></p>
                    <p className="text-sm"><b>Email:</b> {bsInfor?.email}</p>
                </Col>
                <Col className={`flex flex-col gap-2 ${isDarkMode ? 'text-gray-300' : ''}`} md={10} sm={24}>
                    <p className="font-bold text-lg "><u>Bên thuê (Bên B)</u></p>
                    <p className="text-sm "><b>Tên công ty: </b>{partnerDetail?.data.partnerName}</p>
                    <p className="text-sm"><b>Địa chỉ trụ sở chính: </b>{partnerDetail?.data.address}</p>
                    <p className="flex  text-sm justify-between"><p><b>Người đại diện:</b> {partnerDetail?.data.spokesmanName}</p></p>
                    <p className="text-sm"><b>Chức vụ:</b> </p>
                    {/* ///////////////////////thiếu chức vụ  */}
                    <p className='flex text-sm justify-between'><p><b>Mã số thuế:</b> {partnerDetail?.data.taxCode}</p></p>
                    <p className="text-sm"><b>Email:</b> {partnerDetail?.data.email}</p>
                </Col>
                <div className={`pl-2 ${isDarkMode ? 'text-gray-300' : ''}`}>
                    <p>Sau khi bàn bạc và thống nhất chúng tôi cùng thỏa thuận ký kết bản hợp đồng với nội dung và các điều khoản sau: </p>
                    <p className="font-bold text-lg mt-4 mb-3"><u>NỘI DUNG HỢP ĐỒNG</u></p>

                    <div className="ml-1" dangerouslySetInnerHTML={{ __html: formValues.contractContent || "Chưa nhập" }} />

                    <div className="mt-4">
                        <h4 className="font-bold text-lg placeholder:"><u>GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</u></h4>

                        <p className='mt-4'>
                            - Tổng giá trị hợp đồng:
                            <b>  {new Intl.NumberFormat('vi-VN').format(formValues?.totalValue)} VND</b>
                            <span className='text-gray-600'>  ( {numberToVietnamese(formValues.totalValue)} )</span>
                        </p>
                        {formValues?.payments && formValues.payments.length > 0 && (
                            <div className="mt-5 ml-2">
                                <p className="font-bold text-base">Thanh toán qua {formValues.payments.length} đợt: </p>
                                {formValues.payments.map((payment, index) => (
                                    <div key={index} className="mt-2 ml-6 flex flex-col gap-2">
                                        <p><b>Đợt {index + 1}:</b></p>
                                        <p>- <b>Số tiền:</b>  {payment.amount.toLocaleString()} ₫</p>
                                        <p>- <b>Ngày thanh toán:</b> {dayjs(payment.paymentDate).format('DD/MM/YYYY')}</p>
                                        <p>- <b>Phương thức thanh toán:</b> {payment.paymentMethod === 'cash' ? 'Tiền mặt' : payment.paymentMethod === 'creditCard' ? 'Thẻ tín dụng' : 'Chuyển khoản'}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div>
                        {formValues?.isDateLateChecked && <p className="mt-3">- Trong quá trình thanh toán cho phép trễ hạn tối đa {formValues?.maxDateLate} (ngày) </p>}
                            {formValues?.autoAddVAT && <p className="mt-3">- Thuế VAT được tính ({formValues?.vatPercentage}%)</p>}
      

                        </div>


                        <div className="mt-4">
                            <h4 className="font-bold text-lg placeholder:"><u>THỜI GIAN HIỆU LỰC LIÊN QUAN</u></h4>
                            {formValues?.effectiveDate && formValues?.expiryDate && (
                                <div className="mt-3">
                                    <p>- Ngày bắt đầu hiệu lực: {dayjs(formValues.effectiveDate).format('HH:mm')}  ngày <b>{dayjs(formValues.effectiveDate).format('DD/MM/YYYY')}</b></p>
                                    <p>- Ngày chấm dứt hiệu lực: {dayjs(formValues.expiryDate).format('HH:mm')}  ngày <b>{dayjs(formValues.expiryDate).format('DD/MM/YYYY')} </b></p>
                                </div>
                            )}
                                                  {formValues?.autoRenew && <p className="mt-3">- Tự động gia hạn khi hợp đồng hết hạn nếu không có bất kỳ phản hồi nào từ các phía</p>}
                            {formValues?.appendixEnabled && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực </p>}

                        </div>
                    </div>
                    <div className="mt-2">
                        <h4 className="font-bold text-lg placeholder: mt-4"><u>CÁC LOẠI ĐIỀU KHOẢN</u></h4>
                        <div className="ml-5 mt-3 flex flex-col gap-3">
                            {groupedTerms.Common.length > 0 && (
                                <div className="term-group mb-2">
                                    {Object.keys(organizedCommonTerms).map(typeKey => (
                                        <div key={typeKey} className="mb-2">
                                            <p className='text-base font-bold'>{organizedCommonTerms[typeKey].typeName}</p>
                                            {organizedCommonTerms[typeKey].terms.map((termId, index) =>
                                                renderCommonTerm(termId, index)
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Hiển thị nhóm điều khoản A */}
                            {(groupedTerms.A.length > 0 || formValues?.specialTermsA) && (
                                <div className="term-group mb-2">
                                    <p className='font-bold' >ĐIỀU KHOẢN RIÊNG BÊN A</p>
                                    {groupedTerms.A.map((termId, index) => renderTerm(termId, index))}
                                    <p className='text-sm'>- {formValues?.specialTermsA && formValues?.specialTermsA}</p>
                                </div>
                            )}


                            {/* Hiển thị nhóm điều khoản B */}
                            {(groupedTerms.B.length > 0 || formValues?.specialTermsB) && (
                                <div className="term-group mb-2">
                                    <p className='font-bold' >ĐIỀU KHOẢN RIÊNG BÊN B</p>
                                    {groupedTerms.B.map((termId, index) => renderTerm(termId, index))}
                                    <p className='text-sm'>- {formValues?.specialTermsB && formValues?.specialTermsB}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            {(
                                formValues?.appendixEnabled ||
                                formValues?.transferEnabled ||
                                formValues?.violate ||
                                formValues?.suspend
                            ) && (
                                    <div>
                                        <h4 className="font-bold text-lg placeholder:"><u>CÁC THÔNG TIN KHÁC</u></h4>
                                        {formValues?.appendixEnabled && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>}
                                        {formValues?.transferEnabled && <p className="mt-3">- Cho phép chuyển nhượng hợp đồng</p>}
                                        {formValues?.violate && <p className="mt-3">- Cho phép đơn phương hủy hợp đồng nếu 1 trong 2 vi phạm các quy định trong điều khoản được ghi trong hợp đồng</p>}
                                        {formValues?.suspend && (
                                            <div>
                                                <p className="mt-3">- Cho phép tạm ngưng hợp đồng trong các trường hợp bất khả kháng sau: {formValues?.suspendContent}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>

                    </div>
                </div>

            </Row>
            <div className='flex justify-center mt-10 items-center pb-24' >
                <div className='flex flex-col gap-2 px-[18%] text-center'>
                    <p className='text-lg'><b>ĐẠI DIỆN BÊN A</b></p>
                    <p><b> {partnerDetail?.data.partnerName.toUpperCase()}</b></p>
                    <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                </div>
                <div className='flex flex-col gap-2 px-[18%] text-center'>
                    <p className='text-lg'><b>ĐẠI DIỆN BÊN B</b></p>
                    <p><b> {bsInfor?.representativeName.toUpperCase()}</b></p>
                    <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                </div>
            </div>
        </div>
    );
};

export default PreviewContract;