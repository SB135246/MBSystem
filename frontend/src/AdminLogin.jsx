import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "./tailwind.css";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const API_URL = import.meta.env.VITE_API_URL;

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_URL}/manager/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          loginId: id,
          loginPw: pw,
        }),
      });

      // 로그인 실패
      if (!response.ok) {
        alert("아이디 또는 비밀번호가 틀렸습니다.");
        return;
      }

      // 로그인 성공 데이터
      const data = await response.json();

      console.log("로그인 성공:", data);

      // localStorage 저장
      localStorage.setItem("isAdmin", "true");

      localStorage.setItem("managerId", data.managerId);

      localStorage.setItem("managerName", data.name);

      localStorage.setItem(
        "managedPlaceIds",
        JSON.stringify(data.managedPlaceIds),
      );

      // 관리자 페이지 이동
      navigate("/admin/dashboard");
    } catch (error) {
      console.error("로그인 오류:", error);

      alert("서버 연결 실패");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0052CC]">
      {/* 뒤로가기 버튼 */}
      <div className="absolute top-5 left-5">
        <button
          onClick={() => navigate("/")}
          className="text-white bg-white/20 p-2 rounded-full active:scale-95"
        >
          <ArrowLeft size={20} />
        </button>
      </div>
      <div className="bg-white p-8 rounded-2xl shadow-xl w-80 text-center">
        <h2 className="text-xl font-bold mb-4">관리자 로그인</h2>

        <input
          type="text"
          placeholder="아이디"
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          type="password"
          placeholder="비밀번호"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className="w-full border p-2 mb-4 rounded"
        />

        <button
          onClick={handleLogin}
          className="w-full bg-[#0052CC] text-white py-2 rounded font-bold"
        >
          로그인
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
