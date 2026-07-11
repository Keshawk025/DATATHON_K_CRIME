import os
import json
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.ml.models import (
    HotspotModelWrapper,
    RiskModelWrapper,
    TrendModelWrapper,
    AnomalyModelWrapper,
    MODELS_DIR
)
from app.models.models import District, CrimeType
from app.ml.training import TrainingPipeline

class Predictor:
    @staticmethod
    def get_status() -> Dict[str, Any]:
        """
        Check training metadata. Returns status, training date, and accuracy metrics.
        """
        meta_path = os.path.join(MODELS_DIR, "metadata.json")
        if not os.path.exists(meta_path):
            return {
                "status": "Not Trained",
                "last_training_date": "N/A",
                "dataset_sizes": {"hotspot": 0, "risk": 0, "forecast": 0},
                "metrics": {}
            }
        with open(meta_path, "r") as f:
            return json.load(f)

    @staticmethod
    def predict_hotspot(db: Session, district_id: str, month: int, year: int) -> Dict[str, Any]:
        # Ensure trained
        status = Predictor.get_status()
        if status["status"] == "Not Trained":
            print("Models not trained. Running training pipeline...")
            TrainingPipeline.run_training_pipeline(db)
            
        model = HotspotModelWrapper.load()
        district = db.query(District).filter(District.id == district_id).first()
        d_name = district.name if district else "Unknown District"
        
        # Build features DataFrame
        # Get historical count (average for now or last count)
        # Fetch latitude/longitude
        lat = float(district.latitude) if district and district.latitude else 12.9716
        lon = float(district.longitude) if district and district.longitude else 77.5946
        
        # Prepare input dict
        input_data = pd.DataFrame([{
            "district_id": str(district_id),
            "crime_year": year,
            "crime_month": month,
            "avg_severity": 3.0,
            "latitude": lat,
            "longitude": lon,
            "historical_crime_count": 10.0
        }])
        
        # Apply encoding and scaling mapping stored in model
        # Categorical mapping
        d_mapping = model.encoding_map.get("district_id", {})
        input_data["district_id"] = input_data["district_id"].map(d_mapping).fillna(-1).astype(int)
        
        # Feature scaling
        for col, stats in model.scaling_stats.items():
            mean, std = stats
            input_data[col] = (input_data[col] - mean) / std
            
        features = ["crime_year", "crime_month", "avg_severity", "latitude", "longitude", "historical_crime_count"]
        pred_val = float(model.predict(input_data[features])[0])
        
        # Calculate hotspot score: log-normalized score scaled to 100
        hotspot_score = min(100.0, max(1.0, float(round(pred_val * 8.5 + 25.0, 1))))
        
        return {
            "district_id": str(district_id),
            "district_name": d_name,
            "predicted_crime_count": max(0, int(round(pred_val))),
            "hotspot_score": hotspot_score,
            "risk_level": "High" if hotspot_score >= 70.0 else "Medium" if hotspot_score >= 35.0 else "Low"
        }

    @staticmethod
    def predict_risk(db: Session, age: int, gender: str, past_fir_count: int, avg_severity: float) -> Dict[str, Any]:
        # Ensure trained
        status = Predictor.get_status()
        if status["status"] == "Not Trained":
            TrainingPipeline.run_training_pipeline(db)
            
        model = RiskModelWrapper.load()
        
        input_data = pd.DataFrame([{
            "age": age,
            "gender": gender,
            "past_fir_count": past_fir_count,
            "avg_severity": avg_severity
        }])
        
        # Preprocess
        g_map = model.encoding_map.get("gender", {"Male": 0, "Female": 1})
        input_data["gender"] = input_data["gender"].map(g_map).fillna(-1).astype(int)
        
        # Scale
        for col, stats in model.scaling_stats.items():
            mean, std = stats
            input_data[col] = (input_data[col] - mean) / std
            
        features = ["age", "gender", "past_fir_count", "avg_severity"]
        prob = model.predict_proba(input_data[features])[0]
        # High risk probability index is 1
        high_risk_prob = float(prob[1]) if len(prob) > 1 else float(prob[0])
        
        risk_score = float(round(high_risk_prob * 100, 1))
        
        return {
            "age": age,
            "gender": gender,
            "past_fir_count": past_fir_count,
            "avg_severity": avg_severity,
            "risk_score": risk_score,
            "risk_level": "Critical" if risk_score >= 80 else "High" if risk_score >= 60 else "Medium" if risk_score >= 40 else "Low"
        }

    @staticmethod
    def predict_trend(db: Session, months_ahead: int = 6) -> List[Dict[str, Any]]:
        # Ensure trained
        status = Predictor.get_status()
        if status["status"] == "Not Trained":
            TrainingPipeline.run_training_pipeline(db)
            
        model = TrendModelWrapper.load()
        
        # Find latest month index from features
        df_trend = FeatureExtractor.get_trend_features(db)
        last_idx = int(df_trend["month_index"].max())
        last_label = df_trend.iloc[-1]["month_label"]
        
        # Generate predictions for future indices
        future_data = []
        import datetime
        from dateutil.relativedelta import relativedelta
        
        last_date = datetime.datetime.strptime(last_label + "-01", "%Y-%m-%d")
        
        for i in range(1, months_ahead + 1):
            next_idx = last_idx + i
            pred_val = float(model.predict(pd.DataFrame([[next_idx]], columns=["month_index"]))[0])
            next_date = last_date + relativedelta(months=i)
            
            future_data.append({
                "month_index": next_idx,
                "month_label": next_date.strftime("%Y-%m"),
                "predicted_crime_count": max(0, int(round(pred_val)))
            })
            
        return future_data

    @staticmethod
    def predict_anomaly(db: Session, latitude: float, longitude: float, severity: float, month: int, day_of_week: int) -> Dict[str, Any]:
        # Ensure trained
        status = Predictor.get_status()
        if status["status"] == "Not Trained":
            TrainingPipeline.run_training_pipeline(db)
            
        model = AnomalyModelWrapper.load()
        
        input_data = pd.DataFrame([{
            "latitude": latitude,
            "longitude": longitude,
            "severity": severity,
            "crime_month": month,
            "day_of_week": day_of_week
        }])
        
        features = ["latitude", "longitude", "severity", "crime_month", "day_of_week"]
        pred = model.predict(input_data[features])[0]
        score = float(model.decision_function(input_data[features])[0])
        
        # Map IsolationForest prediction (-1 = anomaly, 1 = normal)
        is_anomaly = bool(pred == -1)
        # Scale anomaly score: lower means more anomalous. Map to 0-100 anomaly confidence index.
        # Decision function values generally range between -0.5 and 0.5.
        anomaly_index = float(round(max(0.0, min(100.0, (0.2 - score) * 150.0)), 1)) if is_anomaly else 0.0
        
        return {
            "latitude": latitude,
            "longitude": longitude,
            "severity": severity,
            "is_anomaly": is_anomaly,
            "anomaly_index": anomaly_index,
            "confidence_score": float(round(100.0 - anomaly_index, 1)) if is_anomaly else float(round(100.0 + score * 50, 1))
        }
