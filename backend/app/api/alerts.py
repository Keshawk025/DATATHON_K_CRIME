from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.api.deps import get_current_user
from app.services.alert_service import AlertService
from app.schemas.common import StandardResponse
from app.schemas.alert import Alert as AlertSchema

router = APIRouter()

@router.get("", response_model=StandardResponse[List[AlertSchema]])
def get_alerts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve all system trend alerts.
    """
    alerts = AlertService.get_alerts(db)
    return {
        "success": True,
        "message": "Alerts retrieved successfully",
        "data": alerts
    }

@router.get("/active", response_model=StandardResponse[List[AlertSchema]])
def get_active_alerts(
    limit: int = Query(10, ge=1, le=100, description="Maximum active alerts to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve active/recent system trend alerts.
    """
    alerts = AlertService.get_active_alerts(db, limit)
    return {
        "success": True,
        "message": "Active alerts retrieved successfully",
        "data": alerts
    }
