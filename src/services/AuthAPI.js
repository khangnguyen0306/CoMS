import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BE_API_LOCAL } from "../config/config";




export const authApi = createApi({
  reducerPath: "authManagement",
  baseQuery: fetchBaseQuery({ baseUrl: BE_API_LOCAL }),
  endpoints: (builder) => ({


    loginUser: builder.mutation({
      query: ({ login_identifier, password }) => ({
        url: `users/login`,
        method: "POST",
        body: { login_identifier, password },
      }),
    }),

    authenSignContractOnline: builder.mutation({
      query: ({ username, password }) => ({
        url: `https://demohsm.wgroup.vn/hsm/auth`,
        method: "POST",
        body: { username, password },
      }),
    }),

    registerUser: builder.mutation({
      query: (body) => {
        return {
          method: "POST",
          url: `user/create`,
          body: body,
        }
      },
      invalidatesTags: [{ type: " UserList ", id: " LIST " }],
    }),

    verifyOtp: builder.mutation({
      query: ({ email, otp }) => {
        return {
          method: "POST",
          url: `forgot-password/verify-otp/${email}`,
          body: { otp },
        };
      },
    }),
    resetPassword: builder.mutation({
      query: ({ email, newPassword }) => {
        return {
          method: "POST",
          url: `forgot-password/change-password/${email}?resetToken=${token}`,
          body: { new_password: newPassword, confirm_password: newPassword },
        };
      },
    }),
    changePasswordByEmail: builder.mutation({
      query: ({ email, new_password, token }) => {
        return {
          method: "POST",
          url: `forgot-password/change-password/${email}?resetToken=${token}`,
          body: { new_password: new_password, confirm_password: new_password },
        };
      },
    }),
    // refreshToken: builder.mutation({
    //   query: ({ refreshToken }) => ({
    //     url: `users/refresh-token`,
    //     method: "POST",
    //     body: { refreshToken: refreshToken }, // pass the refresh token in the body
    //   }),
    // }),
    sendResetEmail: builder.mutation({
      query: (email) => ({
        url: `forgot-password/send-otp/${email}`,
        method: "POST",
        // body: ,
      }),
    }),
  }),
});

export const {
  useLoginUserMutation,
  useRegisterUserMutation,
  useSendResetEmailMutation,
  useVerifyOtpMutation,
  useResetPasswordMutation,
  useChangePasswordByEmailMutation,
  useAuthenSignContractOnlineMutation
  //   useVerifyMailMutation,
  //   useVerifyOtpMutation,
  //   useRefreshTokenMutation,
} = authApi;
