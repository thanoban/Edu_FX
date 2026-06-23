from database import supabase


def compute_focus_score(
    *,
    phone_detected: bool,
    absent: bool,
    drowsy: bool,
    looking_away: bool,
    multiple_persons: bool,
    talking: bool,
) -> int:
    score = 100
    if phone_detected:
        score -= 40
    if absent:
        score -= 50
    if drowsy:
        score -= 30
    if looking_away:
        score -= 20
    if multiple_persons:
        score -= 20
    if talking:
        score -= 10
    return max(0, score)


def _get_session(session_id: int):
    session = (
        supabase.table("session_summary")
        .select("*")
        .eq("id", session_id)
        .execute()
    )
    return session.data[0] if session.data else None


def _validate_session(session_id: int, student_id: int, subtopic_id: int | None = None):
    session = _get_session(session_id)
    if not session:
        raise ValueError("Session not found")
    if session["student_id"] != student_id:
        raise ValueError("Session does not belong to the student")
    if subtopic_id is not None and session["subtopic_id"] != subtopic_id:
        raise ValueError("Session subtopic does not match")
    return session


def save_snapshot(payload: dict):
    _validate_session(payload["session_id"], payload["student_id"])

    stored_focus_score = compute_focus_score(
        phone_detected=payload["phone_detected"],
        absent=payload["absent"],
        drowsy=payload["drowsy"],
        looking_away=payload["looking_away"],
        multiple_persons=payload["multiple_persons"],
        talking=payload["talking"],
    )

    result = (
        supabase.table("behaviour_logs")
        .insert(
            {
                "student_id": payload["student_id"],
                "session_id": payload["session_id"],
                "face_detected": payload["face_detected"],
                "looking_away": payload["looking_away"],
                "phone_detected": payload["phone_detected"],
                "drowsy": payload["drowsy"],
                "multiple_persons": payload["multiple_persons"],
                "talking": payload["talking"],
                "absent": payload["absent"],
                "focus_score": stored_focus_score,
            }
        )
        .execute()
    )

    return result.data[0] if result.data else None


def _percentage(logs: list, key: str) -> int:
    if not logs:
        return 0
    hits = sum(1 for log in logs if log.get(key))
    return int((hits / len(logs)) * 100)


def _aggregate_summary(logs: list):
    if not logs:
        return None

    total = len(logs)
    focused = sum(1 for log in logs if log.get("focus_score", 0) >= 80)

    return {
        "phone_percent": _percentage(logs, "phone_detected"),
        "drowsy_percent": _percentage(logs, "drowsy"),
        "away_percent": _percentage(logs, "looking_away"),
        "talking_percent": _percentage(logs, "talking"),
        "absent_percent": _percentage(logs, "absent"),
        "focus_score": int((focused / total) * 100),
    }


def save_summary(payload: dict):
    _validate_session(payload["session_id"], payload["student_id"], payload["subtopic_id"])

    logs = (
        supabase.table("behaviour_logs")
        .select("*")
        .eq("session_id", payload["session_id"])
        .eq("student_id", payload["student_id"])
        .order("timestamp")
        .execute()
    ).data

    aggregated = _aggregate_summary(logs)
    summary_values = {
        "webcam_enabled": payload["webcam_enabled"],
        "phone_percent": payload["phone_percent"],
        "drowsy_percent": payload["drowsy_percent"],
        "away_percent": payload["away_percent"],
        "talking_percent": payload["talking_percent"],
        "absent_percent": payload["absent_percent"],
        "focus_score": payload["focus_score"],
    }

    if aggregated:
        summary_values.update(aggregated)

    result = (
        supabase.table("session_summary")
        .update(summary_values)
        .eq("id", payload["session_id"])
        .execute()
    )

    return result.data[0] if result.data else _get_session(payload["session_id"])


def get_session_behaviour(session_id: int):
    session = _get_session(session_id)
    if not session:
        return None

    logs = (
        supabase.table("behaviour_logs")
        .select("*")
        .eq("session_id", session_id)
        .order("timestamp")
        .execute()
    )

    return {
        "session_id": session_id,
        "student_id": session["student_id"],
        "subtopic_id": session["subtopic_id"],
        "webcam_enabled": session.get("webcam_enabled", False),
        "focus_score": session.get("focus_score"),
        "phone_percent": session.get("phone_percent", 0),
        "drowsy_percent": session.get("drowsy_percent", 0),
        "away_percent": session.get("away_percent", 0),
        "talking_percent": session.get("talking_percent", 0),
        "absent_percent": session.get("absent_percent", 0),
        "snapshots": logs.data,
    }
