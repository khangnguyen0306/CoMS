// processApi.js
import { baseApi } from "./BaseAPI";

export const processAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProcessTemplates: builder.query({
      query: () => ({
        url: `/approval-workflows/get-by-id/1`,
        method: "GET",
      }),
      // Sau khi lấy template, ta làm mới danh sách process (hoặc sử dụng providesTags nếu dữ liệu cần cache)
      invalidatesTags: [{ type: "ProcessList", id: "LIST" }],
    }),
    createProcess: builder.mutation({
      query: (processData) => ({
        url: `/approval-workflows/create`,
        method: "POST",
        body: processData,
      }),
      invalidatesTags: [{ type: "ProcessList", id: "LIST" }],
    }),
    updateProcess: builder.mutation({
      query: ({ payload, id }) => ({
        url: `/approval-workflows/update/${id}`,
        method: "PUT",
        body: payload,
      }),
      invalidatesTags: [{ type: "ProcessList", id: "LIST" }],
    }),
    assignProcess: builder.mutation({
      query: ({ contractId, workflowId }) => ({
        url: `/approval-workflows/assign/${contractId}/${workflowId}`,
        method: "PUT",
      }),
      invalidatesTags: [{ type: "ProcessList", id: "LIST" }],
    }),
    getProcessByContractId: builder.query({
      query: ({ contractId }) => ({
        url: `/approval-workflows/get-by-contract-id/${contractId}`,
        method: "GET",
      }),
      providesTags: (result, error, contractId) => [
        { type: "ProcessList", id: contractId },
      ],
    }),
    rejectProcess: builder.mutation({
      query: ({ comment, contractId, stageId }) => ({
        url: `/approval-workflows/reject/${contractId}/${stageId}`,
        method: "PUT",
        body: { comment },
      }),
      invalidatesTags: [{ type: "ProcessList", id: "LIST" }],
    }),
    approveProcess: builder.mutation({
      query: ({ contractId, stageId }) => ({
        url: `/approval-workflows/approve/${contractId}/${stageId}`,
        method: "PUT",
      }),
      invalidatesTags: [{ type: "ProcessList", id: "LIST" }],
    }),
    getContractPorcessPending: builder.query({
      query: ({ approverId, keyword, size, page, status }) => {
        const params = { page, size, keyword };
        if (status) {
          params.status = status;
        }
        return {
          url: `approval-workflows/get-contract-for-approver/${approverId}`,
          method: "GET",
          params,
        };
      },
      providesTags: (result, error, approverId) => [
        { type: "ProcessList", id: approverId },
      ],
    }),
    getProcessByContractTypeId: builder.query({
      query: ({ contractTypeId }) => ({
        url: `/approval-workflows/get-by-contract-type-id/${contractTypeId}`,
        method: "GET",
      }),
      providesTags: (result, error, contractTypeId) => [
        { type: "ProcessList", id: contractTypeId },
      ],
    }),
    getcomment: builder.query({
      query: ({ contractId }) => ({
        url: `/approval-workflows/get-contract-comments/${contractId}`,
        method: "GET",
      }),
      providesTags: (result, error, contractId) => [
        { type: "ProcessList", id: contractId },
      ],
    }),
    resubmitProcess: builder.mutation({
      query: ({ contractId }) => ({
        url: `/approval-workflows/resubmit/${contractId}`,
        method: "POST",
      }),
      // Nếu muốn làm mới dữ liệu sau resubmit, có thể dùng invalidatesTags với contractId
      providesTags: (result, error, contractId) => [
        { type: "ProcessList", id: contractId },
      ],
    }),
    getContractPorcessPendingManager: builder.query({
      query: ({ approverId, page, size, keyword = "" }) => ({
        url: `approval-workflows/get-contract-for-manager/${approverId}`,
        method: "GET",
        params: { page, size, keyword },
      }),
      providesTags: (result, error, { approverId }) => [
        { type: "Partner", id: approverId },
      ],
    }),

    // Endpoint dành cho appendix
    approveOldWorkFlow: builder.mutation({
      query: ({ appendixId }) => ({
        url: `addendums/assign-old-workflow-of-contract/${appendixId}`,
        method: "PUT",
      }),
      invalidatesTags: [{ type: "processAppendix", id: "LIST" }],
    }),

    assignNewAppendixWorkFlow: builder.mutation({
      query: ({ appendixId, workflowId }) => ({
        url: `addendums/assign-new-workflow/${appendixId}/${workflowId}`,
        method: "PUT",
      }),
      invalidatesTags: [{ type: "processAppendix", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProcessTemplatesQuery,
  useCreateProcessMutation,
  useUpdateProcessMutation,
  useAssignProcessMutation,
  useGetProcessByContractIdQuery,
  useRejectProcessMutation,
  useApproveProcessMutation,
  useGetContractPorcessPendingQuery,
  useLazyGetProcessByContractIdQuery,
  useGetProcessByContractTypeIdQuery,
  useGetcommentQuery,
  useResubmitProcessMutation,
  useGetContractPorcessPendingManagerQuery,
  useApproveOldWorkFlowMutation,
  useAssignNewAppendixWorkFlowMutation
} = processAPI;
