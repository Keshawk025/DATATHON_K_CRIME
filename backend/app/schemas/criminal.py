from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional

class CriminalBase(BaseModel):
    full_name: str = Field(..., example="Keshaw Kumar")
    gender: Optional[str] = Field(None, example="Male")
    age: Optional[int] = Field(None, example=34)
    aliases: Optional[str] = Field(None, example="KK, Raju")
    risk_score: float = Field(..., example=65.0, description="Risk score from 0.0 to 100.0")
    repeat_offender: bool = Field(False, example=True)

    @field_validator("risk_score")
    @classmethod
    def validate_risk_score(cls, v: float) -> float:
        if v < 0.0 or v > 100.0:
            raise ValueError("Risk score must be between 0.0 and 100.0")
        return v

class CriminalCreate(CriminalBase):
    pass

class CriminalUpdate(BaseModel):
    full_name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    aliases: Optional[str] = None
    risk_score: Optional[float] = None
    repeat_offender: Optional[bool] = None

    @field_validator("risk_score")
    @classmethod
    def validate_risk_score(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < 0.0 or v > 100.0):
            raise ValueError("Risk score must be between 0.0 and 100.0")
        return v

class Criminal(CriminalBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
