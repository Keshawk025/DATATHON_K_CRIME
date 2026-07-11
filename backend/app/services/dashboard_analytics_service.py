from sqlalchemy.orm import Session
from typing import List, Optional
from app.analytics.dashboard_analytics import DashboardAnalytics
from app.analytics.crime_analytics import CrimeAnalytics
from app.analytics.trend_analytics import TrendAnalytics
from app.analytics.district_analytics import DistrictAnalytics
from app.models.models import FIR
from app.analytics.utils import apply_fir_filters

class DashboardAnalyticsService:
    @staticmethod
    def get_summary(db: Session, filters: dict) -> dict:
        return DashboardAnalytics.get_summary_analytics(db, filters)

    @staticmethod
    def get_trends(db: Session, filters: dict) -> dict:
        return TrendAnalytics.get_trends(db, filters)

    @staticmethod
    def get_distributions(db: Session, filters: dict) -> dict:
        return CrimeAnalytics.get_all_distributions(db, filters)

    @staticmethod
    def get_district_ranking(db: Session, filters: dict) -> list:
        return DistrictAnalytics.get_district_ranking(db, filters)

    @staticmethod
    def get_kpis(db: Session, filters: dict) -> dict:
        return DashboardAnalytics.get_kpis_analytics(db, filters)

    @staticmethod
    def get_recent_activity(db: Session, filters: dict, limit: int = 5) -> list:
        query = db.query(FIR).order_by(FIR.reported_date.desc(), FIR.created_at.desc())
        query = apply_fir_filters(query, **filters)
        return query.limit(limit).all()
