import { Button, Divider, Form, Input, message, Modal, Space } from "antd";
import LazySelect from "../hooks/LazySelect";
import { PlusOutlined } from "@ant-design/icons";
import { useCreateClauseMutation, useLazyGetClauseManageQuery, useLazyGetLegalQuery } from "../services/ClauseAPI";
import { useState } from "react";
import TextArea from "antd/es/input/TextArea";






export const TermSection = ({ termId, title, form, loadDataCallback }) => {

    const [newGeneralTerm, setNewGeneralTerm] = useState({ name: "", typeId: null, content: "" });
    const [isAddGeneralModalOpen, setIsAddGeneralModalOpen] = useState(false);
    const [getGeneralTerms, { data: generalData, isLoading: loadingGenaral, refetch: refetchGenaral }] = useLazyGetClauseManageQuery({ typeTermIds: 9 });
    const [createClause, { isLoading: loadingCreate }] = useCreateClauseMutation();
    const displayLabels = {
        '1': {
            "Common": "Điều khoản bổ sung chung",
            "A": "Điều khoản bổ sung riêng bên A",
            "B": "Điều khoản bổ sung riêng bên B",
        },
        '2': {
            "Common": "Quyền và nghĩa vụ chung",
            "A": "Quyền và nghĩa vụ riêng bên A",
            "B": "Quyền và nghĩa vụ riêng bên B",
        },
        '3': {
            "Common": "Điều khoản Bảo hành và bảo trì chung",
            "A": "Điều khoản Bảo hành và bảo trì riêng bên A",
            "B": "Điều khoản Bảo hành và bảo trì riêng bên B",
        },
        '4': {
            "Common": "Điều khoản vi phạm và thiệt hại chung",
            "A": "Điều khoản vi phạm và thiệt hại riêng bên A",
            "B": "Điều khoản vi phạm và thiệt hại riêng bên B",
        },
        '5': {
            "Common": "Điều khoản chấm dứt hợp đồng chung",
            "A": "Điều khoản chấm dứt hợp đồng riêng bên A",
            "B": "Điều khoản chấm dứt hợp đồng riêng bên B",
        },
        '6': {
            "Common": "Điều khoản giải quyết tranh chấp chung",
            "A": "Điều khoản giải quyết tranh chấp riêng bên A",
            "B": "Điều khoản giải quyết tranh chấp riêng bên B",
        },
        '7': {
            "Common": "Điều khoản bảo mật chung",
            "A": "Điều khoản bảo mật riêng bên A",
            "B": "Điều khoản bảo mật riêng bên B",
        }
    }
    const loadGenaralData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 9 }).unwrap();
    };
    const loadDKBSData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 1 }).unwrap();
    };
    const loadQVNVCBData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 2 }).unwrap();
    };
    const loadBHVBTData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 3 }).unwrap();
    };
    const loadVPBTTHData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 4 }).unwrap();
    };
    const loadCDHDData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 5 }).unwrap();
    };
    const loadGQTCData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 6 }).unwrap();
    };
    const loadBMData = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 7 }).unwrap();
    };
    const loadDKKata = async ({ page, size, keyword }) => {
        return getGeneralTerms({ page, size, keyword, typeTermIds: 10 }).unwrap();
    };
    const handleAddGeneralCancel = () => {
        setIsAddGeneralModalOpen(false);
        setNewGeneralTerm({ name: "", typeId: null, content: "" });
    };

    const showAddModal = (value) => {
        setNewGeneralTerm({ name: "", typeId: value, content: "" });
        setIsAddGeneralModalOpen(true);
    };

    const handleAddOkGeneralTerm = async () => {
        const { name, typeId, content } = newGeneralTerm;
        console.log(name, typeId, content);
        if (!name || !typeId || !content) {
            message.error("Vui lòng nhập đầy đủ thông tin!");
            return;
        }
        try {
            const result = await createClause({ idType: typeId, label: name, value: content }).unwrap();
            if (result.status === "CREATED") {
                message.success("Tạo điều khoản thành công");
            }
            switch (typeId.toString()) {
                case "1":
                    await loadDKBSData({ page: 0, size: 10 });
                    break;
                case "2":
                    await loadQVNVCBData({ page: 0, size: 10 });
                    break;
                case "3":
                    await loadBHVBTData({ page: 0, size: 10 });
                    break;
                case "4":
                    await loadVPBTTHData({ page: 0, size: 10 });
                    break;
                case "5":
                    await loadCDHDData({ page: 0, size: 10 });
                    break;
                case "6":
                    await loadGQTCData({ page: 0, size: 10 });
                    break;
                case "7":
                    await loadBMData({ page: 0, size: 10 });
                    break;
                case "9":
                    await loadGenaralData({ page: 0, size: 10 });
                    break;
                case "10":
                    await loadDKKata({ page: 0, size: 10 });
                    break;
                default:
                    console.warn("Không tìm thấy typeId phù hợp:", typeId);
            }

            handleAddGeneralCancel();

        } catch (error) {
            console.error("Lỗi tạo điều khoản:", error);
            message.error("Có lỗi xảy ra khi tạo điều khoản");
        }
    };
    const handleChildSelectChange = (typeKey, fieldKey, newValues) => {
        const currentFormValues = form.getFieldsValue(true);
    
        // Lấy các field con khác trong cùng loại (ngoại trừ field hiện tại) với giá trị là mảng số nguyên
        const otherFieldsInSameType = ["Common", "A", "B"].filter((key) => key !== fieldKey);
        const selectedValuesInSameType = otherFieldsInSameType.reduce((acc, key) => {
            const values = currentFormValues[typeKey]?.[key] || [];
            acc[key] = values;
            return acc;
        }, {});
    
        // Kiểm tra xem giá trị nào trong newValues đã tồn tại ở các field con khác không
        const duplicateValues = newValues.filter((item) =>
            Object.entries(selectedValuesInSameType).some(([otherField, values]) => values.includes(item))
        );
    
        if (duplicateValues.length > 0) {
            duplicateValues.forEach((dup) => {
                // Tìm field nào đã chứa giá trị trùng
                const duplicateFieldEntry = Object.entries(selectedValuesInSameType).find(
                    ([otherField, values]) => values.includes(dup)
                );
                if (duplicateFieldEntry) {
                    const duplicateField = duplicateFieldEntry[0];
                    message.error(
                        `Điều khoản đã được chọn ở ${displayLabels[typeKey][duplicateField]}. Bạn không thể chọn cùng 1 điều khoản ở 2 bên.`
                    );
                }
            });
    
            // Lọc bỏ các giá trị trùng
            const validValues = newValues.filter(
                (item) => !Object.values(selectedValuesInSameType).flat().includes(item)
            );
    
            // Cập nhật form với giá trị đã lọc
            form.setFieldsValue({
                [typeKey]: {
                    ...(currentFormValues[typeKey] || {}),
                    [fieldKey]: validValues,
                },
            });
        } else {
            // Cập nhật form bình thường nếu không có giá trị trùng
            form.setFieldsValue({
                [typeKey]: {
                    ...(currentFormValues[typeKey] || {}),
                    [fieldKey]: newValues,
                },
            });
        }
    };
    
    const otherSelectedValues = [];

    // Calculate values already selected in other sections
    ["Common", "A", "B"].forEach((k) => {
        const values = (form.getFieldValue([termId, k]) || []).map(item => item);
        otherSelectedValues.push(...values);
    });

    // Add a function to get the appropriate title based on termId
    const getModalTitle = () => {
        // Extract just the common part of the title (without "chung" or "riêng bên X")
        if (displayLabels[termId] && displayLabels[termId]["Common"]) {
            // Remove the word "chung" from the end to get the base title
            const baseTitle = displayLabels[termId]["Common"].replace(" chung", "");
            return `Thêm ${baseTitle}`;
        }
        return "Thêm điều khoản";
    };
    
   

    return (
        <div className="mt-4">
            <h4 className="font-bold">{title}</h4>
            {["Common", "A", "B"].map((key, index) => {
                // Remove the current section's values from otherSelectedValues
                const filteredValues = otherSelectedValues.filter(value =>
                    !(form.getFieldValue([termId, key]) || [])
                        .map(item => item)
                        .includes(value)
                );
                return (
                    <Form.Item
                        key={index}
                        label={displayLabels[termId][key]}
                        name={[termId, key]}
                    >
                        <LazySelect
                            loadDataCallback={loadDataCallback}
                            options={generalData?.data.content}
                            globalSelected={filteredValues}
                            showSearch
                            placeholder={displayLabels[termId][key]}
                            mode="multiple"
                            onChange={(newValues) => handleChildSelectChange(termId, key, newValues)}
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    <Divider style={{ margin: "8px 0" }} />
                                    <Space style={{ padding: "0 8px 4px" }}>
                                        <Button
                                            type="primary"
                                            icon={<PlusOutlined />}
                                            onClick={() => showAddModal(termId)}
                                        >
                                            Thêm điều khoản
                                        </Button>
                                    </Space>
                                </>
                            )}
                        />
                    </Form.Item>
                );
            })}
            <Modal
                title={getModalTitle()}
                open={isAddGeneralModalOpen}
                onOk={handleAddOkGeneralTerm}
                onCancel={handleAddGeneralCancel}
                okText="Lưu"
                cancelText="Hủy"
            >
                <Form layout="vertical">
                    <Form.Item
                        label="Tên điều khoản"
                        rules={[{ required: true, message: "Vui lòng nhập tên điều khoản!" }]}
                    >
                        <Input
                            value={newGeneralTerm.name}
                            onChange={(e) => setNewGeneralTerm({ ...newGeneralTerm, name: e.target.value })}
                            placeholder="Nhập tên điều khoản"
                        />
                    </Form.Item>
                    <Form.Item
                        label="Nội dung điều khoản"
                        rules={[{ required: true, message: "Vui lòng nhập nội dung!" }]}
                    >
                        <TextArea
                            value={newGeneralTerm.content}
                            onChange={(e) => setNewGeneralTerm({ ...newGeneralTerm, content: e.target.value })}
                            placeholder="Nhập nội dung"
                            rows={4}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

// 2. Create a mapping of term IDs to their configurations





