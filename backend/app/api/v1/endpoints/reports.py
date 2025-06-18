from fastapi import APIRouter, Depends, HTTPException
from ....schemas.conversation import ConversationPair
from ....services.reports import export_evaluation_report
from typing import List

router = APIRouter()


@router.post("/export-report")
async def export_report(
    conversation: List[ConversationPair],
    current_eval: str,
    mid_evals: List[str],
    complete_eval: str
):
    report = export_evaluation_report(conversation, current_eval, mid_evals, complete_eval)
    return {"report": report}
