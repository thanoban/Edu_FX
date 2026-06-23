from copy import deepcopy
from datetime import date
import unittest
from unittest.mock import patch

from behaviour import service as behaviour_service
from results import service as results_service


class FakeResponse:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    def __init__(self, database, table_name):
        self.database = database
        self.table_name = table_name
        self.filters = []
        self.in_filters = []
        self.order_field = None
        self.action = "select"
        self.payload = None

    def select(self, *_args, **_kwargs):
        self.action = "select"
        return self

    def eq(self, key, value):
        self.filters.append((key, value))
        return self

    def in_(self, key, values):
        self.in_filters.append((key, set(values)))
        return self

    def order(self, field, *_args, **_kwargs):
        self.order_field = field
        return self

    def insert(self, payload):
        self.action = "insert"
        self.payload = payload
        return self

    def update(self, payload):
        self.action = "update"
        self.payload = payload
        return self

    def execute(self):
        table = self.database.tables.setdefault(self.table_name, [])

        if self.action == "insert":
            payload = deepcopy(self.payload)
            if "id" not in payload:
                payload["id"] = self.database.next_id(self.table_name)
            table.append(payload)
            return FakeResponse([deepcopy(payload)])

        rows = [row for row in table if self._matches(row)]

        if self.action == "update":
            updated_rows = []
            for row in rows:
                row.update(deepcopy(self.payload))
                updated_rows.append(deepcopy(row))
            return FakeResponse(updated_rows)

        ordered_rows = deepcopy(rows)
        if self.order_field:
            ordered_rows.sort(key=lambda row: row.get(self.order_field))
        return FakeResponse(ordered_rows)

    def _matches(self, row):
        for key, value in self.filters:
            if row.get(key) != value:
                return False
        for key, values in self.in_filters:
            if row.get(key) not in values:
                return False
        return True


class FakeSupabase:
    def __init__(self, tables):
        self.tables = deepcopy(tables)

    def table(self, table_name):
        return FakeQuery(self, table_name)

    def next_id(self, table_name):
        table = self.tables.setdefault(table_name, [])
        return max((row.get("id", 0) for row in table), default=0) + 1


class BehaviourServiceTests(unittest.TestCase):
    def setUp(self):
        self.fake_supabase = FakeSupabase(
            {
                "session_summary": [
                    {
                        "id": 1,
                        "student_id": 7,
                        "subtopic_id": 3,
                        "webcam_enabled": False,
                        "phone_percent": 0,
                        "drowsy_percent": 0,
                        "away_percent": 0,
                        "talking_percent": 0,
                        "absent_percent": 0,
                        "focus_score": 0,
                    }
                ],
                "behaviour_logs": [],
            }
        )

    def test_save_snapshot_computes_focus_score(self):
        payload = {
            "student_id": 7,
            "session_id": 1,
            "face_detected": True,
            "looking_away": True,
            "phone_detected": True,
            "drowsy": False,
            "multiple_persons": False,
            "talking": True,
            "absent": False,
            "focus_score": 99,
        }

        with patch.object(behaviour_service, "supabase", self.fake_supabase):
            stored = behaviour_service.save_snapshot(payload)

        self.assertEqual(stored["focus_score"], 30)
        self.assertEqual(len(self.fake_supabase.tables["behaviour_logs"]), 1)

    def test_save_summary_aggregates_existing_logs(self):
        self.fake_supabase.tables["behaviour_logs"] = [
            {
                "id": 1,
                "student_id": 7,
                "session_id": 1,
                "timestamp": "2026-06-23T08:00:00",
                "face_detected": True,
                "looking_away": True,
                "phone_detected": True,
                "drowsy": False,
                "multiple_persons": False,
                "talking": False,
                "absent": False,
                "focus_score": 40,
            },
            {
                "id": 2,
                "student_id": 7,
                "session_id": 1,
                "timestamp": "2026-06-23T08:00:30",
                "face_detected": True,
                "looking_away": False,
                "phone_detected": False,
                "drowsy": True,
                "multiple_persons": False,
                "talking": True,
                "absent": False,
                "focus_score": 60,
            },
        ]

        payload = {
            "student_id": 7,
            "session_id": 1,
            "subtopic_id": 3,
            "webcam_enabled": True,
            "phone_percent": 0,
            "drowsy_percent": 0,
            "away_percent": 0,
            "talking_percent": 0,
            "absent_percent": 0,
            "focus_score": 0,
        }

        with patch.object(behaviour_service, "supabase", self.fake_supabase):
            updated = behaviour_service.save_summary(payload)

        self.assertTrue(updated["webcam_enabled"])
        self.assertEqual(updated["phone_percent"], 50)
        self.assertEqual(updated["drowsy_percent"], 50)
        self.assertEqual(updated["away_percent"], 50)
        self.assertEqual(updated["talking_percent"], 50)
        self.assertEqual(updated["focus_score"], 0)


class ResultsServiceTests(unittest.TestCase):
    def setUp(self):
        self.fake_supabase = FakeSupabase(
            {
                "session_summary": [
                    {
                        "id": 11,
                        "student_id": 7,
                        "subtopic_id": 3,
                        "webcam_enabled": False,
                    }
                ],
                "student_progress": [
                    {
                        "id": 4,
                        "student_id": 7,
                        "subtopic_id": 3,
                        "current_level": "intermediate",
                        "last_quiz_score": 55,
                        "last_studied_date": None,
                        "total_sessions": 2,
                    }
                ],
                "questions": [
                    {"id": 101, "correct_answer": "A"},
                    {"id": 102, "correct_answer": "B"},
                    {"id": 103, "correct_answer": "C"},
                ],
                "quiz_attempts": [],
            }
        )

    def test_submit_quiz_updates_progress_and_session(self):
        answers = [
            {"question_id": 101, "student_answer": "A"},
            {"question_id": 102, "student_answer": "B"},
            {"question_id": 103, "student_answer": "D"},
        ]

        with patch.object(results_service, "supabase", self.fake_supabase):
            result = results_service.submit_quiz(
                student_id=7,
                session_id=11,
                subtopic_id=3,
                webcam_enabled=True,
                answers=answers,
            )

        progress_row = self.fake_supabase.tables["student_progress"][0]
        session_row = self.fake_supabase.tables["session_summary"][0]

        self.assertEqual(result["quiz_score"], 66)
        self.assertEqual(progress_row["current_level"], "intermediate")
        self.assertEqual(progress_row["last_studied_date"], date.today().isoformat())
        self.assertEqual(progress_row["total_sessions"], 3)
        self.assertTrue(session_row["webcam_enabled"])
        self.assertEqual(session_row["correct_answers"], 2)

    def test_submit_quiz_rejects_wrong_session_owner(self):
        with patch.object(results_service, "supabase", self.fake_supabase):
            with self.assertRaisesRegex(ValueError, "Session does not match"):
                results_service.submit_quiz(
                    student_id=99,
                    session_id=11,
                    subtopic_id=3,
                    webcam_enabled=False,
                    answers=[{"question_id": 101, "student_answer": "A"}],
                )


if __name__ == "__main__":
    unittest.main()
