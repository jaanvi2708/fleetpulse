import { useEffect, useRef, useState } from 'react';
import { useFleetStore } from '../store/fleetStore';

export const useWebSocket = (toastCallback?: (message: string, severity: string) => void) => {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  
  const updateVehicle = useFleetStore((state) => state.updateVehicle);
  const addAlert = useFleetStore((state) => state.addAlert);
  const markAlertResolved = useFleetStore((state) => state.markAlertResolved);
  
  useEffect(() => {
    let reconnectTimeout: number;
    
    const connect = () => {
      console.log('Connecting to FleetPulse WebSocket...');
      const socket = new WebSocket('ws://127.0.0.1:8000/ws/fleet');
      socketRef.current = socket;
      
      socket.onopen = () => {
        console.log('FleetPulse WebSocket connected.');
        setConnected(true);
      };
      
      socket.onmessage = (event) => {
        try {
          if (event.data === 'pong') return;
          
          const payload = JSON.parse(event.data);
          const { event_type, data } = payload;
          
          switch (event_type) {
            case 'TELEMETRY_UPDATE':
              updateVehicle(data);
              break;
              
            case 'ALERT_NEW':
              addAlert(data);
              if (toastCallback) {
                toastCallback(data.message, data.severity);
              }
              break;
              
            case 'ALERT_RESOLVED':
              markAlertResolved(data.id);
              if (toastCallback) {
                toastCallback(`Alert resolved: ${data.alert_type} for ${data.vehicle_number}`, 'Info');
              }
              break;
              
            default:
              console.log('Unknown WebSocket event:', event_type, data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      socket.onclose = () => {
        console.log('FleetPulse WebSocket connection closed. Reconnecting in 3s...');
        setConnected(false);
        reconnectTimeout = window.setTimeout(connect, 3000);
      };
      
      socket.onerror = (err) => {
        console.error('WebSocket connection error:', err);
        socket.close();
      };
    };
    
    connect();
    
    // Heartbeat ping interval
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send('ping');
      }
    }, 15000);
    
    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(pingInterval);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [updateVehicle, addAlert, markAlertResolved, toastCallback]);
  
  return { connected };
};
