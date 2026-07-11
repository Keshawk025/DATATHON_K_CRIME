from pydantic import BaseModel, Field
from uuid import UUID
from decimal import Decimal
from typing import Optional

class DistrictBase(BaseModel):
    name: str = Field(..., example="Bengaluru Urban")
    state: str = Field(..., example="Karnataka")
    latitude: Decimal = Field(..., example=12.9716)
    longitude: Decimal = Field(..., example=77.5946)
    population: Optional[int] = Field(None, example=9621551)

class DistrictCreate(DistrictBase):
    pass

class District(DistrictBase):
    id: UUID

    class Config:
        from_attributes = True

class DistrictStats(BaseModel):
    total_crimes: int = Field(..., example=120)
    active_cases: int = Field(..., example=80)
    solved_cases: int = Field(..., example=40)
    risk_score: float = Field(..., example=74.5)
    top_crime_type: Optional[str] = Field(None, example="Theft (Sec 379 IPC)")
