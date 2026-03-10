from database import supabase
from utils.level import score_to_level

def get_diagnostic_questions():
    result = supabase.table("questions")\
        .select("*")\
        .eq("stage", "diagnostic")\
        .execute()
    return result.data

def submit_diagnostic(student_id: int, answers: list):
    questions = get_diagnostic_questions()

    question_map = {}
    for q in questions:
        question_map[q["id"]] = q

    subtopic_scores = {}
    for answer in answers:
        question_id = answer["question_id"]
        student_answer = answer["student_answer"]
        subtopic_id = answer["subtopic_id"]

        if question_id not in question_map:
            continue

        correct = question_map[question_id]["correct_answer"]
        is_correct = student_answer.upper() == correct.upper()

        if subtopic_id not in subtopic_scores:
            subtopic_scores[subtopic_id] = {"correct": 0, "total": 0}

        subtopic_scores[subtopic_id]["total"] += 1
        if is_correct:
            subtopic_scores[subtopic_id]["correct"] += 1

        supabase.table("quiz_attempts").insert({
            "student_id": student_id,
            "question_id": question_id,
            "subtopic_id": subtopic_id,
            "student_answer": student_answer,
            "correct_answer": correct,
            "is_correct": is_correct
        }).execute()

    all_subtopics = supabase.table("subtopics").select("id, title").execute().data

    results = []
    for subtopic in all_subtopics:
        subtopic_id = subtopic["id"]

        if subtopic_id in subtopic_scores:
            score_data = subtopic_scores[subtopic_id]
            score_percent = int((score_data["correct"] / score_data["total"]) * 100)
        else:
            score_percent = 0

        level = score_to_level(score_percent)

        existing = supabase.table("student_progress")\
            .select("id")\
            .eq("student_id", student_id)\
            .eq("subtopic_id", subtopic_id)\
            .execute()

        if existing.data:
            supabase.table("student_progress")\
                .update({
                    "current_level": level,
                    "last_quiz_score": score_percent
                })\
                .eq("student_id", student_id)\
                .eq("subtopic_id", subtopic_id)\
                .execute()
        else:
            supabase.table("student_progress").insert({
                "student_id": student_id,
                "subtopic_id": subtopic_id,
                "current_level": level,
                "last_quiz_score": score_percent,
                "total_sessions": 0
            }).execute()

        results.append({
            "subtopic_id": subtopic_id,
            "subtopic_title": subtopic["title"],
            "score_percent": score_percent,
            "assigned_level": level
        })

    supabase.table("students")\
        .update({"diagnostic_completed": True})\
        .eq("id", student_id)\
        .execute()

    return results