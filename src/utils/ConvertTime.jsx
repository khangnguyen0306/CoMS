import dayjs from "dayjs";
import "dayjs/locale/vi";

dayjs.locale("vi");
export const formatSigningDateWithTime = (dateArray) => {
    const formattedDate = dayjs(new Date(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4]));
    return formattedDate.format("DD/ MM/ YYYY HH:mm");
};


export const formatSigningDate = (dateArray) => {
    const formattedDate = dayjs(new Date(dateArray[0], dateArray[1] - 1, dateArray[2], dateArray[3], dateArray[4]));
    
    return formattedDate.format("Ngày DD/ Tháng MMMM/ Năm YYYY");
};