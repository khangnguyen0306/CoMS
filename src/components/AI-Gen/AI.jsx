import { DeleteFilled } from "@ant-design/icons";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Button, Input } from "antd";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from 'react-markdown';
import { useSelector } from "react-redux";
import { isDarkMode } from "../../slices/themeSlice";



const apiKey = import.meta.env.VITE_AI_KEY;
const genAI = new GoogleGenerativeAI(apiKey);


const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
};

function ChatWithAI({ initialPrompt, handleGenerateAIPrompt, ...othersProps }) {


  const darkMode = useSelector(isDarkMode);

  const [messages, setMessages] = useState([
    { sender: "ai", text: "Chào bạn COMS có thể giúp gì cho bạn ?" }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messsageEndRef = useRef(null)
  const chatSessionRef = useRef(null)
  const [isSuggestionVisible, setIsSuggestionVisible] = useState(true);

  const scrollInToBottom = () => {
    messsageEndRef.current?.scroll
  }

  useEffect(() => {
    scrollInToBottom();
    if (!chatSessionRef.current) {
      chatSessionRef.current = model.startChat({
        generationConfig,
        history: [
        ],
      })
    }
  }, [messages])


  // useEffect(() => {
  //   if (initialPrompt) {
  //     // Sử dụng setTimeout để đảm bảo session đã sẵn sàng
  //     setTimeout(() => {
  //       handleSendMessageInternal(initialPrompt);
  //     }, 500);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [initialPrompt]);


  const handleSendMessageInternal = async (messageText) => {
    const userMessage = { text: messageText, sender: "user" };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    try {
      const response = await chatSessionRef.current.sendMessage(messageText);
      if (!response || !response.response || !response.response.candidates) {
        throw new Error("API không trả về dữ liệu hợp lệ.");
      }
      const fullResponse = response.response.candidates[0]?.content?.parts[0]?.text || "Không có phản hồi.";
      setMessages(prev => [...prev, { text: fullResponse, sender: "ai", isGenerating: false }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { sender: "ai", text: "Có lỗi khi nhập, vui lòng thử lại!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    setInput("");
    await handleSendMessageInternal(input);

  };

  const toggleSuggestion = () => {
    setIsSuggestionVisible(prev => !prev);
  };

  const suggestions = [
    { label: "Gợi ý nội dung cho mẫu hợp đồng", prompt: "Hãy gợi ý nội dung cho mẫu hợp đồng" },
    { label: "Kiểm tra lỗi sai", prompt: "Hãy kiểm tra lỗi sai của mẫu hợp đồng" },
  ];
  const showSuggestion = othersProps.others?.Template === "template";
  const handleSuggestionClick = async (prompt) => {
    await handleGenerateAIPrompt();
    const fullPrompt = `${prompt}: ${initialPrompt}`; // Kết hợp prompt và initialValue
    await handleSendMessageInternal(fullPrompt);
  };

  return (
    <div className="mt-20 overflow-x-hidden">
      <div className="flex-1 overflow-y-auto p-5">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-4 ${msg.sender == "user" ? "text-right " : "text-left"}`}>
            <div className={`inline-block py-4  px-6 rounded-lg ${msg.sender === "user" ? "bg-blue-700 text-white" : "bg-slate-300 text-black"}`}>
              {msg.sender === "user" ? (
                msg.text
              ) : (
                <ReactMarkdown
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="text-left">
            <div className="inline-block p-2 rounded-e-md">Đang suy nghĩ bạn chờ xíu nhé....</div>
          </div>
        )}
        <div ref={messsageEndRef} />
      </div>
      {isSuggestionVisible || handleGenerateAIPrompt && (
        <div className="flex items-center ml-6">
          <Button onClick={handleGenerateAIPrompt}>
            Phân tích hợp đồng
            <button onClick={toggleSuggestion} className="ml-2 text-red-500"><DeleteFilled /></button>
          </Button>
        </div>
      )}
      {showSuggestion && isSuggestionVisible && (
        <div className="flex items-center ml-6 mb-4 gap-2">
          {suggestions.map((suggestion, index) => (
            <Button key={index} onClick={() => handleSuggestionClick(suggestion.prompt)}>
              {suggestion.label}
            </Button>

          ))}

        </div>
      )}
      <form onSubmit={handleSendMessage} className={`p-4 ${darkMode ? "bg-white" : "#222222"} rounded-md flex justify-center items-center gap-2`}>
        <Input.TextArea
          className="w-full"
          type="text"
          size="large"
          value={input}
          placeholder="nhập nội dung ...."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(e)}
        />
      </form>
    </div>
  );
}

export default ChatWithAI;
