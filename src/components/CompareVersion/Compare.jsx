import React from 'react'
import { useParams } from 'react-router-dom'
import { useGetDataContractCompareVersionQuery } from '../../services/ContractAPI'
import { Spin, Tag } from 'antd'
import { useSelector } from 'react-redux'
import { useGetBussinessInformatinQuery } from '../../services/BsAPI'
import { diffWords } from 'diff';

const Compare = () => {
    const { contractId } = useParams()
    const { nowVersion } = useParams()
    const { preVersion } = useParams()
    const { data: process } = useGetDataContractCompareVersionQuery({ contractId, version1: nowVersion, version2: preVersion });
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);


    const { data: bsInfor, isLoading: isLoadingBsData } = useGetBussinessInformatinQuery();
    if (!process || process.length < 2) {
        return <div>Loading or insufficient data...</div>;
    }

    const v1 = process[0];
    const v2 = process[1];



    const highlightDifferences = (content1, content2) => {
        const differences = diffWords(content1, content2);

        return differences
            .map(part => {
                if (part.added) {
                    return `<span style="background: #fde047">${part.value}</span>`;
                }
                return part.value;
            })
            .join('');
    };


    const formatDate = (dateArray) => {
        if (!dateArray) return 'N/A';
        const [year, month, day, hour, minute] = dateArray;
        return `Ngày ${day.toString().padStart(2, '0')} tháng ${month.toString().padStart(2, '0')} năm ${year}`;
    };


    const isDifferent = (val1, val2) => {
        if (val1 === null || val2 === null) return val1 !== val2;
        if (Array.isArray(val1) && Array.isArray(val2)) {
            if (val1.length !== val2.length) return true;
            return val1.some((item, index) => isDifferent(item, val2[index]));
        }

        if (typeof val1 === 'object' && typeof val2 === 'object') {
            const keys1 = Object.keys(val1);
            const keys2 = Object.keys(val2);
            if (keys1.length !== keys2.length) return true;
            return keys1.some(key => isDifferent(val1[key], val2[key]));
        }

        return val1 !== val2;
    };



    const findDifferences = () => {
        const ids1 = v1.legalBasisTerms.map(item => item.original_term_id);
        const ids2 = v2.legalBasisTerms.map(item => item.original_term_id);

        return {
            unchanged: v1.legalBasisTerms.filter(item => ids2.includes(item.original_term_id)), // Không thay đổi
            removed: v1.legalBasisTerms.filter(item => !ids2.includes(item.original_term_id)),  // Bị xóa đi
            added: v2.legalBasisTerms.filter(item => !ids1.includes(item.original_term_id))     // Được thêm vào
        };
    };

    const differencesLegalBasic = findDifferences();

    const compareVersionsTerms = () => {
        let result = {};

        // Lấy tất cả các key từ cả v1 và v2
        const keys = new Set([...Object.keys(v1?.additionalConfig || {}), ...Object.keys(v2?.additionalConfig || {})]);

        keys.forEach(key => {
            const group1 = v1.additionalConfig[key] || { A: [], B: [], Common: [] };
            const group2 = v2.additionalConfig[key] || { A: [], B: [], Common: [] };

            // Hàm tìm dữ liệu chung
            const findSame = (list1, list2) => {
                const ids2 = new Set(list2.map(item => item.original_term_id));
                return list1.filter(item => ids2.has(item.original_term_id));
            };

            // Hàm tìm dữ liệu bị xóa
            const findRemoved = (list1, list2) => {
                const ids2 = new Set(list2.map(item => item.original_term_id));
                return list1.filter(item => !ids2.has(item.original_term_id));
            };

            // Hàm tìm dữ liệu mới được thêm vào
            const findAdded = (list1, list2) => findRemoved(list2, list1);

            // So sánh Common
            const sameCommon = findSame(group1.Common, group2.Common);
            const removedCommon = findRemoved(group1.Common, group2.Common);
            const addedCommon = findAdded(group1.Common, group2.Common);

            // So sánh A
            const sameA = findSame(group1.A, group2.A);
            const removedA = findRemoved(group1.A, group2.A);
            const addedA = findAdded(group1.A, group2.A);

            // So sánh B
            const sameB = findSame(group1.B, group2.B);
            const removedB = findRemoved(group1.B, group2.B);
            const addedB = findAdded(group1.B, group2.B);

            result[key] = {
                Common: {
                    unchanged: sameCommon,
                    removed: removedCommon,
                    added: addedCommon
                },
                A: {
                    unchanged: sameA,
                    removed: removedA,
                    added: addedA
                },
                B: {
                    unchanged: sameB,
                    removed: removedB,
                    added: addedB
                }
            };
        });

        return result;
    };


    const compareTerm = compareVersionsTerms();

    const termTitles = {
        "1": "1. ĐIỀU KHOẢN BỔ SUNG",
        "2": "2. QUYỀN VÀ NGHĨA VỤ CÁC BÊN",
        "3": "3. ĐIỀU KHOẢN BẢO HÀNH VÀ BẢO TRÌ",
        "4": "4. ĐIỀU KHOẢN VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI",
        "5": "5. ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG",
        "6": "6. ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP",
        "7": "7. ĐIỀU KHOẢN BẢO MẬT",
        "10": "8. ĐIỀU KHOẢN KHÁC"
    };

    if (isLoadingBsData) {
        return (
            <div className='flex justify-center items-center'>
                <Spin />
            </div>)
    }


    return (
        <div className={`min-h-screen p-4 ${isDarkMode ? 'bg-[#1f1f1f]' : ''}`}>
            <p className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
                SO SÁNH 2 PHIÊN BẢN
            </p>

            {/* Hiển thị dữ liệu của hai phiên bản */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 h-fit `}>
                {/* Phiên bản 14 */}
                <div className={` p-4 rounded-lg shadow-md ${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'}`}>
                    <div className="flex justify-between">
                        <h2 className="text-base font-semibold mb-3">PHIÊN BẢN TRƯỚC</h2>
                        <Tag className='h-fit'>V {preVersion}.0.0</Tag>
                    </div>
                    <div className={` p-4 py-10 rounded-md text-center`}>
                        <p className="font-bold text-lg">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                        <p className="font-bold"> Độc lập - Tự do - Hạnh phúc</p>
                        <p>-------------------</p>
                        <p className={`text-right mt-4`}>
                            {v1.contractLocation}, Ngày {v1?.signingDate[2]} Tháng {v1?.signingDate[1]} Năm {v1?.signingDate[0]}
                        </p>
                        <p className={`text-2xl font-bold mt-10`}>
                            {v1.title.toUpperCase()}
                        </p>
                        <p className={`mt-3 `}><b>Số:</b> {v1.contractNumber}</p>
                    </div>
                    <div gutter={16} className="flex flex-col mt-5 pl-2 gap-5" justify="center">
                        <div className="flex flex-col gap-2" md={10} sm={24}>
                            <p className="font-bold text-lg"><u>BÊN CUNG CẤP (BÊN A)</u></p>
                            <p className="text-sm"><b>Tên công ty:</b> {bsInfor?.businessName}</p>
                            <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {bsInfor?.address}</p>
                            <p className="text-sm"><b>Người đại diện:</b> {bsInfor?.representativeName}</p>
                            <p className="text-sm"><b>Chức vụ:</b> {bsInfor?.representativeTitle}</p>
                            <p className="text-sm"><b>Mã số thuế:</b> {bsInfor?.taxCode}</p>
                            <p className="text-sm"><b>Email:</b> {bsInfor?.email}</p>
                        </div>
                        <div className="flex flex-col gap-2" md={10} sm={24}>
                            <p className="font-bold text-lg"><u>Bên thuê (Bên B)</u></p>
                            <p className={`text-sm `}>
                                <b>Tên công ty:</b> {v1?.partner.partnerName}
                            </p>
                            <p className={`text-sm `}>
                                <b>Địa chỉ trụ sở chính:</b> {v1?.partner.address}
                            </p>
                            <p className={`text-sm `}>
                                <b>Người đại diện:</b> {v1?.partner.spokesmanName}
                            </p>
                            <p className={`text-sm `}>
                                <b>Chức vụ:</b> {v1?.partner?.position}
                            </p>
                            <p className={`text-sm `}>
                                <b>Mã số thuế:</b> {v1?.partner.taxCode}
                            </p>
                            <p className={`text-sm `}>
                                <b>Email:</b> {v1?.partner.email}
                            </p>
                        </div>
                    </div>
                    {/* LegalBasisTerms */}
                    <div className="mt-4">
                        <h3 className="font-semibold text-lg mb-2">Căn cứ pháp lý</h3>
                        {v1.legalBasisTerms.map((term, index) => (
                            <div className='flex flex-col gap-1'>
                                <p><i>- {term.value}</i></p>
                            </div>
                        ))}
                    </div>
                    <p className="font-semibold mt-4 mb-3"><u>2. NỘI DUNG HỢP ĐỒNG</u></p>
                    <div
                        className="ml-1"
                        dangerouslySetInnerHTML={{ __html: v1.contractContent || "Chưa nhập" }}
                    />
                    {/* PaymentSchedules */}
                    <div className="mt-4">
                        <h3 className="font-semibold">GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</h3>
                        {v1.autoAddVAT && (
                            <p className='py-1'>
                                <b>- Thêm phí VAT: </b> {v1?.vatPercentage} %
                            </p>
                        )}
                        {v1.isDateLateChecked && (
                            <p className='py-1'>
                                <b> - Cho phép thanh toán trễ tối đa: </b> {v1?.maxDateLate} (Ngày)
                            </p>
                        )}
                        {v1.autoRenew && (
                            <p className='py-1'>
                                - Hợp đồng sẽ tự gia hạn khi hết hạn nếu không có bất kỳ thông báo nào từ 2 bên
                            </p>
                        )}
                        <p><b className={`mb-3 `}>
                            Số lần thanh toán:</b> {v1.paymentSchedules?.length}
                        </p>
                        {v1.paymentSchedules.map((schedule, index) => {
                            return (
                                <div key={index} className="p-4 mb-4 rounded">
                                    <p>{index + 1 > 1 && <b>lần {index + 1}: </b>}</p>
                                    <div className='ml-3'>
                                        <p>
                                            <strong>Số tiền: </strong>
                                            <span className={``}>
                                                {schedule.amount} VNĐ
                                            </span>
                                        </p>
                                        <p>
                                            <strong>Ngày thông báo thanh toán:</strong>
                                            <span className={``}>
                                                {formatDate(schedule.notifyPaymentDate)}
                                            </span>
                                        </p>
                                        <p>
                                            <strong>Ngày thanh toán:</strong>
                                            <span className={``}>
                                                {formatDate(schedule.paymentDate)}
                                            </span>
                                        </p>
                                        <p>
                                            <strong>Phương thức thanh toán: </strong>
                                            <span className={``}>
                                                {schedule.paymentMethod}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                    <div className="mt-4 flex flex-col">
                        <h3 className="font-semibold ">ĐIỀU KHOẢN</h3>
                        {Object.entries(v1.additionalConfig).map(([key, termData]) => {
                            const title = termTitles[key] || `Điều khoản ${key}`;
                            const commonTerms = termData.Common || [];
                            const termsA = termData.A || [];
                            const termsB = termData.B || [];

                            // Nếu không có dữ liệu trong cả Common, A, B => Ẩn luôn điều khoản này
                            if (commonTerms.length === 0 && termsA.length === 0 && termsB.length === 0) {
                                return null;
                            }

                            return (
                                <div key={key} className="mb-4">
                                    <h4 className="font-medium mt-3 text-blue-600">{title}</h4>

                                    {/* Hiển thị phần Common */}
                                    {commonTerms.length > 0 && (
                                        <div className="p-1 mb-1">
                                            {commonTerms.map((item, index) => (
                                                <div key={index} className="mb-1">
                                                    <p>- {item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Hiển thị phần riêng của A nếu có */}
                                    {termsA.length > 0 && (
                                        <div className="p-1 mb-1">
                                            <p className="font-bold mb-1">Riêng bên A:</p>
                                            {termsA.map((item, index) => (
                                                <div key={index} className="mb-1">
                                                    <p>- {item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Hiển thị phần riêng của B nếu có */}
                                    {termsB.length > 0 && (
                                        <div className="p-1 mb-1">
                                            <p className="font-bold mb-1">Riêng bên B:</p>
                                            {termsB.map((item, index) => (
                                                <div key={index} className="mb-1">
                                                    <p>- {item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {(v1.appendixEnabled === true || v1.violate === true || v1.transferEnabled === true || v1.suspend == true) && (
                        <div>
                            <h1 className='font-semibold'>PHỤ LỤC VÀ CÁC NỘI DUNG KHÁC</h1>
                            {v1.appendixEnabled && (
                                <p className='py-1'>
                                    - Cho phép tạo phụ lục khi hợp đồng đang có hiệu lực pháp lý
                                </p>
                            )}
                            {v1.transferEnabled && (
                                <p className='py-1'>
                                    - Cho phép chuyển nhượng hợp đồng
                                </p>
                            )}
                            {v1.violate && (
                                <p className='py-1'>
                                    - Cho phép đơn phương hủy hợp đồng nếu vi phạm nghiêm trọng các quy định trong điều khoản hợp đồng
                                </p>
                            )}
                            {v1.suspend && (
                                <p className='py-1'>
                                    - Cho phép tạm ngưng hợp đồng trong các trường hợp bất khả kháng được ghi rõ: <p>{v1.suspendContent}</p>
                                </p>
                            )}
                        </div>
                    )}
                    <div className='w-full flex justify-center mt-10 items-center pb-24' >
                        <div className='flex flex-col gap-2 px-[9%] text-center'>
                            <p className='text-lg'><b>ĐẠI DIỆN BÊN A</b></p>
                            <p><b> {process[0]?.partner.partnerName.toUpperCase()}</b></p>
                            <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                        </div>
                        <div className='flex flex-col gap-2 px-[9%] text-center'>
                            <p className='text-lg'><b>ĐẠI DIỆN BÊN B</b></p>
                            <p><b> {bsInfor?.representativeName?.toUpperCase()}</b></p>
                            <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                        </div>
                    </div>

                </div>

                <div className={` p-4 border border-cyan-400 rounded-lg shadow-md ${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'}`}>
                    <div className="flex justify-between">
                        <h2 className="text-base font-semibold mb-3">PHIÊN BẢN HIỆN TẠI</h2>
                        <Tag color='blue' className='h-fit'>V {nowVersion}.0.0</Tag>
                    </div>
                    <div className={` p-4 py-10 rounded-md text-center`}>
                        <p className="font-bold text-lg">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                        <p className="font-bold"> Độc lập - Tự do - Hạnh phúc</p>
                        <p>-------------------</p>
                        <p className={`text-right mt-4
                             ${(isDifferent(v1.contractLocation, v2.contractLocation)
                                || isDifferent(v1?.signingDate, v2?.signingDate)) ?
                                'bg-yellow-300 px-1' : ''}`}>
                            {v2.contractLocation}, Ngày {v2?.signingDate[2]} Tháng {v2?.signingDate[1]} Năm {v2?.signingDate[0]}
                        </p>
                        <p className={`text-2xl font-bold mt-10 ${isDifferent(v1?.title, v2?.title) ? "bg-yellow-300" : ""}`}>
                            {v2.title.toUpperCase()}
                        </p>
                        <p className={`mt-3 ${isDifferent(v1?.contractNumber, v2?.contractNumber) ? "bg-yellow-300" : ""} `}><b>Số:</b> {v2.contractNumber}</p>
                    </div>
                    <div gutter={16} className="flex flex-col mt-5 pl-2 gap-5" justify="center">
                        <div className="flex flex-col gap-2" md={10} sm={24}>
                            <p className="font-bold text-lg"><u>BÊN CUNG CẤP (BÊN A)</u></p>
                            <p className="text-sm"><b>Tên công ty:</b> {bsInfor?.businessName}</p>
                            <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {bsInfor?.address}</p>
                            <p className="text-sm"><b>Người đại diện:</b> {bsInfor?.representativeName}</p>
                            <p className="text-sm"><b>Chức vụ:</b> {bsInfor?.representativeTitle}</p>
                            <p className="text-sm"><b>Mã số thuế:</b> {bsInfor?.taxCode}</p>
                            <p className="text-sm"><b>Email:</b> {bsInfor?.email}</p>
                        </div>
                        <div className="flex flex-col gap-2" md={10} sm={24}>
                            <p className="font-bold text-lg"><u>Bên thuê (Bên B)</u></p>
                            <p className={`text-sm ${isDifferent(v1?.partner.partnerName, v2?.partner.partnerName) ? "bg-yellow-300" : ""}`}>
                                <b>Tên công ty:</b> {v1?.partner.partnerName}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partner.address, v2?.partner.address) ? "bg-yellow-300" : ""}`}>
                                <b>Địa chỉ trụ sở chính:</b> {v1?.partner.address}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partner.spokesmanName, v2?.partner.spokesmanName) ? "bg-yellow-300" : ""}`}>
                                <b>Người đại diện:</b> {v1?.partner.spokesmanName}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partner.position, v2?.partner.position) ? "bg-yellow-300" : ""}`}>
                                <b>Chức vụ:</b> {v1?.partner?.position}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partner.taxCode, v2?.partner.taxCode) ? "bg-yellow-300" : ""}`}>
                                <b>Mã số thuế:</b> {v1?.partner.taxCode}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partner.email, v2?.partner.email) ? "bg-yellow-300" : ""}`}>
                                <b>Email:</b> {v1?.partner.email}
                            </p>
                        </div>

                    </div>
                    {/* LegalBasisTerms */}
                    <div className="mt-4">
                        <h3 className="font-semibold"><u>1. Căn cứ pháp lý</u></h3>
                        {differencesLegalBasic.unchanged.map((term, index) => (
                            <div >
                                <p>- <i>{term.value}</i></p>
                            </div>
                        ))}
                        {differencesLegalBasic.added.map((term, index) => (
                            <div className='bg-yellow-300 my-2'>
                                <p>- <i>{term.value}</i></p>
                            </div>
                        ))}
                        {differencesLegalBasic.removed.map((term, index) => (
                            <div className='bg-red-400'>
                                <p>- <i>{term.value}</i></p>
                            </div>
                        ))}
                    </div>

                    <p className="font-semibold mt-4 mb-3"><u>2. NỘI DUNG HỢP ĐỒNG</u></p>
                    <div
                        className="ml-1"
                        dangerouslySetInnerHTML={{ __html: highlightDifferences(v1.contractContent, v2.contractContent) || "Chưa nhập" }}
                    />
                    {/* PaymentSchedules */}
                    <div className="mt-4">
                        <h3 className="font-semibold">3. GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</h3>
                        {v2.autoAddVAT && (
                            <p className={`py-1 ${(isDifferent(v1.autoAddVAT, v2.autoAddVAT) || (isDifferent(v1.vatPercentage, v2.vatPercentage))) ? 'bg-yellow-300 px-1' : ''}`}>
                                <b>- Thêm phí VAT: </b> {v2?.vatPercentage} %
                            </p>
                        )}
                        {v2.isDateLateChecked && (
                            <p className={`py-1 ${(isDifferent(v1.isDateLateChecked, v2.isDateLateChecked) || (isDifferent(v1.maxDateLate, v2.maxDateLate))) ? 'bg-yellow-300 px-1' : ''}`}>
                                <b> - Cho phép thanh toán trễ tối đa: </b> {v2?.maxDateLate} (Ngày)
                            </p>
                        )}
                        {v2.autoRenew && (
                            <p className={`py-1 ${isDifferent(v1.autoRenew, v2.autoRenew) ? 'bg-yellow-300 px-1' : ''}`}>
                                - Hợp đồng sẽ tự gia hạn khi hết hạn nếu không có bất kỳ thông báo nào từ 2 bên
                            </p>
                        )}
                        <p className={`mb-3 ${isDifferent(v1.paymentSchedules.length, v2.paymentSchedules.length) ? 'bg-yellow-300 px-1' : ''}`}><b >
                            -  Số lần thanh toán:</b> {v2.paymentSchedules?.length}
                        </p>
                        {v2.paymentSchedules.map((schedule, index) => {
                            const v1Schedule = v1.paymentSchedules.find(s => s.paymentOrder === schedule.paymentOrder) || {};

                            return (
                                <div key={index} className="p-4  rounded">
                                    <p>{index + 1 > 1 && <b>lần {index + 1}: </b>}</p>
                                    <div className='ml-3'>
                                        <p className={`${isDifferent(schedule.amount, v1Schedule.amount) ? 'bg-yellow-300 px-1' : ''}`}>
                                            <strong>Số tiền: </strong>
                                            <span >
                                                {schedule.amount} VNĐ
                                            </span>
                                        </p>
                                        <p className={`${isDifferent(schedule.notifyPaymentDate, v1Schedule.notifyPaymentDate) ? 'bg-yellow-300 px-1' : ''}`}>
                                            <strong>Ngày thông báo thanh toán:</strong>
                                            <span >
                                                {formatDate(schedule.notifyPaymentDate)}
                                            </span>
                                        </p>
                                        <p className={`${isDifferent(schedule.paymentDate, v1Schedule.paymentDate) ? 'bg-yellow-300 px-1' : ''}`}>
                                            <strong>Ngày thanh toán:</strong>
                                            <span >
                                                {formatDate(schedule.paymentDate)}
                                            </span>
                                        </p>
                                        <p className={`${isDifferent(schedule.paymentMethod, v1Schedule.paymentMethod) ? 'bg-yellow-300 px-1' : ''}`}>
                                            <strong>Phương thức thanh toán: </strong>
                                            <span >
                                                {schedule.paymentMethod}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* AdditionalConfig */}
                    <div>
                        <h3 className="font-semibold ">4. ĐIỀU KHOẢN</h3>
                        {Object.keys(compareTerm).map((key) => {
                            const { Common, A, B } = compareTerm[key];
                            return (
                                <div key={key} className="mb-6">
                                    <h2 className="font-medium mt-3 text-blue-600">{termTitles[key] || `Nhóm ${key}`}</h2>

                                    {/* Hiển thị Common */}
                                    {Common && (
                                        <div className='flex flex-col gap-2 ml-3'>
                                            {Common.unchanged.length > 0 && (
                                                <p className="p-1 mb-1"> {Common.unchanged.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                            {Common.added.length > 0 && (
                                                <p className='bg-yellow-300 p-1 mb-1'> {Common.added.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                            {Common.removed.length > 0 && (
                                                <p className='bg-red-400 p-1 mb-1'> {Common.removed.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Hiển thị A */}
                                    {A && (
                                        <div className='flex flex-col gap 2 ml-3 my-3'>
                                            <p className='font-bold'>Riêng bên A</p>
                                            {A.unchanged.length > 0 && (
                                                <p className='p-1 mb-1'> {A.unchanged.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                            {A.added.length > 0 && (
                                                <p className='bg-yellow-300 p-1 mb-1'> {A.added.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                            {A.removed.length > 0 && (
                                                <p className='bg-red-400 p-1 mb-1'> {A.removed.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Hiển thị B */}
                                    {B && (
                                        <div className='flex flex-col gap 2 ml-3'>
                                            <p className='font-bold'>Riêng bên B</p>
                                            {B.unchanged.length > 0 && (
                                                <p className='p-1 mb-1'> {B.unchanged.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                            {B.added.length > 0 && (
                                                <p className='bg-yellow-300 p-1 mb-1'> {B.added.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                            {B.removed.length > 0 && (
                                                <p className='bg-red-400 p-1 mb-1'> {B.removed.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    {(v2.appendixEnabled === true || v2.violate === true || v2.transferEnabled === true || v2.suspend == true) && (
                        <div>
                            <h1 className='font-semibold'>5. PHỤ LỤC VÀ CÁC NỘI DUNG KHÁC</h1>
                            {v2.appendixEnabled && (
                                <p className={`py-1   ${(isDifferent(v1.appendixEnabled, v2.appendixEnabled))
                                    ? 'bg-yellow-300 px-1' : ''}`}>
                                    - Cho phép tạo phụ lục khi hợp đồng đang có hiệu lực pháp lý
                                </p>
                            )}
                            {v2.transferEnabled && (
                                <p className={`py-1   ${(isDifferent(v1.transferEnabled, v2.transferEnabled))
                                    ? 'bg-yellow-300 px-1' : ''}`}>
                                    - Cho phép chuyển nhượng hợp đồng
                                </p>
                            )}
                            {v2.violate && (
                                <p className={`py-1   ${(isDifferent(v1.violate, v2.violate))
                                    ? 'bg-yellow-300 px-1' : ''}`}>
                                    - Cho phép đơn phương hủy hợp đồng nếu vi phạm nghiêm trọng các quy định trong điều khoản hợp đồng
                                </p>
                            )}
                            {v2.suspend && (
                                <p className={`${(isDifferent(v1.suspend, v2.suspend)) || (isDifferent(v1.suspendContent, v2.suspendContent))
                                    ? 'bg-yellow-300 px-1' : ''}`}>
                                    - Cho phép tạm ngưng hợp đồng trong các trường hợp bất khả kháng được ghi rõ: <p>{v1.suspendContent}</p>
                                </p>
                            )}
                        </div>
                    )}
                    <div className='w-full flex justify-center mt-10 items-center pb-24' >
                        <div className='flex flex-col gap-2 px-[9%] text-center'>
                            <p className='text-lg'><b>ĐẠI DIỆN BÊN A</b></p>
                            <p className={`${isDifferent(v1?.partner.partnerName, v2?.partner.partnerName) ? "bg-yellow-300" : ""}`}>
                                <b> {process[0]?.partner.partnerName.toUpperCase()}</b></p>
                            <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                        </div>
                        <div className='flex flex-col gap-2 px-[9%] text-center'>
                            <p className='text-lg'><b>ĐẠI DIỆN BÊN B</b></p>
                            <p><b> {bsInfor?.representativeName?.toUpperCase()}</b></p>
                            <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Compare