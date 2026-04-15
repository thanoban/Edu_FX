from jose import jwt, JWTError
from dotenv import load_dotenv
from database import supabase
import os

load_dotenv()

JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

def verify_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        return payload
    except JWTError:
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