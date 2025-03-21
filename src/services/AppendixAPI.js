import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";
// import { BE_API_LOCAL } from "../config";

export const AppendixAPI = createApi({
    reducerPath: "AppendixAPI",
    tagTypes: ["Appendix", "appendixType"],
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
        getAllAppendixBySelf: builder.query({
            query: (params) => ({
                url: `addendums/get-all?statuses=CREATED&statuses=APPROVED&statuses=REJECTED&statuses=APPROVAL_PENDING&statuses=UPDATED`,
                params: {
                    page: params.page,
                    size: params.size,
                    order: "esc"
                },
                method: "GET",
            }),
            providesTags: (result, error, Partner) => [{ type: "Partner", id: Partner }],
        }),

        getAppendixDetail: builder.query({
            query: ({ id, params }) => ({
                url: `/addendums/get-by-id/${id}`,
                // params: {
                //     page: params.page,
                //     size: params.size,
                //     order: "esc"
                // }
            }),
            providesTags: (result, error, Appendix) => [{ type: "Appendix", id: Appendix }],
        }),

        getAppendixByContractId: builder.query({
            query: ({ id, params }) => ({
                url: `/addendums/get-by-contract-id/${id}`,
                // params: {
                //     page: params.page ,
                //     size: params.size,
                //     order: "esc"
                // }
            }),
            providesTags: (result) =>
                result
                    ? result.data.map(({ id }) => ({ type: "Appendix", id }))
                    : [{ type: "Appendix", id: "LIST" }],
        }),

        createAppendix: builder.mutation({
            query: (appendixData) => ({
                url: `/addendums/create`,
                method: "POST",
                body: appendixData,
            }),
            invalidatesTags: [{ type: "Appendix", id: "LIST" }],
        }),


        updateAppendix: builder.mutation({
            query: ({ appendixId, ...updatedAppendix }) => ({
                url: `/addendums/update/${appendixId}`,
                method: "PUT",
                body: updatedAppendix,
            }),
            invalidatesTags: (result, error, { appendixId }) => [{ type: "Appendix", id: appendixId }],
        }),

        createAppendixType: builder.mutation({
            query: (name) => ({
                url: `/addendum-types/create`,
                method: "POST",
                body: name,
            }),
            invalidatesTags: [{ type: "appendixType", id: "LIST" }],
        }),


        getAllAppendixType: builder.query({
            query: () => ({
                url: `/addendum-types/get-all`,
            }),
            providesTags: (result) =>
                result
                    ? result.data.map(({ addendumTypeId }) => ({ type: "appendixType", addendumTypeId }))
                    : [{ type: "appendixType", id: "LIST" }],
        }),

        editAppendixType: builder.mutation({
            query: ({ id, name }) => ({
                url: `/addendum-types/update/${id}`,
                method: "PUT",
                body: { name: name },
            }),
            invalidatesTags: (result, error, { addendumTypeId }) => [{ type: "appendixType", id: addendumTypeId }],
        }),


        deleteAppendixType: builder.mutation({
            query: (appendixId) => ({
                url: `/addendum-types/delete/${appendixId}`,
                method: "DELETE",
            }),
            invalidatesTags: (result, error, appendixId) => [{ type: "appendixType", id: appendixId }],
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
    useCreateAppendixMutation,
    useGetAppendixByContractIdQuery,
    useGetAppendixDetailQuery,
    useGetAllAppendixTypeQuery,
    useCreateAppendixTypeMutation,
    useEditAppendixTypeMutation,
    useDeleteAppendixTypeMutation,
    useGetAllAppendixBySelfQuery,
    useUpdateAppendixMutation
} = AppendixAPI;
