import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Wifi, MapPin, LogOut, Plus, Pencil, Trash2, Upload, X, Check } from "lucide-react";
import socket from "./socket/socket";
import "./tailwind.css";

const API_URL = import.meta.env.VITE_API_URL;

const ALERT_LABELS = {
  SOS: { label: "SOS", color: "bg-red-100 text-red-600 border-red-200" },
  LEAVE: { label: "위치 이탈", color: "bg-orange-100 text-orange-600 border-orange-200" },
  WEARING: { label: "착용 해제", color: "bg-purple-100 text-purple-600 border-purple-200" },
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
  const [activeTab, setActiveTab] = useState("alerts");
  const [placeId, setPlaceId] = useState(null);

  // 알림 탭
  const [alertHistory, setAlertHistory] = useState([]);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [alertLoading, setAlertLoading] = useState(false);

  // AP 탭
  const [apList, setApList] = useState([]);
  const [apLoading, setApLoading] = useState(false);
  const [showApForm, setShowApForm] = useState(false);
  const [editingApId, setEditingApId] = useState(null);
  const [apForm, setApForm] = useState({ ssid: "", xCoordinate: "", yCoordinate: "", floor: 1 });

  // 지도 탭
  const [mapUrl, setMapUrl] = useState(null);
  const [mapTimestamp, setMapTimestamp] = useState(Date.now());
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // ─── 인증 체크 ───────────────────────────────────────
  useEffect(() => {
    const isAdmin = localStorage.getItem("isAdmin");
    if (!isAdmin) { navigate("/admin"); return; }

    const ids = JSON.parse(localStorage.getItem("managedPlaceIds") || "[]");
    const pid = ids[0] ?? 1;
    setPlaceId(pid);
  }, []);

  // ─── WebSocket 구독 ──────────────────────────────────
  useEffect(() => {
    if (!placeId) return;

    const subscribe = () => {
      socket.subscribe(`/topic/admin/${placeId}`, (msg) => {
        try {
          const data = JSON.parse(msg.body);
          setLiveAlerts((prev) => [data, ...prev].slice(0, 50));
        } catch (e) { console.error(e); }
      });
    };

    if (socket.connected) {
      subscribe();
    } else {
      socket.onConnect = subscribe;
      socket.activate();
    }

    return () => socket.deactivate();
  }, [placeId]);

  // ─── 알림 이력 불러오기 ──────────────────────────────
  const fetchAlerts = async () => {
    if (!placeId) return;
    setAlertLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/alerts/${placeId}`);
      const data = await res.json();
      setAlertHistory(data);
    } catch (e) { console.error(e); }
    finally { setAlertLoading(false); }
  };

  // ─── AP 목록 불러오기 ────────────────────────────────
  const fetchAps = async () => {
    if (!placeId) return;
    setApLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/ap/${placeId}`);
      const data = await res.json();
      setApList(data);
    } catch (e) { console.error(e); }
    finally { setApLoading(false); }
  };

  // ─── 탭 변경 시 데이터 로드 ─────────────────────────
  useEffect(() => {
    if (!placeId) return;
    if (activeTab === "alerts") fetchAlerts();
    if (activeTab === "ap" || activeTab === "map") fetchAps();
    if (activeTab === "map") setMapUrl(`${API_URL}/admin/map/${placeId}?t=${mapTimestamp}`);
  }, [activeTab, placeId]);

  // ─── SOS 확인 처리 ──────────────────────────────────
  const confirmSos = async (alertId) => {
    try {
      await fetch(`${API_URL}/sos/confirm/${alertId}`, { method: "POST" });
      setAlertHistory((prev) =>
        prev.map((a) => a.alertId === alertId ? { ...a, isConfirmed: true, confirmedAt: new Date().toISOString() } : a)
      );
      setLiveAlerts((prev) =>
        prev.map((a) => a.alertId === alertId ? { ...a, confirmed: true } : a)
      );
    } catch (e) { console.error(e); }
  };

  // ─── AP CRUD ─────────────────────────────────────────
  const openCreateForm = () => {
    setEditingApId(null);
    setApForm({ ssid: "", xCoordinate: "", yCoordinate: "", floor: 1 });
    setShowApForm(true);
  };

  const openEditForm = (ap) => {
    setEditingApId(ap.id);
    setApForm({ ssid: ap.ssid, xCoordinate: ap.xCoordinate, yCoordinate: ap.yCoordinate, floor: ap.floor });
    setShowApForm(true);
  };

  const saveAp = async () => {
    const body = { ...apForm, xCoordinate: parseFloat(apForm.xCoordinate), yCoordinate: parseFloat(apForm.yCoordinate), floor: parseInt(apForm.floor), placeId };
    try {
      if (editingApId) {
        await fetch(`${API_URL}/admin/ap/${editingApId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        await fetch(`${API_URL}/admin/ap`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      setShowApForm(false);
      fetchAps();
    } catch (e) { console.error(e); }
  };

  const deleteAp = async (apId) => {
    if (!window.confirm("AP를 삭제하시겠습니까?")) return;
    try {
      await fetch(`${API_URL}/admin/ap/${apId}`, { method: "DELETE" });
      fetchAps();
    } catch (e) { console.error(e); }
  };

  // ─── 지도 이미지 업로드 ──────────────────────────────
  const uploadMap = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await fetch(`${API_URL}/admin/map/${placeId}`, { method: "POST", body: formData });
      const ts = Date.now();
      setMapTimestamp(ts);
      setMapUrl(`${API_URL}/admin/map/${placeId}?t=${ts}`);
    } catch (e) { console.error(e); }
    finally { setUploading(false); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // ─── 렌더 ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="w-full max-w-md mx-auto flex flex-col min-h-screen">

        {/* 헤더 */}
        <header className="sticky top-0 z-50 bg-[#0052CC] text-white px-4 py-4 flex justify-between items-center">
          <h1 className="font-bold text-lg">MBS 관리자</h1>
          <button onClick={handleLogout} className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-lg text-sm active:scale-95">
            <LogOut size={14} /> 로그아웃
          </button>
        </header>

        {/* 탭 */}
        <div className="flex bg-white border-b border-gray-200 sticky top-[56px] z-40">
          {[
            { key: "alerts", label: "알림", icon: <Bell size={14} /> },
            { key: "ap", label: "AP 편집", icon: <Wifi size={14} /> },
            { key: "map", label: "지도 편집", icon: <MapPin size={14} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key ? "border-[#0052CC] text-[#0052CC]" : "border-transparent text-gray-400"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ───────── 알림 탭 ───────── */}
        {activeTab === "alerts" && (
          <div className="flex-1 p-3 space-y-3">

            {/* 실시간 알림 */}
            {liveAlerts.length > 0 && (
              <section className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                <h2 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  실시간 알림
                </h2>
                <div className="space-y-2">
                  {liveAlerts.map((a, i) => {
                    const style = ALERT_LABELS[a.type] ?? { label: a.type, color: "bg-gray-100 text-gray-600" };
                    return (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${style.color}`}>
                        <div>
                          <span className="font-bold text-sm">{style.label}</span>
                          <p className="text-xs mt-0.5">모듈 {a.moduleNum} · {formatTime(a.occurredAt)}</p>
                        </div>
                        {a.type === "SOS" && !a.confirmed && (
                          <button onClick={() => confirmSos(a.alertId)} className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg active:scale-95">확인</button>
                        )}
                        {a.type === "SOS" && a.confirmed && (
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Check size={12} /> 처리됨</span>
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
                <h2 className="font-bold text-sm text-gray-700">알림 이력</h2>
                <button onClick={fetchAlerts} className="text-xs text-[#0052CC]">새로고침</button>
              </div>

              {alertLoading ? (
                <p className="text-center text-sm text-gray-400 py-4">불러오는 중...</p>
              ) : alertHistory.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">알림 이력이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {alertHistory.map((a, i) => {
                    const style = ALERT_LABELS[a.type] ?? { label: a.type, color: "bg-gray-100 text-gray-600" };
                    return (
                      <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${style.color}`}>
                        <div>
                          <span className="font-bold text-sm">{style.label}</span>
                          <p className="text-xs mt-0.5">모듈 {a.moduleNum} · {formatTime(a.occurredAt)}</p>
                          {a.type === "SOS" && a.isConfirmed && (
                            <p className="text-xs text-gray-400 mt-0.5">확인됨 · {formatTime(a.confirmedAt)}</p>
                          )}
                        </div>
                        {a.type === "SOS" && !a.isConfirmed && (
                          <button onClick={() => confirmSos(a.alertId)} className="bg-red-500 text-white text-xs px-3 py-1 rounded-lg active:scale-95">확인</button>
                        )}
                        {a.type === "SOS" && a.isConfirmed && (
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Check size={12} /> 처리됨</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ───────── AP 편집 탭 ───────── */}
        {activeTab === "ap" && (
          <div className="flex-1 p-3 space-y-3">
            <section className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-gray-700">AP 목록</h2>
                <button onClick={openCreateForm} className="flex items-center gap-1 bg-[#0052CC] text-white text-xs px-3 py-1.5 rounded-lg active:scale-95">
                  <Plus size={12} /> AP 추가
                </button>
              </div>

              {apLoading ? (
                <p className="text-center text-sm text-gray-400 py-4">불러오는 중...</p>
              ) : apList.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">등록된 AP가 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {apList.map((ap) => (
                    <div key={ap.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <div>
                        <p className="font-bold text-sm">{ap.ssid}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          X: {ap.xCoordinate} · Y: {ap.yCoordinate} · {ap.floor}층
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openEditForm(ap)} className="p-2 rounded-lg bg-blue-50 text-blue-500 active:scale-95">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteAp(ap.id)} className="p-2 rounded-lg bg-red-50 text-red-500 active:scale-95">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ───────── 지도 편집 탭 ───────── */}
        {activeTab === "map" && (
          <div className="flex-1 p-3 space-y-3">

            {/* 지도 이미지 업로드 */}
            <section className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-sm text-gray-700">지도 이미지</h2>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 bg-[#0052CC] text-white text-xs px-3 py-1.5 rounded-lg active:scale-95"
                  disabled={uploading}
                >
                  <Upload size={12} /> {uploading ? "업로드 중..." : "이미지 변경"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => uploadMap(e.target.files[0])} />
              </div>

              {/* 지도 + AP 마커 */}
              <div className="relative w-full border rounded-lg overflow-hidden bg-gray-100">
                {mapUrl ? (
                  <img
                    src={mapUrl}
                    alt="지도"
                    className="w-full"
                    onError={() => setMapUrl(null)}
                  />
                ) : (
                  <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                    등록된 지도가 없습니다
                  </div>
                )}

                {/* AP 마커 오버레이 */}
                {mapUrl && apList.map((ap) => {
                  const maxCoord = 10;
                  const left = (ap.xCoordinate / maxCoord * 100).toFixed(1) + "%";
                  const top = ((maxCoord - ap.yCoordinate) / maxCoord * 100).toFixed(1) + "%";
                  return (
                    <div
                      key={ap.id}
                      style={{ left, top }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    >
                      <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow" />
                      <span className="text-[10px] font-bold text-blue-700 bg-white/80 px-1 rounded mt-0.5 leading-tight">{ap.ssid}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

      </div>

      {/* ───────── AP 편집 모달 ───────── */}
      {showApForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base">{editingApId ? "AP 수정" : "AP 추가"}</h3>
              <button onClick={() => setShowApForm(false)} className="text-gray-400 active:scale-95"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              {[
                { label: "SSID", key: "ssid", type: "text", placeholder: "예: AP1" },
                { label: "X 좌표 (m)", key: "xCoordinate", type: "number", placeholder: "0 ~ 10" },
                { label: "Y 좌표 (m)", key: "yCoordinate", type: "number", placeholder: "0 ~ 10" },
                { label: "층", key: "floor", type: "number", placeholder: "1" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs text-gray-500 mb-1 block">{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={apForm[key]}
                    onChange={(e) => setApForm((prev) => ({ ...prev, [key]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0052CC]"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={saveAp}
              className="mt-5 w-full bg-[#0052CC] text-white py-3 rounded-xl font-bold active:scale-95"
            >
              {editingApId ? "수정 완료" : "추가"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
