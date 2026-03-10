from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from diagnostic.service import get_diagnostic_questions, submit_diagnostic
from utils.response import success_response, error_response

router = APIRouter()

class AnswerItem(BaseModel):
    question_id: int
    subtopic_id: int
    student_answer: str

class DiagnosticSubmit(BaseModel):
    student_id: int
    answers: List[AnswerItem]

@router.get("/questions")
def fetch_diagnostic_questions():
    try:
        data = get_diagnostic_questions()
        return success_response("Diagnostic questions fetched", {
            "total_questions": len(data),
            "questions": data
        })
    except Exception as e:
        return error_response(str(e))

@router.post("/submit")
def submit_diagnostic_answers(req: DiagnosticSubmit):
    try:
        answers = [a.dict() for a in req.answers]
        results = submit_diagnostic(req.student_id, answers)
        return success_response("Diagnostic completed", {"results": results})
    except Exception as e:
        return error_response(str(e))