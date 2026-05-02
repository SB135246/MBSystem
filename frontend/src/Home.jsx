import React, { useState, useEffect, useRef } from "react";
import { Bell, Clock, Wifi, MapPin, Play } from "lucide-react";

import oneFloor from "./image/oneFloor.png";
import twoFloor from "./image/twoFloor.png";
import threeFloor from "./image/threeFloor.png";

import "./tailwind.css";

const Home = () => {
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  // 🔥 시스템 시작 상태 추가
  const [isStarted, setIsStarted] = useState(false);

  // 🔥 안전 / 경보 상태
  const [status, setStatus] = useState("safe"); // safe | alert

  // 1. 오디오 객체를 useRef로 관리 (렌더링 시마다 새로 생성 방지)
  const audioRef = useRef(null);

  // 1. 오디오 객체는 미리 생성
  useEffect(() => {
    audioRef.current = new Audio("/alram.mp3");
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // 2. [핵심] 시스템 시작 시 오디오 락 해제 및 타이머 시작
  const startSystem = () => {
    if (audioRef.current) {
      // 사용자가 버튼을 누르는 이 순간 오디오 통로가 뚫립니다.
      audioRef.current
        .play()
        .then(() => {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsStarted(true); // 이제부터는 5초마다 소리가 납니다.
        })
        .catch((err) => console.error("Audio unlock failed", err));
    }
  };

  // 3. 시스템이 시작된 후에만 타이머 작동
  useEffect(() => {
    if (!isStarted) return;

    const timer = setInterval(() => {
      setAlertOpen(true);
      setStatus("alert"); // 🔥 위험 상태로 변경
      setAlertCount((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [isStarted]);

  // 4. 모달 상태에 따른 재생/정지
  useEffect(() => {
    if (!audioRef.current || !isStarted) return;

    if (alertOpen) {
      audioRef.current.play().catch((err) => console.error("Play failed", err));
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [alertOpen, isStarted]);

  // 🔥 알림 확인 클릭 핸들러
  const handleAlertConfirm = () => {
    setAlertOpen(false);
    setStatus("safe"); // 🔥 다시 안전 상태로 변경
  };

  // 🔥 시작 전 화면 (Splash Screen)
  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0052CC] p-6 text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
          <Bell size={40} className="text-white" />
        </div>
        <h1 className="text-white text-2xl font-bold mb-2">MBS 시스템</h1>
        <p className="text-white/80 mb-8 text-sm leading-relaxed">
          경보 알림 소리를 위해
          <br />
          시스템 시작 버튼을 눌러주세요.
        </p>
        <button
          onClick={startSystem}
          className="flex items-center gap-2 bg-white text-[#0052CC] px-8 py-4 rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
        >
          <Play size={20} fill="#0052CC" />
          시스템 시작하기
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#F8F9FA]">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0052CC] text-white px-4 py-4 flex justify-center items-center relative">
          <h1 className="text-[clamp(1.2rem,4vw,1.8rem)] font-bold">MBS</h1>

          {/* 🔥 위치 수정된 알림 버튼 */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="relative bg-[#FF4D4D] rounded-full p-2 flex items-center justify-center cursor-pointer active:scale-95">
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
          {/* 🔥 가변 안전/위험 상태 섹션 */}
          <section className="bg-white rounded-xl border border-[#E9ECEF] shadow-sm overflow-hidden transition-colors duration-300">
            <div
              className={`py-3 flex justify-center items-center gap-2 ${status === "alert" ? "bg-red-50" : "bg-[#F1F3F5]"}`}
            >
              <div
                className={`w-3 h-3 rounded-full ${status === "alert" ? "bg-red-500 animate-ping" : "bg-[#00B341]"}`}
              ></div>
              <span
                className={`text-[clamp(1rem,4vw,1.3rem)] font-bold ${status === "alert" ? "text-red-600" : "text-[#00B341]"}`}
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
                3층
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
                현재 층 : 3층
              </div>
            </div>

            <div className="relative w-full aspect-[2/1] flex items-center justify-center">
              <img
                src={threeFloor}
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
              알림 확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
