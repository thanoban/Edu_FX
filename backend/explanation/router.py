from fastapi import APIRouter
from explanation.service import generate_explanations
from utils.response import success_response, error_response

router = APIRouter()

@router.get("/{session_id}/{student_id}")
def get_explanations(session_id: int, student_id: int):
    try:
        data = generate_explanations(session_id, student_id)
        return success_response("Explanations generated", {
            "session_id": session_id,
            "explanations": data
        })
    except Exception as e:
        return error_response(str(e))