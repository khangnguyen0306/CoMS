import React, { useState } from "react";
import { Table, Input, Select, Space, Button, Popconfirm, message, Dropdown, Menu, Spin } from "antd";
import { EditOutlined, DeleteOutlined, CopyOutlined, EyeOutlined, SettingOutlined, FullscreenOutlined } from "@ant-design/icons";
import { useGetAllTemplateQuery, useGetTemplateDataDetailQuery } from "../../services/TemplateAPI";
import { useGetBussinessInformatinQuery } from "../../services/BsAPI";

const { Search } = Input;

const ManageTemplate = () => {
    const { data: templates, isLoading, isError } = useGetAllTemplateQuery();
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const { data: bsInfor, isLoadingBSInfo, isError: BsDataError } = useGetBussinessInformatinQuery()
    const { data: templateDetail, isLoading: isLoadingTemplateDetail, isError: isErrorTemplateDetail } =
        useGetTemplateDataDetailQuery(selectedTemplateId, { skip: !selectedTemplateId });
    console.log(templateDetail)
    //   const [deleteTemplate] = useDeleteTemplateMutation();
    const [searchText, setSearchText] = useState("");
    const [filterType, setFilterType] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);


    if (isError) return <p> Lỗi khi tải dữ liệu!</p>;

    // Xử lý tìm kiếm theo tên hợp đồng
    const filteredData = templates
        ?.filter((item) =>
            item.template_name.toLowerCase().includes(searchText.toLowerCase())
        )
        .filter((item) => (filterType ? item.contract_type === filterType : true))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sắp xếp theo ngày mới nhất

    // Xóa template
    const handleDelete = async (id) => {
        try {
            //   await deleteTemplate(id).unwrap();
            message.success("Xóa hợp đồng thành công!");
        } catch (error) {
            message.error("Lỗi khi xóa hợp đồng!");
        }
    };

    // Cột Table
    const columns = [
        {
            title: "Ngày tạo",
            dataIndex: "created_at",
            key: "created_at",
            sorter: (a, b) => new Date(b.created_at) - new Date(a.created_at),
            render: (text) => new Date(text).toLocaleDateString("vi-VN"),
        },
        {
            title: "Tên hợp đồng mẫu",
            dataIndex: "template_name",
            key: "template_name",
            render: (text, record) => (
                <Button type="link" onClick={() => setSelectedTemplateId(record.id)}>
                    {text}
                </Button>
            ),
        },
        {
            title: "Loại hợp đồng",
            dataIndex: "contract_type",
            key: "contract_type",
            filters: [...new Set(templates?.map((item) => item.contract_type))].map(
                (type) => ({ text: type, value: type })
            ),
            onFilter: (value, record) => record.contract_type === value,
        },

        {
            title: "Tùy chỉnh",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: "view",
                                    icon: <EyeOutlined />,
                                    label: "Xem chi tiết",
                                    onClick: () => console.log("Xem:", record)
                                },
                                {
                                    key: "edit",
                                    icon: <EditOutlined />,
                                    label: "Sửa",
                                    onClick: () => console.log("Sửa:", record)
                                },
                                {
                                    key: "duplicate",
                                    icon: <CopyOutlined />,
                                    label: "Nhân bản",
                                    onClick: () => console.log("Nhân bản:", record)
                                },
                                {
                                    key: "delete",
                                    icon: <DeleteOutlined />,
                                    label: "Xóa",
                                    danger: true,
                                    onClick: () => handleDelete(record.id)
                                }
                            ]
                        }}
                    >
                        <Button ><SettingOutlined /></Button>
                    </Dropdown>
                </Space>
            ),
        },
    ];

    return (
        <div className="flex flex-col md:flex-row">
            {/* Left Section */}
            <div className="flex-1 p-4">
                <h2> Quản lý hợp đồng mẫu</h2>

                {/* Search Bar */}
                <Space style={{ marginBottom: 16 }}>
                    <Search
                        placeholder=" Vui lòng nhập vào tên hợp đồng"
                        allowClear
                        onSearch={setSearchText}
                        style={{ width: "100%", maxWidth: 500 }}
                    />
                </Space>

                {/* Data Table */}
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={isLoading}
                    onRow={(record) => ({
                        onClick: () => setSelectedTemplate(record),
                    })}
                />
            </div>

            {/* Right Section */}

            <div className="flex-1 p-2 max-h-[90vh] overflow-y-auto md:ml-5 shadow-xl ring-1 ring-gray-200 hover:shadow-2xl transition-shadow duration-300 " >
                {selectedTemplateId ? (
                    (isLoadingTemplateDetail || isLoadingBSInfo) ? (
                        <Spin />
                    ) : isErrorTemplateDetail ? (
                        <p> Lỗi khi tải chi tiết hợp đồng!</p>
                    ) : (
                        <div className="p-10 space-y2 text-sm">
                            <Button type="primary" className="fixed right-[70px] top-[110px]"><FullscreenOutlined /></Button>
                            <div className=" p-4 rounded-md text-center ">

                                <p className="font-bold text-[22px] leading-7">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                <p className="font-bold text-[18px] mt-1"> Độc lập - Tự do - Hạnh phúc</p>
                                <p>-------------------</p>
                                <p className="text-right mr-[10%] py-4">Ngày .... Tháng .... Năm ......</p>
                                <p className="text-[28px] font-bold mt-3  leading-8">{templateDetail?.contractTitle?.toUpperCase() || "Tên hợp đồng không có"}</p>
                                <p className="mt-2">(<b> Số:</b> Tên HD viết tắt / ngày tháng năm )</p>
                            </div>
                            <div className=" px-4 pt-[100px] flex flex-col gap-2">
                                {templateDetail?.legalBasis ? (
                                    templateDetail.legalBasis.map((term, index) => <p key={index}><i>- {term.value}</i></p>)
                                ) : null}
                            </div>
                            <div className="p-4 rounded-md flex flex-col gap-4">
                                <div className="flex flex-col gap-2 " md={10} sm={24} >
                                    <p className="font-bold text-lg "><u>BÊN CUNG CẤP (BÊN A)</u></p>
                                    <p className=" "><b>Tên công ty:</b> {bsInfor?.businessName}</p>
                                    <p className=""><b>Địa chỉ trụ sở chính:</b> {bsInfor?.address}</p>
                                    <p className="flex  justify-between"><p><b>Người đại diện:</b> {bsInfor?.representativeName} </p></p>
                                    <p className=""><b>Chức vụ:</b> {bsInfor?.representativeTitle}</p>
                                    <p className='flex   justify-between'><p><b>Mã số thuế:</b> {bsInfor?.taxCode}</p></p>
                                    <p className=""><b>Email:</b> {bsInfor?.email}</p>
                                </div>
                                <div className="flex flex-col gap-2" md={10} sm={24}>
                                    <p className="font-bold text-lg "><u>Bên thuê (Bên B)</u></p>
                                    <p className=" "><b>Tên công ty: </b>....................................................................................................................................</p>
                                    <p className=""><b>Địa chỉ trụ sở chính:</b> .......................................................................................................................</p>
                                    <p className="flex   justify-between"><p><b>Người đại diện:</b> ...............................................................................................................................</p></p>
                                    <p className=""><b>Chức vụ:</b> ..........................................................................................................................................</p>
                                    <p className='flex  justify-between'><p><b>Mã số thuế:</b> .....................................................................................................................................</p></p>
                                    <p className=""><b>Email:</b> ...............................................................................................................................................</p>
                                </div>

                                <p>Sau khi bàn bạc và thống nhất chúng tôi cùng thỏa thuận ký kết bản hợp đồng với nội dung và các điều khoản sau: </p>

                                <p className="font-bold text-lg "><u>NỘI DUNG HỢP ĐỒNG</u></p>

                                <div className="ml-1" dangerouslySetInnerHTML={{ __html: templateDetail?.contractContent || "Chưa nhập" }} />

                                <div className="mt-4">
                                    <h4 className="font-bold text-lg placeholder:"><u>GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</u></h4>
                                    <div>
                                        {templateDetail?.autoAddVAT && <p className="mt-3">- Tự động thêm thuế VAT khi tạo hợp đồng ({templateDetail?.vatPercentage}%)</p>}
                                        {templateDetail?.autoRenew && <p className="mt-3">- Tự động gia hạn khi hợp đồng hết hạn nếu không có bất kỳ phản hồi nào </p>}
                                        {templateDetail?.appendixEnabled && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực </p>}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h4 className="font-bold text-lg placeholder:"><u>CÁC LOẠI ĐIỀU KHOẢN</u></h4>
                                    <div className="ml-5 mt-3 flex flex-col gap-3">
                                        {templateDetail?.generalTerms && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản chung:</h5>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.generalTerms?.map((term, index) => (
                                                        <li className="ml-2" key={term}>{index + 1}. {term}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.RightsAndObligations && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Quyền và nghĩa vụ các bên:</h5>
                                                <h4 className="font-bold mt-2 ml-2">Quyền và nghĩa vụ chung</h4>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.RightsAndObligations?.specialCommon?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    )) || <p className="ml-2">Không có</p>}
                                                </ul>
                                                {templateDetail?.RightsAndObligations?.specialA && <h4 className="font-bold mt-2 ml-2">Quyền và nghĩa vụ chỉ riêng bên A</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.RightsAndObligations?.specialA?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                                {templateDetail?.RightsAndObligations?.specialB && <h4 className="font-bold mt-2 ml-2">Quyền và nghĩa vụ chỉ riêng bên B</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.RightsAndObligations?.specialB?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.DisputeResolutionClause && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản giải quyết tranh chấp:</h5>
                                                <h4 className="font-bold mt-2 ml-2">Điều khoản giải quyết tranh chấp chung</h4>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.DisputeResolutionClause?.DisputeResolutionClauseCommon?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    )) || <p className="ml-2">Không có</p>}
                                                </ul>
                                                {templateDetail?.DisputeResolutionClause?.DisputeResolutionClauseA && <h4 className="font-bold mt-2 ml-2">Điều khoản giải quyết tranh chấp chỉ riêng bên A</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.DisputeResolutionClause?.DisputeResolutionClauseA?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                                {templateDetail?.DisputeResolutionClause?.DisputeResolutionClauseB && <h4 className="font-bold mt-2 ml-2">Điều khoản giải quyết tranh chấp chỉ riêng bên B</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.DisputeResolutionClause?.DisputeResolutionClauseB?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.additional && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản Bổ sung:</h5>
                                                <h4 className="font-bold mt-2 ml-2">Điều khoản Bổ sung chung</h4>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.additional?.additionalCommon?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    )) || <p className="ml-2">Không có</p>}
                                                </ul>
                                                {templateDetail?.additional?.additionalA && <h4 className="font-bold mt-2 ml-2">Điều khoản Bổ sung chỉ riêng bên A</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.additional?.additionalA?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                                {templateDetail?.additional?.additionalB && <h4 className="font-bold mt-2 ml-2">Điều khoản Bổ sung chỉ riêng bên B</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.additional?.additionalB?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.breachAndDamages && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản pháp lý:</h5>
                                                <h4 className="font-bold mt-2 ml-2">Điều khoản pháp lý chung</h4>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.breachAndDamages?.breachAndDamagesCommon?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    )) || <p className="ml-2">Không có</p>}
                                                </ul>
                                                {templateDetail?.breachAndDamages?.breachAndDamagesA && <h4 className="font-bold mt-2 ml-2">Điều khoản pháp lý chỉ riêng bên A</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.breachAndDamages?.breachAndDamagesA?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                                {templateDetail?.breachAndDamages?.breachAndDamagesB && <h4 className="font-bold mt-2 ml-2">Điều khoản pháp lý chỉ riêng bên B</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.breachAndDamages?.breachAndDamagesB?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.TerminationOfContract && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản chấm dứt hợp đồng:</h5>
                                                <h4 className="font-bold mt-2 ml-2">Điều khoản chấm dứt hợp đồng chung</h4>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.TerminationOfContract?.TerminationOfContractCommon?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    )) || <p className="ml-2">Không có</p>}
                                                </ul>
                                                {templateDetail?.TerminationOfContract?.TerminationOfContractA && <h4 className="font-bold mt-2 ml-2">Điều khoản chấm dứt hợp đồng chỉ riêng bên A</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.TerminationOfContract?.TerminationOfContractA?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                                {templateDetail?.TerminationOfContract?.TerminationOfContractB && <h4 className="font-bold mt-2 ml-2">Điều khoản chấm dứt hợp đồng chỉ riêng bên B</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.TerminationOfContract?.TerminationOfContractB?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.warrantyAndMaintenance && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản bảo hành và bảo trì:</h5>
                                                <h4 className="font-bold mt-2 ml-2">Điều khoản bảo hành và bảo trì chung</h4>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.warrantyAndMaintenance?.warrantyAndMaintenanceCommon?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    )) || <p className="ml-2">Không có</p>}
                                                </ul>
                                                {templateDetail?.warrantyAndMaintenance?.warrantyAndMaintenanceA && <h4 className="font-bold mt-2 ml-2">Điều khoản bảo hành và bảo trì chỉ riêng bên A</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.warrantyAndMaintenance?.warrantyAndMaintenanceA?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                                {templateDetail?.warrantyAndMaintenance?.warrantyAndMaintenanceB && <h4 className="font-bold mt-2 ml-2">Điều khoản bảo hành và bảo trì chỉ riêng bên B</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.warrantyAndMaintenance?.warrantyAndMaintenanceB?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.PrivacyPolicy && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản chính sách bảo mật:</h5>
                                                <h4 className="font-bold mt-2 ml-2">Điều khoản chính sách bảo mật chung</h4>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.PrivacyPolicy?.PrivacyPolicyCommon?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    )) || <p className="ml-2">Không có</p>}
                                                </ul>
                                                {templateDetail?.PrivacyPolicy?.PrivacyPolicyA && <h4 className="font-bold mt-2 ml-2">Điều khoản chính sách bảo mật chỉ riêng bên A</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.PrivacyPolicy?.PrivacyPolicyA?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                                {templateDetail?.PrivacyPolicy?.PrivacyPolicyB && <h4 className="font-bold mt-2 ml-2">Điều khoản chính sách bảo mật chỉ riêng bên B</h4>}
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail?.PrivacyPolicy?.PrivacyPolicyB?.map((term, index) => (
                                                        <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.specialTermsA && (
                                            <div className="mt-2">
                                                <h5 className="font-semibold text-lg">Điều khoản đặc biệt bên A</h5>
                                                <p>{templateDetail?.specialTermsB}</p>
                                            </div>
                                        )}
                                        {templateDetail?.specialTermsB && (
                                            <div className="mt-2">
                                                <h5 className="font-semibold text-lg">Điều khoản đặc biệt bên B</h5>
                                                <p>{templateDetail?.specialTermsB}</p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                                <div className="mt-4">
                                    <h4 className="font-bold text-lg placeholder:"><u>CÁC THÔNG TIN KHÁC</u></h4>
                                    {templateDetail?.appendixEnabled && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>}
                                    {templateDetail?.transferEnabled && <p className="mt-3">- Cho phép chuyển nhượng hợp đồng</p>}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <p>🔍 Vui lòng chọn một hợp đồng để xem chi tiết.</p>
                )}
            </div>
        </div>
    );
};

export default ManageTemplate;
