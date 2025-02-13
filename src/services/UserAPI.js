import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/auth.slice";
// import { BE_API_LOCAL } from "../config";

export const userAPI = createApi({
    reducerPath: "userManagement",
    tagTypes: ['USER','ROLE'],
    baseQuery: fetchBaseQuery({
        baseUrl: "https://mocki.io/v1/",
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
        getAllUser: builder.query({
            query: () => `a031aa4f-2c07-4d77-a16f-bb44296d7794`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "USER", id }))
                    : [{ type: "USER", id: id }],
        }),
        getAllUserRole: builder.query({
            query: () => `ff1a6575-2d88-4543-b31a-adb41df22e69`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "ROLE", id }))
                    : [{ type: "ROLE", id: id }],
        }),
        // getTaskManage: builder.query({
        //     query: () => ({
        //         url: `/0d303150-d00d-4f4d-98ca-f073ec3e704b`,
        //         method: "GET",
        //     }),
        //     providesTags: (result, error, Task) => [{ type: "Task", id: Task }],
        // }),

        // createDoctor: builder.mutation({
        //     query: (newDoctorData) => ({
        //         url: `/create`,
        //         method: "POST",
        //         body: newDoctorData,
        //     }),
        //     invalidatesTags: [{ type: "DoctorList", id: "LIST" }],
        // }),

        // editDoctor: builder.mutation({
        //     query: ({ userId, ...updatedDoctorData }) => ({
        //         url: `/update/${userId}`, // Sử dụng userId để phù hợp với tài liệu API
        //         method: "PUT",
        //         body: updatedDoctorData,
        //     }),
        //     invalidatesTags: (result, error, { userId }) => [{ type: "DoctorList", id: userId }],
        // }),


        // deleteDoctor: builder.mutation({
        //     query: (userId) => ({
        //         url: `/delete/${userId}`, // Use userId instead of doctorId
        //         method: "DELETE",
        //     }),
        //     invalidatesTags: (result, error, userId) => [{ type: "DoctorList", id: userId }],
        // }),
    }),
});

export const {
    // useGetTaskManageQuery,
    useGetAllUserQuery,
    useGetAllUserRoleQuery
} = userAPI;
