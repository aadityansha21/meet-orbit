# Orbit

Hotkey-triggered, screen-aware assistant running on local models.
Press `Ctrl/Cmd+Shift+Space` to capture the screen, ask a question, and get
step-by-step guidance with on-screen highlights and diagrams.

| Mode         | What it does                                            |
| ------------ | ------------------------------------------------------- |
| troubleshoot | Walks through install errors, highlighting each control |
| code         | Finds the bug in on-screen code and shows the fix       |
| stem         | Beginner physics/chem/maths with steps and sketches     |

## Setup

```bash
ollama pull qwen2.5vl:7b   # or set ORBIT_MODEL to a smaller vision model
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r backend/requirements.txt
npm install
npm start
```

Set `ORBIT_PYTHON` to the venv interpreter if `python3` is not the right one.

## Layout

- `backend/` FastAPI + LangChain (Ollama vision model, structured output)
- `electron/` Hotkey, screen capture, transparent overlay UI
