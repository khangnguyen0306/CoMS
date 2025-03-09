import React, { useEffect, useState } from "react";
import { notification } from "antd";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentToken, selectCurrentUser, setNotiNumber } from "../../slices/authSlice";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const RealTimeNotification = () => {
    const token = useSelector(selectCurrentToken);
    const user = useSelector(selectCurrentUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Khởi tạo notifications từ sessionStorage nếu có
    const [notifications, setNotifications] = useState(() => {
        const stored = sessionStorage.getItem("notifications");
        return stored ? JSON.parse(stored) : [];
    });

    // Lưu notifications vào sessionStorage mỗi khi thay đổi
    useEffect(() => {
        sessionStorage.setItem("notifications", JSON.stringify(notifications));
    }, [notifications]);

    // Hàm cập nhật notiNumber dựa trên số thông báo chưa đọc
    const updateNotiNumber = (newNotifications) => {
        const unreadCount = newNotifications.filter((noti) => noti.isRead == false).length;
        dispatch(setNotiNumber(unreadCount));
    };

    useEffect(() => {
        const socket = new SockJS("http://157.66.26.11:8088/ws");
        const stompClient = new Client({
            webSocketFactory: () => socket,
            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },
            reconnectDelay: 5000,
            debug: (str) => {
                console.log("WebSocket debug:", str);
            },
        });

        stompClient.onConnect = (frame) => {
            console.log("Connected: ", frame);
            // Subscribe kênh payment
            stompClient.subscribe(`/user/${user.fullName}/queue/payment`, (message) => {
                console.log("Received payment message: ", message);
                if (message.body) {
                    const data = JSON.parse(message.body);
                    const msg = data.message;

                    const dateMatch = msg.match(/lúc\s+([\d\-T:]+)/);
                    let formattedDate = "";
                    if (dateMatch && dateMatch[1]) {
                        formattedDate = dayjs(dateMatch[1]).format("DD/MM/YYYY HH:mm");
                    }
                    const displayMessage = msg.replace(/lúc\s+[\d\-T:]+/, `\nLúc ${formattedDate}`);

                    const newNotification = { message: displayMessage, contractId: data.contractId, isRead: false };

                    setNotifications((prev) => {
                        const updated = [...prev, newNotification];
                        updateNotiNumber(updated);
                        return updated;
                    });

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

            // Subscribe kênh notifications
            stompClient.subscribe(`/user/${user.fullName}/queue/notifications`, (message) => {
                console.log("Received notification message: ", message);
                if (message.body) {
                    const data = JSON.parse(message.body);
                    const msg = data.message;

                    const dateMatch = msg.match(/lúc\s+([\d\-T:]+)/);
                    let formattedDate = "";
                    if (dateMatch && dateMatch[1]) {
                        formattedDate = dayjs(dateMatch[1]).format("DD/MM/YYYY HH:mm");
                    }
                    const displayMessage = msg.replace(/lúc\s+[\d\-T:]+/, `\nLúc ${formattedDate}`);

                    const newNotification = { message: displayMessage, contractId: data.contractId, isRead: false };

                    setNotifications((prev) => {
                        const updated = [...prev, newNotification];
                        updateNotiNumber(updated);
                        return updated;
                    });

                    notification.open({
                        message: "Thông báo",
                        description: displayMessage,
                        duration: 10,
                        placement: "topRight",
                        pauseOnHover: true,
                        showProgress: true,
                        type: "warning",
                        onClick: () => {
                            navigate(`/manager/ContractDetail/${data.contractId}`);
                        },
                    });
                }
            });
        };

        stompClient.activate();

        return () => {
            stompClient.deactivate();
        };
    }, [token, user, dispatch]);

    return null;
};

export default RealTimeNotification;
