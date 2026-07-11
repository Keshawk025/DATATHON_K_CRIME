from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from typing import List, Optional

from app.database.session import get_db
from app.api.deps import get_current_user
from app.services.dashboard_analytics_service import DashboardAnalyticsService
from app.schemas.common import StandardResponse
from app.schemas.dashboard import (
    AnalyticsSummary,
    DashboardTrends,
    DashboardDistributions,
    DistrictRankingItem,
    DashboardKPIs
)
from app.schemas.fir import FIR as FIRSchema

router = APIRouter()

def get_analytics_filters(
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

@router.get("/summary", response_model=StandardResponse[AnalyticsSummary])
def get_dashboard_summary(
    filters: dict = Depends(get_analytics_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve aggregate statistics including total crimes, active cases,
    solved cases, repeat offender counts, and high-risk hotspot districts.
    """
    data = DashboardAnalyticsService.get_summary(db, filters)
    return {
        "success": True,
        "message": "Dashboard summary analytics retrieved successfully",
        "data": data
    }

@router.get("/trends", response_model=StandardResponse[DashboardTrends])
def get_dashboard_trends(
    filters: dict = Depends(get_analytics_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve crime timeline trends grouped by year, month, week, and day.
    """
    data = DashboardAnalyticsService.get_trends(db, filters)
    return {
        "success": True,
        "message": "Crime trends timeline analytics retrieved successfully",
        "data": data
    }

@router.get("/distribution", response_model=StandardResponse[DashboardDistributions])
def get_dashboard_distributions(
    filters: dict = Depends(get_analytics_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve statistical distributions for category types, severity levels,
    case statuses, offender genders, and repeat offenders.
    """
    data = DashboardAnalyticsService.get_distributions(db, filters)
    return {
        "success": True,
        "message": "Crime distributions analytics retrieved successfully",
        "data": data
    }

@router.get("/district-ranking", response_model=StandardResponse[List[DistrictRankingItem]])
def get_district_ranking(
    filters: dict = Depends(get_analytics_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve ranked list of districts with their crime volume, top crime type,
    average risk score of involved criminals, and repeat offender counts.
    """
    data = DashboardAnalyticsService.get_district_ranking(db, filters)
    return {
        "success": True,
        "message": "District ranking analytics retrieved successfully",
        "data": data
    }

@router.get("/kpis", response_model=StandardResponse[DashboardKPIs])
def get_dashboard_kpis(
    filters: dict = Depends(get_analytics_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve dashboard KPI cards showing static system configurations
    alongside recent crime frequencies (today, this week, this month).
    """
    data = DashboardAnalyticsService.get_kpis(db, filters)
    return {
        "success": True,
        "message": "Dashboard KPIs retrieved successfully",
        "data": data
    }

@router.get("/recent-activity", response_model=StandardResponse[List[FIRSchema]])
def get_recent_activity(
    limit: int = Query(5, ge=1, le=50, description="Maximum recent activities to return"),
    filters: dict = Depends(get_analytics_filters),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve latest registered FIR cases matching the applied filters.
    """
    data = DashboardAnalyticsService.get_recent_activity(db, filters, limit)
    return {
        "success": True,
        "message": "Recent activity retrieved successfully",
        "data": data
    }
