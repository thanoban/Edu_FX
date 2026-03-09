from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from auth.router import router as auth_router
from diagnostic.router import router as diagnostic_router
from scheduler.router import router as scheduler_router
from content.router import router as content_router
from quiz.router import router as quiz_router
from results.router import router as results_router
from explanation.router import router as explanation_router
from progress.router import router as progress_router
from behaviour.router import router as behaviour_router

app = FastAPI(title="Adaptive Chemistry API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,        prefix="/auth")
app.include_router(diagnostic_router,  prefix="/diagnostic")
app.include_router(scheduler_router,   prefix="/scheduler")
app.include_router(content_router,     prefix="/content")
app.include_router(quiz_router,        prefix="/quiz")
app.include_router(results_router,     prefix="/results")
app.include_router(explanation_router, prefix="/explanation")
app.include_router(progress_router,    prefix="/progress")
app.include_router(behaviour_router,   prefix="/behaviour")

@app.get("/")
def root():
    return {"message": "Adaptive Chemistry API is running"}