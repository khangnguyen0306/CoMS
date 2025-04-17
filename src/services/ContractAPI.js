// ContractApi.js
import { baseApi } from "./BaseAPI";

export const ContractAPI = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getContractType: builder.query({
            query: () => `contract-types`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "ContractType", id }))
                    : [{ type: "ContractType", id: "UNKNOWN_ID" }],
        }),

        getAllContract: builder.query({
            query: (params) => ({
                url: `contracts`,
                params: {
                    page: params?.page || 0,
                    size: params?.size || 10,
                    keyword: params?.keyword || "",
                    statuses: params?.status || "",
                },
            }),
            providesTags: (result) =>
                result
                    ? result.data.content.map(({ id }) => ({ type: "Contract", id }))
                    : [{ type: "Contract", id: "LIST" }],
        }),

        getAllContractPartner: builder.query({
            query: () =>
                `https://mocki.io/v1/510fa7fd-5caa-4cfa-b858-5c6ea74cc683`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "Contract", id }))
                    : [{ type: "Contract", id: "LIST" }],
        }),

        getContractDetail: builder.query({
            query: (contractId) => ({
                url: `contracts/${contractId}`,
                method: "GET",
            }),
            providesTags: (result, error, Contract) => [
                { type: "Contract", id: Contract },
            ],
        }),

        getContractStatus: builder.query({
            query: ({ page, keyword, size, statuses, sortBy = 'id', order = 'asc' }) => {
                const statusesQuery = statuses ? statuses.map(status => `statuses=${status}`).join('&') : ['CREATED', 'UPDATED', 'REJECTED', 'FIXED'];
                return {
                    url: `contracts?page=${page || 0}&size=${size || 0}&${statusesQuery}&sortBy=${sortBy}&order=${order}&keyword=${keyword}`,
                    method: "GET",
                };
            },
            providesTags: (result, error, arg) => [
                { type: "Contract", id: arg.partnerId || 'LIST' },
            ],
        }),


        createContractType: builder.mutation({
            query: ({ name }) => ({
                url: `contract-types`,
                method: "POST",
                body: { name },
            }),
            invalidatesTags: [{ type: "ContractType", id: "LIST" }],
        }),

        createContract: builder.mutation({
            query: (contractData) => ({
                url: `/contracts`,
                method: "POST",
                body: contractData,
            }),
            // Lưu ý: Nếu đây là API contract thì tag nên là "Contract" thay vì "DoctorList"
            invalidatesTags: [{ type: "Contract", id: "LIST" }],
        }),

        editContractType: builder.mutation({
            query: ({ name, id }) => ({
                url: `contract-types/${id}`,
                method: "PUT",
                body: { name },
            }),
            invalidatesTags: (result, error, { id }) => [
                { type: "ContractType", id: id },
            ],
        }),

        deleteContractType: builder.mutation({
            query: (contractTypeId) => ({
                url: `contract-types/${contractTypeId}/delete-status?isDeleted=${true}`,
                method: "PATCH",
            }),
            invalidatesTags: (result, error, contractTypeId) => [
                { type: "ContractType", id: contractTypeId },
            ],
        }),

        duplicateContract: builder.mutation({
            query: (contractId) => ({
                url: `contracts/${contractId}/duplicate`,
                method: "POST",
                body: contractId,
            }),
            invalidatesTags: [{ type: "Contract", id: "LIST" }],
        }),
        duplicateContractWithNewPartner: builder.mutation({
            query: ({ contractId, partnerId }) => ({
                url: `contracts/${contractId}/duplicate-with-partner`,
                params: {
                    partnerId: partnerId
                },
                method: "POST",
                body: contractId,
            }),
            invalidatesTags: [{ type: "Contract", id: "LIST" }],
        }),

        softDeleteContract: builder.mutation({
            query: (contractId) => ({
                url: `/contracts/soft-delete/${contractId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, contractId) => [
                { type: "Contract", id: contractId },
            ],
        }),

        reStoreContract: builder.mutation({
            query: (contractId) => ({
                url: `/contracts/status/${contractId}`,
                params: {
                    status: "CREATED",
                },
                method: "PUT",
            }),
            invalidatesTags: (result, error, { contractId }) => [
                { type: "Contract", id: contractId },
            ],
        }),

        updateContract: builder.mutation({
            query: ({ contractId, ...contractData }) => ({
                url: `/contracts/update/${contractId}`,
                method: "PUT",
                body: contractData,
            }),
            invalidatesTags: (result, error, { contractId }) => [
                { type: "Contract", id: contractId },
            ],
        }),

        deleteContract: builder.mutation({
            query: (contractId) => ({
                url: `/contracts/${contractId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, contractId) => [
                { type: "Contract", id: contractId },
            ],
        }),

        getDataContractCompareVersion: builder.query({
            query: (params) => ({
                url: `contracts/compare-versions`,
                params: {
                    originalContractId: params?.contractId || "",
                    version1: params?.version1 || "",
                    version2: params?.version2 || "",
                },
                method: "GET",
            }),
            providesTags: (result, error, Compare) => [
                { type: "Compare", id: Compare },
            ],
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
                url: `/partner-contracts/create`,
                method: "POST",
                body: contractData,
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),
        getContractPartnerQuery: builder.query({
            query: ({ search, page, size }) => ({
                url: `/partner-contracts/get-all`,
                method: "GET",
                params: { search, page, size },
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),
        deleteContractPartner: builder.mutation({
            query: ({ partnerContractId }) => ({
                url: `/partner-contracts/delete/${partnerContractId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),
        updateContractPartner: builder.mutation({
            query: ({ partnerContractId, body }) => ({
                url: `/partner-contracts/update/${partnerContractId}`,
                method: "PUT",
                body: body,
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),
        uploadBillingContract: builder.mutation({
            query: ({ paymentScheduleId, formData }) => ({
                url: `/partner-contracts/upload-bills/${paymentScheduleId}`,
                method: "PUT",
                body: formData,
                responseHandler: (response) => response.text(),
            }),
            invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),

        uploadContractAlreadySigned: builder.mutation({
            query: (body) => {
                return {
                    url: `contracts/sign`,
                    method: "POST",
                    body: body,
                };
            },
            invalidatesTags: [{ type: "Contract", id: "LIST" }],
        }),
   


        getImgBill: builder.query({
            query: (paymentScheduleId) => ({
                url: `/payment-schedules/bill-urls/${paymentScheduleId}`,
                method: "GET",
            }),
            providesTags: (result, error, paymentScheduleId) => [{ type: "Contract", id: paymentScheduleId }],
        }),
        getImgSign: builder.query({
            query: (contractId) => ({
                url: `/contracts/signed-contract-urls/${contractId}`,
                method: "GET",
            }),
            providesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
        }),


    }),
    overrideExisting: false,
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
    useUploadBillingContractMutation,
    useGetImgBillQuery,
    useUploadContractAlreadySignedMutation,
    useDuplicateContractWithNewPartnerMutation,
    useGetImgSignQuery,

} = ContractAPI;
