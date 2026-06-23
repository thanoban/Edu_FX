from fastapi import APIRouter

from behaviour.service import (
    get_session_behaviour,
    get_student_behaviour_history,
    save_snapshot,
    save_summary,
)
from schemas import BehaviourSnapshotRequest, BehaviourSummaryRequest
from utils.response import error_response, success_response

router = APIRouter()


@router.post("/save-snapshot")
def create_snapshot(req: BehaviourSnapshotRequest):
    try:
        data = save_snapshot(req.model_dump())
        return success_response("Behaviour snapshot saved", data)
    except Exception as e:
        return error_response(str(e))


@router.post("/save-summary")
def create_summary(req: BehaviourSummaryRequest):
    try:
        data = save_summary(req.model_dump())
        return success_response("Behaviour summary saved", data)
    except Exception as e:
        return error_response(str(e))


@router.get("/session/{session_id}")
def fetch_session_behaviour(session_id: int):
    try:
        data = get_session_behaviour(session_id)
        if not data:
            return error_response("Session behaviour not found")
        return success_response("Behaviour session fetched", data)
    except Exception as e:
        return error_response(str(e))


@router.get("/student/{student_id}")
def fetch_student_behaviour_history(student_id: int):
    try:
        data = get_student_behaviour_history(student_id)
        return success_response(
            "Behaviour history fetched",
            {
                "student_id": student_id,
                "sessions": data,
            },
        )
    except Exception as e:
        return error_response(str(e))
