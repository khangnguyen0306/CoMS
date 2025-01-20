import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/auth.slice";
// import { BE_API_LOCAL } from "../config";

export const bussinessAPI = createApi({
    reducerPath: "bussinessManagement",
    tagTypes: [],
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
        // getAllDoctor: builder.query({
        //     query: () => `/getlist`,
        //     providesTags: (result) =>
        //         result
        //             ? result.data.map(({ id }) => ({ type: "DoctorList", id }))
        //             : [{ type: "DoctorList", id: "LIST" }],
        // }),

        getBussinessInformatin: builder.query({
            query: () => ({
                url: `/078762be-3ce3-441a-be11-58af5f7a8e8c`,
                method: "GET",
            }),
            keepUnusedDataFor: 60 * 5,
            providesTags: (result, error, bsInformation) => [{ type: "DoctorList", id: bsInformation }],
        }),

        // createDoctor: builder.mutation({
        //     query: (newDoctorData) => ({
        //         url: `/create`,
        //         method: "POST",
        //         body: newDoctorData,
        //     }),
        //     invalidatesTags: [{ type: "DoctorList", id: "LIST" }],
        // }),

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
    useGetBussinessInformatinQuery
} = bussinessAPI;
