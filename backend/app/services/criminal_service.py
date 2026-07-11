from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional, Tuple
from app.models.models import Criminal
from app.schemas.criminal import CriminalCreate, CriminalUpdate

class CriminalService:
    @staticmethod
    def get_criminals(
        db: Session,
        gender: Optional[str] = None,
        repeat_offender: Optional[bool] = None,
        min_risk_score: Optional[float] = None,
        max_risk_score: Optional[float] = None,
        search: Optional[str] = None,
        sort_by: str = "full_name",
        sort_order: str = "asc",
        page: int = 1,
        limit: int = 10
    ) -> Tuple[List[Criminal], int]:
        query = db.query(Criminal)
        
        # Filtering
        if gender:
            query = query.filter(Criminal.gender == gender)
        if repeat_offender is not None:
            query = query.filter(Criminal.repeat_offender == repeat_offender)
        if min_risk_score is not None:
            query = query.filter(Criminal.risk_score >= min_risk_score)
        if max_risk_score is not None:
            query = query.filter(Criminal.risk_score <= max_risk_score)
        if search:
            query = query.filter(
                (Criminal.full_name.ilike(f"%{search}%")) |
                (Criminal.aliases.ilike(f"%{search}%"))
            )
            
        # Sorting
        sort_attr = getattr(Criminal, sort_by, Criminal.full_name)
        if sort_order.lower() == "desc":
            query = query.order_by(sort_attr.desc())
        else:
            query = query.order_by(sort_attr.asc())
            
        # Total matching records count
        total = query.count()
        
        # Pagination
        offset = (page - 1) * limit
        items = query.offset(offset).limit(limit).all()
        
        return items, total

    @staticmethod
    def get_criminal_by_id(db: Session, criminal_id: UUID) -> Optional[Criminal]:
        return db.query(Criminal).filter(Criminal.id == criminal_id).first()

    @staticmethod
    def create_criminal(db: Session, criminal_in: CriminalCreate) -> Criminal:
        criminal = Criminal(
            full_name=criminal_in.full_name,
            gender=criminal_in.gender,
            age=criminal_in.age,
            aliases=criminal_in.aliases,
            risk_score=criminal_in.risk_score,
            repeat_offender=criminal_in.repeat_offender
        )
        db.add(criminal)
        db.commit()
        db.refresh(criminal)
        return criminal

    @staticmethod
    def update_criminal(db: Session, criminal_id: UUID, criminal_in: CriminalUpdate) -> Optional[Criminal]:
        criminal = db.query(Criminal).filter(Criminal.id == criminal_id).first()
        if not criminal:
            return None
            
        update_data = criminal_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(criminal, key, value)
            
        db.commit()
        db.refresh(criminal)
        return criminal

    @staticmethod
    def delete_criminal(db: Session, criminal_id: UUID) -> bool:
        criminal = db.query(Criminal).filter(Criminal.id == criminal_id).first()
        if not criminal:
            return False
            
        db.delete(criminal)
        db.commit()
        return True

    @staticmethod
    def get_repeat_offenders(db: Session, limit: int = 10) -> List[Criminal]:
        return db.query(Criminal).filter(
            Criminal.repeat_offender == True
        ).order_by(Criminal.risk_score.desc()).limit(limit).all()
