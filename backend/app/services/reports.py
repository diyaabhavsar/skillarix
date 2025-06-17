from fastapi import HTTPException
from .conversation import format_conversation_history,calculate_metrics
import json
from typing import List

def export_evaluation_report(
    conversation: List[dict],
    current_eval: str,
    mid_evals: List[str],
    complete_eval: str,
) -> str:
    """Generate a comprehensive evaluation report."""
    try:
        report = f"""
# Sales Conversation Evaluation Report

## Conversation Transcript
{format_conversation_history(conversation)}

## Real-time Evaluations
{chr(10).join(f"Exchange {i+1}:{chr(10)}{eval}" for i, eval in enumerate(mid_evals))}

## Current Evaluation
{current_eval}

## Complete Conversation Evaluation
{complete_eval}

## Metrics
{json.dumps(calculate_metrics(conversation), indent=2)}
"""
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating evaluation report: {str(e)}")
