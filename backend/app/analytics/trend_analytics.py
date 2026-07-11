from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import FIR
from app.analytics.utils import apply_fir_filters

class TrendAnalytics:
    @staticmethod
    def get_yearly_trend(db: Session, filters: dict) -> list:
        group_col = func.to_char(FIR.occurrence_date, "YYYY").label("time_unit")
        query = db.query(group_col, func.count(FIR.id))
        query = apply_fir_filters(query, **filters)
        results = query.group_by("time_unit").order_by("time_unit").all()
        return [{"time_unit": r[0], "count": r[1]} for r in results]

    @staticmethod
    def get_monthly_trend(db: Session, filters: dict) -> list:
        group_col = func.to_char(FIR.occurrence_date, "YYYY-MM").label("time_unit")
        query = db.query(group_col, func.count(FIR.id))
        query = apply_fir_filters(query, **filters)
        results = query.group_by("time_unit").order_by("time_unit").all()
        return [{"time_unit": r[0], "count": r[1]} for r in results]

    @staticmethod
    def get_weekly_trend(db: Session, filters: dict) -> list:
        # PostgreSQL IYYY-IW matches ISO week date format (Year-Week)
        group_col = func.to_char(FIR.occurrence_date, "IYYY-IW").label("time_unit")
        query = db.query(group_col, func.count(FIR.id))
        query = apply_fir_filters(query, **filters)
        results = query.group_by("time_unit").order_by("time_unit").all()
        return [{"time_unit": r[0], "count": r[1]} for r in results]

    @staticmethod
    def get_daily_trend(db: Session, filters: dict) -> list:
        group_col = func.to_char(FIR.occurrence_date, "YYYY-MM-DD").label("time_unit")
        query = db.query(group_col, func.count(FIR.id))
        query = apply_fir_filters(query, **filters)
        results = query.group_by("time_unit").order_by("time_unit").all()
        return [{"time_unit": r[0], "count": r[1]} for r in results]

    @classmethod
    def get_trends(cls, db: Session, filters: dict) -> dict:
        return {
            "yearly": cls.get_yearly_trend(db, filters),
            "monthly": cls.get_monthly_trend(db, filters),
            "weekly": cls.get_weekly_trend(db, filters),
            "daily": cls.get_daily_trend(db, filters)
        }
