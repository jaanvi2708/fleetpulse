import React, { useState } from 'react';
import { useFleetStore } from '../store/fleetStore';
import { LiveMap } from '../components/LiveMap';
import { Shield, Eye, Layers } from 'lucide-react';

export const LiveMapPage: React.FC = () => {
  const vehicles = useFleetStore((state) => state.vehicles);
  
  // Layer Toggles State
  const [showRoutes, setShowRoutes] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showGeofences, setShowGeofences] = useState(true);

  // Stats calculation for HUD
  const totalCount = vehicles.length;
  const activeCount = vehicles.filter(v => v.status === 'Moving').length;
  const offlineCount = vehicles.filter(v => v.status === 'Offline').length;
  const idleCount = vehicles.filter(v => v.status === 'Idle').length;

  return (
    <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
      
      {/* Header and Controls Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div>
          <h2 className="text-[26px] font-extrabold tracking-tight text-stone-200">
            Geospatial Fleet Map
          </h2>
          <p className="text-stone-500 text-xs">
            Live telemetry positioning and dispatch route overlays
          </p>
        </div>
        
        {/* Layer Controls HUD */}
        <div className="flex items-center gap-4 bg-fp-card/80 p-2.5 px-4 border border-fp-border rounded-xl text-xs select-none">
          <span className="text-stone-400 font-bold flex items-center gap-1.5 mr-2">
            <Layers className="w-3.5 h-3.5 text-fp-accent" />
            Layer Controls:
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-300 hover:text-stone-100">
            <input 
              type="checkbox" 
              checked={showRoutes} 
              onChange={() => setShowRoutes(!showRoutes)}
              className="accent-fp-accent"
            />
            Routes
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-300 hover:text-stone-100">
            <input 
              type="checkbox" 
              checked={showGeofences} 
              onChange={() => setShowGeofences(!showGeofences)}
              className="accent-fp-accent"
            />
            Geofences
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-300 hover:text-stone-100">
            <input 
              type="checkbox" 
              checked={showHeatmap} 
              onChange={() => setShowHeatmap(!showHeatmap)}
              className="accent-fp-accent"
            />
            Delay Heatmap
          </label>
        </div>
      </div>

      {/* Main Map Wrapper (Flex 1) */}
      <div className="flex-1 min-h-0 relative rounded-xl border border-fp-border overflow-hidden shadow-card">
        
        <LiveMap 
          vehicles={vehicles} 
          showRoutes={showRoutes} 
          showHeatmap={showHeatmap} 
          showGeofences={showGeofences}
          height="100%" 
          zoom={4}
        />

        {/* Live HUD overlay on bottom left */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-fp-bg/90 backdrop-blur-md border border-fp-border p-4 rounded-xl space-y-2.5 w-60 shadow-card select-none">
          <div className="flex items-center gap-2 pb-2 border-b border-fp-border/50">
            <Shield className="w-4 h-4 text-fp-accent" />
            <h4 className="text-xs font-bold text-stone-200 uppercase tracking-wider">Fleet Registry Status</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-fp-surface/60 p-2 rounded border border-fp-border text-center">
              <p className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Total Fleet</p>
              <p className="text-base font-semibold text-stone-200 mt-0.5">{totalCount}</p>
            </div>
            <div className="bg-fp-surface/60 p-2 rounded border border-fp-border text-center">
              <p className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Moving</p>
              <p className="text-base font-semibold text-fp-accent-light mt-0.5">{activeCount}</p>
            </div>
            <div className="bg-fp-surface/60 p-2 rounded border border-fp-border text-center">
              <p className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Idle Units</p>
              <p className="text-base font-semibold text-fp-info mt-0.5">{idleCount}</p>
            </div>
            <div className="bg-fp-surface/60 p-2 rounded border border-fp-border text-center">
              <p className="text-[10px] text-stone-500 font-semibold uppercase tracking-wider">Offline</p>
              <p className="text-base font-semibold text-stone-500 mt-0.5">{offlineCount}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-1.5 text-[9px] text-stone-500 border-t border-fp-border/50 pt-2 font-semibold uppercase tracking-widest">
            <Eye className="w-3 h-3 text-fp-accent" />
            Live Geospatial Grid Active
          </div>
        </div>
      </div>
    </div>
  );
};
export default LiveMapPage;
