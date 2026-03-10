from database import supabase
from utils.date_helpers import days_since, is_on_cooldown

MAX_GAPS = {
    "beginner": 3,
    "intermediate": 7,
    "advanced": 14
}

MULTIPLIERS = {
    "beginner": 3.0,
    "intermediate": 2.0,
    "advanced": 0.5
}

def get_todays_plan(student_id: int):
    progress = supabase.table("student_progress")\
        .select("*, subtopics(id, title, group_name)")\
        .eq("student_id", student_id)\
        .execute().data

    weak_topics = []
    strong_topics = []

    for record in progress:
        last_studied = record.get("last_studied_date")
        level = record["current_level"]

        if is_on_cooldown(last_studied):
            continue

        gap = days_since(last_studied)

        if gap > MAX_GAPS.get(level, 14):
            score = 999 + gap
            is_overdue = True
        else:
            score = gap * MULTIPLIERS.get(level, 1.0)
            is_overdue = False

        entry = {
            "subtopic_id":       record["subtopic_id"],
            "subtopic_title":    record["subtopics"]["title"],
            "group_name":        record["subtopics"]["group_name"],
            "current_level":     level,
            "is_overdue":        is_overdue,
            "last_quiz_score":   record["last_quiz_score"],
            "last_studied_date": last_studied,
            "priority_score":    score
        }

        if level == "advanced":
            strong_topics.append(entry)
        else:
            weak_topics.append(entry)

    weak_topics.sort(key=lambda x: x["priority_score"], reverse=True)
    strong_topics.sort(key=lambda x: x["priority_score"], reverse=True)

    plan = weak_topics[:2] + strong_topics[:1]

    if len(plan) < 3:
        remaining = weak_topics[2:3 - len(plan) + 2]
        plan += remaining

    for entry in plan:
        entry.pop("priority_score")
        if entry in weak_topics:
            entry["type"] = "weak"
        else:
            entry["type"] = "strong"

    for entry in plan:
        if entry["current_level"] == "advanced":
            entry["type"] = "strong"
        else:
            entry["type"] = "weak"

    return plan