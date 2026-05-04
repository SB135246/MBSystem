/*임시로 만들어 놓은 페이지*/

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Wifi, MapPin, LogOut } from "lucide-react";

import oneFloor from "./image/oneFloor.png";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");

    if (!isAdmin) {
      navigate("/admin");
    }
  }, []);

  const alertList = [
    { id: 1, type: "SOS", location: "1층 117호", time: "방금 전" },
    { id: 2, type: "RSSI 약함", location: "AP2", time: "5분 전" },
  ];

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4">
      {/* 🔥 헤더 */}
      <header className="bg-[#0052CC] text-white px-4 py-4 rounded-xl flex justify-between items-center mb-4">
        <h1 className="font-bold text-lg">MBS 관리자</h1>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg"
        >
          <LogOut size={16} />
          로그아웃
        </button>
      </header>

      {/* 🔥 상태 카드 */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white p-4 rounded-xl shadow text-center">
          <p className="text-sm text-gray-500">시스템 상태</p>
          <p className="text-green-500 font-bold text-xl">정상</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow text-center">
          <p className="text-sm text-gray-500">현재 위치</p>
          <p className="text-blue-500 font-bold text-xl">1층</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow text-center">
          <p className="text-sm text-gray-500">연결 장비</p>
          <p className="text-purple-500 font-bold text-xl">12</p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow text-center">
          <p className="text-sm text-gray-500">알림 수</p>
          <p className="text-red-500 font-bold text-xl">3</p>
        </div>
      </div>

      {/* 🔥 지도 */}
      <section className="bg-white rounded-xl p-4 shadow mb-4">
        <h2 className="font-bold text-sm mb-2">현재 위치 (관리자)</h2>

        <div className="relative">
          <img src={oneFloor} alt="map" />

          <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2">
            <MapPin className="text-blue-500 fill-blue-500" />
          </div>
        </div>
      </section>

      {/* 🔥 RSSI */}
      <section className="bg-white rounded-xl p-4 shadow mb-4">
        <div className="flex items-center font-bold text-blue-500 mb-2">
          <Wifi size={16} className="mr-2" />
          RSSI 상태
        </div>

        {[
          { id: "AP1", value: "-55 dBm", color: "green" },
          { id: "AP2", value: "-70 dBm", color: "orange" },
          { id: "AP3", value: "-85 dBm", color: "red" },
        ].map((ap) => (
          <div key={ap.id} className="flex justify-between py-2 border-b">
            <span>{ap.id}</span>
            <span>{ap.value}</span>
          </div>
        ))}
      </section>

      {/* 🔥 알림 관리 */}
      <section className="bg-white rounded-xl p-4 shadow mb-4">
        <div className="flex items-center font-bold text-red-500 mb-2">
          <Bell size={16} className="mr-2" />
          알림 관리
        </div>

        {alertList.map((alert) => (
          <div
            key={alert.id}
            className="flex justify-between items-center py-2 border-b"
          >
            <div>
              <p className="font-semibold">{alert.type}</p>
              <p className="text-sm text-gray-500">
                {alert.location} · {alert.time}
              </p>
            </div>

            <button className="bg-blue-500 text-white px-3 py-1 rounded">
              처리
            </button>
          </div>
        ))}
      </section>

      {/* 🔥 로그 */}
      <section className="bg-white rounded-xl p-4 shadow">
        <h2 className="font-bold text-sm mb-2">시스템 로그</h2>

        <ul className="text-sm text-gray-600 space-y-1">
          <li>14:30 - 관리자 로그인</li>
          <li>14:25 - AP2 신호 약함</li>
          <li>14:20 - SOS 발생</li>
        </ul>
      </section>
    </div>
  );
};

export default AdminDashboard;
