import { API_BASE_URL } from "@/lib/constants";
import type {
  ApiResponse,
  BehaviourHistoryItem,
  BehaviourSession,
  BehaviourSnapshotPayload,
  BehaviourSummaryPayload,
  ContentRecord,
  DiagnosticQuestion,
  DiagnosticResult,
  ProgressRecord,
  QuizPayload,
  QuizResultPayload,
  SessionResults,
  StudentProfile,
  StudyPlanItem,
  Subtopic
} from "@/lib/types";

type RequestOptions = {
  method?: "GET" | "POST";
  token?: string | null;
  body?: unknown;
};

async function apiFetch<T>(
  path: string,
  { method = "GET", token, body }: RequestOptions = {}
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store"
  });

  const payload = (await response.json()) as ApiResponse<T>;

  if (!response.ok || !payload.success || payload.data === null) {
    throw new Error(payload.message || `Request failed for ${path}`);
  }

  return payload.data;
}

export function loginStudent(token: string) {
  return apiFetch<StudentProfile>("/auth/google", { method: "POST", token });
}

export function checkDiagnostic(token: string) {
  return apiFetch<Pick<StudentProfile, "student_id" | "diagnostic_completed">>(
    "/auth/check",
    { token }
  );
}

export async function fetchDiagnosticQuestions() {
  const data = await apiFetch<{
    total_questions: number;
    questions: DiagnosticQuestion[];
  }>("/diagnostic/questions");
  return data.questions;
}

export function submitDiagnostic(
  studentId: number,
  answers: Array<{
    question_id: number;
    subtopic_id: number;
    student_answer: string;
  }>
) {
  return apiFetch<{ results: DiagnosticResult[] }>("/diagnostic/submit", {
    method: "POST",
    body: {
      student_id: studentId,
      answers
    }
  });
}

export async function fetchStudyPlan(studentId: number) {
  const data = await apiFetch<{ plan: StudyPlanItem[] }>(
    `/scheduler/todays-plan/${studentId}`
  );
  return data.plan;
}

export function fetchSubtopics() {
  return apiFetch<Subtopic[]>("/content/subtopics");
}

export function fetchContent(subtopicId: number, studentId: number) {
  return apiFetch<ContentRecord>(`/content/${subtopicId}/${studentId}`);
}

export function fetchQuiz(subtopicId: number, studentId: number) {
  return apiFetch<QuizPayload>(`/quiz/${subtopicId}/${studentId}`);
}

export function submitBehaviourSnapshot(payload: BehaviourSnapshotPayload) {
  return apiFetch<BehaviourSnapshotPayload>("/behaviour/save-snapshot", {
    method: "POST",
    body: payload
  });
}

export function submitBehaviourSummary(payload: BehaviourSummaryPayload) {
  return apiFetch<BehaviourSummaryPayload>("/behaviour/save-summary", {
    method: "POST",
    body: payload
  });
}

export function submitQuiz(
  studentId: number,
  sessionId: number,
  subtopicId: number,
  webcamEnabled: boolean,
  answers: Array<{ question_id: number; student_answer: string }>
) {
  return apiFetch<QuizResultPayload>("/results/submit-quiz", {
    method: "POST",
    body: {
      student_id: studentId,
      session_id: sessionId,
      subtopic_id: subtopicId,
      webcam_enabled: webcamEnabled,
      answers
    }
  });
}

export function fetchSessionResults(sessionId: number, studentId: number) {
  return apiFetch<SessionResults>(`/results/session/${sessionId}/${studentId}`);
}

export async function fetchExplanations(sessionId: number, studentId: number) {
  const data = await apiFetch<{
    session_id: number;
    explanations: Array<{
      attempt_id: number;
      explanation: string;
    }>;
  }>(`/explanation/${sessionId}/${studentId}`);
  return data.explanations;
}

export function fetchProgress(studentId: number) {
  return apiFetch<{ student_id: number; progress: ProgressRecord[] }>(
    `/progress/${studentId}`
  );
}

export function fetchSubtopicProgress(studentId: number, subtopicId: number) {
  return apiFetch<ProgressRecord>(`/progress/${studentId}/${subtopicId}`);
}

export function fetchBehaviourSession(sessionId: number) {
  return apiFetch<BehaviourSession>(`/behaviour/session/${sessionId}`);
}

export function fetchBehaviourHistory(studentId: number) {
  return apiFetch<{ student_id: number; sessions: BehaviourHistoryItem[] }>(
    `/behaviour/student/${studentId}`
  );
}
