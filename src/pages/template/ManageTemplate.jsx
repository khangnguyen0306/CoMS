import React, { useEffect, useState } from "react";
import { Table, Input, Select, Space, Button, Popconfirm, message, Dropdown, Menu, Spin, Image, Modal, Tag } from "antd";
import { EditOutlined, DeleteOutlined, CopyOutlined, EyeOutlined, SettingOutlined, FullscreenOutlined, SearchOutlined, FileSearchOutlined, EditFilled, CopyFilled, DeleteFilled } from "@ant-design/icons";
import { useDeleteTemplateMutation, useDuplicateTemplateMutation, useGetAllTemplateQuery, useGetTemplateDataDetailQuery } from "../../services/TemplateAPI";
import { useGetBussinessInformatinQuery } from "../../services/BsAPI";
import pressBtIcon from "../../assets/Image/press-button.svg"
import dayjs from "dayjs";
import { Link, Navigate, useNavigate } from "react-router-dom";
const { Search } = Input;
const { confirm } = Modal;
const ManageTemplate = () => {
    const navigate = useNavigate();
    const [selectedTemplateId, setSelectedTemplateId] = useState(null);
    const { data: bsInfor, isLoadingBSInfo, isError: BsDataError } = useGetBussinessInformatinQuery()
    const { data: templateDetail, isLoading: isLoadingTemplateDetail, isError: isErrorTemplateDetail } =
        useGetTemplateDataDetailQuery(selectedTemplateId, { skip: !selectedTemplateId });
    const [searchText, setSearchText] = useState("");
    const [filterType, setFilterType] = useState(null);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [duplicateTemplate] = useDuplicateTemplateMutation();
    const [deleteTemplate] = useDeleteTemplateMutation();
    // currentPage được lưu dạng 1-based để hiển thị trên UI
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const { data: templates, isLoading, isError, refetch } = useGetAllTemplateQuery({
        search: searchText,
        page: currentPage - 1,
        size: pageSize,
    });
    useEffect(() => {
        refetch();
    }, []);
    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = () => {
        setIsModalVisible(false);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
    };
    const handleTableChange = (pagination, filters, sorter) => {
        if (pagination.pageSize !== pageSize) {
            setCurrentPage(1);
            setPageSize(pagination.pageSize);
        } else {
            setCurrentPage(pagination.current);
        }
    };
    if (isError) return <p> Lỗi khi tải dữ liệu!</p>;

    // Xử lý tìm kiếm theo tên hợp đồng
    const filteredData = templates?.data.content
        ?.filter((item) =>
            item.contractTitle.toLowerCase().includes(searchText.toLowerCase())
        )
        .filter((item) => (filterType ? item.contractTypeId === filterType : true))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Xóa template
    const showDeleteConfirm = async (id) => {
        confirm({
            title: 'Bạn có chắc chắn muốn xóa không?',
            content: 'Hợp đồng sẽ được lưu trữ tại kho lưu trữ trong 30 ngày.',
            okText: 'Có',
            okType: 'danger',
            cancelText: 'Không',
            onOk() {
                deleteTemplate(id).unwrap();
                refetch();
                message.success("Xóa hợp đồng thành công!");
            },
            onCancel() {
                // console.log('Đã hủy xóa');
            },
        });
    };
    const generateColor = (id) => {
        // Sử dụng HSL để tạo màu
        // Hue: 0-360 độ trên vòng màu
        // Saturation: 65% để có màu vừa đủ sống động
        // Lightness: 75% để màu không quá tối hoặc quá sáng
        const hue = (id * 137.508) % 360; // 137.508 là góc vàng, giúp phân bố màu đều
        return `hsl(${hue}, 65%, 75%)`;
    };
    const handleDuplicate = async (templateId) => {
        try {
            const result = await duplicateTemplate(templateId).unwrap();
            console.log(result);
            if (result.status === "OK") {
                message.success("Nhân bản hợp đồng thành công!");
                refetch()
            }

        } catch (error) {
            console.error("Error duplicating template:", error);
            message.error("Lỗi khi nhân bản hợp đồng!");
        }
    };
    // Cột Table
    const columns = [
        {
            title: "Ngày tạo",
            dataIndex: "createdAt",
            key: "createdAt",
            sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
            render: (text) => {
                return <p>{dayjs(new Date(
                    text[0],
                    text[1] - 1,
                    text[2]
                )).format("DD/M/YYYY")}</p>;
            },
        },
        {
            title: "Tên hợp đồng mẫu",
            dataIndex: "contractTitle",
            key: "contractTitle",
            render: (text, record) => (
                <Button type="link" className="font-bold" onClick={() => setSelectedTemplateId(record.id)}>
                    {text}
                </Button>
            ),
        },
        {
            title: "Loại hợp đồng",
            dataIndex: "contractType",
            key: "contractType",
            filters: Array.from(new Map(
                templates?.data.content.map(item => [
                    item.contractType.id,
                    { text: item.contractType.name, value: item.contractType.id }
                ])
            ).values()),
            onFilter: (value, record) => record.contractType.id === value,
            render: (contractType) => {
                const backgroundColor = generateColor(contractType.id);
                return (
                    <Tag
                        style={{
                            backgroundColor: backgroundColor,
                            color: '#000000',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                    >
                        {contractType.name}
                    </Tag>
                );
            }
        },

        {
            title: "Tùy chỉnh",
            key: "action",
            render: (_, record) => (
                <Space>
                    <Dropdown
                        menu={{
                            items: [
                                // {
                                //     key: "view",
                                //     icon: <EyeOutlined />,
                                //     label: "Xem chi tiết",
                                //     onClick: () => console.log("Xem:", record)
                                // },
                                {
                                    key: "edit",
                                    icon: <EditFilled style={{ color: 'blue' }} />,
                                    label: "Sửa",
                                    onClick: () => navigate(`/EditTemplate/${record.id}`)

                                },
                                {
                                    key: "duplicate",
                                    icon: <CopyFilled style={{ color: 'orange' }} />,
                                    label: "Nhân bản",
                                    onClick: () => handleDuplicate(record.id)
                                },
                                {
                                    key: "delete",
                                    icon: <DeleteFilled />,
                                    label: "Xóa",
                                    danger: true,
                                    onClick: () => showDeleteConfirm(record.id)
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

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">
            <Spin size="large" />
        </div>
    }

    return (
        <div className="flex flex-col md:flex-row min-h-[100vh]">
            {/* Left Section */}
            <div className="flex-1 p-4">
                <p className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}
                >QUẢN LÝ MẪU HỢP ĐỒNG
                </p>
                {/* Search Bar */}
                <Space style={{ marginBottom: 16 }}>
                    <Search
                        placeholder=" Vui lòng nhập vào tên hợp đồng"
                        allowClear
                        onSearch={setSearchText}
                        style={{ width: "100%", maxWidth: 700 }}
                    />
                </Space>

                {/* Data Table */}
                <Table
                    columns={columns}
                    dataSource={filteredData}
                    rowKey="id"
                    loading={isLoading}
                    onChange={handleTableChange}
                    onRow={(record) => ({
                        onClick: () => setSelectedTemplate(record),
                    })}
                    pagination={{
                        current: currentPage,
                        pageSize: pageSize,
                        total: templates?.data?.totalElements || 0,
                        showTotal: (total) => `Tổng ${total} bản ghi`,
                    }}
                />
            </div>

            {/* Right Section */}

            <div className="flex-1 p-2 max-h-[90vh] overflow-y-auto md:ml-5 shadow-xl ring-1 ring-gray-200 hover:shadow-2xl transition-shadow duration-300 " >
                {selectedTemplateId ? (
                    (isLoadingTemplateDetail || isLoadingBSInfo) ? (
                        <div className="justify-self-center flex items-center mt-[50%]">
                            <Spin />
                        </div>
                    ) : isErrorTemplateDetail ? (
                        <p> Lỗi khi tải chi tiết hợp đồng!</p>
                    ) : (
                        <div className="p-10 space-y2 text-sm">
                            <Button type="primary" className="fixed right-[70px] top-[110px]" onClick={showModal}><FullscreenOutlined /></Button>
                            <Modal
                                title="Chi tiết hợp đồng"
                                open={isModalVisible}
                                onOk={handleOk}
                                onCancel={handleCancel}
                                footer={null}
                                width="80%"
                                style={{ top: 20 }}
                            >
                                <div className=" p-4 rounded-md text-center ">
                                    <p className="font-bold text-[22px] leading-7">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                    <p className="font-bold text-[18px] mt-1"> Độc lập - Tự do - Hạnh phúc</p>
                                    <p>-------------------</p>
                                    <p className="text-right mr-[10%] py-4"> ................, Ngày ..... Tháng ..... Năm .........</p>
                                    <p className="text-[28px] font-bold mt-3  leading-8">{templateDetail?.data.contractTitle?.toUpperCase() || "Tên hợp đồng không có"}</p>
                                    <p className="mt-2">(<b> Số:</b> Tên HD viết tắt / ngày tháng năm )</p>
                                </div>
                                <div className=" px-4 pt-[100px] flex flex-col gap-2">
                                    {templateDetail?.data.legalBasisTerms ? (
                                        templateDetail.data.legalBasisTerms?.map((term, index) => <p key={index}><i>- {term.value}</i></p>)
                                    ) : "Chưa có căn cứ pháp lý"}
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

                                    <div className="ml-1" dangerouslySetInnerHTML={{ __html: templateDetail?.data.contractContent || "Chưa nhập" }} />

                                    <div className="mt-4">
                                        <h4 className="font-bold text-lg placeholder:"><u>GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</u></h4>
                                        <div>
                                            {templateDetail?.data.autoAddVAT && <p className="mt-3">- Tự động thêm thuế VAT khi tạo hợp đồng ({templateDetail?.data.vatPercentage}%)</p>}
                                            {templateDetail?.data.autoRenew && <p className="mt-3">- Tự động gia hạn khi hợp đồng hết hạn nếu không có bất kỳ phản hồi nào </p>}
                                            {templateDetail?.data.appendixEnabled && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực </p>}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="font-bold text-lg placeholder:"><u>CÁC LOẠI ĐIỀU KHOẢN</u></h4>
                                        <div className="ml-5 mt-3 flex flex-col gap-3">
                                            {templateDetail?.data.generalTerms?.length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-lg">Điều khoản chung:</h5>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.generalTerms.map((term, index) => (
                                                            <li className="ml-2" key={term}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {templateDetail?.data.additionalConfig?.["1"]?.Common?.length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-lg">Điều khoản Bổ sung:</h5>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["1"].Common.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {templateDetail?.data.additionalConfig?.["2"]?.Common?.length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-lg">Quyền và nghĩa vụ các bên:</h5>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["2"].Common.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {templateDetail?.data.additionalConfig?.["3"]?.Common?.length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-lg">Điều khoản bảo hành và bảo trì:</h5>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["3"].Common.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {templateDetail?.data.additionalConfig?.["4"]?.Common?.length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-lg">Điều khoản vi phạm và bồi thường thiệt hại:</h5>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["4"].Common.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {templateDetail?.data.additionalConfig?.["5"]?.Common?.length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-lg">Điều khoản chấm dứt hợp đồng:</h5>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["5"].Common.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {templateDetail?.data.additionalConfig?.["6"]?.Common?.length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-lg">Điều khoản giải quyết tranh chấp:</h5>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["6"].Common.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {templateDetail?.data.additionalConfig?.["7"]?.Common?.length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-lg">Điều khoản chính sách bảo mật:</h5>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["7"].Common.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {templateDetail?.data.additionalConfig?.["10"]?.Common?.length > 0 && (
                                                <div>
                                                    <h5 className="font-semibold text-lg">Điều khoản chính sách bảo mật:</h5>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["10"].Common.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            <div className="mt-2">
                                                <h5 className="font-semibold text-lg">Điều khoản chỉ áp dụng bên A</h5>
                                                {templateDetail?.data.additionalConfig?.["1"]?.A?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["1"].A.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["2"]?.A?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["2"].A.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["3"]?.A?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["3"].A.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["4"]?.A?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["4"].A.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["5"]?.A?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["5"].A.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["6"]?.A?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["6"].A.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["7"]?.A?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["7"].A.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.specialTermsA && (<p className="ml-2">{templateDetail?.data.specialTermsB}</p>)}
                                            </div>

                                            <div className="mt-2">
                                                <h5 className="font-semibold text-lg">Điều khoản chỉ áp dụng bên B</h5>
                                                {templateDetail?.data.additionalConfig?.["1"]?.B?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["1"].B.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["2"]?.B?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["2"].B.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["3"]?.B?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["3"].B.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["4"]?.B?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["4"].B.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["5"]?.B?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["5"].B.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["6"]?.B?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["6"].B.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.additionalConfig?.["7"]?.B?.length > 0 && (
                                                    <div>
                                                        <ul className="mt-2 flex flex-col gap-1">
                                                            {templateDetail.data.additionalConfig["7"].B.map((term, index) => (
                                                                <li className="ml-2" key={term.value}> {term.value}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {templateDetail?.data.specialTermsA && (<p className="ml-2">{templateDetail?.data.specialTermsB}</p>)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <h4 className="font-bold text-lg placeholder:"><u>CÁC THÔNG TIN KHÁC</u></h4>
                                        {templateDetail?.data.appendixEnabled && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>}
                                        {templateDetail?.data.transferEnabled && <p className="mt-3">- Cho phép chuyển nhượng hợp đồng</p>}
                                    </div>
                                </div>
                            </Modal>
                            <div className=" p-4 rounded-md text-center ">
                                <p className="font-bold text-[22px] leading-7">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                                <p className="font-bold text-[18px] mt-1"> Độc lập - Tự do - Hạnh phúc</p>
                                <p>-------------------</p>
                                <p className="text-right mr-[1%] py-4">......................, Ngày ..... Tháng ..... Năm .........</p>
                                <p className="text-[28px] font-bold mt-3  leading-8">{templateDetail?.data.contractTitle?.toUpperCase() || "Tên hợp đồng không có"}</p>
                                <p className="mt-2">(<b> Số:</b> Tên HD viết tắt / ngày tháng năm )</p>
                            </div>
                            <div className=" px-4 pt-[100px] flex flex-col gap-2">
                                {templateDetail?.data.legalBasisTerms ? (
                                    templateDetail.data.legalBasisTerms.map((term, index) => <p key={index}><i>- {term.value}</i></p>)
                                ) : "Chưa chọn căn cứ pháp lý"}
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

                                <div className="ml-1" dangerouslySetInnerHTML={{ __html: templateDetail?.data.contractContent || "Chưa nhập" }} />

                                <div className="mt-4">
                                    <h4 className="font-bold text-lg placeholder:"><u>GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN</u></h4>
                                    <div>
                                        {templateDetail?.data.autoAddVAT && <p className="mt-3">- Tự động thêm thuế VAT khi tạo hợp đồng ({templateDetail?.data.vatPercentage}%)</p>}
                                        {templateDetail?.data.autoRenew && <p className="mt-3">- Tự động gia hạn khi hợp đồng hết hạn nếu không có bất kỳ phản hồi nào </p>}
                                        {templateDetail?.data.appendixEnabled && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực </p>}
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <h4 className="font-bold text-lg placeholder:"><u>CÁC LOẠI ĐIỀU KHOẢN</u></h4>
                                    <div className="ml-5 mt-3 flex flex-col gap-3">
                                        {templateDetail?.data.generalTerms?.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản chung:</h5>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail.data.generalTerms.map((term, index) => (
                                                        <li className="ml-2" key={term}> {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {templateDetail?.data.additionalConfig?.["1"]?.Common?.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản Bổ sung:</h5>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail.data.additionalConfig["1"].Common.map((term, index) => (
                                                        <li className="ml-2" key={term.value}> {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.data.additionalConfig?.["2"]?.Common?.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Quyền và nghĩa vụ các bên:</h5>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail.data.additionalConfig["2"].Common.map((term, index) => (
                                                        <li className="ml-2" key={term.value}> {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.data.additionalConfig?.["3"]?.Common?.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản bảo hành và bảo trì:</h5>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail.data.additionalConfig["3"].Common.map((term, index) => (
                                                        <li className="ml-2" key={term.value}> {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.data.additionalConfig?.["4"]?.Common?.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản vi phạm và bồi thường thiệt hại:</h5>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail.data.additionalConfig["4"].Common.map((term, index) => (
                                                        <li className="ml-2" key={term.value}> {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.data.additionalConfig?.["5"]?.Common?.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản chấm dứt hợp đồng:</h5>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail.data.additionalConfig["5"].Common.map((term, index) => (
                                                        <li className="ml-2" key={term.value}> {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.data.additionalConfig?.["6"]?.Common?.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản giải quyết tranh chấp:</h5>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail.data.additionalConfig["6"].Common.map((term, index) => (
                                                        <li className="ml-2" key={term.value}> {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.data.additionalConfig?.["7"]?.Common?.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản chính sách bảo mật:</h5>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail.data.additionalConfig["7"].Common.map((term, index) => (
                                                        <li className="ml-2" key={term.value}> {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {templateDetail?.data.additionalConfig?.["10"]?.Common?.length > 0 && (
                                            <div>
                                                <h5 className="font-semibold text-lg">Điều khoản chính sách bảo mật:</h5>
                                                <ul className="mt-2 flex flex-col gap-1">
                                                    {templateDetail.data.additionalConfig["10"].Common.map((term, index) => (
                                                        <li className="ml-2" key={term.value}> {term.value}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        <div className="mt-2">
                                            <h5 className="font-semibold text-lg">Điều khoản chỉ áp dụng bên A</h5>
                                            {templateDetail?.data.additionalConfig?.["1"]?.A?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["1"].A.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["2"]?.A?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["2"].A.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["3"]?.A?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["3"].A.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["4"]?.A?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["4"].A.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["5"]?.A?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["5"].A.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["6"]?.A?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["6"].A.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["7"]?.A?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["7"].A.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.specialTermsA && (<p className="ml-2">{templateDetail?.data.specialTermsB}</p>)}
                                        </div>

                                        <div className="mt-2">
                                            <h5 className="font-semibold text-lg">Điều khoản chỉ áp dụng bên B</h5>
                                            {templateDetail?.data.additionalConfig?.["1"]?.B?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["1"].B.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["2"]?.B?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["2"].B.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["3"]?.B?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["3"].B.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["4"]?.B?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["4"].B.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["5"]?.B?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["5"].B.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["6"]?.B?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["6"].B.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.additionalConfig?.["7"]?.B?.length > 0 && (
                                                <div>
                                                    <ul className="mt-2 flex flex-col gap-1">
                                                        {templateDetail.data.additionalConfig["7"].B.map((term, index) => (
                                                            <li className="ml-2" key={term.value}> {term.value}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {templateDetail?.data.specialTermsA && (<p className="ml-2">{templateDetail?.data.specialTermsB}</p>)}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <h4 className="font-bold text-lg placeholder:"><u>CÁC THÔNG TIN KHÁC</u></h4>
                                    {templateDetail?.data.appendixEnabled && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>}
                                    {templateDetail?.data.transferEnabled && <p className="mt-3">- Cho phép chuyển nhượng hợp đồng</p>}
                                </div>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col justify-center items-center h-[100%]">
                        <Image height={90} width={90} preview={false} src={pressBtIcon} />
                        <p className="mt-4">Vui lòng chọn một hợp đồng để xem chi tiết</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageTemplate;
