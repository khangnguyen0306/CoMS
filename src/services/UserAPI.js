import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectTokens } from "../slices/authSlice";
import { BE_API_LOCAL } from "../config/config";

export const userAPI = createApi({
    reducerPath: "userManagement",
    tagTypes: ['USER', 'ROLE'],
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
        getAllUser: builder.query({
            query: ({ keyword, page, limit }) => ({
                url: `/users/get-all-user?page=${page}&limit=${limit}&keyword=${keyword}`,
                method: "GET",
            }),
            providesTags: (result) =>
                result?.users
                    ? [...result.users.map(({ id }) => ({ type: "USER", id })), { type: "USER", id: "LIST" }]
                    : [{ type: "USER", id: "LIST" }],

        }),
        getUserById: builder.query({
            query: ({ id }) => ({
                url: `/users/get-user/${id}`,
                method: "GET",
            }),
            providesTags: (result, error, userId) => [{ type: "USER", id: userId }],
        }),
        BanUser: builder.mutation({
            query: ({ userId }) => ({
                url: `/users/block-or-enable/${userId}/0`,
                method: "PUT",
            }),
            providesTags: (result, error, User) => [{ type: "User", id: User }],
        }),
        ActiveUser: builder.mutation({
            query: ({ userId }) => ({
                url: `/users/block-or-enable/${userId}/1`,
                method: "PUT",
            }),
            providesTags: (result, error, User) => [{ type: "User", id: User }],
        }),
        UpdateUser: builder.mutation({
            query: ({ id, email, full_name, phone_number, address, role_id, is_ceo }) => ({
                url: `/users/update-user/${id}`,
                method: "PUT",
                body: { email, full_name, phone_number, address, role_id, is_ceo },
            }),
            invalidatesTags: (result, error, { userId }) => [{ type: "USER", id: userId }],
        }),
        AddUser: builder.mutation({
            query: ({ email, full_name, phone_number, address, role_id, is_ceo }) => ({
                url: `/users/register`,
                method: "POST",
                body: { email, full_name, phone_number, address, role_id, is_ceo },
            }),
            invalidatesTags: [{ type: "USER", id: "LIST" }],
        }),
        GetUserStaffManager: builder.query({
            query: () => ({
                url: `/users/get-all-staff-and-manager`,
                method: "GET",
            }),
            providesTags: (result, error, User) => [{ type: "User", id: User }],
        }),
    }),
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

} = userAPI;
