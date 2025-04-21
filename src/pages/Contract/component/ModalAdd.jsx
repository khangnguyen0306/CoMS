import { Form, Input, message, Modal } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import React from 'react'
import { useCreateClauseMutation, useLazyGetClauseManageQuery } from '../../../services/ClauseAPI'
import { PlusOutlined } from '@ant-design/icons'


const ModalAdd = ({ isModalAddOpen, closeModalAdd, clauseId, callBackCallAPI }) => {
    const [form] = Form.useForm();
    const [addClause] = useCreateClauseMutation()
    const [getGeneralTerms, { data: generalData, isLoading: loadingGenaral, refetch: refetchGenaral }] = useLazyGetClauseManageQuery();

    // const loadDKKata = async ({ page, size, keyword }) => {
    //     return getGeneralTerms({ page, size, keyword, typeTermIds: 10 }).unwrap();
    // };
    // const loadGenaralData = async ({ page, size, keyword }) => {
    //     return getGeneralTerms({ page, size, keyword, typeTermIds: 9 }).unwrap();
    // };
    const handleAddClause = async () => {
        const data = form.getFieldsValue(true)

        try {
            const result = await addClause({ label: data.termName, value: data.termContent, typeTermId: clauseId }).unwrap();
            // console.log(result);
            if (result.status === "CREATED") {
                message.success(`Tạo ${displayTitle[clauseId]} thành công`);
                closeModalAdd();
                callBackCallAPI()
                form.resetFields();
            }

        } catch (error) {
            console.error("Lỗi tạo căn cứ pháp lý:", error);
            message.error(`Có lỗi xảy ra khi tạo ${displayTitle[clauseId]}`);
        }
    }
    const displayTitle = {
        10: "Điều khoản khác",
        9: "Điều khoản chung"

    }
    return (
        <div>
            <Modal
                title={<p>Thêm {displayTitle[clauseId]}</p>}
                open={isModalAddOpen}
                onOk={handleAddClause}
                onCancel={closeModalAdd}
                okText={<p><PlusOutlined className='mr-1' /> Tạo mới</p>}
                cancelText="Đóng"
            >
                <Form
                    layout="vertical"
                    form={form}
                    className='mt-8'
                >
                    <Form.Item
                        name="termName"
                        label="Tên điều khoản"
                        rules={[{ required: true, message: "Vui lòng nhập tên điều khoản!" }]}
                    >
                        <Input
                            // onChange={(e) => setNewGeneralTerm({ ...newGeneralTerm, name: e.target.value })}
                            placeholder="Nhập tên điều khoản"
                        />
                    </Form.Item>
                    <Form.Item
                        name="termContent"
                        label="Nội dung"
                        rules={[{ required: true, message: "Vui lòng nhập nội dung điều khoản!" }]}
                    >
                        <TextArea
                            // value={newGeneralTerm.content}
                            // onChange={(e) => setNewGeneralTerm({ ...newGeneralTerm, content: e.target.value })}
                            placeholder="Nhập nội dung"
                            rows={4}
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}

export default ModalAdd