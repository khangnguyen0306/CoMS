// TemplateApi.js
import { baseApi } from "./BaseAPI";

export const TemplateAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTemplate: builder.query({
      query: (params) => ({
        url: `templates`,
        params: {
          page: params?.page || 0,
          size: params?.size || 10,
          keyword: params?.keyword || "",
          status: params?.status || "",
        },
      }),
      providesTags: (result) =>
        result && result.data?.content
          ? result.data.content.map(({ id }) => ({ type: "Template", id }))
          : [{ type: "Template", id: "LIST" }],
    }),
    getAllTemplateByContractTypeId: builder.query({
      query: (params) => ({
        url: `templates/by-contract-type/${params?.ContractTypeId}`,
        params: {
          page: params?.page || 0,
          size: params?.size || 10,
          keyword: params?.keyword || "",
          // ContractTypeId: params?.status || "",
        },
      }),
      providesTags: (result) =>
        result && result.data?.content
          ? result.content.map(({ id }) => ({ type: "Template", id }))
          : [{ type: "Template", id: "LIST" }],
    }),

    getAllDeletedTemplate: builder.query({
      query: (params) => ({
        url: `templates`,
        params: {
          page: params?.page || 0,
          size: params?.size || 10,
          keyword: params?.keyword || "",
          status: "DELETED",
        },
      }),
      providesTags: (result) =>
        result && result.data?.content
          ? result.data.content.map(({ id }) => ({ type: "Template", id }))
          : [{ type: "Template", id: "LIST" }],
    }),

    getTemplateDataDetail: builder.query({
      query: (templateId) => ({
        url: `templates/${templateId}`,
        method: "GET",
      }),
      providesTags: (result, error, templateId) => [{ type: "Template", id: templateId }],
    }),

    createTemplate: builder.mutation({
      query: (templateData) => ({
        url: `templates/create`,
        method: "POST",
        body: templateData,
      }),
      invalidatesTags: [{ type: "Template", id: "LIST" }],
    }),

    duplicateTemplate: builder.mutation({
      query: (templateId) => ({
        url: `templates/${templateId}/duplicate`,
        method: "POST",
        body: templateId,
      }),
      invalidatesTags: [{ type: "Template", id: "LIST" }],
    }),

    editTemplate: builder.mutation({
      query: ({ templateId, ...templateData }) => ({
        url: `/templates/update/${templateId}`,
        method: "PUT",
        body: templateData,
      }),
      invalidatesTags: (result, error, { templateId }) => [{ type: "Template", id: templateId }],
    }),

    deleteTemplate: builder.mutation({
      query: (templateId) => ({
        url: `/templates/soft-delete/${templateId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, templateId) => [{ type: "Template", id: templateId }],
    }),

    deleteTemplateNotRestore: builder.mutation({
      query: (templateId) => ({
        url: `/templates/${templateId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, templateId) => [{ type: "Template", id: templateId }],
    }),

    restoreTemplate: builder.mutation({
      query: (templateId) => ({
        url: `/templates/${templateId}/status`,
        params: {
          status: "CREATED",
        },
        method: "PUT",
      }),
      invalidatesTags: (result, error, templateId) => [{ type: "Template", id: templateId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAllTemplateQuery,
  useLazyGetAllTemplateQuery,
  useGetTemplateDataDetailQuery,
  useLazyGetTemplateDataDetailQuery,
  useGetAllDeletedTemplateQuery,
  useCreateTemplateMutation,
  useDuplicateTemplateMutation,
  useEditTemplateMutation,
  useDeleteTemplateMutation,
  useDeleteTemplateNotRestoreMutation,
  useRestoreTemplateMutation,
  useGetAllTemplateByContractTypeIdQuery,
  useLazyGetAllTemplateByContractTypeIdQuery
} = TemplateAPI;
