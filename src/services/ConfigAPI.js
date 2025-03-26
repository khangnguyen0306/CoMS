// ConfigAPI.js
import { baseApi } from "./BaseAPI";

export const ConfigAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDateNofitifation: builder.query({
      query: () => "/config/get-all",
      providesTags: (result) =>
        result
          ? result.map(({ id }) => ({ type: "Config", id }))
          : [{ type: "Config", id: "LIST" }],
    }),
    createDateNofitication: builder.mutation({
      query: (data) => ({
        url: `config?key=${data.key}&value=${data.value}&description=${data.description}`,
        method: "POST",
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
