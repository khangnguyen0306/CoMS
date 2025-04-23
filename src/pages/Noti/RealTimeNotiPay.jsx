import React, { useEffect, useState } from "react";
import { notification } from "antd";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentToken, selectCurrentUser, setNotiNumber } from "../../slices/authSlice";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useGetNumberNotiForAllQuery, useLazyGetNotificationsQuery } from "../../services/NotiAPI";

const RealTimeNotification = () => {
    const token = useSelector(selectCurrentToken);
    const user = useSelector(selectCurrentUser);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { refetch: refetchNoti } = useGetNumberNotiForAllQuery()
    const [fetchNotifications, { data: notiData, isFetching }] = useLazyGetNotificationsQuery();
    const [notifications, setNotifications] = useState([]);


    const handleIncomingNotification = (data) => {
        const msg = data.message;
        const dateMatch = msg.match(/lúc\s+([\d\-T:]+)/);
        let formattedDate = "";
        if (dateMatch) {
            formattedDate = dayjs(dateMatch[1]).format("DD/MM/YYYY HH:mm");
        }
        const displayMessage = msg.replace(
            /lúc\s+[\d\-T:]+/,
            `\nLúc ${formattedDate}`
        );

        const newNotification = {
            id: data.id || Date.now(),
            message: displayMessage,
            contractId: data.contractId,
            isRead: false,
        };

        setNotifications((prev) => {
            if (prev.some(n => n.id === newNotification.id)) return prev;
            const updated = [...prev, newNotification];
            const newUnread = updated.filter(n => !n.isRead).length;
            dispatch(setNotiNumber(newUnread));
            return updated;
        });

        refetchNoti();
        fetchNotifications()

        const text = data.message.toLowerCase();

        notification.open({
            message: "Thông báo",
            description: displayMessage,
            duration: 10,
            placement: "topRight",
            pauseOnHover: true,
            showProgress: true,
            type: "warning",

            // onClick sẽ được gọi khi user click notification
            onClick: () => {
                // Dùng `msg` hoặc `displayMessage` để check, chứ không phải `text`
                const contentToCheck = msg.toLowerCase();
                const isAppendix = contentToCheck.includes("phụ lục");

                if (text && text.includes("phụ lục")) {
                    if (user.roles[0] === "ROLE_STAFF") {
                        navigate("/appendix", { replace: true });
                    } else if (user.roles[0] === "ROLE_MANAGER") {
                        navigate("/manager/appendix", { replace: true });
                    } else if (user.roles[0] === "ROLE_DIRECTOR") {
                        navigate("/appendix", { replace: true });
                    }
                } else if (text && text.includes("từ chối")) {
                    navigate("/contractsApproval", { replace: true })
                }
                else {
                    if (user.roles[0] === "ROLE_STAFF") {
                        navigate("/approvalContract", { replace: true });
                    } else if (user.roles[0] === "ROLE_MANAGER") {
                        navigate("/manager/approvalContract", { replace: true });
                    } else if (user.roles[0] === "ROLE_DIRECTOR") {
                        navigate("/approvalContract", { replace: true });
                    }
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
        refetchNoti();
        fetchNotifications();
        return () => {
            stompClient.deactivate();
        };
    }, [token, user, dispatch]);

    return null;
};

export default RealTimeNotification;
