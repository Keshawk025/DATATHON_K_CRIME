from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

from app.database.session import get_db
from app.api.deps import get_current_user
from app.ml.prediction import Predictor
from app.schemas.common import StandardResponse

router = APIRouter()

# Input validation schemas
class HotspotPredictRequest(BaseModel):
    district_id: UUID
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2030)

class RiskPredictRequest(BaseModel):
    age: int = Field(..., ge=1, le=120)
    gender: str = Field(..., description="Male or Female")
    past_fir_count: int = Field(..., ge=0)
    avg_severity: float = Field(..., ge=1.0, le=5.0)

class TrendPredictRequest(BaseModel):
    months_ahead: int = Field(6, ge=1, le=24)

class AnomalyPredictRequest(BaseModel):
    latitude: float
    longitude: float
    severity: float = Field(..., ge=1.0, le=5.0)
    month: int = Field(..., ge=1, le=12)
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")

# Endpoints
@router.get("/model-status", response_model=StandardResponse[Dict[str, Any]])
def get_model_status(
    current_user = Depends(get_current_user)
):
    """
    Get current loading status, training date, and accuracy metrics for all models.
    """
    status_data = Predictor.get_status()
    return {
        "success": True,
        "message": "Model status loaded successfully",
        "data": status_data
    }

@router.post("/hotspot", response_model=StandardResponse[Dict[str, Any]])
def predict_hotspot(
    payload: HotspotPredictRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Predict crime count and hotspot density score for a specific district and time.
    """
    try:
        pred = Predictor.predict_hotspot(db, str(payload.district_id), payload.month, payload.year)
        return {
            "success": True,
            "message": "Hotspot prediction generated successfully",
            "data": pred
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Hotspot prediction failed: {str(e)}"
        )

@router.post("/risk", response_model=StandardResponse[Dict[str, Any]])
def predict_risk(
    payload: RiskPredictRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Predict recidivism risk score and risk level classification.
    """
    try:
        pred = Predictor.predict_risk(db, payload.age, payload.gender, payload.past_fir_count, payload.avg_severity)
        return {
            "success": True,
            "message": "Risk score prediction generated successfully",
            "data": pred
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk prediction failed: {str(e)}"
        )

@router.post("/trend", response_model=StandardResponse[List[Dict[str, Any]]])
def predict_trend(
    payload: TrendPredictRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Forecast total crime occurrences monthly for the next N months.
    """
    try:
        pred = Predictor.predict_trend(db, payload.months_ahead)
        return {
            "success": True,
            "message": "Trend forecast generated successfully",
            "data": pred
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trend forecasting failed: {str(e)}"
        )

@router.post("/anomaly", response_model=StandardResponse[Dict[str, Any]])
def predict_anomaly(
    payload: AnomalyPredictRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Classify whether a crime coordinate and date represents a statistical anomaly.
    """
    try:
        pred = Predictor.predict_anomaly(db, payload.latitude, payload.longitude, payload.severity, payload.month, payload.day_of_week)
        return {
            "success": True,
            "message": "Anomaly prediction completed successfully",
            "data": pred
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Anomaly classification failed: {str(e)}"
        )
