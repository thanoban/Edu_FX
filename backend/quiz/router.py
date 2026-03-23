from fastapi import APIRouter
from quiz.service import get_quiz
from utils.response import success_response, error_response

router = APIRouter()

@router.get("/{subtopic_id}/{student_id}")
def fetch_quiz(subtopic_id: int, student_id: int):
    try:
        data = get_quiz(student_id, subtopic_id)
        return success_response("Quiz ready", data)
    except Exception as e:
        return error_response(str(e))