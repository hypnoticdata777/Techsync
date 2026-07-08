from services.matching_service import find_best_technician, score_technician


def make_technician(id, skills=None, zone=None, lat=None, lon=None, availability="available", max_daily_jobs=8):
    return {
        "id": id,
        "skills": skills or [],
        "zone": zone,
        "latitude": lat,
        "longitude": lon,
        "availability_status": availability,
        "max_daily_jobs": max_daily_jobs,
    }


def make_work_order(service_type="plumbing", lat=None, lon=None, address=None):
    return {"service_type": service_type, "latitude": lat, "longitude": lon, "address": address}


def test_off_duty_technician_is_excluded():
    tech = make_technician(1, skills=["plumbing"], availability="off_duty")
    wo = make_work_order()
    assert score_technician(tech, wo, active_count=0) is None


def test_technician_at_capacity_is_excluded():
    tech = make_technician(1, skills=["plumbing"], max_daily_jobs=2)
    wo = make_work_order()
    assert score_technician(tech, wo, active_count=2) is None
    assert score_technician(tech, wo, active_count=1) is not None


def test_skill_match_scores_higher_than_no_match():
    matching = make_technician(1, skills=["plumbing"])
    non_matching = make_technician(2, skills=["hvac"])
    wo = make_work_order(service_type="plumbing")

    matching_score = score_technician(matching, wo, active_count=0)
    non_matching_score = score_technician(non_matching, wo, active_count=0)
    assert matching_score > non_matching_score


def test_closer_technician_wins_proximity():
    near = make_technician(1, skills=["plumbing"], lat=40.0, lon=-73.0)
    far = make_technician(2, skills=["plumbing"], lat=41.5, lon=-70.0)
    wo = make_work_order(service_type="plumbing", lat=40.01, lon=-73.01)

    near_score = score_technician(near, wo, active_count=0)
    far_score = score_technician(far, wo, active_count=0)
    assert near_score > far_score


def test_less_busy_technician_preferred_when_otherwise_equal():
    idle = make_technician(1, skills=["plumbing"], max_daily_jobs=8)
    busy = make_technician(2, skills=["plumbing"], max_daily_jobs=8)
    wo = make_work_order(service_type="plumbing")

    idle_score = score_technician(idle, wo, active_count=0)
    busy_score = score_technician(busy, wo, active_count=6)
    assert idle_score > busy_score


def test_find_best_technician_picks_highest_scorer():
    technicians = [
        make_technician(1, skills=["hvac"]),
        make_technician(2, skills=["plumbing"]),
        make_technician(3, skills=[], availability="off_duty"),
    ]
    wo = make_work_order(service_type="plumbing")

    best = find_best_technician(technicians, wo, active_counts={})
    assert best["id"] == 2


def test_find_best_technician_returns_none_when_nobody_eligible():
    technicians = [make_technician(1, availability="off_duty"), make_technician(2, availability="busy")]
    wo = make_work_order()
    assert find_best_technician(technicians, wo, active_counts={}) is None


def test_zone_fallback_used_when_no_coordinates():
    tech = make_technician(1, skills=[], zone="north")
    wo = make_work_order(service_type="general", address="123 North Ave")
    score = score_technician(tech, wo, active_count=0)
    assert score is not None and score > 0
