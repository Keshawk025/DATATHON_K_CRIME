from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from typing import List, Optional

from app.database.session import get_db
from app.api.deps import get_current_user, RoleChecker
from app.services.fir_service import FIRService
from app.schemas.common import StandardResponse
from app.schemas.fir import FIR as FIRSchema, FIRCreate, FIRUpdate

router = APIRouter()

# Pagination response container
from pydantic import BaseModel
class PaginatedFIRResponse(BaseModel):
    items: List[FIRSchema]
    total: int
    page: int
    limit: int

@router.get("", response_model=StandardResponse[PaginatedFIRResponse])
def get_firs(
    district_id: Optional[UUID] = Query(None, description="Filter by district unique ID"),
    crime_type_id: Optional[UUID] = Query(None, description="Filter by crime category ID"),
    status: Optional[str] = Query(None, description="Filter by case status"),
    severity: Optional[int] = Query(None, description="Filter by severity level (1-5)"),
    search: Optional[str] = Query(None, description="Search by FIR number, description, or location"),
    start_date: Optional[date] = Query(None, description="Filter by occurrence start date"),
    end_date: Optional[date] = Query(None, description="Filter by occurrence end date"),
    sort_by: str = Query("occurrence_date", description="Field to sort by"),
    sort_order: str = Query("desc", description="Order to sort (asc or desc)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Records per page"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve a paginated, filtered list of FIR records.
    """
    items, total = FIRService.get_firs(
        db=db,
        district_id=district_id,
        crime_type_id=crime_type_id,
        status=status,
        severity=severity,
        search=search,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )
    return {
        "success": True,
        "message": "FIR records retrieved successfully",
        "data": {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit
        }
    }

@router.get("/{id}", response_model=StandardResponse[FIRSchema])
def get_fir(
    id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Retrieve detailed parameters of a specific FIR record by its ID.
    """
    fir = FIRService.get_fir_by_id(db, id)
    if not fir:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FIR record not found"
        )
    return {
        "success": True,
        "message": "FIR record retrieved successfully",
        "data": fir
    }

@router.post("", response_model=StandardResponse[FIRSchema], status_code=status.HTTP_201_CREATED)
def create_fir(
    fir_in: FIRCreate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin", "Investigation Officer"]))
):
    """
    Create a new FIR case entry. Restricted to Admin and Investigation Officers.
    """
    fir = FIRService.create_fir(db, fir_in)
    return {
        "success": True,
        "message": "FIR record created successfully",
        "data": fir
    }

@router.put("/{id}", response_model=StandardResponse[FIRSchema])
def update_fir(
    id: UUID,
    fir_in: FIRUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin", "Investigation Officer"]))
):
    """
    Update details of an existing FIR record. Restricted to Admin and Investigation Officers.
    """
    fir = FIRService.update_fir(db, id, fir_in)
    if not fir:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FIR record not found"
        )
    return {
        "success": True,
        "message": "FIR record updated successfully",
        "data": fir
    }

@router.delete("/{id}", response_model=StandardResponse[None])
def delete_fir(
    id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(RoleChecker(["Admin"]))
):
    """
    Remove an FIR record from the system. Restricted to Admins.
    """
    success = FIRService.delete_fir(db, id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FIR record not found"
        )
    return {
        "success": True,
        "message": "FIR record deleted successfully",
        "data": None
    }
