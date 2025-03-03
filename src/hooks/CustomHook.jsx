import { useState, useCallback, useEffect } from "react";

/**
 * Custom hook hỗ trợ lazy load cho Select với phân trang.
 *
 * @param {Function} loadDataCallback - Hàm gọi API nhận đối số { page, size } và trả về Promise dữ liệu.
 * @param {number} pageSize - Số item mỗi trang.
 */
export const useLazyLoadSelect = (loadDataCallback, pageSize = 10) => {
    const [page, setPage] = useState(0);
    const [data, setData] = useState([]); // Lưu trữ dữ liệu đã load được (mảng)
    const [isDropdownOpened, setDropdownOpened] = useState(false);
    const [isLoading, setLoading] = useState(false);
    const [keyword, setKeyword] = useState("");
    const [searchData, setSearchData] = useState([]);
    

    const fetchData = useCallback(
        async (pageNumber, searchKeyword = keyword) => {
            setLoading(true);
            try {
                const response = await loadDataCallback({
                    page: pageNumber,
                    size: pageSize,
                    keyword: searchKeyword,
                });

                const newData = response?.data?.content || [];

                if (searchKeyword) {
                    
                    if (pageNumber === 0) {
                        setSearchData(newData);
                    } else {
                        setSearchData((prev) => {
                            const combined = [...prev, ...newData];
                            return combined.reduce((acc, curr) => {
                                if (!acc.some((item) => item.id === curr.id)) {
                                    acc.push(curr);
                                }
                                return acc;
                            }, []);
                        });
                    }
                } else {
                    // Trong chế độ không tìm kiếm: xử lý tương tự
                    if (pageNumber === 0) {
                        setData(newData);
                    } else {
                        setData((prev) => {
                            const combined = [...prev, ...newData];
                            return combined.reduce((acc, curr) => {
                                if (!acc.some((item) => item.id === curr.id)) {
                                    acc.push(curr);
                                }
                                return acc;
                            }, []);
                        });
                    }
                }
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        },
        [loadDataCallback, pageSize, keyword]
    );


    // Handler khi dropdown mở/đóng
    const handleDropdownVisibleChange = useCallback(
        (open) => {
            setDropdownOpened(open);
            if (open) {
                // Nếu đang tìm kiếm thì load trang đầu của searchData nếu chưa có
                if (keyword && searchData.length === 0) {
                    setPage(0);
                    fetchData(0, keyword);
                }
                // Nếu không tìm kiếm, load dữ liệu bình thường nếu chưa có
                if (!keyword && data.length === 0) {
                    setPage(0);
                    fetchData(0, "");
                }
            }
        },
        [data.length, fetchData, keyword, searchData.length]
    );

    // Handler khi scroll đến cuối dropdown: tăng page và load thêm dữ liệu
    const handleScroll = useCallback(
        (e) => {
            const target = e.target;
            if (
                target.scrollTop + target.offsetHeight >= target.scrollHeight &&
                !isLoading
            ) {
                const newPage = page + 1;
                setPage(newPage);
                fetchData(newPage, keyword);
            }
        },
        [page, isLoading, fetchData, keyword]
    );
    const onSearch = useCallback(
        (value) => {
            console.log("onSearch triggered with:", value);
            setKeyword(value);
            setPage(0);
            fetchData(0, value);
        },
        [fetchData]
    );

    const finalData = keyword ? searchData : data;

    return {
        handleDropdownVisibleChange,
        handleScroll,
        isDropdownOpened,
        isLoading,
        data: finalData,
        onSearch,
        keyword,
    };
};
