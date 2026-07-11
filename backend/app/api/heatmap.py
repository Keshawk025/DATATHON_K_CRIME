from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from typing import List, Optional

from app.database.session import get_db
from app.api.deps import get_current_user
from app.services.heatmap_service import HeatmapService
from app.schemas.common import StandardResponse
from app.schemas.heatmap import HeatmapPoint, HotspotItem, DistrictStatistics

router = APIRouter()

def get_heatmap_filters(
    district: Optional[UUID] = Query(None, description="Filter by district ID"),
    crime_type: Optional[UUID] = Query(None, description="Filter by crime category ID"),
    status: Optional[str] = Query(None, description="Filter by case status"),
    severity: Optional[int] = Query(None, description="Filter by severity level (1-5)"),
    date_from: Optional[date] = Query(None, description="Filter by occurrence start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="Filter by occurrence end date (YYYY-MM-DD)")
) -> dict:
    return {
        "district_id": district,
        "crime_type_id": crime_type,
        "status": status,
        "severity": severity,
        "date_from": date_from,
        "date_to": date_to
    }

@router.get("", response_model=StandardResponse[List[HeatmapPoint]])
def get_heatmap(
    filters: dict = Depends(get_heatmap_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve geolocated crime marker coordinates for Leaflet mapping and density plots.
    """
    data = HeatmapService.get_heatmap_points(db, filters)
    return {
        "success": True,
        "message": "Heatmap incident coordinates retrieved successfully",
        "data": data
    }

@router.get("/hotspots", response_model=StandardResponse[List[HotspotItem]])
def get_hotspots(
    filters: dict = Depends(get_heatmap_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve computed hotspot scores and risk categories for each district overlay.
    """
    data = HeatmapService.get_hotspots(db, filters)
    return {
        "success": True,
        "message": "District hotspots risk scores retrieved successfully",
        "data": data
    }

@router.get("/districts/{id}/statistics", response_model=StandardResponse[DistrictStatistics])
def get_district_statistics(
    id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve extensive crime metadata and recent incident listings for a single district.
    """
    data = HeatmapService.get_district_statistics(db, id)
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found in database"
        )
    return {
        "success": True,
        "message": "District statistics retrieved successfully",
        "data": data
    }
