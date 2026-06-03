//2026-05-14 이성진
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Bell, Clock, Wifi, MapPin, ShieldAlert } from "lucide-react";
import { useAlert } from "./context/AlertContext";

import oneFloor from "./image/oneFloor.png";
import twoFloor from "./image/twoFloor.png";
import threeFloor from "./image/threeFloor.png";

import "./tailwind.css";
import socket from "../src/socket/socket";

const Home = () => {
  const navigate = useNavigate();

  const [alertOpen, setAlertOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [status, setStatus] = useState("safe");
  const [alertType, setAlertType] = useState("");
  const [currentSosId, setCurrentSosId] = useState(null);

  const floorImages = {
    1: oneFloor,
    2: twoFloor,
    3: threeFloor,
  };

  // 📍 좌표 -> 퍼센트 변환 함수
  const convertToPercent = (x, y) => {
    const percentX = 12 + (x / 60) * 76;
    const adjustedY = y > 10 ? 10 + (y - 10) * 0.5 : y;
    const percentY = 78 - (adjustedY / 10) * 36;
    return { x: percentX, y: percentY };
  };
  const {
    alerts,
    addAlert,
    lastUpdated,
    setLastUpdated,
    currentFloor,
    setCurrentFloor,
    markerPosition,
    setMarkerPosition,

    // 📶 RSSI
    rssiData,
    setRssiData,
  } = useAlert();

  const audioRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const WS_URL = import.meta.env.VITE_WS_URL;

  const { placeId, moduleNum } = useParams();

  useEffect(() => {
    let locationSub;
    let leaveSub;
    let wearingSub;
    let sosSub;
    let rssiSub;

    // 이미 연결되어 있으면 중복 연결 방지
    if (socket.active) {
      console.log("이미 웹소켓 연결됨");
      return;
    }

    socket.onConnect = () => {
      console.log("웹소켓 연결 성공");

      console.log(placeId + " " + moduleNum);

      // 📍 실시간 위치 정보
      locationSub = socket.subscribe(
        `/topic/location/${placeId}/${moduleNum}`,
        (message) => {
          try {
            const data = JSON.parse(message.body);

            console.log("실시간 위치 수신:", data);

            if (data.floor) {
              setCurrentFloor(data.floor);
            }

            if (data.x !== undefined && data.y !== undefined) {
              const pos = convertToPercent(data.x, data.y);

              //console.log("보정 퍼센트 좌표:", pos);

              setMarkerPosition({
                ...pos,
                radius: data.radius || 0,
                isInitial: false,
              });
            }

            setLastUpdated(new Date());
          } catch (e) {
            console.error("위치 데이터 파싱 오류:", e);
          }
        },
      );

      // 📍 위치 이탈
      leaveSub = socket.subscribe(
        `/topic/leave/${placeId}/${moduleNum}`,
        (message) => {
          console.log("웹소켓 이탈 알림:", message.body);

          addAlert({
            type: "leave",
            message: "위치 이탈",
          });

          setAlertOpen(true);
          setStatus("alert");
          setAlertType("leave");

          setAlertCount((prev) => prev + 1);

          setLastUpdated(new Date());
        },
      );

      // 🛡️ 착용 해제
      wearingSub = socket.subscribe(
        `/topic/wearing/${placeId}/${moduleNum}`,
        (message) => {
          const data = JSON.parse(message.body);

          console.log("착용 상태:", data);

          if (!data.wearing) {
            addAlert({
              type: "wearing",
              message: "장치 탈거 감지",
            });

            setAlertOpen(true);
            setStatus("alert");
            setAlertType("wearing");

            setAlertCount((prev) => prev + 1);

            setLastUpdated(new Date());
          }
        },
      );

      // 🚨 SOS
      sosSub = socket.subscribe(
        `/topic/sos/${placeId}/${moduleNum}`,
        (message) => {
          const data = JSON.parse(message.body);

          console.log("SOS 수신:", data);

          setCurrentSosId(data.sosId);

          addAlert({
            type: "sos",
            message: "SOS 신호",
          });

          setAlertOpen(true);
          setStatus("alert");
          setAlertType("sos");

          setAlertCount((prev) => prev + 1);

          setLastUpdated(new Date());
        },
      );

      // 📶 RSSI 실시간 수신
      rssiSub = socket.subscribe(
        `/topic/rssi/${placeId}/${moduleNum}`,
        (message) => {
          try {
            const data = JSON.parse(message.body);

            console.log("RSSI 수신:", data);

            const converted = [...data]
              .sort((a, b) => (b.rssi ?? -100) - (a.rssi ?? -100))
              .map((ap) => ({
                id: ap.ssid ?? "Unknown",
                value: `${ap.rssi ?? 0} dBm`,

                // 📶 신호 세기 바
                bars:
                  ap.rssi >= -50
                    ? 4
                    : ap.rssi >= -60
                      ? 3
                      : ap.rssi >= -70
                        ? 2
                        : 1,

                // 🎨 색상
                color:
                  ap.rssi >= -60
                    ? "bg-[#00B341]"
                    : ap.rssi >= -75
                      ? "bg-[#FF9500]"
                      : "bg-[#FF4D4D]",
              }));

            setRssiData(converted);
          } catch (e) {
            console.error("RSSI 파싱 오류:", e);
          }
        },
      );
    };

    // STOMP 에러
    socket.onStompError = (frame) => {
      console.error("STOMP 에러:", frame);
    };

    // 웹소켓 에러
    socket.onWebSocketError = (error) => {
      console.error("WebSocket 에러:", error);
    };

    // 연결 종료 로그
    socket.onWebSocketClose = () => {
      console.log("웹소켓 연결 종료");
    };

    console.log("웹소켓 activate");

    socket.activate();

    return () => {
      console.log("웹소켓 cleanup");

      locationSub?.unsubscribe();
      leaveSub?.unsubscribe();
      wearingSub?.unsubscribe();
      sosSub?.unsubscribe();
      rssiSub?.unsubscribe();

      if (socket.active) {
        socket.deactivate();
      }
    };
  }, []);

  // 🔊 오디오 준비
  useEffect(() => {
    audioRef.current = new Audio("/alram.mp3");
    audioRef.current.loop = true;

    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  useEffect(() => {
    if (alertOpen) {
      // 🔊 알림음 재생
      audioRef.current?.play().catch(() => {});
    } else {
      // 🔇 알림 종료
      audioRef.current?.pause();
      audioRef.current.currentTime = 0;
    }
  }, [alertOpen]);

  const handleAlertConfirm = async () => {
    try {
      // 🚨 SOS 확인 API 호출
      if (alertType === "sos" && currentSosId) {
        await fetch(`${API_URL}/sos/confirm/${currentSosId}`, {
          method: "POST",
        });

        console.log("SOS 확인 완료");
      }

      audioRef.current?.pause();
      audioRef.current.currentTime = 0;

      setAlertOpen(false);
      setStatus("safe");
    } catch (error) {
      console.error("SOS 확인 실패:", error);
    }
  };

  const getRelativeTime = () => {
    if (!lastUpdated) return "수신 대기중";

    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);

    if (diff < 10) return "방금 전";
    if (diff < 60) return `${diff}초 전`;

    const minutes = Math.floor(diff / 60);

    if (minutes < 60) return `${minutes}분 전`;

    const hours = Math.floor(minutes / 60);

    return `${hours}시간 전`;
  };
  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#F8F9FA]">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[#0052CC] text-white px-4 py-4 flex justify-center items-center relative">
          <h1 className="text-[clamp(1.2rem,4vw,1.8rem)] font-bold">MBS</h1>
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div
              onClick={() => navigate("/alerts")}
              className="relative bg-[#FF4D4D] rounded-full p-2 cursor-pointer"
            >
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
          <section
            className={`rounded-xl border shadow-sm transition-all duration-500 ${status === "alert" ? "bg-red-50 border-red-200" : "bg-green-50 border-green-100"}`}
          >
            <div className="py-4 flex justify-center items-center gap-3">
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${status === "alert" ? "bg-red-500" : "bg-[#00B341]"}`}
              >
                {status === "alert" && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                )}
              </span>
              <span
                className={`text-[clamp(1.1rem,4.5vw,1.4rem)] font-extrabold ${status === "alert" ? "text-red-600" : "text-[#00B341]"}`}
              >
                {status === "alert" ? "위험" : "안전"}
              </span>
            </div>
          </section>

          <div className="py-1 flex justify-center items-center text-[clamp(0.75rem,3vw,0.9rem)] text-[#868E96]">
            <Clock size={16} className="mr-1" />
            마지막 업데이트 : {getRelativeTime()}
          </div>

          {/* 현재 위치 섹션 - currentFloor 상태 반영 */}
          <section className="bg-white rounded-xl p-4 border border-[#E9ECEF] shadow-sm">
            <h2 className="text-[#495057] font-bold text-sm">현재 위치</h2>
            <div className="flex justify-center py-3">
              <span className="font-extrabold text-[#1A3A6B] text-[clamp(2rem,8vw,3rem)]">
                {currentFloor}층
              </span>
            </div>
          </section>

          {/* 구조도 섹션 - currentFloor 상태 반영 */}
          <section className="bg-white rounded-xl p-4 border border-[#E9ECEF] shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-[#343A40] font-bold text-sm">
                IT관 내부 구조도
              </h2>
              <div className="bg-[#0062FF] text-white text-[clamp(0.6rem,2.5vw,0.75rem)] px-3 py-1 rounded-full">
                현재 층 : {currentFloor}층
              </div>
            </div>
            <div className="relative w-full aspect-[2/1] flex items-center justify-center bg-white overflow-hidden [container-type:inline-size]">
              <img
                src={floorImages[currentFloor] || oneFloor}
                alt={`${currentFloor}층 구조도`}
                className="w-full h-full object-contain"
              />

              {/* 📍 사용자 현재 위치 및 반경 표시 */}
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-500 z-10"
                style={{
                  left: `${markerPosition.x}%`,
                  top: `${markerPosition.y}%`,
                  width: "1px",
                  height: "1px",
                }}
              >
                {/* 📍 반경 표시 (반투명 원) - 1~6 수치에 맞게 스케일 조정 */}
                {!markerPosition.isInitial && markerPosition.radius > 0 && (
                  <div
                    className={`absolute border-2 rounded-full animate-pulse pointer-events-none ${
                      markerPosition.radius >= 6
                        ? "bg-red-400/20 border-red-500/40" // 범위 초과(6)일 때 빨간색 계열
                        : "bg-blue-400/25 border-blue-500/40" // 일반 범위(1-4)일 때 파란색 계열
                    }`}
                    style={{
                      // 반지름 1단위당 크기를 기존 2.533에서 3.0으로 약간 키움
                      width: `${markerPosition.radius * 4.5}cqw`,
                      height: `${markerPosition.radius * 4.5}cqw`,
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}

                <MapPin
                  size={24}
                  className="text-[#0062FF] fill-[#0062FF] relative z-20"
                />

                {/* 📍 정확한 중심점 (파란색 채워진 ///////점) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#0062FF] rounded-full border border-white z-30 shadow-sm" />

                <div className="bg-[#0062FF] text-white text-[clamp(0.4rem,1.5vw,0.6rem)] px-1 py-[1px] rounded mt-1 whitespace-nowrap shadow-sm relative z-20">
                  {markerPosition.isInitial ? "위치 확인 중..." : "내 위치"}
                </div>
              </div>
            </div>
          </section>

          {/* 📶 RSSI */}
          <section className="bg-white rounded-xl p-4 border border-[#E9ECEF] shadow-sm">
            <div className="flex items-center text-[#0062FF] font-bold mb-3">
              <Wifi size={18} className="mr-2" />

              <span className="text-[clamp(0.9rem,3vw,1.1rem)]">RSSI 신호</span>
            </div>

            <div className="space-y-3">
              {rssiData.length === 0 ? (
                <div className="text-center text-[#868E96] text-sm py-4">
                  RSSI 데이터 수신 대기중...
                </div>
              ) : (
                rssiData.map((ap, index) => (
                  <div
                    key={ap.id}
                    className={`flex items-center justify-between ${
                      index !== 0 ? "pt-3 border-t border-[#F1F3F5]" : ""
                    }`}
                  >
                    {/* AP 이름 */}
                    <span className="text-[clamp(0.75rem,3vw,0.9rem)] font-semibold text-[#495057]">
                      {ap.id}
                    </span>

                    {/* 신호 바 */}
                    <div className="flex items-end gap-[2px] h-5">
                      {[1, 2, 3, 4].map((bar) => (
                        <div
                          key={bar}
                          className={`w-[3px] rounded-sm ${
                            bar <= ap.bars ? ap.color : "bg-[#E9ECEF]"
                          }`}
                          style={{
                            height: `${bar * 25}%`,
                          }}
                        />
                      ))}
                    </div>

                    {/* RSSI 값 */}
                    <span className="text-[clamp(0.75rem,3vw,0.9rem)] w-20 text-right text-[#495057]">
                      {ap.value}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </main>
      </div>

      {/* 경보 모달 */}
      {alertOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div
            className={`bg-white rounded-2xl w-[80%] max-w-xs p-6 text-center border shadow-xl ${
              alertType === "leave"
                ? "border-orange-300"
                : alertType === "wearing"
                  ? "border-purple-300"
                  : "border-red-300"
            }`}
          >
            <div
              className={`w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center ${
                alertType === "leave"
                  ? "bg-orange-100"
                  : alertType === "wearing"
                    ? "bg-purple-100"
                    : "bg-red-100"
              }`}
            >
              {alertType === "leave" ? (
                <MapPin
                  size={28}
                  className="text-orange-500 animate-location"
                />
              ) : alertType === "wearing" ? (
                <ShieldAlert
                  size={28}
                  className="text-purple-500 animate-wearing"
                />
              ) : (
                <Bell size={28} className="text-red-500 animate-bell" />
              )}
            </div>
            <p
              className={`font-bold text-lg mb-2 ${
                alertType === "leave"
                  ? "text-orange-500"
                  : alertType === "wearing"
                    ? "text-purple-500"
                    : "text-red-500"
              }`}
            >
              {alertType === "leave"
                ? "위치 이탈 감지"
                : alertType === "wearing"
                  ? "착용 해제 감지"
                  : "SOS 신호 발생"}
            </p>
            <button
              onClick={handleAlertConfirm}
              className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold active:scale-95 transition-all"
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
