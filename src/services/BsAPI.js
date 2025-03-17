import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";


export const bussinessAPI = createApi({
    reducerPath: "bussinessManagement",
    tagTypes: ["Bussiness", "dashboard"],
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
        getBussinessInformatin: builder.query({
            query: () => ({
                url: `parties/get-by-id/${1}`,
                method: "GET",
            }),
            providesTags: (result, error, Bussiness) => [{ type: "Bussiness", id: Bussiness }],
        }),

        getDashboardata: builder.query({
            query: (params) => ({
                url: `dashboard/statistics`,
                params: {
                    year: params.year
                },
                method: "GET",
            }),
            providesTags: (result, error, dashboard) => [{ type: "dashboard", id: dashboard }],
        }),

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
    useGetBussinessInformatinQuery,
    useGetDashboardataQuery
} = bussinessAPI;
