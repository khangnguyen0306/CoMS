import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";

export const DepartmentAPI = createApi({
    reducerPath: "departmentAPI",
    tagTypes: ["Department"],
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
        // Lấy danh sách phòng ban
        getDepartments: builder.query({
            query: () => ({
                url: `departments/get-all`,
                method: "GET",
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "Department", id }],
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
        createDepartment: builder.mutation({
            query: (data) => ({
                url: `departments/create`,
                method: "POST",
                body: data,
            }),
        }),

    }),
});

export const {
    useGetDepartmentsQuery,
    useUpdateDepartmentMutation,
    useCreateDepartmentMutation,
} = DepartmentAPI;
