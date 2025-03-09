// chưa gắn id để gọi template details, search BE, chưa phân trang 
import React, { useEffect, useState } from 'react';
import { Input, Button, Modal, List, Select, message, Skeleton, Card, Empty, Image, Pagination } from 'antd';
import 'tailwindcss/tailwind.css';
import { DeleteFilled, RedoOutlined } from '@ant-design/icons';
import { useGetBussinessInformatinQuery } from '../../services/BsAPI';
import { useDeleteTemplateNotRestoreMutation, useGetAllDeletedTemplateQuery, useGetTemplateDataDetailQuery, useRestoreTemplateMutation } from '../../services/TemplateAPI';
import TrashIcon from '../../assets/Image/delete.svg'

const { Option } = Select;
const { Search } = Input;
const DeleteTemplate = () => {
  const [queryParams, setQueryParams] = useState({
    page: 0,
    size: 10,
    keyword: '',
    type: null,
  });
  const [allContractTypes, setAllContractTypes] = useState([]);
  const [visible, setVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  const { data: bsInfor, isLoading: isLoadingBSInfo, isError: BsDataError } = useGetBussinessInformatinQuery();
  const { data: templateData, isLoading: loadingTemplate, isError: DataError, refetch } = useGetAllDeletedTemplateQuery(queryParams);
  const { data: templateDetail, isLoading: isLoadingTemplateDetail, isError: isErrorTemplateDetail } =
    useGetTemplateDataDetailQuery(selectedContract, { skip: !selectedContract });
  const [deleteTemplate] = useDeleteTemplateNotRestoreMutation()
  const [restoreTemplate, { isLoading: loadingRestore }] = useRestoreTemplateMutation()

  useEffect(() => {
    if (templateData?.data?.content) {
      const newTypes = templateData.data.content.map(contract => ({
        id: contract.contractType.id,
        name: contract.contractType.name,
      }));
      setAllContractTypes(prevTypes => {
        const existingIds = new Set(prevTypes.map(type => type.id));
        const uniqueNewTypes = newTypes.filter(type => !existingIds.has(type.id));
        return [...prevTypes, ...uniqueNewTypes];
      });
    }
  }, [templateData]);

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
      const result = await restoreTemplate(templateId).unwrap()
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
      title: 'Bạn có chắc muốn xóa template này không?',
      onOk: () => {
        deleteTemplate(contractId).unwrap();
        message.success('Xóa thành công');
        setVisible(false);
      },
    });
  };



  if (loadingTemplate) return <Skeleton active />;
  if (DataError) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;
  return (
    <div className="p-4 min-h-[100vh]">
      <p className="font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent" style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}>
        <p className="flex items-center gap-4">KHO LƯU TRỮ <Image className="mb-3" width={50} height={50} preview={false} src={TrashIcon} /></p>
      </p>
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
        dataSource={templateData?.data.content || []}
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
                <p>Xóa {contract.daysDeleted} ngày trước</p>
              </div>,
            ]}
          >
            <List.Item.Meta
              className="px-7 py-4"
              title={<p className="font-bold text-base">{contract.contractTitle}</p>}
              description={`Loại: ${contract.contractType.name}`}
            />
          </List.Item>
        )}
      />
      <Pagination
        current={queryParams.page + 1}
        pageSize={queryParams.size}
        total={templateData?.data.totalElements || 0}
        onChange={(page, pageSize) => {
          setQueryParams(prev => ({ ...prev, page: page - 1, size: pageSize }));
        }}
        showSizeChanger
        className="mt-4"
      />
      <Modal
        title="Chi tiết hợp đồng"
        open={visible}
        onCancel={() => setVisible(false)}
        footer={false}
        loading={isLoadingTemplateDetail && isLoadingBSInfo}
        width="80%"
      >
        {selectedContract && (
          <div>
            <div className=" p-4 rounded-md text-center ">
              <p className="font-bold text-[22px] leading-7">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="font-bold text-[18px] mt-1"> Độc lập - Tự do - Hạnh phúc</p>
              <p>-------------------</p>
              <p className="text-right mr-[10%] py-4">Ngày .... Tháng .... Năm ......</p>
              <p className="text-[28px] font-bold mt-3  leading-8">{templateDetail?.data.contractTitle?.toUpperCase() || "Tên hợp đồng không có"}</p>
              <p className="mt-2">(<b> Số:</b> Tên HD viết tắt / ngày tháng năm )</p>
            </div>
            <div className=" px-4 pt-[100px] flex flex-col gap-2">
              {templateDetail?.data.legalBasisTerms ? (
                templateDetail?.data.legalBasisTerms.map((term, index) => <p key={index}><i>- {term.value}</i></p>)
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
                  {templateDetail?.data && (
                    <div>
                      <h5 className="font-semibold text-lg">Điều khoản chung:</h5>
                      <ul className="mt-2 flex flex-col gap-1">
                        {templateDetail?.data.generalTerms?.map((term, index) => (
                          <li className="ml-2" key={term.original_term_id}>{index + 1}. {term.value}</li>
                        ))}
                      </ul>
                      {templateDetail?.data.additionalConfig?.["1"] && (
                        <div>
                          <h5 className="font-semibold text-lg">ĐIỀU KHOẢN BỔ SUNG</h5>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["1"]?.Common?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["2"] && (
                        <div>
                          <h5 className="font-semibold text-lg">QUYỀN VÀ NGHĨA VỤ CÁC BÊN</h5>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["2"]?.Common?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["3"] && (
                        <div>
                          <h5 className="font-semibold text-lg">ĐIỀU KHOẢN BẢO HÀNH VÀ BẢO TRÌ</h5>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["3"]?.Common?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["4"] && (
                        <div>
                          <h5 className="font-semibold text-lg">ĐIỀU KHOẢN VI PHẠM VÀ BỒI THƯỜNG THIỆT HẠI</h5>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["4"]?.Common?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["5"] && (
                        <div>
                          <h5 className="font-semibold text-lg">ĐIỀU KHOẢN VỀ CHẤM DỨT HỢP ĐỒNG</h5>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["5"]?.Common?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["6"] && (
                        <div>
                          <h5 className="font-semibold text-lg">ĐIỀU KHOẢN VỀ GIẢI QUYẾT TRANH CHẤP</h5>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["6"]?.Common?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["7"] && (
                        <div>
                          <h5 className="font-semibold text-lg">ĐIỀU KHOẢN BẢO MẬT</h5>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["7"]?.Common?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>





                <div className="ml-5 mt-3 flex flex-col gap-3">
                  {templateDetail?.data && (
                    <div>
                      <h5 className="font-semibold text-lg">Điều khoản riêng bên A</h5>
                      <ul className="mt-2 flex flex-col gap-1">
                      </ul>
                      {templateDetail?.data.additionalConfig?.["1"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["1"]?.A?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["2"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["2"]?.A?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["3"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["3"]?.A?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["4"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["4"]?.A?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["5"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["5"]?.A?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["6"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["6"]?.A?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["7"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["7"]?.A?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>


                <div className="ml-5 mt-3 flex flex-col gap-3">
                  {templateDetail?.data && (
                    <div>
                      <h5 className="font-semibold text-lg">Điều khoản riêng bên B</h5>
                      <ul className="mt-2 flex flex-col gap-1">
                      </ul>
                      {templateDetail?.data.additionalConfig?.["1"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["1"]?.B?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["2"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["2"]?.B?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["3"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["3"]?.B?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["4"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["4"]?.B?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["5"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["5"]?.B?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["6"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["6"]?.B?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {templateDetail?.data.additionalConfig?.["7"] && (
                        <div>
                          <ul className="mt-2 flex flex-col gap-1">
                            {templateDetail?.data?.additionalConfig?.["7"]?.B?.map((term, index) => (
                              <li className="ml-2" key={term.value}>{index + 1}. {term.value}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>


              </div>
              <div className="mt-4">
                <h4 className="font-bold text-lg placeholder:"><u>CÁC THÔNG TIN KHÁC</u></h4>
                {templateDetail?.data.appendixEnabled && <p className="mt-3">- Cho phép tạo phụ lục khi hợp đồng có hiệu lực</p>}
                {templateDetail?.data.transferEnabled && <p className="mt-3">- Cho phép chuyển nhượng hợp đồng</p>}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DeleteTemplate;