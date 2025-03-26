import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";
// import { BE_API_LOCAL } from "../config";

export const ContractAPI = createApi({
    reducerPath: "contractManagement",
    tagTypes: ["Contract", "Compare", "ContractType", "PartnerContract"],
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

        getContractType: builder.query({
            query: () => `contract-types`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "ContractType", id }))
                    : [{ type: "ContractType", id: 'UNKNOWN_ID' }],
        }),

        getAllContract: builder.query({
            query: (params) => ({
                url: `contracts`,
                params: {
                    page: params?.page || 0,
                    size: params?.size || 10,
                    keyword: params?.keyword || '',
                    statuses: params?.status || ''
                },
            }),
            providesTags: (result) =>
                result
                    ? result.data.content.map(({ id }) => ({ type: "Contract", id }))
                    : [{ type: "Contract", id: id }],
        }),

        getAllContractPartner: builder.query({
            query: () => `https://mocki.io/v1/510fa7fd-5caa-4cfa-b858-5c6ea74cc683`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "Contract", id }))
                    : [{ type: "Contract", id: id }],
        }),
        getContractDetail: builder.query({
            query: (contractId) => ({
                url: `contracts/${contractId}`,
                method: "GET",
            }),
            providesTags: (result, error, Partner) => [{ type: "Partner", id: Partner }],
        }),

        getContractStatus: builder.query({
            query: () => ({
                url: `contracts?page=0&size=10&statuses=CREATED&statuses=UPDATED&statuses=REJECTED&statuses=FIXED&sortBy=id&order=asc`,
                method: "GET",
            }),
            providesTags: (result, error, Partner) => [{ type: "Partner", id: Partner }],
        }),

        createContractType: builder.mutation({
            query: ({ name }) => ({
                url: `contract-types`,
                method: "POST",
                body: { name: name },
            }),
            invalidatesTags: [{ type: "ContractType", id: "LIST" }],
        }),
        createContract: builder.mutation({
            query: (contractData) => ({
                url: `/contracts`,
                method: "POST",
                body: contractData,
            }),
            invalidatesTags: [{ type: "DoctorList", id: "LIST" }],
        }),

        editContractType: builder.mutation({
            query: ({ name, id }) => ({
                url: `contract-types/${id}`,
                method: "PUT",
                body: { name: name },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "ContractType", id: id }],
        }),

        deleteContractType: builder.mutation({
            query: (contractTypeId) => ({
                url: `contract-types/${contractTypeId}/delete-status?isDeleted=${true}`,
                method: "PATCH",
            }),
            invalidatesTags: (result, error, contractTypeId) => [{ type: "ContractType", id: contractTypeId }],
        }),
        duplicateContract: builder.mutation({
            query: (contractId) => ({
                url: `contracts/${contractId}/duplicate`,
                method: "POST",
                body: contractId,
            }),
            invalidatesTags: [{ type: "Contract", id: "LIST" }],
        }),

        softDeleteContract: builder.mutation({
            query: (contractId) => ({
                url: `/contracts/soft-delete/${contractId}`, // Use contractId instead of doctorId
                method: "DELETE",
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),

        reStoreContract: builder.mutation({
            query: (contractId) => ({
                url: `/contracts/status/${contractId}`,
                params: {
                    status: "DRAFT"
                },
                method: "PUT",
            }),
            invalidatesTags: (result, error, { contractId }) => [{ type: "Contract", id: contractId }],
        }),

        updateContract: builder.mutation({
            query: ({ contractId, ...contractData }) => ({
                url: `/contracts/update/${contractId}`,
                method: "PUT",
                body: contractData,
            }),
            invalidatesTags: (result, error, { contractId }) => [{ type: "Contract", id: contractId }],
        }),

        deleteContract: builder.mutation({
            query: (contractId) => ({
                url: `/contracts/${contractId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),


        getDataContractCompareVersion: builder.query({
            query: (params) => ({
                url: `contracts/compare-versions`,
                params: {
                    originalContractId: params?.contractId || '',
                    version1: params?.version1 || '',
                    version2: params?.version2 || ''
                },
                method: "GET",
            }),
            providesTags: (result, error, Compare) => [{ type: "Compare", id: Compare }],
        }),

        getContractByPartnerId: builder.query({
            query: (params) => ({
                url: `contracts/partner/${params.partnerId}`,
                params: {
                    page: params?.page,
                    size: params?.size
                },
                method: "GET",
            }),
            providesTags: (result, error, partnerId) => [{ type: "PartnerContract", id: partnerId }],
        }),
        createContractPartner: builder.mutation({
            query: (contractData) => ({
                url: `/contract-partners/create`,
                method: "POST",
                body: contractData,
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),
        getContractPartnerQuery: builder.query({
            query: ({ search, page, size }) => ({
                url: `/contract-partners/get-all`,
                method: "GET",
                params: { search, page, size },
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),
        deleteContractPartner: builder.mutation({
            query: ({ contractPartnerId }) => ({
                url: `/contract-partners/delete/${contractPartnerId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),
        updateContractPartner: builder.mutation({
            query: ({ contractPartnerId, body }) => ({
                url: `/contract-partners/update/${contractPartnerId}`,
                method: "PUT",
                body: body,
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
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
    useLazyGetContractTypeQuery,
    useGetAllContractQuery,
    useGetAllContractPartnerQuery,
    useCreateContractTypeMutation,
    useEditContractTypeMutation,
    useDeleteContractTypeMutation,
    useCreateContractMutation,
    useGetContractDetailQuery,
    useDuplicateContractMutation,
    useReStoreContractMutation,
    useSoftDeleteContractMutation,
    useDeleteContractMutation,
    useLazyGetContractDetailQuery,
    useUpdateContractMutation,
    useGetContractStatusQuery,
    useGetDataContractCompareVersionQuery,
    useGetContractByPartnerIdQuery,
    useCreateContractPartnerMutation,
    useGetContractPartnerQueryQuery,
    useDeleteContractPartnerMutation,
    useUpdateContractPartnerMutation,

    // useGetContractByPartnerQuery
} = ContractAPI;



