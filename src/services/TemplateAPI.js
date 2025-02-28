import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/auth.slice";
import { BE_API_LOCAL } from "../config/config";

export const TemplateAPI = createApi({
    reducerPath: "templateManagement",
    tagTypes: ["Template"],
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

        getAllTemplate: builder.query({
            query: ({ page, size }) => `templates?page=${page}&size=${size}&sortBy=id&order=asc`,
            providesTags: (result) =>
                result
                    ? result.data.content.map(({ id }) => ({ type: "Template", id }))
                    : [{ type: "Template", id: 'LIST' }],
        }),
        getAllDeletedTemplate: builder.query({
            query: () => `https://mocki.io/v1/69dee311-5125-4bac-bc6d-aabed7f3d593`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "Template", id }))
                    : [{ type: "Template", id: id }],
        }),

        getTemplateDataDetail: builder.query({
            query: (templateId) => ({               // chua gan ID
                url: `templates/${templateId}`,
                method: "GET",
            }),
            providesTags: (result, error, Template) => [{ type: "Template", id: Template }],
        }),

        createTemplate: builder.mutation({
            query: (templateData) => ({
                url: `templates/create`,
                method: "POST",
                body: templateData,
            }),
            invalidatesTags: [{ type: "Template", id: "LIST" }],
        }),
        duplicateTemplate: builder.mutation({
            query: (templateId) => ({
                url: `templates/${templateId}/duplicate`,
                method: "POST",
                body: templateId,
            }),
            invalidatesTags: [{ type: "Template", id: "LIST" }],
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
    useGetAllTemplateQuery,
    useLazyGetAllTemplateQuery,
    useGetTemplateDataDetailQuery,
    useGetAllDeletedTemplateQuery,
    useCreateTemplateMutation,
    useDuplicateTemplateMutation
    // useGetContractByPartnerQuery
} = TemplateAPI;
