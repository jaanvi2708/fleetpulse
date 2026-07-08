// Client-side Mock API Interceptor for standalone/hosted demos.
// Only activates when running on a hosted environment (e.g., GitHub Pages, Vercel)
// or when the backend server is unreachable.

import { useFleetStore } from './store/fleetStore';

const isLocalhost = 
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1';

// Seed Data
const MOCK_USER = {
  email: 'admin@fleetpulse.com',
  full_name: 'Fleet Operations Command'
};

const ROUTES: Record<string, [number, number][]> = {
  "FP-101": [
    [37.7749, -122.4194], [37.5630, -121.9886], [37.3382, -121.8863],
    [36.9741, -121.9196], [36.6002, -121.8947], [35.6870, -120.6588],
    [35.2828, -120.6596], [34.9530, -120.4357], [34.4208, -119.6982],
    [34.2746, -118.7798], [34.0522, -118.2437]
  ],
  "FP-202": [
    [34.0522, -118.2437], [33.8958, -118.2201], [33.7701, -118.1937],
    [33.6695, -117.8232], [33.4936, -117.1484], [33.1959, -117.3795],
    [33.1094, -117.2892], [33.0167, -117.1497], [32.7157, -117.1611]
  ],
  "FP-303": [
    [40.7128, -74.0060], [40.8448, -73.8648], [41.0534, -73.5387],
    [41.3082, -72.9279], [41.5623, -72.6509], [41.7658, -72.6851],
    [41.9782, -72.1984], [42.1015, -71.5622], [42.2626, -71.8023],
    [42.3601, -71.0589]
  ],
  "FP-404": [
    [41.8781, -87.6298], [41.7508, -87.4626], [41.6064, -87.3372],
    [41.5867, -86.2520], [41.9781, -85.9236], [42.2914, -85.5872],
    [42.3314, -83.0458]
  ],
  "FP-505": [
    [19.0760, 72.8777], [19.0330, 73.0297], [18.9975, 73.1213],
    [18.9068, 73.3559], [18.7811, 73.4877], [18.7563, 73.4784],
    [18.6524, 73.7792], [18.5204, 73.8567]
  ]
};

let vehicles = [
  { id: 1, vehicle_number: "FP-101", driver_name: "Marcus Vance", status: "Moving", speed: 72.5, fuel_level: 84.2, latitude: 37.7749, longitude: -122.4194, waypoint_idx: 0, last_updated: new Date().toISOString() },
  { id: 2, vehicle_number: "FP-202", driver_name: "Elena Rostova", status: "Idle", speed: 0.0, fuel_level: 48.9, latitude: 34.0522, longitude: -118.2437, waypoint_idx: 0, last_updated: new Date().toISOString() },
  { id: 3, vehicle_number: "FP-303", driver_name: "Jaxson Reed", status: "Moving", speed: 62.0, fuel_level: 12.8, latitude: 40.7128, longitude: -74.0060, waypoint_idx: 0, last_updated: new Date().toISOString() },
  { id: 4, vehicle_number: "FP-404", driver_name: "Sarah Jenkins", status: "Offline", speed: 0.0, fuel_level: 92.0, latitude: 41.8781, longitude: -87.6298, waypoint_idx: 0, last_updated: new Date().toISOString() },
  { id: 5, vehicle_number: "FP-505", driver_name: "Arjun Sharma", status: "Moving", speed: 98.6, fuel_level: 67.5, latitude: 19.0760, longitude: 72.8777, waypoint_idx: 0, last_updated: new Date().toISOString() }
];

let shipments = [
  { id: 1, shipment_number: "SH-5001", vehicle_id: 1, origin: "San Francisco, CA", destination: "Los Angeles, CA", eta: "2h 45m", status: "In Transit", progress: 42.0, current_lat: 37.7749, current_lng: -122.4194 },
  { id: 2, shipment_number: "SH-5002", vehicle_id: 2, origin: "Los Angeles, CA", destination: "Phoenix, AZ", eta: "Pending Dispatch", status: "Pending", progress: 0.0, current_lat: 34.0522, current_lng: -118.2437 },
  { id: 3, shipment_number: "SH-5003", vehicle_id: 3, origin: "New York, NY", destination: "Boston, MA", eta: "Delayed (+55m)", status: "Delayed", progress: 78.5, current_lat: 40.7128, current_lng: -74.0060 },
  { id: 4, shipment_number: "SH-5004", vehicle_id: 5, origin: "Mumbai, MH", destination: "Pune, MH", eta: "1h 25m", status: "In Transit", progress: 32.0, current_lat: 19.0760, current_lng: 72.8777 }
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
        if (body.email === 'admin@fleetpulse.com' && body.password === 'admin123') {
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
        return new Response(JSON.stringify(MOCK_USER), { status: 200 });
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
        return new Response(JSON.stringify({
          completed_shipments: 124,
          delayed_count: 8,
          fuel_consumed: 3820,
          efficiency_score: 94.2
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
