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
// Recharts replaced with custom CSS/SVG widgets

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
            <div className="h-64 flex flex-col justify-end">
              <div className="flex justify-between items-end h-52 px-2 relative">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-stone-850 w-full h-0"></div>
                  <div className="border-b border-stone-850 w-full h-0"></div>
                  <div className="border-b border-stone-850 w-full h-0"></div>
                  <div className="border-b border-stone-850 w-full h-0"></div>
                </div>
                
                <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 500 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="gradDel" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8a9bae" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8a9bae" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradDelDelayed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#b07070" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#b07070" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const chartData = analyticsData.deliveries_chart || [];
                    const maxVal = Math.max(...chartData.map((d: any) => Math.max(d.deliveries || 0, d.delayed || 0)), 1);
                    const pointsDel = chartData.map((d: any, idx: number) => {
                      const x = (idx / Math.max(chartData.length - 1, 1)) * 500;
                      const y = 200 - ((d.deliveries || 0) / maxVal) * 160 - 20;
                      return `${x},${y}`;
                    });
                    const pointsDelayed = chartData.map((d: any, idx: number) => {
                      const x = (idx / Math.max(chartData.length - 1, 1)) * 500;
                      const y = 200 - ((d.delayed || 0) / maxVal) * 160 - 20;
                      return `${x},${y}`;
                    });
                    return (
                      <>
                        {pointsDel.length > 0 && (
                          <>
                            <path d={`M 0,200 L ${pointsDel.join(' L ')} L 500,200 Z`} fill="url(#gradDel)" />
                            <path d={`M ${pointsDel.join(' L ')}`} stroke="#8a9bae" strokeWidth="2" fill="none" />
                          </>
                        )}
                        {pointsDelayed.length > 0 && (
                          <>
                            <path d={`M 0,200 L ${pointsDelayed.join(' L ')} L 500,200 Z`} fill="url(#gradDelDelayed)" />
                            <path d={`M ${pointsDelayed.join(' L ')}`} stroke="#b07070" strokeWidth="1.5" fill="none" />
                          </>
                        )}
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="flex justify-between text-[9px] text-stone-500 mt-2 px-1 font-mono uppercase tracking-wider">
                {(analyticsData.deliveries_chart || []).map((d: any, idx: number) => (
                  <span key={idx}>{d.date}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="cyber-card p-5 space-y-4">
          <h4 className="text-xs font-medium uppercase tracking-wider text-stone-500 flex items-center gap-1.5 select-none">
            <BarChart3 className="w-3.5 h-3.5 text-fp-info" />
            On-Time vs Delayed
          </h4>
          <div className="h-64">
            <div className="h-64 flex flex-col justify-end">
              <div className="flex justify-between items-end h-52 px-2 relative">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-stone-850 w-full h-0"></div>
                  <div className="border-b border-stone-850 w-full h-0"></div>
                  <div className="border-b border-stone-850 w-full h-0"></div>
                  <div className="border-b border-stone-850 w-full h-0"></div>
                </div>
                
                {(() => {
                  const chartData = analyticsData.deliveries_chart || [];
                  const maxVal = Math.max(...chartData.map((d: any) => Math.max(d.deliveries || 0, d.delayed || 0)), 1);
                  return chartData.map((d: any, idx: number) => {
                    const delHeight = ((d.deliveries || 0) / maxVal) * 100;
                    const delayHeight = ((d.delayed || 0) / maxVal) * 100;
                    return (
                      <div key={idx} className="flex flex-col items-center flex-1 group z-10">
                        <div className="flex gap-1 items-end h-36 w-full justify-center">
                          <div 
                            style={{ height: `${Math.max(4, delHeight)}%` }} 
                            className="w-2.5 bg-[#8a9bae] hover:bg-[#8a9bae]/90 rounded-t transition-all duration-300"
                            title={`On-Time: ${d.deliveries}`}
                          />
                          <div 
                            style={{ height: `${Math.max(4, delayHeight)}%` }} 
                            className="w-2.5 bg-[#a0937d] hover:bg-[#a0937d]/90 rounded-t transition-all duration-300"
                            title={`Delayed: ${d.delayed}`}
                          />
                        </div>
                        <span className="text-[9px] text-stone-500 mt-2 font-mono">{d.date}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
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
            <div className="h-56 flex flex-col justify-end">
              <div className="flex justify-between items-end h-44 px-2 relative">
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                  <div className="border-b border-stone-850 w-full h-0"></div>
                  <div className="border-b border-stone-850 w-full h-0"></div>
                  <div className="border-b border-stone-850 w-full h-0"></div>
                </div>
                
                <svg className="w-full h-full absolute inset-0 z-10" viewBox="0 0 500 160" preserveAspectRatio="none">
                  {(() => {
                    const maxSpeed = 100;
                    const maxEff = 10;
                    const pointsSpeed = performanceTrend.map((d: any, idx: number) => {
                      const x = (idx / 6) * 500;
                      const y = 160 - (d.speed / maxSpeed) * 120 - 20;
                      return `${x},${y}`;
                    });
                    const pointsEff = performanceTrend.map((d: any, idx: number) => {
                      const x = (idx / 6) * 500;
                      const y = 160 - (d.fuelEfficiency / maxEff) * 120 - 20;
                      return `${x},${y}`;
                    });
                    return (
                      <>
                        <path d={`M ${pointsSpeed.join(' L ')}`} stroke="#a0937d" strokeWidth="1.5" fill="none" />
                        <path d={`M ${pointsEff.join(' L ')}`} stroke="#c4956a" strokeWidth="1.5" fill="none" />
                      </>
                    );
                  })()}
                </svg>
              </div>
              <div className="flex justify-between text-[9px] text-stone-500 mt-2 px-1 font-mono">
                {performanceTrend.map((d: any, idx: number) => (
                  <span key={idx}>{d.day}</span>
                ))}
              </div>
            </div>
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
          
          <div className="bg-fp-bg border border-fp-border rounded-lg overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs select-none min-w-[550px]">
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
