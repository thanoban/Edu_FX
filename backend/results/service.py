from database import supabase
from utils.level import update_level
from datetime import date


def _get_session(session_id: int):
    session = (
        supabase.table("session_summary")
        .select("*")
        .eq("id", session_id)
        .execute()
    )
    return session.data[0] if session.data else None


def _ensure_progress(student_id: int, subtopic_id: int):
    progress = (
        supabase.table("student_progress")
        .select("*")
        .eq("student_id", student_id)
        .eq("subtopic_id", subtopic_id)
        .execute()
    )
    if progress.data:
        return progress.data[0]

    inserted = (
        supabase.table("student_progress")
        .insert(
            {
                "student_id": student_id,
                "subtopic_id": subtopic_id,
                "current_level": "beginner",
                "last_quiz_score": 0,
                "total_sessions": 0,
            }
        )
        .execute()
    )
    return inserted.data[0]


def submit_quiz(student_id: int, session_id: int, subtopic_id: int, webcam_enabled: bool, answers: list):
    session = _get_session(session_id)
    if not session:
        raise ValueError("Session not found")
    if session["student_id"] != student_id or session["subtopic_id"] != subtopic_id:
        raise ValueError("Session does not match the submitted quiz")
    if not answers:
        raise ValueError("Quiz answers are required")

    questions_ids = [a["question_id"] for a in answers]
    questions_result = supabase.table("questions")\
        .select("*")\
        .in_("id", questions_ids)\
        .execute()
    if not questions_result.data:
        raise ValueError("No matching questions were found")

    question_map = {}
    for q in questions_result.data:
        question_map[q["id"]] = q

    missing_ids = [question_id for question_id in questions_ids if question_id not in question_map]
    if missing_ids:
        raise ValueError("Some submitted questions could not be validated")

    correct_count = 0
    total = len(answers)

    for answer in answers:
        question_id = answer["question_id"]
        student_answer = answer["student_answer"]

        correct = str(question_map[question_id]["correct_answer"]).upper()
        is_correct = student_answer.upper() == correct.upper()

        if is_correct:
            correct_count += 1

        supabase.table("quiz_attempts").insert({
            "student_id": student_id,
            "session_id": session_id,
            "question_id": question_id,
            "subtopic_id": subtopic_id,
            "student_answer": student_answer,
            "correct_answer": correct,
            "is_correct": is_correct
        }).execute()

    quiz_score = int((correct_count / total) * 100)

    progress = _ensure_progress(student_id, subtopic_id)

    previous_level = progress["current_level"]
    new_level = update_level(previous_level, quiz_score)

    supabase.table("student_progress")\
        .update({
            "current_level": new_level,
            "last_quiz_score": quiz_score,
            "last_studied_date": date.today().isoformat(),
            "total_sessions": progress.get("total_sessions", 0) + 1
        })\
        .eq("student_id", student_id)\
        .eq("subtopic_id", subtopic_id)\
        .execute()

    supabase.table("session_summary")\
        .update({
            "quiz_score": quiz_score,
            "correct_answers": correct_count,
            "total_questions": total,
            "webcam_enabled": webcam_enabled
        })\
        .eq("id", session_id)\
        .execute()

    return {
        "session_id": session_id,
        "total_questions": total,
        "correct_answers": correct_count,
        "quiz_score": quiz_score,
        "previous_level": previous_level,
        "new_level": new_level,
        "level_changed": previous_level != new_level,
        "wrong_count": total - correct_count
    }

def get_session_results(session_id: int, student_id: int):
    session = supabase.table("session_summary")\
        .select("*")\
        .eq("id", session_id)\
        .eq("student_id", student_id)\
        .execute()

    if not session.data:
        return None

    attempts = supabase.table("quiz_attempts")\
        .select("*, questions(*)")\
        .eq("session_id", session_id)\
        .eq("student_id", student_id)\
        .execute()

    session_data = session.data[0]
    session_data["attempts"] = attempts.data

    return session_data
