from groq import Groq
from dotenv import load_dotenv
import os
import json

from rag.retriever import retrieve

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def _parse_json_payload(text: str):
    cleaned = text.strip()

    if "```" in cleaned:
        chunks = [chunk.strip() for chunk in cleaned.split("```") if chunk.strip()]
        cleaned = chunks[0]
        if cleaned.startswith("json"):
            cleaned = cleaned[4:].strip()

    return json.loads(cleaned)


def _normalise_question(question: dict):
    required_fields = [
        "question_text",
        "option_a",
        "option_b",
        "option_c",
        "option_d",
        "correct_answer",
        "difficulty",
    ]
    missing = [field for field in required_fields if field not in question]
    if missing:
        raise ValueError(f"Question payload missing fields: {', '.join(missing)}")

    correct_answer = str(question["correct_answer"]).upper()
    if correct_answer not in {"A", "B", "C", "D"}:
        raise ValueError("Question payload contains an invalid correct answer")

    difficulty_map = {
        "easy": "easy",
        "medium": "medium",
        "hard": "hard",
    }
    difficulty = difficulty_map.get(str(question["difficulty"]).lower())
    if not difficulty:
        raise ValueError("Question payload contains an invalid difficulty")

    return {
        "question_text": str(question["question_text"]).strip(),
        "option_a": str(question["option_a"]).strip(),
        "option_b": str(question["option_b"]).strip(),
        "option_c": str(question["option_c"]).strip(),
        "option_d": str(question["option_d"]).strip(),
        "correct_answer": correct_answer,
        "difficulty": difficulty,
    }


def generate_quiz(level: str, subtopic_title: str, group_name: str, content_body: str, past_wrong: list, subtopic_id: int | None = None) -> list:
    if not content_body.strip():
        raise ValueError("Cannot generate a personalized quiz without content notes")

    retrieved_context = ""
    if subtopic_id is not None:
        chunks = retrieve(f"{subtopic_title} {level} A-Level chemistry", subtopic_id)
        if chunks:
            retrieved_context = "Retrieved context from notes:\n" + "\n---\n".join(chunks) + "\n\n"

    wrong_questions_text = ""
    if past_wrong:
        wrong_questions_text = "STUDENT PAST WRONG QUESTIONS:\n"
        for item in past_wrong:
            wrong_questions_text += f"""
Question: {item['question_text']}
Student answered: {item['student_answer']}
Correct answer: {item['correct_answer']}
Times wrong: {item['times_wrong']}
"""

    prompt = f"""
You are an A-Level Chemistry examiner for S-Block Inorganic Chemistry.

STUDENT LEVEL: {level}
SUBTOPIC: {subtopic_title}
GROUP: {group_name}

{retrieved_context}CONTENT (generate questions ONLY from this):
{content_body}

{wrong_questions_text}

INSTRUCTIONS:
Generate exactly 15 questions total with this exact mix:

If past wrong questions exist:
- 6 questions similar to past wrong answer concepts
  (same concept, different wording, never copy exact question)
- 4 questions from random areas of the content
  (covers concepts student may have forgotten)
- 3 questions matching current difficulty level: {level}
- 2 questions from concepts not covered in wrong answers

If no past wrong questions:
- 8 questions covering all major concepts in content
- 4 questions at {level} difficulty
- 3 questions from random areas of content

Difficulty rules:
- beginner     = basic recall and definitions
- intermediate = application and understanding trends  
- advanced     = analysis equations and complex reasoning

Rules:
- Never copy exact past wrong questions
- Base ALL questions only on content provided above
- Every question must have exactly 4 options
- Only one correct answer per question
- All 15 questions must be unique concepts

Return ONLY a JSON array. No extra text. No markdown. No explanation.
[
  {{
    "question_text": "question here?",
    "option_a": "option A text",
    "option_b": "option B text",
    "option_c": "option C text",
    "option_d": "option D text",
    "correct_answer": "A",
    "difficulty": "easy"
  }}
]
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )

    text = response.choices[0].message.content.strip()
    try:
        questions = _parse_json_payload(text)
    except json.JSONDecodeError as exc:
        raise ValueError("Groq returned invalid quiz JSON") from exc

    if not isinstance(questions, list) or len(questions) != 15:
        raise ValueError("Groq did not return exactly 15 quiz questions")

    return [_normalise_question(question) for question in questions]
