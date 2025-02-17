import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const validationPatterns = {
  name: {
    pattern: /^[^\d\s][\p{L}'\s-]{4,49}$/u,
    message: 'Tên tài khoản phải là ký tự và từ 5 - 50 ký tự!',
  },
  phoneNumber: {
    pattern: /^(0|\+84)[1-9]\d{8}$/,
    message: 'Số điện thoại phải bắt đầu bằng 0, 10 chữ số và không có chữ cái!',
  },
  email: {
    pattern: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g,
    message: 'Email không đúng định dạng!',
  },
  number: {
    pattern: /^[1-9]\d{3}^$/,
    message: 'Số nhỏ nhất là 1 và chỉ có chữ số!',
  },
  password: {
    pattern: /^(?=^.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/,
    message: "Mật khẩu phải có ít nhất 1 chữ cái viết hoa, 6 ký tự, ít nhất 1 số!"
  }
};

