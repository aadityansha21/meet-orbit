"""Pydantic schemas shared by the LLM output parser and the HTTP API."""
from typing import Literal

from pydantic import BaseModel, Field


class Box(BaseModel):
    """Rectangle in screenshot pixels, origin top-left."""

    x: float
    y: float
    w: float
    h: float


class Shape(BaseModel):
    """Drawing primitive on a 100x100 grid. Lines/arrows use (x1,y1)->(x2,y2);
    rect uses (x1,y1)->(x2,y2) as opposite corners; circle uses center (x1,y1)
    and radius x2; text is anchored at (x1,y1)."""

    kind: Literal["line", "arrow", "rect", "circle", "text"]
    x1: float
    y1: float
    x2: float = 0
    y2: float = 0
    label: str = ""


class Step(BaseModel):
    """A single guidance step shown on the overlay."""

    title: str
    explanation: str
    target: Box | None = None
    diagram: list[Shape] = Field(default_factory=list)


class Guidance(BaseModel):
    """Structured model response."""

    mode: Literal["troubleshoot", "code", "stem"]
    summary: str
    steps: list[Step]


class AnalyzeRequest(BaseModel):
    """Payload sent by the Electron overlay."""

    image_b64: str
    width: int
    height: int
    query: str = ""
