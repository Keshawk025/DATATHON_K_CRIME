from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID
from typing import List, Optional
from app.models.models import District, FIR, CrimeType

class DistrictService:
    @staticmethod
    def get_districts(db: Session) -> List[District]:
        return db.query(District).all()

    @staticmethod
    def get_district_by_id(db: Session, district_id: UUID) -> Optional[District]:
        return db.query(District).filter(District.id == district_id).first()

    @staticmethod
    def get_district_statistics(db: Session, district_id: UUID) -> dict:
        total_crimes = db.query(FIR).filter(FIR.district_id == district_id).count()
        
        # Count based on status
        active_cases = db.query(FIR).filter(
            FIR.district_id == district_id,
            FIR.status.in_(["Under Investigation", "Open", "Active"])
        ).count()
        
        solved_cases = db.query(FIR).filter(
            FIR.district_id == district_id,
            FIR.status.in_(["Solved", "Closed"])
        ).count()
        
        # Calculate a simulated risk score based on severity of crimes (scaled to 100)
        severity_sum = db.query(func.sum(FIR.severity)).filter(FIR.district_id == district_id).scalar() or 0
        max_possible_severity = total_crimes * 5
        risk_score = round((severity_sum / max_possible_severity) * 100, 1) if total_crimes > 0 else 0.0

        # Find top crime category
        top_crime = db.query(
            CrimeType.name, func.count(FIR.id).label("cnt")
        ).join(FIR, FIR.crime_type_id == CrimeType.id).filter(
            FIR.district_id == district_id
        ).group_by(CrimeType.name).order_by(func.count(FIR.id).desc()).first()

        top_crime_type = top_crime[0] if top_crime else None

        return {
            "total_crimes": total_crimes,
            "active_cases": active_cases,
            "solved_cases": solved_cases,
            "risk_score": risk_score,
            "top_crime_type": top_crime_type
        }
