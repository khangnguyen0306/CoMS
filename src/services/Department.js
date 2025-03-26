// DepartmentAPI.js
import { baseApi } from "./BaseAPI";

export const DepartmentAPI = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Lấy danh sách phòng ban
    getDepartments: builder.query({
      query: () => ({
        url: `departments/get-all`,
        method: "GET",
      }),
      providesTags: (result) =>
        result && Array.isArray(result)
          ? result.map(({ id }) => ({ type: "Department", id }))
          : [{ type: "Department", id: "LIST" }],
    }),

    // Cập nhật thông tin phòng ban
    updateDepartment: builder.mutation({
      query: ({ id, data }) => ({
        url: `departments/update/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Department", id }],
    }),

    // Tạo mới phòng ban
    createDepartment: builder.mutation({
      query: (data) => ({
        url: `departments/create`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [{ type: "Department", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetDepartmentsQuery,
  useUpdateDepartmentMutation,
  useCreateDepartmentMutation,
} = DepartmentAPI;
