// appendixApi.js
import { baseApi } from './BaseAPI';

export const appendixApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllAppendixBySelf: builder.query({
      query: (params) => ({
        url: 'addendums/get-all',
        params: {
          page: params.page,
          size: params.size,
          order: 'esc',
          statuses: params.statuses || ""
        },
        method: 'GET',
      }),
      providesTags: (result, error, Appendix) => [{ type: 'Appendix', id: Appendix }],
    }),

    getAllAppendixByApprover: builder.query({
      query: ({ approverId, params }) => ({
        url: `addendums/get-addendum-for-approver/${approverId}`,
        // Nếu cần có params thì bỏ comment
        params: {
          page: params.page,
          size: params.size,
          order: 'esc'
        },
        method: 'GET',
      }),
      providesTags: (result, error, Appendix) => [{ type: 'Appendix', id: Appendix }],
    }),

    getAllAppendixByManager: builder.query({
      query: ({ managerId, params }) => ({
        url: `addendums/get-addendum-for-manager/${managerId}`,
        params: {
          page: params.page,
          size: params.size,
          order: 'esc',
        },
        method: 'GET',
      }),
      providesTags: (result, error, Appendix) => [{ type: 'Appendix', id: Appendix }],
    }),

    getAppendixDetail: builder.query({
      query: ({ id }) => ({
        url: `addendums/get-by-id/${id}`,
        // Nếu cần truyền params bổ sung thì có thể bổ sung sau
      }),
      providesTags: (result, error, id) => [{ type: 'Appendix', id: id }],
    }),

    getAppendixByContractId: builder.query({
      query: ({ id }) => ({
        url: `addendums/get-by-contract-id/${id}`,
        // Nếu cần truyền params bổ sung thì có thể bổ sung sau
      }),
      providesTags: (result) =>
        result
          ? result.data.map(({ id }) => ({ type: 'Appendix', id }))
          : [{ type: 'Appendix', id: 'LIST' }],
    }),

    createAppendix: builder.mutation({
      query: (appendixData) => ({
        url: 'addendums/create',
        method: 'POST',
        body: appendixData,
      }),
      invalidatesTags: [{ type: 'Appendix', id: 'LIST' }],
    }),

    updateAppendix: builder.mutation({
      query: ({ appendixId, ...updatedAppendix }) => ({
        url: `addendums/update/${appendixId}`,
        method: 'PUT',
        body: updatedAppendix,
      }),
      invalidatesTags: (result, error, { appendixId }) => [{ type: 'Appendix', id: appendixId }],
    }),

    createAppendixType: builder.mutation({
      query: (name) => ({
        url: 'addendum-types/create',
        method: 'POST',
        body: name,
      }),
      invalidatesTags: [{ type: 'appendixType', id: 'LIST' }],
    }),

    getAllAppendixType: builder.query({
      query: () => ({
        url: 'addendum-types/get-all',
      }),
      providesTags: (result) =>
        result
          ? result.data.map(({ addendumTypeId }) => ({ type: 'appendixType', addendumTypeId }))
          : [{ type: 'appendixType', id: 'LIST' }],
    }),

    editAppendixType: builder.mutation({
      query: ({ id, name }) => ({
        url: `addendum-types/update/${id}`,
        method: 'PUT',
        body: { name },
      }),
      invalidatesTags: (result, error, { addendumTypeId }) => [{ type: 'appendixType', id: addendumTypeId }],
    }),

    deleteAppendixType: builder.mutation({
      query: (appendixId) => ({
        url: `addendum-types/delete/${appendixId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, appendixId) => [{ type: 'appendixType', id: appendixId }],
    }),

    deleteAppendix: builder.mutation({
      query: (appendixId) => ({
        url: `addendums/delete/${appendixId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, appendixId) => [{ type: 'Appendix', id: appendixId }],
    }),

    createAppendixWorkFlow: builder.mutation({
      query: (workflowData) => ({
        url: 'addendums/create-workflow',
        method: 'POST',
        body: workflowData,
      }),
      invalidatesTags: [{ type: 'Appendix', id: 'LIST' }],
    }),

    duplicateAppendix: builder.mutation({
      query: ({ appendixId, contractId }) => ({
        url: `addendums/duplicate/${appendixId}/${contractId}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Appendix', id: 'LIST' }],
    }),

    resubmitAppendix: builder.mutation({
      query: (appendixId) => ({
        url: `addendums/resubmit/${appendixId}`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'Appendix', id: 'LIST' }],
    }),

    getProcessForAppendix: builder.query({
      query: () => ({
        url: `addendums/get-workflow-by-addendum-type`,
        method: 'GET',
      }),
      providesTags: (result, error, id) => [{ type: 'Appendix', id: id }],
    }),

    getWorkFlowByAppendixId: builder.query({
      query: ({ appendixId }) => ({
        url: `addendums/get-workflow-by-addendum/${appendixId}`,
        method: 'GET',
      }),
      providesTags: (result, error, appendixId) => [{ type: 'Appendix', id: appendixId }],
    }),

    rejectAppendix: builder.mutation({
      query: ({ appendixId, stageId, comment }) => ({
        url: `addendums/reject/${appendixId}/${stageId}`,
        method: 'PUT',
        body: { comment },
      }),
      invalidatesTags: [{ type: 'Appendix', id: 'LIST' }],
    }),

    approveAppendix: builder.mutation({
      query: ({ appendixId, stageId }) => ({
        url: `addendums/approve/${appendixId}/${stageId}`,
        method: 'PUT',
      }),
      invalidatesTags: [{ type: 'Appendix', id: 'LIST' }],
    }),
  }),
});

export const {
  useCreateAppendixMutation,
  useGetAppendixByContractIdQuery,
  useGetAppendixDetailQuery,
  useGetAllAppendixTypeQuery,
  useCreateAppendixTypeMutation,
  useEditAppendixTypeMutation,
  useDeleteAppendixTypeMutation,
  useGetAllAppendixBySelfQuery,
  useUpdateAppendixMutation,
  useDeleteAppendixMutation,
  useCreateAppendixWorkFlowMutation,
  useGetProcessForAppendixQuery,
  useGetAllAppendixByManagerQuery,
  useGetAllAppendixByApproverQuery,
  useGetWorkFlowByAppendixIdQuery,
  useRejectAppendixMutation,
  useApproveAppendixMutation,
  useDuplicateAppendixMutation,
  useResubmitAppendixMutation
} = appendixApi;
