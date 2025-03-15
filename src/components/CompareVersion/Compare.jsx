import React from 'react'
import { useParams } from 'react-router-dom'
import { useGetDataContractCompareVersionQuery } from '../../services/ContractAPI'
import { Col, Row, Tag } from 'antd'
import { useSelector } from 'react-redux'
import { formatSigningDate } from '../../utils/ConvertTime'
import { useGetBussinessInformatinQuery } from '../../services/BsAPI'

const Compare = () => {
    const { contractId } = useParams()
    const { nowVersion } = useParams()
    const { preVersion } = useParams()
    const { data: process } = useGetDataContractCompareVersionQuery({ contractId, version1: nowVersion, version2: preVersion });
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);
    console.log(process);

    const { data: bsInfor, isLoading: isLoadingBsData } = useGetBussinessInformatinQuery();
    if (!process || process.length < 2) {
        return <div>Loading or insufficient data...</div>;
    }

    const v1 = process[0]; // Version 14
    const v2 = process[1]; // Version 15
    console.log(v1);

    // Hàm định dạng ngày từ mảng sang chuỗi
    const formatDate = (dateArray) => {
        if (!dateArray) return 'N/A';
        const [year, month, day, hour, minute] = dateArray;
        return `Ngày ${day.toString().padStart(2, '0')} tháng ${month.toString().padStart(2, '0')} năm ${year}`;
    };

    const formatDateWithTime = (dateArray) => {
        if (!dateArray) return 'N/A';
        const [year, month, day, hour, minute] = dateArray;
        return `Ngày ${day.toString().padStart(2, '0')} tháng ${month.toString().padStart(2, '0')} năm ${year}- ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    };

    // Hàm so sánh hai giá trị
    const isDifferent = (val1, val2) => {
        if (Array.isArray(val1) && Array.isArray(val2)) {
            return JSON.stringify(val1) !== JSON.stringify(val2);
        }
        if (typeof val1 === 'object' && typeof val2 === 'object' && val1 !== null && val2 !== null) {
            return JSON.stringify(val1) !== JSON.stringify(val2);
        }
        return val1 !== val2;
    };

    // Danh sách các trường để hiển thị
    const fields = [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Tiêu đề' },
        { key: 'contractNumber', label: 'Số hợp đồng' },
        { key: 'status', label: 'Trạng thái' },
        { key: 'createdAt', label: 'Ngày tạo', format: formatDate },
        { key: 'updatedAt', label: 'Ngày cập nhật', format: formatDate },
        { key: 'signingDate', label: 'Ngày ký', format: formatDate },
        { key: 'contractLocation', label: 'Địa điểm hợp đồng' },
        { key: 'amount', label: 'Số tiền' },
        { key: 'contractTypeId', label: 'Loại hợp đồng' },
        { key: 'effectiveDate', label: 'Ngày hiệu lực', format: formatDate },
        { key: 'expiryDate', label: 'Ngày hết hạn', format: formatDate },
        { key: 'notifyEffectiveDate', label: 'Ngày thông báo hiệu lực', format: formatDate },
        { key: 'notifyExpiryDate', label: 'Ngày thông báo hết hạn', format: formatDate },
        { key: 'notifyEffectiveContent', label: 'Nội dung thông báo hiệu lực' },
        { key: 'notifyExpiryContent', label: 'Nội dung thông báo hết hạn' },
        { key: 'specialTermsA', label: 'Điều khoản đặc biệt A' },
        { key: 'specialTermsB', label: 'Điều khoản đặc biệt B' },
        { key: 'contractContent', label: 'Nội dung hợp đồng' },
        { key: 'appendixEnabled', label: 'Cho phép phụ lục' },
        { key: 'transferEnabled', label: 'Cho phép chuyển nhượng' },
        { key: 'autoAddVAT', label: 'Tự động thêm VAT' },
        { key: 'vatPercentage', label: 'Phần trăm VAT' },
        { key: 'isDateLateChecked', label: 'Kiểm tra ngày trễ' },
        { key: 'maxDateLate', label: 'Số ngày trễ tối đa' },
        { key: 'autoRenew', label: 'Tự động gia hạn' },
        { key: 'violate', label: 'Vi phạm' },
        { key: 'suspend', label: 'Tạm ngưng' },
        { key: 'suspendContent', label: 'Nội dung tạm ngưng' },
        { key: 'version', label: 'Phiên bản' },
        { key: 'originalContractId', label: 'ID hợp đồng gốc' },
    ];

    // Tìm các trường khác nhau
    const differences = fields.filter(field => isDifferent(v1[field.key], v2[field.key]));

    // So sánh đối tượng user
    const userDifferences = Object.keys(v1.user).filter(key => isDifferent(v1.user[key], v2.user[key]));

    // So sánh đối tượng partner
    const partnerDifferences = Object.keys(v1.partner).filter(key => isDifferent(v1.partner[key], v2.partner[key]));

    // So sánh mảng legalBasisTerms
    const legalBasisTermsDifferences = v1.legalBasisTerms.map((term, index) =>
        isDifferent(term, v2.legalBasisTerms[index])
    );

    // So sánh mảng additionalTerms
    const additionalTermsDifferences = v1.additionalTerms.map((term, index) =>
        isDifferent(term, v2.additionalTerms[index])
    );

    // So sánh mảng paymentSchedules
    const paymentSchedulesDifferences = v1.paymentSchedules.map((schedule, index) =>
        isDifferent(schedule, v2.paymentSchedules[index])
    );

    // Hàm so sánh additionalConfig
    const compareAdditionalConfig = (config1, config2) => {
        const allKeys = new Set([...Object.keys(config1), ...Object.keys(config2)]);
        const diffs = [];
        allKeys.forEach(key => {
            const c1 = config1[key] || { A: [], B: [], Common: [] };
            const c2 = config2[key] || { A: [], B: [], Common: [] };
            ['A', 'B', 'Common'].forEach(section => {
                if (isDifferent(c1[section], c2[section])) {
                    diffs.push({
                        key,
                        section,
                        v1: c1[section],
                        v2: c2[section]
                    });
                }
            });
        });
        return diffs;
    };

    // Sử dụng hàm để lấy các điểm khác nhau
    const additionalConfigDifferences = compareAdditionalConfig(v1.additionalConfig, v2.additionalConfig);

    const findDifferences = () => {
        const ids1 = v1.legalBasisTerms.map(item => item.original_term_id);
        const ids2 = v2.legalBasisTerms.map(item => item.original_term_id);

        const uniqueIds1 = ids1.filter(id => !ids2.includes(id));
        const uniqueIds2 = ids2.filter(id => !ids1.includes(id));
        const commonIds = ids1.filter(id => ids2.includes(id));

        return {
            v1_different: v1.legalBasisTerms.filter(item => uniqueIds1.includes(item.original_term_id)),
            v2_different: v2.legalBasisTerms.filter(item => uniqueIds2.includes(item.original_term_id)),
            common: v1.legalBasisTerms.filter(item => commonIds.includes(item.original_term_id))
        };
    };
    const differencesLegalBasic = findDifferences();

    const compareVersionsTerms = () => {
        let result = {};

        const keys = new Set([...Object.keys(v1?.additionalConfig), ...Object.keys(v2?.additionalConfig)]);

        keys.forEach(key => {
            const group1 = v1.additionalConfig[key] || { A: [], B: [], Common: [] };
            const group2 = v2.additionalConfig[key] || { A: [], B: [], Common: [] };

            // Tìm sự khác biệt
            const findDifferences = (list1, list2) => {
                const ids2 = new Set(list2.map(item => item.original_term_id));
                return list1.filter(item => !ids2.has(item.original_term_id));
            };

            // Tìm phần giống nhau
            const findSame = (list1, list2) => {
                const ids2 = new Set(list2.map(item => item.original_term_id));
                return list1.filter(item => ids2.has(item.original_term_id));
            };

            // So sánh Common
            const differentCommon = findDifferences(group1.Common, group2.Common).concat(findDifferences(group2.Common, group1.Common));
            const sameCommon = findSame(group1.Common, group2.Common);

            // Gom sự khác biệt của A và B
            const differentA = findDifferences(group1.A, group2.A).concat(findDifferences(group2.A, group1.A));
            const differentB = findDifferences(group1.B, group2.B).concat(findDifferences(group2.B, group1.B));

            // Tìm điểm chung giữa A và B
            const sameAB = findSame(group1.A, group2.A).concat(findSame(group1.B, group2.B));
            const sameA = findSame(group1.A, group2.A);
            const sameB = findSame(group1.B, group2.B);

            result[key] = {
                differentA,
                differentB,
                sameA,
                sameB,
                SameAB: sameAB,
                differentCommon,
                SameCommon: sameCommon
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
    console.log(compareTerm)
    return (
        <div className="min-h-screen p-4 bg-gray-50">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">So sánh hai phiên bản hợp đồng</h1>

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
                    <Row gutter={16} className="flex flex-col mt-5 pl-2 gap-5" justify="center">
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


                        {/* <div className="pl-2">
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
                                    {contractData.data.specialTermsA && contractData.data.specialTermsA.trim() !== "" && (
                                        <p className="text-sm">- {contractData.data.specialTermsA}</p>
                                    )}
                                </div>
                            )}
                            {groupedTerms.B.length > 0 && (
                                <div className="term-group mb-2">
                                    <p className="font-bold">Điều khoản riêng bên B</p>
                                    {groupedTerms.B.map((termId, index) => renderTerm(termId, index))}
                                    {contractData.data.specialTermsB && contractData.data.specialTermsB.trim() !== "" && (
                                        <p className="text-sm">- {contractData.data.specialTermsB}</p>
                                    )}
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
                </div> */}
                    </Row>
                    {/* LegalBasisTerms */}
                    <div className="mt-4">
                        <h3 className="font-semibold text-lg mb-2">Căn cứ pháp lý</h3>
                        {differencesLegalBasic.common.map((term, index) => (
                            <div className='flex flex-col gap-1'>
                                <p><i>- {term.value}</i></p>
                            </div>
                        ))}
                        {differencesLegalBasic.v1_different.map((term, index) => (
                            <p className='bg-yellow-300'>{index + 1}. {term.value}</p>
                        ))}
                    </div>

                    {/* PaymentSchedules */}
                    <div className="mt-4">
                        <h3 className="font-semibold">GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</h3>
                        {v1.autoAddVAT && (
                            <p className='py-3'>
                                <b>- Thêm phí VAT: </b> {v1?.vatPercentage} %
                            </p>
                        )}
                        {v1.isDateLateChecked && (
                            <p className='py-3'>
                                <b> - Cho phép thanh toán trễ tối đa: </b> {v1?.maxDateLate} (Ngày)
                            </p>
                        )}
                        {v1.autoRenew && (
                            <p className='py-3'>
                                - Hợp đồng sẽ tự gia hạn khi hết hạn mà không có bất kỳ thông báo nào
                            </p>
                        )}

                        {v1.paymentSchedules.map((schedule, index) => {
                            const v2Schedule = v2.paymentSchedules[index] || {};
                            return (
                                <div key={index} className="p-4 mb-4 rounded">
                                    <p><b className={`mb-3 ${isDifferent(schedule.amount, v2Schedule.amount) ? 'bg-yellow-300 px-1' : ''}`}>
                                        Số lần thanh toán:</b> {v1.paymentSchedules?.length}</p>
                                    <p>{index + 1 > 1 && <b>lần {index + 1}: </b>}</p>
                                    <div className='ml-3'>
                                        <p>
                                            <strong>Số tiền: </strong>
                                            <span className={`${isDifferent(schedule.amount, v2Schedule.amount) ? 'bg-yellow-300 px-1' : ''}`}>
                                                {schedule.amount} VNĐ
                                            </span>
                                        </p>
                                        <p>
                                            <strong>Ngày thông báo thanh toán:</strong>
                                            <span className={`${isDifferent(schedule.notifyPaymentDate, v2Schedule.notifyPaymentDate) ? 'bg-yellow-300 px-1' : ''}`}>
                                                {formatDate(schedule.notifyPaymentDate)}
                                            </span>
                                        </p>
                                        <p>
                                            <strong>Ngày thanh toán:</strong>
                                            <span className={`${isDifferent(schedule.paymentDate, v2Schedule.paymentDate) ? 'bg-yellow-300 px-1' : ''}`}>
                                                {formatDate(schedule.paymentDate)}
                                            </span>
                                        </p>
                                        <p>
                                            <strong>Phương thức thanh toán: </strong>
                                            <span className={`${isDifferent(schedule.paymentMethod, v2Schedule.paymentMethod) ? 'bg-yellow-300 px-1' : ''}`}>
                                                {schedule.paymentMethod}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })}

                    </div>
                    <div className="mt-4 flex flex-col gap-3">
                        <h3 className="font-semibold ">ĐIỀU KHOẢN</h3>
                        {Object.entries(v1.additionalConfig).map(([key, termData]) => {
                            const title = termTitles[key] || `Điều khoản ${key}`; // Lấy tiêu đề từ termTitles hoặc fallback
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
                                        <div className="p-2 mb-2">
                                            {commonTerms.map((item, index) => (
                                                <div key={index} className="mb-2">
                                                    <p>- {item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Hiển thị phần riêng của A nếu có */}
                                    {termsA.length > 0 && (
                                        <div className="p-2 mb-2 bg-blue-50">
                                            <p className="font-bold mb-2">Riêng bên A:</p>
                                            {termsA.map((item, index) => (
                                                <div key={index} className="mb-2">
                                                    <p>- {item.value}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Hiển thị phần riêng của B nếu có */}
                                    {termsB.length > 0 && (
                                        <div className="p-2 mb-2 bg-green-50">
                                            <p className="font-bold mb-2">Riêng bên B:</p>
                                            {termsB.map((item, index) => (
                                                <div key={index} className="mb-2">
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
                                <p className='py-3'>
                                    - Cho phép tạo phụ lục khi hợp đồng đang có hiệu lực pháp lý
                                </p>
                            )}
                            {v1.transferEnabled && (
                                <p className='py-3'>
                                    - Cho phép chuyển nhượng hợp đồng
                                </p>
                            )}
                            {v1.violate && (
                                <p className='py-3'>
                                    - Cho phép đơn phương hủy hợp đồng nếu vi phạm nghiêm trọng các quy định trong điều khoản hợp đồng
                                </p>
                            )}
                            {v1.suspend && (
                                <p className='py-3'>
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
                            <p><b> {bsInfor?.representativeName.toUpperCase()}</b></p>
                            <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                        </div>
                    </div>

                </div>


                {/* Phiên bản 15 */}
                <div className="bg-white p-4 rounded-lg shadow-md">
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
                            {v1.contractLocation}, Ngày {v1?.signingDate[2]} Tháng {v1?.signingDate[1]} Năm {v1?.signingDate[0]}
                        </p>
                        <p className={`text-2xl font-bold mt-10`}>
                            {v1.title.toUpperCase()}
                        </p>
                        <p className={`mt-3 `}><b>Số:</b> {v1.contractNumber}</p>
                    </div>
                    <Row gutter={16} className="flex flex-col mt-5 pl-2 gap-5" justify="center">
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

                    </Row>
                    {/* LegalBasisTerms */}
                    <div className="mt-4">
                        <h3 className="font-semibold text-lg">Căn cứ pháp lý</h3>
                        {v2.legalBasisTerms.map((term, index) => (
                            <div key={index} className={`${isDifferent(term, v1.legalBasisTerms[index]) ? 'bg-yellow-300' : ''}`}>
                                <p>- <i>{term.value}</i></p>
                            </div>
                        ))}
                    </div>
                    {/* AdditionalTerms */}
                    <div className="mt-4">
                        <h3 className="font-semibold text-gray-600">Additional Terms</h3>
                        {v2.additionalTerms.map((term, index) => (
                            <div key={index} className={`${isDifferent(term, v1.additionalTerms[index]) ? 'bg-yellow-300' : ''}`}>
                                <p><strong>Name:</strong> {term.name}</p>
                                <p><strong>Identifier:</strong> {term.identifier}</p>
                                <p><strong>Original Term ID:</strong> {term.original_term_id}</p>
                            </div>
                        ))}
                    </div>
                    {/* PaymentSchedules */}
                    <div className="mt-4">
                        <h3 className="font-semibold text-gray-600">Payment Schedules</h3>
                        {v2.paymentSchedules.map((schedule, index) => (
                            <div key={index} className={`${isDifferent(schedule, v1.paymentSchedules[index]) ? 'bg-yellow-300' : ''}`}>
                                <p><strong>ID:</strong> {schedule.id}</p>
                                <p><strong>Payment Order:</strong> {schedule.paymentOrder}</p>
                                <p><strong>Amount:</strong> {schedule.amount}</p>
                                <p><strong>Notify Payment Date:</strong> {formatDate(schedule.notifyPaymentDate)}</p>
                                <p><strong>Payment Date:</strong> {formatDate(schedule.paymentDate)}</p>
                                <p><strong>Status:</strong> {schedule.status ?? 'N/A'}</p>
                                <p><strong>Payment Method:</strong> {schedule.paymentMethod}</p>
                                <p><strong>Notify Payment Content:</strong> {schedule.notifyPaymentContent}</p>
                                <p><strong>Reminder Email Sent:</strong> {schedule.reminderEmailSent.toString()}</p>
                                <p><strong>Overdue Email Sent:</strong> {schedule.overdueEmailSent.toString()}</p>
                            </div>
                        ))}
                    </div>
                    {/* AdditionalConfig */}
                    <div className="mt-4">
                        <h3 className="font-semibold text-gray-600">Additional Config</h3>
                        {Object.entries(v2.additionalConfig).map(([key, config]) => {
                            const otherConfig = v1.additionalConfig[key] || { A: [], B: [], Common: [] };
                            return (
                                <div key={key} className="mb-4">
                                    <h4 className="font-medium">Config {key}</h4>
                                    {['A', 'B', 'Common'].map(section => (
                                        <div key={section} className={`${isDifferent(config[section], otherConfig[section]) ? 'bg-yellow-300' : ''} p-2 mb-2`}>
                                            <h5 className="font-semibold">Section {section}</h5>
                                            {config[section].map((item, index) => (
                                                <div key={index} className="mb-2">
                                                    <p><strong>Label:</strong> {item.label}</p>
                                                    <p><strong>Value:</strong> {item.value}</p>
                                                    <p><strong>Original Term ID:</strong> {item.original_term_id}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Hiển thị các dữ liệu khác nhau */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Dữ liệu khác nhau giữa hai phiên bản</h2>
                {differences.length > 0 || userDifferences.length > 0 || partnerDifferences.length > 0 || legalBasisTermsDifferences.some(diff => diff) || additionalTermsDifferences.some(diff => diff) || paymentSchedulesDifferences.some(diff => diff) ? (
                    <ul className="list-disc pl-6">
                        {differences.map(field => (
                            <li key={field.key}>
                                <strong>{field.label}</strong>:
                                {' '}{field.format ? field.format(v1[field.key]) : v1[field.key] ?? 'N/A'} (v14)
                                {' vs '}{field.format ? field.format(v2[field.key]) : v2[field.key] ?? 'N/A'} (v15)
                            </li>
                        ))}
                        {userDifferences.map(key => (
                            <li key={`user-${key}`}>
                                <strong>User {key}</strong>: {v1.user[key]} (v14) vs {v2.user[key]} (v15)
                            </li>
                        ))}
                        {partnerDifferences.map(key => (
                            <li key={`partner-${key}`}>
                                <strong>Partner {key}</strong>: {v1.partner[key] ?? 'N/A'} (v14) vs {v2.partner[key] ?? 'N/A'} (v15)
                            </li>
                        ))}
                        {legalBasisTermsDifferences.map((diff, index) => diff && (
                            <li key={`legalBasisTerms-${index}`}>
                                <strong>Legal Basis Term {index + 1}</strong>:
                                {JSON.stringify(v1.legalBasisTerms[index])} (v14) vs {JSON.stringify(v2.legalBasisTerms[index])} (v15)
                            </li>
                        ))}
                        {additionalTermsDifferences.map((diff, index) => diff && (
                            <li key={`additionalTerms-${index}`}>
                                <strong>Additional Term {index + 1}</strong>:
                                {JSON.stringify(v1.additionalTerms[index])} (v14) vs {JSON.stringify(v2.additionalTerms[index])} (v15)
                            </li>
                        ))}
                        {paymentSchedulesDifferences.map((diff, index) => diff && (
                            <li key={`paymentSchedules-${index}`}>
                                <strong>Payment Schedule {index + 1}</strong>:
                                {JSON.stringify(v1.paymentSchedules[index])} (v14) vs {JSON.stringify(v2.paymentSchedules[index])} (v15)
                            </li>
                        ))}
                        {/* Hiển thị các dữ liệu khác nhau */}
                        <div className="mt-8">
                            {differences.length > 0 || userDifferences.length > 0 || partnerDifferences.length > 0 || legalBasisTermsDifferences.some(diff => diff) || additionalTermsDifferences.some(diff => diff) || paymentSchedulesDifferences.some(diff => diff) || additionalConfigDifferences.length > 0 ? (
                                <ul className="list-disc pl-6">
                                    {/* ... Các phần khác ... */}

                                    {/* Additional Config Differences */}
                                    {additionalConfigDifferences.map((diff, index) => (
                                        <li key={`additionalConfig-${index}`} className="mb-2">
                                            <strong>Additional Config {diff.key} - Section {diff.section}</strong>:
                                            <div className="ml-4">
                                                <p className="text-sm">Version 14: {diff.v1.length > 0 ? (
                                                    diff.v1.map((item, idx) => (
                                                        <span key={idx}>{item.label}: {item.value} (ID: {item.original_term_id}){idx < diff.v1.length - 1 ? ', ' : ''}</span>
                                                    ))
                                                ) : 'N/A'}</p>
                                                <p className="text-sm">Version 15: {diff.v2.length > 0 ? (
                                                    diff.v2.map((item, idx) => (
                                                        <span key={idx}>{item.label}: {item.value} (ID: {item.original_term_id}){idx < diff.v2.length - 1 ? ', ' : ''}</span>
                                                    ))
                                                ) : 'N/A'}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-600">Không có sự khác biệt giữa hai phiên bản.</p>
                            )}
                        </div>
                    </ul>
                ) : (
                    <p className="text-gray-600">Không có sự khác biệt giữa hai phiên bản.</p>
                )}
            </div>
        </div>
    );
}

export default Compare