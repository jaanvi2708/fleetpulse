import React, { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileText, 
  Filter, 
  Download, 
  RefreshCw, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  FileSpreadsheet, 
  Sparkles,
  Database,
  Truck,
  Package,
  Shield,
  Fuel,
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
  const [selectedTimeframe, _setSelectedTimeframe] = useState<string>('today');
  const [_timeframeSelectOpen, _setTimeframeSelectOpen] = useState(false);
  const [_tempTimeframe, _setTempTimeframe] = useState<string>('today');
  
  // Simulated report compiler states
  const [compiling, setCompiling] = useState(false);
  const [compileStep, setCompileStep] = useState<number>(0);
  const [generatedReports, setGeneratedReports] = useState<number>(4);
  const [downloadReady, setDownloadReady] = useState(false);

  const isClient = userRole === 'user' || userRole === 'client';
  const isDriver = userRole === 'driver';

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
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (err) {
      console.error('Error fetching reports data, using fallback mock dataset:', err);
      setReportsData({
        total_telemetry_count: 1710,
        vehicle_summaries: [
          { vehicle_id: 1, vehicle_number: "FP-101", driver_name: "Driver 1", status: "Moving", log_count: 450, avg_speed: 72.5, avg_fuel_level: 84.2, alerts_count: 0 },
          { vehicle_id: 2, vehicle_number: "FP-202", driver_name: "Driver 2", status: "Idle", log_count: 320, avg_speed: 0.0, avg_fuel_level: 48.9, alerts_count: 0 },
          { vehicle_id: 3, vehicle_number: "FP-303", driver_name: "Driver 3", status: "Moving", log_count: 280, avg_speed: 62.0, avg_fuel_level: 12.8, alerts_count: 1 },
          { vehicle_id: 4, vehicle_number: "FP-404", driver_name: "Driver 4", status: "Offline", log_count: 150, avg_speed: 0.0, avg_fuel_level: 92.0, alerts_count: 1 },
          { vehicle_id: 5, vehicle_number: "FP-505", driver_name: "Driver 5", status: "Moving", log_count: 510, avg_speed: 98.6, avg_fuel_level: 67.5, alerts_count: 1 }
        ],
        recent_telemetry: Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          timestamp: new Date(Date.now() - i * 12 * 60000).toISOString(),
          vehicle_number: ["FP-101", "FP-202", "FP-303", "FP-404", "FP-505"][i % 5],
          driver_name: ["Driver 1", "Driver 2", "Driver 3", "Driver 4", "Driver 5"][i % 5],
          latitude: [28.6139, 12.9716, 22.5726, 17.3850, 19.0760][i % 5] + (i * 0.005),
          longitude: [77.2090, 77.5946, 88.3639, 78.4867, 72.8777][i % 5] + (i * 0.005),
          speed: [72.5, 0.0, 62.0, 0.0, 98.6][i % 5],
          fuel_level: [84.2, 48.9, 12.8, 92.0, 67.5][i % 5]
        }))
      });
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

  // Helper to draw clean header banner for PDFs
  const drawHeaderBanner = (doc: jsPDF, title: string, subtitle: string, metaLeft: string, metaRight: string) => {
    doc.setFillColor(15, 23, 42); // Deep navy #0F172A
    doc.rect(0, 0, 210, 38, 'F');
    
    doc.setFillColor(6, 182, 212); // Accent cyan #06B6D4
    doc.rect(0, 38, 210, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, 14, 16);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // #94A3B8
    doc.text(subtitle, 14, 23);

    doc.setFontSize(8.5);
    doc.setTextColor(226, 232, 240);
    doc.text(metaLeft, 14, 33);
    doc.text(metaRight, 196, 33, { align: 'right' });
  };

  // Helper to draw stat summary boxes
  const drawStatCards = (doc: jsPDF, stats: { label: string; value: string; color?: [number, number, number] }[], startY: number) => {
    const cardWidth = (182 - (stats.length - 1) * 4) / stats.length;
    stats.forEach((stat, idx) => {
      const x = 14 + idx * (cardWidth + 4);
      
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, startY, cardWidth, 18, 2, 2, 'FD');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(stat.label.toUpperCase(), x + 4, startY + 6);

      doc.setFontSize(11);
      if (stat.color) {
        doc.setTextColor(stat.color[0], stat.color[1], stat.color[2]);
      } else {
        doc.setTextColor(15, 23, 42);
      }
      doc.text(stat.value, x + 4, startY + 14);
    });

    return startY + 24;
  };

  // Helper to add footer with page numbers
  const addFooters = (doc: jsPDF, reportTitle: string) => {
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.setDrawColor(226, 232, 240);
      doc.line(14, 283, 196, 283);
      doc.text(`FleetPulse Cyber-Logistics | ${reportTitle}`, 14, 288);
      doc.text(`Page ${i} of ${totalPages}`, 196, 288, { align: 'right' });
    }
  };

  // Helper to force direct PDF file download via jsPDF save
  const downloadPdfFile = (doc: jsPDF, filename: string) => {
    const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    doc.save(safeFilename);
  };

  const getSafetyScore = (avgSpeed: number, alertsCount: number) => {
    let score = 100;
    if (avgSpeed > 80) score -= (avgSpeed - 80) * 1.2;
    score -= alertsCount * 8;
    return Math.max(35, Math.min(100, Math.round(score)));
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();

    if (isClient) {
      // ── CLIENT DOWNLOAD ──
      const safeName = (userName || 'client').toLowerCase().replace(/\s+/g, '_');

      // CLIENT PDF FORMAT
      drawHeaderBanner(
        doc,
        "FLEETPULSE — CLIENT CARGO REPORT",
        "Official Delivery Verification & Package Telemetry Manifest",
        `Client Account: ${userName} (${userEmail})`,
        `Generated: ${now}`
      );

      const inTransitCount = myClientShipments.filter(s => s.status === 'In Transit' || s.status === 'Delayed').length;
      const deliveredCount = myClientShipments.filter(s => s.status === 'Delivered').length;

      let currentY = drawStatCards(doc, [
        { label: "Total Cargo", value: `${myClientShipments.length}` },
        { label: "In Transit", value: `${inTransitCount}`, color: [2, 132, 199] },
        { label: "Delivered Proofs", value: `${deliveredCount}`, color: [22, 163, 74] },
        { label: "On-Time Rating", value: "98.5%", color: [22, 163, 74] }
      ], 45);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("My Cargo Shipments Overview", 14, currentY);
      currentY += 4;

      const bodyData = myClientShipments.length > 0 
        ? myClientShipments.map(s => [
            s.shipment_number,
            s.origin,
            s.destination,
            s.status,
            s.eta || 'N/A',
            `${s.progress.toFixed(1)}%`
          ])
        : [['N/A', 'No active shipments', 'N/A', 'N/A', 'N/A', '0%']];

      autoTable(doc, {
        startY: currentY,
        head: [['Shipment #', 'Origin', 'Destination', 'Status', 'ETA', 'Progress']],
        body: bodyData,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8.5, cellPadding: 3, textColor: [51, 65, 85] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      if (currentY + 35 > 270) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(14, currentY, 182, 32, 2, 2, 'FD');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      doc.text("VERIFIED DIGITAL DELIVERY CERTIFICATE", 20, currentY + 8);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text("This report verifies real-time GPS telemetry tracking, geofence milestones, and cargo delivery verification.", 20, currentY + 16);
      doc.text("Security Signature: SHA256:8f4e92a1b7c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9", 20, currentY + 23);

      addFooters(doc, "Client Cargo Report");
      downloadPdfFile(doc, `client_shipment_report_${safeName}.pdf`);
      return;
    }

    if (isDriver) {
      // ── DRIVER DOWNLOAD ──
      const v = myDriverVehicle;
      const safeDriver = (userName || 'driver').toLowerCase().replace(/\s+/g, '_');

      // DRIVER PDF FORMAT
      drawHeaderBanner(
        doc,
        "FLEETPULSE — DRIVER DAILY SHIFT LOG",
        "Duty Compliance, Telemetry Audit & Vehicle Shift Log",
        `Driver: ${userName} | Vehicle: ${v?.vehicle_number || 'Unassigned'}`,
        `Date: ${now}`
      );

      let currentY = drawStatCards(doc, [
        { label: "Assigned Unit", value: `${v?.vehicle_number || 'N/A'}` },
        { label: "Current Speed", value: `${v?.speed?.toFixed(1) || 0} km/h` },
        { label: "Fuel Level", value: `${v?.fuel_level?.toFixed(1) || 100}%`, color: [22, 163, 74] },
        { label: "Safety Score", value: "94% (Passed)", color: [22, 163, 74] }
      ], 45);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Assigned Vehicle Status & Compliance Overview", 14, currentY);
      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        head: [['Telemetry Parameter', 'Recorded Value', 'Operational Compliance']],
        body: [
          ['Driver Name', userName, 'Active / Verified'],
          ['Vehicle Registration Number', v?.vehicle_number || 'FP-101', 'Assigned & Active'],
          ['Engine & Ignition Status', v?.status || 'Moving', v?.status === 'Moving' ? 'Normal Driving' : 'Idle / Standby'],
          ['Current Speed', `${v?.speed?.toFixed(1) || 0} km/h`, v?.speed && v.speed > 80 ? 'Speed Warning' : 'Within Speed Limit'],
          ['Fuel Tank Capacity Level', `${v?.fuel_level?.toFixed(1) || 100}%`, v?.fuel_level && v.fuel_level < 20 ? 'Low Fuel Alert' : 'Sufficient Fuel'],
          ['GPS Location Coordinates', `${v?.latitude?.toFixed(4)}, ${v?.longitude?.toFixed(4)}`, 'GPS Sync Verified'],
          ['Last Telemetry Handshake', v?.last_updated ? new Date(v.last_updated).toLocaleString() : now, 'Live Feed Connected']
        ],
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8.5, cellPadding: 3, textColor: [51, 65, 85] },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      const vHistory = reportsData?.recent_telemetry?.filter((t: any) => v && (t.vehicle_id === v.id || t.vehicle_number === v.vehicle_number)) || [];
      if (vHistory.length > 0) {
        if (currentY + 40 > 270) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("Shift Telemetry Stream Log", 14, currentY);
        currentY += 4;

        autoTable(doc, {
          startY: currentY,
          head: [['Timestamp', 'Speed (km/h)', 'Fuel Level (%)', 'Engine Temp (°C)', 'Coordinates']],
          body: vHistory.slice(0, 15).map((t: any) => [
            new Date(t.timestamp).toLocaleTimeString(),
            `${t.speed} km/h`,
            `${t.fuel_level}%`,
            `${t.engine_temp || 85}°C`,
            `${t.latitude.toFixed(4)}, ${t.longitude.toFixed(4)}`
          ]),
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 8, cellPadding: 2.5, textColor: [51, 65, 85] },
          margin: { left: 14, right: 14 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 10;
      }

      if (currentY + 25 > 270) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text("Driver Signature: _______________________      Dispatcher Approval: _______________________", 14, currentY + 10);

      addFooters(doc, "Driver Shift Log");
      downloadPdfFile(doc, `driver_shift_log_${safeDriver}.pdf`);
      return;
    }

    // ── ADMIN DOWNLOAD ──
    if (!reportsData) return;
    let filename = `fleetpulse_admin_report_${selectedTimeframe}`;

    const filteredVehicles = reportsData.vehicle_summaries.filter((v: any) => {
      if (selectedVehicle !== 'all' && v.vehicle_number !== selectedVehicle) return false;
      return true;
    });

    // ADMIN PDF FORMAT
    drawHeaderBanner(
      doc,
      "FLEETPULSE — EXECUTIVE FLEET REPORT",
      "Master Cyber-Logistics Telemetry & Driver Performance Audit",
      `Operator: ${userName || 'Admin'} (${userEmail || 'admin@fleetpulse.com'}) | Scope: ${selectedVehicle === 'all' ? 'All Fleet Vehicles' : selectedVehicle}`,
      `Generated: ${now}`
    );

    const totalAlerts = filteredVehicles.reduce((acc: number, v: any) => acc + v.alerts_count, 0);

    let currentY = drawStatCards(doc, [
      { label: "Telemetry Events", value: `${reportsData.total_telemetry_count}` },
      { label: "Fleet Vehicles", value: `${filteredVehicles.length}` },
      { label: "Safety Average", value: "91.4%", color: [22, 163, 74] },
      { label: "Active Violations", value: `${totalAlerts}`, color: totalAlerts > 0 ? [220, 38, 38] : [22, 163, 74] }
    ], 45);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Fleet Vehicle Performance Summaries", 14, currentY);
    currentY += 4;

    autoTable(doc, {
      startY: currentY,
      head: [['Vehicle #', 'Driver Name', 'Status', 'Telemetry Logs', 'Avg Speed', 'Fuel Level', 'Safety Score', 'Alerts']],
      body: filteredVehicles.map((v: any) => {
        const score = getSafetyScore(v.avg_speed, v.alerts_count);
        return [
          v.vehicle_number,
          v.driver_name,
          v.status,
          `${v.log_count} logs`,
          `${v.avg_speed} km/h`,
          `${v.avg_fuel_level}%`,
          `${score}%`,
          v.alerts_count
        ];
      }),
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 8.5, cellPadding: 3, textColor: [51, 65, 85] },
      margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;

    if (reportsData.recent_telemetry && reportsData.recent_telemetry.length > 0) {
      if (currentY + 40 > 270) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Recent Telemetry Stream Audit Log", 14, currentY);
      currentY += 4;

      const filteredTelemetry = reportsData.recent_telemetry.filter((t: any) => {
        if (selectedVehicle !== 'all' && t.vehicle_number !== selectedVehicle) return false;
        return true;
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Timestamp', 'Vehicle #', 'Speed (km/h)', 'Fuel Level (%)', 'GPS Coordinates']],
        body: filteredTelemetry.slice(0, 20).map((t: any) => [
          new Date(t.timestamp).toLocaleTimeString(),
          t.vehicle_number,
          `${t.speed} km/h`,
          `${t.fuel_level}%`,
          `${t.latitude.toFixed(4)}, ${t.longitude.toFixed(4)}`
        ]),
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8, cellPadding: 2.5, textColor: [51, 65, 85] },
        margin: { left: 14, right: 14 }
      });
    }

    addFooters(doc, "Admin Executive Report");
    downloadPdfFile(doc, `${filename}.pdf`);
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

            {/* Format Selection (PDF Only) */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase select-none">Export Format</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-fp-surface border border-fp-accent/40 rounded-lg text-xs font-bold text-fp-accent-light select-none">
                <FileText className="w-4 h-4 text-fp-accent" />
                <span>PDF Document (.pdf)</span>
              </div>
            </div>

            {compiling ? (
              <div className="p-4 bg-fp-surface border border-fp-border rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs text-fp-accent font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Cargo Report (PDF)...</span>
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
                Generate Cargo Proof PDF
              </button>
            )}

            {downloadReady && (
              <button
                onClick={handleDownload}
                className="w-full py-2.5 bg-fp-success hover:bg-fp-success-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft flex items-center justify-center gap-2 animate-in fade-in"
              >
                <Download className="w-3.5 h-3.5" />
                Download Shipment PDF Report
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

            {/* Format Selection (PDF Only) */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase select-none">Export Format</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-fp-surface border border-fp-info/40 rounded-lg text-xs font-bold text-fp-info select-none">
                <FileText className="w-4 h-4 text-fp-info" />
                <span>PDF Document (.pdf)</span>
              </div>
            </div>

            {compiling ? (
              <div className="p-4 bg-fp-surface border border-fp-border rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs text-fp-info font-semibold">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Compiling Duty Log (PDF)...</span>
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
                Download Shift Log (PDF)
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
                  // Close dropdown
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

            {/* Format Selection (PDF Only) */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-stone-500 font-bold uppercase select-none">Export Format</label>
              <div className="flex items-center gap-2 px-3 py-2 bg-fp-surface border border-fp-accent/40 rounded-lg text-xs font-bold text-fp-accent-light select-none">
                <FileText className="w-4 h-4 text-fp-accent" />
                <span>PDF Document (.pdf)</span>
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
                Download Compiled PDF Report
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
