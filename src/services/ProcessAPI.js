import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";

export const processAPI = createApi({
    reducerPath: "processManagement",
    tagTypes: ["ProcessList"],
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
        getProcessTemplates: builder.query({
            query: () => ({
                url: `/approval-workflows/get-by-id/1`,
                method: "GET",
            }),
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
            providesTags: (result, error, contractId) => [{ type: "ProcessList", id: contractId }],
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
            query: ({ approverId }) => ({
                url: `approval-workflows/get-contract-for-approver/${approverId}`,
                method: "GET",
            }),
            providesTags: (result, error, Partner) => [{ type: "Partner", id: Partner }],
        }),
        getProcessByContractTypeId: builder.query({
            query: ({ contractTypeId }) => ({
                url: `/approval-workflows/get-by-contract-type-id/${contractTypeId}`,
                method: "GET",
            }),
            providesTags: (result, error, contractId) => [{ type: "ProcessList", id: contractId }],
        }),
        getcomment: builder.query({
            query: ({ contractId }) => ({
                url: `/approval-workflows/get-contract-comments/${contractId}`,
                method: "GET",
            }),
            providesTags: (result, error, contractId) => [{ type: "ProcessList", id: contractId }],
        }),
        resubmitProcess: builder.mutation({
            query: ({ contractId }) => ({
                url: `/approval-workflows/resubmit/${contractId}`,
                method: "POST",
            }),
            providesTags: (result, error, contractId) => [{ type: "ProcessList", id: contractId }],
        }),
        getContractPorcessPendingManager: builder.query({
            query: ({ approverId }) => ({
                url: `approval-workflows/get-contract-for-manager/${approverId}`,
                method: "GET",
            }),
            providesTags: (result, error, Partner) => [{ type: "Partner", id: Partner }],
        }),

    })
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
} = processAPI;
