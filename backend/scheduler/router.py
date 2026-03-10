from fastapi import APIRouter
from scheduler.service import get_todays_plan
from utils.response import success_response, error_response

router = APIRouter()

@router.get("/todays-plan/{student_id}")
def todays_plan(student_id: int):
    try:
        plan = get_todays_plan(student_id)
        return success_response("Today's plan ready", {"plan": plan})
    except Exception as e:
        return error_response(str(e))