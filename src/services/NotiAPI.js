import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";

export const notiAPI = createApi({
    reducerPath: "notificationAPI",
    tagTypes: ["Notification"],
    baseQuery: fetchBaseQuery({
        baseUrl: BE_API_LOCAL,
        prepareHeaders: (headers, { getState }) => {
            const token = selectTokens(getState());
            if (token) {
                headers.append("Authorization", `Bearer ${token}`);
            }
            headers.append("Content-Type", "application/json");
            return headers;
        },
    }),
    endpoints: (builder) => ({
        // Lấy danh sách thông báo
        getNotifications: builder.query({
            query: ({ page, size }) => ({
                url: `notifications/get-all-by-user?page=${page}&size=${size}`,
                method: "GET",
            }),
            providesTags: (result, error, Notifications) => [{ type: "Notifications", id: Notifications }],

        }),
        updateReadStatus: builder.mutation({
            query: (id) => ({
                url: `notifications/mark-as-read/${id}`,
                method: "PUT",
            }),
            invalidatesTags: [{ type: "Notifications", id: "LIST" }],
        }),

    }),
});

export const {
    useGetNotificationsQuery,
    useUpdateReadStatusMutation,
    useLazyGetNotificationsQuery,

} = notiAPI;
