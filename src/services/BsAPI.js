// bussinessApi.js
import { baseApi } from "./BaseAPI";

export const bussinessAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBussinessInformatin: builder.query({
      query: () => ({
        url: `parties/get-by-id/${1}`,
        method: "GET",
      }),
      providesTags: (result, error, Bussiness) => [{ type: "Bussiness", id: Bussiness }],
    }),

    getDashboardata: builder.query({
      query: (params) => ({
        url: "dashboard/statistics",
        params: {
          year: params.year,
        },
        method: "GET",
      }),
      providesTags: (result, error, dashboard) => [{ type: "dashboard", id: dashboard }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetBussinessInformatinQuery, useGetDashboardataQuery } = bussinessAPI;
