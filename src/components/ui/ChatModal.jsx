import React, { useState } from 'react';
import { Modal, Button, Image } from 'antd';
import ChatWithAI from '../AI-Gen/AI';
import ImageAI from '../../assets/Image/AI_Image.png'

function ChatModalWrapper({ generatedPrompt, handleGenerateAIPrompt }) {

    const [isModalVisible, setIsModalVisible] = useState(false);
    const openModal = () => setIsModalVisible(true);
    const closeModal = () => setIsModalVisible(false);

    return (
        <div className='rounded-full '>
            <Image preview={false} src={ImageAI} width={70} height={70}  onClick={openModal} className='cursor-pointer ' />
            <Modal
                title="Xin chào! COMS AI có thể giúp gì cho bạn ?"
                open={isModalVisible}
                onCancel={closeModal}
                footer={null}
                width={1000}
            >
                <ChatWithAI initialPrompt={generatedPrompt} handleGenerateAIPrompt={handleGenerateAIPrompt} />
            </Modal>
        </div>
    );
}

export default ChatModalWrapper;
