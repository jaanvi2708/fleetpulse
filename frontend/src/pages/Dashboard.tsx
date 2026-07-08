import React, { useEffect, useState } from 'react';
import { 
  Truck, 
  Clock, 
  Navigation, 
  Zap, 
  Activity, 
  AlertTriangle,
  ArrowRight,
  Cpu,
  ChevronDown,
  Search,
  Bell,
} from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';
import { StatCard } from '../components/StatCard';
import { LiveMap } from '../components/LiveMap';
import { 
  ResponsiveContainer, 
  PieChart, Pie, Cell, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar
} from 'recharts';

interface DashboardProps {
  setCurrentTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setCurrentTab }) => {
  const token = useFleetStore((state) => state.token);
  const vehicles = useFleetStore((state) => state.vehicles);
  const alerts = useFleetStore((state) => state.alerts);
  const stats = useFleetStore((state) => state.stats);
  
  const setVehicles = useFleetStore((state) => state.setVehicles);
  const setAlerts = useFleetStore((state) => state.setAlerts);
  const setStats = useFleetStore((state) => state.setStats);
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
        const [statsRes, vehiclesRes, alertsRes] = await Promise.all([
          fetch('http://localhost:8000/api/dashboard/stats', { headers }),
          fetch('http://localhost:8000/api/vehicles', { headers }),
          fetch('http://localhost:8000/api/alerts', { headers }),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
        if (alertsRes.ok) setAlerts(await alertsRes.json());
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [token, setVehicles, setAlerts, setStats]);

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

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: '#222220',
      border: '1px solid #333330',
      borderRadius: '8px',
      fontSize: '11px',
      color: '#d4d4cc',
    },
    labelStyle: { color: '#8a8a80', fontSize: '10px', fontWeight: 'bold' as const },
  };

  if (loading && vehicles.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-fp-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 text-sm">Loading fleet data...</p>
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
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
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

          <div className="w-px h-8 bg-fp-border"></div>

          {/* Clock */}
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-medium text-stone-200 tabular-nums">
                {clock.toLocaleTimeString('en-US', { hour12: false })}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-fp-accent"></span>
            </div>
            <p className="text-[10px] text-stone-500 text-right">
              {clock.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Status pill */}
          <button className="flex items-center gap-2 px-3 py-1.5 bg-fp-accent/8 border border-fp-accent/15 rounded-md text-[11px] text-fp-accent font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-fp-accent"></span>
            Live
          </button>
        </div>
      </div>

      {/* ── KPI STAT CARDS ── */}
      <div className="grid grid-cols-5 gap-4">
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
      <div className="grid grid-cols-3 gap-5">

        {/* LEFT COLUMN */}
        <div className="col-span-2 flex flex-col gap-5">
          
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
              onVehicleClick={(v) => { 
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
          <div className="grid grid-cols-2 gap-5">

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

              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={deliveryData} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradOnTime" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c8c6e" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#7c8c6e" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradDelayed" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#b07070" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#b07070" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333330" />
                    <XAxis dataKey="name" stroke="#6b6b64" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b6b64" fontSize={9} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <Tooltip {...tooltipStyle} formatter={(value: any, name: any) => [`${value}%`, name === 'onTime' ? 'On-Time' : 'Delayed']} />
                    <Area type="monotone" dataKey="onTime" stroke="#7c8c6e" strokeWidth={1.5} fill="url(#gradOnTime)" dot={{ fill: '#7c8c6e', strokeWidth: 0, r: 2.5 }} activeDot={{ r: 3.5 }} />
                    <Area type="monotone" dataKey="delayed" stroke="#b07070" strokeWidth={1.5} fill="url(#gradDelayed)" dot={{ fill: '#b07070', strokeWidth: 0, r: 2.5 }} activeDot={{ r: 3.5 }} />
                  </AreaChart>
                </ResponsiveContainer>
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

              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fuelData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }} barSize={6} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333330" />
                    <XAxis dataKey="day" stroke="#6b6b64" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#6b6b64" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="fuel" fill="#8a9bae" fillOpacity={0.6} radius={[2,2,0,0]} />
                    <Bar dataKey="efficiency" fill="#a0937d" fillOpacity={0.6} radius={[2,2,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthData}
                      cx="50%" cy="50%"
                      innerRadius={30} outerRadius={44}
                      paddingAngle={2}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {healthData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
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
              <button className="text-[10px] text-fp-accent font-medium flex items-center gap-1 hover:text-fp-accent-light">
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
                <button className="mt-2 w-full py-1.5 text-[10px] font-medium text-stone-400 bg-fp-bg border border-fp-border rounded-lg hover:border-fp-border-light transition-colors">
                  View Details
                </button>
              </div>

              {/* Insight 2 - Route Optimization */}
              <div className="p-3 rounded-lg border border-fp-border bg-fp-bg hover:border-fp-accent/20 transition-colors cursor-pointer flex items-center justify-between">
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
              <div className="p-3 rounded-lg border border-fp-border bg-fp-bg hover:border-fp-warning/20 transition-colors cursor-pointer flex items-center justify-between">
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
