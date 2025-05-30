import React from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGetDataContractCompareVersionQuery } from '../../services/ContractAPI'
import { Spin, Tag, Table, Button } from 'antd'
import { useSelector } from 'react-redux'
import { useGetBussinessInformatinQuery } from '../../services/BsAPI'
import { diffWords } from 'diff';
import dayjs from 'dayjs';
import { formatDateToStringDate } from '../../utils/ConvertTime'
import { RightSquareOutlined } from '@ant-design/icons'

const Compare = () => {
    const { contractId } = useParams()
    const { nowVersion } = useParams()
    const { preVersion } = useParams()
    const navigate = useNavigate()
    const { data: process } = useGetDataContractCompareVersionQuery({ contractId, version1: nowVersion, version2: preVersion == 0 ? 1 : preVersion });
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);


    const { data: bsInfor, isLoading: isLoadingBsData } = useGetBussinessInformatinQuery();

    if (!process) {
        return <div>Loading or insufficient data...</div>;
    }

    const [v1, v2] = [...process].sort((a, b) => a.id - b.id);


    const stripHtml = (html) => html.replace(/<\/?[^>]+(>|$)/g, "");

    const highlightDifferences = (content1, content2) => {
        const text1 = stripHtml(content1);
        const text2 = stripHtml(content2);
        const differences = diffWords(text1, text2);

        return differences
            .map(part => {
                if (part.added) {
                    return `<span style="background: #fde047; color: green;">${part.value}</span>`;
                }
                if (part.removed) {
                    return `<span style="background: #f87171; color: red; text-decoration: line-through;">${part.value}</span>`;
                }
                return part.value;
            })
            .join('');
    };

    // const highlightDifferences = (content1, content2) => {
    //     if (window.HtmlDiff) {
    //         return window.HtmlDiff.execute(content1, content2);
    //     } else {
    //         console.error("HtmlDiff chưa được tải!");
    //         return content1; // Hoặc xử lý lỗi theo cách bạn muốn
    //     }
    // };

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
    const findDifferencesGenarealTerms = () => {
        const ids1 = v1.generalTerms.map(item => item.original_term_id);
        const ids2 = v2.generalTerms.map(item => item.original_term_id);

        return {
            unchanged: v1.generalTerms.filter(item => ids2.includes(item.original_term_id)), // Không thay đổi
            removed: v1.generalTerms.filter(item => !ids2.includes(item.original_term_id)),  // Bị xóa đi
            added: v2.generalTerms.filter(item => !ids1.includes(item.original_term_id))     // Được thêm vào
        };
    };

    const differencesLegalBasic = findDifferences();
    const differencesGenarealTerms = findDifferencesGenarealTerms()

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

    const paymentSchedulesColumns = [
        {
            title: 'Đợt',
            dataIndex: 'paymentOrder',
            key: 'paymentOrder',
            align: 'center',
        },
        {
            title: 'Số tiền (VND)',
            dataIndex: 'amount',
            key: 'amount',
            render: (value, record) => {
                const v1Schedule = v1.paymentSchedules.find(s => s.paymentOrder === record.paymentOrder);
                const isDifferent = v1Schedule && v1Schedule.amount !== value;
                return (
                    <span className={isDifferent ? 'bg-yellow-300 text-green-800 px-1' : ''}>
                        {new Intl.NumberFormat('vi-VN').format(value)}
                    </span>
                );
            },
        },
        {
            title: 'Ngày thanh toán',
            dataIndex: 'paymentDate',
            key: 'paymentDate',
            render: (paymentDate, record) => {
                const v1Schedule = v1.paymentSchedules.find(s => s.paymentOrder === record.paymentOrder);
                const isDifferent = v1Schedule && formatDate(v1Schedule.paymentDate) !== (formatDate(paymentDate));
                return (
                    <span className={isDifferent ? 'bg-yellow-300 text-green-800 px-1' : ''}>
                        {formatDate(paymentDate)}
                    </span>
                );
            },
        },
        {
            title: 'Phương thức thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method, record) => {
                const v1Schedule = v1.paymentSchedules.find(s => s.paymentOrder === record.paymentOrder);
                const isDifferent = v1Schedule && v1Schedule.paymentMethod !== method;
                const methodText = method === 'cash'
                    ? 'Tiền mặt'
                    : method === 'creditCard'
                        ? 'Thẻ tín dụng'
                        : 'Chuyển khoản';
                return (
                    <span className={isDifferent ? 'bg-yellow-300 text-green-800 px-1' : ''}>
                        {methodText}
                    </span>
                );
            },
        },
    ];
    const paymentSchedulesColumnsNoDifferent = [
        {
            title: 'Đợt',
            dataIndex: 'paymentOrder',
            key: 'paymentOrder',
            align: 'center',
        },
        {
            title: 'Số tiền (VND)',
            dataIndex: 'amount',
            key: 'amount',
            render: (value, record) => {
                const v1Schedule = v1.paymentSchedules.find(s => s.paymentOrder === record.paymentOrder);
                const isDifferent = v1Schedule && v1Schedule.amount !== value;
                return (
                    <span >
                        {new Intl.NumberFormat('vi-VN').format(value)}
                    </span>
                );
            },
        },
        {
            title: 'Ngày thanh toán',
            dataIndex: 'paymentDate',
            key: 'paymentDate',
            render: (paymentDate, record) => {
                const v1Schedule = v1.paymentSchedules.find(s => s.paymentOrder === record.paymentOrder);
                const isDifferent = v1Schedule && !dayjs(v1Schedule.paymentDate).isSame(dayjs(paymentDate));
                return (
                    <span >
                        {formatDate(paymentDate)}
                    </span>
                );
            },
        },
        {
            title: 'Phương thức thanh toán',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            render: (method, record) => {
                const v1Schedule = v1.paymentSchedules.find(s => s.paymentOrder === record.paymentOrder);
                const isDifferent = v1Schedule && v1Schedule.paymentMethod !== method;
                const methodText = method === 'cash'
                    ? 'Tiền mặt'
                    : method === 'creditCard'
                        ? 'Thẻ tín dụng'
                        : 'Chuyển khoản';
                return (
                    <span >
                        {methodText}
                    </span>
                );
            },
        },
    ];

    const paymentItemsColumns = [
        {
            title: 'STT',
            dataIndex: 'itemOrder',
            key: 'itemOrder',
            align: 'center',
        },
        {
            title: 'Nội dung',
            dataIndex: 'description',
            key: 'description',
            render: (value, record) => {
                const v1Item = v1.contractItems?.find(item =>
                    item.itemOrder === record.itemOrder &&
                    item.description === record.description
                );
                const isDifferent = v1Item && v1Item.description !== value;
                return (
                    <span className={isDifferent ? 'bg-yellow-300 text-green-800 px-1' : ''}>
                        {value}
                    </span>
                );
            },
        },
        {
            title: 'Số tiền (VND)',
            dataIndex: 'amount',
            key: 'amount',
            render: (value, record) => {
                const v1Item = v1.contractItems?.find(item =>
                    item.itemOrder === record.itemOrder &&
                    item.description === record.description
                );
                const isDifferent = v1Item && v1Item.amount !== value;
                return (
                    <span className={isDifferent ? 'bg-yellow-300 text-green-800 px-1' : ''}>
                        {new Intl.NumberFormat('vi-VN').format(value)}
                    </span>
                );
            },
        },
    ];


    const normalizeDescription = (desc) => desc.trim().toLowerCase();
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
            <Button
                type='primary'
                className='justify-self-end flex mb-4'
                onClick={() => navigate(`/manager/approvalContract/reviewContract/${v2?.id}/approve/${v2?.id}`)}
                icon={<RightSquareOutlined />}
                iconPosition='end'
            >
                Chuyển đến trang phê duyệt
            </Button>
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
                            {v1.title?.toUpperCase()}
                        </p>
                        <p className={`mt-3 `}><b>Số:</b> {v1.contractNumber}</p>
                    </div>
                    <div className="mt-4">
                        {/* <h3 className="font-semibold mb-2"><u>1. CĂN CỨ PHÁP LÝ</u></h3> */}
                        {v1.legalBasisTerms.map((term, index) => (
                            <div className='flex flex-col gap-1'>
                                <p><i>- {term.value}</i></p>
                            </div>
                        ))}
                    </div>
                    <div gutter={16} className="flex flex-col mt-5 pl-2 gap-5" justify="center">
                        <div className="flex flex-col gap-2" md={10} sm={24}>
                            <p className="font-bold text-lg"><u>BÊN CUNG CẤP (BÊN A)</u></p>
                            <p className="text-sm"><b>Tên công ty:</b> {v1?.partnerA.partnerName}</p>
                            <p className="text-sm"><b>Địa chỉ trụ sở chính:</b> {v1?.partnerA.partnerAddress}</p>
                            <p className="text-sm"><b>Người đại diện:</b> {v1?.partnerA.spokesmanName}</p>
                            <p className="text-sm"><b>Chức vụ:</b> {v1?.partnerA.position}</p>
                            <p className="text-sm"><b>Số điện thoại: </b> {v1?.partnerA.partnerPhone}</p>
                            <p className="text-sm"><b>Mã số thuế:</b> {v1?.partnerA.partnerTaxCode}</p>
                            <p className="text-sm"><b>Email:</b> {v1?.partnerA.partnerEmail}</p>
                        </div>
                        <div className="flex flex-col gap-2" md={10} sm={24}>
                            <p className="font-bold text-lg"><u>BÊN SỬ DỤNG (BÊN B)</u></p>
                            <p className={`text-sm `}>
                                <b>Tên công ty:</b> {v1?.partnerB.partnerName}
                            </p>
                            <p className={`text-sm `}>
                                <b>Địa chỉ trụ sở chính:</b> {v1?.partnerB.partnerAddress}
                            </p>
                            <p className={`text-sm `}>
                                <b>Người đại diện:</b> {v1?.partnerB.spokesmanName}
                            </p>
                            <p className={`text-sm `}>
                                <b>Chức vụ:</b> {v1?.partnerB?.position}
                            </p>
                            <p className="text-sm"><b>Số điện thoại: </b> {v1?.partnerB.partnerPhone}</p>

                            <p className={`text-sm `}>
                                <b>Mã số thuế:</b> {v1?.partnerB.partnerTaxCode}
                            </p>
                            <p className={`text-sm `}>
                                <b>Email:</b> {v1?.partnerB.partnerEmail}
                            </p>
                        </div>
                    </div>
                    {/* LegalBasisTerms */}

                    <p className="font-semibold mt-4 mb-3"><u>2. NỘI DUNG HỢP ĐỒNG</u></p>
                    <div
                        className="ml-1"
                        dangerouslySetInnerHTML={{ __html: stripHtml(v1.contractContent) || "Chưa nhập" }}
                    />

                    <div>
                        <h3 className="font-semibold mt-4 mb-2"><u>3. THỜI GIAN HIỆU LỰC</u></h3>
                        <p className={`py-1 flex gap-2`}>
                            <b> Ngày bắt đầu có hiệu lực: </b> {formatDateToStringDate(v2?.effectiveDate)}
                        </p>
                        <p className={`py-1 flex gap-2`}>
                            <b> Ngày bắt kết thúc hiệu lực: </b> {formatDateToStringDate(v2?.expiryDate)}
                        </p>
                    </div>
                    {/* PaymentSchedules */}
                    <div className="mt-4">
                        <h3 className="font-semibold mt-4 mb-3"><u>4. GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</u></h3>
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
                            - Số lần thanh toán:</b> {v1.paymentSchedules?.length}
                        </p>

                        <div className="mt-4">
                            <p className="ml-3 font-bold">
                                1. Hạng mục thanh toán
                            </p>
                            <Table
                                dataSource={v1.contractItems}
                                columns={paymentItemsColumns}
                                rowKey={(record) => `${record.itemOrder}-${record.description}`}
                                pagination={false}
                                bordered
                                className='mb-5'
                            // rowClassName={(record) => {
                            //     const v2Item = v2.contractItems?.find(item => 
                            //         item.itemOrder === record.itemOrder && 
                            //         item.description === record.description
                            //     );
                            //     if (!v2Item) {
                            //         return 'bg-red-300';
                            //     }
                            //     return '';
                            // }}
                            />
                        </div>
                        <Table
                            dataSource={v1.paymentSchedules}
                            columns={paymentSchedulesColumnsNoDifferent}
                            rowKey="paymentOrder"
                            pagination={false}
                            bordered
                        // rowClassName={(record) => {
                        //     const v2Schedule = v2.paymentSchedules.find(s => s.paymentOrder === record.paymentOrder);
                        //     if (!v2Schedule) {
                        //         return 'bg-red-100';
                        //     }
                        //     return '';
                        // }}
                        />
                    </div>
                    <div className="mt-4 flex flex-col">
                        <h3 className="font-semibold mt-4 mb-3"><u>5. ĐIỀU KHOẢN</u></h3>

                        <div className="mt-4">
                            <p className="font-medium mt-3 text-blue-600">ĐIỀU KHOẢN CHUNG 2 BÊN</p>
                            {v1.generalTerms.map((term, index) => (
                                <div className='flex flex-col gap-1'>
                                    <p>- {term.value}</p>
                                </div>
                            ))}
                        </div>

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
                            <h1 className='font-semibold'>6. PHỤ LỤC VÀ CÁC NỘI DUNG KHÁC</h1>
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
                            <p><b> {v1?.partnerA?.spokesmanName.toUpperCase()}</b></p>
                            <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                        </div>
                        <div className='flex flex-col gap-2 px-[9%] text-center'>
                            <p className='text-lg'><b>ĐẠI DIỆN BÊN B</b></p>
                            <p><b> {v1?.partnerB?.spokesmanName.toUpperCase()}</b></p>
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
                                'bg-yellow-300 px-1  text-green-800' : ''}`}>
                            {v2.contractLocation}, Ngày {v2?.signingDate[2]} Tháng {v2?.signingDate[1]} Năm {v2?.signingDate[0]}
                        </p>
                        <p className={`text-2xl font-bold mt-10 ${isDifferent(v1?.title, v2?.title) ? "bg-yellow-300" : ""}`}>
                            {v2.title?.toUpperCase()}
                        </p>
                        <p className={`mt-3 ${isDifferent(v1?.contractNumber, v2?.contractNumber) ? "bg-yellow-300 text-green-800" : ""} `}><b>Số:</b> {v2.contractNumber}</p>
                    </div>

                    <div className="mt-4">
                        {/* <h3 className="font-semibold mb-2"><u>1. CĂN CỨ PHÁP LÝ</u></h3> */}
                        {differencesLegalBasic.unchanged.map((term, index) => (
                            <div >
                                <p>- <i>{term.value}</i></p>
                            </div>
                        ))}
                        {differencesLegalBasic.added.map((term, index) => (
                            <div className='bg-green-300 my-2'>
                                <p>- <i>{term.value}</i></p>
                            </div>
                        ))}
                        {differencesLegalBasic.removed.map((term, index) => (
                            <div className='bg-red-400'>
                                <p>- <i>{term.value}</i></p>
                            </div>
                        ))}
                    </div>
                    <div gutter={16} className="flex flex-col mt-5 pl-2 gap-5" justify="center">
                        <div className="flex flex-col gap-2" md={10} sm={24}>
                            <p className="font-bold text-lg"><u>BÊN CUNG CẤP (BÊN A)</u></p>
                            <p className={`text-sm ${isDifferent(v1?.partnerA.partnerName, v2?.partnerA.partnerName) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Tên công ty:</b> {v2?.partnerA.partnerName}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerA.partnerAddress, v2?.partnerA.partnerAddress) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Địa chỉ trụ sở chính:</b>{v2?.partnerA.partnerAddress}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerA.spokesmanName, v2?.partnerA.spokesmanName) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Người đại diện:</b> {v2?.partnerA.spokesmanName}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerA.position, v2?.partnerA.position) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Chức vụ:</b> {v2?.partnerA.position}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerA.partnerPhone, v2?.partnerA.partnerPhone) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Số điện thoại: </b> {v2?.partnerA.partnerPhone}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerA.partnerTaxCode, v2?.partnerA.partnerTaxCode) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Mã số thuế:</b> {v2?.partnerA.partnerTaxCode}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerA.partnerEmail, v2?.partnerA.partnerEmail) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Email:</b> {v2?.partnerA.partnerEmail}
                            </p>
                        </div>
                        <div className="flex flex-col gap-2" md={10} sm={24}>
                            <p className="font-bold text-lg"><u>BÊN SỬ DỤNG (BÊN B)</u></p>
                            <p className={`text-sm ${isDifferent(v1?.partnerB.partnerName, v2?.partnerB.partnerName) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Tên công ty:</b> {v2?.partnerB.partnerName}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerB.partnerAddress, v2?.partnerB.partnerAddress) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Địa chỉ trụ sở chính:</b> {v2?.partnerB.partnerAddress}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerB.spokesmanName, v2?.partnerB.spokesmanName) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Người đại diện:</b> {v2?.partnerB.spokesmanName}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerB.position, v2?.partnerB.position) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Chức vụ:</b> {v2?.partnerB?.position}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerB.partnerPhone, v2?.partnerB.partnerPhone) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Số điện thoại: </b> {v2?.partnerB.partnerPhone}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerB.partnerTaxCode, v2?.partnerB.partnerTaxCode) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Mã số thuế:</b> {v2?.partnerB.partnerTaxCode}
                            </p>
                            <p className={`text-sm ${isDifferent(v1?.partnerB.partnerEmail, v2?.partnerB.partnerEmail) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b>Email:</b> {v2?.partnerB.partnerEmail}
                            </p>
                        </div>

                    </div>
                    {/* LegalBasisTerms */}


                    <p className="font-semibold mt-4 mb-3"><u>2. NỘI DUNG HỢP ĐỒNG</u></p>
                    <div
                        className="ml-1"
                        dangerouslySetInnerHTML={{ __html: highlightDifferences(v1.contractContent, v2.contractContent) || "Chưa nhập" }}
                    />

                    <div>
                        <h3 className="font-semibold mt-4 mb-2"><u>3. THỜI GIAN HIỆU LỰC</u></h3>
                        <p className={`py-1 flex gap-2${(isDifferent(v1.effectiveDate, v2.effectiveDate)) ? 'bg-yellow-300 text-green-800 px-1' : ''}`}>
                            <b> Ngày bắt đầu có hiệu lực: </b> {formatDateToStringDate(v2?.effectiveDate)}
                        </p>
                        <p className={`py-1 flex gap-2 ${(isDifferent(v1.expiryDate, v2.expiryDate)) ? 'bg-yellow-300 text-green-800 px-1' : ''}`}>
                            <b> Ngày bắt kết thúc hiệu lực: </b> {formatDateToStringDate(v2?.expiryDate)}
                        </p>
                    </div>
                    {/* PaymentSchedules */}
                    <div className="mt-4">
                        <h3 className="font-semibold mt-4 mb-3"><u>4. GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</u></h3>
                        {v2.autoAddVAT && (
                            <p className={`py-1 ${(isDifferent(v1.autoAddVAT, v2.autoAddVAT) || (isDifferent(v1.vatPercentage, v2.vatPercentage))) ? 'bg-yellow-300 text-green-800 px-1' : ''}`}>
                                <b>- Thêm phí VAT: </b> {v2?.vatPercentage} %
                            </p>
                        )}
                        {v2.isDateLateChecked && (
                            <p className={`py-1 ${(isDifferent(v1.isDateLateChecked, v2.isDateLateChecked) || (isDifferent(v1.maxDateLate, v2.maxDateLate))) ? 'bg-yellow-300 text-green-800 px-1' : ''}`}>
                                <b> - Cho phép thanh toán trễ tối đa: </b> {v2?.maxDateLate} (Ngày)
                            </p>
                        )}
                        {v2.autoRenew && (
                            <p className={`py-1 ${isDifferent(v1.autoRenew, v2.autoRenew) ? 'bg-yellow-300 text-green-800 px-1' : ''}`}>
                                - Hợp đồng sẽ tự gia hạn khi hết hạn nếu không có bất kỳ thông báo nào từ 2 bên
                            </p>
                        )}
                        <p className={`mb-3 ${isDifferent(v1.paymentSchedules.length, v2.paymentSchedules.length) ? 'bg-yellow-300 text-green-800 px-1' : ''}`}><b >
                            -  Số lần thanh toán:</b> {v2.paymentSchedules?.length}
                        </p>

                        <p className="ml-3 font-bold">
                            1. Hạng mục thanh toán
                        </p>
                        <Table
                            dataSource={[
                                ...v2.contractItems.map(item => ({
                                    ...item,
                                    status: 'current'
                                })),
                                ...v1.contractItems
                                    .filter(i1 => !v2.contractItems.some(i2 =>
                                        normalizeDescription(i2.description) === normalizeDescription(i1.description) &&
                                        Math.abs(i2.amount - i1.amount) < 1e-6
                                    ))
                                    .map(item => ({
                                        ...item,
                                        status: 'deleted'
                                    }))
                            ]}
                            columns={paymentItemsColumns}
                            rowKey={(record) => `${record.itemOrder}-${record.description}`}
                            pagination={false}
                            bordered
                            className='mb-5'
                            rowClassName={(record) => {
                                if (record.status === 'deleted') {
                                    return 'bg-red-300';
                                }
                                const v1Item = v1.contractItems?.find(item =>
                                    normalizeDescription(item.description) === normalizeDescription(record.description) &&
                                    Math.abs(item.amount - record.amount) < 1e-6
                                );
                                if (!v1Item) {
                                    return 'bg-green-300';
                                }
                                return '';
                            }}
                        />

                        <Table
                            dataSource={[
                                ...v2.paymentSchedules.map(schedule => ({
                                    ...schedule,
                                    status: 'current'
                                })),
                                ...v1.paymentSchedules
                                    .filter(s1 => !v2.paymentSchedules.some(s2 =>
                                        // s2.paymentOrder === s1.paymentOrder &&
                                        Math.abs(s2.amount - s1.amount) < 1e-6 &&
                                        s2.paymentMethod == s1.paymentMethod
                                    ))
                                    .map(schedule => ({
                                        ...schedule,
                                        status: 'deleted'
                                    }))
                            ]}
                            columns={paymentSchedulesColumns}
                            rowKey="paymentOrder"
                            pagination={false}
                            bordered
                            className='mb-5'
                            rowClassName={(record) => {
                                if (record.status === 'deleted') {
                                    return 'bg-red-300';
                                }
                                const v1Schedule = v1.paymentSchedules.find(s =>
                                    // s.paymentOrder === record.paymentOrder &&
                                    s.amount == record.amount &&
                                    s.paymentMethod == record.paymentMethod);
                                if (!v1Schedule) {
                                    return 'bg-green-300';
                                }
                                return '';
                            }}
                        />
                    </div>
                    {/* AdditionalConfig */}
                    <div className="mt-4 flex flex-col">
                        <h3 className="font-semibold mt-4 mb-3"><u>5. ĐIỀU KHOẢN</u></h3>


                        <div className="mt-4 mx-2">
                            <p className="font-medium mt-3 text-blue-600">ĐIỀU KHOẢN CHUNG 2 BÊN</p>
                            {differencesGenarealTerms.unchanged.map((term, index) => (
                                <div >
                                    <p>- {term.value}</p>
                                </div>
                            ))}
                            {differencesGenarealTerms.added.map((term, index) => (
                                <div className='bg-green-300 my-2'>
                                    <p>- {term.value}</p>
                                </div>
                            ))}
                            {differencesGenarealTerms.removed.map((term, index) => (
                                <div className='bg-red-400'>
                                    <p>- {term.value}</p>
                                </div>
                            ))}
                        </div>
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
                                                <p className='bg-yellow-300 text-green-800 p-1 mb-1'> {Common.added.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                            {Common.removed.length > 0 && (
                                                <p className='bg-red-400 p-1 mb-1'> {Common.removed.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Hiển thị A */}
                                    {(A && (A.unchanged.length > 0 || A.added.length > 0 || A.removed.length > 0)) && (
                                        <div className='flex flex-col gap 2 ml-3 my-3'>
                                            <p className='font-bold'>Riêng bên A</p>
                                            {A.unchanged.length > 0 && (
                                                <p className='p-1 mb-1'> {A.unchanged.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                            {A.added.length > 0 && (
                                                <p className='bg-green-300 p-1 mb-1'> {A.added.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                            {A.removed.length > 0 && (
                                                <p className='bg-red-400 p-1 mb-1'> {A.removed.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Hiển thị B */}
                                    {(B && (B.unchanged.length > 0 || B.added.length > 0 || B.removed.length > 0)) && (
                                        <div className='flex flex-col gap 2 ml-3'>
                                            <p className='font-bold'>Riêng bên B</p>
                                            {B.unchanged.length > 0 && (
                                                <p className='p-1 mb-1'> {B.unchanged.map((item) => <p>- {item.value}</p>)}</p>
                                            )}
                                            {B.added.length > 0 && (
                                                <p className='bg-green-300 p-1 mb-1'> {B.added.map((item) => <p>- {item.value}</p>)}</p>
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
                            <h1 className='font-semibold'>6. PHỤ LỤC VÀ CÁC NỘI DUNG KHÁC</h1>
                            {v2.appendixEnabled && (
                                <p className={`py-1   ${(isDifferent(v1.appendixEnabled, v2.appendixEnabled))
                                    ? 'bg-yellow-300 text-green-800 px-1' : ''}`}>
                                    - Cho phép tạo phụ lục khi hợp đồng đang có hiệu lực pháp lý
                                </p>
                            )}
                            {v2.transferEnabled && (
                                <p className={`py-1   ${(isDifferent(v1.transferEnabled, v2.transferEnabled))
                                    ? 'bg-yellow-300 text-green-800 px-1' : ''}`}>
                                    - Cho phép chuyển nhượng hợp đồng
                                </p>
                            )}
                            {v2.violate && (
                                <p className={`py-1   ${(isDifferent(v1.violate, v2.violate))
                                    ? 'bg-yellow-300 text-green-800 px-1' : ''}`}>
                                    - Cho phép đơn phương hủy hợp đồng nếu vi phạm nghiêm trọng các quy định trong điều khoản hợp đồng
                                </p>
                            )}
                            {v2.suspend && (
                                <p className={`${(isDifferent(v1.suspend, v2.suspend)) || (isDifferent(v1.suspendContent, v2.suspendContent))
                                    ? 'bg-yellow-300 text-green-800 px-1' : ''}`}>
                                    - Cho phép tạm ngưng hợp đồng trong các trường hợp bất khả kháng được ghi rõ: <p>{v1.suspendContent}</p>
                                </p>
                            )}
                        </div>
                    )}
                    <div className='w-full flex justify-center mt-10 items-center pb-24' >
                        <div className='flex flex-col gap-2 px-[9%] text-center'>
                            <p className='text-lg'><b>ĐẠI DIỆN BÊN A</b></p>
                            <p className={`${isDifferent(v1?.partnerA.spokesmanName, v2?.partnerA.spokesmanName) ? "bg-yellow-300 text-green-800" : ""}`}>
                                <b> {v2.partnerA.spokesmanName.toUpperCase()}</b></p>
                            <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                        </div>
                        <div className='flex flex-col gap-2 px-[9%] text-center'>
                            <p className={`${isDifferent(v1?.partnerB.spokesmanName, v2?.partnerB.spokesmanName) ? "bg-yellow-300 text-green-800" : ""}`}><b>ĐẠI DIỆN BÊN B</b></p>
                            <p><b>{v2.partnerB.spokesmanName.toUpperCase()}</b></p>
                            <i className='text-zinc-600'>Ký và ghi rõ họ tên</i>
                        </div>
                    </div>
                </div>
            </div>


        </div>
    );
}

export default Compare