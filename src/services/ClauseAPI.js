import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";


export const clauseAPI = createApi({
    reducerPath: "clauseManagement",
    tagTypes: [],
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

        getClauseManage: builder.query({
            query: ({ keyword, page, size, typeTermIds }) => ({
                url: `/terms/get-all?typeTermIds=${typeTermIds}&keyword=${keyword?.trim() || ""}&page=${page}&size=${size}`,
                method: "GET",
            }),
            providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
        }),
        getLegal: builder.query({
            query: ({ page, size, keyword, order }) => ({
                url: `/terms/get-all?typeTermIds=8&page=${page}&size=${size}&order=${order}&keyword=${keyword}`,
                method: "GET",
            }),
            providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
        }),
        getLegalCreateContract: builder.query({
            query: ({ page, size, keyword, order }) => ({
                url: `/terms/get-all-less-field?typeTermIds=8&page=${page}&size=${size}&order=${order}&keyword=${keyword}`,
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
            query: ({ idType, label, value, typeTermId }) => ({
                url: `/terms/create/${idType}`,
                method: "POST",
                body: { label, value, typeTermId },
            }),
            invalidatesTags: [{ type: "Clause", id: "LIST" }],
            // providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
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

        getTermDetail: builder.query({
            query: (termId) => ({               // chua gan ID
                url: `terms/get-by-id/${termId}`,
                method: "GET",
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
    useLazyGetAllTypeClauseQuery,
    useCreateClauseMutation,
    useUpdateClauseMutation,
    useGetLegalQuery,
    useDeleteClauseMutation,
    useLazyGetLegalQuery,
    useLazyGetClauseManageQuery,
    useGetLegalCreateContractQuery,
    useLazyGetLegalCreateContractQuery,
    useLazyGetTermDetailQuery
} = clauseAPI;
