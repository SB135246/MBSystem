import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Clock, Wifi, MapPin, ShieldAlert } from "lucide-react";

import oneFloor from "./image/oneFloor.png";
import "./tailwind.css";
import socket from "../src/socket/socket";

const Home = () => {
  const navigate = useNavigate();

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [status, setStatus] = useState("safe");
  const [alertType, setAlertType] = useState("");
  const [currentSosId, setCurrentSosId] = useState(null);
  
  // 📍 실시간 위치 상태 추가 (기본값 1층)
  const [currentFloor, setCurrentFloor] = useState(1);

  const audioRef = useRef(null);
  const API_URL = import.meta.env.VITE_API_URL;

  // 알림 발생 공통 로직
  const triggerAlert = (type, sosId = null) => {
    setAlertType(type);
    setAlertOpen(true);
    setStatus("alert");
    setAlertCount((prev) => prev + 1);
    if (sosId) setCurrentSosId(sosId);
  };

  // 1. 웹소켓 연결 및 구독 로직
  useEffect(() => {
    console.log("웹소켓 초기화 시도...");

    const subscribeAll = () => {
      console.log("웹소켓 연결 성공: 모든 토픽 구독 시작");

      // 📍 [추가] 실시간 위치 정보 수신
      socket.subscribe("/topic/location/1/2", (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log("실시간 위치 수신:", data);
          // 서버에서 { "floor": 2 } 와 같은 형태로 온다고 가정
          if (data.floor) {
            setCurrentFloor(data.floor);
          }
        } catch (e) {
          console.error("위치 데이터 파싱 오류:", e);
        }
      });

      // 📍 위치 이탈 알림
      socket.subscribe("/topic/leave/1/2", (message) => {
        try {
          console.log("이탈 감지 수신");
          triggerAlert("leave");
        } catch (e) { console.error(e); }
      });

      // 🛡️ 착용 해제 알림
      socket.subscribe("/topic/wearing/1/2", (message) => {
        try {
          const data = JSON.parse(message.body);
          if (data.wearing === false) triggerAlert("wearing");
        } catch (e) { console.error(e); }
      });

      // 🚨 SOS 알림
      socket.subscribe("/topic/sos/1/2", (message) => {
        try {
          const data = JSON.parse(message.body);
          triggerAlert("sos", data.sosId);
        } catch (e) { console.error(e); }
      });
    };

    if (socket.connected) {
      subscribeAll();
    } else {
      socket.onConnect = subscribeAll;
    }

    socket.activate();
    return () => socket.deactivate();
  }, []);

  // 2. 알림음 설정 및 제어
  useEffect(() => {
    audioRef.current = new Audio("/alram.mp3");
    audioRef.current.loop = true;
    return () => { audioRef.current?.pause(); };
  }, []);

  useEffect(() => {
    if (alertOpen) {
      audioRef.current?.play().catch(() => {});
    } else {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
    }
  }, [alertOpen]);

  // 3. 알림 확인 처리
  const handleAlertConfirm = async () => {
    try {
      if (alertType === "sos" && currentSosId) {
        await fetch(`${API_URL}/sos/confirm/${currentSosId}`, { method: "POST" });
      }
      setAlertOpen(false);
      setStatus("safe");
    } catch (error) {
      setAlertOpen(false);
      setStatus("safe");
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#F8F9FA]">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0052CC] text-white px-4 py-4 flex justify-center items-center relative">
          <h1 className="text-[clamp(1.2rem,4vw,1.8rem)] font-bold">MBS</h1>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div onClick={() => navigate("/alerts")} className="relative bg-[#FF4D4D] rounded-full p-2 cursor-pointer">
              <Bell size={18} fill="white" stroke="white" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-white text-red-500 text-[10px] px-1 rounded-full font-bold">
                  {alertCount}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-3 sm:p-4 space-y-4">
          {/* 상태 표시 섹션 */}
          <section className={`rounded-xl border shadow-sm transition-all duration-500 ${status === "alert" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-100"}`}>
            <div className="py-4 flex justify-center items-center gap-3">
              <span className={`relative inline-flex rounded-full h-3 w-3 ${status === "alert" ? "bg-red-500" : "bg-[#00B341]"}`}>
                {status === "alert" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
              </span>
              <span className={`text-[clamp(1.1rem,4.5vw,1.4rem)] font-extrabold ${status === "alert" ? "text-red-600" : "text-[#00B341]"}`}>
                {status === "alert" ? "위험" : "안전"}
              </span>
            </div>
          </section>

          {/* 현재 위치 섹션 - currentFloor 상태 반영 */}
          <section className="bg-white rounded-xl p-4 border border-[#E9ECEF] shadow-sm">
            <h2 className="text-[#495057] font-bold text-sm">현재 위치</h2>
            <div className="flex justify-center py-3">
              <span className="font-extrabold text-[#1A3A6B] text-[clamp(2rem,8vw,3rem)]">{currentFloor}층</span>
            </div>
          </section>

          {/* 구조도 섹션 - currentFloor 상태 반영 */}
          <section className="bg-white rounded-xl p-4 border border-[#E9ECEF] shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[#343A40] font-bold text-sm">IT관 내부 구조도</h2>
              <div className="bg-[#0062FF] text-white text-[clamp(0.6rem,2.5vw,0.75rem)] px-3 py-1 rounded-full">
                현재 층 : {currentFloor}층
              </div>
            </div>
            <div className="relative w-full aspect-[2/1] flex items-center justify-center">
              <img src={oneFloor} alt="IT관 구조도" className="w-full h-full object-contain" />
              <div className="absolute bottom-[2%] left-[50%] -translate-x-1/2 flex flex-col items-center">
                <MapPin size={24} className="text-[#0062FF] fill-[#0062FF]" />
                <div className="bg-[#0062FF] text-white text-[clamp(0.5rem,2vw,0.7rem)] px-2 py-[2px] rounded mt-1">현재 위치</div>
              </div>
            </div>
          </section>

          {/* RSSI 신호 섹션 (생략 가능) */}
          <section className="bg-white rounded-xl p-4 border border-[#E9ECEF] shadow-sm">
            <div className="flex items-center text-[#0062FF] font-bold mb-3">
              <Wifi size={18} className="mr-2" />
              <span className="text-[clamp(0.9rem,3vw,1.1rem)]">RSSI 신호</span>
            </div>
            {/* ... AP 리스트 ... */}
          </section>
        </main>
      </div>

      {/* 경보 모달 */}
      {alertOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className={`bg-white rounded-2xl w-[80%] max-w-xs p-6 text-center border shadow-xl ${
            alertType === "leave" ? "border-orange-300" : alertType === "wearing" ? "border-purple-300" : "border-red-300"
          }`}>
            <div className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${
              alertType === "leave" ? "bg-orange-100" : alertType === "wearing" ? "bg-purple-100" : "bg-red-100"
            }`}>
              {alertType === "leave" ? <MapPin size={28} className="text-orange-500" /> : 
               alertType === "wearing" ? <ShieldAlert size={28} className="text-purple-500" /> : 
               <Bell size={28} className="text-red-500" />}
            </div>
            <p className={`font-bold text-lg mb-2 ${
              alertType === "leave" ? "text-orange-500" : alertType === "wearing" ? "text-purple-500" : "text-red-500"
            }`}>
              {alertType === "leave" ? "위치 이탈 감지" : alertType === "wearing" ? "착용 해제 감지" : "SOS 신호 발생"}
            </p>
            <button onClick={handleAlertConfirm} className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all">
              알림 닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;