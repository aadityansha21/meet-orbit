"""LangChain pipeline: screenshot + question -> structured guidance."""
import os

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from prompts import DEFAULT_QUERY, SYSTEM_PROMPT, USER_TEMPLATE
from schemas import AnalyzeRequest, Guidance

MODEL = os.getenv("ORBIT_MODEL", "qwen2.5vl:7b")

_llm = ChatOllama(model=MODEL, temperature=0.2).with_structured_output(
    Guidance, method="json_schema"
)


def analyze(req: AnalyzeRequest) -> Guidance:
    """Run the vision model on a screenshot and return validated guidance."""
    text = USER_TEMPLATE.format(
        width=req.width, height=req.height, query=req.query or DEFAULT_QUERY
    )
    messages = [
        SystemMessage(SYSTEM_PROMPT),
        HumanMessage(
            content=[
                {"type": "text", "text": text},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{req.image_b64}"},
                },
            ]
        ),
    ]
    return _llm.invoke(messages)
