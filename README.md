# FleetPulse | Real-Time Cyber-Logistics Fleet Management

FleetPulse is a production-ready, real-time logistics fleet monitoring dashboard. It tracks active vehicles, dispatches, alerts, and predicts delivery exceptions using a simulated Kafka-style telemetry loop.

---

## 📡 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Zustand, Recharts, React Leaflet (mapping).
- **Backend**: FastAPI (Python), WebSockets, SQLAlchemy, SQLite (local fallback) / PostgreSQL (production).
- **Simulator**: Independent telemetry broker simulating GPS, fuel consumption, speed warning loops.
- **Environment**: Docker, Docker Compose.

---

## 🏗️ Architecture

```
                                +-------------------+
                                | Vehicle Simulator |
                                +---------+---------+
                                          |
                                          | (HTTP POST Telemetry Updates)
                                          v
+------------------+             +--------+---------+
|                  | <WebSocket> |                  | <-----> +----------------+
|  React Frontend  +-------------+  FastAPI Backend  |         |  PostgreSQL /  |
|  (Command HUD)   |  (Live WS)  | (Telemetry Rules)| <-----> | SQLite Database|
|                  |             +------------------+         +----------------+
+------------------+
```

1. **Telemetry Feed**: The independent vehicle simulator generates coordinate movements and telemetry metrics, posting updates to the backend every 3 seconds.
2. **Alert Engine**: FastAPI consumes telemetry and applies rule checks (Speeding >95 km/h, Fuel <15%, Offline timeouts). Triggers database records and fires WebSocket events.
3. **Command UI**: Connected browsers establish a WebSocket channel to receive live positions and warning banners instantly.

---

## 🚀 Quick Start (Docker Compose)

The easiest way to run the entire stack (Database, FastAPI, React Frontend, and Simulator) is using Docker Compose:

```bash
# Clone the project and navigate to the directory
cd fleetpulse

# Boot the services
docker-compose up --build
```

- **Frontend**: `http://localhost`
- **Backend API Docs**: `http://localhost:8000/docs`
- **WebSocket Stream**: `ws://localhost:8000/ws/fleet`
- **Demo Operator Credentials**: 
  - **Email**: `admin@fleetpulse.com`
  - **Password**: `admin123`

---

## 🛠️ Local Development (Without Docker)

### 1. Backend Server Setup
Ensure Python 3.10+ is installed:

```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

# Start FastAPI (automatically seeds SQLite db)
uvicorn app.main:app --reload --port 8000
```

### 2. Run Telemetry Simulator
With the backend running, start the simulator in a separate terminal:

```bash
cd backend
# Make sure your virtual env is active
python app/simulator.py
```

### 3. Frontend App Setup
Ensure Node.js 18+ is installed:

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 💡 Production Scaling Recommendations

1. **Simulated Kafka-style Streaming**:
   - Currently, the backend processes updates synchronously. In production, telemetry updates should publish to an **Apache Kafka** or **AWS Kinesis** topic. A dedicated event consumer worker (running Faust or Celery) would process events asynchronously, saving telemetry logs and checking alert boundaries.
2. **Pub/Sub Broker**:
   - Swap the in-memory WebSocket `ConnectionManager` with a distributed **Redis Pub/Sub** broker. This allows the backend to scale horizontally across multiple instances behind a load balancer without dropping client socket notifications.
3. **Database Partitioning**:
   - Telemetry log history grows rapidly. Table partitioning (e.g. TimescaleDB or PostgreSQL range partition by timestamp) should be implemented on the `telemetry_history` table to maintain sub-millisecond query performance.
4. **Machine Learning Model integration**:
   - Under AI Insights, replace the current simulation rules with an endpoint referencing a deployed **PyTorch LSTM** model that outputs arrival predictions using historical route transit times, actual live traffic data, and driver safety behaviors.
