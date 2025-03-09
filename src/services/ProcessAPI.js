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
    }),
});

export const {
    useGetProcessTemplatesQuery,
    useCreateProcessMutation,
    useUpdateProcessMutation,
    useAssignProcessMutation,
} = processAPI;
