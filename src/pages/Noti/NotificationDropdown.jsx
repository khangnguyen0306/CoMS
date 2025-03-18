import React, { useState, useEffect, useRef } from "react";
import { Badge, Dropdown, List } from "antd";
import { BellFilled } from "@ant-design/icons";
import { useLazyGetNotificationsQuery, useUpdateReadStatusMutation } from "../../services/NotiAPI";
import dayjs from "dayjs";
import { useDispatch, useSelector } from "react-redux";
import { selectNotiNumber, setNotiNumber } from "../../slices/authSlice";
import { useNavigate } from "react-router-dom";

const NotificationDropdown = () => {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [notifications, setNotifications] = useState([]);
  const [fetchNotifications, { data: notiData, isFetching, }] = useLazyGetNotificationsQuery();
  const [update] = useUpdateReadStatusMutation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDarkMode = useSelector((state) => state.theme.isDarkMode);
  const notiNumber = useSelector(selectNotiNumber);

  useEffect(() => {
    fetchNotifications({ page, size: pageSize });
  }, [page, fetchNotifications]);

  useEffect(() => {
    if (notiData && notiData.data && notiData.data.content) {
      setNotifications((prev) => [...prev, ...notiData.data.content]);
    }
  }, [notiData]);


  const handleReadNoti = async (item) => {
    console.log(item);
    try {
      const data = await update(item?.id).unwrap();
      setNotifications((prev) => {
        const updated = prev.map((noti) =>
          noti?.id === item.id ? { ...noti, isRead: true } : noti
        );
        // Calculate the number of unread notifications based on the updated list
        const newUnreadCount = updated.filter((noti) => !noti.isRead).length;
        dispatch(setNotiNumber(newUnreadCount));
        return updated;
      });
      navigate(`/manager/approvalContract`);
    } catch (error) {
      console.error("Error updating notification:", error);
    }
  };


  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10 && !isFetching) {
      const totalPages = Math.ceil(notiData?.data?.totalElements / pageSize);
      if (page + 1 < totalPages) {
        setPage(page + 1);
      }
    }
  };

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
      className={`min-w-[300px] max-w-full max-h-full overflow-y-auto p-4 ${isDarkMode ? 'bg-[#1f1f1f]' : 'bg-[#f5f5f5]'} shadow-md rounded scrollbar-hide`}
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {notifications.length === 0 ? (
        <p className="m-0">Không có thông báo</p>
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              className="border-b-2 border-gray-400 py-2 cursor-pointer"
              onClick={() => handleReadNoti(item)}
            >
              <div className="flex justify-between items-center w-full">
                <div
                  className=" overflow-hidden text-ellipsis whitespace-nowrap"
                  style={{ fontWeight: item.isRead ? "normal" : "bold" }}
                >
                  {formatMessage(item.message)}
                </div>
                {!item.isRead && (
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                )}
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
          fetchNotifications({ page: page, size: pageSize });
        }}
      >
        <Badge
          count={notiNumber}
          // overflowCount={9}
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

export default NotificationDropdown
