import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Users, LogOut, Check, Trash2, RefreshCw } from "lucide-react";
import socket from "./socket/socket";
import "./tailwind.css";

const API_URL = import.meta.env.VITE_API_URL;

const ALERT_LABELS = {
  SOS:        { label: "SOS",      color: "bg-red-100 text-red-600 border-red-200" },
  LEAVE:      { label: "위치 이탈", color: "bg-orange-100 text-orange-600 border-orange-200" },
  WEARING:    { label: "착용 해제", color: "bg-purple-100 text-purple-600 border-purple-200" },
  DISCONNECT: { label: "연결 종료", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

function formatTime(isoStr) {
  if (!isoStr) return "";
  const diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
  if (diff < 10) return "방금 전";
  if (diff < 60) return `${diff}초 전`;
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  return new Date(isoStr).toLocaleString("ko-KR");
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("modules");
  const [placeId, setPlaceId] = useState(null);

  // 모듈 현황 탭
  const [registeredModules, setRegisteredModules] = useState([]); // DB에 등록된 모듈 [{id, moduleNum}]
  const [moduleStatus, setModuleStatus] = useState({});
  // { [moduleNum]: { wearing: bool, disconnected: bool, lastAlert: string } }

  // 알림 로그 탭
  const [alertHistory, setAlertHistory] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [alertLoading, setAlertLoading] = useState(false);
  const [selectedModule, setSelectedModule] = useState("all");
  const [deletingModule, setDeletingModule] = useState(null);

  const subsRef = useRef([]);

  // ─── 인증 체크 ─────────────────────────────────────
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) { navigate("/admin"); return; }
    const ids = JSON.parse(localStorage.getItem("managedPlaceIds") || "[]");
    setPlaceId(ids[0] ?? 1);
  }, []);

  // ─── WebSocket 구독 ────────────────────────────────
  useEffect(() => {
    if (!placeId) return;

    const subscribe = () => {
      // 관리자 알림 토픽
      const adminSub = socket.subscribe(`/topic/admin/${placeId}`, (msg) => {
        try {
          const data = JSON.parse(msg.body);
          setLiveAlerts((prev) => [{ ...data, _id: Date.now() }, ...prev].slice(0, 100));

          // 모듈 상태 업데이트
          setModuleStatus((prev) => {
            const key = String(data.moduleNum);
            const cur = prev[key] || {};
            return {
              ...prev,
              [key]: {
                ...cur,
                disconnected: data.type === "DISCONNECT" ? true : cur.disconnected,
                lastAlert: data.type,
                lastAlertAt: data.occurredAt,
              },
            };
          });
        } catch (e) { console.error(e); }
      });
      subsRef.current.push(adminSub);
    };

    if (socket.connected) {
      subscribe();
    } else {
      socket.onConnect = subscribe;
      socket.activate();
    }

    return () => {
      subsRef.current.forEach((s) => { try { s.unsubscribe(); } catch (_) {} });
      subsRef.current = [];
    };
  }, [placeId]);

  // ─── 착용 상태 구독 (알림 이력 로드 후 모듈별) ───────
  const subscribeWearing = (moduleNums) => {
    if (!placeId) return;
    moduleNums.forEach((num) => {
      const sub = socket.subscribe(`/topic/wearing/${placeId}/${num}`, (msg) => {
        try {
          const data = JSON.parse(msg.body);
          setModuleStatus((prev) => ({
            ...prev,
            [String(num)]: {
              ...(prev[String(num)] || {}),
              wearing: data.wearing ?? data.isWearing,
              disconnected: false,
            },
          }));
        } catch (e) { console.error(e); }
      });
      subsRef.current.push(sub);
    });
  };

  // ─── 등록된 모듈 목록 불러오기 ───────────────────────
  const fetchModules = async (pid) => {
    try {
      const res = await fetch(`${API_URL}/admin/modules/${pid}`);
      if (!res.ok) return;
      const data = await res.json();
      setRegisteredModules(data);
      const nums = data.map((m) => m.moduleNum);
      subscribeWearing(nums);
      setModuleStatus((prev) => {
        const next = { ...prev };
        nums.forEach((n) => { if (!next[String(n)]) next[String(n)] = {}; });
        return next;
      });
    } catch (e) { console.error(e); }
  };

  // ─── 알림 이력 불러오기 ────────────────────────────
  const fetchAlerts = async () => {
    if (!placeId) return;
    setAlertLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/alerts/${placeId}`);
      const data = await res.json();
      setAlertHistory(data);

      // 이력에서 고유 모듈 번호 추출 → 착용 토픽 구독
      const nums = [...new Set(data.map((a) => a.moduleNum))];
      subscribeWearing(nums);

      // 모듈 상태 초기화
      setModuleStatus((prev) => {
        const next = { ...prev };
        nums.forEach((n) => { if (!next[String(n)]) next[String(n)] = {}; });
        return next;
      });
    } catch (e) { console.error(e); }
    finally { setAlertLoading(false); }
  };

  // ─── 초기 데이터 로드 ─────────────────────────────
  useEffect(() => {
    if (!placeId) return;
    fetchModules(placeId);
    fetchAlerts();
  }, [placeId]);

  // ─── SOS 확인 처리 ────────────────────────────────
  const confirmSos = async (alertId) => {
    try {
      await fetch(`${API_URL}/sos/confirm/${alertId}`, { method: "POST" });
      setAlertHistory((prev) =>
        prev.map((a) => a.alertId === alertId
          ? { ...a, isConfirmed: true, confirmedAt: new Date().toISOString() }
          : a)
      );
      setLiveAlerts((prev) =>
        prev.map((a) => a.alertId === alertId ? { ...a, confirmed: true } : a)
      );
    } catch (e) { console.error(e); }
  };

  // ─── 모듈 로그 삭제 ───────────────────────────────
  const deleteModuleLogs = async (moduleNum) => {
    if (!window.confirm(`모듈 ${moduleNum}의 로그를 전부 삭제하시겠습니까?`)) return;
    setDeletingModule(moduleNum);
    try {
      await fetch(`${API_URL}/admin/logs/module/${moduleNum}/${placeId}`, { method: "DELETE" });
      setAlertHistory((prev) => prev.filter((a) => a.moduleNum !== moduleNum));
      setLiveAlerts((prev) => prev.filter((a) => a.moduleNum !== moduleNum));
    } catch (e) { console.error(e); }
    finally { setDeletingModule(null); }
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  // 모듈 목록 (DB 등록 모듈 기본 + 실시간으로 새로 발견된 모듈 추가)
  const knownModules = [...new Set([
    ...registeredModules.map((m) => m.moduleNum),
    ...alertHistory.map((a) => a.moduleNum),
    ...liveAlerts.map((a) => a.moduleNum),
  ])].sort((a, b) => a - b);

  // 선택된 모듈로 필터링된 이력
  const filteredHistory = selectedModule === "all"
    ? alertHistory
    : alertHistory.filter((a) => String(a.moduleNum) === selectedModule);

  const filteredLive = selectedModule === "all"
    ? liveAlerts
    : liveAlerts.filter((a) => String(a.moduleNum) === selectedModule);

  // ─── 렌더 ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="w-full max-w-md mx-auto flex flex-col min-h-screen">

        {/* 헤더 */}
        <header className="sticky top-0 z-50 bg-[#0052CC] text-white px-4 py-4 flex justify-between items-center">
          <h1 className="font-bold text-lg">MBS 관리자</h1>
          <button onClick={handleLogout}
            className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg text-sm active:scale-95">
            <LogOut size={14} /> 로그아웃
          </button>
        </header>

        {/* 탭 */}
        <div className="flex bg-white border-b border-gray-200 sticky top-[56px] z-40">
          {[
            { key: "modules", label: "모듈 현황", icon: <Users size={14} /> },
            { key: "alerts",  label: "알림 로그", icon: <Bell size={14} /> },
          ].map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#0052CC] text-[#0052CC]"
                  : "border-transparent text-gray-400"
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ───────── 모듈 현황 탭 ───────── */}
        {activeTab === "modules" && (
          <div className="flex-1 p-3 space-y-3">
            <section className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-gray-700">모듈 목록</h2>
                <button onClick={fetchAlerts}
                  className="flex items-center gap-1 text-xs text-[#0052CC]">
                  <RefreshCw size={12} /> 새로고침
                </button>
              </div>

              {knownModules.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">
                  아직 연결된 모듈이 없습니다.
                </p>
              ) : (
                <div className="space-y-2">
                  {knownModules.map((num) => {
                    const st = moduleStatus[String(num)] || {};
                    const lastLabel = st.lastAlert ? ALERT_LABELS[st.lastAlert] : null;

                    return (
                      <div key={num}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                        <div className="flex items-center gap-3">
                          {/* 착용/미착용/종료 상태 점 */}
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            st.disconnected
                              ? "bg-gray-400"
                              : st.wearing
                                ? "bg-green-400 animate-pulse"
                                : "bg-yellow-400"
                          }`} />
                          <div>
                            <p className="font-bold text-sm">모듈 {num}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {st.disconnected
                                ? "연결 종료"
                                : st.wearing === true
                                  ? "착용 중"
                                  : st.wearing === false
                                    ? "미착용"
                                    : "대기 중"}
                              {st.lastAlertAt && ` · ${formatTime(st.lastAlertAt)}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* 마지막 알림 뱃지 */}
                          {lastLabel && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${lastLabel.color}`}>
                              {lastLabel.label}
                            </span>
                          )}
                          {/* 로그 삭제 버튼 */}
                          <button
                            onClick={() => deleteModuleLogs(num)}
                            disabled={deletingModule === num}
                            className="flex items-center gap-1 bg-red-50 text-red-400 text-xs px-2 py-1 rounded-lg active:scale-95 disabled:opacity-50">
                            <Trash2 size={11} />
                            {deletingModule === num ? "삭제 중" : "로그삭제"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ───────── 알림 로그 탭 ───────── */}
        {activeTab === "alerts" && (
          <div className="flex-1 p-3 space-y-3">

            {/* 모듈 필터 */}
            {knownModules.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedModule("all")}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                    selectedModule === "all"
                      ? "bg-[#0052CC] text-white border-[#0052CC]"
                      : "bg-white text-gray-500 border-gray-200"
                  }`}>
                  전체
                </button>
                {knownModules.map((num) => (
                  <button key={num}
                    onClick={() => setSelectedModule(String(num))}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      selectedModule === String(num)
                        ? "bg-[#0052CC] text-white border-[#0052CC]"
                        : "bg-white text-gray-500 border-gray-200"
                    }`}>
                    모듈 {num}
                  </button>
                ))}
              </div>
            )}

            {/* 실시간 알림 */}
            {filteredLive.length > 0 && (
              <section className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <h2 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  실시간 알림
                </h2>
                <div className="space-y-2">
                  {filteredLive.map((a) => {
                    const style = ALERT_LABELS[a.type] ?? { label: a.type, color: "bg-gray-100 text-gray-600 border-gray-200" };
                    return (
                      <div key={a._id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${style.color}`}>
                        <div>
                          <span className="font-bold text-sm">{style.label}</span>
                          <p className="text-xs mt-0.5">모듈 {a.moduleNum} · {formatTime(a.occurredAt)}</p>
                        </div>
                        {a.type === "SOS" && !a.confirmed && (
                          <button onClick={() => confirmSos(a.alertId)}
                            className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg active:scale-95">
                            확인
                          </button>
                        )}
                        {a.type === "SOS" && a.confirmed && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Check size={12} /> 처리됨
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 알림 이력 */}
            <section className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-gray-700">
                  알림 이력
                  {selectedModule !== "all" && (
                    <span className="ml-2 text-[#0052CC]">모듈 {selectedModule}</span>
                  )}
                </h2>
                <button onClick={fetchAlerts} className="text-xs text-[#0052CC] flex items-center gap-1">
                  <RefreshCw size={12} /> 새로고침
                </button>
              </div>

              {alertLoading ? (
                <p className="text-center text-sm text-gray-400 py-4">불러오는 중...</p>
              ) : filteredHistory.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">알림 이력이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {filteredHistory.map((a, i) => {
                    const style = ALERT_LABELS[a.type] ?? { label: a.type, color: "bg-gray-100 text-gray-600 border-gray-200" };
                    return (
                      <div key={i}
                        className={`flex items-center justify-between p-3 rounded-lg border ${style.color}`}>
                        <div>
                          <span className="font-bold text-sm">{style.label}</span>
                          <p className="text-xs mt-0.5">모듈 {a.moduleNum} · {formatTime(a.occurredAt)}</p>
                          {a.type === "SOS" && a.isConfirmed && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              확인됨 · {formatTime(a.confirmedAt)}
                            </p>
                          )}
                        </div>
                        {a.type === "SOS" && !a.isConfirmed && (
                          <button onClick={() => confirmSos(a.alertId)}
                            className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg active:scale-95">
                            확인
                          </button>
                        )}
                        {a.type === "SOS" && a.isConfirmed && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Check size={12} /> 처리됨
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
