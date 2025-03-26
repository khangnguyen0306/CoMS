// auditTrailApi.js
import { baseApi } from "./BaseAPI";

export const AuditTrailAPI = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAllAuditTrailByContract: builder.query({
            query: ({ id, params }) => ({
                url: `/audit-trails/original-contract/${id}`,
                params: {
                    page: params.page,
                    size: params.size,
                    order: "esc",
                },
            }),
            providesTags: (result) =>
                result
                    ? result.data.content.map(({ id }) => ({ type: "AuditTrail", id }))
                    : [{ type: "AuditTrail", id: "LIST" }],
        }),

        getDateChangeContract: builder.query({
            query: ({ id, params }) => ({
                url: `/audit-trails/original-contract/${id}/change-dates`,
                params: {
                    page: params.page,
                    size: params.size,
                    order: "esc",
                },
            }),
            providesTags: (result) =>
                result
                    ? result.data.content.map(({ id }) => ({ type: "AuditTrail", id }))
                    : [{ type: "AuditTrail", id: "LIST" }],
        }),

        getDataChangeByDate: builder.query({
            query: ({ id, params }) => ({
                url: `/audit-trails/original-contract/${id}/changes-by-date`,
                params: {
                    page: params.page,
                    size: params.size,
                    order: "esc",
                    date: params.date,
                },
            }),
            providesTags: (result) =>
                result
                    ? result.data.content.map(({ id }) => ({ type: "AuditTrail", id }))
                    : [{ type: "AuditTrail", id: "LIST" }],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetAllAuditTrailByContractQuery,
    useLazyGetAllAuditTrailByContractQuery,
    useGetDateChangeContractQuery,
    useGetDataChangeByDateQuery,
    useLazyGetDataChangeByDateQuery,
    useLazyGetDateChangeContractQuery,
} = AuditTrailAPI;
