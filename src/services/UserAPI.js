// userApi.js
import Paragraph from "antd/es/skeleton/Paragraph";
import { baseApi } from "./BaseAPI";

export const userAPI = baseApi.injectEndpoints({
    endpoints: (builder) => ({
        getAllUser: builder.query({
            query: ({ search, page, size }) => ({
                url: `/users/get-all-users?page=${page}&size=${size}&search=${search}`,
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
            query: () => ({
                url: `/users/get-user`,
                method: "GET",
            }),
            providesTags: (result, error, userId) => [{ type: "USER", id: userId }],
        }),
        getDetailUserById: builder.query({
            query: ({ id }) => ({
                url: `/users/get-user-by-id/${id}`,
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
            query: ({ body, userId }) => ({
                url: `/users/update-user/${userId}`,
                method: "PUT",
                body: body,
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
        changePassWord: builder.mutation({
            query: ({ body, userId }) => ({
                url: `users/update-password/${userId}`,
                method: "PUT",
                body: body,
            }),
            invalidatesTags: (result, error, { id }) => [{ type: "USER", id }],
        }),
        updateAvatar: builder.mutation({
            query: ({ formData, userId }) => ({
                url: `/users/update-avatar/${userId}`,
                method: "PUT",
                body: formData,
            }),
            invalidatesTags: (result, error, { userId }) => [{ type: "USER", id: userId }],
        }),
        getUserManager: builder.query({
            query: () => ({
                url: `/users/get-all-staff-and-manager`,
                method: "GET",
                params: {
                    role: "MANAGER",
                },
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
    useGetDetailUserByIdQuery,
    useLazyGetUserStaffManagerQuery,
    useChangePassWordMutation,
    useUpdateAvatarMutation,
    useGetUserManagerQuery,
} = userAPI;
