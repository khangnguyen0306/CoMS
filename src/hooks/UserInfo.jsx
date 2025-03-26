// UserInfo.js
import { useEffect } from 'react';
import { useGetUserByIdQuery } from '../services/UserAPI';

const UserInfo = ({ userId, onDataFetched }) => {
    const { data, isLoading, error } = useGetUserByIdQuery(userId);

    useEffect(() => {
        if (data) {
            // Khi dữ liệu có sẵn, gọi callback để truyền dữ liệu về component cha
            onDataFetched(userId, data.full_name);
        }
    }, [data, userId, onDataFetched]);

    if (isLoading) return <p>Loading...</p>;
    if (error) return <p>Error!</p>;

    return <div>{data.full_name}</div>;
};

export default UserInfo;
