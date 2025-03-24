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
        url: `contract-partners/upload-contract-file`,
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": undefined,
          // Nếu cần, có thể loại bỏ hoặc điều chỉnh header Authorization nếu không cần cho endpoint này
        },
        // Sử dụng responseHandler để đọc dữ liệu dưới dạng text
        responseHandler: (response) => response.text(),
      }),
      transformResponse: (response) => response, // response đã là text
      providesTags: (result, error, contractId) => [{ type: "Contract", id: contractId }],
    }),


    // Các endpoint khác có thể được thêm vào ở đây
  }),
});

export const {
  useUploadFilePDFMutation,
} = uploadAPI;
