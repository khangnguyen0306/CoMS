import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";
import { baseApi } from "./BaseAPI";

export const notiAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Lấy danh sách thông báo
    getNotifications: builder.query({
      query: ({ page, size }) => ({
        url: `notifications/get-all-by-user`,
        params: {
          page: page || 0,
          size: size || 10,
        },
        method: "GET",
      }),
      providesTags: (result) =>
        result && Array.isArray(result.data?.content)
          ? result.data.content.map(({ id }) => ({ type: "Notification", id }))
          : [{ type: "Notification", id: "LIST" }],
    }),
    // Cập nhật trạng thái đã đọc của thông báo
    updateReadStatus: builder.mutation({
      query: (id) => ({
        url: `notifications/mark-as-read/${id}`,
        method: "PUT",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    // Lấy số lượng thông báo hoặc thống kê liên quan
    getNumberNotiForAll: builder.query({
      query: () => ({
        url: `approval-workflows/get-approval-stats`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [{ type: "Notification", id: "STATS" }]
          : [{ type: "Notification", id: "LIST" }],
    }),
    updateReadStatusAll: builder.mutation({
      query: () => ({
        url: `notifications/mark-all-as-read`,
        method: "PUT",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetNotificationsQuery,
  useUpdateReadStatusMutation,
  useLazyGetNotificationsQuery,
  useGetNumberNotiForAllQuery,
  useUpdateReadStatusAllMutation,
} = notiAPI;
