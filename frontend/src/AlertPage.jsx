import { ArrowLeft, Bell, MapPin, ShieldAlert } from "lucide-react";

import { useNavigate } from "react-router-dom";

import { useAlert } from "./context/AlertContext";

const AlertPage = () => {
  const navigate = useNavigate();

  const { alerts } = useAlert();

  // 시간 표시
  const formatTime = (createdAt) => {
    const now = new Date();
    const time = new Date(createdAt);

    const diff = Math.floor((now - time) / 1000);

    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;

    return `${Math.floor(diff / 86400)}일 전`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4">
      {/* 헤더 */}
      <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="mr-2">
          <ArrowLeft />
        </button>

        <h1 className="font-bold text-lg">알림</h1>
      </div>

      {/* 알림 리스트 */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center text-gray-400 mt-10">
            알림이 없습니다.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl p-4 flex justify-between items-center ${
                alert.type === "sos"
                  ? "bg-red-100"
                  : alert.type === "leave"
                    ? "bg-orange-100"
                    : "bg-purple-100"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 아이콘 */}
                <div
                  className={`text-white p-3 rounded-full ${
                    alert.type === "sos"
                      ? "bg-red-500"
                      : alert.type === "leave"
                        ? "bg-orange-500"
                        : "bg-purple-500"
                  }`}
                >
                  {alert.type === "sos" ? (
                    <Bell />
                  ) : alert.type === "leave" ? (
                    <MapPin />
                  ) : (
                    <ShieldAlert />
                  )}
                </div>

                {/* 텍스트 */}
                <span
                  className={`font-bold ${
                    alert.type === "sos"
                      ? "text-red-500"
                      : alert.type === "leave"
                        ? "text-orange-500"
                        : "text-purple-500"
                  }`}
                >
                  {alert.message}
                </span>
              </div>

              {/* 시간 */}
              <span className="text-sm text-gray-500">
                {formatTime(alert.createdAt)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertPage;
