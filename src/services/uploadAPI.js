//// uploadApi.js
import { baseApi } from "./BaseAPI";

// import { BE_API_LOCAL } from "../config";

export const uploadAPI = baseApi.injectEndpoints({
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
