import time
import random
import httpx
import logging
import os

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fleetpulse.simulator")

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000/api/telemetry")

# ─────────────────────────────────────────────────────────────────────────────
# Realistic waypoint routes for each vehicle along actual US highway corridors
# Each waypoint is (lat, lng) along the real road path
# ─────────────────────────────────────────────────────────────────────────────
ROUTES = {
    # FP-101: Delhi → Udaipur via NH-48 (~660 km)
    "FP-101": [
        (28.6139, 77.2090),  # Delhi
        (28.4595, 77.0266),  # Gurugram
        (26.9124, 75.7873),  # Jaipur
        (26.4499, 74.6399),  # Ajmer
        (25.3484, 74.6433),  # Bhilwara
        (24.5854, 73.7125),  # Udaipur (destination)
    ],
    # FP-202: Bangalore → Chennai via NH-48/NH-75 (~346 km)
    "FP-202": [
        (12.9716, 77.5946),  # Bangalore
        (12.7409, 77.8253),  # Hosur
        (12.5186, 78.2138),  # Krishnagiri
        (12.7904, 78.7166),  # Ambur
        (12.9165, 79.1325),  # Vellore
        (12.8342, 79.7036),  # Kanchipuram
        (13.0827, 80.2707),  # Chennai (destination)
    ],
    # FP-303: Kolkata → Bhubaneswar via NH-16 (~440 km)
    "FP-303": [
        (22.5726, 88.3639),  # Kolkata
        (22.3302, 87.3237),  # Kharagpur
        (21.4934, 86.9337),  # Balasore
        (21.0574, 86.4958),  # Bhadrak
        (20.4625, 85.8830),  # Cuttack
        (20.2961, 85.8245),  # Bhubaneswar (destination)
    ],
    # FP-404: Hyderabad → Bangalore via NH-44 (~570 km)
    "FP-404": [
        (17.3850, 78.4867),  # Hyderabad
        (16.7388, 77.9862),  # Mahbubnagar
        (15.8281, 78.0373),  # Kurnool
        (14.6819, 77.6006),  # Anantapur
        (12.9716, 77.5946),  # Bangalore (destination)
    ],
    # FP-505: Mumbai → Ahmedabad via NH-48 (~530 km)
    "FP-505": [
        (19.0760, 72.8777),  # Mumbai
        (19.2183, 72.9781),  # Thane
        (20.3717, 72.9082),  # Vapi
        (21.1702, 72.8311),  # Surat
        (22.3072, 73.1812),  # Vadodara
        (23.0225, 72.5714),  # Ahmedabad (destination)
    ],
}

# Build per-vehicle traversal state
VEHICLES_SIMSTATE = {
    "FP-101": {
        "route": ROUTES["FP-101"], "waypoint_idx": 0,
        "lat": ROUTES["FP-101"][0][0], "lng": ROUTES["FP-101"][0][1],
        "speed": 72.5, "fuel": 84.2, "status": "Moving",
    },
    "FP-202": {
        "route": ROUTES["FP-202"], "waypoint_idx": 0,
        "lat": ROUTES["FP-202"][0][0], "lng": ROUTES["FP-202"][0][1],
        "speed": 0.0, "fuel": 48.9, "status": "Idle",
    },
    "FP-303": {
        "route": ROUTES["FP-303"], "waypoint_idx": 0,
        "lat": ROUTES["FP-303"][0][0], "lng": ROUTES["FP-303"][0][1],
        "speed": 62.0, "fuel": 12.8, "status": "Moving",
    },
    "FP-404": {
        "route": ROUTES["FP-404"], "waypoint_idx": 0,
        "lat": ROUTES["FP-404"][0][0], "lng": ROUTES["FP-404"][0][1],
        "speed": 0.0, "fuel": 92.0, "status": "Offline",
    },
    "FP-505": {
        "route": ROUTES["FP-505"], "waypoint_idx": 0,
        "lat": ROUTES["FP-505"][0][0], "lng": ROUTES["FP-505"][0][1],
        "speed": 98.6, "fuel": 67.5, "status": "Moving",
    },
}


def move_towards_waypoint(state: dict, speed_kmh: float) -> None:
    """Advances the vehicle smoothly along its waypoint route."""
    route = state["route"]
    idx = state["waypoint_idx"]

    if idx >= len(route) - 1:
        # Loop back to start for continuous simulation
        state["waypoint_idx"] = 0
        return

    target_lat, target_lng = route[idx + 1]
    dlat = target_lat - state["lat"]
    dlng = target_lng - state["lng"]
    dist = (dlat**2 + dlng**2) ** 0.5

    # Each step moves ~0.015 deg (~1.6 km) along the corridor
    step = 0.015
    if dist < step:
        # Snap to waypoint and advance
        state["lat"] = target_lat
        state["lng"] = target_lng
        state["waypoint_idx"] += 1
    else:
        ratio = step / dist
        state["lat"] += dlat * ratio + random.uniform(-0.0005, 0.0005)
        state["lng"] += dlng * ratio + random.uniform(-0.0005, 0.0005)


def simulate_step():
    client = httpx.Client()
    logger.info("Starting FleetPulse Realistic Route Simulation...")

    step_count = 0
    try:
        while True:
            step_count += 1
            logger.info(f"--- Telemetry Step {step_count} ---")

            for v_num, state in VEHICLES_SIMSTATE.items():

                # ── Status transitions ──────────────────────────────────────
                if v_num == "FP-202":
                    if step_count > 10 and random.random() < 0.12:
                        if state["status"] == "Idle":
                            state["status"] = "Moving"
                            state["speed"] = random.uniform(55.0, 75.0)
                        else:
                            state["status"] = "Idle"
                            state["speed"] = 0.0

                if v_num == "FP-404":
                    if state["status"] == "Offline" and random.random() < 0.08:
                        state["status"] = "Idle"
                    elif state["status"] == "Idle" and random.random() < 0.15:
                        state["status"] = "Offline"

                # ── Physics update ──────────────────────────────────────────
                if state["status"] == "Moving":
                    # Speed variation within corridor limits
                    speed_delta = random.uniform(-4.0, 4.0)
                    if v_num == "FP-505" and random.random() < 0.18:
                        state["speed"] = random.uniform(92.0, 105.0)   # speeding on NH-48 (limit 80 km/h)
                    else:
                        state["speed"] = max(50.0, min(95.0, state["speed"] + speed_delta))

                    move_towards_waypoint(state, state["speed"])

                    # Realistic fuel burn: ~0.08–0.14 L/km per step
                    state["fuel"] = max(2.0, state["fuel"] - random.uniform(0.06, 0.14))

                elif state["status"] == "Idle":
                    state["speed"] = 0.0
                    state["fuel"] = max(2.0, state["fuel"] - random.uniform(0.01, 0.03))

                # ── Emergency refuel when critically low ────────────────────
                if state["fuel"] < 8.0 and random.random() < 0.35:
                    logger.info(f"Refueling: {v_num} → topped up to 100%")
                    state["fuel"] = 100.0

                # ── Build & send telemetry payload ──────────────────────────
                payload = {
                    "vehicle_number": v_num,
                    "status": state["status"],
                    "speed": round(state["speed"], 1),
                    "fuel_level": round(state["fuel"], 1),
                    "latitude": round(state["lat"], 5),
                    "longitude": round(state["lng"], 5),
                }

                try:
                    r = client.post(BACKEND_URL, json=payload, timeout=2.0)
                    if r.status_code == 200:
                        logger.info(
                            f"[{v_num}] status={payload['status']} "
                            f"speed={payload['speed']} km/h "
                            f"fuel={payload['fuel_level']}% "
                            f"pos=({payload['latitude']}, {payload['longitude']})"
                        )
                    else:
                        logger.warning(f"[{v_num}] telemetry rejected: HTTP {r.status_code}")
                except Exception as ex:
                    logger.error(f"[{v_num}] connection error → {ex}")

            time.sleep(3.0)

    except KeyboardInterrupt:
        logger.info("Simulation halted.")
    finally:
        client.close()


if __name__ == "__main__":
    simulate_step()
