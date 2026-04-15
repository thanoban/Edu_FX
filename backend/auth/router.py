from fastapi import APIRouter, Header
from utils.auth_helper import verify_token, get_or_create_student
from utils.response import success_response, error_response

router = APIRouter()

@router.post("/google")
def google_auth(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = verify_token(token)

        if not payload:
            return error_response("Invalid token")

        email = payload.get("email")
        name = payload.get("user_metadata", {}).get("full_name", email)

        student = get_or_create_student(email, name)

        return success_response("Login successful", {
            "student_id": student["id"],
            "name": student["name"],
            "email": student["email"],
            "diagnostic_completed": student["diagnostic_completed"]
        })

    except Exception as e:
        return error_response(str(e))

@router.get("/check")
def check_diagnostic(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        payload = verify_token(token)

        if not payload:
            return error_response("Invalid token")

        email = payload.get("email")

        student = supabase_check(email)
        return success_response("Status fetched", {
            "diagnostic_completed": student["diagnostic_completed"],
            "student_id": student["id"]
        })

    except Exception as e:
        return error_response(str(e))

def supabase_check(email: str):
    from database import supabase
    result = supabase.table("students")\
        .select("*")\
        .eq("email", email)\
        .execute()
    return result.data[0] if result.data else None