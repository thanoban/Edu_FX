from dotenv import load_dotenv
from database import supabase

load_dotenv()

def verify_token(token: str) -> dict:
    try:
        response = supabase.auth.get_user(token)
        user = response.user if response else None
        if not user or not user.email:
            return None

        return {
            "email": user.email,
            "user_metadata": user.user_metadata or {},
            "app_metadata": user.app_metadata or {},
            "sub": user.id
        }
    except Exception:
        return None

def get_or_create_student(email: str, name: str) -> dict:
    existing = supabase.table("students")\
        .select("*")\
        .eq("email", email)\
        .execute()

    if existing.data:
        return existing.data[0]

    new_student = supabase.table("students").insert({
        "name": name,
        "email": email,
        "diagnostic_completed": False
    }).execute()

    return new_student.data[0]
