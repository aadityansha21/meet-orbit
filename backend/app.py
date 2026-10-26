"""FastAPI entrypoint. Bound to localhost; consumed by the Electron overlay."""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from assistant import MODEL, analyze
from schemas import AnalyzeRequest, Guidance

app = FastAPI(title="Orbit backend")
# The overlay loads from file://, so its origin is opaque.
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "model": MODEL}


@app.post("/analyze", response_model=Guidance)
def analyze_screen(req: AnalyzeRequest) -> Guidance:
    try:
        return analyze(req)
    except Exception as exc:  # surface Ollama/validation errors to the UI
        raise HTTPException(status_code=502, detail=str(exc)) from exc
