from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from pydantic import BaseModel

from app.database.session import get_db
from app.api.deps import get_current_user, RoleChecker
from app.services.criminal_service import CriminalService
from app.services.network_service import NetworkService
from app.schemas.common import StandardResponse
from app.schemas.criminal import Criminal as CriminalSchema, CriminalCreate, CriminalUpdate
from typing import Dict, Any

router = APIRouter()

class PaginatedCriminalResponse(BaseModel):
    items: List[CriminalSchema]
    total: int
    page: int
    limit: int

@router.get("", response_model=StandardResponse[PaginatedCriminalResponse])
def get_criminals(
    gender: Optional[str] = Query(None, description="Filter by gender"),
    repeat_offender: Optional[bool] = Query(None, description="Filter by repeat offender status"),
    min_risk_score: Optional[float] = Query(None, description="Filter by minimum risk score"),
    max_risk_score: Optional[float] = Query(None, description="Filter by maximum risk score"),
    search: Optional[str] = Query(None, description="Search by name or aliases"),
    sort_by: str = Query("full_name", description="Field to sort by"),
    sort_order: str = Query("asc", description="Order to sort (asc or desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Records per page"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve a paginated, filtered list of criminal profiles.
    """
    items, total = CriminalService.get_criminals(
        db=db,
        gender=gender,
        repeat_offender=repeat_offender,
        min_risk_score=min_risk_score,
        max_risk_score=max_risk_score,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )
    return {
        "success": True,
        "message": "Criminal profiles retrieved successfully",
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit
        }
    }

@router.get("/repeat-offenders", response_model=StandardResponse[List[CriminalSchema]])
def get_repeat_offenders(
    limit: int = Query(10, ge=1, le=100, description="Maximum records to return"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve criminal profiles flagged as repeat offenders, sorted by risk score.
    """
    criminals = CriminalService.get_repeat_offenders(db, limit)
    return {
        "success": True,
        "message": "Repeat offenders retrieved successfully",
        "data": criminals
    }

@router.get("/repeat-offenders/advanced", response_model=StandardResponse[List[Dict[str, Any]]])
def get_repeat_offenders_advanced(
    search: Optional[str] = Query(None, description="Search by criminal name"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (High, Medium, Low)"),
    district_id: Optional[UUID] = Query(None, description="Filter by district"),
    crime_type_id: Optional[UUID] = Query(None, description="Filter by crime type"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve detailed profiles of repeat offenders using multi-dimensional filters.
    """
    filters = {
        "search": search,
        "risk_level": risk_level,
        "district_id": district_id,
        "crime_type_id": crime_type_id,
        "date_from": date_from,
        "date_to": date_to
    }
    results = NetworkService.get_repeat_offenders(db, filters)
    return {
        "success": True,
        "message": "Repeat offenders retrieved successfully",
        "data": results
    }

@router.get("/{id}/timeline", response_model=StandardResponse[List[Dict[str, Any]]])
def get_criminal_timeline(
    id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve chronological history of offenses and role associations for a criminal.
    """
    timeline = NetworkService.get_timeline(db, id)
    return {
        "success": True,
        "message": "Criminal timeline retrieved successfully",
        "data": timeline
    }

@router.get("/{id}/relationships", response_model=StandardResponse[List[Dict[str, Any]]])
def get_criminal_relationships(
    id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve known relationships and associates for a specific criminal profile.
    """
    relationships = NetworkService.get_relationships(db, id)
    return {
        "success": True,
        "message": "Criminal relationships retrieved successfully",
        "data": relationships
    }

@router.get("/{id}", response_model=StandardResponse[CriminalSchema])
def get_criminal(
    id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve details of a specific criminal by its ID.
    """
    criminal = CriminalService.get_criminal_by_id(db, id)
    if not criminal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criminal profile not found"
        )
    return {
        "success": True,
        "message": "Criminal profile retrieved successfully",
        "data": criminal
    }

@router.post("", response_model=StandardResponse[CriminalSchema], status_code=status.HTTP_201_CREATED)
def create_criminal(
    criminal_in: CriminalCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin", "Investigation Officer", "Crime Analyst"]))
):
    """
    Create a new criminal profile.
    """
    criminal = CriminalService.create_criminal(db, criminal_in)
    return {
        "success": True,
        "message": "Criminal profile created successfully",
        "data": criminal
    }

@router.put("/{id}", response_model=StandardResponse[CriminalSchema])
def update_criminal(
    id: UUID,
    criminal_in: CriminalUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin", "Investigation Officer", "Crime Analyst"]))
):
    """
    Update details of an existing criminal profile.
    """
    criminal = CriminalService.update_criminal(db, id, criminal_in)
    if not criminal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criminal profile not found"
        )
    return {
        "success": True,
        "message": "Criminal profile updated successfully",
        "data": criminal
    }

@router.delete("/{id}", response_model=StandardResponse[None])
def delete_criminal(
    id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin"]))
):
    """
    Delete a criminal profile. Restricted to Admins.
    """
    success = CriminalService.delete_criminal(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criminal profile not found"
        )
    return {
        "success": True,
        "message": "Criminal profile deleted successfully",
        "data": None
    }
