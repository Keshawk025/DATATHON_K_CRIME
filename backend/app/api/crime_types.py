from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.api.deps import get_current_user
from app.services.crime_type_service import CrimeTypeService
from app.schemas.common import StandardResponse
from app.schemas.crime_type import CrimeType as CrimeTypeSchema

router = APIRouter()

@router.get("", response_model=StandardResponse[List[CrimeTypeSchema]])
def get_crime_types(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve all crime classifications and categories.
    """
    crime_types = CrimeTypeService.get_crime_types(db)
    return {
        "success": True,
        "message": "Crime categories retrieved successfully",
        "data": crime_types
    }
