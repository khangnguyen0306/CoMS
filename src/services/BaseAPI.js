// baseApiSlice.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { selectTokens } from '../slices/authSlice';
import { BE_API_LOCAL } from '../config/config';
import { message } from 'antd';


export const baseQueryWithAuth = fetchBaseQuery({
    baseUrl: BE_API_LOCAL,
    prepareHeaders: (headers, { getState }) => {
        const token = selectTokens(getState());
        if (token) {
            headers.append('Authorization', `Bearer ${token}`);
        }
        headers.append('Content-Type', 'application/json');
        return headers;
    },
});

export const baseApi = createApi({
    reducerPath: 'baseApi',
    baseQuery: async (args, api, extraOptions) => {
        const result = await baseQueryWithAuth(args, api, extraOptions);
        if (result.error && result.error.status === 401) {
            message.error("Phiên đã hết hạn vui lòng đăng nhập lại !")
            window.location.href = '/login';
        }
        return result;
    },
    endpoints: () => ({}),
});
