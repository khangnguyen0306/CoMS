import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/auth.slice";
// import { BE_API_LOCAL } from "../config";

export const ContractAPI = createApi({
    reducerPath: "contractManagement",
    tagTypes: ["Contract,ContractType"],
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

        getContractType: builder.query({
            query: () => `b4fac395-38bb-49c9-8db0-257252d1e30c`,
            providesTags: (result) =>
                result
                    ? result.contractTypes.map(({ id }) => ({ type: "ContractType", id }))
                    : [{ type: "ContractType", id: id }],
        }),

        // getPartnerInfoDetail: builder.query({
        //     query: (partnerId) => ({
        //         url: `9edef7db-1c09-42ed-aef8-ae8d14119f2c`,
        //         method: "GET",
        //     }),
        //     providesTags: (result, error, Partner) => [{ type: "Partner", id: Partner }],
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
    useGetContractTypeQuery,
    // useGetContractByPartnerQuery
} = ContractAPI;
