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
      providesTags: (result, error, Partner) => [
        { type: "Partner", id: Partner },
      ],
    }),

    getContractStatus: builder.query({
      query: () => ({
        url: `contracts?page=0&size=10&statuses=CREATED&statuses=UPDATED&statuses=REJECTED&statuses=FIXED&sortBy=id&order=asc`,
        method: "GET",
      }),
      providesTags: (result, error, Partner) => [
        { type: "Partner", id: Partner },
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
          status: "DRAFT",
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
          size: params?.size,
        },
        method: "GET",
      }),
      providesTags: (result, error, partnerId) => [
        { type: "PartnerContract", id: partnerId },
      ],
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
} = ContractAPI;
