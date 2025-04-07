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
          formData.append("file", file); // Thêm file vào FormData
          return {
              url: `/terms/import-file-excel?typeTermId=${typeTermId}`,
              method: "POST",
              body: formData, // Gửi FormData thay vì object JSON
          };
      },
      invalidatesTags: [{ type: "Clause", id: "LIST" }],
  }),


    // Các endpoint khác có thể được thêm vào ở đây
  }),
});

export const {
  useUploadFilePDFMutation,
  useUploadBillingContractMutation,
  useUploadClauseBFileMutation
} = uploadAPI;
