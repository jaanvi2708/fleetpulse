import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { Vehicle } from '../store/fleetStore';

// Muted marker colors
const createVehicleMarker = (status: string, vehicleNumber: string, speed: number) => {
  let color = '#7c8c6e'; // Moving - sage
  
  if (status === 'Idle') {
    color = '#8a9bae'; // Idle - steel
  } else if (status === 'Offline' || status === 'Stopped') {
    color = '#a0937d'; // Stopped - taupe
  } else if (status === 'Delayed') {
    color = '#b07070'; // Delayed - dusty rose
  }

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
        <div style="
          position: absolute; 
          width: 16px; 
          height: 16px; 
          background-color: ${color}; 
          border: 2px solid rgba(255,255,255,0.5); 
          border-radius: 50%; 
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute; 
          left: 28px;
          top: -8px;
          background: #222220; 
          border: 1px solid #3d3d39; 
          padding: 4px 8px; 
          border-radius: 5px; 
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          font-family: Inter, system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 2px;
        ">
          <span style="color: #d4d4cc; font-size: 11px; font-weight: 600;">${vehicleNumber}</span>
          <span style="color: ${color}; font-size: 9px; font-weight: 500;">${speed} km/h</span>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
  });
};

// Destination pin marker
const createDestinationMarker = (label: string) => {
  return L.divIcon({
    className: 'destination-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center;">
        <div style="
          width: 10px;
          height: 10px;
          background-color: #c4956a;
          border: 2px solid rgba(255,255,255,0.5);
          border-radius: 50%;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        "></div>
        <div style="
          background: #222220; 
          border: 1px solid #3d3d39; 
          color: #c4956a; 
          font-size: 9px; 
          font-weight: 500;
          padding: 2px 6px; 
          border-radius: 4px;
          white-space: nowrap;
          font-family: Inter, system-ui, sans-serif;
          margin-top: 4px;
        ">
          ${label}
        </div>
      </div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 6]
  });
};

interface LiveMapProps {
  vehicles: Vehicle[];
  showRoutes?: boolean;
  showHeatmap?: boolean;
  showGeofences?: boolean;
  onVehicleClick?: (vehicle: Vehicle) => void;
  height?: string;
  zoom?: number;
  center?: [number, number];
}

// Preset Geofences
const PRESET_GEOFENCES = [
  { id: 1, name: "SF Logistics Hub", center: [37.7749, -122.4194] as [number, number], radius: 15000, color: "#8a9bae" },
  { id: 2, name: "LA Terminal North", center: [34.0522, -118.2437] as [number, number], radius: 20000, color: "#a0937d" },
  { id: 3, name: "NY Depot East", center: [40.7128, -74.0060] as [number, number], radius: 18000, color: "#8a9bae" },
  { id: 4, name: "Houston Hub Southwest", center: [29.7604, -95.3698] as [number, number], radius: 25000, color: "#c4956a" },
];

export const LiveMap: React.FC<LiveMapProps> = ({
  vehicles,
  showRoutes = true,
  showHeatmap = false,
  showGeofences = false,
  onVehicleClick,
  height = '500px',
  zoom = 4,
  center = [37.0902, -95.7129]
}) => {
  return (
    <div className="relative rounded-lg border border-fp-border overflow-hidden w-full" style={{ height }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        {/* CartoDB Dark Matter base layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* 1. Geofences Layer */}
        {showGeofences && PRESET_GEOFENCES.map((fence) => (
          <Circle
            key={fence.id}
            center={fence.center}
            radius={fence.radius}
            pathOptions={{
              color: fence.color,
              fillColor: fence.color,
              fillOpacity: 0.05,
              weight: 1,
              dashArray: '5, 5'
            }}
          >
            <Popup>
              <div className="text-xs font-medium p-1">
                <p className="text-stone-200">{fence.name}</p>
                <p className="text-stone-500 font-normal">Geofence zone</p>
                <p className="text-stone-500 font-normal">Radius: {(fence.radius / 1000).toFixed(1)} km</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* 2. Routes Layer */}
        {showRoutes && vehicles.map((vehicle) => {
          if (!vehicle.latitude || !vehicle.longitude) return null;
          
          let pathPoints: [number, number][] = [];
          if (vehicle.history && vehicle.history.length > 0) {
            pathPoints = vehicle.history
              .map(h => [h.latitude, h.longitude] as [number, number])
              .reverse();
            pathPoints.push([vehicle.latitude, vehicle.longitude]);
          } else {
            pathPoints = [
              [vehicle.latitude - 0.15, vehicle.longitude - 0.15],
              [vehicle.latitude - 0.05, vehicle.longitude - 0.05],
              [vehicle.latitude, vehicle.longitude]
            ];
          }

          let color = '#7c8c6e';
          if (vehicle.status === 'Idle') color = '#8a9bae';
          if (vehicle.status === 'Offline' || vehicle.status === 'Stopped') color = '#a0937d';
          if (vehicle.status === 'Delayed') color = '#b07070';

          return (
            <Polyline
              key={`route-${vehicle.id}`}
              positions={pathPoints}
              pathOptions={{
                color,
                weight: 2,
                opacity: 0.5,
                dashArray: vehicle.status === 'Idle' ? '3, 6' : undefined
              }}
            />
          );
        })}

        {/* 3. Delay Heatmaps Layer */}
        {showHeatmap && vehicles.map((vehicle) => {
          if (!vehicle.latitude || !vehicle.longitude) return null;
          
          const hasFuelAlert = vehicle.fuel_level < 15.0;
          const hasSpeedingAlert = vehicle.speed > 95.0;
          const isOffline = vehicle.status === 'Offline';
          
          if (hasFuelAlert || hasSpeedingAlert || isOffline) {
            const hColor = isOffline ? '#b07070' : '#c4956a';
            return (
              <Circle
                key={`heat-${vehicle.id}`}
                center={[vehicle.latitude, vehicle.longitude]}
                radius={35000}
                pathOptions={{
                  color: hColor,
                  fillColor: hColor,
                  fillOpacity: 0.15,
                  weight: 0,
                }}
              />
            );
          }
          return null;
        })}

        {/* 4. Active Vehicle Markers */}
        {vehicles.map((vehicle) => {
          if (!vehicle.latitude || !vehicle.longitude) return null;
          
          return (
            <React.Fragment key={vehicle.id}>
              <Marker 
                position={[vehicle.latitude, vehicle.longitude]} 
                icon={createVehicleMarker(vehicle.status, vehicle.vehicle_number, Math.round(vehicle.speed || 0))}
                eventHandlers={{
                  click: () => onVehicleClick && onVehicleClick(vehicle),
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1">
                    <div className="flex justify-between items-center gap-4">
                      <span className="font-semibold text-stone-200">{vehicle.vehicle_number}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                        vehicle.status === 'Moving' ? 'bg-fp-success/15 text-fp-success border border-fp-success/20' :
                        vehicle.status === 'Idle' ? 'bg-fp-info/15 text-fp-info border border-fp-info/20' :
                        vehicle.status === 'Offline' || vehicle.status === 'Stopped' ? 'bg-fp-muted/15 text-fp-muted border border-fp-muted/20' :
                        vehicle.status === 'Delayed' ? 'bg-fp-danger/15 text-fp-danger border border-fp-danger/20' :
                        'bg-fp-surface text-stone-400 border border-fp-border'
                      }`}>{vehicle.status}</span>
                    </div>
                    <p className="text-stone-500">Driver: <strong className="text-stone-300">{vehicle.driver_name}</strong></p>
                    <p className="text-stone-500">Speed: <strong className="text-stone-300">{vehicle.speed} km/h</strong></p>
                    <p className="text-stone-500">Fuel: <strong className="text-stone-300">{vehicle.fuel_level}%</strong></p>
                    {vehicle.last_updated && (
                      <p className="text-[9px] text-stone-600">Last update: {new Date(vehicle.last_updated).toLocaleTimeString()}</p>
                    )}
                  </div>
                </Popup>
              </Marker>

              {showRoutes && vehicle.shipments && vehicle.shipments.map((shipment) => {
                if (shipment.status === 'Delivered') return null;
                const destLat = vehicle.latitude ? vehicle.latitude + 0.6 : 37.7749;
                const destLng = vehicle.longitude ? vehicle.longitude + 0.8 : -122.4194;
                return (
                  <Marker
                    key={`dest-${shipment.id}`}
                    position={[destLat, destLng]}
                    icon={createDestinationMarker(shipment.destination)}
                  >
                    <Popup>
                      <div className="text-xs p-1">
                        <span className="font-semibold text-stone-300">{shipment.shipment_number}</span>
                        <p className="text-stone-500 mt-1">Route: {shipment.origin} &rarr; {shipment.destination}</p>
                        <p className="text-stone-500">Status: <strong className="text-fp-warning">{shipment.status}</strong></p>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};
export default LiveMap;
