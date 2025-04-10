import React, { useState } from 'react';
import { Modal, Button, Image } from 'antd';
import ChatWithAI from '../AI-Gen/AI';
import ImageAI from '../../assets/Image/AI.png'
import { useSelector } from 'react-redux';
import { isDarkMode } from '../../slices/themeSlice';

function ChatModalWrapper({ generatedPrompt, handleGenerateAIPrompt, ...otherProps }) {

    // console.log(generatedPrompt)
    const [isModalVisible, setIsModalVisible] = useState(false);
    const openModal = () => setIsModalVisible(true);
    const closeModal = () => setIsModalVisible(false);
    const isD = useSelector(isDarkMode)

    const [isOpen, setIsOpen] = React.useState(true);
    const closeModalChat = () => {
        setIsOpen(false);
    };

    return (
        <div className='rounded-full p-2'>
            {isOpen && (
                <div className={`fixed bottom-14 right-3 rounded-lg shadow-lg p-4 max-w-xs  animate-fade-in z-[100] mr-[60px] ${!isD ? "bg-[#d2d2d2] text-black" : "bg-[#1f1f1f]"}`}>
                    <div className="flex justify-between items-center absolute top-1 right-2">
                        <button
                            onClick={closeModalChat}
                            className='text-red-700'
                        >
                            ✕
                        </button>
                    </div>
                    <div className="my-1 ">
                        Xin chào! Có thể tôi giúp được bạn
                    </div>
                </div>
            )}
            <Image preview={false} src={ImageAI} width={70} height={70} onClick={openModal} className='cursor-pointer rounded-full shadow-lg shadow-blue-400' />
            <Modal
                title="Xin chào! COMS AI có thể giúp gì cho bạn ?"
                open={isModalVisible}
                onCancel={closeModal}
                footer={null}
                width={1000}
                className='overflow-x-hidden'
            >
                <ChatWithAI initialPrompt={generatedPrompt} handleGenerateAIPrompt={handleGenerateAIPrompt} others={otherProps} />
            </Modal>
        </div>
    );
}

export default ChatModalWrapper;
