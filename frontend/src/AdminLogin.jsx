import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "./tailwind.css";

const AdminLogin = () => {
  const navigate = useNavigate();

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const handleLogin = () => {
    // 🔥 임시 로그인 조건
    if (id === "admin" && pw === "1234") {
      localStorage.setItem("isAdmin", "true"); // 로그인 상태 저장
      navigate("/admin/dashboard");
    } else {
      alert("아이디 또는 비밀번호가 틀렸습니다.");
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
