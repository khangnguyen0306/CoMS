import { useState, useRef, useEffect } from 'react';
import { Button } from 'antd';

export const PreviewSection = ({ content }) => {
  const containerRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      const containerHeight = containerRef.current.scrollHeight;
      setIsOverflowing(containerHeight > 300);
    }
  }, [content]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="mt-4 p-4 bg-[#f5f5f5] rounded shadow-md">
      <h4 className="font-bold text-lg mb-2">Xem trước nội dung hợp đồng:</h4>

      <div
        ref={containerRef}
        className="overflow-y-auto transition-all duration-300"
        style={{ maxHeight: isExpanded ? 'none' : '300px' }}
      >
        <div
          className="p-4 "
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {isOverflowing && (
        <div className="flex justify-center mt-2">
          <Button
            type="link"
            onClick={toggleExpand}
            className="!text-[#1677ff] !font-medium"
          >
            {isExpanded ? 'Thu gọn ▲' : 'Xem thêm ▼'}
          </Button>
        </div>
      )}
    </div>
  );
};