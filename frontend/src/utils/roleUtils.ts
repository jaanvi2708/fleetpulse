import type { Shipment, Vehicle } from '../store/fleetStore';

// Map client emails to assigned vehicle/shipment IDs for demo accounts
export const CLIENT_VEHICLE_MAP: Record<string, number> = {
  'user1@fleetpulse.com': 1, // vehicle_id 1 -> SH-5001
  'user2@fleetpulse.com': 2, // vehicle_id 2 -> SH-5002
  'user3@fleetpulse.com': 3, // vehicle_id 3 -> SH-5003
  'user4@fleetpulse.com': 5, // vehicle_id 5 -> SH-5004
};

export const getClientShipments = (
  userEmail: string | null,
  userRole: string | null,
  shipments: Shipment[],
  _vehicles?: Vehicle[]
): Shipment[] => {
  if (userRole !== 'user' && userRole !== 'client') return shipments;

  // 1. Direct assigned vehicle match for demo client emails
  const assignedVehicleId = CLIENT_VEHICLE_MAP[userEmail || ''];
  if (assignedVehicleId !== undefined) {
    const matched = shipments.filter(s => s.vehicle_id === assignedVehicleId);
    if (matched.length > 0) return matched;
  }

  // 2. Filter by user_id if present
  const userMatched = shipments.filter(s => (s as any).user_id || (s as any).client_email === userEmail);
  if (userMatched.length > 0) return userMatched;

  // 3. Fallback for generic client account: return 1st shipment (e.g. SH-5001)
  return shipments.slice(0, 1);
};

export const getDriverVehicle = (
  userName: string | null,
  userEmail: string | null,
  vehicles: Vehicle[]
): Vehicle | null => {
  if (!vehicles || vehicles.length === 0) return null;
  
  // Match by driver_name
  const matchName = vehicles.find(v => v.driver_name?.toLowerCase() === userName?.toLowerCase());
  if (matchName) return matchName;

  // Driver email mapping for demo accounts
  const emailMap: Record<string, string> = {
    'driver1@fleetpulse.com': 'Driver 1',
    'driver2@fleetpulse.com': 'Driver 2',
    'driver3@fleetpulse.com': 'Driver 3',
    'driver4@fleetpulse.com': 'Driver 4',
    'driver5@fleetpulse.com': 'Driver 5',
  };
  const mappedName = emailMap[userEmail || ''];
  if (mappedName) {
    return vehicles.find(v => v.driver_name?.toLowerCase() === mappedName.toLowerCase()) || null;
  }

  return vehicles[0] || null;
};
