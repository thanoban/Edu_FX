from database import supabase

def get_all_subtopics():
    result = supabase.table("subtopics")\
        .select("*")\
        .order("order_index")\
        .execute()
    return result.data

def get_content_for_student(subtopic_id: int, student_id: int):
    progress = supabase.table("student_progress")\
        .select("current_level")\
        .eq("student_id", student_id)\
        .eq("subtopic_id", subtopic_id)\
        .execute()

    if not progress.data:
        level = "beginner"
    else:
        level = progress.data[0]["current_level"]

    content = supabase.table("content")\
        .select("*")\
        .eq("subtopic_id", subtopic_id)\
        .eq("level", level)\
        .execute()

    if not content.data:
        return None

    subtopic = supabase.table("subtopics")\
        .select("title, group_name")\
        .eq("id", subtopic_id)\
        .execute()

    result = content.data[0]
    result["subtopic_title"] = subtopic.data[0]["title"]
    result["group_name"] = subtopic.data[0]["group_name"]
    result["level"] = level

    return result