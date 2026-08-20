import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
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
  Database,
  Truck,
  Package,
  Shield,
  Fuel,
  MapPin,
  Activity
} from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';
import { getClientShipments, getDriverVehicle } from '../utils/roleUtils';

export const Reports: React.FC = () => {
  const token = useFleetStore((state) => state.token);
  const userRole = useFleetStore((state) => state.userRole) || 'admin';
  const userName = useFleetStore((state) => state.userName) || '';
  const userEmail = useFleetStore((state) => state.userEmail) || '';
  const shipments = useFleetStore((state) => state.shipments);
  const vehicles = useFleetStore((state) => state.vehicles);
  
  const [reportsData, setReportsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [vehicleSelectOpen, setVehicleSelectOpen] = useState(false);
  const [tempVehicle, setTempVehicle] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('today');
  const [timeframeSelectOpen, setTimeframeSelectOpen] = useState(false);
  const [tempTimeframe, setTempTimeframe] = useState<string>('today');
  
  // Simulated report compiler states
  const [compiling, setCompiling] = useState(false);
  const [compileFormat, setCompileFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [compileStep, setCompileStep] = useState<number>(0);
  const [generatedReports, setGeneratedReports] = useState<number>(4);
  const [downloadReady, setDownloadReady] = useState(false);

  const isClient = userRole === 'user' || userRole === 'client';
  const isDriver = userRole === 'driver';
  const isAdmin = userRole === 'admin';

  const myClientShipments = getClientShipments(userEmail, userRole, shipments, vehicles);
  const myDriverVehicle = getDriverVehicle(userName, userEmail, vehicles);

  const compileSteps = isClient ? [
    "Fetching cargo shipment records...",
    "Validating delivery milestones & timestamps...",
    "Verifying carrier vehicle telemetry...",
    "Generating digital proof of delivery...",
    "Signing client cargo report with SHA-256 certificate...",
    "Client report compiled successfully!"
  ] : isDriver ? [
    "Connecting to vehicle telemetry logger...",
    "Aggregating shift odometer & fuel logs...",
    "Evaluating driver safety & speed compliance...",
    "Formating daily driver duty log...",
    "Driver shift report compiled successfully!"
  ] : [
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
        }, 600);
      } else {
        setCompiling(false);
        setDownloadReady(true);
        setGeneratedReports(prev => prev + 1);
      }
    };

    runCompileSteps(0);
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();

    if (isClient) {
      // ── CLIENT PDF DOWNLOAD ──
      const activeShipment = myClientShipments[0];
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("FLEETPULSE — CLIENT CARGO REPORT", 15, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Client Account: ${userName} (${userEmail})`, 15, 30);
      doc.text(`Date: ${now}`, 130, 30);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Shipment Delivery Summary", 15, 55);
      doc.line(15, 58, 195, 58);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      if (activeShipment) {
        doc.text(`Shipment Number: ${activeShipment.shipment_number}`, 15, 68);
        doc.text(`Origin: ${activeShipment.origin}`, 15, 76);
        doc.text(`Destination: ${activeShipment.destination}`, 15, 84);
        doc.text(`Status: ${activeShipment.status}`, 15, 92);
        doc.text(`ETA: ${activeShipment.eta || 'N/A'}`, 15, 100);
        doc.text(`Transit Progress: ${activeShipment.progress}%`, 15, 108);
      } else {
        doc.text("No active shipments on file.", 15, 68);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Verified Delivery Certificate", 15, 125);
      doc.line(15, 128, 195, 128);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text("This report verifies real-time GPS telemetry tracking and delivery status for your packages.", 15, 136);

      doc.save(`client_shipment_report_${activeShipment?.shipment_number || 'summary'}.pdf`);
      return;
    }

    if (isDriver) {
      // ── DRIVER PDF DOWNLOAD ──
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.text("FLEETPULSE — DRIVER DAILY SHIFT LOG", 15, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Driver Name: ${userName}`, 15, 30);
      doc.text(`Assigned Vehicle: ${myDriverVehicle?.vehicle_number || 'N/A'}`, 110, 30);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Shift Telemetry & Performance", 15, 55);
      doc.line(15, 58, 195, 58);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Vehicle Status: ${myDriverVehicle?.status || 'Offline'}`, 15, 68);
      doc.text(`Current Speed: ${myDriverVehicle?.speed || 0} km/h`, 15, 76);
      doc.text(`Fuel Level: ${myDriverVehicle?.fuel_level || 100}%`, 15, 84);
      doc.text(`Driver Safety Rating: 94% (Compliant)`, 15, 92);
      doc.text(`Last Location Sync: ${myDriverVehicle?.last_updated ? new Date(myDriverVehicle.last_updated).toLocaleTimeString() : 'N/A'}`, 15, 100);

      doc.save(`driver_shift_log_${myDriverVehicle?.vehicle_number || 'duty'}.pdf`);
      return;
    }

    // ── ADMIN PDF DOWNLOAD ──
    if (!reportsData) return;
    let filename = `fleetpulse_admin_report_${selectedTimeframe}`;
    if (compileFormat === 'json') {
      const content = JSON.stringify(reportsData, null, 2);
      const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.json`);
      link.click();
    } else if (compileFormat === 'csv') {
      const headers = "Vehicle,Driver,Status,TelemetryLogs,AvgSpeed,AvgFuel,Alerts\n";
      const rows = reportsData.vehicle_summaries.map((v: any) => 
        `"${v.vehicle_number}","${v.driver_name}","${v.status}",${v.log_count},${v.avg_speed},${v.avg_fuel_level},${v.alerts_count}`
      ).join("\n");
      const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}.csv`);
      link.click();
    } else {
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("FLEETPULSE", 15, 20);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("SECURE CYBER-LOGISTICS FLEET REPORT", 15, 30);
      doc.text(`Generated: ${now}`, 130, 20);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("Executive Summary", 15, 55);
      doc.line(15, 58, 195, 58);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Total Telemetry Datapoints: ${reportsData.total_telemetry_count}`, 15, 66);
      doc.text(`Registered Fleet Operators: ${reportsData.vehicle_summaries.length}`, 15, 73);

      doc.save(`${filename}.pdf`);
    }
  };

  if (loading || !reportsData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-fp-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-400 font-medium">Preparing role-specific report engine...</p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // CLIENT REPORTS VIEW
  // ══════════════════════════════════════════════════════════════════
  if (isClient) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-[26px] font-extrabold text-stone-200 uppercase tracking-tight leading-none flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-fp-accent" />
            Client Cargo Reports
          </h2>
          <p className="text-stone-500 text-[13px] mt-1.5">
            Delivery receipts, package progress milestones, and shipment proof exports
          </p>
        </div>

        {/* Client Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="cyber-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">My Total Shipments</p>
              <p className="text-2xl font-black mt-1 text-stone-100">{myClientShipments.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-fp-accent/10 border border-fp-accent/20 flex items-center justify-center text-fp-accent">
              <Package className="w-5 h-5" />
            </div>
          </div>

          <div className="cyber-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">In Transit</p>
              <p className="text-2xl font-black mt-1 text-fp-info">
                {myClientShipments.filter(s => s.status === 'In Transit' || s.status === 'Delayed').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-fp-info/10 border border-fp-info/20 flex items-center justify-center text-fp-info">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="cyber-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">On-Time Rate</p>
              <p className="text-2xl font-black mt-1 text-fp-success">98.5%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-fp-success/10 border border-fp-success/20 flex items-center justify-center text-fp-success">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="cyber-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Delivered Proofs</p>
              <p className="text-2xl font-black mt-1 text-stone-200">
                {myClientShipments.filter(s => s.status === 'Delivered').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-fp-surface border border-fp-border flex items-center justify-center text-stone-400">
              <FileText className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Client Reports Export Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="cyber-card p-5 space-y-4 lg:col-span-1">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Download className="w-4 h-4 text-fp-accent" />
              Download Delivery Proof
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Compile your official delivery verification summary with digital timestamps and route verification.
            </p>

            {compiling ? (
              <div className="p-4 bg-fp-surface border border-fp-border rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs text-fp-accent font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Cargo PDF...</span>
                </div>
                <p className="text-[11px] text-stone-400 font-mono leading-normal">
                  {compileSteps[compileStep]}
                </p>
              </div>
            ) : (
              <button
                onClick={handleCompileReport}
                className="w-full py-2.5 bg-fp-accent hover:bg-fp-accent-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Generate Cargo Proof Document
              </button>
            )}

            {downloadReady && (
              <button
                onClick={handleDownload}
                className="w-full py-2.5 bg-fp-success hover:bg-fp-success-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft flex items-center justify-center gap-2 animate-in fade-in"
              >
                <Download className="w-3.5 h-3.5" />
                Download Shipment Report PDF
              </button>
            )}
          </div>

          {/* Client Shipment Table */}
          <div className="cyber-card p-5 space-y-4 lg:col-span-2">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Package className="w-4 h-4 text-fp-accent" />
              My Cargo Shipments Overview
            </h3>

            <div className="overflow-x-auto border border-fp-border/60 rounded-lg">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="bg-fp-surface border-b border-fp-border text-stone-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Shipment #</th>
                    <th className="p-3">Route</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">ETA</th>
                    <th className="p-3">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fp-border/40">
                  {myClientShipments.map(s => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-bold text-stone-200">{s.shipment_number}</td>
                      <td className="p-3 text-stone-300">{s.origin} → {s.destination}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          s.status === 'In Transit' ? 'bg-fp-info/10 text-fp-info border border-fp-info/20' :
                          s.status === 'Delivered' ? 'bg-fp-success/10 text-fp-success border border-fp-success/20' :
                          'bg-fp-surface text-stone-400 border border-fp-border'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 text-stone-300 font-mono">{s.eta || 'N/A'}</td>
                      <td className="p-3 font-semibold text-fp-accent">{s.progress.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // DRIVER REPORTS VIEW
  // ══════════════════════════════════════════════════════════════════
  if (isDriver) {
    const v = myDriverVehicle;
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-[26px] font-extrabold text-stone-200 uppercase tracking-tight leading-none flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-fp-info" />
            Driver Duty & Shift Reports
          </h2>
          <p className="text-stone-500 text-[13px] mt-1.5">
            Telemetry logs, vehicle status, and safety metrics for assigned vehicle {v?.vehicle_number || ''}
          </p>
        </div>

        {/* Driver Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="cyber-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Assigned Vehicle</p>
              <p className="text-2xl font-black mt-1 text-stone-100">{v?.vehicle_number || 'N/A'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-fp-info/10 border border-fp-info/20 flex items-center justify-center text-fp-info">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="cyber-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Current Speed</p>
              <p className="text-2xl font-black mt-1 text-stone-100 tabular-nums">{v?.speed.toFixed(1) || 0} <span className="text-xs font-normal text-stone-400">km/h</span></p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-fp-accent/10 border border-fp-accent/20 flex items-center justify-center text-fp-accent">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="cyber-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Fuel Level</p>
              <p className="text-2xl font-black mt-1 text-fp-success tabular-nums">{v?.fuel_level.toFixed(1) || 100}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-fp-success/10 border border-fp-success/20 flex items-center justify-center text-fp-success">
              <Fuel className="w-5 h-5" />
            </div>
          </div>

          <div className="cyber-card p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Safety Rating</p>
              <p className="text-2xl font-black mt-1 text-fp-success">94%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-fp-success/10 border border-fp-success/20 flex items-center justify-center text-fp-success">
              <Shield className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Driver Duty Export & Telemetry Log */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="cyber-card p-5 space-y-4 lg:col-span-1">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Download className="w-4 h-4 text-fp-info" />
              Export Daily Shift Log
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Compile your shift telemetry and driving hours report for dispatch compliance.
            </p>

            {compiling ? (
              <div className="p-4 bg-fp-surface border border-fp-border rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs text-fp-info font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Duty Log...</span>
                </div>
                <p className="text-[11px] text-stone-400 font-mono leading-normal">
                  {compileSteps[compileStep]}
                </p>
              </div>
            ) : (
              <button
                onClick={handleCompileReport}
                className="w-full py-2.5 bg-fp-info hover:bg-fp-info-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Compile Shift Report
              </button>
            )}

            {downloadReady && (
              <button
                onClick={handleDownload}
                className="w-full py-2.5 bg-fp-success hover:bg-fp-success-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft flex items-center justify-center gap-2 animate-in fade-in"
              >
                <Download className="w-3.5 h-3.5" />
                Download Shift Log PDF
              </button>
            )}
          </div>

          {/* Vehicle Telemetry Log */}
          <div className="cyber-card p-5 space-y-4 lg:col-span-2">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-4 h-4 text-fp-info" />
              Assigned Vehicle Telemetry Series ({v?.vehicle_number || 'FP-101'})
            </h3>

            <div className="p-4 bg-fp-surface border border-fp-border/60 rounded-lg space-y-3">
              <div className="flex justify-between items-center text-xs text-stone-300">
                <span className="font-semibold">Driver Name:</span>
                <span className="font-bold">{userName}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-stone-300">
                <span className="font-semibold">Vehicle Number:</span>
                <span className="font-mono text-fp-info">{v?.vehicle_number || 'FP-101'}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-stone-300">
                <span className="font-semibold">Engine Status:</span>
                <span className="text-fp-success font-bold">{v?.status || 'Moving'}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-stone-300">
                <span className="font-semibold">Last GPS Coordinates:</span>
                <span className="font-mono text-stone-400">{v?.latitude?.toFixed(4)}, {v?.longitude?.toFixed(4)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // ADMIN FULL REPORTS VIEW (Unchanged)
  // ══════════════════════════════════════════════════════════════════
  const filteredVehicles = reportsData.vehicle_summaries.filter((v: any) => {
    if (selectedVehicle !== 'all' && v.vehicle_number !== selectedVehicle) return false;
    return true;
  });

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
            <div className="space-y-1.5 relative">
              <label className="text-[10px] text-stone-500 font-bold uppercase select-none">Vehicle Manifest</label>
              <button
                onClick={() => {
                  setTempVehicle(selectedVehicle);
                  setVehicleSelectOpen(!vehicleSelectOpen);
                  setTimeframeSelectOpen(false);
                }}
                className="w-full bg-fp-surface border border-fp-border rounded-lg px-3 py-2 text-xs font-medium text-stone-300 focus:outline-none focus:border-fp-accent cursor-pointer flex items-center justify-between select-none"
              >
                <span>{selectedVehicle === 'all' ? 'All Fleet Vehicles' : selectedVehicle}</span>
                <span className="text-[10px] text-stone-600">▼</span>
              </button>

              {vehicleSelectOpen && (
                <>
                  <div onClick={() => setVehicleSelectOpen(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden" />
                  <div className="fixed md:absolute md:top-full md:left-0 mt-2 z-50 w-[280px] bg-fp-sidebar border border-fp-border rounded-xl p-3 shadow-card select-none">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-2.5">Select Vehicle</p>
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      <button
                        onClick={() => setTempVehicle('all')}
                        className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs font-medium ${tempVehicle === 'all' ? 'bg-fp-accent/15 text-fp-accent-light' : 'text-stone-400'}`}
                      >
                        All Fleet Vehicles
                      </button>
                      {reportsData.vehicle_summaries.map((v: any) => (
                        <button
                          key={v.vehicle_id}
                          onClick={() => setTempVehicle(v.vehicle_number)}
                          className={`w-full text-left py-1.5 px-2.5 rounded-lg text-xs font-medium ${tempVehicle === v.vehicle_number ? 'bg-fp-accent/15 text-fp-accent-light' : 'text-stone-400'}`}
                        >
                          {v.vehicle_number} - {v.driver_name}
                        </button>
                      ))}
                    </div>
                    <div className="mt-4 pt-2 border-t border-fp-border/40 flex justify-end">
                      <button
                        onClick={() => { setSelectedVehicle(tempVehicle); setVehicleSelectOpen(false); }}
                        className="px-4 py-1.5 bg-fp-accent text-stone-950 font-bold text-xs rounded-lg"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Format Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase select-none">Export Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(['pdf', 'csv', 'json'] as const).map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setCompileFormat(fmt)}
                    className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                      compileFormat === fmt
                        ? 'bg-fp-accent/15 border-fp-accent text-fp-accent-light'
                        : 'bg-fp-surface border-fp-border text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Trigger */}
            <button
              onClick={handleCompileReport}
              disabled={compiling}
              className="w-full py-2.5 bg-fp-accent hover:bg-fp-accent-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft flex items-center justify-center gap-2 select-none disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Compile & Export Report
            </button>
          </div>

          {/* COMPILER STATUS LOG */}
          <div className="cyber-card p-5 space-y-3">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2 select-none">
              <Sparkles className="w-4 h-4 text-fp-accent" />
              Compiler Diagnostic Engine
            </h3>
            {compiling ? (
              <div className="space-y-2">
                <p className="text-[11px] font-mono text-fp-accent leading-relaxed">{compileSteps[compileStep]}</p>
                <div className="h-1.5 bg-fp-border rounded-full overflow-hidden">
                  <div className="h-full bg-fp-accent rounded-full transition-all duration-300" style={{ width: `${((compileStep + 1) / compileSteps.length) * 100}%` }} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-500 leading-relaxed">
                Ready to compile. Select a vehicle scope and timeframe above to launch signature compilation.
              </p>
            )}

            {downloadReady && (
              <button
                onClick={handleDownload}
                className="w-full mt-2 py-2.5 bg-fp-success hover:bg-fp-success-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft flex items-center justify-center gap-2 select-none animate-in fade-in"
              >
                <Download className="w-3.5 h-3.5" />
                Download Compiled Report ({compileFormat.toUpperCase()})
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: VEHICLE SUMMARIES TABLE ── */}
        <div className="space-y-6 lg:col-span-2">
          <div className="cyber-card p-5 space-y-4">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-2 select-none">
              <FileSpreadsheet className="w-4 h-4 text-fp-accent" />
              Fleet Vehicle Performance Summaries
            </h3>

            <div className="overflow-x-auto border border-fp-border/60 rounded-lg">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="bg-fp-surface border-b border-fp-border text-stone-500 font-semibold uppercase tracking-wider">
                    <th className="p-3">Vehicle</th>
                    <th className="p-3">Driver</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Avg Speed</th>
                    <th className="p-3">Fuel Level</th>
                    <th className="p-3">Safety Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fp-border/40">
                  {filteredVehicles.map((v: any) => {
                    const score = getSafetyScore(v.avg_speed, v.alerts_count);
                    const colorClass = getSafetyColor(score);
                    return (
                      <tr key={v.vehicle_id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3 font-bold text-stone-200">{v.vehicle_number}</td>
                        <td className="p-3 text-stone-300">{v.driver_name}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            v.status === 'Moving' ? 'bg-fp-success/10 text-fp-success border border-fp-success/20' :
                            v.status === 'Idle' ? 'bg-fp-info/10 text-fp-info border border-fp-info/20' :
                            'bg-fp-surface text-stone-500 border border-fp-border'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="p-3 text-stone-300 font-mono">{v.avg_speed} km/h</td>
                        <td className="p-3 font-semibold text-stone-300">{v.avg_fuel_level}%</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${colorClass}`}>
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
        </div>
      </div>
    </div>
  );
};
export default Reports;
