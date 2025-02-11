import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/auth.slice";
// import { BE_API_LOCAL } from "../config";

export const partnerAPI = createApi({
    reducerPath: "partnerManagement",
    tagTypes: ["Partner,Contract"],
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

        getContractByPartner: builder.query({
            query: (partnerId) => `c89214ba-a149-4840-a892-5edb1c5f0b70`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "Contract", id }))
                    : [{ type: "Contract", id: "LIST" }],
        }),

        getPartnerInfoDetail: builder.query({
            query: (partnerId) => ({
                url: `9edef7db-1c09-42ed-aef8-ae8d14119f2c`,
                method: "GET",
            }),
            providesTags: (result, error, Partner) => [{ type: "Partner", id: Partner }],
        }),

        getPartnerList: builder.query({
            query: (partnerId) => ({
                url: `1328843e-8f6e-4ff0-8733-8027b7fe9ac6`,
                method: "GET",
            }),
            providesTags: (result, error, Partner) => [{ type: "Partner", id: Partner }],
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
    useGetPartnerInfoDetailQuery,
    useGetContractByPartnerQuery,
    useGetPartnerListQuery,
} = partnerAPI;
