import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";

// import { BE_API_LOCAL } from "../config";

export const uploadAPI = createApi({
  reducerPath: "uploadManagement",
  tagTypes: [],
  baseQuery: fetchBaseQuery({
    baseUrl: BE_API_LOCAL,
    prepareHeaders: (headers, { getState }) => {
      const token = selectTokens(getState());
      if (token) {
        headers.append("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    uploadFilePDF: builder.mutation({
      query: ({ formData }) => ({
        url: `partner-contracts/upload-contract-file`,
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": undefined,
        },
        responseHandler: (response) => response.text(),
      }),
      transformResponse: (response) => response,
      providesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
    }),
    uploadBillingContract: builder.mutation({
      query: ({ paymentScheduleId, formData }) => ({
        url: `/partner-contracts/upload-bills/${paymentScheduleId}`,
        method: "PUT",
        body: formData,
        responseHandler: (response) => response.text(),
      }),
      invalidatesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
    }),

    uploadClauseBFile: builder.mutation({
      query: ({ typeTermId, file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/terms/import-file-excel?typeTermId=${typeTermId}`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [{ type: "Clause", id: "LIST" }],
    }),

    uploadContractToSign: builder.mutation({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `http://localhost:8888/api/upload`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [{ type: "Contract", id: "LIST" }],
    }),


    findLocation: builder.mutation({
      query: ({ file }) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: `/contracts/find-location/pdf`,
          method: "POST",
          body: formData,
        };
      },
      invalidatesTags: [{ type: ["Contract", "Appendix"], id: "LIST" }],
    }),

    uploadImgSign: builder.mutation({
      query: ({ contractId, formData }) => {

        return {
          url: `/contracts/upload-signed-contracts-file/${contractId}`,
          method: "PUT",
          body: formData,
        };
      },
      invalidatesTags: [{ type: "Clause", id: "LIST" }],

    })

  })
})

export const {
  useUploadFilePDFMutation,
  useUploadBillingContractMutation,
  useUploadClauseBFileMutation,
  useFindLocationMutation,
  useUploadContractToSignMutation,
  useUploadImgSignMutation,
} = uploadAPI;
