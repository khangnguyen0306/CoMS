# Build stage
FROM node:22.14.0-alpine AS build

# Đặt thư mục làm việc trong container là /app.
WORKDIR /app

# Copy các file package.json và package-lock.json vào container
COPY package*.json ./

RUN npm install

# Copy toàn bộ code vào container.
COPY . .

RUN npm run build --max-old-space-size=4096

# Production stage
# Dùng image nginx:latest để chạy ứng dụng ReactJS sau khi build
FROM nginx:latest AS production-stage

# Copy toàn bộ file đã build từ giai đoạn build (/app/dist) vào thư mục mặc định của Nginx (/usr/share/nginx/html).
COPY --from=build /app/dist /usr/share/nginx/html

# Copy file config Nginx (nginx.conf) vào thư mục cấu hình
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Mở cổng 80 để Nginx có thể phục vụ ứng dụng
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]