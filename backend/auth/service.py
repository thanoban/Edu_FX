from database import supabase
import hashlib
import os

def hash_password(plain_password: str) -> str:
    salt = os.urandom(16).hex()
    hashed = hashlib.sha256((plain_password + salt).encode()).hexdigest()
    return f"{salt}:{hashed}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    salt, hashed = stored_hash.split(":")
    check = hashlib.sha256((plain_password + salt).encode()).hexdigest()
    return check == hashed

def register_student(name: str, email: str, password: str):
    existing = supabase.table("students").select("id").eq("email", email).execute()
    if existing.data:
        return None, "Email already exists"

    hashed = hash_password(password)
    result = supabase.table("students").insert({
        "name": name,
        "email": email,
        "password": hashed,
        "diagnostic_completed": False
    }).execute()

    student = result.data[0]
    return {
        "student_id": student["id"],
        "name": student["name"],
        "email": student["email"],
        "diagnostic_completed": student["diagnostic_completed"]
    }, None

def login_student(email: str, password: str):
    result = supabase.table("students").select("*").eq("email", email).execute()
    if not result.data:
        return None, "Invalid email or password"

    student = result.data[0]
    if not verify_password(password, student["password"]):
        return None, "Invalid email or password"

    return {
        "student_id": student["id"],
        "name": student["name"],
        "email": student["email"],
        "diagnostic_completed": student["diagnostic_completed"]
    }, None