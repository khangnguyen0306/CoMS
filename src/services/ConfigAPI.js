import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";


export const ConfigAPI = createApi({
    reducerPath: "configManagement",
    tagTypes: ["Config"],
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
        getDateNofitifation: builder.query({
            query: () => `/config/get-all`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "DoctorList", id }))
                    : [{ type: "Config", id: "LIST" }],
        }),

        // getBussinessInformatin: builder.query({
        //     query: () => ({
        //         url: `6219a6ba-6297-4291-bad1-9ad89ede566b`,
        //         method: "GET",
        //     }),
        //     keepUnusedDataFor: 60 * 5,
        //     providesTags: (result, error, bsInformation) => [{ type: "Config", id: bsInformation }],
        // }),

        createDateNofitication: builder.mutation({
            query: (data) => ({
                url: `config?key=${data.key}&value=${data.value}&description=${data.description} `,
                method: "POST",
            }),
            invalidatesTags: [{ type: "Config", id: "LIST" }],
        }),

        // editDoctor: builder.mutation({
        //     query: ({ userId, ...updatedDoctorData }) => ({
        //         url: `/update/${userId}`, // Sử dụng userId để phù hợp với tài liệu API
        //         method: "PUT",
        //         body: updatedDoctorData,
        //     }),
        //     invalidatesTags: (result, error, { userId }) => [{ type: "DoctorList", id: userId }],
        // }),


        // deleteDoctor: builder.mutation({
        //     query: (userId) => ({
        //         url: `/delete/${userId}`, // Use userId instead of doctorId
        //         method: "DELETE",
        //     }),
        //     invalidatesTags: (result, error, userId) => [{ type: "DoctorList", id: userId }],
        // }),
    }),
});

export const {
    useCreateDateNofiticationMutation,
    useGetDateNofitifationQuery,
    useLazyGetDateNofitifationQuery
} = ConfigAPI;
