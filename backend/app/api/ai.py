from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.api.deps import get_current_user
from app.ai.chat_service import ChatService
from app.ai.summary_service import SummaryService
from app.schemas.common import StandardResponse

router = APIRouter()

# Request schemas
class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, Any]] = []

class FIRSummaryRequest(BaseModel):
    fir_id: UUID

class DistrictSummaryRequest(BaseModel):
    district_id: UUID

class InvestigationRequest(BaseModel):
    criminal_id: UUID

class TrendAnalysisRequest(BaseModel):
    district_id: Optional[UUID] = None
    crime_type_id: Optional[UUID] = None

# Routes
@router.post("/chat", response_model=StandardResponse[Dict[str, str]])
def chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Process investigator chat message using database context and Gemini.
    """
    try:
        response_text = ChatService.process_chat(db, payload.message, payload.history)
        return {
            "success": True,
            "message": "Chat response generated successfully",
            "data": {"response": response_text}
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process chat: {str(e)}"
        )

@router.post("/fir-summary", response_model=StandardResponse[Dict[str, str]])
def summarize_fir(
    payload: FIRSummaryRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate structured AI summary for a specific FIR.
    """
    try:
        summary_text = SummaryService.generate_fir_summary(db, payload.fir_id)
        return {
            "success": True,
            "message": "FIR summary generated successfully",
            "data": {"summary": summary_text}
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate FIR summary: {str(e)}"
        )

@router.post("/district-summary", response_model=StandardResponse[Dict[str, str]])
def summarize_district(
    payload: DistrictSummaryRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate structured regional AI summary and security recommendations.
    """
    try:
        summary_text = SummaryService.generate_district_summary(db, payload.district_id)
        return {
            "success": True,
            "message": "District summary generated successfully",
            "data": {"summary": summary_text}
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate district summary: {str(e)}"
        )

@router.post("/investigation", response_model=StandardResponse[Dict[str, str]])
def generate_investigation_plan(
    payload: InvestigationRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate tactical AI investigation recommendations for a specific criminal target.
    """
    try:
        summary_text = SummaryService.generate_investigation(db, payload.criminal_id)
        return {
            "success": True,
            "message": "Investigation plan generated successfully",
            "data": {"summary": summary_text}
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate investigation plan: {str(e)}"
        )

@router.post("/trend-analysis", response_model=StandardResponse[Dict[str, str]])
def generate_trend_analysis(
    payload: TrendAnalysisRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate statistical trend analysis based on crime indicators.
    """
    try:
        filters = {
            "district_id": payload.district_id,
            "crime_type_id": payload.crime_type_id
        }
        summary_text = SummaryService.generate_trend_analysis(db, filters)
        return {
            "success": True,
            "message": "Trend analysis generated successfully",
            "data": {"summary": summary_text}
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate trend analysis: {str(e)}"
        )
