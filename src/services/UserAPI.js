// userApi.js
import { baseApi } from "./BaseAPI";

export const userAPI = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAllUser: builder.query({
            query: ({ search, page, size }) => ({
                url: `/users/get-all-users?page=${page}&size=${size}&keyword=${search}`,
                method: "GET",
            }),
            providesTags: (result) =>
                result?.users
                    ? [
                        ...result.users.map(({ id }) => ({ type: "USER", id })),
                        { type: "USER", id: "LIST" },
                    ]
                    : [{ type: "USER", id: "LIST" }],
        }),
        getUserById: builder.query({
            query: ({ id }) => ({
                url: `/users/get-user/${id}`,
                method: "GET",
            }),
            providesTags: (result, error, userId) => [{ type: "USER", id: userId }],
        }),
        banUser: builder.mutation({
            query: ({ userId }) => ({
                url: `/users/block-or-enable/${userId}/0`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, { userId }) => [{ type: "USER", id: userId }],
        }),
        activeUser: builder.mutation({
            query: ({ userId }) => ({
                url: `/users/block-or-enable/${userId}/1`,
                method: "PUT",
            }),
            invalidatesTags: (result, error, { userId }) => [{ type: "USER", id: userId }],
        }),
        updateUser: builder.mutation({
            query: ({ id, email, full_name, phone_number, address, role_id, is_ceo, departmentId, dateOfBirth }) => ({
                url: `/users/update-user/${id}`,
                method: "PUT",
                body: { email, full_name, phone_number, address, role_id, is_ceo, departmentId, dateOfBirth },
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "USER", id }],
        }),
        addUser: builder.mutation({
            query: ({ email, full_name, phone_number, address, role_id, is_ceo, departmentId, date_of_birth }) => ({
                url: `/users/register`,
                method: "POST",
                body: { email, full_name, phone_number, address, role_id, is_ceo, departmentId, date_of_birth },
            }),
            invalidatesTags: [{ type: "USER", id: "LIST" }],
        }),
        getUserStaffManager: builder.query({
            query: () => ({
                url: `/users/get-all-staff-and-manager`,
                method: "GET",
            }),
            providesTags: (result) =>
                result?.users
                    ? result.users.map(({ id }) => ({ type: "USER", id }))
                    : [{ type: "USER", id: "LIST" }],
        }),
    }),
    overrideExisting: false,
});

export const {
    useGetAllUserQuery,
    useBanUserMutation,
    useActiveUserMutation,
    useUpdateUserMutation,
    useAddUserMutation,
    useLazyGetAllUserQuery,
    useGetUserStaffManagerQuery,
    useGetUserByIdQuery,
    useLazyGetUserStaffManagerQuery,
} = userAPI;
