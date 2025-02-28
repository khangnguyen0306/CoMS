import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/auth.slice";
import { BE_API_LOCAL } from "../config/config";


export const partnerAPI = createApi({
    reducerPath: "partnerManagement",
    tagTypes: ["Partner,Contract"],
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

        getContractByPartner: builder.query({
            query: (partnerId) => `https://mocki.io/v1/c89214ba-a149-4840-a892-5edb1c5f0b70`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "Contract", id }))
                    : [{ type: "Contract", id: "LIST" }],
        }),

        getPartnerInfoDetail: builder.query({
            query: ({ id }) => ({
                url: `parties/get-by-id/${id}`,
                method: "GET",
            }),
            providesTags: (result, error, Partner) => [{ type: "Partner", id: Partner }],
        }),

        getPartnerList: builder.query({
            query: ({ keyword, page, size }) => ({
                url: `parties/get-all?keyword=${keyword}&page=${page}&pageSize=${size}`,
                method: "GET",
            }),
            providesTags: (result, error, Partner) =>
                result
                    ? result?.data?.content.map(({ id }) => ({ type: "Partner", id }))
                    : [{ type: "Partner", id: "LIST" }],
        }),

        createPartner: builder.mutation({
            query: (partnerData) => ({
                url: `parties/create`,
                method: "POST",
                body: partnerData,
            }),
            invalidatesTags: [{ type: "Partner", id: "LIST" }],
        }),

        editPartner: builder.mutation({
            query: ({ id, ...updatedPartnerData }) => ({
                url: `parties/update/${id}`,
                method: "PUT",
                body: updatedPartnerData,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Partner", id: id }],
        }),


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
    useLazyGetPartnerListQuery,
    useCreatePartnerMutation,
    useEditPartnerMutation
} = partnerAPI;
