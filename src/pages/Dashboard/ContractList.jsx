import React, { useState } from 'react';
import { List, Card, Tag, Button, Typography } from 'antd';
import { IoIosBookmarks } from 'react-icons/io';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
const { Text, Title } = Typography;

const ContractList = ({ contracts }) => {
  const [showAll, setShowAll] = useState(false);
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const navigate = useNavigate()
  // Mappings trạng thái
  const displayStatus = {
    CREATED: 'ĐÃ TẠO',
    FIXED: 'ĐÃ CHỈNH SỬA',
    APPROVAL_PENDING: 'CHỜ PHÊ DUYỆT',
    APPROVED: 'ĐÃ PHÊ DUYỆT',
    UPDATED: 'ĐÃ CẬP NHẬT',
    PENDING: 'ĐANG CHỜ',
    REJECTED: 'TỪ CHỐI PHÊ DUYỆT',
    SIGNED: 'ĐÃ KÝ',
    ACTIVE: 'ĐANG HIỆU LỰC',
    COMPLETED: 'HOÀN THÀNH',
    EXPIRED: 'HẾT HIỆU LỰC',
    CANCELLED: 'ĐÃ HỦY',
    ENDED: 'ĐÃ KẾT THÚC',
    DELETED: 'ĐÃ XÓA',
    EXPIRING: 'SẮP HẾT HẠN',
  };

  // Định dạng ngày
  const formatDate = (dateArray) => {
    if (!dateArray || dateArray.length < 3) return 'N/A';
    const [year, month, day] = dateArray;
    return new Date(year, month - 1, day).toLocaleDateString('vi-VN');
  };

  // Lấy màu tag trạng thái
  const getStatusColor = (status) => {
    switch (status) {
      case 'CREATED': return 'cyan';
      case 'FIXED': return 'geekblue';
      case 'APPROVAL_PENDING': return 'orange';
      case 'APPROVED': return 'green';
      case 'UPDATED': return 'purple';
      case 'PENDING': return 'gold';
      case 'REJECTED': return 'red';
      case 'SIGNED': return 'blue';
      case 'ACTIVE': return 'lime';
      case 'COMPLETED': return 'magenta';
      case 'EXPIRED': return 'volcano';
      case 'CANCELLED': return 'grey';
      case 'ENDED': return 'pink';
      case 'DELETED': return 'default';
      case 'EXPIRING': return 'warning';
      default: return 'default';
    }
  };

  // Xử lý hiển thị số lượng contracts
  const displayCount = showAll ? contracts.length : 5;
  const visibleContracts = contracts.slice(0, displayCount);

  // Nút xem thêm/thu gọn
  const loadMore = contracts.length > 5 && (
    <div style={{ textAlign: 'center', marginTop: 16 }}>
      <Button type="link" onClick={() => setShowAll(!showAll)}>
        {showAll ? 'Thu gọn' : 'Xem thêm'}
      </Button>
    </div>
  );

  return (
    <List
      grid={{ gutter: 16, column: 2 }}
      dataSource={visibleContracts}
      loadMore={loadMore}
      renderItem={(contract) => (
        <List.Item>
          <Card
            className="shadow-md hover:shadow-lg transition-shadow duration-300"
            onClick={() => navigate(`/contractDetail/${contract.id}`)}
          >
            <Card.Meta
              avatar={<IoIosBookmarks style={{ fontSize: 40, color: isDarkMode ? undefined : '#4d8cf4' }} />}
              title={
                <div className="flex justify-between">
                  <Title level={4} className="text-blue-600">
                    {contract.title.toUpperCase()}
                  </Title>
                  <Tag className='h-fit' color={getStatusColor(contract.status)}>
                    {displayStatus[contract.status] || contract.status}
                  </Tag>
                </div>
              }
              description={
                <div>
                  <p className='font-bold text-[#3a85cd]'>Người tạo : {contract.user.full_name}</p>
                  <Text type="secondary">Số hợp đồng: {contract.contractNumber}</Text>
                </div>
              }
            />
            <div className="mt-4 space-y-2">
              <div className="flex gap-2">
                <Text strong>Số tiền:</Text>
                <Text>{contract.amount.toLocaleString('vi-VN')} VND</Text>
              </div>
              <div className="flex gap-2">
                <Text strong>Loại hợp đồng:</Text>
                <Text>{contract.contractType.name}</Text>
              </div>
              <div className="flex gap-2">
                <Text strong>Đối tác:</Text>
                <Text>{contract.partnerB.partnerName}</Text>
              </div>
              <div className="flex gap-2">
                <Text strong>Ngày ký:</Text>
                <Text>{formatDate(contract.signingDate)}</Text>
              </div>
            </div>
          </Card>
        </List.Item>
      )}
    />
  );
};

export default ContractList;
