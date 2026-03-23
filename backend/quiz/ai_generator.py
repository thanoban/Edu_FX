from groq import Groq
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_quiz(level: str, subtopic_title: str, group_name: str, content_body: str, past_wrong: list) -> list:

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

CONTENT (generate questions ONLY from this):
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

    if "```" in text:
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]
    text = text.strip()

    questions = json.loads(text)
    return questions