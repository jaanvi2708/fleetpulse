import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal, MapPin, Clock, X, Navigation } from 'lucide-react';
import { useFleetStore } from '../store/fleetStore';
import type { Shipment } from '../store/fleetStore';
import { LiveMap } from '../components/LiveMap';

export const Shipments: React.FC = () => {
  const token = useFleetStore((state) => state.token);
  const shipments = useFleetStore((state) => state.shipments);
  const setShipments = useFleetStore((state) => state.setShipments);
  const vehicles = useFleetStore((state) => state.vehicles);
  
  const selectedShipmentId = useFleetStore((state) => state.selectedShipmentId);
  const selectShipment = useFleetStore((state) => state.selectShipment);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [detailedShipment, setDetailedShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/shipments', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setShipments(data);
        }
      } catch (err) {
        console.error('Error fetching shipments:', err);
      }
    };
    fetchShipments();
  }, [token, setShipments]);

  useEffect(() => {
    if (selectedShipmentId === null) {
      setDetailedShipment(null);
      return;
    }
    const match = shipments.find(s => s.id === selectedShipmentId);
    if (match) {
      setDetailedShipment(match);
    }
  }, [selectedShipmentId, shipments]);

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch = 
      s.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const carryingVehicle = detailedShipment && vehicles.find(v => v.id === detailedShipment.vehicle_id);

  const getTimelineSteps = (shipment: Shipment) => {
    return [
      { label: 'Pending', desc: 'Awaiting carrier pickup.', active: true, completed: true },
      { label: 'Picked Up', desc: 'Carrier accepted cargo at origin.', active: shipment.progress > 0 || shipment.status === 'In Transit' || shipment.status === 'Delayed', completed: shipment.progress > 0 || shipment.status === 'In Transit' || shipment.status === 'Delayed' },
      { label: 'In Transit', desc: 'En route to destination.', active: shipment.progress > 0 && shipment.status !== 'Pending', completed: shipment.progress > 95 || shipment.status === 'Delivered' },
      { label: 'Delivered', desc: 'Receipt verified at destination.', active: shipment.status === 'Delivered', completed: shipment.status === 'Delivered' }
    ];
  };

  return (
    <div className="space-y-6 relative min-h-[calc(100vh-6rem)]">
      
      <div>
        <h2 className="text-2xl font-semibold text-stone-200">
          Shipments
        </h2>
        <p className="text-stone-500 text-xs mt-1">
          Transit tracking and delivery status
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        <div className="flex-1 space-y-4 min-w-0">
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-fp-card p-4 border border-fp-border rounded-lg">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-600" />
              <input
                type="text"
                placeholder="Search shipment, origin..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-fp-bg border border-fp-border rounded-lg py-2 pl-10 pr-4 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-fp-accent/50"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
              <SlidersHorizontal className="w-4 h-4 text-stone-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-fp-bg border border-fp-border rounded-lg py-1.5 px-3 text-xs text-stone-400 focus:outline-none focus:border-fp-accent/50"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Delayed">Delayed</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-fp-card border border-fp-border rounded-lg overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs select-none">
                <thead>
                  <tr className="bg-fp-surface border-b border-fp-border text-stone-500 font-medium uppercase tracking-wider">
                    <th className="p-4">Shipment #</th>
                    <th className="p-4">Vehicle</th>
                    <th className="p-4">Origin</th>
                    <th className="p-4">Destination</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">ETA</th>
                    <th className="p-4">Progress</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fp-border/50">
                  {filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-stone-500 font-medium">
                        No shipments matched filters.
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((s) => {
                      const carryingV = vehicles.find(v => v.id === s.vehicle_id);
                      const isSelected = selectedShipmentId === s.id;
                      return (
                        <tr
                          key={s.id}
                          onClick={() => selectShipment(isSelected ? null : s.id)}
                          className={`hover:bg-fp-surface/50 cursor-pointer transition-colors ${
                            isSelected ? 'bg-fp-surface border-l-2 border-l-fp-accent' : ''
                          }`}
                        >
                          <td className="p-4 font-medium text-stone-200">{s.shipment_number}</td>
                          <td className="p-4 font-medium text-fp-info">
                            {carryingV ? carryingV.vehicle_number : 'Unassigned'}
                          </td>
                          <td className="p-4 text-stone-400">{s.origin}</td>
                          <td className="p-4 text-stone-400">{s.destination}</td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-medium uppercase border ${
                              s.status === 'In Transit' ? 'bg-fp-info/10 text-fp-info border-fp-info/20' :
                              s.status === 'Pending' ? 'bg-fp-muted/10 text-fp-muted border-fp-muted/20' :
                              s.status === 'Delayed' ? 'bg-fp-danger/10 text-fp-danger border-fp-danger/20' :
                              'bg-fp-success/10 text-fp-success border-fp-success/20'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-stone-300">{s.eta || 'N/A'}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-stone-400 w-8">{s.progress.toFixed(0)}%</span>
                              <div className="w-16 bg-fp-bg rounded-full h-1.5 border border-fp-border overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    s.status === 'Delayed' ? 'bg-fp-danger' : 
                                    s.status === 'Delivered' ? 'bg-fp-success' : 'bg-fp-info'
                                  }`} 
                                  style={{ width: `${s.progress}%` }}
                                ></div>
                              </div>
                            </div>
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

        {/* Side Panel */}
        {selectedShipmentId !== null && detailedShipment && (
          <div className="w-full lg:w-96 shrink-0 cyber-card p-5 space-y-5">
            <div className="flex justify-between items-center border-b border-fp-border pb-3">
              <div>
                <h3 className="text-base font-medium text-stone-200 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-fp-accent" />
                  Shipment Details
                </h3>
                <span className="text-[10px] text-stone-500 font-medium">
                  Tracking overview
                </span>
              </div>
              <button 
                onClick={() => selectShipment(null)} 
                className="p-1 rounded bg-fp-surface border border-fp-border text-stone-400 hover:text-stone-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-fp-bg border border-fp-border rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-stone-500 text-[9px] font-medium">Shipment ID</span>
                  <span className="font-medium text-stone-200">{detailedShipment.shipment_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 text-[9px] font-medium">Vehicle</span>
                  <span className="font-medium text-fp-info">
                    {carryingVehicle ? carryingVehicle.vehicle_number : 'Unassigned'}
                  </span>
                </div>
                {carryingVehicle && (
                  <div className="flex justify-between">
                    <span className="text-stone-500 text-[9px] font-medium">Driver</span>
                    <span className="font-medium text-stone-400">{carryingVehicle.driver_name}</span>
                  </div>
                )}
              </div>

              {/* Map */}
              {carryingVehicle && carryingVehicle.latitude && carryingVehicle.longitude && (
                <div className="space-y-2">
                  <span className="text-[10px] font-medium text-stone-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-fp-info" />
                    Live Position
                  </span>
                  <div className="h-40 w-full rounded-lg overflow-hidden border border-fp-border">
                    <LiveMap 
                      vehicles={[carryingVehicle]} 
                      center={[carryingVehicle.latitude, carryingVehicle.longitude]} 
                      zoom={8} 
                      height="100%" 
                      showRoutes={true}
                    />
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-3">
                <span className="text-[10px] font-medium text-stone-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-fp-muted" />
                  Transit Timeline
                </span>
                
                <div className="relative pl-6 border-l border-fp-border space-y-4 py-1 ml-2">
                  {getTimelineSteps(detailedShipment).map((step, idx) => (
                    <div key={idx} className="relative">
                      <span className={`absolute -left-[30px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[8px] ${
                        step.completed 
                          ? 'bg-fp-accent border-fp-accent text-stone-950' 
                          : step.active 
                          ? 'bg-fp-bg border-fp-muted text-fp-muted' 
                          : 'bg-fp-bg border-fp-border text-stone-600'
                      }`}>
                        {step.completed ? '✓' : ''}
                      </span>
                      <div className="space-y-0.5">
                        <p className={`font-medium ${step.active ? 'text-stone-300' : 'text-stone-600'}`}>
                          {step.label}
                        </p>
                        <p className="text-[10px] text-stone-500 leading-normal">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default Shipments;
