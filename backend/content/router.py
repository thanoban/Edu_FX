from fastapi import APIRouter
from content.service import get_all_subtopics, get_content_for_student
from utils.response import success_response, error_response

router = APIRouter()

@router.get("/subtopics")
def fetch_all_subtopics():
    try:
        data = get_all_subtopics()
        return success_response("Subtopics fetched", data)
    except Exception as e:
        return error_response(str(e))

@router.get("/{subtopic_id}/{student_id}")
def fetch_content(subtopic_id: int, student_id: int):
    try:
        data = get_content_for_student(subtopic_id, student_id)
        if not data:
            return error_response("Content not found")
        return success_response("Content fetched", data)
    except Exception as e:
        return error_response(str(e))