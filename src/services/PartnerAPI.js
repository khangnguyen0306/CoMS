// partnerApi.js
import { baseApi } from "./BaseAPI";

export const partnerAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getContractByPartner: builder.query({
      query: (partnerId) =>
        // Sử dụng URL mock theo như đã định nghĩa
        "https://mocki.io/v1/c89214ba-a149-4840-a892-5edb1c5f0b70",
      providesTags: (result) =>
        result && Array.isArray(result)
          ? result.map(({ id }) => ({ type: "Contract", id }))
          : [{ type: "Contract", id: "LIST" }],
    }),

    getPartnerInfoDetail: builder.query({
      query: ({ id }) => ({
        url: `parties/get-by-id/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, arg) => [{ type: "Partner", id: arg.id }],
    }),

    generateReportPartner: builder.query({
      query: ({ from, to }) => ({
        url: `dashboard/customer/export`,
        method: 'GET',
        params: { from, to },
        responseHandler: (response) => response.arrayBuffer(),
        // (tuỳ chọn) nếu muốn headers chấp nhận Excel
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      }),
      // Lúc này response đã là ArrayBuffer, chỉ cần trả về thẳng
      transformResponse: (response) => response,
      providesTags: (result, error, arg) => [{ type: 'Partner', id: arg.from + arg.to }],
    }),
    generateReportDashboard: builder.query({
      query: ({ from, to, groupBy }) => ({
        url: `dashboard/time/export`,
        method: 'GET',
        params: { from, to, groupBy },
        responseHandler: (response) => response.arrayBuffer(),
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      }),
      transformResponse: (response) => response,
      providesTags: (result, error, arg) => [{ type: 'Partner', id: arg.from + arg.to }],
    }),

    getPartnerList: builder.query({
      query: ({ keyword, page, size }) => ({
        url: `parties/get-all`,
        params: {
          keyword: keyword,
          page: page,
          pageSize: size,
          order: 'desc'
        },
        method: "GET",
      }),
      providesTags: (result) =>
        result && result.data?.content
          ? result.data.content.map(({ id }) => ({ type: "Partner", id }))
          : [{ type: "Partner", id: "LIST" }],
    }),

    createPartner: builder.mutation({
      query: (partnerData) => ({
        url: `parties/create`,
        method: "POST",
        body: partnerData,
      }),
      invalidatesTags: [{ type: "Partner", id: "LIST" }],
    }),

    editPartner: builder.mutation({
      query: ({ id, ...updatedPartnerData }) => ({
        url: `parties/update/${id}`,
        method: "PUT",
        body: updatedPartnerData,
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Partner", id: arg.id }],
    }),

    deletePartner: builder.mutation({
      query: ({ partnerId }) => ({
        url: `parties/update-status/${partnerId}/true`,
        method: "PUT",
      }),
      invalidatesTags: (result, error, partnerId) => [
        { type: "Partner", id: partnerId },
      ],
    }),
    getPartnerListByPartnerType: builder.query({
      query: ({ keyword, page, size }) => ({
        url: `parties/get-all`,
        params: {
          keyword: keyword,
          page: page,
          pageSize: size,
          partnerType: "PARTNER_B",
        },
        method: "GET",
      }),
      providesTags: (result) =>
        result && result.data?.content
          ? result.data.content.map(({ id }) => ({ type: "Partner", id }))
          : [{ type: "Partner", id: "LIST" }],
    }),
    checkExistPartnerA: builder.mutation({
      query: (taxCode) => ({
        url: `parties/check-exists`,
        method: "GET",
        params: {
          taxCode,
          partnerType: "PARTNER_A"
        }
      })
    }),
    checkExistPartnerB: builder.mutation({
      query: (taxCode) => ({
        url: `parties/check-exists`,
        method: "GET",
        params: {
          taxCode,
          partnerType: "PARTNER_B"
        }
      })
    })

  }),
  overrideExisting: false,
});

export const {
  useGetPartnerInfoDetailQuery,
  useGetContractByPartnerQuery,
  useGetPartnerListQuery,
  useLazyGetPartnerListQuery,
  useCreatePartnerMutation,
  useEditPartnerMutation,
  useDeletePartnerMutation,
  useLazyGetPartnerInfoDetailQuery,
  useGetPartnerListByPartnerTypeQuery,
  useLazyGetPartnerListByPartnerTypeQuery,
  useCheckExistPartnerAMutation,
  useCheckExistPartnerBMutation,
  useGenerateReportPartnerQuery,
  useLazyGenerateReportPartnerQuery,
  useLazyGenerateReportDashboardQuery
} = partnerAPI;
