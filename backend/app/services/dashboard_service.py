from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.models.models import FIR, Criminal, District, CrimeType

class DashboardService:
    @staticmethod
    def get_summary(db: Session) -> dict:
        total_crimes = db.query(FIR).count()
        total_firs = total_crimes
        
        active_cases = db.query(FIR).filter(
            FIR.status.in_(["Under Investigation", "Open", "Active"])
        ).count()
        
        solved_cases = db.query(FIR).filter(
            FIR.status.in_(["Solved", "Closed"])
        ).count()
        
        repeat_offenders = db.query(Criminal).filter(
            Criminal.repeat_offender == True
        ).count()
        
        # Calculate hotspot districts (districts with crime count > average crime count per district)
        avg_crimes_sub = db.query(
            func.count(FIR.id).label("cnt")
        ).group_by(FIR.district_id).subquery()
        
        avg_crimes = db.query(func.avg(avg_crimes_sub.c.cnt)).scalar() or 0.0
        
        hotspot_districts = db.query(FIR.district_id).group_by(FIR.district_id).having(
            func.count(FIR.id) > avg_crimes
        ).count() if total_crimes > 0 else 0

        return {
            "total_crimes": total_crimes,
            "total_firs": total_firs,
            "active_cases": active_cases,
            "solved_cases": solved_cases,
            "repeat_offenders": repeat_offenders,
            "hotspot_districts": hotspot_districts
        }

    @staticmethod
    def get_trends(db: Session) -> List[dict]:
        # Group by year and month (or just format occurrence_date)
        # For sqlite/postgresql compatibility in mock setup, we can use simple postgres extract or string formatting
        # Let's extract month name or formatted date
        # PostgreSQL: to_char(occurrence_date, 'Mon')
        # We can extract the month part or format.
        # Let's do formatting using func.to_char
        try:
            trends_query = db.query(
                func.to_char(FIR.occurrence_date, "YYYY-MM").label("month_str"),
                func.count(FIR.id).label("cnt")
            ).group_by("month_str").order_by("month_str").all()
            
            return [{"month": item[0], "crimes": item[1]} for item in trends_query]
        except Exception:
            # Fallback for simple date extraction if database driver issues arise
            trends_query = db.query(
                FIR.occurrence_date,
                func.count(FIR.id)
            ).group_by(FIR.occurrence_date).order_by(FIR.occurrence_date).all()
            return [{"month": str(item[0]), "crimes": item[1]} for item in trends_query]

    @staticmethod
    def get_categories(db: Session) -> List[dict]:
        categories_query = db.query(
            CrimeType.name,
            func.count(FIR.id).label("cnt")
        ).join(FIR, FIR.crime_type_id == CrimeType.id).group_by(
            CrimeType.name
        ).order_by(func.count(FIR.id).desc()).all()
        
        return [{"category": item[0], "count": item[1]} for item in categories_query]

    @staticmethod
    def get_districts(db: Session) -> List[dict]:
        districts_query = db.query(
            District.name,
            func.count(FIR.id).label("cnt")
        ).join(FIR, FIR.district_id == District.id).group_by(
            District.name
        ).order_by(func.count(FIR.id).desc()).all()
        
        return [{"district": item[0], "count": item[1]} for item in districts_query]
