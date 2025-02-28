import React, { useEffect, useState } from "react";
import { notification } from "antd";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useSelector } from "react-redux";
import { selectCurrentToken, selectCurrentUser } from "../../slices/auth.slice";
import dayjs from "dayjs";

const RealTimeNotification = () => {
    const token = useSelector(selectCurrentToken);
    const user = useSelector(selectCurrentUser);

    // Lazy initialization: lấy notifications từ sessionStorage nếu có, ngược lại là mảng rỗng
    const [notifications, setNotifications] = useState(() => {
        const stored = sessionStorage.getItem("notifications");
        return stored ? JSON.parse(stored) : [];
    });

    // Mỗi khi notifications thay đổi, lưu vào sessionStorage
    useEffect(() => {
        sessionStorage.setItem("notifications", JSON.stringify(notifications));
    }, [notifications]);

    useEffect(() => {
        const socket = new SockJS("http://localhost:8080/ws");
        const stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: token ? `Bearer ${token}` : "",
            },
            reconnectDelay: 5000,
            debug: (str) => {
                console.log("WebSocket debug:", str);
            },
        });

        stompClient.onConnect = (frame) => {
            console.log("Connected: ", frame);
            // Đăng ký subscribe đến kênh của user (ví dụ sử dụng user.fullName làm định danh)
            stompClient.subscribe(`/user/${user.fullName}/queue/payment`, (message) => {
                console.log("Received message: ", message);
                if (message.body) {
                    const data = JSON.parse(message.body);
                    const msg = data.message;

                    // Tách phần ngày giờ theo định dạng ISO (ví dụ: 2025-02-27T18:59)
                    const dateMatch = msg.match(/lúc\s+([\d\-T:]+)/);
                    let formattedDate = "";
                    if (dateMatch && dateMatch[1]) {
                        formattedDate = dayjs(dateMatch[1]).format("DD/MM/YYYY HH:mm");
                    }
                    // Chuyển "lúc" thành "Lúc" và xuống dòng trước đó
                    const displayMessage = msg.replace(/lúc\s+[\d\-T:]+/, `\nLúc ${formattedDate}`);

                    // Tạo một đối tượng thông báo mới
                    const newNotification = { message: displayMessage };

                    // Cập nhật state notifications và lưu vào localStorage (nhờ useEffect phía trên)
                    setNotifications((prev) => [...prev, newNotification]);

                    // Hiển thị thông báo sử dụng antd notification
                    notification.open({
                        message: "Thông báo",
                        description: displayMessage,
                        duration: 10,
                        placement: "topRight",
                        pauseOnHover: true,
                        showProgress: true,
                        type: "warning",
                    });
                }
            });
        };

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, [token, user]);

    return null;
};

export default RealTimeNotification;
