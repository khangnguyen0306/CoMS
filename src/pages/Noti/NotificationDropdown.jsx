import React, { useEffect, useState } from "react";
import { Badge, Dropdown, List } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../slices/auth.slice";

const NotificationDropdown = () => {
  const user = useSelector(selectCurrentUser);
  // Giả sử notifications được lấy từ state hoặc sessionStorage
  const [notifications, setNotifications] = useState(() => {
    const stored = sessionStorage.getItem("notifications");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    sessionStorage.setItem("notifications", JSON.stringify(notifications));
  }, [notifications]);

  const dropdownContent = (
    <div
      style={{
        width: 300,
        maxHeight: 300,
        overflowY: "auto",
        padding: 16,
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        borderRadius: 4,
      }}
    >
      {notifications.length === 0 ? (
        <p style={{ margin: 0 }}>Không có thông báo</p>
      ) : (
        <List
          dataSource={notifications}
          renderItem={(item, index) => (
            <List.Item
              key={index}
              style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 0" }}
            >
              <div style={{ whiteSpace: "pre-line" }}>{item.message}</div>
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <div className="flex items-center">
      <p className="text-white mr-4">{user?.fullName}</p>
      <Dropdown arrow overlay={dropdownContent} trigger={["click"]} placement="bottomRight">
        <Badge count={notifications.length} size="small">
          <BellOutlined style={{ fontSize: 24, color: "#fff", cursor: "pointer" }} />
        </Badge>
      </Dropdown>
    </div>
  );
};

export default NotificationDropdown;
