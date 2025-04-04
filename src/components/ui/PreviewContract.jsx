import React, { useEffect, useState } from 'react';
import { Card, Descriptions, Divider, Typography, Table, Row, Col, Spin, Button } from 'antd';
import { useGetPartnerInfoDetailQuery } from '../../services/PartnerAPI';
import { useGetBussinessInformatinQuery } from '../../services/BsAPI';
import { useLazyGetTermDetailQuery } from '../../services/ClauseAPI';
import dayjs from 'dayjs';
import { numberToVietnamese } from '../../utils/ConvertMoney';
import { useSelector } from 'react-redux';
import ChatModalWrapper from './ChatModal';
import { htmlToText } from 'html-to-text';

const PreviewContract = ({ form, partnerId, data }) => {
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
    const [promtData, setPromtData] = useState("")
    const { data: partnerDetail, isLoading: isLoadingInfoPartner } = useGetPartnerInfoDetailQuery({ id: partnerId });
    const { data: bsInfor, isLoading: isLoadingBsData } = useGetBussinessInformatinQuery();
    const [fetchTerms] = useLazyGetTermDetailQuery();
    const formValues = data || (form ? form.getFieldsValue(true) : {});


    console.log(formValues)

    // Load term details for legal basis
    useEffect(() => {
        if (formValues?.legalBasisTerms) {
            formValues.legalBasisTerms.forEach(termId => {
                loadTermDetail(termId);
            });
        }
    }, [formValues.legalBasisTerms]);

    // Render the legal basis terms
    const renderLegalBasisTerms = () => {
        if (!formValues?.legalBasisTerms || formValues.legalBasisTerms.length === 0) {
            return <p>Chưa có căn cứ pháp lý nào được chọn.</p>;
        }

        return formValues.legalBasisTerms.map((termId, index) => {
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
                // console.error(`Error loading term ${termId}:`, error);
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

    const getPlainTextContent = (htmlContent) => {
        try {
            return htmlToText(htmlContent, {
                wordwrap: false
            });
        } catch (error) {
            console.error("Error converting HTML to text:", error);
            return htmlContent;
        }
    };

    // Tạo payload chứa đầy đủ thông tin hợp đồng cho AI
    const generateContractPayloadForAI = () => {
        const plainTextContent = getPlainTextContent(formValues.contractContent || '');
        const contractPayload = {
            contractNumber: formValues.contractNumber,
            contractName: formValues.contractName,
            contractContent: plainTextContent,
            legalBasis: formValues.legalBasis
                ? formValues.legalBasis.map(termId => termsData[termId]?.value || '')
                : [],
            additionalTerms: formValues.additionalTerms
                ? formValues.additionalTerms.map(termId => termsData[termId]?.value || '')
                : [],
            specialTerms: {
                A: formValues.specialTermsA,
                B: formValues.specialTermsB
            },
            commonTerms: {},
            payments: formValues.payments || [],
            totalValue: formValues.totalValue,
            effectiveDate: formValues.effectiveDate,
            expiryDate: formValues.expiryDate,
            notifyEffectiveContent: formValues.notifyEffectiveContent,
            notifyExpiryContent: formValues.notifyExpiryContent
            // Các trường khác nếu cần
        };

        // Tổ chức các điều khoản chung theo nhóm loại
        const organizedCommonTerms = organizeCommonTermsByType();
        Object.keys(organizedCommonTerms).forEach(typeKey => {
            contractPayload.commonTerms[organizedCommonTerms[typeKey].typeName] =
                organizedCommonTerms[typeKey].terms.map(termId => termsData[termId]?.value || '');
        });

        return contractPayload;
    };

    // Tạo prompt gửi cho AI dựa trên payload hợp đồng
    const generateAIPrompt = () => {
        const payload = generateContractPayloadForAI();
        let prompt = `Hợp đồng số ${payload.contractNumber} với tên "${payload.contractName}" có nội dung như sau:\n\n`;
        prompt += `${payload.contractContent}\n\n`;
        prompt += `Các căn cứ pháp lý:\n`;
        if (payload.legalBasis.length > 0) {
            payload.legalBasis.forEach((item, index) => {
                prompt += `${index + 1}. ${item}\n`;
            });
        } else {
            prompt += "Không có căn cứ pháp lý nào được chọn.\n";
        }
        prompt += `\nCác điều khoản bổ sung:\n`;
        if (payload.additionalTerms.length > 0) {
            payload.additionalTerms.forEach((item, index) => {
                prompt += `${index + 1}. ${item}\n`;
            });
        } else {
            prompt += "Không có điều khoản bổ sung nào được chọn.\n";
        }
        prompt += `\nCác điều khoản chung theo nhóm:\n`;
        Object.keys(payload.commonTerms).forEach(typeName => {
            prompt += `\nNhóm ${typeName}:\n`;
            payload.commonTerms[typeName].forEach((item, index) => {
                prompt += `${index + 1}. ${item}\n`;
            });
        });
        prompt += `\nCác điều khoản riêng của các bên:\n`;
        prompt += `- Bên A: ${payload.specialTerms.A || 'Không có'}\n`;
        prompt += `- Bên B: ${payload.specialTerms.B || 'Không có'}\n`;
        prompt += `\nVui lòng kiểm tra hợp đồng trên và đề xuất các cải tiến. Đối với mỗi đề xuất, hãy **in đậm** đề xuất cải tiến và giải thích ngắn gọn lý do của từng đề xuất.`;

        return prompt;
    };


    const handleGenerateAIPrompt = () => {
        const prompt = generateAIPrompt();
        setPromtData(prompt);
    };


    if (isLoadingBsData || isLoadingInfoPartner) {
        return (
            <div className='flex justify-center items-center'>
                <Spin />
            </div>
        );
    }
    // const parseDate = (dateArray) => {
    //     if (!Array.isArray(dateArray) || dateArray.length < 5) return null;
    //     const [year, month, day, hour, minute] = dateArray;
    //     return new Date(year, month - 1, day, hour, minute);
    // };
    // // Tổ chức điều khoản Common theo loại
    const organizedCommonTerms = organizeCommonTermsByType();

    const contractFormatTemplates = {
        "1": "[Tên viết tắt doanh nghiệp tạo]/[Tên viết tắt khách hàng]/[Loại hợp đồng]/[DDMMYY]-[Số thứ tự]",
        "2": "[Viết tắt hợp đồng]-[Loại hợp đồng]/[Ngày/Tháng/Năm]-[Số thứ tự]",
        "3": "[Viết tắt hợp đồng]/[Tên viết tắt khách hàng]/[Ngày/Tháng/Năm]-[Số thứ tự]",
        "4": "[Loại hợp đồng]/[Tên viết tắt doanh nghiệp tạo]/[Ngày/Tháng/Năm]-[Số thứ tự]",
        "5": "[Loại hợp đồng]-[Tên viết tắt doanh nghiệp tạo]/[Tên viết tắt khách hàng]/[DD/MM/YY]-[Số thứ tự]",
        "6": "[Viết tắt hợp đồng]/[Tên viết tắt khách hàng]/[Loại hợp đồng]/[DDMMYY]-[Số thứ tự]",
    };

    const paymentSchedulesColumns = [
        {
            title: 'Đợt',
            key: 'paymentOrder',
            align: 'center',
            render: (_, record, index) => index + 1,
        },
        {
            title: 'Số tiền (VND)',
            dataIndex: 'amount',
            key: 'amount',
            render: (value) => new Intl.NumberFormat('vi-VN').format(value),
        },
        {
            title: 'Ngày thanh toán',
            dataIndex: 'paymentDate',
            key: 'paymentDate',
            render: (paymentDate) =>
                `Ngày ${dayjs(paymentDate).format('DD')} Tháng ${dayjs(paymentDate).format('MM')} năm ${dayjs(paymentDate).format('YYYY')}`,
        },
        {
            title: 'Phương thức thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method) =>
                method === 'cash'
                    ? 'Tiền mặt'
                    : method === 'creditCard'
                        ? 'Thẻ tín dụng'
                        : 'Chuyển khoản',
        },
    ];

    const paymentItemsColumns = [
        {
            title: 'STT',
            dataIndex: 'itemOrder',
            key: 'itemOrder',
            align: 'center',
            render: (_, record, index) => index + 1,
        },
        {
            title: 'Nội dung',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Số tiền (VND)',
            dataIndex: 'amount',
            key: 'amount',
            render: (value) => new Intl.NumberFormat('vi-VN').format(value),
        },

    ];

    return (
        <div className={`${isDarkMode ? 'bg-gray-[#141414] text-white' : 'bg-[#f5f5f5]'} shadow-md p-4 pb-16 rounded-md`}>
            <div className='fixed bottom-10 right-20 z-50'>
                {/* <ChatModalWrapper generatedPrompt={promtData} handleGenerateAIPrompt={handleGenerateAIPrompt} /> */}
            </div>
            <div className="text-center">
                <p className={`font-bold text-xl pt-8 ${isDarkMode ? 'text-white' : ''}`}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className={`font-bold text-lg mt-2 ${isDarkMode ? 'text-white' : ''}`}>Độc lập - Tự do - Hạnh phúc</p>
                <p className={isDarkMode ? 'text-gray-400' : ''}>---------------------------------</p>
                <p className={`text-right mr-[10%] ${isDarkMode ? 'text-gray-300' : ''}`}>
                    {/* <i>{formValues?.contractLocation}, Ngày {formValues?.signingDate?.format('DD')} Tháng {formValues?.signingDate?.format('MM')} Năm {formValues?.signingDate?.format('YYYY')}</i> */}
                </p>
                <p className={`text-3xl font-bold mt-5 ${isDarkMode ? 'text-white' : ''}`}>{formValues.contractName ? formValues.contractName.toUpperCase() : ''}</p>
                <p className={`mt-3 text-base ${isDarkMode ? 'text-white' : ''}`}><b>Số:</b> {contractFormatTemplates[formValues?.contractNumberFormat] || formValues?.contractNumber || "Được chọn tại hợp đồng"}</p>
            </div>

            <div className="px-4 flex pl-10 flex-col gap-2 mt-10">
                {renderLegalBasisTerms()}
                <div className={` p-1 rounded-lg`}>
                    Hôm nay, Hợp đồng dịch vụ này được lập vào ngày{" "}
                    {dayjs(formValues?.signingDate).format("DD")} tháng{" "}
                    {dayjs(formValues?.signingDate).format("MM")} năm{" "}
                    {dayjs(formValues?.signingDate).format("YYYY")}, tại {formValues?.contractLocation || "........................."}, bởi và giữa:
                </div>
            </div>

            <Row gutter={16} className='flex flex-col mt-5 pl-10 ' justify={"center"}>
                {form ? (
                    <div className='flex flex-col gap-5 mb-6'>
                        <Col className={`flex flex-col gap-2 ${isDarkMode ? 'text-gray-300' : ''}`} >
                            <p className="font-bold text-lg "><u>BÊN CUNG CẤP (BÊN A)</u></p>
                            <p className="text-sm "><b>Tên công ty:</b> {formValues?.partnerA.partnerName}</p>
                            <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {formValues?.partnerA.partnerAddress}</p>
                            <p className="flex text-sm justify-between"><p><b>Người đại diện:</b> {formValues?.partnerA.spokesmanName} </p></p>
                            <p className="text-sm"><b>Chức vụ:</b> {formValues?.partnerA.position }</p>
                            <p className='flex text-sm  justify-between'><p><b>Mã số thuế:</b> {formValues?.partnerA.partnerTaxCode}</p></p>
                            <p className="text-sm"><b>Email:</b> {formValues?.partnerA.partnerEmail}</p>
                        </Col>
                        <Col className={`flex flex-col gap-2 ${isDarkMode ? 'text-gray-300' : ''}`} >
                            <p className="font-bold text-lg "><u>BÊN SỬ DỤNG (BÊN B)</u></p>
                            <p className="text-sm "><b>Tên công ty:</b> {formValues?.partnerB.partnerName}</p>
                            <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {formValues?.partnerB.partnerAddress}</p>
                            <p className="flex text-sm justify-between"><p><b>Người đại diện:</b> {formValues?.partnerB.spokesmanName} </p></p>
                            <p className="text-sm"><b>Chức vụ:</b> {formValues?.partnerB.position }</p>
                            <p className='flex text-sm  justify-between'><p><b>Mã số thuế:</b> {formValues?.partnerB.partnerTaxCode}</p></p>
                            <p className="text-sm"><b>Email:</b> {formValues?.partnerB.partnerEmail}</p>
                        </Col>
                    </div>
                ) : (
                    <div className='flex flex-col gap-5 mb-6'>
                        <Col className={`flex flex-col gap-2 ${isDarkMode ? 'text-gray-300' : ''}`} >
                            <p className="font-bold text-lg "><u>BÊN CUNG CẤP (BÊN A)</u></p>
                            <p className="text-sm "><b>Tên công ty:</b> {bsInfor?.data.partnerName}</p>
                            <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {bsInfor?.data.address}</p>
                            <p className="flex text-sm justify-between"><p><b>Người đại diện:</b> {bsInfor?.data.spokesmanName} </p></p>
                            <p className="text-sm"><b>Chức vụ:</b> {bsInfor?.data.position || "Giám đốc"}</p>
                            <p className='flex text-sm  justify-between'><p><b>Mã số thuế:</b> {bsInfor?.data.taxCode}</p></p>
                            <p className="text-sm"><b>Email:</b> {bsInfor?.data.email}</p>
                        </Col>
                        <Col className={`flex flex-col gap-2 ${isDarkMode ? 'text-gray-300' : ''}`} >
                            <p className="font-bold text-lg "><u>BÊN SỬ DỤNG (Bên B)</u></p>
                            <p className="text-sm "><b>Tên công ty: </b>{partnerDetail?.data.partnerName || "................................................................."}</p>
                            <p className="text-sm"><b>Địa chỉ trụ sở chính: </b>{partnerDetail?.data.address || "...................................................."}</p>
                            <p className="flex  text-sm justify-between"><p><b>Người đại diện:</b> {partnerDetail?.data.spokesmanName || "............................................................"}</p></p>
                            <p className="text-sm"><b>Chức vụ:</b> {partnerDetail?.data.position || "......................................................................."} </p>
                            <p className='flex text-sm justify-between'><p><b>Mã số thuế:</b> {partnerDetail?.data.taxCode || ".................................................................."}</p></p>
                            <p className="text-sm"><b>Email:</b> {partnerDetail?.data.email || "............................................................................"}</p>
                        </Col>
                    </div>
                )}

                <div className={`pl-2 ${isDarkMode ? 'text-gray-300' : ''}`}>
                    <p>Sau khi bàn bạc và thống nhất chúng tôi cùng thỏa thuận ký kết bản hợp đồng với nội dung và các điều khoản sau: </p>
                    <p className="font-bold text-lg mt-4 mb-3"><u>NỘI DUNG HỢP ĐỒNG</u></p>

                    <div className="ml-1" dangerouslySetInnerHTML={{ __html: formValues.contractContent || "Chưa nhập" }} />

                    <div className="mt-4">
                        <h4 className="font-bold text-lg placeholder:"><u>GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</u></h4>
                        {partnerId && (
                            <div>
                                <p className='mt-4'>
                                    - Tổng giá trị hợp đồng:
                                    <b>  {new Intl.NumberFormat('vi-VN').format(formValues?.totalValue)} VND</b>
                                    <span className='text-gray-600'>  ( {numberToVietnamese(formValues.totalValue)} )</span>
                                </p>

                                <p className=" ml-3 font-bold my-5">
                                    1.  Hạng mục thanh toán
                                </p>
                                <Table
                                    dataSource={formValues?.contractItems}
                                    columns={paymentItemsColumns}
                                    rowKey="id"
                                    pagination={false}
                                    bordered
                                />

                                <p className=" ml-3 font-bold my-5">
                                    2. Tổng giá trị và số lần thanh toán
                                </p>

                                {formValues?.payments &&
                                    formValues.payments.length > 0 && (
                                        <>
                                            <Table
                                                dataSource={formValues.payments}
                                                columns={paymentSchedulesColumns}
                                                rowKey="paymentOrder"
                                                pagination={false}
                                                bordered
                                            />
                                        </>
                                    )}
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
                    <p><b> {bsInfor?.representativeName?.toUpperCase()}</b></p>
                    <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                </div>
            </div>
        </div>
    );
};

export default PreviewContract;