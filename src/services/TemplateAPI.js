import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/auth.slice";
// import { BE_API_LOCAL } from "../config";

export const TemplateAPI = createApi({
    reducerPath: "templateManagement",
    tagTypes: ["Template"],
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

        getAllTemplate: builder.query({
            query: () => `d70a6fd2-61d8-4607-9ce7-acfa7215391c`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "Template", id }))
                    : [{ type: "Template", id: id }],
        }),
        getAllDeletedTemplate: builder.query({
            query: () => `69dee311-5125-4bac-bc6d-aabed7f3d593`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "Template", id }))
                    : [{ type: "Template", id: id }],
        }),

        getTemplateDataDetail: builder.query({
            query: (templateId) => ({               // chua gan ID
                url: `94b4cf47-4986-443c-9fc4-4aa7d4452010`,
                method: "GET",
            }),
            providesTags: (result, error, Template) => [{ type: "Template", id: Template }],
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
    useGetAllTemplateQuery,
    useGetTemplateDataDetailQuery,
    useGetAllDeletedTemplateQuery
    // useGetContractByPartnerQuery
} = TemplateAPI;
