from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

class DashboardSummary(BaseModel):
    total_crimes: int = Field(..., example=1050)
    total_firs: int = Field(..., example=1050)
    active_cases: int = Field(..., example=650)
    solved_cases: int = Field(..., example=400)
    repeat_offenders: int = Field(..., example=180)
    hotspot_districts: int = Field(..., example=5)

class TrendItem(BaseModel):
    month: str = Field(..., example="Jan")
    crimes: int = Field(..., example=120)

class CategoryItem(BaseModel):
    category: str = Field(..., example="Theft (Sec 379 IPC)")
    count: int = Field(..., example=450)

class DistrictItem(BaseModel):
    district: str = Field(..., example="Bengaluru Urban")
    count: int = Field(..., example=1200)

# Task 4 New Analytics Schemas

class AnalyticsSummary(BaseModel):
    total_crimes: int = Field(..., example=150)
    active_cases: int = Field(..., example=95)
    solved_cases: int = Field(..., example=55)
    repeat_offenders: int = Field(..., example=22)
    high_risk_districts: int = Field(..., example=4)

class TrendPoint(BaseModel):
    time_unit: str = Field(..., example="2026-03")
    count: int = Field(..., example=25)

class DashboardTrends(BaseModel):
    yearly: List[TrendPoint]
    monthly: List[TrendPoint]
    weekly: List[TrendPoint]
    daily: List[TrendPoint]

class SeverityPoint(BaseModel):
    severity: int = Field(..., example=3)
    count: int = Field(..., example=30)

class StatusPoint(BaseModel):
    status: str = Field(..., example="Under Investigation")
    count: int = Field(..., example=45)

class GenderPoint(BaseModel):
    gender: str = Field(..., example="Male")
    count: int = Field(..., example=60)

class RepeatPoint(BaseModel):
    status: str = Field(..., example="Repeat Offender")
    count: int = Field(..., example=18)

class DashboardDistributions(BaseModel):
    category_distribution: List[CategoryItem]
    severity_distribution: List[SeverityPoint]
    status_distribution: List[StatusPoint]
    gender_distribution: List[GenderPoint]
    repeat_offender_distribution: List[RepeatPoint]

class DistrictRankingItem(BaseModel):
    district_id: UUID
    district_name: str = Field(..., example="Bengaluru Urban")
    crime_count: int = Field(..., example=85)
    top_crime_type: Optional[str] = Field(..., example="Cyber Crime (IT Act)")
    average_risk_score: float = Field(..., example=72.4)
    repeat_offender_count: int = Field(..., example=12)

class DashboardKPIs(BaseModel):
    total_crimes: int = Field(..., example=150)
    active_cases: int = Field(..., example=95)
    solved_cases: int = Field(..., example=55)
    repeat_offenders: int = Field(..., example=22)
    high_risk_districts: int = Field(..., example=4)
    total_districts: int = Field(..., example=31)
    total_crime_categories: int = Field(..., example=15)
    crimes_today: int = Field(..., example=2)
    crimes_this_week: int = Field(..., example=8)
    crimes_this_month: int = Field(..., example=35)
