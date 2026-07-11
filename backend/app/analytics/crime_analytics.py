from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.models import FIR, Criminal, CrimePerson, CrimeType
from app.analytics.utils import apply_fir_filters

class CrimeAnalytics:
    @staticmethod
    def get_category_distribution(db: Session, filters: dict) -> list:
        query = db.query(CrimeType.name, func.count(FIR.id)).join(
            FIR, FIR.crime_type_id == CrimeType.id
        )
        query = apply_fir_filters(query, **filters)
        results = query.group_by(CrimeType.name).order_by(func.count(FIR.id).desc()).all()
        return [{"category": r[0], "count": r[1]} for r in results]

    @staticmethod
    def get_severity_distribution(db: Session, filters: dict) -> list:
        query = db.query(FIR.severity, func.count(FIR.id))
        query = apply_fir_filters(query, **filters)
        results = query.group_by(FIR.severity).order_by(FIR.severity.asc()).all()
        return [{"severity": r[0], "count": r[1]} for r in results]

    @staticmethod
    def get_status_distribution(db: Session, filters: dict) -> list:
        query = db.query(FIR.status, func.count(FIR.id))
        query = apply_fir_filters(query, **filters)
        results = query.group_by(FIR.status).order_by(func.count(FIR.id).desc()).all()
        return [{"status": r[0], "count": r[1]} for r in results]

    @staticmethod
    def get_gender_distribution(db: Session, filters: dict) -> list:
        query = db.query(Criminal.gender, func.count(func.distinct(Criminal.id))).join(
            CrimePerson, CrimePerson.criminal_id == Criminal.id
        ).join(
            FIR, CrimePerson.fir_id == FIR.id
        )
        query = apply_fir_filters(query, **filters)
        results = query.group_by(Criminal.gender).all()
        return [{"gender": r[0] if r[0] else "Unknown", "count": r[1]} for r in results]

    @staticmethod
    def get_repeat_offender_distribution(db: Session, filters: dict) -> list:
        query = db.query(Criminal.repeat_offender, func.count(func.distinct(Criminal.id))).join(
            CrimePerson, CrimePerson.criminal_id == Criminal.id
        ).join(
            FIR, CrimePerson.fir_id == FIR.id
        )
        query = apply_fir_filters(query, **filters)
        results = query.group_by(Criminal.repeat_offender).all()
        return [
            {
                "status": "Repeat Offender" if r[0] else "First Time Offender",
                "count": r[1]
            } for r in results
        ]

    @classmethod
    def get_all_distributions(cls, db: Session, filters: dict) -> dict:
        return {
            "category_distribution": cls.get_category_distribution(db, filters),
            "severity_distribution": cls.get_severity_distribution(db, filters),
            "status_distribution": cls.get_status_distribution(db, filters),
            "gender_distribution": cls.get_gender_distribution(db, filters),
            "repeat_offender_distribution": cls.get_repeat_offender_distribution(db, filters),
        }
