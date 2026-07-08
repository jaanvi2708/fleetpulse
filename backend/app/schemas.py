from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Telemetry Schemas
class TelemetryUpdate(BaseModel):
    vehicle_number: str
    status: str
    speed: float
    fuel_level: float
    latitude: float
    longitude: float

# Telemetry History Schema
class TelemetryHistoryResponse(BaseModel):
    id: int
    vehicle_id: int
    latitude: float
    longitude: float
    speed: float
    fuel_level: float
    timestamp: datetime

    class Config:
        from_attributes = True

# Alert Schemas
class AlertBase(BaseModel):
    vehicle_id: Optional[int] = None
    alert_type: str
    message: str
    severity: str
    resolved: bool = False

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    timestamp: datetime
    vehicle_number: Optional[str] = None

    class Config:
        from_attributes = True

# Shipment Schemas
class ShipmentBase(BaseModel):
    shipment_number: str
    vehicle_id: Optional[int] = None
    origin: str
    destination: str
    eta: Optional[str] = None
    status: str
    progress: float
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None

class ShipmentResponse(ShipmentBase):
    id: int

    class Config:
        from_attributes = True

# Vehicle Schemas
class VehicleBase(BaseModel):
    vehicle_number: str
    driver_name: str
    status: str
    speed: float
    fuel_level: float
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleResponse(VehicleBase):
    id: int
    last_updated: datetime

    class Config:
        from_attributes = True

# Detailed Vehicle Response (includes active shipments)
class VehicleDetailResponse(VehicleResponse):
    shipments: List[ShipmentResponse] = []
    alerts: List[AlertResponse] = []
    history: List[TelemetryHistoryResponse] = []

    class Config:
        from_attributes = True

# Dashboard Summary Schema
class DashboardSummary(BaseModel):
    active_vehicles: int
    on_time_percentage: float
    average_speed: float
    total_distance_today: float
    delayed_shipments: int


# Update Schemas
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None

class VehicleUpdate(BaseModel):
    driver_name: Optional[str] = None
    status: Optional[str] = None
    speed: Optional[float] = None
    fuel_level: Optional[float] = None

class ShipmentUpdate(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    vehicle_id: Optional[int] = None
    progress: Optional[float] = None
    status: Optional[str] = None
