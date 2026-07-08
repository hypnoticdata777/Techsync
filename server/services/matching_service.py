"""
Rule-based technician matching engine (RF-14, RF-17).

Scores each available, under-capacity technician on three signals and returns
the highest scorer:
  - skill match: does the technician's skill list contain the work order's
    service_type?
  - proximity: haversine distance between technician and work order
    coordinates, when both are known.
  - workload: technicians with fewer currently-active work orders (relative
    to their max_daily_jobs) score higher, so load spreads across the team.

Priority order is applied by the router/service that decides which
open work orders to process first (RF-17 configurable rules can force a
work order's priority before it ever reaches the matcher); the matcher
itself just answers "who is the best fit for this one work order".
"""

import math
from typing import Optional

# Weights are intentionally simple/tunable constants for a POC-grade heuristic.
SKILL_MATCH_WEIGHT = 100.0
PROXIMITY_WEIGHT = 1.0  # points lost per km of distance
WORKLOAD_WEIGHT = 20.0  # points lost per fraction of capacity already used
MAX_PROXIMITY_PENALTY = 80.0  # cap so a very far technician can still win on skills


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def score_technician(technician: dict, work_order: dict, active_count: int) -> Optional[float]:
    """Returns None if the technician is not eligible at all (off duty / at capacity)."""
    if technician.get("availability_status") != "available":
        return None

    max_daily_jobs = technician.get("max_daily_jobs") or 8
    if active_count >= max_daily_jobs:
        return None

    score = 0.0

    skills = technician.get("skills") or []
    service_type = work_order.get("service_type")
    if service_type and service_type in skills:
        score += SKILL_MATCH_WEIGHT

    tech_lat, tech_lon = technician.get("latitude"), technician.get("longitude")
    wo_lat, wo_lon = work_order.get("latitude"), work_order.get("longitude")
    if tech_lat is not None and tech_lon is not None and wo_lat is not None and wo_lon is not None:
        distance_km = _haversine_km(tech_lat, tech_lon, wo_lat, wo_lon)
        penalty = min(distance_km * PROXIMITY_WEIGHT, MAX_PROXIMITY_PENALTY)
        score -= penalty
    elif technician.get("zone") and work_order.get("address"):
        # No coordinates available: fall back to a loose zone/address text match.
        if technician["zone"].lower() in work_order["address"].lower():
            score += SKILL_MATCH_WEIGHT / 4

    workload_fraction = active_count / max_daily_jobs
    score -= workload_fraction * WORKLOAD_WEIGHT

    return score


def find_best_technician(
    technicians: list[dict], work_order: dict, active_counts: dict[int, int]
) -> Optional[dict]:
    """Returns the best-fit technician dict, or None if nobody is eligible."""
    best_technician = None
    best_score = float("-inf")

    for technician in technicians:
        active_count = active_counts.get(technician["id"], 0)
        score = score_technician(technician, work_order, active_count)
        if score is None:
            continue
        if score > best_score:
            best_score = score
            best_technician = technician

    return best_technician
