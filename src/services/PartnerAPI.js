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

    getPartnerList: builder.query({
      query: ({ keyword, page, size }) => ({
        url: `parties/get-all`,
        params: {
          keyword: keyword,
          page: page,
          pageSize: size,
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
    checkExistPartner: builder.mutation({
      query: (taxCode) => ({
        url: `parties/check-exists`,
        method: "GET",
        params: { taxCode }
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
  useCheckExistPartnerMutation
} = partnerAPI;
