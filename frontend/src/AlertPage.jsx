import { ArrowLeft, Bell, MapPin, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AlertPage = () => {
  const navigate = useNavigate();

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
        <div className="bg-red-100 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-red-500 text-white p-3 rounded-full">
              <Bell />
            </div>
            <span className="font-bold text-red-500">SOS 신호</span>
          </div>
          <span className="text-sm text-gray-500">방금 전</span>
        </div>

        <div className="bg-orange-100 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 text-white p-3 rounded-full">
              <MapPin />
            </div>
            <span className="font-bold text-orange-500">위치 이탈</span>
          </div>
          <span className="text-sm text-gray-500">10초 전</span>
        </div>

        <div className="bg-purple-100 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 text-white p-3 rounded-full">
              <ShieldAlert />
            </div>
            <span className="font-bold text-purple-500">장치 탈거 감지</span>
          </div>
          <span className="text-sm text-gray-500">30초 전</span>
        </div>
      </div>
    </div>
  );
};

export default AlertPage;
