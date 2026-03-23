from database import supabase
from utils.level import update_level

def submit_quiz(student_id: int, session_id: int, subtopic_id: int, webcam_enabled: bool, answers: list):
    questions_ids = [a["question_id"] for a in answers]
    questions_result = supabase.table("questions")\
        .select("*")\
        .in_("id", questions_ids)\
        .execute()

    question_map = {}
    for q in questions_result.data:
        question_map[q["id"]] = q

    correct_count = 0
    total = len(answers)

    for answer in answers:
        question_id = answer["question_id"]
        student_answer = answer["student_answer"]

        correct = question_map[question_id]["correct_answer"]
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

    progress = supabase.table("student_progress")\
        .select("current_level")\
        .eq("student_id", student_id)\
        .eq("subtopic_id", subtopic_id)\
        .execute()

    previous_level = progress.data[0]["current_level"] if progress.data else "beginner"
    new_level = update_level(previous_level, quiz_score)

    supabase.table("student_progress")\
        .update({
            "current_level": new_level,
            "last_quiz_score": quiz_score,
            "last_studied_date": "now()",
            "total_sessions": progress.data[0].get("total_sessions", 0) + 1
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