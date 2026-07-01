export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://placeholder-project.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder-anon-key";

export const FACE_LANDMARKER_WASM_URL =
  process.env.NEXT_PUBLIC_FACE_LANDMARKER_WASM_URL ??
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

export const FACE_LANDMARKER_MODEL_URL =
  process.env.NEXT_PUBLIC_FACE_LANDMARKER_MODEL_URL ??
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

export const PHONE_MODEL_PATH = "/models/phone/phone_detection_model.tflite";
export const PHONE_MODEL_META_PATH = "/models/phone/model_config.json";
export const PHONE_PREPROCESSOR_PATH =
  "/models/phone/preprocessor_config.json";
