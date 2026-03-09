from fastapi import APIRouter
from pydantic import BaseModel
from auth.service import register_student, login_student
from utils.response import success_response, error_response

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(req: RegisterRequest):
    data, error = register_student(req.name, req.email, req.password)
    if error:
        return error_response(error)
    return success_response("Student registered successfully", data)

@router.post("/login")
def login(req: LoginRequest):
    data, error = login_student(req.email, req.password)
    if error:
        return error_response(error)
    return success_response("Login successful", data)