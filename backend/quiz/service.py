from database import supabase
from quiz.ai_generator import generate_quiz

def check_first_attempt(student_id: int, subtopic_id: int) -> bool:
    first_questions = supabase.table("questions")\
        .select("id")\
        .eq("subtopic_id", subtopic_id)\
        .eq("stage", "first")\
        .execute()

    if not first_questions.data:
        return False

    first_ids = [q["id"] for q in first_questions.data]

    attempts = supabase.table("quiz_attempts")\
        .select("question_id")\
        .eq("student_id", student_id)\
        .in_("question_id", first_ids)\
        .execute()

    return len(attempts.data) == 0

def get_past_wrong_answers(student_id: int, subtopic_id: int) -> list:
    attempts = supabase.table("quiz_attempts")\
        .select("question_id, student_answer, correct_answer, questions(question_text)")\
        .eq("student_id", student_id)\
        .eq("subtopic_id", subtopic_id)\
        .eq("is_correct", False)\
        .execute().data

    wrong_map = {}
    for attempt in attempts:
        qid = attempt["question_id"]
        if qid not in wrong_map:
            wrong_map[qid] = {
                "question_text": attempt["questions"]["question_text"],
                "student_answer": attempt["student_answer"],
                "correct_answer": attempt["correct_answer"],
                "times_wrong": 1
            }
        else:
            wrong_map[qid]["times_wrong"] += 1

    return list(wrong_map.values())

def create_session(student_id: int, subtopic_id: int) -> int:
    result = supabase.table("session_summary").insert({
        "student_id": student_id,
        "subtopic_id": subtopic_id,
        "webcam_enabled": False
    }).execute()
    return result.data[0]["id"]

def get_quiz(student_id: int, subtopic_id: int):
    session_id = create_session(student_id, subtopic_id)
    is_first = check_first_attempt(student_id, subtopic_id)

    if is_first:
        result = supabase.table("questions")\
            .select("*")\
            .eq("subtopic_id", subtopic_id)\
            .eq("stage", "first")\
            .execute()
        questions = result.data
        stage = "first"
    else:
        past_wrong = get_past_wrong_answers(student_id, subtopic_id)

        progress = supabase.table("student_progress")\
            .select("current_level")\
            .eq("student_id", student_id)\
            .eq("subtopic_id", subtopic_id)\
            .execute()
        level = progress.data[0]["current_level"] if progress.data else "beginner"

        content = supabase.table("content")\
            .select("body")\
            .eq("subtopic_id", subtopic_id)\
            .eq("level", level)\
            .execute()
        content_body = content.data[0]["body"] if content.data else ""

        subtopic = supabase.table("subtopics")\
            .select("title, group_name")\
            .eq("id", subtopic_id)\
            .execute()
        subtopic_title = subtopic.data[0]["title"]
        group_name = subtopic.data[0]["group_name"]

        generated = generate_quiz(level, subtopic_title, group_name, content_body, past_wrong)

        questions = []
        for q in generated:
            saved = supabase.table("questions").insert({
                "subtopic_id": subtopic_id,
                "question_text": q["question_text"],
                "option_a": q["option_a"],
                "option_b": q["option_b"],
                "option_c": q["option_c"],
                "option_d": q["option_d"],
                "correct_answer": q["correct_answer"],
                "difficulty": q["difficulty"],
                "source": "live-gen",
                "stage": "personalized",
                "student_id": student_id,
                "is_diagnostic": False
            }).execute()
            questions.append(saved.data[0])

        stage = "personalized"

    subtopic_info = supabase.table("subtopics")\
        .select("title")\
        .eq("id", subtopic_id)\
        .execute()

    return {
        "session_id": session_id,
        "subtopic_id": subtopic_id,
        "subtopic_title": subtopic_info.data[0]["title"],
        "stage": stage,
        "total_questions": len(questions),
        "questions": questions
    }