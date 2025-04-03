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

    const [notifications, setNotifications] = useState([]);

    console.log("user", user.roles);

    const handleIncomingNotification = (data) => {
        const msg = data.message;
        const dateMatch = msg.match(/lúc\s+([\d\-T:]+)/);
        let formattedDate = "";
        if (dateMatch && dateMatch[1]) {
            formattedDate = dayjs(dateMatch[1]).format("DD/MM/YYYY HH:mm");
        }
        const displayMessage = msg.replace(/lúc\s+[\d\-T:]+/, `\nLúc ${formattedDate}`);

        // Tạo đối tượng thông báo mới, đảm bảo có id duy nhất
        const newNotification = {
            id: data.id || Date.now(),
            message: displayMessage,
            contractId: data.contractId,
            isRead: false,
        };

        setNotifications((prev) => {
            // Kiểm tra xem thông báo mới đã có trong danh sách chưa
            if (prev.some(noti => noti.id === newNotification.id)) {
                return prev;
            }
            const updated = [...prev, newNotification];
            // Tính lại số lượng thông báo chưa đọc
            const newUnreadCount = updated.filter((noti) => !noti.isRead).length;
            dispatch(setNotiNumber(newUnreadCount));
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
                if (user?.roles.includes("ROLE_STAFF")) {
                    navigate(`/approvalContract/reviewContract/${data.contractId}`);
                } else {
                    navigate(`/manager/approvalContract/reviewContract/${data.contractId}`);
                }
            },

        });
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
                // console.log("WebSocket debug:", str);
            },
        });

        stompClient.onConnect = (frame) => {
            // console.log("Connected: ", frame);

            stompClient.subscribe(`/user/${user.fullName}/queue/payment`, (message) => {
                if (message.body) {
                    const data = JSON.parse(message.body);
                    handleIncomingNotification(data);
                }
            });

            stompClient.subscribe(`/user/${user.fullName}/queue/notifications`, (message) => {
                if (message.body) {
                    const data = JSON.parse(message.body);
                    handleIncomingNotification(data);
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
