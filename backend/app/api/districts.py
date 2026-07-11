from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from app.database.session import get_db
from app.api.deps import get_current_user
from app.services.district_service import DistrictService
from app.schemas.common import StandardResponse
from app.schemas.district import District as DistrictSchema, DistrictStats

router = APIRouter()

@router.get("", response_model=StandardResponse[List[DistrictSchema]])
def get_districts(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve all districts in Karnataka.
    """
    districts = DistrictService.get_districts(db)
    return {
        "success": True,
        "message": "Districts retrieved successfully",
        "data": districts
    }

@router.get("/{id}", response_model=StandardResponse[DistrictSchema])
def get_district(
    id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve details of a specific district by its unique ID.
    """
    district = DistrictService.get_district_by_id(db, id)
    if not district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found"
        )
    return {
        "success": True,
        "message": "District retrieved successfully",
        "data": district
    }

@router.get("/{id}/statistics", response_model=StandardResponse[DistrictStats])
def get_district_statistics(
    id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve crime statistics and risk indicators for a specific district.
    """
    district = DistrictService.get_district_by_id(db, id)
    if not district:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="District not found"
        )
    stats = DistrictService.get_district_statistics(db, id)
    return {
        "success": True,
        "message": "District statistics retrieved successfully",
        "data": stats
    }
