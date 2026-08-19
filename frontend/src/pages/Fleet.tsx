import React, { useEffect, useState } from 'react';
import {
  Search, SlidersHorizontal, ArrowUpDown, X,
  ArrowRightLeft, Calendar, User, Truck,
  MapPin, Clock, Fuel, Activity, ChevronRight,
  Shield, Star, Phone, Award
} from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';
import type { Vehicle } from '../store/fleetStore';
import { LiveMap } from '../components/LiveMap';

// ── Indian Highway routes aligned exactly with backend simulator waypoints ──
// FP-101 (Aarav Mehta)    → Delhi → Udaipur via NH-48    [lat 28.61, lng 77.20]
// FP-202 (Priya Nair)     → Bangalore → Chennai via NH-48 [lat 12.97, lng 77.59]
// FP-303 (Rohan Deshmukh) → Kolkata → Bhubaneswar NH-16  [lat 22.57, lng 88.36]
// FP-404 (Karan Johar)    → Hyderabad → Bangalore NH-44  [lat 17.38, lng 78.48]
// FP-505 (Arjun Sharma)   → Mumbai → Ahmedabad via NH-48  [lat 19.07, lng 72.87]

const VEHICLE_REGION_TRIPS: Record<string, Array<{
  from: string; to: string; highway: string; km: number; cargo: string;
}>> = {
  'FP-101': [
    { from: 'Delhi, DL',          to: 'Udaipur, RJ',         highway: 'NH-48',   km: 660, cargo: 'Electronics — 18 pallets' },
    { from: 'Delhi, DL',          to: 'Gurugram, HR',        highway: 'NH-48',   km: 35,  cargo: 'Courier Packages — 100 units' },
    { from: 'Gurugram, HR',       to: 'Jaipur, RJ',          highway: 'NH-48',   km: 235, cargo: 'Spare Parts — 14 pallets' },
    { from: 'Jaipur, RJ',         to: 'Udaipur, RJ',         highway: 'NH-48',   km: 390, cargo: 'Handicrafts — 20 pallets' },
  ],
  'FP-202': [
    { from: 'Bangalore, KA',     to: 'Chennai, TN',         highway: 'NH-48',   km: 346, cargo: 'Consumer Goods — 16 pallets' },
    { from: 'Bangalore, KA',     to: 'Hosur, TN',           highway: 'NH-48',   km: 40,  cargo: 'Machinery — 6 units' },
    { from: 'Hosur, TN',         to: 'Krishnagiri, TN',     highway: 'NH-48',   km: 50,  cargo: 'Packaged Food — 24 pallets' },
    { from: 'Krishnagiri, TN',   to: 'Vellore, TN',         highway: 'NH-48',   km: 125, cargo: 'Medical Supplies' },
    { from: 'Vellore, TN',       to: 'Kanchipuram, TN',     highway: 'NH-48',   km: 70,  cargo: 'Construction Materials' },
  ],
  'FP-303': [
    { from: 'Kolkata, WB',       to: 'Bhubaneswar, OD',     highway: 'NH-16',   km: 440, cargo: 'Apparel — 22 pallets' },
    { from: 'Kolkata, WB',       to: 'Kharagpur, WB',       highway: 'NH-16',   km: 130, cargo: 'Iron and Steel — 10 pallets' },
    { from: 'Kharagpur, WB',     to: 'Balasore, OD',        highway: 'NH-16',   km: 120, cargo: 'Office Furniture — 12 units' },
    { from: 'Balasore, OD',      to: 'Bhadrak, OD',         highway: 'NH-16',   km: 75,  cargo: 'Electronics — 20 pallets' },
  ],
  'FP-404': [
    { from: 'Hyderabad, TG',     to: 'Bangalore, KA',       highway: 'NH-44',   km: 570, cargo: 'Auto Parts — Tata OEM' },
    { from: 'Hyderabad, TG',     to: 'Kurnool, AP',         highway: 'NH-44',   km: 210, cargo: 'Cement Bags — 400 bags' },
    { from: 'Kurnool, AP',       to: 'Anantapur, AP',       highway: 'NH-44',   km: 150, cargo: 'Beverages — 28 pallets' },
    { from: 'Anantapur, AP',     to: 'Bangalore, KA',       highway: 'NH-44',   km: 210, cargo: 'Plastic Resin — Tanker' },
  ],
  'FP-505': [
    { from: 'Mumbai, MH',        to: 'Ahmedabad, GJ',       highway: 'NH-48',   km: 530, cargo: 'Pharmaceuticals — 12 pallets' },
    { from: 'Mumbai, MH',        to: 'Surat, GJ',           highway: 'NH-48',   km: 284, cargo: 'Auto Components — Bajaj Auto' },
    { from: 'Surat, GJ',         to: 'Vadodara, GJ',        highway: 'NH-48',   km: 150, cargo: 'Textiles — 26 pallets' },
    { from: 'Vadodara, GJ',      to: 'Ahmedabad, GJ',       highway: 'NH-48',   km: 100, cargo: 'Consumer Goods — 20 pallets' },
  ],
};

const TRIP_STATUSES = ['Completed', 'Completed', 'On Time', 'Completed', 'Delayed', 'Completed'];

const generateTripHistory = (vehicleNumber: string) => {
  const routes = VEHICLE_REGION_TRIPS[vehicleNumber] ?? VEHICLE_REGION_TRIPS['FP-101'];
  return routes.map((route, i) => {
    const daysAgo = i * 3 + 1;
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    const avgSpeed = 62 + (i * 7) % 22;
    const durationH = Math.floor(route.km / avgSpeed);
    const durationM = Math.round((route.km / avgSpeed % 1) * 60);
    return {
      id: i + 1,
      tripId: `TRP-${vehicleNumber.replace('FP-', '')}-${2024100 + i}`,
      origin: route.from,
      destination: route.to,
      highway: route.highway,
      distance: route.km,
      cargo: route.cargo,
      duration: `${durationH}h ${String(durationM).padStart(2, '0')}m`,
      status: TRIP_STATUSES[i % TRIP_STATUSES.length],
      date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      fuelUsed: Math.round(route.km / 3.4),
      avgSpeed,
    };
  });
};

// ── Full driver profiles aligned to real backend vehicle seed locations ───────
const DRIVER_PROFILES: Record<string, {
  homeAddress: string; city: string; stateCode: string; zip: string;
  phone: string; cdlNumber: string; cdlClass: string; cdlExpiry: string;
  vehicleType: string;
}> = {
  'FP-101': {
    homeAddress: '12, Connaught Place', city: 'Delhi', stateCode: 'DL', zip: '110001',
    phone: '+91 98100 12345',     cdlNumber: 'DL-14-20210084731',  cdlClass: 'Heavy Motor Vehicle (HMV)',
    cdlExpiry: 'Mar 2028',          vehicleType: '18-Wheeler Flatbed',
  },
  'FP-202': {
    homeAddress: '45, MG Road', city: 'Bangalore', stateCode: 'KA', zip: '560001',
    phone: '+91 98450 67890',         cdlNumber: 'KA-03-20190345210', cdlClass: 'Heavy Motor Vehicle (HMV)',
    cdlExpiry: 'Jul 2029',              vehicleType: 'Refrigerated Semi',
  },
  'FP-303': {
    homeAddress: '88, Park Street', city: 'Kolkata',    stateCode: 'WB', zip: '700016',
    phone: '+91 98300 54321',    cdlNumber: 'WB-01-20204829104', cdlClass: 'HMV + Hazardous Cargo License',
    cdlExpiry: 'Nov 2027',         vehicleType: 'Tanker / Dry Van',
  },
  'FP-404': {
    homeAddress: '22, Banjara Hills', city: 'Hyderabad', stateCode: 'TG', zip: '500034',
    phone: '+91 98490 98765',         cdlNumber: 'TG-09-20213028147', cdlClass: 'Medium Passenger/Goods Vehicle',
    cdlExpiry: 'Feb 2029',              vehicleType: 'Enclosed Cargo Van',
  },
  'FP-505': {
    homeAddress: 'Plot 47, Andheri West', city: 'Mumbai', stateCode: 'MH', zip: '400053',
    phone: '+91 98204 73815',              cdlNumber: 'MH-02-20220047831', cdlClass: 'Transport Vehicle — Hazmat',
    cdlExpiry: 'Dec 2026',                vehicleType: 'Heavy Goods Vehicle (HGV)',
  },
};

const getDriverProfile = (driverName: string, vehicleNumber: string) => {
  const seed = driverName.charCodeAt(0);
  const p = DRIVER_PROFILES[vehicleNumber] ?? DRIVER_PROFILES['FP-101'];
  return {
    name: driverName,
    id: `DRV-${vehicleNumber.replace('FP-', '')}-IN`,
    homeAddress: `${p.homeAddress}, ${p.city}, ${p.stateCode} ${p.zip}`,
    city: `${p.city}, ${p.stateCode}`,
    vehicleType: p.vehicleType,
    cdlNumber: p.cdlNumber,
    cdlClass: p.cdlClass,
    cdlExpiry: p.cdlExpiry,
    experience: `${3 + (seed % 8)} years`,
    rating: (4.1 + (seed % 9) * 0.1).toFixed(1),
    totalTrips: 120 + (seed % 300),
    totalMiles: `${(9000 + (seed % 25000)).toLocaleString()} km`,
    onTimeRate: `${82 + (seed % 15)}%`,
    phone: p.phone,
    status: 'Active',
    joinDate: `${['Jan', 'Mar', 'Jun', 'Aug'][seed % 4]} 202${2 + (seed % 2)}`,
    safetyScore: 88 + (seed % 12),
  };
};

type SidePanelTab = 'details' | 'driver' | 'trips';

export const Fleet: React.FC = () => {
  const token = useFleetStore((state) => state.token);
  const vehicles = useFleetStore((state) => state.vehicles);
  const setVehicles = useFleetStore((state) => state.setVehicles);
  const selectedVehicleId = useFleetStore((state) => state.selectedVehicleId);
  const selectVehicle = useFleetStore((state) => state.selectVehicle);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const [selectedStatusTemp, setSelectedStatusTemp] = useState('All');
  const [sortField, setSortField] = useState<keyof Vehicle>('vehicle_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [detailedVehicle, setDetailedVehicle] = useState<Vehicle | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>('details');

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/vehicles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setVehicles(await res.json());
      } catch (err) {
        console.error('Fleet fetch error:', err);
      }
    };
    fetchVehicles();
  }, [token, setVehicles]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (selectedVehicleId === null) { setDetailedVehicle(null); return; }
      setLoadingDetails(true);
      try {
        const res = await fetch(`http://localhost:8000/api/vehicles/${selectedVehicleId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) setDetailedVehicle(await res.json());
      } catch (err) {
        console.error('Vehicle detail error:', err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchDetails();
    setSidePanelTab('details'); // reset to details on new selection
  }, [selectedVehicleId, token, vehicles]);

  const handleSort = (field: keyof Vehicle) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  const filteredVehicles = vehicles
    .filter(v => {
      const matchSearch =
        v.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driver_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'All' || v.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const valA = a[sortField], valB = b[sortField];
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (typeof valA === 'string' && typeof valB === 'string')
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      return sortOrder === 'asc'
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    });

  const statusColors: Record<string, string> = {
    Moving: 'bg-fp-success/10 text-fp-success border-fp-success/20',
    Idle: 'bg-fp-info/10 text-fp-info border-fp-info/20',
    Stopped: 'bg-fp-muted/10 text-fp-muted border-fp-muted/20',
    Offline: 'bg-fp-surface text-stone-500 border-fp-border',
    Delayed: 'bg-fp-danger/10 text-fp-danger border-fp-danger/20',
  };

  const tripStatusColor: Record<string, string> = {
    Completed: 'text-fp-success',
    'On Time': 'text-fp-info',
    Delayed: 'text-fp-danger',
  };

  const SortHeader = ({ label, field }: { label: string; field: keyof Vehicle }) => (
    <th
      onClick={() => handleSort(field)}
      className="p-3.5 cursor-pointer text-left text-[10px] text-stone-500 font-bold uppercase tracking-wider hover:text-stone-300 transition-colors select-none"
    >
      <div className="flex items-center gap-1.5">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-fp-accent' : 'opacity-40'}`} />
      </div>
    </th>
  );

  return (
    <div className="space-y-5 relative">

      {/* Page Header */}
      <div>
        <h2 className="text-[26px] font-extrabold text-stone-200 uppercase tracking-tight leading-none">
          Fleet Status
        </h2>
        <p className="text-stone-500 text-[13px] mt-1.5">
          Real-time telemetry, driver profiles & complete trip history
        </p>
      </div>

      {/* Summary badges */}
      <div className="flex items-center gap-3 flex-wrap">
        {[
          { label: 'Total', count: vehicles.length, color: 'text-stone-300 bg-white/5 border-fp-border' },
          { label: 'Moving', count: vehicles.filter(v => v.status === 'Moving').length, color: 'text-fp-success bg-fp-success/10 border-fp-success/15' },
          { label: 'Idle', count: vehicles.filter(v => v.status === 'Idle').length, color: 'text-fp-info bg-fp-info/10 border-fp-info/15' },
          { label: 'Stopped', count: vehicles.filter(v => v.status === 'Stopped' || v.status === 'Offline').length, color: 'text-fp-muted bg-fp-muted/10 border-fp-muted/15' },
          { label: 'Delayed', count: vehicles.filter(v => v.status === 'Delayed').length, color: 'text-fp-danger bg-fp-danger/10 border-fp-danger/15' },
        ].map(item => (
          <div key={item.label} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-semibold ${item.color}`}>
            <span className="font-black text-base leading-none">{item.count}</span>
            <span className="opacity-80">{item.label}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── LEFT: Vehicle Table ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center cyber-card px-4 py-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
              <input
                type="text"
                placeholder="Search vehicle or driver..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-fp-surface border border-fp-border rounded-lg py-2 pl-9 pr-4 text-[12px] text-stone-200 placeholder-stone-600 focus:outline-none focus:border-fp-accent transition-colors"
              />
            </div>
            <div className="relative">
              <button
                onClick={() => {
                  setSelectedStatusTemp(statusFilter);
                  setStatusFilterOpen(!statusFilterOpen);
                }}
                className="bg-fp-surface border border-fp-border rounded-lg py-2 px-3 text-[12px] text-stone-300 hover:border-fp-accent/40 hover:text-stone-200 transition-colors flex items-center gap-2 select-none"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
                <span>Status: {statusFilter === 'All' ? 'All Statuses' : statusFilter}</span>
              </button>

              {statusFilterOpen && (
                <>
                  {/* Mobile backdrop to block page interaction and close menu when tapping outside */}
                  <div 
                    onClick={() => setStatusFilterOpen(false)} 
                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
                  />
                  
                  {/* Dropdown panel */}
                  <div className="fixed md:absolute md:top-full md:left-0 mt-2 z-50 w-[240px] md:w-[180px] bg-fp-sidebar border border-fp-border rounded-xl p-3 shadow-card animate-in fade-in zoom-in-95 duration-150
                    left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-x-0 md:translate-y-0 md:left-0 md:top-auto
                  ">
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-2.5 select-none border-b border-fp-border/40 pb-1">Filter Status</p>
                    <div className="space-y-1.5">
                      {['All', 'Moving', 'Idle', 'Stopped', 'Offline', 'Delayed'].map((status) => {
                        const label = status === 'All' ? 'All Statuses' : status;
                        const isSelected = selectedStatusTemp === status;
                        return (
                          <button
                            key={status}
                            onClick={() => setSelectedStatusTemp(status)}
                            className={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-medium transition-all ${
                              isSelected 
                                ? 'bg-fp-accent/15 border border-fp-accent/25 text-fp-accent-light' 
                                : 'text-stone-400 hover:bg-white/[0.02] hover:text-stone-200 border border-transparent'
                            }`}
                          >
                            <span>{label}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-fp-accent" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 pt-2 border-t border-fp-border/40 flex justify-end">
                      <button
                        onClick={() => {
                          setStatusFilter(selectedStatusTemp);
                          setStatusFilterOpen(false);
                        }}
                        className="w-full md:w-auto px-4 py-1.5 bg-fp-accent hover:bg-fp-accent-light text-stone-950 font-bold text-xs rounded-lg transition-colors shadow-soft"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            <span className="text-[11px] text-stone-500 sm:ml-auto">
              {filteredVehicles.length} of {vehicles.length} vehicles
            </span>
          </div>

          {/* Table */}
          <div className="cyber-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-fp-border">
                    <SortHeader label="Vehicle ID" field="vehicle_number" />
                    <SortHeader label="Driver" field="driver_name" />
                    <SortHeader label="Status" field="status" />
                    <SortHeader label="Speed" field="speed" />
                    <SortHeader label="Fuel" field="fuel_level" />
                    <th className="p-3.5 text-[10px] text-stone-500 font-bold uppercase tracking-wider text-right">Location</th>
                    <th className="p-3.5 text-[10px] text-stone-500 font-bold uppercase tracking-wider text-right">Last Ping</th>
                    <th className="p-3.5 text-[10px] text-stone-500 font-bold uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fp-border/50">
                  {filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-500 text-sm">
                        No vehicles match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map(vehicle => {
                      const isSelected = selectedVehicleId === vehicle.id;
                      return (
                        <tr
                          key={vehicle.id}
                          onClick={() => selectVehicle(isSelected ? null : vehicle.id)}
                          className={`cursor-pointer transition-all hover:bg-white/3 ${isSelected ? 'bg-fp-accent/5 border-l-2 border-l-fp-accent' : ''}`}
                        >
                          <td className="p-3.5 font-bold text-stone-100">{vehicle.vehicle_number}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-fp-accent/10 border border-fp-border flex items-center justify-center text-[9px] font-bold text-stone-300 shrink-0">
                                {vehicle.driver_name.charAt(0)}
                              </div>
                              <span className="font-semibold text-stone-300 truncate">{vehicle.driver_name}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase border ${statusColors[vehicle.status] ?? 'bg-fp-surface text-stone-500 border-fp-border'}`}>
                              {vehicle.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-stone-200 font-semibold">
                            <span className={vehicle.speed > 90 ? 'text-fp-danger font-bold' : ''}>{vehicle.speed} km/h</span>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-14 bg-fp-bg rounded-full h-1.5 overflow-hidden border border-fp-border">
                                <div
                                  className={`h-full rounded-full transition-all ${vehicle.fuel_level < 15 ? 'bg-fp-danger' : vehicle.fuel_level < 40 ? 'bg-fp-warning' : 'bg-fp-success'}`}
                                  style={{ width: `${vehicle.fuel_level}%` }}
                                />
                              </div>
                              <span className={`text-[11px] font-semibold ${vehicle.fuel_level < 15 ? 'text-fp-danger' : 'text-stone-500'}`}>
                                {vehicle.fuel_level}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 text-right text-stone-500 font-mono text-[10px]">
                            {vehicle.latitude ? `${vehicle.latitude.toFixed(3)}, ${vehicle.longitude?.toFixed(3)}` : '—'}
                          </td>
                          <td className="p-3.5 text-right text-stone-500 text-[10px]">
                            {vehicle.last_updated ? new Date(vehicle.last_updated).toLocaleTimeString() : '—'}
                          </td>
                          <td className="p-3.5">
                            <ChevronRight className={`w-3.5 h-3.5 transition-colors ${isSelected ? 'text-fp-accent' : 'text-stone-700'}`} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Detail Side Panel ── */}
        {selectedVehicleId !== null && (
          <div className="w-full lg:w-[360px] shrink-0 flex flex-col gap-0 animate-in slide-in-from-right duration-300">
            <div className="cyber-card overflow-hidden flex flex-col h-full">

              {/* Panel Header */}
              <div className="p-4 border-b border-fp-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-stone-500 uppercase tracking-widest font-semibold">Selected Vehicle</p>
                  <p className="text-[16px] font-semibold text-stone-100 mt-0.5">
                    {detailedVehicle?.vehicle_number ?? '—'}
                  </p>
                </div>
                <button
                  onClick={() => selectVehicle(null)}
                  className="w-7 h-7 rounded-lg border border-fp-border bg-fp-bg flex items-center justify-center text-stone-400 hover:text-stone-100 hover:border-stone-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tab Switcher */}
              <div className="flex border-b border-fp-border">
                {([
                  { id: 'details', icon: Truck, label: 'Vehicle' },
                  { id: 'driver', icon: User, label: 'Driver' },
                  { id: 'trips', icon: Calendar, label: 'Trip History' },
                ] as { id: SidePanelTab; icon: React.FC<React.SVGProps<SVGSVGElement>>; label: string }[]).map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setSidePanelTab(tab.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold transition-all border-b-2 ${
                        sidePanelTab === tab.id
                          ? 'border-fp-accent text-fp-accent-light bg-fp-accent/5'
                          : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-white/3'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto">
                {loadingDetails && !detailedVehicle ? (
                  <div className="p-10 flex justify-center">
                    <div className="w-6 h-6 border-2 border-fp-accent border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : detailedVehicle ? (
                  <>
                    {/* ── TAB: VEHICLE DETAILS ── */}
                    {sidePanelTab === 'details' && (
                      <div className="p-4 space-y-4 text-[12px]">
                        {/* Key metrics */}
                        <div className="grid grid-cols-2 gap-2.5">
                          {[
                            { label: 'Status', value: detailedVehicle.status, colored: true },
                            { label: 'Speed', value: `${detailedVehicle.speed} km/h` },
                            { label: 'Fuel Level', value: `${detailedVehicle.fuel_level}%`, low: detailedVehicle.fuel_level < 15 },
                            { label: 'Last Ping', value: detailedVehicle.last_updated ? new Date(detailedVehicle.last_updated).toLocaleTimeString() : '—' },
                          ].map(m => (
                            <div key={m.label} className="p-3 bg-fp-surface rounded-xl border border-fp-border">
                              <p className="text-[9px] text-stone-500 uppercase tracking-wider font-bold">{m.label}</p>
                              <p className={`font-bold mt-1 ${m.colored ? (statusColors[m.value] ?? '').split(' ')[1] : m.low ? 'text-fp-danger' : 'text-stone-100'}`}>
                                {m.value}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Fuel bar */}
                        <div className="p-3 bg-fp-surface rounded-xl border border-fp-border">
                          <div className="flex justify-between text-[10px] mb-2">
                            <span className="text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1"><Fuel className="w-3 h-3" /> Fuel Reserve</span>
                            <span className={detailedVehicle.fuel_level < 15 ? 'text-fp-danger font-bold' : 'text-stone-300 font-semibold'}>{detailedVehicle.fuel_level}%</span>
                          </div>
                          <div className="w-full bg-fp-bg rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${detailedVehicle.fuel_level < 15 ? 'bg-fp-danger' : detailedVehicle.fuel_level < 40 ? 'bg-fp-warning' : 'bg-fp-success'}`}
                              style={{ width: `${detailedVehicle.fuel_level}%` }}
                            />
                          </div>
                        </div>

                        {/* Active Shipments */}
                        <div>
                          <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                            <ArrowRightLeft className="w-3 h-3 text-fp-info" /> Active Shipments
                          </p>
                          {detailedVehicle.shipments && detailedVehicle.shipments.length > 0 ? (
                            detailedVehicle.shipments.map(s => (
                              <div key={s.id} className="p-3 bg-fp-surface rounded-xl border border-fp-border mb-2">
                                <div className="flex justify-between mb-2">
                                  <span className="font-bold text-stone-200">{s.shipment_number}</span>
                                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                    s.status === 'In Transit' ? 'bg-fp-info/10 text-fp-info border-fp-info/20' :
                                    s.status === 'Delivered' ? 'bg-fp-success/10 text-fp-success border-fp-success/20' :
                                    'bg-fp-warning/10 text-fp-warning border-fp-warning/20'
                                  }`}>{s.status}</span>
                                </div>
                                <p className="text-stone-400 text-[11px] flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-stone-600" /> {s.origin} → {s.destination}
                                </p>
                                <div className="mt-2">
                                  <div className="flex justify-between text-[10px] text-stone-500 mb-1">
                                    <span>Progress</span><span>{s.progress.toFixed(1)}%</span>
                                  </div>
                                  <div className="w-full bg-fp-bg rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-fp-info h-full rounded-full" style={{ width: `${s.progress}%` }} />
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-stone-500 italic text-[11px]">No active shipments.</p>
                          )}
                        </div>

                        {/* Mini Map */}
                        {detailedVehicle.latitude && (
                          <div>
                            <p className="text-[10px] text-stone-500 uppercase tracking-wider font-bold mb-2 flex items-center gap-1.5">
                              <Activity className="w-3 h-3 text-fp-muted" /> Live Geo Trail
                            </p>
                            <div className="h-44 rounded-xl overflow-hidden border border-fp-border">
                              <LiveMap
                                vehicles={[detailedVehicle]}
                                center={[detailedVehicle.latitude, detailedVehicle.longitude as number]}
                                zoom={8}
                                height="100%"
                                showRoutes={true}
                              />
                            </div>
                          </div>
                        )}

                        {/* Alerts */}
                        {detailedVehicle.alerts && detailedVehicle.alerts.length > 0 && (
                          <div>
                            <p className="text-[10px] text-fp-danger uppercase tracking-wider font-bold mb-2">Active Alerts</p>
                            {detailedVehicle.alerts.map(a => (
                              <div key={a.id} className="p-2.5 rounded-lg bg-fp-danger/5 border border-fp-danger/20 text-[11px] text-stone-300 mb-1.5">
                                <span className="badge-critical mr-2">{a.severity}</span>
                                {a.message}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── TAB: DRIVER PROFILE ── */}
                    {sidePanelTab === 'driver' && (() => {
                      const driver = getDriverProfile(detailedVehicle.driver_name, detailedVehicle.vehicle_number);
                      return (
                        <div className="p-4 space-y-4 text-[12px]">
                          {/* Driver card header */}
                          <div className="p-4 bg-fp-accent/10 rounded-xl border border-fp-accent/20 flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-fp-accent/25 border border-fp-accent/40 flex items-center justify-center text-[22px] font-black text-stone-100 shrink-0">
                              {driver.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-[15px] text-stone-100">{driver.name}</p>
                              <p className="text-[10px] text-stone-500">{driver.id} · {driver.experience} experience</p>
                              <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-stone-500" /> {driver.city}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-fp-success"></span>
                                <span className="text-[10px] text-fp-success font-semibold">{driver.status}</span>
                              </div>
                            </div>
                          </div>

                          {/* Stats grid */}
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: 'Total Trips', value: driver.totalTrips, icon: Truck, color: 'text-fp-accent-light' },
                              { label: 'Total Miles', value: driver.totalMiles, icon: Activity, color: 'text-fp-info' },
                              { label: 'On-Time Rate', value: driver.onTimeRate, icon: Clock, color: 'text-fp-success' },
                            ].map(s => (
                              <div key={s.label} className="p-3 bg-fp-surface rounded-xl border border-fp-border text-center">
                                <s.icon className={`w-4 h-4 ${s.color} mx-auto mb-1`} />
                                <p className={`font-black text-[13px] ${s.color}`}>{s.value}</p>
                                <p className="text-[9px] text-stone-500 mt-0.5">{s.label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Vehicle Type */}
                          <div className="p-3 bg-fp-surface rounded-xl border border-fp-border flex items-center justify-between">
                            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Truck className="w-3 h-3 text-fp-accent" /> Vehicle Type
                            </span>
                            <span className="text-[11px] font-bold text-fp-accent-light">{driver.vehicleType}</span>
                          </div>

                          {/* Safety Score */}
                          <div className="p-3 bg-fp-surface rounded-xl border border-fp-border">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Shield className="w-3 h-3 text-fp-success" /> Safety Score
                              </span>
                              <span className="font-black text-[16px] text-fp-success">{driver.safetyScore}/100</span>
                            </div>
                            <div className="w-full bg-fp-bg rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${driver.safetyScore >= 90 ? 'bg-fp-success' : driver.safetyScore >= 75 ? 'bg-fp-warning' : 'bg-fp-danger'}`}
                                style={{ width: `${driver.safetyScore}%` }}
                              />
                            </div>
                          </div>

                          {/* Rating */}
                          <div className="p-3 bg-fp-surface rounded-xl border border-fp-border flex items-center justify-between">
                            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                              <Star className="w-3 h-3 text-fp-warning" /> Driver Rating
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-0.5">
                                {Array.from({ length: 5 }, (_, i) => (
                                  <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(parseFloat(driver.rating)) ? 'text-fp-warning fill-fp-warning' : 'text-stone-700'}`} />
                                ))}
                              </div>
                              <span className="font-black text-fp-warning">{driver.rating}</span>
                            </div>
                          </div>

                          {/* Contact & License details */}
                          <div className="space-y-2">
                            <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Driver Records</p>
                            {[
                              { icon: Phone,  label: 'Phone',        value: driver.phone },
                              { icon: Award,  label: 'CDL Number',   value: driver.cdlNumber },
                              { icon: Shield, label: 'CDL Class',    value: driver.cdlClass },
                              { icon: Clock,  label: 'CDL Expires',  value: driver.cdlExpiry },
                              { icon: MapPin, label: 'Home Address', value: driver.homeAddress },
                              { icon: Calendar, label: 'Joined',     value: driver.joinDate },
                            ].map(d => (
                              <div key={d.label} className="flex items-start gap-3 p-2.5 bg-fp-surface rounded-lg border border-fp-border">
                                <d.icon className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[9px] text-stone-600 uppercase">{d.label}</p>
                                  <p className="text-stone-300 font-semibold text-[11px] break-words">{d.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── TAB: TRIP HISTORY ── */}
                    {sidePanelTab === 'trips' && (() => {
                      const trips = generateTripHistory(detailedVehicle.vehicle_number);
                      const totalKm = trips.reduce((s, t) => s + t.distance, 0);
                      const completed = trips.filter(t => t.status === 'Completed' || t.status === 'On Time').length;
                      return (
                        <div className="p-4 space-y-4 text-[12px]">
                          {/* Trip summary bar */}
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { label: 'Total Trips', value: trips.length, color: 'text-fp-accent-light' },
                              { label: 'Miles Covered', value: `${totalKm.toLocaleString()} mi`, color: 'text-fp-info' },
                              { label: 'Completed', value: `${completed}/${trips.length}`, color: 'text-fp-success' },
                            ].map(s => (
                              <div key={s.label} className="p-3 bg-fp-surface rounded-xl border border-fp-border text-center">
                                <p className={`font-black text-[13px] ${s.color}`}>{s.value}</p>
                                <p className="text-[9px] text-stone-500 mt-0.5">{s.label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Trip list */}
                          <div className="space-y-2.5">
                            {trips.map(trip => (
                              <div key={trip.id} className="p-3 bg-fp-surface rounded-xl border border-fp-border hover:border-stone-700 transition-colors">
                                {/* Header row */}
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="font-bold text-stone-200 font-mono text-[11px]">{trip.tripId}</p>
                                    <p className="text-[10px] text-stone-500 mt-0.5">{trip.date}</p>
                                  </div>
                                  <span className={`text-[10px] font-bold ${tripStatusColor[trip.status] ?? 'text-stone-400'}`}>
                                    {trip.status}
                                  </span>
                                </div>

                                {/* Route */}
                                <div className="flex items-center gap-2 text-[11px] mb-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-fp-success shrink-0"></div>
                                    <span className="text-stone-300 font-semibold truncate">{trip.origin}</span>
                                  </div>
                                  <div className="flex-1 border-t border-dashed border-fp-border mx-1 shrink-0 w-4"></div>
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-fp-danger shrink-0"></div>
                                    <span className="text-stone-300 font-semibold truncate">{trip.destination}</span>
                                  </div>
                                </div>

                                {/* Highway + cargo */}
                                <div className="flex items-center gap-2 mb-2.5">
                                  <span className="px-1.5 py-0.5 bg-fp-info/10 border border-fp-info/20 text-fp-info text-[9px] font-bold rounded font-mono">
                                    {trip.highway}
                                  </span>
                                  <span className="text-[10px] text-stone-400 truncate">{trip.cargo}</span>
                                </div>

                                {/* Trip stats */}
                                <div className="grid grid-cols-3 gap-2 text-[10px]">
                                  <div className="text-center">
                                    <p className="text-stone-500">Distance</p>
                                    <p className="text-stone-200 font-bold">{trip.distance} mi</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-stone-500">Duration</p>
                                    <p className="text-stone-200 font-bold">{trip.duration}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-stone-500">Avg Speed</p>
                                    <p className="text-stone-200 font-bold">{trip.avgSpeed} mph</p>
                                  </div>
                                </div>

                                {/* Fuel used */}
                                <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-fp-border/50">
                                  <Fuel className="w-3 h-3 text-stone-600" />
                                  <span className="text-[10px] text-stone-500">Fuel Used:</span>
                                  <span className="text-[10px] text-stone-300 font-semibold">{trip.fuelUsed} gal</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Fleet;
