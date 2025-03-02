import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";

export const processAPI = createApi({
    reducerPath: "processManagement",
    tagTypes: ["ProcessList"],
    baseQuery: fetchBaseQuery({
        baseUrl: "https://mocki.io/v1/",
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
                url: `58d1b0b0-2967-4120-bd6b-11ed5933a8b4`,
                method: "GET",
            }),
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "ProcessList", id }))
                    : [{ type: "ProcessList", id: "LIST" }],
        }),
    }),
});

export const {
    useGetProcessTemplatesQuery
} = processAPI;
