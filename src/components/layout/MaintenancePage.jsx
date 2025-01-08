// MaintenancePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const MaintenancePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Trang đang cập nhật</h1>
      <p className="text-lg text-gray-600 mb-6">Chúng tôi xin lỗi vì sự bất tiện này. Vui lòng quay lại sau!</p>
      <button
        onClick={() => navigate(-1)} // Navigates back to the previous page
        className="px-6 py-3 bg-blue-600 text-white rounded-md shadow hover:bg-blue-500 transition"
      >
        Quay lại
      </button>
    </div>
  );
};

export default MaintenancePage;
