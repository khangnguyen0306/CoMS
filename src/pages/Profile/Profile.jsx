import React from 'react';

const Profile = () => {
    return (
        <div className="flex justify-center">
            {/* Front Card */}
            <div className="w-[800px] bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="relative">
                    {/* Header with Logo */}
                    <div className="p-8" style={{ backgroundColor: "#89c4d9" }}>
                        <div className="w-48 h-56 mx-auto">
                            <img
                                src="https://media.tiepthigiadinh.vn/files/thanhhoapv/2024/03/21/65fbac55cb654.png"
                                alt="Company Logo"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>

                    {/* Black Stripe */}
                    <div className="h-3 bg-gray-600"></div>

                    {/* Profile Image */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-20">
                        <div className="w-40 h-40 rounded-full border-4 border-white overflow-hidden">
                            <img
                                src="https://faceinch.vn/upload/elfinder/%E1%BA%A2nh/chup-chan-dung-5.jpg"
                                alt="Employee"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>

                {/* Card Content */}
                <div className="pt-24 pb-8 px-8">
                    <h2 className="text-3xl font-bold text-center text-gray-800">NGUYỄN VĂN A</h2>
                    <p className="text-gray-600 text-center mt-2 text-lg">NHÂN VIÊN BÁN HÀNG</p>

                    {/* Employee Details */}
                    <div className="mt-8 grid grid-cols-2 gap-x-12 gap-y-4">
                        <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#89c4d9" }}>
                                Mã NV
                            </span>
                            <span className="text-gray-800 font-semibold text-lg">: KT-012354</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#89c4d9" }}>
                                Năm Sinh
                            </span>
                            <span className="text-gray-800 font-semibold text-lg">: 23/10/1990</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#89c4d9" }}>
                                Điện Thoại
                            </span>
                            <span className="text-gray-800 font-semibold text-lg">: 0123 456 789</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#89c4d9" }}>
                                Tuổi
                            </span>
                            <span className="text-gray-800 font-semibold text-lg">: 35</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#89c4d9" }}>
                                Địa chỉ
                            </span>
                            <span className="text-gray-800 font-semibold text-lg">: 123 Đường ABC</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#89c4d9" }}>
                                Phòng Ban
                            </span>
                            <span className="text-gray-800 font-semibold text-lg">: Phòng Kinh Doanh</span>
                        </div>
                        <div className="flex items-center">
                            <span className="w-32 font-medium text-gray-600 text-lg" style={{ color: "#89c4d9" }}>
                                Website
                            </span>
                            <span className="text-gray-800 font-semibold text-lg">: CoMS.com</span>
                        </div>
                    </div>

                    {/* Update Button */}
                    <div className="mt-8 text-center">
                        <button
                            className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition"
                            onClick={() => alert("hehe")}
                        >
                            Update
                        </button>
                    </div>
                </div>
            </div>
        </div>


    );
};

export default Profile;