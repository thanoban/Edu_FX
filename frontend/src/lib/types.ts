export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

export type StudentProfile = {
  student_id: number;
  name: string;
  email: string;
  diagnostic_completed: boolean;
};

export type Subtopic = {
  id: number;
  group_name: string;
  title: string;
  order_index: number;
};

export type DiagnosticQuestion = {
  id: number;
  subtopic_id: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
};

export type QuizQuestion = DiagnosticQuestion & {
  difficulty?: string;
  source?: string;
  stage?: string;
  student_id?: number | null;
};

export type DiagnosticResult = {
  subtopic_id: number;
  subtopic_title: string;
  score_percent: number;
  assigned_level: "beginner" | "intermediate" | "advanced";
};

export type StudyPlanItem = {
  subtopic_id: number;
  subtopic_title: string;
  group_name: string;
  current_level: string;
  is_overdue: boolean;
  last_quiz_score: number;
  last_studied_date: string | null;
  type: "weak" | "strong";
};

export type ContentRecord = {
  id: number;
  subtopic_id: number;
  body: string;
  level: string;
  subtopic_title: string;
  group_name: string;
};

export type QuizPayload = {
  session_id: number;
  subtopic_id: number;
  subtopic_title: string;
  stage: string;
  total_questions: number;
  questions: QuizQuestion[];
};

export type QuizResultPayload = {
  session_id: number;
  total_questions: number;
  correct_answers: number;
  quiz_score: number;
  previous_level: string;
  new_level: string;
  level_changed: boolean;
  wrong_count: number;
};

export type BehaviourSnapshotPayload = {
  student_id: number;
  session_id: number;
  face_detected: boolean;
  looking_away: boolean;
  phone_detected: boolean;
  drowsy: boolean;
  multiple_persons: boolean;
  talking: boolean;
  absent: boolean;
  focus_score: number;
};

export type BehaviourSummaryPayload = {
  student_id: number;
  session_id: number;
  subtopic_id: number;
  webcam_enabled: boolean;
  phone_percent: number;
  drowsy_percent: number;
  away_percent: number;
  talking_percent: number;
  absent_percent: number;
  focus_score: number;
};

export type BehaviourSession = BehaviourSummaryPayload & {
  snapshots: Array<
    BehaviourSnapshotPayload & {
      id: number;
      timestamp: string;
    }
  >;
};

export type SessionAttempt = {
  id: number;
  question_id: number;
  student_answer: string;
  correct_answer: string;
  is_correct: boolean;
  explanation: string | null;
  questions: QuizQuestion;
};

export type SessionResults = {
  id: number;
  student_id: number;
  subtopic_id: number;
  quiz_score: number;
  focus_score: number | null;
  phone_percent: number;
  drowsy_percent: number;
  away_percent: number;
  talking_percent: number;
  absent_percent: number;
  webcam_enabled: boolean;
  total_questions: number;
  correct_answers: number;
  attempts: SessionAttempt[];
};

export type ProgressRecord = {
  id: number;
  subtopic_id: number;
  current_level: string;
  last_studied_date: string | null;
  last_quiz_score: number;
  total_sessions: number;
  subtopics: {
    id: number;
    title: string;
    group_name: string;
  };
  session_history?: Array<{
    id: number;
    session_date: string;
    quiz_score: number;
    focus_score: number | null;
    created_at: string;
  }>;
};

export type BehaviourHistoryItem = {
  id: number;
  student_id: number;
  subtopic_id: number;
  session_date: string;
  quiz_score: number | null;
  focus_score: number | null;
  phone_percent: number;
  drowsy_percent: number;
  away_percent: number;
  talking_percent: number;
  absent_percent: number;
  webcam_enabled: boolean;
  total_questions: number | null;
  correct_answers: number | null;
  created_at: string;
  subtopics: {
    id: number;
    title: string;
    group_name: string;
  } | null;
};
