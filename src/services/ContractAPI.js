import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";
// import { BE_API_LOCAL } from "../config";

export const ContractAPI = createApi({
    reducerPath: "contractManagement",
    tagTypes: ["Contract,ContractType"],
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

        getContractType: builder.query({
            query: () => `contract-types`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "ContractType", id }))
                    : [{ type: "ContractType", id: 'UNKNOWN_ID' }],
        }),
        getAllContract: builder.query({
            query: () => `https://mocki.io/v1/791ec81c-b150-440d-9c3c-07fcfe5cc6da`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "Contract", id }))
                    : [{ type: "Contract", id: id }],
        }),
        getAllContractPartner: builder.query({
            query: () => `https://mocki.io/v1/510fa7fd-5caa-4cfa-b858-5c6ea74cc683`,
            providesTags: (result) =>
                result
                    ? result.map(({ id }) => ({ type: "Contract", id }))
                    : [{ type: "Contract", id: id }],
        }),

        createContractType: builder.mutation({
            query: ({ name }) => ({
                url: `contract-types`,
                method: "POST",
                body: { name: name },
            }),
            invalidatesTags: [{ type: "ContractType", id: "LIST" }],
        }),


        editContractType: builder.mutation({
            query: ({ name, id }) => ({
                url: `contract-types/${id}`,
                method: "PUT",
                body: { name: name },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "ContractType", id: id }],
        }),

       deleteContractType: builder.mutation({
            query: (contractTypeId) => ({
                url: `contract-types/${contractTypeId}/delete-status?isDeleted=${true}`, 
                method: "PATCH",
            }),
            invalidatesTags: (result, error, contractTypeId) => [{ type: "DoctorList", id: contractTypeId }],
        }),

        // getPartnerInfoDetail: builder.query({
        //     query: (partnerId) => ({
        //         url: `9edef7db-1c09-42ed-aef8-ae8d14119f2c`,
        //         method: "GET",
        //     }),
        //     providesTags: (result, error, Partner) => [{ type: "Partner", id: Partner }],
        // }),

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
    useGetContractTypeQuery,
    useLazyGetContractTypeQuery,
    useGetAllContractQuery,
    useGetAllContractPartnerQuery,
    useCreateContractTypeMutation,
    useEditContractTypeMutation,
    useDeleteContractTypeMutation
    // useGetContractByPartnerQuery
} = ContractAPI;
