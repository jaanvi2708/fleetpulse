// Client-side Mock API Interceptor for standalone/hosted demos.
// Only activates when running on a hosted environment (e.g., GitHub Pages, Vercel)
// or when the backend server is unreachable.

import { useFleetStore } from './store/fleetStore';

const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// Seed Data
const MOCK_USERS_DB = [
  { email: 'admin@fleetpulse.com', full_name: 'Fleet Operations Command', role: 'admin' },
  { email: 'driver1@fleetpulse.com', full_name: 'Driver 1', role: 'driver' },
  { email: 'driver2@fleetpulse.com', full_name: 'Driver 2', role: 'driver' },
  { email: 'driver3@fleetpulse.com', full_name: 'Driver 3', role: 'driver' },
  { email: 'driver4@fleetpulse.com', full_name: 'Driver 4', role: 'driver' },
  { email: 'driver5@fleetpulse.com', full_name: 'Driver 5', role: 'driver' },
  { email: 'user1@fleetpulse.com', full_name: 'User One', role: 'user', vehicle_ids: [1] },
  { email: 'user2@fleetpulse.com', full_name: 'User Two', role: 'user', vehicle_ids: [2] },
  { email: 'user3@fleetpulse.com', full_name: 'User Three', role: 'user', vehicle_ids: [3] },
  { email: 'user4@fleetpulse.com', full_name: 'User Four', role: 'user', vehicle_ids: [5] }
];

let loggedInUser = MOCK_USERS_DB[0];

const ROUTES: Record<string, [number, number][]> = {
  "FP-101": [
    [28.6139, 77.2090], [28.4595, 77.0266], [26.9124, 75.7873],
    [26.4499, 74.6399], [25.3484, 74.6433], [24.5854, 73.7125]
  ],
  "FP-202": [
    [12.9716, 77.5946], [12.7409, 77.8253], [12.5186, 78.2138],
    [12.7904, 78.7166], [12.9165, 79.1325], [12.8342, 79.7036],
    [13.0827, 80.2707]
  ],
  "FP-303": [
    [22.5726, 88.3639], [22.3302, 87.3237], [21.4934, 86.9337],
    [21.0574, 86.4958], [20.4625, 85.8830], [20.2961, 85.8245]
  ],
  "FP-404": [
    [17.3850, 78.4867], [16.7388, 77.9862], [15.8281, 78.0373],
    [14.6819, 77.6006], [12.9716, 77.5946]
  ],
  "FP-505": [
    [19.0760, 72.8777], [19.2183, 72.9781], [20.3717, 72.9082],
    [21.1702, 72.8311], [22.3072, 73.1812], [23.0225, 72.5714]
  ]
};

let vehicles = [
  { id: 1, vehicle_number: "FP-101", driver_name: "Driver 1", status: "Moving", speed: 72.5, fuel_level: 84.2, latitude: 28.6139, longitude: 77.2090, waypoint_idx: 0, last_updated: new Date().toISOString() },
  { id: 2, vehicle_number: "FP-202", driver_name: "Driver 2", status: "Idle", speed: 0.0, fuel_level: 48.9, latitude: 12.9716, longitude: 77.5946, waypoint_idx: 0, last_updated: new Date().toISOString() },
  { id: 3, vehicle_number: "FP-303", driver_name: "Driver 3", status: "Moving", speed: 62.0, fuel_level: 12.8, latitude: 22.5726, longitude: 88.3639, waypoint_idx: 0, last_updated: new Date().toISOString() },
  { id: 4, vehicle_number: "FP-404", driver_name: "Driver 4", status: "Offline", speed: 0.0, fuel_level: 92.0, latitude: 17.3850, longitude: 78.4867, waypoint_idx: 0, last_updated: new Date().toISOString() },
  { id: 5, vehicle_number: "FP-505", driver_name: "Driver 5", status: "Moving", speed: 98.6, fuel_level: 67.5, latitude: 19.0760, longitude: 72.8777, waypoint_idx: 0, last_updated: new Date().toISOString() }
];

let shipments = [
  { id: 1, shipment_number: "SH-5001", vehicle_id: 1, origin: "Delhi, DL", destination: "Udaipur, RJ", eta: "5h 15m", status: "In Transit", progress: 42.0, current_lat: 28.6139, current_lng: 77.2090 },
  { id: 2, shipment_number: "SH-5002", vehicle_id: 2, origin: "Bangalore, KA", destination: "Chennai, TN", eta: "Pending Dispatch", status: "Pending", progress: 0.0, current_lat: 12.9716, current_lng: 77.5946 },
  { id: 3, shipment_number: "SH-5003", vehicle_id: 3, origin: "Kolkata, WB", destination: "Bhubaneswar, OD", eta: "Delayed (+55m)", status: "Delayed", progress: 78.5, current_lat: 22.5726, current_lng: 88.3639 },
  { id: 4, shipment_number: "SH-5004", vehicle_id: 5, origin: "Mumbai, MH", destination: "Ahmedabad, GJ", eta: "4h 45m", status: "In Transit", progress: 32.0, current_lat: 19.0760, current_lng: 72.8777 }
];

let alerts = [
  { id: 1, vehicle_id: 3, alert_type: "Low Fuel", message: "Vehicle FP-303 fuel level is critically low: 12.8%.", severity: "Warning", timestamp: new Date(Date.now() - 15 * 60000).toISOString(), resolved: false, vehicle_number: "FP-303" },
  { id: 2, vehicle_id: 5, alert_type: "Speeding", message: "Vehicle FP-505 speed exceeds limit on NH-48: 98.6 km/h (limit 80 km/h).", severity: "Warning", timestamp: new Date(Date.now() - 5 * 60000).toISOString(), resolved: false, vehicle_number: "FP-505" },
  { id: 3, vehicle_id: 4, alert_type: "Offline", message: "Vehicle FP-404 connection lost. Fleet heartbeat offline >15 minutes.", severity: "Critical", timestamp: new Date(Date.now() - 25 * 60000).toISOString(), resolved: false, vehicle_number: "FP-404" }
];

// History tracking (simulated telemetry history)
const telemetryHistory: Record<number, any[]> = {};
vehicles.forEach(v => {
  telemetryHistory[v.id] = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    vehicle_id: v.id,
    latitude: v.latitude + (i * 0.01),
    longitude: v.longitude + (i * 0.01),
    speed: v.speed || 55,
    fuel_level: Math.max(5, v.fuel_level - i),
    timestamp: new Date(Date.now() - (i + 1) * 10 * 60000).toISOString()
  }));
});

// Setup simulator logic in-browser
const runClientSimulator = () => {
  setInterval(() => {
    vehicles = vehicles.map(v => {
      if (v.status === 'Offline') return v;
      if (v.status === 'Idle') {
        if (Math.random() > 0.95) {
          v.status = 'Moving';
          v.speed = parseFloat((50 + Math.random() * 40).toFixed(1));
        }
        return v;
      }

      // Moving vehicles simulation
      const route = ROUTES[v.vehicle_number];
      if (!route) return v;

      v.waypoint_idx = (v.waypoint_idx + 1) % route.length;
      const targetWaypoint = route[v.waypoint_idx];
      
      // Update coordinates
      v.latitude = targetWaypoint[0] + (Math.random() - 0.5) * 0.005;
      v.longitude = targetWaypoint[1] + (Math.random() - 0.5) * 0.005;
      
      // Update speed & fuel
      if (v.vehicle_number === 'FP-505') {
        v.speed = parseFloat((95 + Math.random() * 10).toFixed(1)); // Speeding
      } else {
        v.speed = parseFloat((55 + Math.random() * 25).toFixed(1));
      }
      v.fuel_level = parseFloat(Math.max(2, v.fuel_level - (v.speed / 100) * 0.15).toFixed(1));
      v.last_updated = new Date().toISOString();

      // Telemetry history update
      const history = telemetryHistory[v.id] || [];
      history.unshift({
        id: Date.now() + Math.random(),
        vehicle_id: v.id,
        latitude: v.latitude,
        longitude: v.longitude,
        speed: v.speed,
        fuel_level: v.fuel_level,
        timestamp: new Date().toISOString()
      });
      if (history.length > 30) history.pop();
      telemetryHistory[v.id] = history;

      // Update active shipments
      shipments = shipments.map(s => {
        if (s.vehicle_id === v.id && (s.status === 'In Transit' || s.status === 'Delayed')) {
          s.current_lat = v.latitude;
          s.current_lng = v.longitude;
          if (s.progress < 99) {
            s.progress = parseFloat((s.progress + 0.5).toFixed(2));
          } else {
            s.progress = 100;
            s.status = 'Delivered';
            s.eta = 'Delivered';
          }
        }
        return s;
      });

      // Business Rule alerts
      // 1. Speeding Alert
      if (v.speed > 95 && !alerts.some(a => a.vehicle_id === v.id && a.alert_type === 'Speeding' && !a.resolved)) {
        const newAlert = {
          id: Date.now(),
          vehicle_id: v.id,
          vehicle_number: v.vehicle_number,
          alert_type: "Speeding",
          message: `Vehicle ${v.vehicle_number} exceeds safety speed limit: ${v.speed} km/h.`,
          severity: "Warning",
          timestamp: new Date().toISOString(),
          resolved: false
        };
        alerts.unshift(newAlert);
        
        // Broadcast alert directly to store if authenticated/initialized
        const state = useFleetStore.getState();
        if (state.isAuthenticated) {
          state.addAlert(newAlert);
        }
      }

      // 2. Low Fuel Alert
      if (v.fuel_level < 15 && !alerts.some(a => a.vehicle_id === v.id && a.alert_type === 'Low Fuel' && !a.resolved)) {
        const newAlert = {
          id: Date.now() + 1,
          vehicle_id: v.id,
          vehicle_number: v.vehicle_number,
          alert_type: "Low Fuel",
          message: `Vehicle ${v.vehicle_number} fuel is critically low: ${v.fuel_level}%.`,
          severity: "Warning",
          timestamp: new Date().toISOString(),
          resolved: false
        };
        alerts.unshift(newAlert);

        const state = useFleetStore.getState();
        if (state.isAuthenticated) {
          state.addAlert(newAlert);
        }
      }

      // Live update to Zustand store
      const state = useFleetStore.getState();
      if (state.isAuthenticated) {
        state.updateVehicle({
          id: v.id,
          status: v.status,
          speed: v.speed,
          fuel_level: v.fuel_level,
          latitude: v.latitude,
          longitude: v.longitude,
          last_updated: v.last_updated
        });
      }

      return v;
    });
  }, 4000);
};

// Enable mock server interceptor if not on localhost, or fallback if backend is down
const enableMockInterceptor = () => {
  console.log("Initializing client-side mock interceptor for FleetPulse");

  const originalFetch = window.fetch;
  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlStr = input.toString();

    // Only intercept endpoints targeting local port 8000
    if (urlStr.includes(':8000') || urlStr.includes('/api/')) {
      const path = urlStr.split('/api')[1] || '';
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));

      // POST /auth/login
      if (path.startsWith('/auth/login')) {
        const body = JSON.parse(init?.body as string || '{}');
        const userFound = MOCK_USERS_DB.find(u => u.email === body.email);
        if (userFound && body.password === 'admin123') {
          loggedInUser = userFound;
          return new Response(JSON.stringify({
            access_token: 'fake_jwt_token_for_demo_mode',
            token_type: 'bearer'
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
          return new Response(JSON.stringify({ detail: 'Incorrect email or password' }), { status: 401 });
        }
      }

      // GET /auth/me
      if (path.startsWith('/auth/me')) {
        return new Response(JSON.stringify(loggedInUser), { status: 200 });
      }

      // GET /dashboard/stats
      if (path.startsWith('/dashboard/stats')) {
        const activeCount = vehicles.filter(v => v.status === "Moving").length;
        const movingVehicles = vehicles.filter(v => v.status === "Moving");
        const avgSpeed = movingVehicles.length > 0
          ? movingVehicles.reduce((acc, v) => acc + v.speed, 0) / movingVehicles.length
          : 0;

        const onTime = shipments.filter(s => s.status !== "Delayed").length;
        const onTimePct = (onTime / shipments.length) * 100;
        const totalDist = movingVehicles.reduce((acc, v) => acc + v.speed * 2.4, 0) + 4120;
        const delayedCount = shipments.filter(s => s.status === 'Delayed').length;

        return new Response(JSON.stringify({
          active_vehicles: activeCount,
          on_time_percentage: parseFloat(onTimePct.toFixed(1)),
          average_speed: parseFloat(avgSpeed.toFixed(1)),
          total_distance_today: parseFloat(totalDist.toFixed(1)),
          delayed_shipments: delayedCount
        }), { status: 200 });
      }

      // GET /vehicles/{id} (details with alerts/history)
      const vehicleDetailMatch = path.match(/^\/vehicles\/(\d+)/);
      if (vehicleDetailMatch) {
        const id = parseInt(vehicleDetailMatch[1]);
        const vehicle = vehicles.find(v => v.id === id);
        if (!vehicle) return new Response(JSON.stringify({ detail: 'Vehicle not found' }), { status: 404 });
        
        return new Response(JSON.stringify({
          ...vehicle,
          alerts: alerts.filter(a => a.vehicle_id === id && !a.resolved),
          history: telemetryHistory[id] || []
        }), { status: 200 });
      }

      // GET /vehicles
      if (path.startsWith('/vehicles')) {
        return new Response(JSON.stringify(vehicles), { status: 200 });
      }

      // GET /shipments
      if (path.startsWith('/shipments')) {
        return new Response(JSON.stringify(shipments), { status: 200 });
      }

      // GET /alerts/{id}/resolve
      const alertResolveMatch = path.match(/^\/alerts\/(\d+)\/resolve/);
      if (alertResolveMatch) {
        const id = parseInt(alertResolveMatch[1]);
        alerts = alerts.map(a => a.id === id ? { ...a, resolved: true } : a);
        const resolvedAlert = alerts.find(a => a.id === id);
        return new Response(JSON.stringify(resolvedAlert), { status: 200 });
      }

      // GET /alerts
      if (path.startsWith('/alerts')) {
        return new Response(JSON.stringify(alerts), { status: 200 });
      }

      // GET /reports
      if (path.startsWith('/reports')) {
        let summaries = [
          { vehicle_id: 1, vehicle_number: "FP-101", driver_name: "Driver 1", status: "Moving", log_count: 450, avg_speed: 72.5, avg_fuel_level: 84.2, alerts_count: 0 },
          { vehicle_id: 2, vehicle_number: "FP-202", driver_name: "Driver 2", status: "Idle", log_count: 320, avg_speed: 0.0, avg_fuel_level: 48.9, alerts_count: 0 },
          { vehicle_id: 3, vehicle_number: "FP-303", driver_name: "Driver 3", status: "Moving", log_count: 280, avg_speed: 62.0, avg_fuel_level: 12.8, alerts_count: 1 },
          { vehicle_id: 4, vehicle_number: "FP-404", driver_name: "Driver 4", status: "Offline", log_count: 150, avg_speed: 0.0, avg_fuel_level: 92.0, alerts_count: 1 },
          { vehicle_id: 5, vehicle_number: "FP-505", driver_name: "Driver 5", status: "Moving", log_count: 510, avg_speed: 98.6, avg_fuel_level: 67.5, alerts_count: 1 }
        ];

        let logs = Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          timestamp: new Date(Date.now() - i * 12 * 60000).toISOString(),
          vehicle_number: ["FP-101", "FP-202", "FP-303", "FP-404", "FP-505"][i % 5],
          driver_name: ["Driver 1", "Driver 2", "Driver 3", "Driver 4", "Driver 5"][i % 5],
          latitude: [28.6139, 12.9716, 22.5726, 17.3850, 19.0760][i % 5] + (i * 0.005),
          longitude: [77.2090, 77.5946, 88.3639, 78.4867, 72.8777][i % 5] + (i * 0.005),
          speed: [72.5, 0.0, 62.0, 0.0, 98.6][i % 5],
          fuel_level: [84.2, 48.9, 12.8, 92.0, 67.5][i % 5]
        }));

        let speedingCount = 1;
        let fuelCount = 1;
        let offlineCount = 1;

        if (loggedInUser.role === 'driver') {
          summaries = summaries.filter(s => s.driver_name === loggedInUser.full_name);
          logs = logs.filter(l => l.driver_name === loggedInUser.full_name);
          speedingCount = loggedInUser.full_name === "Driver 5" ? 1 : 0;
          fuelCount = loggedInUser.full_name === "Driver 3" ? 1 : 0;
          offlineCount = loggedInUser.full_name === "Driver 4" ? 1 : 0;
        } else if (loggedInUser.role === 'user') {
          const userVIds = (loggedInUser as any).vehicle_ids || [];
          const vNums = summaries.filter(s => userVIds.includes(s.vehicle_id)).map(s => s.vehicle_number);
          summaries = summaries.filter(s => userVIds.includes(s.vehicle_id));
          logs = logs.filter(l => vNums.includes(l.vehicle_number));
          speedingCount = vNums.includes("FP-505") ? 1 : 0;
          fuelCount = vNums.includes("FP-303") ? 1 : 0;
          offlineCount = vNums.includes("FP-404") ? 1 : 0;
        }

        const totalTelemetry = summaries.reduce((acc, s) => acc + s.log_count, 0);

        return new Response(JSON.stringify({
          total_telemetry_count: totalTelemetry,
          vehicle_summaries: summaries,
          recent_telemetry: logs,
          alert_summary: [
            { type: "Speeding", count: speedingCount },
            { type: "Low Fuel", count: fuelCount },
            { type: "Offline", count: offlineCount },
            { type: "Route Deviation", count: 0 }
          ]
        }), { status: 200 });
      }

      // GET /analytics
      if (path.startsWith('/analytics')) {
        const moving = vehicles.filter(v => v.status === "Moving").length;
        const idle = vehicles.filter(v => v.status === "Idle").length;
        const offline = vehicles.filter(v => v.status === "Offline").length;

        return new Response(JSON.stringify({
          deliveries_chart: [
            { date: "Jun 17", deliveries: 32, delayed: 3 },
            { date: "Jun 18", deliveries: 38, delayed: 2 },
            { date: "Jun 19", deliveries: 41, delayed: 5 },
            { date: "Jun 20", deliveries: 35, delayed: 4 },
            { date: "Jun 21", deliveries: 45, delayed: 3 },
            { date: "Jun 22", deliveries: 52, delayed: 6 },
            { date: "Jun 23", deliveries: 48, delayed: 4 }
          ],
          utilization_chart: [
            { status: "Moving", count: moving, color: "#00f0ff" },
            { status: "Idle", count: idle, color: "#a855f7" },
            { status: "Offline", count: offline, color: "#64748b" }
          ],
          leaderboard: vehicles.map((v, i) => ({
            rank: i + 1,
            driver: v.driver_name,
            vehicle: v.vehicle_number,
            score: 98 - i * 2.5,
            avg_speed: v.speed || 62.4,
            safety_rating: "Excellent"
          }))
        }), { status: 200 });
      }

      // GET /insights
      if (path.startsWith('/insights')) {
        return new Response(JSON.stringify({
          predictions: shipments.filter(s => s.status === 'Delayed').map(s => {
            const v = vehicles.find(veh => veh.id === s.vehicle_id);
            return {
              shipment_id: s.shipment_number,
              vehicle_number: v?.vehicle_number || 'Unknown',
              driver: v?.driver_name || 'Unknown',
              prediction: "Severe delay expected",
              delay_duration: "+45-60 min",
              confidence: "94%",
              reason: "Corridor slowdowns and driver resting periods."
            };
          }),
          recommendations: [
            {
              type: "Reroute",
              vehicle: "FP-303",
              description: "Reroute FP-303 around severe corridor slowdowns via secondary highway 101-North.",
              benefit: "Saves 35 minutes, avoids 4km gridlock.",
              action_url: "/fleet/3"
            },
            {
              type: "Refuel Alert",
              vehicle: "FP-303",
              description: "Direct FP-303 driver to next available gas depot at East Exit 14. Remaining capacity 12%.",
              benefit: "Avoids vehicle dry-out hazard.",
              action_url: "/fleet/3"
            }
          ],
          model_version: "2.4.1-rc3",
          last_inference: new Date().toISOString()
        }), { status: 200 });
      }
    }

    return originalFetch(input, init);
  };

  runClientSimulator();
};

// Auto-activate client-side fallback mock interface if running as a static web deployment
if (!isLocalhost) {
  enableMockInterceptor();
} else {
  // If local, check connection to backend. If unreachable, enable mock interface so developer
  // can view UI directly without starting the FastAPI server
  fetch('http://localhost:8000/api/auth/me')
    .catch(() => {
      enableMockInterceptor();
    });
}
