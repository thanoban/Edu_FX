from database import supabase

def get_all_progress(student_id: int):
    progress = supabase.table("student_progress")\
        .select("*, subtopics(id, title, group_name)")\
        .eq("student_id", student_id)\
        .order("subtopic_id")\
        .execute()

    return progress.data

def get_subtopic_progress(student_id: int, subtopic_id: int):
    progress = supabase.table("student_progress")\
        .select("*, subtopics(id, title, group_name)")\
        .eq("student_id", student_id)\
        .eq("subtopic_id", subtopic_id)\
        .execute()

    if not progress.data:
        return None

    sessions = supabase.table("session_summary")\
        .select("*")\
        .eq("student_id", student_id)\
        .eq("subtopic_id", subtopic_id)\
        .order("created_at")\
        .execute()

    result = progress.data[0]
    result["session_history"] = sessions.data

    return result