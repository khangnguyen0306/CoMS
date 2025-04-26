// ConfigAPI.js
import { baseApi } from "./BaseAPI";

export const ConfigAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDateNofitifation: builder.query({
      query: () => "/configs/get-all",
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: "Config", id }))
          : [{ type: "Config", id: "LIST" }],
    }),
    createDateNofitication: builder.mutation({
      query: (data) => ({
        url: `configs/update/${data.configId}`,
        method: "POST",
        body: {
          key: data.key,
          value: data.value
        }
      }),
      invalidatesTags: [{ type: "Config", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateDateNofiticationMutation,
  useGetDateNofitifationQuery,
  useLazyGetDateNofitifationQuery,
} = ConfigAPI;
