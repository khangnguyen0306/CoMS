import React, { useMemo } from "react";
import { Select, Spin, Popover } from "antd";
import { useLazyLoadSelect } from "./CustomHook";

const LazySelect = ({
    loadDataCallback,
    options: initialOptions = [],
    globalSelected = [],
    defaultValue = [],
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

        return mergedOptions?.map((dk) => {
            const isGloballySelected = globalSelected.includes(dk.id);
            return (
                <Select.Option
                    key={dk?.id}
                    value={dk?.id}
                    title={dk?.value}
                    className={isGloballySelected ? "option-selected" : ""}
                >

                    {dk.label}{" "}
                    {isGloballySelected && (
                        <span style={{ color: "red", fontWeight: "bold" }}>
                            (Đã chọn)
                        </span>
                    )}

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
                defaultValue={defaultValue}
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

export default LazySelect;
