from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any

from app.database.session import get_db
from app.api.deps import get_current_user
from app.services.network_service import NetworkService
from app.schemas.common import StandardResponse

router = APIRouter()

@router.get("/search", response_model=StandardResponse[List[Dict[str, Any]]])
def search_network(
    query: str = Query(..., description="Query string for criminal name or FIR number"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Search the criminal network database by name, alias, or FIR number.
    """
    results = NetworkService.search_network(db, query)
    return {
        "success": True,
        "message": "Network search completed successfully",
        "data": results
    }

@router.get("/{criminal_id}", response_model=StandardResponse[Dict[str, Any]])
def get_network(
    criminal_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Fetch Cytoscape-formatted nodes and edges centered around a criminal ID.
    """
    network = NetworkService.get_network(db, criminal_id)
    if not network["nodes"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Criminal not found or has no network connections"
        )
    return {
        "success": True,
        "message": "Criminal network graph fetched successfully",
        "data": network
    }
