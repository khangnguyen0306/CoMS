import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/auth.slice";
// import { BE_API_LOCAL } from "../config";

export const clauseAPI = createApi({
    reducerPath: "clauseManagement",
    tagTypes: [],
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:8080/api/v1",
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

        getClauseManage: builder.query({
            query: ({ keyword, page, size, typeTermIds }) => ({
                url: `/terms/get-all?typeTermIds=${typeTermIds}&keyword=${keyword}&page=${page}&size=${size}`,
                method: "GET",
            }),
            providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
        }),
        getLegal: builder.query({
            query: ({ page, size }) => ({
                url: `/terms/get-all?typeTermIds=8&page=${page}&size=${size}`,
                method: "GET",
            }),
            providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
        }),
        getAllTypeClause: builder.query({
            query: (id) => ({
                url: `/terms/get-all-type-terms`,
                method: "GET",
            }),
            providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
        }),
        CreateClause: builder.mutation({
            query: ({ idType, label, value }) => ({
                url: `/terms/create/${idType}`,
                method: "POST",
                body: { label, value },
            }),
            providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
        }),
        UpdateClause: builder.mutation({
            query: ({ termId, label, value }) => ({
                url: `/terms/update/${termId}`,
                method: "PUT",
                body: { label, value },
            }),
            providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
        }),
        DeleteClause: builder.mutation({
            query: ({ termId }) => ({
                url: `/terms/update-status/${termId}/true`,
                method: "PUT",
            }),
            providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
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
    useGetClauseManageQuery,
    useGetAllTypeClauseQuery,
    useCreateClauseMutation,
    useUpdateClauseMutation,
    useGetLegalQuery,
    useDeleteClauseMutation,
} = clauseAPI;
