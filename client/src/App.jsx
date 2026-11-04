import { useEffect, useState } from "react";
import axios from "axios";
import {
  Activity, Wifi, BatteryFull, Thermometer, Flame,
  Radio, ShieldAlert, ShieldCheck, AlertTriangle,
  MapPin, Gauge, Camera, Clock, Navigation,
  RefreshCw, Zap, Menu
} from "lucide-react";

import {
  ResponsiveContainer, LineChart, Line, XAxis,
  YAxis, CartesianGrid, Tooltip, Area, AreaChart,
  ReferenceLine
} from "recharts";

import "./App.css";

const API_URL = "http://localhost:5000";

const initialGas = 312;
const initialTemp = 41.5;

function App() {
  const [gas, setGas] = useState(initialGas);
  const [temperature, setTemperature] = useState(initialTemp);
  const [flame, setFlame] = useState(false);
  const [motion, setMotion] = useState(true);
  const [battery, setBattery] = useState(78);
  const [rssi, setRssi] = useState(-72);
  const [time, setTime] = useState(new Date());

  const [backendStatus, setBackendStatus] = useState("Checking...");

  const [gasData, setGasData] = useState([]);
  const [tempData, setTempData] = useState([]);

  const [alerts, setAlerts] = useState([
    { time: "12:04:18", type: "WARNING", message: "Gas level above 250 ppm (312 ppm)" },
    { time: "12:03:52", type: "WARNING", message: "Temperature above 40°C (41.5°C)" },
    { time: "12:02:10", type: "INFO", message: "PIR motion detected - possible survival indicator" },
    { time: "12:00:45", type: "INFO", message: "LoRa link established with receiver" },
    { time: "11:59:30", type: "SAFE", message: "Rover started - all readings normal" },
  ]);

  const [distance, setDistance] = useState(46);
  const [packets, setPackets] = useState(1284);

  // BACKEND API CONNECTION
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/health`);

        if (response.data.success) {
          setBackendStatus("Connected");
          console.log("Backend Connected:", response.data);
        }
      } catch (error) {
        setBackendStatus("Disconnected");
        console.error("Backend Connection Failed:", error.message);
      }
    };

    checkBackend();

    const interval = setInterval(checkBackend, 10000);

    return () => clearInterval(interval);
  }, []);

  // DEMO SENSOR DATA
  useEffect(() => {
    setGasData(
      Array.from({ length: 30 }, (_, i) => ({
        time: `${i - 30}s`,
        value: Math.round(180 + Math.random() * 130),
      }))
    );

    setTempData(
      Array.from({ length: 30 }, (_, i) => ({
        time: `${i - 30}s`,
        value: Number((30 + i * 0.38 + Math.random() * 2).toFixed(1)),
      }))
    );

    const interval = setInterval(() => {
      setTime(new Date());

      setGas((prev) => {
        const next = Math.max(100, Math.min(500, prev + (Math.random() - 0.4) * 8));

        setGasData((old) => [
          ...old.slice(1),
          { time: new Date().toLocaleTimeString(), value: Math.round(next) },
        ]);

        return Math.round(next);
      });

      setTemperature((prev) => {
        const next = Math.max(25, Math.min(60, prev + (Math.random() - 0.5) * 0.4));

        setTempData((old) => [
          ...old.slice(1),
          { time: new Date().toLocaleTimeString(), value: Number(next.toFixed(1)) },
        ]);

        return Number(next.toFixed(1));
      });

      setPackets((prev) => prev + 1);
      setDistance((prev) => prev + (Math.random() > 0.7 ? 1 : 0));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const hazard =
    gas >= 400 || temperature >= 50 || flame
      ? "CRITICAL"
      : gas >= 250 || temperature >= 40
      ? "WARNING"
      : "SAFE";

  const currentTime = time.toLocaleTimeString("en-GB");

  const statusClass = hazard.toLowerCase();

  return (
    <div className="dashboard">

      {/* HEADER */}
      <header className="topbar">
        <div className="brand">
          <span className="brand-name">RoverSafe</span>
          <span className="brand-divider">|</span>
          <span className="brand-subtitle">Live Monitoring Dashboard</span>
        </div>

        <div className="top-status">
          <span className="connection">
            <span className="online-dot"></span>
            LoRa: Connected
          </span>

          <span
            style={{
              color: backendStatus === "Connected" ? "#20a36b" : "#e69a19",
              fontWeight: 600
            }}
          >
            Server: {backendStatus}
          </span>

          <span>RSSI: {rssi} dBm</span>

          <span><BatteryFull size={17} /> Battery: {battery}%</span>

          <span className="clock"><Clock size={16} /> {currentTime}</span>
        </div>
      </header>

      <main className="main-content">

        {/* SENSOR CARDS */}
        <section className="sensor-grid">

          <div className={`sensor-card hazard-card ${statusClass}`}>
            <div className="card-label">HAZARD LEVEL</div>
            <h1>{hazard}</h1>

            <p>
              {hazard === "SAFE"
                ? "Environment within safe limits"
                : hazard === "WARNING"
                ? "Gas and temperature above limit"
                : "Dangerous conditions detected"}
            </p>

            <ShieldAlert className="hazard-icon" size={27} />
          </div>

          <SensorCard
            title="GAS (MQ-135)"
            value={gas}
            unit="ppm"
            status={gas >= 400 ? "CRITICAL" : gas >= 250 ? "WARNING" : "SAFE"}
            limit="Limit: 250"
            icon={<Activity />}
          />

          <SensorCard
            title="TEMPERATURE (DHT22)"
            value={temperature}
            unit="°C"
            status={temperature >= 50 ? "CRITICAL" : temperature >= 40 ? "WARNING" : "SAFE"}
            limit="Limit: 40"
            icon={<Thermometer />}
          />

          <SensorCard
            title="FLAME SENSOR"
            value={flame ? "Detected" : "None"}
            unit=""
            status={flame ? "CRITICAL" : "SAFE"}
            limit={flame ? "Fire detected" : "No flame detected"}
            icon={<Flame />}
          />

          <SensorCard
            title="MOTION (PIR)"
            value={motion ? "Detected" : "None"}
            unit=""
            status={motion ? "CHECK" : "SAFE"}
            limit={motion ? "Possible survival sign" : "No movement"}
            icon={<Activity />}
          />

        </section>

        {/* CHARTS AND CAMERA */}
        <section className="monitor-grid">

          <div className="panel chart-panel">
            <div className="panel-heading">
              <h3>Gas Level Trend</h3>
              <span>Last 60 seconds</span>
            </div>

            <ResponsiveContainer width="100%" height={245}>
              <AreaChart data={gasData}>
                <defs>
                  <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e66b48" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#e66b48" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e9eaf0" />
                <XAxis dataKey="time" tick={false} />
                <YAxis domain={[0, 500]} />
                <Tooltip />
                <ReferenceLine y={250} stroke="#e44d4d" strokeDasharray="5 5" />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#e66b48"
                  strokeWidth={2.5}
                  fill="url(#gasGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="chart-limit">Warning limit: 250 ppm</div>
          </div>

          <div className="panel chart-panel">
            <div className="panel-heading">
              <h3>Temperature Trend</h3>
              <span>Last 60 seconds</span>
            </div>

            <ResponsiveContainer width="100%" height={245}>
              <AreaChart data={tempData}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#315e9e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#315e9e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#e9eaf0" />
                <XAxis dataKey="time" tick={false} />
                <YAxis domain={[20, 60]} />
                <Tooltip />
                <ReferenceLine y={40} stroke="#e44d4d" strokeDasharray="5 5" />

                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#315e9e"
                  strokeWidth={2.5}
                  fill="url(#tempGradient)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>

            <div className="chart-limit">Warning limit: 40°C</div>
          </div>

          {/* CAMERA */}
          <div className="panel camera-panel">
            <div className="panel-heading camera-heading">
              <h3><Camera size={18} /> ESP32-CAM Live Feed</h3>
              <span className="live-indicator">LIVE ●</span>
            </div>

            <div className="camera-screen">
              <Camera size={48} />
              <h3>CAMERA FEED</h3>
              <p>Rover view inside affected zone</p>
              <span>Waiting for ESP32-CAM connection</span>
            </div>

            <div className="camera-footer">
              Resolution: 640×480 | Latency: Awaiting connection
            </div>
          </div>

        </section>

        {/* ALERTS AND ROVER STATUS */}
        <section className="bottom-grid">

          <div className="panel alert-panel">
            <div className="panel-heading">
              <h3>Alert Log</h3>
              <span>Recent events</span>
            </div>

            <div className="alert-list">
              {alerts.map((alert, index) => (
                <div className="alert-row" key={index}>
                  <span className="alert-time">{alert.time}</span>

                  <span className={`alert-badge ${alert.type.toLowerCase()}`}>
                    {alert.type}
                  </span>

                  <span className="alert-message">{alert.message}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rover-panel">
            <div className="panel-heading">
              <h3>Rover Status</h3>
              <Navigation size={19} />
            </div>

            <div className="rover-details">
              <StatusRow label="Mode" value="Manual control" />
              <StatusRow label="Distance travelled" value={`${distance} m`} />
              <StatusRow label="LoRa packets received" value={packets.toLocaleString()} />
              <StatusRow label="Last update" value={currentTime} />
              <StatusRow label="Connection" value={backendStatus} />
            </div>

            <div className="battery-section">
              <span>Battery</span>

              <div className="battery-track">
                <div style={{ width: `${battery}%` }}></div>
              </div>

              <strong>{battery}%</strong>
            </div>
          </div>

        </section>

        <footer className="footer">
          <span>ROVERSAFE © 2026 | Disaster Assessment System</span>

          <span>
            <span className="online-dot"></span>
            System Monitoring Active
          </span>
        </footer>

      </main>
    </div>
  );
}

function SensorCard({ title, value, unit, status, limit, icon }) {
  return (
    <div className="sensor-card">
      <div className="sensor-title">
        <span>{title}</span>
        {icon}
      </div>

      <div className="sensor-value">
        {value}
        <small>{unit}</small>
      </div>

      <div className="sensor-bottom">
        <span className={`status-badge ${status.toLowerCase()}`}>
          {status}
        </span>

        <span className="limit-text">{limit}</span>
      </div>
    </div>
  );
}

function StatusRow({ label, value }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;