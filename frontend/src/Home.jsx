import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Clock, Wifi, MapPin } from "lucide-react";

import oneFloor from "./image/oneFloor.png";
import twoFloor from "./image/twoFloor.png";
import threeFloor from "./image/threeFloor.png";

import "./tailwind.css";

const Home = () => {
  const navigate = useNavigate();

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [status, setStatus] = useState("safe");

  const audioRef = useRef(null);
  const vibrationTimeoutRef = useRef(null); // 🔥 핵심

  // 🔊 오디오 준비
  useEffect(() => {
    audioRef.current = new Audio("/alram.mp3");
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // 🔥 5초마다 알림 발생
  useEffect(() => {
    const timer = setInterval(() => {
      setAlertOpen(true);
      setStatus("alert");
      setAlertCount((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const startVibrationLoop = () => {
    if (!("vibrate" in navigator)) return;

    const pattern = [500, 300, 500, 300, 500]; // 총 2100ms
    const totalDuration = pattern.reduce((a, b) => a + b, 0); // 2100

    const loop = () => {
      navigator.vibrate(pattern);
      vibrationTimeoutRef.current = setTimeout(loop, totalDuration + 200); // 2300ms 후 재실행
    };

    loop();
  };

  // 🔥 진동 멈춤
  const stopVibrationLoop = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(0);
    }

    if (vibrationTimeoutRef.current) {
      clearTimeout(vibrationTimeoutRef.current);
    }
  };

  useEffect(() => {
    if (!audioRef.current) return;

    if (alertOpen) {
      audioRef.current.play().catch(() => {});

      navigator.vibrate([300, 100, 300]); // 🔥 추가

      startVibrationLoop(); // 🔥 바로 실행
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      stopVibrationLoop();
    }

    return () => stopVibrationLoop();
  }, [alertOpen]);

  // 🔥 알림 닫기
  const handleAlertConfirm = () => {
    setAlertOpen(false);
    setStatus("safe");
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#F8F9FA]">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0052CC] text-white px-4 py-4 flex justify-center items-center relative">
          <h1 className="text-[clamp(1.2rem,4vw,1.8rem)] font-bold">MBS</h1>

          {/* 🔥 위치 수정된 알림 버튼 */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div
              onClick={() => navigate("/alerts")}
              className="relative bg-[#FF4D4D] rounded-full p-2 flex items-center justify-center cursor-pointer active:scale-95"
            >
              <Bell size={18} fill="white" stroke="white" />

              {/* 알림 숫자 */}
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-red-500 text-[10px] px-1 rounded-full font-bold">
                  {alertCount}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="flex-1 p-3 sm:p-4 space-y-4">
          {/* 가변 안전/위험 상태 섹션 */}
          <section
            className={`rounded-xl border shadow-sm overflow-hidden transition-all duration-500 ${
              status === "alert"
                ? "bg-red-50 border-red-200"
                : "bg-green-50 border-green-100" // 🔥 회색에서 연한 초록색으로 변경
            }`}
          >
            <div className="py-4 flex justify-center items-center gap-3">
              {/* 상태 점(Dot) */}
              <div className="relative flex h-3 w-3">
                {status === "alert" && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    status === "alert" ? "bg-red-500" : "bg-[#00B341]"
                  }`}
                ></span>
              </div>

              {/* 텍스트 */}
              <span
                className={`text-[clamp(1.1rem,4.5vw,1.4rem)] font-extrabold tracking-tight ${
                  status === "alert" ? "text-red-600" : "text-[#00B341]"
                }`}
              >
                {status === "alert" ? "위험" : "안전"}
              </span>
            </div>
          </section>

          {/* 업데이트 시간 */}
          <div className="py-1 flex justify-center items-center text-[clamp(0.75rem,3vw,0.9rem)] text-[#868E96]">
            <Clock size={16} className="mr-1" />
            마지막 업데이트 : 방금전
          </div>

          {/* 현재 위치 */}
          <section className="bg-white rounded-xl p-4 border border-[#E9ECEF] shadow-sm">
            <h2 className="text-[#495057] font-bold text-sm">현재 위치</h2>

            <div className="flex justify-center py-3">
              <span className="font-extrabold text-[#1A3A6B] text-[clamp(2rem,8vw,3rem)]">
                1층
              </span>
            </div>
          </section>

          {/* 지도 */}
          <section className="bg-white rounded-xl p-4 border border-[#E9ECEF] shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[#343A40] font-bold text-sm">
                IT관 내부 구조도
              </h2>

              <div className="bg-[#0062FF] text-white text-[clamp(0.6rem,2.5vw,0.75rem)] px-3 py-1 rounded-full">
                현재 층 : 1층
              </div>
            </div>

            <div className="relative w-full aspect-[2/1] flex items-center justify-center">
              <img
                src={oneFloor}
                alt="IT관 구조도"
                className="w-full h-full object-contain"
              />

              {/* 마커 */}
              <div className="absolute bottom-[2%] left-[50%] -translate-x-1/2 flex flex-col items-center">
                <MapPin size={24} className="text-[#0062FF] fill-[#0062FF]" />

                <div className="bg-[#0062FF] text-white text-[clamp(0.5rem,2vw,0.7rem)] px-2 py-[2px] rounded mt-1">
                  현재 위치
                </div>
              </div>
            </div>
          </section>

          {/* RSSI */}
          <section className="bg-white rounded-xl p-4 border border-[#E9ECEF] shadow-sm">
            <div className="flex items-center text-[#0062FF] font-bold mb-3">
              <Wifi size={18} className="mr-2" />
              <span className="text-[clamp(0.9rem,3vw,1.1rem)]">RSSI 신호</span>
            </div>

            <div className="space-y-3">
              {[
                { id: "AP1", value: "-55 dBm", bars: 4, color: "bg-[#00B341]" },
                { id: "AP2", value: "-70 dBm", bars: 3, color: "bg-[#FF9500]" },
                { id: "AP3", value: "-65 dBm", bars: 4, color: "bg-[#00B341]" },
              ].map((ap, index) => (
                <div
                  key={ap.id}
                  className={`flex items-center justify-between ${
                    index !== 0 ? "pt-3 border-t border-[#F1F3F5]" : ""
                  }`}
                >
                  <span className="text-[clamp(0.75rem,3vw,0.9rem)] font-semibold text-[#495057]">
                    {ap.id}
                  </span>

                  <div className="flex items-end gap-[2px] h-5">
                    {[1, 2, 3, 4].map((bar) => (
                      <div
                        key={bar}
                        className={`w-[3px] rounded-sm ${
                          bar <= ap.bars ? ap.color : "bg-[#E9ECEF]"
                        }`}
                        style={{ height: `${bar * 25}%` }}
                      />
                    ))}
                  </div>

                  <span className="text-[clamp(0.75rem,3vw,0.9rem)] w-20 text-right text-[#495057]">
                    {ap.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>

      {/* 🔥 SOS 모달 */}
      {alertOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-[80%] max-w-xs p-6 text-center border border-red-300 shadow-[0_0_40px_rgba(255,0,0,0.6)]">
            {/* 🔔 흔들리는 아이콘 */}
            <div className="w-14 h-14 mx-auto mb-3 bg-red-100 rounded-full flex items-center justify-center">
              <Bell size={28} className="text-red-500 animate-bell" />
            </div>

            <p className="text-red-500 font-bold text-lg mb-2">SOS 신호</p>

            <button
              onClick={handleAlertConfirm}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-red-200 active:scale-95 transition-all"
            >
              알림 닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
