from sqlalchemy.orm import Session
from typing import List
from app.models.models import CrimeType

class CrimeTypeService:
    @staticmethod
    def get_crime_types(db: Session) -> List[CrimeType]:
        return db.query(CrimeType).order_by(CrimeType.name).all()
