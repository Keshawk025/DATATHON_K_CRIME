import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, Tuple

from app.models.models import FIR, Criminal, District, CrimeType, CrimePerson

class FeatureExtractor:
    @staticmethod
    def get_hotspot_features(db: Session) -> pd.DataFrame:
        """
        Extract features for Hotspot Prediction.
        Aggregates incidents by District, Year, and Month.
        """
        # Query FIR counts by district and month
        results = db.query(
            FIR.district_id,
            func.to_char(FIR.date_registered, 'YYYY').label('year'),
            func.to_char(FIR.date_registered, 'MM').label('month'),
            func.count(FIR.id).label('crime_count'),
            func.avg(FIR.severity).label('avg_severity'),
            func.avg(FIR.latitude).label('avg_lat'),
            func.avg(FIR.longitude).label('avg_lon')
        ).group_by(FIR.district_id, 'year', 'month').all()

        data = []
        for r in results:
            # Query district name
            d_name = db.query(District.name).filter(District.id == r.district_id).scalar()
            data.append({
                "district_id": str(r.district_id),
                "district_name": d_name or "Unknown",
                "crime_year": int(r.year),
                "crime_month": int(r.month),
                "avg_severity": float(r.avg_severity) if r.avg_severity else 3.0,
                "latitude": float(r.avg_lat) if r.avg_lat else 12.9716,
                "longitude": float(r.avg_lon) if r.avg_lon else 77.5946,
                "crime_count": int(r.crime_count)
            })

        df = pd.DataFrame(data)
        if df.empty:
            # Fallback mock features if DB is empty
            df = pd.DataFrame([
                {"district_id": "d1", "district_name": "Bengaluru Urban", "crime_year": 2026, "crime_month": 1, "avg_severity": 3.2, "latitude": 12.9716, "longitude": 77.5946, "crime_count": 15},
                {"district_id": "d2", "district_name": "Mysuru", "crime_year": 2026, "crime_month": 1, "avg_severity": 2.5, "latitude": 12.2958, "longitude": 76.6394, "crime_count": 8},
                {"district_id": "d1", "district_name": "Bengaluru Urban", "crime_year": 2026, "crime_month": 2, "avg_severity": 4.1, "latitude": 12.9716, "longitude": 77.5946, "crime_count": 22},
                {"district_id": "d2", "district_name": "Mysuru", "crime_year": 2026, "crime_month": 2, "avg_severity": 2.8, "latitude": 12.2958, "longitude": 76.6394, "crime_count": 12}
            ])
            
        # Add historical crime count (cumulative sum by district)
        df = df.sort_values(by=["district_id", "crime_year", "crime_month"])
        df["historical_crime_count"] = df.groupby("district_id")["crime_count"].transform(lambda x: x.cumsum().shift(1).fillna(0))
        return df

    @staticmethod
    def get_risk_features(db: Session) -> pd.DataFrame:
        """
        Extract features for Criminal Risk Classification.
        """
        criminals = db.query(Criminal).all()
        data = []
        
        for c in criminals:
            # Count FIR associations
            fir_count = db.query(func.count(CrimePerson.id)).filter(
                CrimePerson.person_id == c.id,
                CrimePerson.person_type == 'accused'
            ).scalar()
            
            # Find average severity of crimes
            avg_severity = db.query(func.avg(FIR.severity)).join(
                CrimePerson, CrimePerson.fir_id == FIR.id
            ).filter(
                CrimePerson.person_id == c.id,
                CrimePerson.person_type == 'accused'
            ).scalar()
            
            data.append({
                "criminal_id": str(c.id),
                "full_name": c.full_name,
                "age": c.age or 35,
                "gender": c.gender or "Male",
                "past_fir_count": fir_count or 1,
                "avg_severity": float(avg_severity) if avg_severity else 3.0,
                "risk_score": c.risk_score or 50.0,
                "high_risk": 1 if (c.risk_score or 50.0) >= 75 else 0
            })

        df = pd.DataFrame(data)
        if df.empty:
            df = pd.DataFrame([
                {"criminal_id": "c1", "full_name": "Somesh Gowda", "age": 28, "gender": "Male", "past_fir_count": 2, "avg_severity": 4.0, "risk_score": 92.5, "high_risk": 1},
                {"criminal_id": "c2", "full_name": "Ketan Shah", "age": 42, "gender": "Male", "past_fir_count": 1, "avg_severity": 3.5, "risk_score": 85.0, "high_risk": 1},
                {"criminal_id": "c3", "full_name": "Latha Hegde", "age": 31, "gender": "Female", "past_fir_count": 0, "avg_severity": 2.0, "risk_score": 35.0, "high_risk": 0}
            ])
        return df

    @staticmethod
    def get_trend_features(db: Session) -> pd.DataFrame:
        """
        Extract historical monthly totals for Forecasting.
        """
        results = db.query(
            func.to_char(FIR.date_registered, 'YYYY-MM').label('month'),
            func.count(FIR.id).label('crime_count')
        ).group_by('month').order_by('month').all()

        data = []
        for idx, r in enumerate(results):
            data.append({
                "month_index": idx,
                "month_label": r.month,
                "crime_count": int(r.crime_count)
            })

        df = pd.DataFrame(data)
        if df.empty or len(df) < 2:
            df = pd.DataFrame([
                {"month_index": 0, "month_label": "2025-11", "crime_count": 12},
                {"month_index": 1, "month_label": "2025-12", "crime_count": 18},
                {"month_index": 2, "month_label": "2026-01", "crime_count": 15},
                {"month_index": 3, "month_label": "2026-02", "crime_count": 22}
            ])
        return df

    @staticmethod
    def get_anomaly_features(db: Session) -> pd.DataFrame:
        """
        Extract coordinates, severity, and temporal features for Anomaly/DBSCAN models.
        """
        firs = db.query(FIR).all()
        data = []
        
        for f in firs:
            data.append({
                "fir_id": str(f.id),
                "fir_number": f.fir_number,
                "latitude": float(f.latitude) if f.latitude else 12.9716,
                "longitude": float(f.longitude) if f.longitude else 77.5946,
                "severity": float(f.severity) if f.severity else 3.0,
                "date": f.date_registered
            })

        df = pd.DataFrame(data)
        if df.empty:
            df = pd.DataFrame([
                {"fir_id": "f1", "fir_number": "FIR/2026/0001", "latitude": 12.9716, "longitude": 77.5946, "severity": 3.0, "date": pd.Timestamp("2026-01-15")},
                {"fir_id": "f2", "fir_number": "FIR/2026/0002", "latitude": 12.9812, "longitude": 77.6015, "severity": 4.5, "date": pd.Timestamp("2026-02-10")},
                {"fir_id": "f3", "fir_number": "FIR/2026/0003", "latitude": 12.2958, "longitude": 76.6394, "severity": 2.0, "date": pd.Timestamp("2026-02-12")}
            ])
            
        # Parse date components
        df['crime_month'] = df['date'].apply(lambda d: d.month)
        df['day_of_week'] = df['date'].apply(lambda d: d.dayofweek)
        return df
