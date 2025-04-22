import React, { useEffect } from "react";
import { Button, Skeleton, Divider } from "antd";
import { useParams } from "react-router-dom";
import { useGetDetailUserByIdQuery } from "../../services/UserAPI";
import dayjs from "dayjs";
import partnerIMG from "../../assets/Image/partner.jpg";
import { MailFilled } from "@ant-design/icons";
import { MdPlace } from "react-icons/md";
import utc from "dayjs/plugin/utc";
import { useSelector } from "react-redux";
import { selectCurrentUser } from "../../slices/authSlice";
dayjs.extend(utc);


const ProfileDetail = () => {
    const { id } = useParams();
    const user = useSelector(selectCurrentUser)
    const { data, isLoading, refetch } = useGetDetailUserByIdQuery({ id }, { skip: !id });
    const isDarkMode = useSelector((state) => state.theme.isDarkMode);

    // console.log(user)

    useEffect(() => {
        refetch()
    }, [id])

    const dislayGender = {
        "MALE": "Nam",
        "FEMALE": "Nữ",
        "OTHER": "Khác"
    }

    if (isLoading) return <Skeleton active />;

    return (
        <div className="p-6 min-h-screen">

            <div className="flex">
                {/* Thanh bên */}
                <div className="w-[30%] p-6 rounded-lg">
                    <div className="flex flex-col items-center">
                        <div
                            className="relative w-[220px] h-[220px] mb-[60px] cursor-pointer"
                        >
                            <img
                                src={data?.avatar || partnerIMG}
                                alt="Hồ sơ"
                                className="w-full h-full border-4 border-white shadow-md object-cover rounded-md"
                            />
                        </div>
                        <Divider className="mt-[40px]">
                            <p>Liên lạc</p>
                        </Divider>
                        {user.id != id && (
                            <div className="mt-4 flex flex-col gap-2 w-full">
                                <Button
                                    type="primary"
                                    icon={<MailFilled />}
                                    onClick={() => (window.location.href = `mailto:${data?.email}`)}
                                >
                                    Gửi email
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Khu vực nội dung chính */}
                <div className="w-[70%] ml-6 p-6 rounded-lg relative mt-5">

                    <div className="space-y-6">
                        <div className="flex items-end gap-8">
                            <p className="font-semibold text-3xl">{data?.full_name}</p>
                            <p className="flex mb-1 items-center text-gray-700 text-sm">
                                <MdPlace style={{ fontSize: '20px', marginBottom: '5px', color: 'grey', marginRight: '7px' }} />
                                {data?.address || "Chưa cập nhật"}
                            </p>
                        </div>

                        <p className="py-3 pt-0">
                            <span className="font-semibold text-gray-500 text-base">THÔNG TIN CƠ BẢN</span>
                            <hr className="mt-4" />
                        </p>
                        <div className="ml-3">
                            <div className="flex items-center mb-2">
                                <span className={`inline-block w-[200px] font-bold`}>Mã nhân viên:</span>
                                <span className={isDarkMode ? "text-gray-300" : "text-gray-800"}>{data?.staff_code || "EMP123"}</span>
                            </div>

                            <div className="flex items-center mb-2">
                                <span className={`inline-block w-[200px] font-bold`}>Ngày tháng năm sinh:</span>
                                <span className={isDarkMode ? "text-gray-300" : "text-gray-800"}>
                                    {data?.date_of_birth
                                        ? dayjs(
                                            new Date(
                                                data.date_of_birth[0],
                                                data.date_of_birth[1] - 1,
                                                data.date_of_birth[2]
                                            )
                                        ).format("DD/MM/YYYY")
                                        : "05/06/1982"}
                                </span>
                            </div>

                            <div className="flex items-center mb-2">
                                <span className={`inline-block w-[200px] font-bold`}>Giới tính:</span>

                                <span className={isDarkMode ? "text-gray-300" : "text-gray-800"}>{dislayGender[data?.gender] || "Chưa cập nhật"}</span>
                            </div>

                            <div className="flex items-center mb-2">
                                <span className={`inline-block w-[200px] font-bold`}>Phòng ban:</span>

                                <span className={isDarkMode ? "text-gray-300" : "text-gray-800"}>{data?.department?.departmentName || "Phòng ban"}</span>
                            </div>
                        </div>
                        <p className="py-6">
                            <span className="font-semibold text-gray-500 text-base">THÔNG TIN LIÊN HỆ</span>
                            <hr className="mt-4" />
                        </p>
                        <div className="ml-3">
                            <div className="flex items-center mb-2">
                                <span className="inline-block w-[200px] font-bold">Số điện thoại:</span>
                                <a href={`tel:${data?.phone_number}`} className="text-[#007bff] underline">
                                    {data?.phone_number || "Chưa cập nhật"}
                                </a>
                            </div>

                            <div className="flex items-center mb-2">
                                <span className="inline-block w-[200px] font-bold">Email:</span>
                                <a href={`mailto:${data?.email}`} className="text-[#007bff] underline">
                                    {data?.email}
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default ProfileDetail;
