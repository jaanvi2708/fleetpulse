import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.config import settings
from app.database import engine, Base, SessionLocal, get_db
from app import models, schemas, auth
from app.websocket import manager

logger = logging.getLogger("fleetpulse.main")

app = FastAPI(title=settings.PROJECT_NAME)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to create tables and seed data
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()

def seed_data(db: Session):
    """Seed the database with initial user, vehicles, shipments, and alerts if empty."""
    # Check if database is already seeded
    if db.query(models.User).first() is not None:
        logger.info("Database already seeded. Skipping...")
        return
        
    logger.info("Seeding database with realistic cyber-logistics fleet data...")
    
    # 1. Create Demo User
    demo_user = models.User(
        email="admin@fleetpulse.com",
        hashed_password=auth.get_password_hash("admin123"),
        full_name="Fleet Operations Command"
    )
    db.add(demo_user)
    db.flush()
    
    # 2. Create Vehicles
    vehicles_data = [
        {"id": 1, "vehicle_number": "FP-101", "driver_name": "Marcus Vance", "status": "Moving", "speed": 72.5, "fuel_level": 84.2, "latitude": 37.7749, "longitude": -122.4194},
        {"id": 2, "vehicle_number": "FP-202", "driver_name": "Elena Rostova", "status": "Idle", "speed": 0.0, "fuel_level": 48.9, "latitude": 34.0522, "longitude": -118.2437},
        {"id": 3, "vehicle_number": "FP-303", "driver_name": "Jaxson Reed", "status": "Moving", "speed": 62.0, "fuel_level": 12.8, "latitude": 40.7128, "longitude": -74.0060}, # Low Fuel
        {"id": 4, "vehicle_number": "FP-404", "driver_name": "Sarah Jenkins", "status": "Offline", "speed": 0.0, "fuel_level": 92.0, "latitude": 41.8781, "longitude": -87.6298}, # Offline
        {"id": 5, "vehicle_number": "FP-505", "driver_name": "Arjun Sharma", "status": "Moving", "speed": 98.6, "fuel_level": 67.5, "latitude": 19.0760, "longitude": 72.8777},  # Mumbai, India — Speeding
    ]
    
    vehicles = []
    for v in vehicles_data:
        vehicle = models.Vehicle(
            id=v["id"],
            vehicle_number=v["vehicle_number"],
            driver_name=v["driver_name"],
            status=v["status"],
            speed=v["speed"],
            fuel_level=v["fuel_level"],
            latitude=v["latitude"],
            longitude=v["longitude"],
            last_updated=datetime.utcnow()
        )
        db.add(vehicle)
        vehicles.append(vehicle)
    db.flush()
    
    # 3. Create Telemetry History for trails
    for v in vehicles:
        # Seed 5 trail points behind each vehicle
        base_lat = v.latitude
        base_lng = v.longitude
        if not base_lat or not base_lng:
            continue
        for i in range(5, 0, -1):
            offset = i * 0.02
            hist_point = models.TelemetryHistory(
                vehicle_id=v.id,
                latitude=base_lat - offset if v.id % 2 == 0 else base_lat + offset,
                longitude=base_lng - offset if v.id % 2 == 0 else base_lng + offset,
                speed=v.speed if v.speed > 0 else 55.0,
                fuel_level=v.fuel_level + i * 0.5 if v.fuel_level < 95 else v.fuel_level,
                timestamp=datetime.utcnow() - timedelta(minutes=i * 10)
            )
            db.add(hist_point)
            
    # 4. Create Shipments
    shipments_data = [
        {"shipment_number": "SH-5001", "vehicle_id": 1, "origin": "San Francisco, CA", "destination": "Los Angeles, CA", "eta": "2h 45m", "status": "In Transit", "progress": 42.0},
        {"shipment_number": "SH-5002", "vehicle_id": 2, "origin": "Los Angeles, CA", "destination": "Phoenix, AZ", "eta": "Pending Dispatch", "status": "Pending", "progress": 0.0},
        {"shipment_number": "SH-5003", "vehicle_id": 3, "origin": "New York, NY", "destination": "Boston, MA", "eta": "Delayed (+55m)", "status": "Delayed", "progress": 78.5},
        {"shipment_number": "SH-5004", "vehicle_id": 5, "origin": "Mumbai, MH", "destination": "Pune, MH", "eta": "1h 25m", "status": "In Transit", "progress": 32.0},
    ]
    
    for s in shipments_data:
        v_obj = db.query(models.Vehicle).filter(models.Vehicle.id == s["vehicle_id"]).first()
        shipment = models.Shipment(
            shipment_number=s["shipment_number"],
            vehicle_id=s["vehicle_id"],
            origin=s["origin"],
            destination=s["destination"],
            eta=s["eta"],
            status=s["status"],
            progress=s["progress"],
            current_lat=v_obj.latitude if v_obj else None,
            current_lng=v_obj.longitude if v_obj else None
        )
        db.add(shipment)
        
    # 5. Create Initial Alerts
    # Low Fuel for Vehicle 3
    alert_1 = models.Alert(
        vehicle_id=3,
        alert_type="Low Fuel",
        message="Vehicle FP-303 fuel level is critically low: 12.8%.",
        severity="Warning",
        timestamp=datetime.utcnow() - timedelta(minutes=15)
    )
    # Speeding for Vehicle 5
    alert_2 = models.Alert(
        vehicle_id=5,
        alert_type="Speeding",
        message="Vehicle FP-505 speed exceeds limit on NH-48: 98.6 km/h (limit 80 km/h).",
        severity="Warning",
        timestamp=datetime.utcnow() - timedelta(minutes=5)
    )
    # Offline for Vehicle 4
    alert_3 = models.Alert(
        vehicle_id=4,
        alert_type="Offline",
        message="Vehicle FP-404 connection lost. Fleet heartbeat offline >15 minutes.",
        severity="Critical",
        timestamp=datetime.utcnow() - timedelta(minutes=25)
    )
    
    db.add(alert_1)
    db.add(alert_2)
    db.add(alert_3)
    
    db.commit()
    logger.info("Database seeding completed.")


# =====================================================================
# ROUTES - AUTHENTICATION
# =====================================================================

@app.post("/api/auth/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user_in.password)
    user = models.User(
        email=user_in.email,
        hashed_password=hashed_password,
        full_name=user_in.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@app.post("/api/auth/login", response_model=schemas.Token)
def login_user(form_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Standard email/password payload login
    user = db.query(models.User).filter(models.User.email == form_data.email).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_current_user_profile(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


# =====================================================================
# ROUTES - VEHICLES
# =====================================================================

@app.get("/api/vehicles", response_model=List[schemas.VehicleResponse])
def get_all_vehicles(db: Session = Depends(get_db)):
    return db.query(models.Vehicle).all()

@app.get("/api/vehicles/{vehicle_id}", response_model=schemas.VehicleDetailResponse)
def get_vehicle_details(vehicle_id: int, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Sort history and active alerts
    vehicle.alerts = db.query(models.Alert).filter(
        models.Alert.vehicle_id == vehicle_id, 
        models.Alert.resolved == False
    ).order_by(models.Alert.timestamp.desc()).all()
    
    vehicle.history = db.query(models.TelemetryHistory).filter(
        models.TelemetryHistory.vehicle_id == vehicle_id
    ).order_by(models.TelemetryHistory.timestamp.desc()).limit(30).all()
    
    return vehicle


# =====================================================================
# ROUTES - SHIPMENTS
# =====================================================================

@app.get("/api/shipments", response_model=List[schemas.ShipmentResponse])
def get_all_shipments(db: Session = Depends(get_db)):
    return db.query(models.Shipment).all()

@app.get("/api/shipments/{shipment_id}", response_model=schemas.ShipmentResponse)
def get_shipment_details(shipment_id: int, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment


# =====================================================================
# ROUTES - ALERTS
# =====================================================================

@app.get("/api/alerts", response_model=List[schemas.AlertResponse])
def get_all_alerts(db: Session = Depends(get_db)):
    # Join with vehicles to get vehicle numbers
    query_result = db.query(
        models.Alert, 
        models.Vehicle.vehicle_number
    ).outerjoin(
        models.Vehicle, 
        models.Alert.vehicle_id == models.Vehicle.id
    ).order_by(
        models.Alert.resolved.asc(), 
        models.Alert.timestamp.desc()
    ).all()
    
    alerts_response = []
    for alert, v_num in query_result:
        alert_dict = {
            "id": alert.id,
            "vehicle_id": alert.vehicle_id,
            "alert_type": alert.alert_type,
            "message": alert.message,
            "severity": alert.severity,
            "timestamp": alert.timestamp,
            "resolved": alert.resolved,
            "vehicle_number": v_num
        }
        alerts_response.append(alert_dict)
        
    return alerts_response

@app.post("/api/alerts/{alert_id}/resolve", response_model=schemas.AlertResponse)
async def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).filter(models.Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.resolved = True
    db.commit()
    db.refresh(alert)
    
    # Send WebSocket alert update to clients
    v_num = db.query(models.Vehicle.vehicle_number).filter(models.Vehicle.id == alert.vehicle_id).scalar()
    
    payload = {
        "event_type": "ALERT_RESOLVED",
        "data": {
            "id": alert.id,
            "vehicle_id": alert.vehicle_id,
            "vehicle_number": v_num,
            "alert_type": alert.alert_type,
            "resolved": True
        }
    }
    await manager.broadcast(payload)
    
    return alert


# =====================================================================
# ROUTES - TELEMETRY INGEST (from simulator)
# =====================================================================

@app.post("/api/telemetry", status_code=status.HTTP_200_OK)
async def update_telemetry(update: schemas.TelemetryUpdate, db: Session = Depends(get_db)):
    """Receives telemetries from simulator, updates DB, processes rules and broadcasts."""
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_number == update.vehicle_number).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail=f"Vehicle {update.vehicle_number} not found")
        
    # Update vehicle telemetry
    vehicle.status = update.status
    vehicle.speed = update.speed
    vehicle.fuel_level = update.fuel_level
    vehicle.latitude = update.latitude
    vehicle.longitude = update.longitude
    vehicle.last_updated = datetime.utcnow()
    
    # Add telemetry log history
    telemetry_log = models.TelemetryHistory(
        vehicle_id=vehicle.id,
        latitude=update.latitude,
        longitude=update.longitude,
        speed=update.speed,
        fuel_level=update.fuel_level
    )
    db.add(telemetry_log)
    
    # Auto-update active shipment coordinates
    shipments = db.query(models.Shipment).filter(
        models.Shipment.vehicle_id == vehicle.id,
        models.Shipment.status.in_(["In Transit", "Delayed"])
    ).all()
    
    for shipment in shipments:
        shipment.current_lat = update.latitude
        shipment.current_lng = update.longitude
        # Simulate slight progress increment
        if shipment.progress < 99.0 and vehicle.status == "Moving":
            shipment.progress += 0.05
            if shipment.progress >= 100.0:
                shipment.progress = 100.0
                shipment.status = "Delivered"
                shipment.eta = "Delivered"
        db.add(shipment)
        
    # Process business rules (alerts)
    new_alerts = []
    
    # Rule 1: Speeding limit (>95 km/h)
    if update.speed > 95.0:
        existing_speed_alert = db.query(models.Alert).filter(
            models.Alert.vehicle_id == vehicle.id,
            models.Alert.alert_type == "Speeding",
            models.Alert.resolved == False
        ).first()
        
        if not existing_speed_alert:
            new_alert = models.Alert(
                vehicle_id=vehicle.id,
                alert_type="Speeding",
                message=f"Vehicle {vehicle.vehicle_number} exceeds safety speed limit: {update.speed:.1f} km/h.",
                severity="Warning"
            )
            db.add(new_alert)
            new_alerts.append(new_alert)
            
    # Rule 2: Low fuel (<15%)
    if update.fuel_level < 15.0:
        existing_fuel_alert = db.query(models.Alert).filter(
            models.Alert.vehicle_id == vehicle.id,
            models.Alert.alert_type == "Low Fuel",
            models.Alert.resolved == False
        ).first()
        
        if not existing_fuel_alert:
            new_alert = models.Alert(
                vehicle_id=vehicle.id,
                alert_type="Low Fuel",
                message=f"Vehicle {vehicle.vehicle_number} fuel is critically low: {update.fuel_level:.1f}%.",
                severity="Warning"
            )
            db.add(new_alert)
            new_alerts.append(new_alert)
            
    # Rule 3: Offline status
    if update.status == "Offline":
        existing_offline_alert = db.query(models.Alert).filter(
            models.Alert.vehicle_id == vehicle.id,
            models.Alert.alert_type == "Offline",
            models.Alert.resolved == False
        ).first()
        
        if not existing_offline_alert:
            new_alert = models.Alert(
                vehicle_id=vehicle.id,
                alert_type="Offline",
                message=f"Vehicle {vehicle.vehicle_number} telemetry connection timed out.",
                severity="Critical"
            )
            db.add(new_alert)
            new_alerts.append(new_alert)
            
    db.commit()
    db.refresh(vehicle)
    
    # Broadcast telemetry update to websockets
    broadcast_payload = {
        "event_type": "TELEMETRY_UPDATE",
        "data": {
            "id": vehicle.id,
            "vehicle_number": vehicle.vehicle_number,
            "driver_name": vehicle.driver_name,
            "status": vehicle.status,
            "speed": vehicle.speed,
            "fuel_level": vehicle.fuel_level,
            "latitude": vehicle.latitude,
            "longitude": vehicle.longitude,
            "last_updated": vehicle.last_updated.isoformat(),
            "shipments": [
                {
                    "id": s.id,
                    "shipment_number": s.shipment_number,
                    "progress": s.progress,
                    "status": s.status,
                    "eta": s.eta
                } for s in shipments
            ]
        }
    }
    
    # Execute async socket broadcast
    await manager.broadcast(broadcast_payload)
    
    # Broadcast alerts if generated
    for alert in new_alerts:
        alert_payload = {
            "event_type": "ALERT_NEW",
            "data": {
                "id": alert.id,
                "vehicle_id": alert.vehicle_id,
                "vehicle_number": vehicle.vehicle_number,
                "alert_type": alert.alert_type,
                "message": alert.message,
                "severity": alert.severity,
                "timestamp": alert.timestamp.isoformat(),
                "resolved": False
            }
        }
        await manager.broadcast(alert_payload)
        
    return {"status": "success"}


# =====================================================================
# ROUTES - DASHBOARD STATS & ANALYTICS
# =====================================================================

@app.get("/api/dashboard/stats", response_model=schemas.DashboardSummary)
def get_dashboard_stats(db: Session = Depends(get_db)):
    vehicles = db.query(models.Vehicle).all()
    shipments = db.query(models.Shipment).all()
    
    active_vehicles = sum(1 for v in vehicles if v.status == "Moving")
    
    # On-Time Deliveries percentage calculation
    delivered_shipments = [s for s in shipments if s.status == "Delivered"]
    on_time = sum(1 for s in shipments if s.status != "Delayed")
    total_shipments = len(shipments)
    on_time_pct = (on_time / total_shipments * 100.0) if total_shipments > 0 else 100.0
    
    # Average speed of moving vehicles
    moving_vehicles = [v for v in vehicles if v.status == "Moving"]
    avg_speed = (sum(v.speed for v in moving_vehicles) / len(moving_vehicles)) if moving_vehicles else 0.0
    
    # Total distance today (simulated scaling metric)
    total_dist = sum(v.speed * 2.4 for v in moving_vehicles) + 4120.0
    
    delayed_count = sum(1 for s in shipments if s.status == "Delayed")
    
    return {
        "active_vehicles": active_vehicles,
        "on_time_percentage": round(on_time_pct, 1),
        "average_speed": round(avg_speed, 1),
        "total_distance_today": round(total_dist, 1),
        "delayed_shipments": delayed_count
    }

@app.get("/api/analytics")
def get_analytics_data(db: Session = Depends(get_db)):
    # Simulating robust analytics graphs data based on active DB contents
    deliveries_chart = [
        {"date": "Jun 17", "deliveries": 32, "delayed": 3},
        {"date": "Jun 18", "deliveries": 38, "delayed": 2},
        {"date": "Jun 19", "deliveries": 41, "delayed": 5},
        {"date": "Jun 20", "deliveries": 35, "delayed": 4},
        {"date": "Jun 21", "deliveries": 45, "delayed": 3},
        {"date": "Jun 22", "deliveries": 52, "delayed": 6},
        {"date": "Jun 23", "deliveries": 48, "delayed": 4},
    ]
    
    vehicles = db.query(models.Vehicle).all()
    moving = sum(1 for v in vehicles if v.status == "Moving")
    idle = sum(1 for v in vehicles if v.status == "Idle")
    offline = sum(1 for v in vehicles if v.status == "Offline")
    
    utilization_chart = [
        {"status": "Moving", "count": moving, "color": "#00f0ff"},
        {"status": "Idle", "count": idle, "color": "#a855f7"},
        {"status": "Offline", "count": offline, "color": "#64748b"}
    ]
    
    # Simulating driver leaderboard
    drivers = db.query(models.Vehicle.driver_name, models.Vehicle.vehicle_number, models.Vehicle.speed).all()
    driver_leaderboard = []
    for i, d in enumerate(drivers):
        # Calculate a simulated score
        score = 98 - (i * 2.5) if d.speed <= 95 else 78
        driver_leaderboard.append({
            "rank": i + 1,
            "driver": d.driver_name,
            "vehicle": d.vehicle_number,
            "score": score,
            "avg_speed": round(d.speed if d.speed > 0 else 62.4, 1),
            "safety_rating": "Excellent" if score > 90 else "Review Required"
        })
        
    return {
        "deliveries_chart": deliveries_chart,
        "utilization_chart": utilization_chart,
        "leaderboard": driver_leaderboard
    }


# =====================================================================
# ROUTES - AI INSIGHTS
# =====================================================================

@app.get("/api/insights")
def get_ai_insights(db: Session = Depends(get_db)):
    """Simulates AI predictions and route optimization suggestions based on live data.
    In production, this would feed into a pipeline utilizing PyTorch/TensorFlow models
    that predict ETAs based on historic traffic, weather, and driving telemetry logs."""
    
    vehicles = db.query(models.Vehicle).all()
    shipments = db.query(models.Shipment).filter(models.Shipment.status.in_(["In Transit", "Delayed"])).all()
    
    predictions = []
    recommendations = []
    
    # Build dynamic insights based on database state
    for shipment in shipments:
        # Check if corresponding vehicle has alerts
        v_num = "Unknown"
        v_speed = 60.0
        v_fuel = 80.0
        alerts = []
        if shipment.vehicle_id:
            v_obj = db.query(models.Vehicle).filter(models.Vehicle.id == shipment.vehicle_id).first()
            if v_obj:
                v_num = v_obj.vehicle_number
                v_speed = v_obj.speed
                v_fuel = v_obj.fuel_level
                alerts = db.query(models.Alert).filter(
                    models.Alert.vehicle_id == v_obj.id,
                    models.Alert.resolved == False
                ).all()
                
        # Simulated logic representing ML pipeline
        if shipment.status == "Delayed" or any(a.alert_type == "Offline" for a in alerts):
            predictions.append({
                "shipment_id": shipment.shipment_number,
                "vehicle_number": v_num,
                "driver": v_obj.driver_name if v_obj else "Unknown",
                "prediction": "Severe delay expected",
                "delay_duration": "+45-60 min",
                "confidence": "94%",
                "reason": "Vehicle telemetry offline or dispatch delays."
            })
            recommendations.append({
                "type": "Reroute",
                "vehicle": v_num,
                "description": f"Reroute {v_num} around severe corridor slowdowns via secondary highway 101-North.",
                "benefit": "Saves 35 minutes, avoids 4km gridlock.",
                "action_url": f"/fleet/{v_obj.id if v_obj else ''}"
            })
        elif v_speed > 95.0:
            predictions.append({
                "shipment_id": shipment.shipment_number,
                "vehicle_number": v_num,
                "driver": v_obj.driver_name if v_obj else "Unknown",
                "prediction": "Early Arrival",
                "delay_duration": "-15 min",
                "confidence": "81%",
                "reason": f"High travel speeds of {v_speed:.1f} km/h."
            })
            recommendations.append({
                "type": "Safety Intervention",
                "vehicle": v_num,
                "description": f"Send safety speed warning alert to driver {v_obj.driver_name if v_obj else ''}.",
                "benefit": "Ensures cargo safety and avoids speeding citation risks.",
                "action_url": f"/fleet/{v_obj.id if v_obj else ''}"
            })
        elif v_fuel < 20.0:
            predictions.append({
                "shipment_id": shipment.shipment_number,
                "vehicle_number": v_num,
                "driver": v_obj.driver_name if v_obj else "Unknown",
                "prediction": "Refueling Stop Required",
                "delay_duration": "+20 min",
                "confidence": "99%",
                "reason": f"Low fuel levels: {v_fuel:.1f}%."
            })
            recommendations.append({
                "type": "Refuel Stop",
                "vehicle": v_num,
                "description": f"Schedule refuel at FlyingJ Travel Plaza in 12 miles.",
                "benefit": "Prevents critical roadside fuel depletion.",
                "action_url": f"/fleet/{v_obj.id if v_obj else ''}"
            })
        else:
            predictions.append({
                "shipment_id": shipment.shipment_number,
                "vehicle_number": v_num,
                "driver": v_obj.driver_name if v_obj else "Unknown",
                "prediction": "On-Time Arrival",
                "delay_duration": "+0-5 min",
                "confidence": "89%",
                "reason": "Stable cruising velocity, normal traffic reports."
            })
            
    # Default recommendations if lists are empty
    if not recommendations:
        recommendations = [
            {
                "type": "Predictive Maintenance",
                "vehicle": "FP-101",
                "description": "Schedule vehicle FP-101 for brake disc inspections. Vibrations detected during deceleration.",
                "benefit": "Prevents mechanical failure, saves $1,200 roadside towing charge.",
                "action_url": "/fleet/1"
            },
            {
                "type": "Fuel Optimization",
                "vehicle": "FP-202",
                "description": "Optimize engine idling profiles. FP-202 idle durations exceeded limit by 18% during delivery standbys.",
                "benefit": "Saves 12 gallons of fuel weekly.",
                "action_url": "/fleet/2"
            }
        ]
        
    return {
        "predictions": predictions,
        "recommendations": recommendations,
        "model_version": "v1.4.2-neural-eta",
        "last_inference": datetime.utcnow().isoformat()
    }


@app.get("/api/reports")
def get_reports_data(db: Session = Depends(get_db)):
    vehicles = db.query(models.Vehicle).all()
    alerts = db.query(models.Alert).all()
    shipments = db.query(models.Shipment).all()
    telemetry_logs = db.query(models.TelemetryHistory).order_by(models.TelemetryHistory.timestamp.desc()).limit(100).all()
    
    # Calculate vehicle specific summaries
    vehicle_summaries = []
    for v in vehicles:
        v_logs = [t for t in telemetry_logs if t.vehicle_id == v.id]
        avg_speed = sum(l.speed for l in v_logs) / len(v_logs) if v_logs else v.speed
        avg_fuel = sum(l.fuel_level for l in v_logs) / len(v_logs) if v_logs else v.fuel_level
        alerts_count = sum(1 for a in alerts if a.vehicle_id == v.id)
        
        vehicle_summaries.append({
            "vehicle_id": v.id,
            "vehicle_number": v.vehicle_number,
            "driver_name": v.driver_name,
            "status": v.status,
            "log_count": len(v_logs),
            "avg_speed": round(avg_speed, 1),
            "avg_fuel_level": round(avg_fuel, 1),
            "alerts_count": alerts_count
        })
        
    # Calculate alert counts by type
    alert_summary = {}
    for a in alerts:
        alert_summary[a.alert_type] = alert_summary.get(a.alert_type, 0) + 1
        
    return {
        "vehicle_summaries": vehicle_summaries,
        "alert_summary": [{"type": k, "count": v} for k, v in alert_summary.items()],
        "total_telemetry_count": db.query(models.TelemetryHistory).count(),
        "recent_telemetry": [
            {
                "id": t.id,
                "vehicle_id": t.vehicle_id,
                "vehicle_number": next((v.vehicle_number for v in vehicles if v.id == t.vehicle_id), "Unknown"),
                "driver_name": next((v.driver_name for v in vehicles if v.id == t.vehicle_id), "Unknown"),
                "latitude": t.latitude,
                "longitude": t.longitude,
                "speed": t.speed,
                "fuel_level": t.fuel_level,
                "timestamp": t.timestamp.isoformat()
            } for t in telemetry_logs
        ],
        "shipment_summary": {
            "total": len(shipments),
            "delivered": sum(1 for s in shipments if s.status == "Delivered"),
            "transit": sum(1 for s in shipments if s.status == "In Transit"),
            "delayed": sum(1 for s in shipments if s.status == "Delayed"),
            "pending": sum(1 for s in shipments if s.status == "Pending" or s.status == "Picked Up")
        }
    }


@app.put("/api/auth/me", response_model=schemas.UserResponse)
def update_user_profile(user_update: schemas.UserUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    if user_update.email is not None:
        existing_user = db.query(models.User).filter(models.User.email == user_update.email).first()
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=400, detail="Email already taken")
        current_user.email = user_update.email
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.password is not None:
        current_user.hashed_password = auth.get_password_hash(user_update.password)
    db.commit()
    db.refresh(current_user)
    return current_user


@app.put("/api/vehicles/{vehicle_id}", response_model=schemas.VehicleResponse)
async def update_vehicle(vehicle_id: int, vehicle_update: schemas.VehicleUpdate, db: Session = Depends(get_db)):
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    if vehicle_update.driver_name is not None:
        vehicle.driver_name = vehicle_update.driver_name
    if vehicle_update.status is not None:
        vehicle.status = vehicle_update.status
    if vehicle_update.fuel_level is not None:
        vehicle.fuel_level = vehicle_update.fuel_level
    if vehicle_update.speed is not None:
        vehicle.speed = vehicle_update.speed
    vehicle.last_updated = datetime.utcnow()
    db.commit()
    db.refresh(vehicle)
    
    # Broadcast telemetry update to websockets so the frontend updates immediately
    broadcast_payload = {
        "event_type": "TELEMETRY_UPDATE",
        "data": {
            "id": vehicle.id,
            "vehicle_number": vehicle.vehicle_number,
            "driver_name": vehicle.driver_name,
            "status": vehicle.status,
            "speed": vehicle.speed,
            "fuel_level": vehicle.fuel_level,
            "latitude": vehicle.latitude,
            "longitude": vehicle.longitude,
            "last_updated": vehicle.last_updated.isoformat(),
            "shipments": []
        }
    }
    
    await manager.broadcast(broadcast_payload)
    
    return vehicle


@app.put("/api/shipments/{shipment_id}", response_model=schemas.ShipmentResponse)
def update_shipment(shipment_id: int, shipment_update: schemas.ShipmentUpdate, db: Session = Depends(get_db)):
    shipment = db.query(models.Shipment).filter(models.Shipment.id == shipment_id).first()
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    if shipment_update.origin is not None:
        shipment.origin = shipment_update.origin
    if shipment_update.destination is not None:
        shipment.destination = shipment_update.destination
    if shipment_update.vehicle_id is not None:
        shipment.vehicle_id = shipment_update.vehicle_id
    if shipment_update.progress is not None:
        shipment.progress = shipment_update.progress
    if shipment_update.status is not None:
        shipment.status = shipment_update.status
    db.commit()
    db.refresh(shipment)
    return shipment


# =====================================================================
# WEBSOCKET CONNECTIONS ROUTER
# =====================================================================

@app.websocket("/ws/fleet")
async def websocket_fleet_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Keep connection open and listen for heartbeat
        while True:
            data = await websocket.receive_text()
            # Simple heartbeat echo
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket client error: {e}")
        manager.disconnect(websocket)
