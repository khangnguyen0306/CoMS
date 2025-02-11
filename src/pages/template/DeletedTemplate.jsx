// chưa gắn id để gọi template details, search BE, chưa phân trang 
import React, { useState } from 'react';
import { Input, Button, Modal, List, Select, message, Skeleton, Card, Empty, Image } from 'antd';
import 'tailwindcss/tailwind.css';
import { DeleteFilled, RedoOutlined } from '@ant-design/icons';
import { useGetBussinessInformatinQuery } from '../../services/BsAPI';
import { useGetAllDeletedTemplateQuery, useGetTemplateDataDetailQuery } from '../../services/TemplateAPI';
import TrashIcon from '../../assets/Image/delete.svg'

const { Option } = Select;
const { Search } = Input;
const DeletedContract = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState(null);
  const [visible, setVisible] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const { data: bsInfor, isLoadingBSInfo, isError: BsDataError } = useGetBussinessInformatinQuery()
  const { data: templateData, isLoading: loadingTemplate, isError: DataError } = useGetAllDeletedTemplateQuery()
  const { data: templateDetail, isLoading: isLoadingTemplateDetail, isError: isErrorTemplateDetail } =
    useGetTemplateDataDetailQuery(selectedContract, { skip: !selectedContract });

  const filteredContracts = templateData?.filter(contract =>
    contract.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedType ? contract.type === selectedType : true)
  );

  const showModal = (contract) => {
    setSelectedContract(contract.id);
    setVisible(true);
  };

  const handleRestore = () => {
    // Logic để khôi phục hợp đồng
    message.success('Khôi phục thành công');
    setVisible(false);
  };

  const handleDelete = (contractId) => {
    Modal.confirm({
      title: 'Bạn có chắc muốn xóa template này không?',
      onOk: () => {
        // Logic để xóa hợp đồng
        message.success('Xóa thành công');
        setVisible(false);
      },
    });
  };



  if (loadingTemplate) return <Skeleton active />;
  if (DataError) return <Card><Empty description="Không thể tải dữ liệu" /></Card>;
  return (
    <div className="p-4 min-h-[100vh]">
      <p className='font-bold text-[34px] justify-self-center pb-7 bg-custom-gradient bg-clip-text text-transparent' style={{ textShadow: '8px 8px 8px rgba(0, 0, 0, 0.2)' }}><p className="flex items-center gap-4">KHO LƯU TRỮ <Image className="mb-3" width={50} height={50} preview={false} src={TrashIcon}/></p></p>
      <div className='flex w-3/5 gap-4'>
        <Search
          placeholder="Tìm kiếm tên hợp đồng"
          onSearch={setSearchTerm}
          enterButton="tìm kiếm"
          allowClear
          className="mb-4 max-w-[350px] "
        />
        <Select
          placeholder="Chọn loại hợp đồng"
          value={selectedType}
          onChange={setSelectedType}
          className="mb-4 max-w-[250px] min-w-[170px]"
          allowClear
        >
          {[...new Set(templateData?.map(contract => contract.type))].map((type, index) => (
            <Option key={index} value={type}>{type}</Option>
          ))}
        </Select>
      </div>
      <List
        itemLayout="horizontal"
        dataSource={filteredContracts}
        renderItem={contract => (
          <List.Item
            onClick={() => showModal(contract)}
            className='hover:shadow-lg rounded-md shadow-sm mb-2'
            actions={[
              <div className='flex flex-col justify-center gap-y-2'>
                <div className='flex gap-2'>
                  <Button type='primary' color='green' icon={<RedoOutlined />} onClick={(e) => { e.stopPropagation(); handleRestore(contract.id); }}>Khôi phục </Button>
                  <Button danger type='primary' onClick={(e) => { e.stopPropagation(); handleDelete(contract.id); }}><DeleteFilled /></Button>
                </div>
                <p>Xóa {contract.daysDeleted} ngày trước</p>
              </div>
            ]}
          >
            <List.Item.Meta
              className='px-7 py-4'
              title={<p className='font-bold text-base'>{contract.name}</p>}
              description={`Loại: ${contract.type}`}
            />
          </List.Item>
        )}
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
        )}
      </Modal>
    </div>
  );
};

export default DeletedContract;