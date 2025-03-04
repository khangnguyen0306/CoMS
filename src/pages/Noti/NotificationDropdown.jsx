import React, { useState, useEffect, useRef } from "react";
import { Badge, Divider, Dropdown, List, Spin } from "antd";
import { BellFilled } from "@ant-design/icons";
import { useLazyGetNotificationsQuery, useUpdateReadStatusMutation } from "../../services/NotiAPI";
import dayjs from "dayjs";

const NotificationDropdown = () => {
  // Quản lý trang hiện tại và kích thước trang
  const [page, setPage] = useState(0);
  const pageSize = 10;
  // State lưu danh sách thông báo đã tải về
  const [notifications, setNotifications] = useState([]);
  // Sử dụng lazy query để tải thông báo theo trang
  const [fetchNotifications, { data: notiData, isFetching }] = useLazyGetNotificationsQuery();
  const [update] = useUpdateReadStatusMutation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Tải trang đầu tiên khi component mount
  useEffect(() => {
    fetchNotifications({ page, size: pageSize });
  }, [page, fetchNotifications]);

  // Khi dữ liệu mới được tải về, thêm vào danh sách notifications
  useEffect(() => {
    if (notiData && notiData.data && notiData.data.content) {
      setNotifications((prev) => [...prev, ...notiData.data.content]);
    }
  }, [notiData]);

  // Hàm đánh dấu thông báo đã đọc
  const handleReadNoti = async (id) => {
    try {
      await update(id).unwrap();
      setNotifications((prev) =>
        prev.map((noti) =>
          noti.id === id ? { ...noti, isRead: true } : noti
        )
      );
    } catch (error) {
      console.log(error);
    }
  };

  // Hàm xử lý sự kiện cuộn của container
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Nếu đã cuộn gần dưới cùng và không đang tải dữ liệu
    if (scrollHeight - scrollTop <= clientHeight + 10 && !isFetching) {
      // Tính số trang tổng cộng (nếu BE trả về totalElements)
      const totalPages = Math.ceil(notiData?.data?.totalElements / pageSize);
      if (page + 1 < totalPages) {
        setPage(page + 1);
      }
    }
  };

  // Hàm định dạng message với ngày giờ
  const formatMessage = (msg) => {
    const dateMatch = msg.match(/lúc\s+([\d\-T:]+)/);
    let formattedDate = "";
    if (dateMatch && dateMatch[1]) {
      formattedDate = dayjs(dateMatch[1]).format("DD/MM/YYYY HH:mm");
    }
    return msg.replace(/lúc\s+[\d\-T:]+/, `\nLúc ${formattedDate}`);
  };

  const dropdownContent = (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="w-[300px] max-h-[300px] overflow-y-auto p-4 bg-white shadow-md rounded scrollbar-hide"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {notifications.length === 0 ? (
        <p className="m-0">Không có thông báo</p>
      ) : (
        <>
          <List
            dataSource={notifications}
            renderItem={(item, index) => (
              <List.Item
                key={index}
                className="border-b-2 border-gray-400 py-2 flex justify-between items-center"
                onClick={() => handleReadNoti(item.id)}
              >
                <div
                  className="w-[85%] whitespace-pre-line"
                  style={{ fontWeight: item.isRead ? "normal" : "bold" }}
                >
                  {formatMessage(item.message)}
                </div>
                {!item.isRead && (
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                )}
                <Divider></Divider>
              </List.Item>
            )}
          />
          {isFetching && (
            <div className="flex justify-center py-2">
              <Spin size="small" />
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="flex items-center">
      <Dropdown
        arrow
        overlay={dropdownContent}
        trigger={["click"]}
        className={`p-2 rounded-full ${!isOpen ? "bg-gray-600" : "bg-slate-700"}`}
        onOpenChange={(visible) => setIsOpen(visible)}
      >
        <Badge
          count={notifications.filter((item) => !item.isRead).length || 0}
          size="small"
          className="flex justify-center items-center"
        >
          <BellFilled
            style={{
              fontSize: 24,
              color: isOpen ? "#2196f3" : "#fff",
              cursor: "pointer",
            }}
          />
        </Badge>
      </Dropdown>
    </div>
  );
};

export default NotificationDropdown;
