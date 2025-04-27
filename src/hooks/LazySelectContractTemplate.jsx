import React, { useMemo } from "react";
import { Select, Spin } from "antd";
import { useLazyLoadSelect } from "./CustomHook";

const LazySelectContractTemplate = ({
    loadDataCallback,
    options: initialOptions = [],
    children,
    ...restProps
}) => {

    
    const {
        handleDropdownVisibleChange,
        handleScroll,
        isDropdownOpened,
        isLoading,
        data,
        onSearch,
        keyword,
    } = useLazyLoadSelect(loadDataCallback);

    const mergedOptions = useMemo(() => {
        if (keyword) {
            return data;
        }
        const combined = [...initialOptions, ...data];
        return combined.reduce((acc, curr) => {
            if (!acc.some((item) => item.id === curr.id)) {
                acc.push(curr);
            }
            return acc;
        }, []);
    }, [data, keyword, initialOptions]);



    const renderOptions = () => {
        if (children) {
            return children;
        }

        return mergedOptions?.map((tl) => {
            return (
                <Select.Option
                    key={tl?.id}
                    value={tl?.id}
                    title={tl?.contractTitle}
                >
                    {tl.contractTitle}
                </Select.Option>
            );
        });
    };


    return (
        <>
            <Select
                {...restProps}
                onPopupScroll={handleScroll}
                onDropdownVisibleChange={handleDropdownVisibleChange}
                loading={isLoading}
                filterOption={false}
                onSearch={onSearch}
                open={isDropdownOpened}
            >
                {renderOptions()}
            </Select>
            {isLoading && (
                <div style={{ textAlign: "center", padding: "5px" }}>
                    <Spin size="small" />
                </div>
            )}
        </>
    );
};

export default LazySelectContractTemplate;
