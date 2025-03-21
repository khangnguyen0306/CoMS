import React, { useState, useEffect, useRef } from "react";
import { Badge, Dropdown, List } from "antd";
import { BellFilled, CloseCircleFilled, ExclamationCircleFilled, InfoCircleFilled } from "@ant-design/icons";
import { useLazyGetNotificationsQuery, useUpdateReadStatusMutation } from "../../services/NotiAPI";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { selectCurrentUser, selectNotiNumber, setNotiNumber } from "../../slices/authSlice";
import { useNavigate } from "react-router-dom";

const NotificationDropdown = () => {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [notifications, setNotifications] = useState([]);
  const [fetchNotifications, { data: notiData, isFetching }] = useLazyGetNotificationsQuery();
  const [updateNotification] = useUpdateReadStatusMutation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const notiNumber = useSelector(selectNotiNumber);
  const user = useSelector(selectCurrentUser);

  // Load thông báo khi thay đổi page
  useEffect(() => {
    fetchNotifications({ page, size: pageSize });
  }, [page, fetchNotifications]);

  // Khi có dữ liệu mới, cập nhật danh sách thông báo
  useEffect(() => {
    if (notiData?.data?.content) {
      setNotifications((prev) => [...prev, ...notiData.data.content]);
    }
  }, [notiData]);

  // Hàm xử lý khi click thông báo: cập nhật trạng thái đã đọc và chuyển hướng
  const handleReadNoti = async (item) => {
    try {
      await updateNotification(item.id).unwrap();
      setNotifications((prevNotis) => {
        const updatedNotis = prevNotis.map((noti) =>
          noti.id === item.id ? { ...noti, isRead: true } : noti
        );
        // Tính lại số thông báo chưa đọc
        const newUnreadCount = updatedNotis.filter((noti) => !noti.isRead).length;
        dispatch(setNotiNumber(newUnreadCount));
        return updatedNotis;
      });

      // Chuyển hướng dựa trên vai trò người dùng
      if (user.roles[0] === "ROLE_STAFF") {
        navigate("/approvalContract");
      } else if (user.roles[0] === "ROLE_MANAGER") {
        navigate("/manager/approvalContract");
      }
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };

  // Hàm xử lý scroll để load thêm thông báo khi gần đạt cuối danh sách
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10 && !isFetching) {
      const totalPages = Math.ceil(notiData?.data?.totalElements / pageSize);
      if (page + 1 < totalPages) {
        setPage(page + 1);
      }
    }
  };




  const getMessageIcon = (msg) => {
    const lowerMsg = msg.toLowerCase();
    if (lowerMsg.includes("nhắc nhở") || lowerMsg.includes("phê duyệt")) {
      return <InfoCircleFilled style={{ color: "#1890ff" }} />;
    } else if (lowerMsg.includes("quá hạn") || lowerMsg.includes("chỉnh sửa")) {
      return <ExclamationCircleFilled style={{ color: "#faad14" }} />;
    } else if (lowerMsg.includes("có hiệu lực")) {
      return <BellFilled style={{ color: "#1890ff" }} />;
    }
    return null; // Không trả về icon nào nếu không khớp
  };


  // Hàm định dạng nội dung thông báo
  const formatMessage = (msg) => {
    const dateMatch = msg.match(/lúc\s+([\d\-T:]+)/);
    let formattedDate = "";
    if (dateMatch?.[1]) {
      formattedDate = dayjs(dateMatch[1]).format("DD/MM/YYYY HH:mm");
    }
    return msg.replace(/lúc\s+[\d\-T:]+/, `\nLúc ${formattedDate}`);
  };

  // Nội dung dropdown hiển thị danh sách thông báo
  const dropdownContent = (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`max-w-[400px] max-h-[400px] p-4 overflow-y-auto shadow-md rounded scrollbar-hide ${isDarkMode ? "bg-[#1f1f1f]" : "bg-[#fdfdfd]"
        }`}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {notifications.length === 0 ? (
        <p className="m-0">Không có thông báo</p>
      ) : (
        <List
          dataSource={notifications}
          className="py-2"
          renderItem={(item) => (
            <List.Item
              key={item.id}
              className="border-b m-4 py-2 cursor-pointer"
              onClick={() => handleReadNoti(item)}
            // style={{ backgroundColor: getMessageColor(item.message), borderRadius: 8 }}
            >
              <div className="mx-2 flex justify-between items-center w-full">
                <div className="flex items-center">
                  {getMessageIcon(item.message)}
                  <div className="ml-2 font-semibold">{item.title}</div>
                  <div className="ml-2 font-semibold">{item.title}</div>
                </div>
                <div
                  className="overflow-hidden"
                  style={{
                    fontWeight: item.isRead ? "normal" : "bold",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    whiteSpace: "normal",

                  }}
                >
                  {formatMessage(item.message)}
                </div>
                {!item.isRead && <div className="pl-2.5 w-2.5 h-2.5 bg-blue-500 rounded-full" />}
              </div>
            </List.Item>
          )}
        />
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
        onOpenChange={(visible) => {
          setIsOpen(visible);
          // Khi mở dropdown, load lại thông báo
          fetchNotifications({ page, size: pageSize });
        }}
      >
        <Badge count={notiNumber} size="small" className="flex justify-center items-center">
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
