import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  Clock, 
  Navigation, 
  Zap, 
  Activity, 
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  Search,
  Bell,
  Cpu,
} from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';
import { StatCard } from '../components/StatCard';
import { LiveMap } from '../components/LiveMap';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentTab }) => {
  const token = useFleetStore((state) => state.token);
  const vehicles = useFleetStore((state) => state.vehicles);
  const alerts = useFleetStore((state) => state.alerts);
  const stats = useFleetStore((state) => state.stats);
  const shipments = useFleetStore((state) => state.shipments);
  const userRole = useFleetStore((state) => state.userRole) || 'admin';
  const userName = useFleetStore((state) => state.userName) || '';
  
  const setVehicles = useFleetStore((state) => state.setVehicles);
  const setAlerts = useFleetStore((state) => state.setAlerts);
  const setStats = useFleetStore((state) => state.setStats);
  const setShipments = useFleetStore((state) => state.setShipments);
  const selectVehicle = useFleetStore((state) => state.selectVehicle);
  
  const [loading, setLoading] = useState(true);
  const [clock, setClock] = useState(new Date());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [statsRes, vehiclesRes, alertsRes, shipmentsRes] = await Promise.all([
          fetch('http://localhost:8000/api/dashboard/stats', { headers }),
          fetch('http://localhost:8000/api/vehicles', { headers }),
          fetch('http://localhost:8000/api/alerts', { headers }),
          fetch('http://localhost:8000/api/shipments', { headers }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());
        if (shipmentsRes.ok) setShipments(await shipmentsRes.json());
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [token, setVehicles, setAlerts, setStats, setShipments]);

  // Fleet health data
  const movingCount = vehicles.filter(v => v.status === 'Moving').length;
  const idleCount = vehicles.filter(v => v.status === 'Idle').length;
  const stoppedCount = vehicles.filter(v => v.status === 'Offline' || v.status === 'Stopped').length;
  const totalVehicles = vehicles.length || 128;
  const maintCount = Math.max(0, totalVehicles - movingCount - idleCount - stoppedCount);

  const healthData = [
    { name: 'Moving', value: movingCount || 84, color: '#7c8c6e' },
    { name: 'Idle', value: idleCount || 24, color: '#8a9bae' },
    { name: 'Stopped', value: stoppedCount || 15, color: '#a0937d' },
    { name: 'Maintenance', value: maintCount || 5, color: '#c4956a' },
  ];

  // Delivery Performance Chart Data
  const deliveryData = [
    { name: '17 Jun', onTime: 82, delayed: 12 },
    { name: '18 Jun', onTime: 87, delayed: 14 },
    { name: '19 Jun', onTime: 90, delayed: 11 },
    { name: '20 Jun', onTime: 84, delayed: 18 },
    { name: '21 Jun', onTime: 93, delayed: 6 },
    { name: '22 Jun', onTime: 89, delayed: 10 },
    { name: '23 Jun', onTime: 91, delayed: 9 },
  ];

  // Fuel & Efficiency data
  const fuelData = [
    { day: '17', fuel: 620, efficiency: 450 },
    { day: '18', fuel: 580, efficiency: 410 },
    { day: '19', fuel: 710, efficiency: 520 },
    { day: '20', fuel: 490, efficiency: 380 },
    { day: '21', fuel: 760, efficiency: 540 },
    { day: '22', fuel: 630, efficiency: 460 },
    { day: '23', fuel: 550, efficiency: 400 },
  ];

  const recentAlerts = alerts.filter(a => !a.resolved).slice(0, 4);

  // ── ROLE-SCOPED DATA ──────────────────────────────────────────────
  // Driver: find their own vehicle
  const myVehicle = userRole === 'driver'
    ? vehicles.find(v => v.driver_name === userName) || null
    : null;

  // Driver: find active shipment for their vehicle
  const myDriverShipment = myVehicle
    ? shipments.find(s => s.vehicle_id === myVehicle.id && s.status !== 'Delivered') || null
    : null;

  // Driver: own alerts
  const myDriverAlerts = myVehicle
    ? alerts.filter(a => (a.vehicle_id === myVehicle.id || a.vehicle_number === myVehicle.vehicle_number) && !a.resolved)
    : [];

  // Client: find their shipments (first active)
  const myClientShipment = userRole === 'user'
    ? (shipments.find(s => s.status !== 'Delivered') || shipments[0] || null)
    : null;

  // Client: vehicle carrying their shipment
  const myClientVehicle = myClientShipment
    ? vehicles.find(v => v.id === myClientShipment.vehicle_id) || null
    : null;

  // Client: alerts for their shipment's vehicle — exclude internal fleet telemetry (Low Fuel, etc.)
  const CLIENT_EXCLUDED_ALERT_TYPES = ['Low Fuel', 'Low Fuel Level', 'Fuel', 'Fuel Alert'];
  const myClientAlerts = myClientVehicle
    ? alerts.filter(a =>
        (a.vehicle_id === myClientVehicle.id || a.vehicle_number === myClientVehicle.vehicle_number)
        && !a.resolved
        && !CLIENT_EXCLUDED_ALERT_TYPES.some(t => a.alert_type?.toLowerCase().includes(t.toLowerCase()))
      )
    : [];

  // ── LOADING SCREEN ────────────────────────────────────────────────
  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-fp-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 text-sm">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // ── DRIVER DASHBOARD ─────────────────────────────────────────────
  if (userRole === 'driver') {
    const v = myVehicle;
    const s = myDriverShipment;
    return (
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-stone-200 leading-none">My Dashboard</h2>
          <p className="text-stone-500 text-[13px] mt-1.5">Your vehicle status, active shipment and alerts</p>
        </div>

        {/* Vehicle KPIs */}
        {v ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="cyber-card p-4">
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Vehicle</p>
              <p className="text-2xl font-black mt-1 text-stone-100">{v.vehicle_number}</p>
            </div>
            <div className="cyber-card p-4">
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Status</p>
              <p className={`text-xl font-black mt-1 ${
                v.status === 'Moving' ? 'text-fp-success' : v.status === 'Idle' ? 'text-fp-info' : 'text-fp-danger'
              }`}>{v.status}</p>
            </div>
            <div className="cyber-card p-4">
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Speed</p>
              <p className="text-2xl font-black mt-1 text-stone-100 tabular-nums">{v.speed.toFixed(1)} <span className="text-sm font-normal text-stone-400">km/h</span></p>
            </div>
            <div className="cyber-card p-4">
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Fuel Level</p>
              <p className={`text-2xl font-black mt-1 tabular-nums ${
                v.fuel_level < 15 ? 'text-fp-danger' : v.fuel_level < 30 ? 'text-fp-warning' : 'text-fp-success'
              }`}>{v.fuel_level.toFixed(1)}%</p>
            </div>
          </div>
        ) : (
          <div className="cyber-card p-6 text-center text-stone-500">
            <p className="text-sm">No vehicle assigned to your account yet.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Live Map — scoped to driver's vehicle */}
          <div className="cyber-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-fp-accent"></span>
              <h3 className="text-[12px] font-medium uppercase tracking-wider text-stone-400">My Vehicle Location</h3>
            </div>
            <LiveMap
              vehicles={v ? [v] : []}
              height="260px"
              showGeofences={false}
              onVehicleClick={() => setCurrentTab('fleet')}
            />
          </div>

          {/* Active Shipment */}
          <div className="cyber-card p-5 space-y-4">
            <h3 className="text-[12px] font-medium uppercase tracking-wider text-stone-400">Active Shipment</h3>
            {s ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Shipment No.</span>
                  <span className="text-sm font-bold text-stone-200">{s.shipment_number}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Route</span>
                  <span className="text-xs text-stone-300">{s.origin} → {s.destination}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Status</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    s.status === 'In Transit' ? 'bg-fp-info/10 text-fp-info border border-fp-info/20' :
                    s.status === 'Delayed' ? 'bg-fp-danger/10 text-fp-danger border border-fp-danger/20' :
                    'bg-fp-surface text-stone-400 border border-fp-border'
                  }`}>{s.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">ETA</span>
                  <span className="text-xs font-semibold text-stone-200">{s.eta || 'Calculating...'}</span>
                </div>
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-[10px] text-stone-500 mb-1">
                    <span>Progress</span>
                    <span>{s.progress.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-fp-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-fp-accent rounded-full transition-all duration-500"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-stone-500 text-sm text-center py-6">No active shipment assigned.</p>
            )}
          </div>
        </div>

        {/* Alerts for this driver */}
        <div className="cyber-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-fp-warning" />
            <h3 className="text-[12px] font-medium uppercase tracking-wider text-stone-400">My Alerts</h3>
            {myDriverAlerts.length > 0 && (
              <span className="ml-auto text-[10px] font-bold text-fp-danger bg-fp-danger/10 border border-fp-danger/20 px-2 py-0.5 rounded">
                {myDriverAlerts.length} Active
              </span>
            )}
          </div>
          {myDriverAlerts.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-4">No active alerts for your vehicle.</p>
          ) : (
            <div className="space-y-2">
              {myDriverAlerts.slice(0, 5).map(alert => (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  alert.severity === 'Critical' ? 'bg-fp-danger/5 border-fp-danger/20' : 'bg-fp-warning/5 border-fp-warning/20'
                }`}>
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    alert.severity === 'Critical' ? 'text-fp-danger' : 'text-fp-warning'
                  }`} />
                  <div>
                    <p className="text-[11px] font-bold text-stone-300">{alert.alert_type}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── CLIENT DASHBOARD ─────────────────────────────────────────────
  if (userRole === 'user') {
    const s = myClientShipment;
    const v = myClientVehicle;
    return (
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-stone-200 leading-none">My Shipment</h2>
          <p className="text-stone-500 text-[13px] mt-1.5">Real-time tracking and delivery status</p>
        </div>

        {/* Shipment KPIs */}
        {s ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="cyber-card p-4">
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Shipment ID</p>
              <p className="text-lg font-black mt-1 text-stone-100">{s.shipment_number}</p>
            </div>
            <div className="cyber-card p-4">
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Status</p>
              <p className={`text-xl font-black mt-1 ${
                s.status === 'Delivered' ? 'text-fp-success' :
                s.status === 'Delayed' ? 'text-fp-danger' :
                s.status === 'In Transit' ? 'text-fp-info' : 'text-stone-300'
              }`}>{s.status}</p>
            </div>
            <div className="cyber-card p-4">
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Progress</p>
              <p className="text-2xl font-black mt-1 text-stone-100 tabular-nums">{s.progress.toFixed(0)}%</p>
            </div>
            <div className="cyber-card p-4">
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">ETA</p>
              <p className="text-sm font-black mt-1 text-stone-100">{s.eta || '—'}</p>
            </div>
          </div>
        ) : (
          <div className="cyber-card p-6 text-center text-stone-500">
            <p className="text-sm">No shipments found for your account.</p>
          </div>
        )}

        {s && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Shipment Details */}
            <div className="cyber-card p-5 space-y-4">
              <h3 className="text-[12px] font-medium uppercase tracking-wider text-stone-400">Shipment Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-fp-border/40">
                  <span className="text-xs text-stone-500">Origin</span>
                  <span className="text-xs font-semibold text-stone-200">{s.origin}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-fp-border/40">
                  <span className="text-xs text-stone-500">Destination</span>
                  <span className="text-xs font-semibold text-stone-200">{s.destination}</span>
                </div>
                {v && (
                  <div className="flex items-center justify-between py-2 border-b border-fp-border/40">
                    <span className="text-xs text-stone-500">Carrier Vehicle</span>
                    <span className="text-xs font-semibold text-stone-200">{v.vehicle_number}</span>
                  </div>
                )}
                {v && (
                  <div className="flex items-center justify-between py-2 border-b border-fp-border/40">
                    <span className="text-xs text-stone-500">Driver</span>
                    <span className="text-xs font-semibold text-stone-200">{v.driver_name}</span>
                  </div>
                )}
                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="flex justify-between text-[10px] text-stone-500 mb-1.5">
                    <span>{s.origin}</span>
                    <span>{s.destination}</span>
                  </div>
                  <div className="h-2 bg-fp-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-fp-accent rounded-full transition-all duration-500"
                      style={{ width: `${s.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-stone-500 mt-1 text-center">{s.progress.toFixed(1)}% complete</p>
                </div>
              </div>
            </div>

            {/* Live Map — scoped to carrier vehicle */}
            <div className="cyber-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-fp-accent"></span>
                <h3 className="text-[12px] font-medium uppercase tracking-wider text-stone-400">Live Shipment Location</h3>
              </div>
              <LiveMap
                vehicles={v ? [v] : []}
                height="260px"
                showGeofences={false}
                onVehicleClick={() => {}}
              />
            </div>
          </div>
        )}

        {/* Delivery Alerts */}
        <div className="cyber-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-fp-warning" />
            <h3 className="text-[12px] font-medium uppercase tracking-wider text-stone-400">Delivery Alerts</h3>
          </div>
          {myClientAlerts.length === 0 ? (
            <p className="text-stone-500 text-sm text-center py-4">No active alerts for your shipment.</p>
          ) : (
            <div className="space-y-2">
              {myClientAlerts.map(alert => (
                <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg border ${
                  alert.severity === 'Critical' ? 'bg-fp-danger/5 border-fp-danger/20' : 'bg-fp-warning/5 border-fp-warning/20'
                }`}>
                  <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                    alert.severity === 'Critical' ? 'text-fp-danger' : 'text-fp-warning'
                  }`} />
                  <div>
                    <p className="text-[11px] font-bold text-stone-300">{alert.alert_type}</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      
      {/* ── TOP HEADER ── */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-stone-200 leading-none">
            Dashboard
          </h2>
          <div className="flex items-center gap-2 mt-1.5">
            <p className="text-stone-500 text-[13px]">Live fleet monitoring and operations overview</p>
            <span className="w-1.5 h-1.5 rounded-full bg-fp-accent"></span>
            <span className="text-stone-400 text-[13px]">All systems operational</span>
          </div>
        </div>
        
        {/* Right toolbar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <button className="w-9 h-9 rounded-lg border border-fp-border bg-fp-card flex items-center justify-center text-stone-500 hover:text-stone-300 hover:border-fp-border-light transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button className="w-9 h-9 rounded-lg border border-fp-border bg-fp-card flex items-center justify-center text-stone-500 hover:text-stone-300 hover:border-fp-border-light transition-colors relative">
              <Bell className="w-4 h-4" />
              {recentAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-fp-danger text-white text-[9px] font-semibold flex items-center justify-center rounded-full">
                  {recentAlerts.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:block w-px h-8 bg-fp-border"></div>

          {/* Clock and Live status container (stacked on mobile, row on desktop) */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-3">
            {/* Clock */}
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-[14px] font-medium text-stone-200 tabular-nums">
                  {clock.toLocaleTimeString('en-US', { hour12: false })}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-fp-accent shrink-0"></span>
              </div>
              <p className="text-[9px] text-stone-500 text-right">
                {clock.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Status pill (placed below date on mobile) */}
            <button className="flex items-center gap-1.5 px-2.5 py-1 bg-fp-accent/8 border border-fp-accent/15 rounded-md text-[10px] text-fp-accent font-semibold self-end sm:self-auto shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-fp-accent animate-pulse"></span>
              Live
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard 
          title="Active Vehicles" 
          value={stats.active_vehicles ?? 128}
          subtext="12.5% vs yesterday" 
          icon={Truck} 
          color="blue" 
        />
        <StatCard 
          title="On-Time Delivery" 
          value={`${stats.on_time_percentage ?? 89.6}%`}
          subtext="4.2% vs yesterday" 
          icon={Navigation} 
          color="green" 
        />
        <StatCard 
          title="Avg Fleet Speed" 
          value={`${stats.average_speed ?? 62.4} km/h`}
          subtext="Requiring 3.6% vs yesterday"
          icon={Zap} 
          color="purple" 
        />
        <StatCard 
          title="Distance Covered" 
          value={`${(stats.total_distance_today ?? 12458).toLocaleString()} km`}
          subtext="8.7% vs yesterday" 
          icon={Activity} 
          color="cyan" 
        />
        <StatCard 
          title="Delayed Shipments" 
          value={stats.delayed_shipments ?? 23}
          subtext="Requiring 15.3% vs yesterday"
          icon={Clock} 
          color="rose" 
        />
      </div>

      {/* ── MAIN 2/3 + 1/3 LAYOUT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          
          {/* MAP */}
          <div className="cyber-card p-4">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-fp-accent"></span>
                <h3 className="text-[12px] font-medium uppercase tracking-wider text-stone-400">
                  Live Fleet Tracking
                </h3>
              </div>
              <button 
                onClick={() => setCurrentTab('map')} 
                className="flex items-center gap-1 text-[11px] text-fp-accent hover:text-fp-accent-light font-medium border border-fp-accent/15 hover:border-fp-accent/30 bg-fp-accent/5 px-2.5 py-1 rounded-lg transition-all"
              >
                Full Screen <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
              </button>
            </div>

            <LiveMap 
              vehicles={vehicles} 
              height="380px" 
              showGeofences={true} 
              onVehicleClick={(v: any) => { 
                selectVehicle(v.id); 
                setCurrentTab('fleet'); 
              }} 
            />

            {/* Map legend */}
            <div className="flex items-center gap-5 mt-3 px-1">
              {[
                { label: 'Moving', color: '#7c8c6e' },
                { label: 'Idle', color: '#8a9bae' },
                { label: 'Stopped', color: '#a0937d' },
                { label: 'Delayed', color: '#b07070' },
                { label: 'Out of Route', color: '#c4956a' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-[10px] text-stone-500">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM CHARTS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Delivery Performance */}
            <div className="cyber-card p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  Delivery Performance
                </h4>
                <button className="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                  This Week <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-2">
                <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-fp-success inline-block rounded"></span><span className="text-[10px] text-stone-500">On-Time</span></div>
                <div className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-fp-danger inline-block rounded"></span><span className="text-[10px] text-stone-500">Delayed</span></div>
              </div>

              <div className="h-44 flex flex-col justify-end">
                <div className="h-36 relative w-full">
                  <svg className="w-full h-full absolute inset-0" viewBox="0 0 500 120" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="gradOnTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c8c6e" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7c8c6e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradDelayed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b07070" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#b07070" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="#333" strokeDasharray="2 2" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="#333" strokeDasharray="2 2" />
                    <line x1="0" y1="100" x2="500" y2="100" stroke="#333" />

                    {/* Area fills */}
                    {(() => {
                      const pointsOnTime = deliveryData.map((d, i) => `${(i/6)*500},${120 - (d.onTime/100)*100 - 10}`);
                      const pointsDelayed = deliveryData.map((d, i) => `${(i/6)*500},${120 - (d.delayed/100)*100 - 10}`);
                      return (
                        <>
                          <path d={`M 0,120 L ${pointsOnTime.join(' L ')} L 500,120 Z`} fill="url(#gradOnTime)" />
                          <path d={`M ${pointsOnTime.join(' L ')}`} stroke="#7c8c6e" strokeWidth="2" fill="none" />
                          
                          <path d={`M 0,120 L ${pointsDelayed.join(' L ')} L 500,120 Z`} fill="url(#gradDelayed)" />
                          <path d={`M ${pointsDelayed.join(' L ')}`} stroke="#b07070" strokeWidth="1.5" fill="none" />
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <div className="flex justify-between text-[9px] text-stone-500 mt-2 px-1 font-mono uppercase">
                  {deliveryData.map((d, i) => <span key={i}>{d.name}</span>)}
                </div>
              </div>
            </div>

            {/* Fuel & Efficiency */}
            <div className="cyber-card p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                  Fuel & Efficiency
                </h4>
                <button className="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                  This Week <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <p className="text-[9px] text-stone-500 uppercase font-medium">Avg Fuel Efficiency</p>
                  <p className="text-[18px] font-semibold text-stone-200">3.2 <span className="text-[12px] text-stone-500 font-normal">km/l</span></p>
                  <p className="text-[10px] text-fp-success flex items-center gap-0.5 font-medium">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 7.5V1.5M1.5 4.5l3-3 3 3" stroke="#7c8c6e" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    6.7% vs last week
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-stone-500 uppercase font-medium">Total Fuel Used</p>
                  <p className="text-[18px] font-semibold text-stone-200">4,256 <span className="text-[12px] text-stone-500 font-normal">L</span></p>
                  <p className="text-[10px] text-fp-danger flex items-center gap-0.5 font-medium">
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M4.5 1.5v6M1.5 4.5l3 3 3-3" stroke="#b07070" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    2.3% vs last week
                  </p>
                </div>
              </div>

              <div className="h-28 flex flex-col justify-end">
                <div className="flex justify-between items-end h-20 px-1 relative">
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="border-b border-stone-850 w-full h-0"></div>
                    <div className="border-b border-stone-850 w-full h-0"></div>
                    <div className="border-b border-stone-850 w-full h-0"></div>
                  </div>
                  {fuelData.map((d, i) => {
                    const fuelHeight = (d.fuel / 1000) * 100;
                    const effHeight = (d.efficiency / 1000) * 100;
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 group z-10">
                        <div className="flex gap-1 items-end h-12 w-full justify-center">
                          <div 
                            style={{ height: `${Math.max(5, fuelHeight)}%` }} 
                            className="w-1.5 bg-[#8a9bae] hover:bg-[#8a9bae]/90 rounded-t transition-all duration-300"
                            title={`Fuel: ${d.fuel}L`}
                          />
                          <div 
                            style={{ height: `${Math.max(5, effHeight)}%` }} 
                            className="w-1.5 bg-[#a0937d] hover:bg-[#a0937d]/90 rounded-t transition-all duration-300"
                            title={`Efficiency: ${d.efficiency} pts`}
                          />
                        </div>
                        <span className="text-[9px] text-stone-500 mt-2 font-mono">{d.day}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5">

          {/* UNRESOLVED ALERTS */}
          <div className="cyber-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-stone-400 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-fp-warning" />
                Unresolved Alerts
              </h4>
              <button 
                onClick={() => setCurrentTab('alerts')} 
                className="text-[10px] text-fp-accent font-medium flex items-center gap-1 hover:text-fp-accent-light"
              >
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
              {recentAlerts.length === 0 ? (
                <div className="text-center py-8 text-stone-600 text-xs">No active alerts</div>
              ) : (
                recentAlerts.map((alert) => (
                  <div key={alert.id} className="p-3 rounded-lg border border-fp-border bg-fp-bg hover:border-fp-border-light transition-colors cursor-pointer">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-stone-300 truncate">
                          {alert.vehicle_number ? `Vehicle ${alert.vehicle_number}` : 'Fleet System'}
                        </p>
                        <p className="text-[10px] text-stone-500 mt-0.5 truncate">{alert.message}</p>
                        <p className="text-[9px] text-stone-600 mt-1">
                          {new Date(alert.timestamp).toLocaleTimeString()} &bull; 2 min ago
                        </p>
                      </div>
                      <div className="flex items-start gap-2 shrink-0">
                        <span className={
                          alert.severity === 'Critical' ? 'badge-critical' :
                          alert.severity === 'Warning' ? 'badge-warning' :
                          'badge-warning'
                        }>
                          {alert.severity}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-stone-600 mt-0.5" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* FLEET HEALTH OVERVIEW */}
          <div className="cyber-card p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-stone-400">
                Fleet Health
              </h4>
              <button className="flex items-center gap-1 text-[10px] text-stone-500 font-medium">
                This Week <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-[90px] h-[90px] shrink-0">
                {(() => {
                  let accumulatedPercent = 0;
                  const healthSegments = healthData.map(item => {
                    const val = item.value || 0;
                    const percent = totalVehicles > 0 ? (val / totalVehicles) * 100 : 0;
                    const strokeDasharray = `${(percent / 100) * 220} 220`;
                    const strokeDashoffset = `${-(accumulatedPercent / 100) * 220}`;
                    accumulatedPercent += percent;
                    return { ...item, strokeDasharray, strokeDashoffset };
                  });
                  return (
                    <svg width="90" height="90" viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle cx="50" cy="50" r="35" fill="transparent" stroke="#222" strokeWidth="12" />
                      {healthSegments.map((seg, idx) => (
                        <circle
                          key={idx}
                          cx="50"
                          cy="50"
                          r="35"
                          fill="transparent"
                          stroke={seg.color}
                          strokeWidth="12"
                          strokeDasharray={seg.strokeDasharray}
                          strokeDashoffset={seg.strokeDashoffset}
                          className="transition-all duration-500"
                        />
                      ))}
                    </svg>
                  );
                })()}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[16px] font-semibold text-stone-200">{totalVehicles}</span>
                  <span className="text-[8px] text-stone-500 text-center leading-tight">Total<br/>Vehicles</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 flex-1">
                {healthData.map((item) => (
                  <div key={item.name} className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-[11px] text-stone-400">
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: item.color }}></span>
                      {item.name}
                    </span>
                    <span className="text-[11px] font-medium text-stone-200">
                      {item.value} <span className="text-stone-500 font-normal text-[9px]">({((item.value / totalVehicles) * 100).toFixed(1)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI INSIGHTS */}
          <div className="cyber-card p-4 flex-1">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-stone-400 flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-fp-info" />
                AI Insights
              </h4>
              <button onClick={() => setCurrentTab('insights')} className="text-[10px] text-fp-accent font-medium flex items-center gap-1 hover:text-fp-accent-light">
                View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Insight 1 - Predicted Delays */}
              <div className="p-3 rounded-lg border border-fp-danger/15 bg-fp-danger/5 hover:border-fp-danger/25 transition-colors">
                <div className="flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-lg bg-fp-danger/10 border border-fp-danger/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-fp-danger" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-stone-300">Predicted Delays</p>
                    <p className="text-[10px] text-stone-500 mt-0.5 leading-relaxed">
                      {stats.delayed_shipments ?? 3} shipments likely delayed.<br/>High traffic on NH-48.
                    </p>
                  </div>
                  <div className="shrink-0 relative w-10 h-10">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#333330" strokeWidth="3" />
                      <circle cx="18" cy="18" r="14" fill="none" stroke="#b07070" strokeWidth="3" strokeDasharray="87 100" strokeLinecap="round"/>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-semibold text-stone-300">87%</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setCurrentTab('insights')} className="mt-2 w-full py-1.5 text-[10px] font-medium text-stone-400 bg-fp-bg border border-fp-border rounded-lg hover:border-fp-border-light transition-colors">
                  View Details
                </button>
              </div>

              {/* Insight 2 - Route Optimization */}
              <div onClick={() => setCurrentTab('insights')} className="p-3 rounded-lg border border-fp-border bg-fp-bg hover:border-fp-accent/20 transition-colors cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-fp-success/10 border border-fp-success/15 flex items-center justify-center shrink-0">
                    <Navigation className="w-3.5 h-3.5 text-fp-success" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-stone-300">Route Optimization</p>
                    <p className="text-[10px] text-stone-500">Save 12% distance for 5 vehicles</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />
              </div>

              {/* Insight 3 - Maintenance */}
              <div onClick={() => setCurrentTab('insights')} className="p-3 rounded-lg border border-fp-border bg-fp-bg hover:border-fp-warning/20 transition-colors cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-fp-warning/10 border border-fp-warning/15 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 text-fp-warning" />
                  </div>
                  <div>
                    <p className="text-[12px] font-medium text-stone-300">Maintenance Due</p>
                    <p className="text-[10px] text-stone-500">2 vehicles require maintenance</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-600 shrink-0" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default Dashboard;
