import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  ChevronDown, 
  Gauge, 
  Compass, 
  ListOrdered 
} from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';
import { 
  ResponsiveContainer, 
  LineChart, Line, 
  BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend 
} from 'recharts';

export const Analytics: React.FC = () => {
  const token = useFleetStore((state) => state.token);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8000/api/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [token]);

  const performanceTrend = [
    { day: 'Mon', speed: 68.5, fuelEfficiency: 7.2 },
    { day: 'Tue', speed: 70.2, fuelEfficiency: 7.5 },
    { day: 'Wed', speed: 67.4, fuelEfficiency: 6.9 },
    { day: 'Thu', speed: 72.1, fuelEfficiency: 7.4 },
    { day: 'Fri', speed: 69.8, fuelEfficiency: 7.1 },
    { day: 'Sat', speed: 64.2, fuelEfficiency: 8.0 },
    { day: 'Sun', speed: 65.5, fuelEfficiency: 7.8 }
  ];

  const tooltipStyle = {
    contentStyle: { backgroundColor: '#222220', border: '1px solid #333330', borderRadius: '8px', fontSize: '11px', color: '#d4d4cc' },
    labelStyle: { color: '#8a8a80', fontSize: '11px', fontWeight: 'bold' as const },
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-fp-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 font-medium text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-stone-200">
            Analytics
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Fleet efficiency and driver performance reports
          </p>
        </div>
        
        <div className="relative">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-fp-card border border-fp-border rounded-lg text-xs text-stone-400 font-medium select-none hover:border-fp-border-light">
            <Calendar className="w-3.5 h-3.5 text-fp-accent" />
            Last 7 Days
            <ChevronDown className="w-3 h-3 text-stone-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        <div className="cyber-card p-5 space-y-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-stone-500 flex items-center gap-1.5 select-none">
            <Compass className="w-3.5 h-3.5 text-fp-info" />
            Deliveries & Dispatches
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.deliveries_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333330" />
                <XAxis dataKey="date" stroke="#6b6b64" fontSize={10} />
                <YAxis stroke="#6b6b64" fontSize={10} />
                <Tooltip {...tooltipStyle} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="deliveries" name="Completed" stroke="#8a9bae" strokeWidth={2} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="delayed" name="Delayed" stroke="#b07070" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="cyber-card p-5 space-y-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-stone-500 flex items-center gap-1.5 select-none">
            <BarChart3 className="w-3.5 h-3.5 text-fp-info" />
            On-Time vs Delayed
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.deliveries_chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333330" />
                <XAxis dataKey="date" stroke="#6b6b64" fontSize={10} />
                <YAxis stroke="#6b6b64" fontSize={10} />
                <Tooltip {...tooltipStyle} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="deliveries" name="On-Time" fill="#8a9bae" radius={[4, 4, 0, 0]} />
                <Bar dataKey="delayed" name="Delayed" fill="#a0937d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="cyber-card p-5 space-y-4 flex flex-col justify-between">
          <h4 className="text-xs font-medium uppercase tracking-wider text-stone-500 flex items-center gap-1.5 select-none">
            <Gauge className="w-3.5 h-3.5 text-fp-muted" />
            Operational Efficiency
          </h4>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333330" />
                <XAxis dataKey="day" stroke="#6b6b64" fontSize={10} />
                <YAxis stroke="#6b6b64" fontSize={10} />
                <Tooltip {...tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="speed" name="Speed (km/h)" stroke="#a0937d" strokeWidth={1.5} />
                <Line type="monotone" dataKey="fuelEfficiency" name="Efficiency (mpg)" stroke="#c4956a" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <span className="text-[10px] text-stone-600 text-center font-medium block pt-2 border-t border-fp-border select-none">
            Weekly telemetry aggregation
          </span>
        </div>

        <div className="lg:col-span-2 cyber-card p-5 space-y-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-stone-500 flex items-center gap-1.5 select-none">
            <ListOrdered className="w-3.5 h-3.5 text-fp-info" />
            Driver Safety Leaderboard
          </h4>
          
          <div className="bg-fp-bg border border-fp-border rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-xs select-none">
              <thead>
                <tr className="bg-fp-surface border-b border-fp-border text-stone-500 font-medium uppercase tracking-wider">
                  <th className="p-3 text-center">Rank</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3 text-right">Avg Speed</th>
                  <th className="p-3 text-right">Score</th>
                  <th className="p-3 text-center">Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fp-border/50">
                {analyticsData.leaderboard.map((row: any) => (
                  <tr key={row.rank} className="hover:bg-fp-surface/30">
                    <td className="p-3 text-center font-medium text-stone-500">#{row.rank}</td>
                    <td className="p-3 font-medium text-stone-300">{row.driver}</td>
                    <td className="p-3 text-fp-info font-medium">{row.vehicle}</td>
                    <td className="p-3 text-right text-stone-400 font-mono">{row.avg_speed} km/h</td>
                    <td className="p-3 text-right text-stone-300 font-medium">{row.score} / 100</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-medium uppercase border ${
                        row.score >= 90 
                          ? 'bg-fp-success/10 text-fp-success border-fp-success/20' 
                          : 'bg-fp-warning/10 text-fp-warning border-fp-warning/20'
                      }`}>
                        {row.score >= 90 ? 'Class A' : 'Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Analytics;
