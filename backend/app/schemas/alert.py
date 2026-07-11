from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional

class AlertBase(BaseModel):
    title: str = Field(..., example="Crime Spike Detected")
    alert_type: str = Field(..., example="Hotspot")
    district_id: UUID
    severity: str = Field(..., example="High")
    description: Optional[str] = Field(None, example="Robbery cases increased by 20% in the last 7 days")

class Alert(AlertBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
