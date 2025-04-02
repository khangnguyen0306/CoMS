// baseApiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BE_API_LOCAL } from '../config/config';
import { message } from 'antd';
import { logOut, selectTokens } from '../slices/authSlice';

export const baseQueryWithAuth = fetchBaseQuery({
    baseUrl: BE_API_LOCAL,
    prepareHeaders: (headers, { getState }) => {
        const token = selectTokens(getState());
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
        // headers.set('Content-Type', 'application/json');
        return headers;
    },
});

export const baseApi = createApi({
    reducerPath: 'baseApi',
    baseQuery: async (args, api, extraOptions) => {
        const result = await baseQueryWithAuth(args, api, extraOptions);

        if (result.error) {
            if (result.error.status === 401) {
                api.dispatch(logOut()); 
                setTimeout(() => {
                    message.error("Phiên đã hết hạn, vui lòng đăng nhập lại!");
                    window.location.href = '/login';
                }, 1000);
            } else if (result.error.status >= 500) {
                // message.error("Lỗi server, vui lòng thử lại sau!");
            }
        }

        return result;
    },
    tagTypes: ['USER'],
    endpoints: () => ({}),
});
