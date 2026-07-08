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
    # FP-101: SF → LA via US-101 / I-5 corridor
    "FP-101": [
        (37.7749, -122.4194),  # San Francisco, CA
        (37.5630, -121.9886),  # Fremont, CA
        (37.3382, -121.8863),  # San Jose, CA
        (36.9741, -121.9196),  # Watsonville, CA
        (36.6002, -121.8947),  # Salinas, CA
        (35.6870, -120.6588),  # Paso Robles, CA
        (35.2828, -120.6596),  # San Luis Obispo, CA
        (34.9530, -120.4357),  # Santa Maria, CA
        (34.4208, -119.6982),  # Santa Barbara, CA
        (34.2746, -118.7798),  # Thousand Oaks, CA
        (34.0522, -118.2437),  # Los Angeles, CA (destination)
    ],
    # FP-202: LA → San Diego via I-5
    "FP-202": [
        (34.0522, -118.2437),  # Los Angeles, CA
        (33.8958, -118.2201),  # Compton, CA
        (33.7701, -118.1937),  # Long Beach, CA
        (33.6695, -117.8232),  # Irvine, CA
        (33.4936, -117.1484),  # San Clemente, CA
        (33.1959, -117.3795),  # Oceanside, CA
        (33.1094, -117.2892),  # Carlsbad, CA
        (33.0167, -117.1497),  # Del Mar, CA
        (32.7157, -117.1611),  # San Diego, CA (destination)
    ],
    # FP-303: New York → Boston via I-95
    "FP-303": [
        (40.7128,  -74.0060),  # New York, NY
        (40.8448,  -73.8648),  # Bronx, NY
        (41.0534,  -73.5387),  # Stamford, CT
        (41.3082,  -72.9279),  # New Haven, CT
        (41.5623,  -72.6509),  # Middletown, CT
        (41.7658,  -72.6851),  # Hartford, CT
        (41.9782,  -72.1984),  # Stafford Springs, CT
        (42.1015,  -71.5622),  # Worcester, MA
        (42.2626,  -71.8023),  # Framingham, MA
        (42.3601,  -71.0589),  # Boston, MA (destination)
    ],
    # FP-404: Chicago → Detroit via I-94
    "FP-404": [
        (41.8781,  -87.6298),  # Chicago, IL
        (41.7508,  -87.4626),  # Chicago Heights, IL
        (41.6064,  -87.3372),  # Lowell, IN
        (41.5867,  -86.2520),  # South Bend, IN
        (41.9781,  -85.9236),  # Sturgis, MI
        (42.2914,  -85.5872),  # Kalamazoo, MI
        (42.3314,  -83.0458),  # Detroit Metro, MI
        (42.3314,  -83.0458),  # Detroit, MI (destination)
    ],
    # FP-505 (Arjun Sharma) → Mumbai to Pune via NH-48 (India)
    "FP-505": [
        (19.0760,  72.8777),  # Mumbai (Bandra), MH
        (19.0330,  73.0297),  # Thane, MH
        (18.9975,  73.1213),  # Kalyan, MH
        (18.9068,  73.3559),  # Khopoli, MH
        (18.7811,  73.4877),  # Khandala (Ghats), MH
        (18.7563,  73.4784),  # Lonavala, MH
        (18.6524,  73.7792),  # Talegaon, MH
        (18.5204,  73.8567),  # Pune (destination), MH
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
