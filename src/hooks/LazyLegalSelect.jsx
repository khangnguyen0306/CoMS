import React, { useMemo } from "react";
import { Select, Spin, Popover } from "antd";
import { useLazyLoadSelect } from "./CustomHook";
import { useLazyLoadLegal } from "./useLazyLoadLegal";

const LazyLegalSelect = ({
    loadDataCallback,
    globalSelected = [],
    options: initialOptions = [],
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
    } = useLazyLoadLegal(loadDataCallback);

    const mergedOptions = useMemo(() => {
        if (keyword) {
            return data;
        }
        const combined = [...initialOptions, ...data];
        return combined.reduce((acc, curr) => {
            if (!acc.some((item) => item.original_term_id === curr.original_term_id)) {
                acc.push(curr);
            }
            return acc;
        }, []);
    }, [data, keyword, initialOptions]);

    const renderOptions = () => {


        return mergedOptions?.map((dk) => {
            const isGloballySelected = globalSelected.includes(dk.original_term_id);
            return (
                <Select.Option
                    key={dk?.original_term_id}
                    value={dk?.original_term_id}
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

    // console.log(defaultValue)
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

export default LazyLegalSelect;
