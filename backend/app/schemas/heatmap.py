from pydantic import BaseModel
from uuid import UUID
from datetime import date
from typing import List, Optional

class HeatmapPoint(BaseModel):
    id: UUID
    fir_number: str
    latitude: float
    longitude: float
    crime_type_name: str
    severity: int
    status: str
    occurrence_date: date
    location: Optional[str] = None

    class Config:
        from_attributes = True

class HotspotItem(BaseModel):
    district_id: UUID
    district_name: str
    latitude: float
    longitude: float
    crime_count: int
    average_risk_score: float
    repeat_offenders_count: int
    hotspot_score: float
    risk_level: str
    top_crime_category: str
    recent_fir_count: int

    class Config:
        from_attributes = True

class RecentIncident(BaseModel):
    id: UUID
    fir_number: str
    occurrence_date: date
    crime_type_name: str
    severity: int
    status: str

    class Config:
        from_attributes = True

class TrendItem(BaseModel):
    month: str
    count: int

class CrimeTypeCount(BaseModel):
    category: str
    count: int

class DistrictStatistics(BaseModel):
    district_id: UUID
    district_name: str
    crime_count: int
    top_crime_category: str
    repeat_offenders: int
    average_risk_score: float
    hotspot_score: float
    recent_fir_count: int
    trend: List[TrendItem]
    top_crime_types: List[CrimeTypeCount]
    recent_incidents: List[RecentIncident]

    class Config:
        from_attributes = True
