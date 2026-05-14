import { createContext, useContext, useState } from "react";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (alert) => {
    setAlerts((prev) => [
      {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        ...alert,
      },
      ...prev,
    ]);
  };

  return (
    <AlertContext.Provider
      value={{
        alerts,
        addAlert,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
