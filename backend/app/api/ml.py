from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.database.session import get_db
from app.api.deps import get_current_user
from app.ml.training import TrainingPipeline
from app.schemas.common import StandardResponse

router = APIRouter()

@router.post("/train", response_model=StandardResponse[Dict[str, Any]])
def train_models(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Force training of all 5 baseline ML models using active database snapshots.
    """
    try:
        metadata = TrainingPipeline.run_training_pipeline(db)
        return {
            "success": True,
            "message": "All ML models trained successfully",
            "data": metadata
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to execute training pipeline: {str(e)}"
        )
