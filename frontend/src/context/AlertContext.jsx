import { createContext, useContext, useState } from "react";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  // 🔔 알림 목록
  const [alerts, setAlerts] = useState([]);

  // 🕒 마지막 업데이트 시간
  const [lastUpdated, setLastUpdated] = useState(null);

  // 📍 현재 마커 위치
  const [markerPosition, setMarkerPosition] = useState({
    x: 195,
    y: 160,
  });

  // 🏢 현재 층
  const [currentFloor, setCurrentFloor] = useState(1);

  // 🔔 알림 추가
  const addAlert = (alert) => {
    setAlerts((prev) => [
      {
        id: Date.now(),
        createdAt: new Date(),
        ...alert,
      },
      ...prev,
    ]);
  };

  return (
    <AlertContext.Provider
      value={{
        // 🔔 alerts
        alerts,
        addAlert,

        // 🕒 update time
        lastUpdated,
        setLastUpdated,

        // 📍 marker
        markerPosition,
        setMarkerPosition,

        // 🏢 floor
        currentFloor,
        setCurrentFloor,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
