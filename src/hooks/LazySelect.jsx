import React, { useEffect, useState, useMemo } from "react";
import { Select, Spin, Popover } from "antd";
import { useLazyLoadSelect } from "./CustomHook";

const LazySelect = ({
    loadDataCallback,
    options: initialOptions = [],
    globalSelected = [],
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

    // Render option với kiểm tra globalSelected

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
                    <Popover
                        className="w-full"
                        content={dk?.value}
                        trigger="hover"
                        getPopupContainer={(trigger) => trigger.parentElement}
                    >
                        {dk.label}{" "}
                        {isGloballySelected && (
                            <span style={{ color: "red", fontWeight: "bold" }}>
                                (Đã chọn)
                            </span>
                        )}
                    </Popover>
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

export default LazySelect;
