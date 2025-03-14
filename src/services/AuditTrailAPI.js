import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";
// import { BE_API_LOCAL } from "../config";

export const AuditTrailAPI = createApi({
    reducerPath: "AuditrailAPI",
    tagTypes: ["AuditTrail"],
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
        getAllAuditTrailByContract: builder.query({
            query: ({id, params}) => ({
                url: `/audit-trails/original-contract/${id}`,
                params: {
                    page: params.page,
                    size: params.size,
                    order: "esc"
                }
            }),
            providesTags: (result) =>
                result
                    ? result.data.content.map(({ id }) => ({ type: "AuditTrail", id }))
                    : [{ type: "AuditTrail", id: "LIST" }],
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
    useGetAllAuditTrailByContractQuery,
    useLazyGetAllAuditTrailByContractQuery
} = AuditTrailAPI;
