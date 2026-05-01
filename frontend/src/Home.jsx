import { Bell, Menu } from "lucide-react";
import "./Home.css";

const Home = () => {
  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <Menu size={20} />
        <h1>MBS</h1>
        <Bell size={20} className="bell" />
      </div>

      <div className="content">
        {/* 상태 */}
        <div className="status">
          <div className="dot"></div>
          <span>안전</span>
        </div>

        {/* 업데이트 */}
        <div className="update">⏱ 마지막 업데이트 : 10초전</div>

        {/* 현재 위치 */}
        <div className="card center">
          <p className="label">현재 위치</p>
          <p className="floor">2층</p>
        </div>

        {/* RSSI */}
        <div className="card">
          <p className="label">📶 RSSI 신호</p>

          {[
            { name: "AP1", value: -55, color: "green" },
            { name: "AP2", value: -70, color: "yellow" },
            { name: "AP3", value: -65, color: "green" },
          ].map((ap) => (
            <div key={ap.name} className="rssi-row">
              <span className="ap-name">{ap.name}</span>

              <div className="bar-bg">
                <div
                  className={`bar ${ap.color}`}
                  style={{ width: `${Math.abs(ap.value) * 1.2}%` }}
                ></div>
              </div>

              <span className="dbm">{ap.value} dBm</span>
            </div>
          ))}
        </div>

        {/* 층 표시 */}
        <div className="card floor-map">
          <span className="floor-text">3층</span>

          <div className="line"></div>

          <div className="current-floor">
            <div className="circle"></div>
            <span className="badge">2층</span>
          </div>

          <div className="line"></div>

          <span className="floor-text">1층</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
