from pydantic import BaseModel, Field, field_validator
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime
from typing import Optional

class FIRBase(BaseModel):
    fir_number: str = Field(..., example="FIR/2026/0001")
    district_id: UUID
    crime_type_id: UUID
    occurrence_date: date
    reported_date: date
    latitude: Decimal = Field(..., example=12.9716)
    longitude: Decimal = Field(..., example=77.5946)
    location: Optional[str] = Field(None, example="MG Road, Bengaluru")
    description: Optional[str] = Field(None, example="Vehicle theft reported by the owner")
    status: str = Field(..., example="Under Investigation")
    severity: int = Field(..., example=3, description="Severity score from 1 to 5")

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: int) -> int:
        if v < 1 or v > 5:
            raise ValueError("Severity must be between 1 and 5")
        return v

class FIRCreate(FIRBase):
    pass

class FIRUpdate(BaseModel):
    fir_number: Optional[str] = None
    district_id: Optional[UUID] = None
    crime_type_id: Optional[UUID] = None
    occurrence_date: Optional[date] = None
    reported_date: Optional[date] = None
    latitude: Optional[Decimal] = None
    longitude: Optional[Decimal] = None
    location: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    severity: Optional[int] = None

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 1 or v > 5):
            raise ValueError("Severity must be between 1 and 5")
        return v

class FIR(FIRBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
