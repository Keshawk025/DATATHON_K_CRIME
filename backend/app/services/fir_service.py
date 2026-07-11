from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from typing import List, Optional, Tuple
from app.models.models import FIR
from app.schemas.fir import FIRCreate, FIRUpdate

class FIRService:
    @staticmethod
    def get_firs(
        db: Session,
        district_id: Optional[UUID] = None,
        crime_type_id: Optional[UUID] = None,
        status: Optional[str] = None,
        severity: Optional[int] = None,
        search: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        sort_by: str = "occurrence_date",
        sort_order: str = "desc",
        page: int = 1,
        limit: int = 10
    ) -> Tuple[List[FIR], int]:
        query = db.query(FIR)
        
        # Filtering
        if district_id:
            query = query.filter(FIR.district_id == district_id)
        if crime_type_id:
            query = query.filter(FIR.crime_type_id == crime_type_id)
        if status:
            query = query.filter(FIR.status == status)
        if severity is not None:
            query = query.filter(FIR.severity == severity)
        if start_date:
            query = query.filter(FIR.occurrence_date >= start_date)
        if end_date:
            query = query.filter(FIR.occurrence_date <= end_date)
        if search:
            query = query.filter(
                (FIR.fir_number.ilike(f"%{search}%")) |
                (FIR.description.ilike(f"%{search}%")) |
                (FIR.location.ilike(f"%{search}%"))
            )
            
        # Sorting
        sort_attr = getattr(FIR, sort_by, FIR.occurrence_date)
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
    def get_fir_by_id(db: Session, fir_id: UUID) -> Optional[FIR]:
        return db.query(FIR).filter(FIR.id == fir_id).first()

    @staticmethod
    def create_fir(db: Session, fir_in: FIRCreate) -> FIR:
        fir = FIR(
            fir_number=fir_in.fir_number,
            district_id=fir_in.district_id,
            crime_type_id=fir_in.crime_type_id,
            occurrence_date=fir_in.occurrence_date,
            reported_date=fir_in.reported_date,
            latitude=fir_in.latitude,
            longitude=fir_in.longitude,
            location=fir_in.location,
            description=fir_in.description,
            status=fir_in.status,
            severity=fir_in.severity
        )
        db.add(fir)
        db.commit()
        db.refresh(fir)
        return fir

    @staticmethod
    def update_fir(db: Session, fir_id: UUID, fir_in: FIRUpdate) -> Optional[FIR]:
        fir = db.query(FIR).filter(FIR.id == fir_id).first()
        if not fir:
            return None
            
        update_data = fir_in.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(fir, key, value)
            
        db.commit()
        db.refresh(fir)
        return fir

    @staticmethod
    def delete_fir(db: Session, fir_id: UUID) -> bool:
        fir = db.query(FIR).filter(FIR.id == fir_id).first()
        if not fir:
            return False
            
        db.delete(fir)
        db.commit()
        return True
