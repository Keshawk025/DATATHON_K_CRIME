from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
from app.models.models import FIR, Criminal, CrimePerson, District, CrimeType
from app.analytics.utils import apply_fir_filters

class DashboardAnalytics:
    @staticmethod
    def get_summary_analytics(db: Session, filters: dict) -> dict:
        # 1. Total Crimes
        q_total = db.query(func.count(FIR.id))
        q_total = apply_fir_filters(q_total, **filters)
        total_crimes = q_total.scalar() or 0

        # 2. Active Cases
        q_active = db.query(func.count(FIR.id)).filter(
            FIR.status.in_(["Under Investigation", "Open", "Active"])
        )
        q_active = apply_fir_filters(q_active, **filters)
        active_cases = q_active.scalar() or 0

        # 3. Solved Cases
        q_solved = db.query(func.count(FIR.id)).filter(
            FIR.status.in_(["Solved", "Closed"])
        )
        q_solved = apply_fir_filters(q_solved, **filters)
        solved_cases = q_solved.scalar() or 0

        # 4. Repeat Offenders involved in filtered crimes
        q_repeat = db.query(func.count(func.distinct(Criminal.id))).join(
            CrimePerson, CrimePerson.criminal_id == Criminal.id
        ).join(
            FIR, CrimePerson.fir_id == FIR.id
        ).filter(Criminal.repeat_offender == True)
        q_repeat = apply_fir_filters(q_repeat, **filters)
        repeat_offenders = q_repeat.scalar() or 0

        # 5. High Risk Districts (crime count > average crime count per district under current filters)
        avg_sub = db.query(
            FIR.district_id,
            func.count(FIR.id).label("cnt")
        )
        avg_sub = apply_fir_filters(avg_sub, **filters)
        avg_sub = avg_sub.group_by(FIR.district_id).subquery()
        
        avg_crimes = db.query(func.avg(avg_sub.c.cnt)).scalar() or 0.0
        
        q_high_risk = db.query(FIR.district_id)
        q_high_risk = apply_fir_filters(q_high_risk, **filters)
        high_risk_districts = q_high_risk.group_by(FIR.district_id).having(
            func.count(FIR.id) > avg_crimes
        ).count() if total_crimes > 0 else 0

        return {
            "total_crimes": total_crimes,
            "active_cases": active_cases,
            "solved_cases": solved_cases,
            "repeat_offenders": repeat_offenders,
            "high_risk_districts": high_risk_districts
        }

    @classmethod
    def get_kpis_analytics(cls, db: Session, filters: dict) -> dict:
        summary = cls.get_summary_analytics(db, filters)
        
        # Total Districts
        total_districts = db.query(District).count()
        
        # Total Crime Categories
        total_crime_categories = db.query(CrimeType).count()

        # Crimes Today
        today = date.today()
        q_today = db.query(func.count(FIR.id)).filter(FIR.occurrence_date == today)
        q_today = apply_fir_filters(q_today, **filters)
        crimes_today = q_today.scalar() or 0

        # Crimes This Week (Last 7 Days)
        start_of_week = today - timedelta(days=7)
        q_week = db.query(func.count(FIR.id)).filter(FIR.occurrence_date >= start_of_week)
        q_week = apply_fir_filters(q_week, **filters)
        crimes_this_week = q_week.scalar() or 0

        # Crimes This Month (Last 30 Days)
        start_of_month = today - timedelta(days=30)
        q_month = db.query(func.count(FIR.id)).filter(FIR.occurrence_date >= start_of_month)
        q_month = apply_fir_filters(q_month, **filters)
        crimes_this_month = q_month.scalar() or 0

        summary.update({
            "total_districts": total_districts,
            "total_crime_categories": total_crime_categories,
            "crimes_today": crimes_today,
            "crimes_this_week": crimes_this_week,
            "crimes_this_month": crimes_this_month
        })
        return summary
