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

  // 📍 실시간 위치 상태 추가 (기본값 1층)
  const [currentFloor, setCurrentFloor] = useState(1);

  const floorImages = {
    1: oneFloor,
    2: twoFloor,
    3: threeFloor,
  };

  const [markerPosition, setMarkerPosition] = useState({
    x: 50, // 📍 퍼센트 기준 가위 중앙
    y: 60, // 📍 퍼센트 기준 세로 중앙
    radius: 0,
    isInitial: true, // 📍 초기 상태 플래그
  });

  const [lastUpdated, setLastUpdated] = useState("");

  // 📍 좌표 -> 퍼센트 변환 함수
  const convertToPercent = (x, y) => {
    const percentX = 12 + (x / 60) * 76;
    const adjustedY = y > 10 ? 10 + (y - 10) * 0.5 : y; 
    const percentY = 78 - (adjustedY / 10) * 36;
    return { x: percentX, y: percentY };
  };

  const { alerts, addAlert } = useAlert();

  const audioRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const WS_URL = import.meta.env.VITE_WS_URL;

  const { placeId, moduleNum } = useParams();

  useEffect(() => {
    socket.onConnect = () => {
      console.log("웹소켓 연결 성공");

      console.log(placeId + " " + moduleNum);

      // 📍 [추가] 실시간 위치 정보 수신
      socket.subscribe(`/topic/location/${placeId}/${moduleNum}`, (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log("실시간 위치 수신:", data);

          if (data.floor) {
            setCurrentFloor(data.floor);
          }

          if (data.x !== undefined && data.y !== undefined) {
            const pos = convertToPercent(data.x, data.y);
            console.log("보정 퍼센트 좌표:", pos);

            setMarkerPosition({
              ...pos,
              radius: data.radius || 0,
              isInitial: false, // 📍 데이터 수신 시 플래그 해제
            });
          }

          setLastUpdated(new Date());
        } catch (e) {
          console.error("위치 데이터 파싱 오류:", e);
        }
      });

      // 📍 위치 이탈 알림
      socket.subscribe(`/topic/leave/${placeId}/${moduleNum}`, (message) => {
        console.log("웹소켓 이탈 알림:", message.body);

        addAlert({
          type: "leave",
          message: "위치 이탈",
        });

        setAlertOpen(true);
        setStatus("alert");
        setAlertType("leave");

        setAlertCount((prev) => prev + 1);
      });

      // 🛡️ 착용 해제 알림
      socket.subscribe(`/topic/wearing/${placeId}/${moduleNum}`, (message) => {
        const data = JSON.parse(message.body);

        console.log("착용 상태:", data);

        // 미착용 상태일 때만
        if (!data.wearing) {
          addAlert({
            type: "wearing",
            message: "장치 탈거 감지",
          });

          setAlertOpen(true);
          setStatus("alert");
          setAlertType("wearing");

          setAlertCount((prev) => prev + 1);
        }
      });

      // 🚨 SOS 알림
      socket.subscribe(`/topic/sos/${placeId}/${moduleNum}`, (message) => {
        const data = JSON.parse(message.body);

        console.log("SOS 수신:", data);

        // 서버가 보낸 sosId 저장
        setCurrentSosId(data.sosId);

        addAlert({
          type: "sos",
          message: "SOS 신호",
        });

        setAlertOpen(true);
        setStatus("alert");
        setAlertType("sos");

        setAlertCount((prev) => prev + 1);
      });
    };

    socket.onStompError = (frame) => {
      console.error("STOMP 에러:", frame);
    };

    socket.onWebSocketError = (error) => {
      console.error("WebSocket 에러:", error);
    };

    socket.activate();

    return () => {
      socket.deactivate();
    };
  }, []);
  // 테스트 모드
  // "leave" | "wearing" | "sos"
  const TEST_MODE = "sos";

  /*useEffect(() => {
    const sendTestData = async () => {
      try {
        let testData = {};

        // 📍 위치 이탈 테스트
        if (TEST_MODE === "leave") {
          testData = {
            module_num: 2,
            place_id: 1,
            btn: 0,
            btn_press_3s: 0,
            light: 0,
            touch: 0,

            wifi: [
              {
                ssid: "AP1",
                rssi: -95,
              },
              {
                ssid: "AP2",
                rssi: -90,
              },
              {
                ssid: "AP3",
                rssi: -92,
              },
            ],
          };
        }

        // 🛡️ 착용 해제 테스트
        if (TEST_MODE === "wearing") {
          testData = {
            module_num: 2,
            place_id: 1,
            btn: 0,
            btn_press_3s: 0,
            light: 300,
            touch: 0,

            wifi: [
              {
                ssid: "AP1",
                rssi: -40,
              },
              {
                ssid: "AP2",
                rssi: -45,
              },
              {
                ssid: "AP3",
                rssi: -50,
              },
            ],
          };
        }

        // 🚨 SOS 테스트
        if (TEST_MODE === "sos") {
          testData = {
            module_num: 2,
            place_id: 1,
            btn: 0,
            btn_press_3s: 1,
            light: 0,
            touch: 0,

            wifi: [
              {
                ssid: "AP1",
                rssi: -40,
              },
              {
                ssid: "AP2",
                rssi: -45,
              },
              {
                ssid: "AP3",
                rssi: -50,
              },
            ],
          };
        }

        const response = await fetch(`${API_URL}/data`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(testData),
        });

        console.log("테스트 데이터 전송");
        console.log("status =", response.status);

        const text = await response.text();
        console.log("response =", text);
      } catch (error) {
        console.error(error);
      }
    };

    // 처음 1회
    sendTestData();

    // 30초마다 반복
    const timer = setInterval(sendTestData, 10000);

    return () => clearInterval(timer);
  }, []);*/

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
                      // 가로 60유닛 = 76cqw 이므로, 반지름 1유닛당 약 2.533cqw 지름 확보
                      // 1~4는 정상 범위, 6은 경고 범위로 시각화
                      width: `${markerPosition.radius * 2.533}cqw`, 
                      height: `${markerPosition.radius * 2.533}cqw`,
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                )}

                <MapPin size={24} className="text-[#0062FF] fill-[#0062FF] relative z-20" />
                
                {/* 📍 정확한 중심점 (파란색 채워진 점) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#0062FF] rounded-full border border-white z-30 shadow-sm" />

                <div className="bg-[#0062FF] text-white text-[clamp(0.4rem,1.5vw,0.6rem)] px-1 py-[1px] rounded mt-1 whitespace-nowrap shadow-sm relative z-20">
                  {markerPosition.isInitial ? "위치 확인 중..." : "내 위치"}
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
                <MapPin size={28} className="text-orange-500" />
              ) : alertType === "wearing" ? (
                <ShieldAlert size={28} className="text-purple-500" />
              ) : (
                <Bell size={28} className="text-red-500" />
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
