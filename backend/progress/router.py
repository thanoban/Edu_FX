from fastapi import APIRouter
from progress.service import get_all_progress, get_subtopic_progress
from utils.response import success_response, error_response

router = APIRouter()

@router.get("/{student_id}")
def fetch_all_progress(student_id: int):
    try:
        data = get_all_progress(student_id)
        return success_response("Progress fetched", {
            "student_id": student_id,
            "progress": data
        })
    except Exception as e:
        return error_response(str(e))

@router.get("/{student_id}/{subtopic_id}")
def fetch_subtopic_progress(student_id: int, subtopic_id: int):
    try:
        data = get_subtopic_progress(student_id, subtopic_id)
        if not data:
            return error_response("Progress not found")
        return success_response("Subtopic progress fetched", data)
    except Exception as e:
        return error_response(str(e))