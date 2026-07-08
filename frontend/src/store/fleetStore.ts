import { create } from 'zustand';

export interface Vehicle {
  id: number;
  vehicle_number: string;
  driver_name: string;
  status: 'Moving' | 'Idle' | 'Offline' | string;
  speed: number;
  fuel_level: number;
  latitude?: number;
  longitude?: number;
  last_updated: string;
  shipments?: Shipment[];
  alerts?: Alert[];
  history?: TelemetryHistory[];
}

export interface TelemetryHistory {
  id: number;
  vehicle_id: number;
  latitude: number;
  longitude: number;
  speed: number;
  fuel_level: number;
  timestamp: string;
}

export interface Shipment {
  id: number;
  shipment_number: string;
  vehicle_id?: number;
  origin: string;
  destination: string;
  eta?: string;
  status: 'Pending' | 'Picked Up' | 'In Transit' | 'Delivered' | 'Delayed' | string;
  progress: number;
  current_lat?: number;
  current_lng?: number;
}

export interface Alert {
  id: number;
  vehicle_id?: number;
  vehicle_number?: string;
  alert_type: string;
  message: string;
  severity: 'Critical' | 'Warning' | 'Info' | string;
  timestamp: string;
  resolved: boolean;
}

export interface DashboardStats {
  active_vehicles: number;
  on_time_percentage: number;
  average_speed: number;
  total_distance_today: number;
  delayed_shipments: number;
}

export interface Recommendation {
  type: string;
  vehicle: string;
  description: string;
  benefit: string;
  action_url: string;
}

export interface DelayPrediction {
  shipment_id: string;
  vehicle_number: string;
  driver: string;
  prediction: string;
  delay_duration: string;
  confidence: string;
  reason: string;
}

export interface AIInsights {
  predictions: DelayPrediction[];
  recommendations: Recommendation[];
  model_version: string;
  last_inference: string;
}

interface FleetState {
  token: string | null;
  userEmail: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  
  vehicles: Vehicle[];
  shipments: Shipment[];
  alerts: Alert[];
  stats: DashboardStats;
  aiInsights: AIInsights | null;
  
  selectedVehicleId: number | null;
  selectedShipmentId: number | null;
  
  // Actions
  login: (token: string, email: string, name: string) => void;
  logout: () => void;
  
  setVehicles: (vehicles: Vehicle[]) => void;
  updateVehicle: (vehicleData: Partial<Vehicle> & { id: number }) => void;
  
  setShipments: (shipments: Shipment[]) => void;
  updateShipment: (shipmentData: Partial<Shipment> & { id: number }) => void;
  
  setAlerts: (alerts: Alert[]) => void;
  addAlert: (alert: Alert) => void;
  markAlertResolved: (alertId: number) => void;
  
  setStats: (stats: DashboardStats) => void;
  setAiInsights: (insights: AIInsights) => void;
  
  selectVehicle: (id: number | null) => void;
  selectShipment: (id: number | null) => void;
}

export const useFleetStore = create<FleetState>((set) => {
  // Initialize from LocalStorage if exists
  const initialToken = localStorage.getItem('fp_token');
  const initialEmail = localStorage.getItem('fp_email');
  const initialName = localStorage.getItem('fp_name');

  return {
    token: initialToken,
    userEmail: initialEmail,
    userName: initialName,
    isAuthenticated: !!initialToken,
    
    vehicles: [],
    shipments: [],
    alerts: [],
    stats: {
      active_vehicles: 0,
      on_time_percentage: 100,
      average_speed: 0,
      total_distance_today: 0,
      delayed_shipments: 0
    },
    aiInsights: null,
    selectedVehicleId: null,
    selectedShipmentId: null,
    
    login: (token, email, name) => {
      localStorage.setItem('fp_token', token);
      localStorage.setItem('fp_email', email);
      localStorage.setItem('fp_name', name);
      set({ token, userEmail: email, userName: name, isAuthenticated: true });
    },
    
    logout: () => {
      localStorage.removeItem('fp_token');
      localStorage.removeItem('fp_email');
      localStorage.removeItem('fp_name');
      set({ token: null, userEmail: null, userName: null, isAuthenticated: false });
    },
    
    setVehicles: (vehicles) => set({ vehicles }),
    
    updateVehicle: (vehicleData) => set((state) => {
      const updatedVehicles = state.vehicles.map((v) => {
        if (v.id === vehicleData.id) {
          const updated = { ...v, ...vehicleData };
          // If we receive history updates or nested shipments in the websocket payload
          return updated;
        }
        return v;
      });
      
      // Re-calculate active vehicles and avg speed in stats dynamically
      const activeCount = updatedVehicles.filter(v => v.status === 'Moving').length;
      const movingVehicles = updatedVehicles.filter(v => v.status === 'Moving');
      const avgSpd = movingVehicles.length > 0
        ? movingVehicles.reduce((acc, v) => acc + v.speed, 0) / movingVehicles.length
        : 0;

      // Update associated shipments progress if any shipments were sent
      let updatedShipments = [...state.shipments];
      if (vehicleData.shipments) {
        const incomingShipmentIds = vehicleData.shipments.map(s => s.id);
        updatedShipments = state.shipments.map(s => {
          if (incomingShipmentIds.includes(s.id)) {
            const match = vehicleData.shipments?.find(is => is.id === s.id);
            return match ? { ...s, ...match } : s;
          }
          return s;
        });
      }

      return { 
        vehicles: updatedVehicles,
        shipments: updatedShipments,
        stats: {
          ...state.stats,
          active_vehicles: activeCount,
          average_speed: Number(avgSpd.toFixed(1))
        }
      };
    }),
    
    setShipments: (shipments) => set({ shipments }),
    
    updateShipment: (shipmentData) => set((state) => {
      const updatedShipments = state.shipments.map((s) => 
        s.id === shipmentData.id ? { ...s, ...shipmentData } : s
      );
      const delayedCount = updatedShipments.filter(s => s.status === 'Delayed').length;
      return { 
        shipments: updatedShipments,
        stats: {
          ...state.stats,
          delayed_shipments: delayedCount
        }
      };
    }),
    
    setAlerts: (alerts) => set({ alerts }),
    
    addAlert: (alert) => set((state) => {
      // Avoid duplicates
      if (state.alerts.some(a => a.id === alert.id)) return {};
      return { alerts: [alert, ...state.alerts] };
    }),
    
    markAlertResolved: (alertId) => set((state) => ({
      alerts: state.alerts.map(a => a.id === alertId ? { ...a, resolved: true } : a)
    })),
    
    setStats: (stats) => set({ stats }),
    
    setAiInsights: (aiInsights) => set({ aiInsights }),
    
    selectVehicle: (selectedVehicleId) => set({ selectedVehicleId }),
    
    selectShipment: (selectedShipmentId) => set({ selectedShipmentId })
  };
});
