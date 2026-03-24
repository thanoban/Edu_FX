from database import supabase
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_explanations(session_id: int, student_id: int):
    attempts = supabase.table("quiz_attempts")\
        .select("*, questions(*)")\
        .eq("session_id", session_id)\
        .eq("student_id", student_id)\
        .eq("is_correct", False)\
        .execute()

    if not attempts.data:
        return []

    progress = supabase.table("session_summary")\
        .select("subtopic_id")\
        .eq("id", session_id)\
        .execute()

    subtopic_id = progress.data[0]["subtopic_id"]

    progress_level = supabase.table("student_progress")\
        .select("current_level")\
        .eq("student_id", student_id)\
        .eq("subtopic_id", subtopic_id)\
        .execute()

    level = progress_level.data[0]["current_level"] if progress_level.data else "beginner"

    explanations = []

    for attempt in attempts.data:
        question = attempt["questions"]

        prompt = f"""
You are an A-Level Chemistry teacher explaining a wrong answer to a student.

STUDENT LEVEL: {level}
QUESTION: {question['question_text']}
OPTION A: {question['option_a']}
OPTION B: {question['option_b']}
OPTION C: {question['option_c']}
OPTION D: {question['option_d']}
STUDENT ANSWERED: {attempt['student_answer']}
CORRECT ANSWER: {attempt['correct_answer']}

Explain in simple terms why the correct answer is right
and why the student's answer is wrong.
Match explanation complexity to student level:
- beginner: very simple language, no complex terms
- intermediate: some technical terms with explanation
- advanced: full technical explanation

Maximum 3 sentences. Plain text only. No bullet points.
"""

        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )

        explanation_text = response.choices[0].message.content.strip()

        supabase.table("quiz_attempts")\
            .update({"explanation": explanation_text})\
            .eq("id", attempt["id"])\
            .execute()

        explanations.append({
            "attempt_id": attempt["id"],
            "question_id": attempt["question_id"],
            "question_text": question["question_text"],
            "option_a": question["option_a"],
            "option_b": question["option_b"],
            "option_c": question["option_c"],
            "option_d": question["option_d"],
            "student_answer": attempt["student_answer"],
            "correct_answer": attempt["correct_answer"],
            "explanation": explanation_text
        })

    return explanations