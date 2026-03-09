from fastapi import APIRouter
from content.service import get_all_subtopics
from utils.response import success_response, error_response

router = APIRouter()

@router.get("/subtopics")
def fetch_all_subtopics():
    try:
        data = get_all_subtopics()
        return success_response("Subtopics fetched", data)
    except Exception as e:
        return error_response(str(e))