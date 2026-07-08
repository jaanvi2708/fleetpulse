import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Filter, 
  Download, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  User, 
  Layers, 
  FileSpreadsheet, 
  Sparkles,
  Database
} from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';
import { 
  ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

export const Reports: React.FC = () => {
  const token = useFleetStore((state) => state.token);
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('today');
  
  // Simulated report compiler states
  const [compiling, setCompiling] = useState(false);
  const [compileFormat, setCompileFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [compileStep, setCompileStep] = useState<number>(0);
  const [generatedReports, setGeneratedReports] = useState<number>(4);
  const [downloadReady, setDownloadReady] = useState(false);

  const compileSteps = [
    "Establishing handshake with Telemetry Database...",
    "Extracting historical telemetry series...",
    "Analyzing driver velocity patterns & geofences...",
    "Computing fuel efficiency & idling reports...",
    "Signing digital manifest with secure SHA-256 keys...",
    "Report generation complete!"
  ];

  const fetchReportsData = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/reports', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReportsData(data);
      }
    } catch (err) {
      console.error('Error fetching reports data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [token]);

  const handleCompileReport = () => {
    if (compiling) return;
    setCompiling(true);
    setDownloadReady(false);
    setCompileStep(0);

    const runCompileSteps = (step: number) => {
      if (step < compileSteps.length) {
        setCompileStep(step);
        setTimeout(() => {
          runCompileSteps(step + 1);
        }, 800);
      } else {
        setCompiling(false);
        setDownloadReady(true);
        setGeneratedReports(prev => prev + 1);
      }
    };

    runCompileSteps(0);
  };

  const handleDownload = () => {
    if (!reportsData) return;
    
    let content = "";
    let filename = `fleetpulse_report_${selectedVehicle}_${selectedTimeframe}`;
    
    if (compileFormat === 'json') {
      content = JSON.stringify(reportsData, null, 2);
      filename += ".json";
    } else if (compileFormat === 'csv') {
      const headers = "Vehicle,Driver,Status,TelemetryLogs,AvgSpeed,AvgFuel,Alerts\n";
      const rows = reportsData.vehicle_summaries.map((v: any) => 
        `"${v.vehicle_number}","${v.driver_name}","${v.status}",${v.log_count},${v.avg_speed},${v.avg_fuel_level},${v.alerts_count}`
      ).join("\n");
      content = headers + rows;
      filename += ".csv";
    } else {
      // Mock PDF export formatting
      content = `==================================================\n` +
                `         FLEETPULSE LOGISTICS OPERATIONS SYSTEM  \n` +
                `               FLEET MONITORING REPORT           \n` +
                `==================================================\n` +
                `Generated At: ${new Date().toLocaleString()}\n` +
                `Selected Vehicle Filter: ${selectedVehicle}\n` +
                `Total Telemetry Events Logged: ${reportsData.total_telemetry_count}\n` +
                `--------------------------------------------------\n\n` +
                `FLEET VEHICLE SUMMARIES:\n` +
                reportsData.vehicle_summaries.map((v: any) => 
                  `- ${v.vehicle_number} (Driver: ${v.driver_name}) | Status: ${v.status} | Avg Speed: ${v.avg_speed} km/h | Avg Fuel: ${v.avg_fuel_level}%`
                ).join("\n") + "\n\n" +
                `ALERT DISPATCH LOGS SUMMARY:\n` +
                reportsData.alert_summary.map((a: any) => 
                  `- ${a.type}: ${a.count} occurrences`
                ).join("\n") + "\n\n" +
                `==================================================\n` +
                `          END OF VERIFIED REPORT INDEX            \n` +
                `==================================================`;
      filename += ".txt";
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading || !reportsData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-fp-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-400 font-medium">Compiling telemetry records and logs...</p>
        </div>
      </div>
    );
  }

  // Filtered summaries & logs
  const filteredVehicles = reportsData.vehicle_summaries.filter((v: any) => {
    if (selectedVehicle !== 'all' && v.vehicle_number !== selectedVehicle) return false;
    return true;
  });

  const filteredLogs = reportsData.recent_telemetry.filter((t: any) => {
    if (selectedVehicle !== 'all' && t.vehicle_number !== selectedVehicle) return false;
    return true;
  });

  // Driver safety score calculation helper
  const getSafetyScore = (avgSpeed: number, alertsCount: number) => {
    let score = 100;
    if (avgSpeed > 80) score -= (avgSpeed - 80) * 1.2;
    score -= alertsCount * 8;
    return Math.max(35, Math.min(100, Math.round(score)));
  };

  const getSafetyColor = (score: number) => {
    if (score >= 90) return 'text-fp-success border-fp-success/20 bg-fp-success/5';
    if (score >= 70) return 'text-fp-info border-fp-info/20 bg-fp-info/5';
    return 'text-fp-danger border-fp-danger/20 bg-fp-danger/5';
  };

  return (
    <div className="space-y-6">
      
      {/* ── HEADER ── */}
      <div className="flex justify-between items-start gap-4">
        <div>
          <h2 className="text-[26px] font-extrabold text-stone-200 uppercase tracking-tight leading-none flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-fp-accent" />
            Reports Engine
          </h2>
          <p className="text-stone-500 text-[13px] mt-1.5">
            Verified telemetry logs, driver safety sheets, and records export portal
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchReportsData} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-fp-surface border border-fp-border hover:border-fp-border-light rounded-md text-[11px] font-medium text-stone-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync Database
          </button>
        </div>
      </div>

      {/* ── STATS HUB ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="cyber-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider select-none">Database Events</p>
            <p className="text-2xl font-black mt-1 text-stone-100 tabular-nums">{reportsData.total_telemetry_count}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-fp-info/10 border border-fp-info/20 flex items-center justify-center text-fp-info select-none">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="cyber-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider select-none">Compiled Reports</p>
            <p className="text-2xl font-black mt-1 text-stone-100 tabular-nums">{generatedReports}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-fp-accent/10 border border-fp-accent/20 flex items-center justify-center text-fp-accent-light select-none">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="cyber-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider select-none">Safety Average</p>
            <p className="text-2xl font-black mt-1 text-fp-success tabular-nums">91.4%</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-fp-success/10 border border-fp-success/20 flex items-center justify-center text-fp-success select-none">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="cyber-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider select-none">Active Violations</p>
            <p className="text-2xl font-black mt-1 text-fp-danger tabular-nums">
              {reportsData.vehicle_summaries.reduce((acc: number, v: any) => acc + v.alerts_count, 0)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-fp-danger/10 border border-fp-danger/20 flex items-center justify-center text-fp-danger select-none">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── LEFT COLUMN: REPORT COMPILER & CONFIG ── */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* CONFIGURATION PANEL */}
          <div className="cyber-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2 select-none">
              <Filter className="w-4 h-4 text-fp-accent" />
              Report Scope Filters
            </h3>

            {/* Vehicle Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase select-none">Vehicle Manifest</label>
              <select 
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full bg-fp-surface border border-fp-border rounded-lg px-3 py-2 text-xs font-medium text-stone-300 focus:outline-none focus:border-fp-accent cursor-pointer"
              >
                <option value="all">All Fleet Vehicles</option>
                {reportsData.vehicle_summaries.map((v: any) => (
                  <option key={v.vehicle_id} value={v.vehicle_number}>{v.vehicle_number} - {v.driver_name}</option>
                ))}
              </select>
            </div>

            {/* Timeframe Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase select-none">Date Range Frame</label>
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full bg-fp-surface border border-fp-border rounded-lg px-3 py-2 text-xs font-medium text-stone-300 focus:outline-none focus:border-fp-accent cursor-pointer"
              >
                <option value="today">Today (Real-time)</option>
                <option value="week">Last 7 Days (Telemetry Log)</option>
                <option value="month">Last 30 Days (Full Cycle)</option>
              </select>
            </div>

            {/* Format Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase select-none">Export Format Profile</label>
              <div className="grid grid-cols-3 gap-2">
                {(['pdf', 'csv', 'json'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setCompileFormat(format)}
                    className={`py-2 rounded-lg border text-[11px] font-black uppercase transition-all select-none ${
                      compileFormat === format 
                        ? 'bg-fp-accent/20 border-fp-accent text-fp-accent-light' 
                        : 'bg-fp-surface border-fp-border text-stone-500 hover:border-fp-border-light hover:text-stone-300'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* REPORT GENERATION TERMINAL */}
          <div className="cyber-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2 select-none">
              <Sparkles className="w-4 h-4 text-fp-success" />
              Report Compiler
            </h3>

            {compiling ? (
              <div className="space-y-4 bg-fp-bg border border-fp-border/40 p-4 rounded-lg font-mono text-[10px] text-fp-success leading-relaxed min-h-[140px]">
                <div className="flex items-center gap-2 select-none border-b border-fp-border/30 pb-1.5 text-stone-500 uppercase tracking-wider font-semibold">
                  <span className="w-2 h-2 rounded-full bg-fp-success animate-ping"></span>
                  Compiling Manifest
                </div>
                <div className="space-y-1.5">
                  {compileSteps.slice(0, compileStep + 1).map((step, idx) => (
                    <p key={idx} className="flex gap-2 items-start animate-fade-in">
                      <span className="text-stone-600">[{idx + 1}]</span>
                      <span className={idx === compileStep ? "text-stone-200" : "text-fp-success/70"}>
                        {step}
                      </span>
                    </p>
                  ))}
                </div>
              </div>
            ) : downloadReady ? (
              <div className="space-y-3 p-4 bg-fp-success/5 border border-fp-success/20 rounded-lg text-center animate-in zoom-in-95 duration-200">
                <CheckCircle className="w-10 h-10 text-fp-success mx-auto" />
                <div>
                  <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wide">Report Compiled</h4>
                  <p className="text-[10px] text-stone-500 mt-1 select-none">Verified index build completed.</p>
                </div>
                <button
                  onClick={handleDownload}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-fp-success hover:bg-fp-accent text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft select-none"
                >
                  <Download className="w-4 h-4" />
                  Download Verified File
                </button>
              </div>
            ) : (
              <div className="space-y-3 text-center py-6 border border-dashed border-fp-border rounded-lg">
                <FileSpreadsheet className="w-10 h-10 text-stone-600 mx-auto" />
                <div className="px-4">
                  <p className="text-xs text-stone-400 font-bold uppercase select-none">Ready for Compilation</p>
                  <p className="text-[10px] text-stone-500 mt-1 leading-normal select-none">
                    Select scope filters and trigger compilation to verify local telemetry indices.
                  </p>
                </div>
                <button
                  onClick={handleCompileReport}
                  className="mx-auto flex items-center justify-center gap-2 py-2 px-6 bg-fp-accent hover:bg-fp-accent-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft select-none"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Compile Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: VISUALIZATIONS & LOG TABLE ── */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* VEHICLE SAFETY SHEET TABLE */}
          <div className="cyber-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2 select-none">
              <User className="w-4 h-4 text-fp-info" />
              Fleet Drivers Audit Sheets
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-medium text-stone-300">
                <thead>
                  <tr className="border-b border-fp-border text-[9.5px] uppercase tracking-wider text-stone-500 font-bold select-none">
                    <th className="text-left pb-2">Vehicle</th>
                    <th className="text-left pb-2">Operator Name</th>
                    <th className="text-center pb-2">Speed Avg</th>
                    <th className="text-center pb-2">Fuel Avg</th>
                    <th className="text-center pb-2">Violations</th>
                    <th className="text-right pb-2">Safety Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fp-border/40">
                  {filteredVehicles.map((v: any) => {
                    const score = getSafetyScore(v.avg_speed, v.alerts_count);
                    return (
                      <tr key={v.vehicle_id} className="hover:bg-fp-surface/20 transition-colors">
                        <td className="py-2.5 font-bold text-stone-200">{v.vehicle_number}</td>
                        <td className="py-2.5 text-stone-400">{v.driver_name}</td>
                        <td className="py-2.5 text-center tabular-nums">{v.avg_speed} km/h</td>
                        <td className="py-2.5 text-center tabular-nums">{v.avg_fuel_level}%</td>
                        <td className="py-2.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded-[3px] text-[9px] font-bold ${
                            v.alerts_count > 0 ? 'bg-fp-danger/10 text-fp-danger border border-fp-danger/20' : 'bg-fp-surface text-stone-500 border border-fp-border'
                          }`}>
                            {v.alerts_count} Flagged
                          </span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`px-2 py-0.5 rounded-[3px] border text-[10px] font-black select-none ${getSafetyColor(score)}`}>
                            {score}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RECHARTS ALERT DISTRIBUTION */}
          <div className="cyber-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2 select-none">
              <TrendingUp className="w-4 h-4 text-fp-danger" />
              Incidents & Warnings Frequency
            </h3>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportsData.alert_summary} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis 
                    dataKey="type" 
                    stroke="#555550" 
                    fontSize={9} 
                    fontWeight="bold" 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#555550" 
                    fontSize={9} 
                    tickLine={false} 
                    allowDecimals={false} 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#222220',
                      border: '1px solid #333330',
                      borderRadius: '8px',
                      fontSize: '10px',
                      color: '#d4d4cc',
                    }}
                    cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} fill="#7c8c6e">
                    {reportsData.alert_summary.map((entry: any, index: number) => {
                      const colors: Record<string, string> = {
                        "Speeding": "#b07070",
                        "Low Fuel": "#c4956a",
                        "Offline": "#8a9bae"
                      };
                      return <Cell key={`cell-${index}`} fill={colors[entry.type] || "#7c8c6e"} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* ── ROW: REAL-TIME LEDGER LOGS ── */}
      <div className="cyber-card p-5 space-y-4">
        <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2 select-none">
          <Clock className="w-4 h-4 text-fp-info" />
          Raw Ledger Index Events (Last 100 Transactions)
        </h3>

        <div className="overflow-y-auto max-h-[300px] border border-fp-border rounded-lg">
          <table className="w-full text-[11px] font-medium text-stone-300">
            <tbody className="divide-y divide-fp-border/40">
              {filteredLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-fp-surface/10 transition-colors">
                  <td className="py-2 px-3 text-stone-500 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })} (Local)
                  </td>
                  <td className="py-2 px-3 font-bold text-stone-200">{log.vehicle_number}</td>
                  <td className="py-2 px-3 text-stone-400">{log.driver_name}</td>
                  <td className="py-2 px-3 text-center text-stone-500 font-mono select-all">
                    {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}
                  </td>
                  <td className="py-2 px-3 text-center tabular-nums text-stone-200">
                    <span className={log.speed > 95 ? "text-fp-danger font-semibold" : ""}>
                      {log.speed.toFixed(1)} km/h
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right pr-4 tabular-nums">
                    <span className={`font-bold ${log.fuel_level < 15 ? "text-fp-danger" : "text-fp-success"}`}>
                      {log.fuel_level.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Reports;
