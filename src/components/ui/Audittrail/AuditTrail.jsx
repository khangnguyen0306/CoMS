import React, { useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { Tag } from "antd";

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Hàm chuyển đổi mảng thời gian thành chuỗi định dạng "DD-MM-YYYY vào lúc HH:mm:ss"
 * Sử dụng chuỗi ISO để đảm bảo dữ liệu được xử lý theo UTC, sau đó chuyển sang múi giờ mong muốn.
 */

function convertCreatedAt(createdAtArray) {
  if (!createdAtArray || !Array.isArray(createdAtArray) || createdAtArray.length < 6) {
    return "Không có dữ liệu";
  }
  const [year, month, day, hour, minute, second] = createdAtArray;
  // Tạo chuỗi ISO theo định dạng: "YYYY-MM-DDTHH:mm:ssZ"
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(
    hour
  ).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}Z`;
  // Chuyển sang múi giờ "Asia/Ho_Chi_Minh" (hoặc múi giờ khác bạn cần)
  return dayjs.utc(dateStr).tz("Asia/Ho_Chi_Minh").format("DD-MM-YYYY vào lúc HH:mm:ss");
}

/**
 * Hàm chuyển đổi changedAt thành đối tượng Date đã được chuyển đổi sang múi giờ mong muốn.
 */
const getDateFromChangedAt = (changedAt) => {
  if (!changedAt || !Array.isArray(changedAt) || changedAt.length < 6) return null;
  const [year, month, day, hour, minute, second] = changedAt;
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(
    hour
  ).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}Z`;
  return dayjs.utc(dateStr).tz("Asia/Ho_Chi_Minh").toDate();
};

/**
 * Hàm tạo nhãn nhóm giờ, đặt phút và giây về 0 để các bản ghi cùng giờ được gom nhóm.
 */
const getHourGroupLabel = (changedAt) => {
  if (!changedAt || !Array.isArray(changedAt) || changedAt.length < 6) return "Không có dữ liệu";
  const [year, month, day, hour] = changedAt;
  return convertCreatedAt([year, month, day, hour, 0, 0]);
};

const AuditTrailDisplay = ({ auditTrails }) => {
  const [activeDate, setActiveDate] = useState(null);

  // Nhóm các bản ghi theo ngày (theo múi giờ đã chuyển đổi)
  const groupedTrails = auditTrails.reduce((acc, trail) => {
    const dateObj = getDateFromChangedAt(trail.changedAt);
    if (!dateObj) return acc;
    const dayFormatted = dayjs(dateObj).format("DD-MM-YYYY");
    if (!acc[dayFormatted]) {
      acc[dayFormatted] = [];
    }
    acc[dayFormatted].push(trail);
    return acc;
  }, {});

  return (
    <div className="p-4">
      {Object.keys(groupedTrails).map((day) => (
        <div key={day} className="mb-4 border-b pb-2">
          <h3
            onClick={() => setActiveDate(activeDate === day ? null : day)}
            className="text-lg font-semibold cursor-pointer hover:text-blue-500"
          >
            {day}
          </h3>

          {activeDate === day && (
            <div className="audit-trail-list mt-2">
              {Object.entries(
                groupedTrails[day].reduce((acc, trail) => {
                  const hourLabel = getHourGroupLabel(trail.changedAt);
                  if (!acc[hourLabel]) {
                    acc[hourLabel] = [];
                  }
                  acc[hourLabel].push(trail);
                  return acc;
                }, {})
              )
                .sort(([labelA], [labelB]) => {
                  const hourA = parseInt(labelA.split("vào lúc ")[1].split(":")[0], 10);
                  const hourB = parseInt(labelB.split("vào lúc ")[1].split(":")[0], 10);
                  return hourA - hourB;
                })
                .map(([hourLabel, trails]) => (
                  <div key={hourLabel} className="audit-trail-time-group mb-2">
                    <Tag color="blue" className="text-gray-500 my-2">
                      {hourLabel}
                    </Tag>
                    {trails
                      .sort((a, b) => {
                        const dateA = getDateFromChangedAt(a.changedAt);
                        const dateB = getDateFromChangedAt(b.changedAt);
                        return dateA - dateB;
                      })
                      .map((trail) => (
                        <div key={trail.id} className="audit-trail-item mb-2">
                          <p>- {trail.changeSummary}</p>
                          <p className="text-gray-500 text-sm">
                            {convertCreatedAt(trail.changedAt)}
                          </p>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AuditTrailDisplay;
