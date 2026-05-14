import { Bell, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const StartPage = () => {
  const navigate = useNavigate();

  const [adminClickCount, setAdminClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleAdminAccess = () => {
    const now = Date.now();

    if (now - lastClickTime > 2000) {
      setAdminClickCount(1);
    } else {
      setAdminClickCount((prev) => prev + 1);
    }

    setLastClickTime(now);

    if (adminClickCount + 1 >= 5) {
      navigate("/admin");
      setAdminClickCount(0);
    }
  };

  const startSystem = async () => {
    try {
      // 🔥 오디오 unlock (핵심)
      const audio = new Audio("/alram.mp3");

      await audio.play(); // 👉 사용자 인터랙션에서 실행되어야 함
      audio.pause();
      audio.currentTime = 0;

      // 🔥 약간의 딜레이 후 이동
      setTimeout(() => {
        navigate("/main/1/2");
      }, 100);
    } catch (e) {
      console.log("unlock 실패", e);
      navigate("/main/1/2");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0052CC] p-6 text-center">
      <div
        onClick={handleAdminAccess}
        className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse cursor-pointer"
      >
        <Bell size={40} className="text-white" />
      </div>

      <h1 className="text-white text-2xl font-bold mb-2">MBS 시스템</h1>

      <p className="text-white/80 mb-8 text-sm">
        경보 알림 소리를 위해 <br />
        시스템 시작 버튼을 눌러주세요.
      </p>

      <button
        onClick={startSystem}
        className="flex items-center gap-2 bg-white text-[#0052CC] px-8 py-4 rounded-2xl font-bold"
      >
        <Play size={20} fill="#0052CC" />
        시스템 시작하기
      </button>
    </div>
  );
};

export default StartPage;
