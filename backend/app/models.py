from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)

class Vehicle(Base):
    __tablename__ = "vehicles"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String, unique=True, index=True, nullable=False)
    driver_name = Column(String, nullable=False)
    status = Column(String, default="Offline")  # Moving, Idle, Offline
    speed = Column(Float, default=0.0)
    fuel_level = Column(Float, default=100.0)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    shipments = relationship("Shipment", back_populates="vehicle")
    alerts = relationship("Alert", back_populates="vehicle", cascade="all, delete-orphan")
    history = relationship("TelemetryHistory", back_populates="vehicle", cascade="all, delete-orphan")

class Shipment(Base):
    __tablename__ = "shipments"
    
    id = Column(Integer, primary_key=True, index=True)
    shipment_number = Column(String, unique=True, index=True, nullable=False)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    origin = Column(String, nullable=False)
    destination = Column(String, nullable=False)
    eta = Column(String, nullable=True)  # ETA text (e.g., "16:45", "1h 20m")
    status = Column(String, default="Pending")  # Pending, Picked Up, In Transit, Delivered, Delayed
    progress = Column(Float, default=0.0)  # 0.0 to 100.0
    current_lat = Column(Float, nullable=True)
    current_lng = Column(Float, nullable=True)
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="shipments")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=True)
    alert_type = Column(String, nullable=False)  # Offline, Route Deviation, Delay, Low Fuel, Speeding
    message = Column(String, nullable=False)
    severity = Column(String, default="Info")  # Critical, Warning, Info
    timestamp = Column(DateTime, default=datetime.utcnow)
    resolved = Column(Boolean, default=False)
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="alerts")

class TelemetryHistory(Base):
    __tablename__ = "telemetry_history"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    speed = Column(Float, nullable=False)
    fuel_level = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="history")
