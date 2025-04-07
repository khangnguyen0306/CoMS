// clauseApi.js
import { baseApi } from "./BaseAPI";

export const clauseAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClauseManage: builder.query({
      query: ({ keyword, page, size, typeTermIds, order, sortBy }) => ({
        url: `/terms/get-all`,
        params: { keyword, page, size, typeTermIds, order, sortBy },
        method: "GET",
      }),
      providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
    }),

    getLegal: builder.query({
      query: ({ page, size, keyword, order }) => ({
        url: `/terms/get-all`,
        params: { typeTermIds: 8, page, size, order, keyword },
        method: "GET",
      }),
      providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
    }),

    getLegalCreateContract: builder.query({
      query: ({ page, size, keyword, order }) => ({
        url: `/terms/get-all-less-field`,
        params: { typeTermIds: 8, page, size, order, keyword },
        method: "GET",
      }),
      providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
    }),

    getAllTypeClause: builder.query({
      query: () => ({
        url: `/terms/get-all-type-terms`,
        method: "GET",
      }),
      providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
    }),

    searchTermsByHover: builder.query({
      query: (params) => ({
        url: `/terms/search`,
        params: {
          page: params.page,
          size: params.size,
          keyword: params.keyword
        },
        method: "GET",
      }),
      providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
    }),

    CreateClause: builder.mutation({
      query: ({ label, value, typeTermId }) => ({
        url: `/terms/create/${typeTermId}`,
        method: "POST",
        body: { label, value },
      }),
      invalidatesTags: [{ type: "Clause", id: "LIST" }],
    }),


    UpdateClause: builder.mutation({
      query: ({ termId, label, value, typeTermId }) => ({
        url: `/terms/update/${termId}`,
        method: "PUT",
        body: { label, value, typeTermId },
      }),
      providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
    }),

    DeleteClause: builder.mutation({
      query: ({ termId }) => ({
        url: `/terms/update-status/${termId}/true`,
        method: "PUT",
      }),
      providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
    }),
    getTermDetail: builder.query({
      query: (termId) => ({
        url: `/terms/get-by-id/${termId}`,
        method: "GET",
      }),
      providesTags: (result, error, Clause) => [{ type: "Clause", id: Clause }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetClauseManageQuery,
  useGetAllTypeClauseQuery,
  useLazyGetAllTypeClauseQuery,
  useCreateClauseMutation,
  useUpdateClauseMutation,
  useGetLegalQuery,
  useDeleteClauseMutation,
  useLazyGetLegalQuery,
  useLazyGetClauseManageQuery,
  useGetLegalCreateContractQuery,
  useLazyGetLegalCreateContractQuery,
  useLazyGetTermDetailQuery,
  useSearchTermsByHoverQuery
} = clauseAPI;
