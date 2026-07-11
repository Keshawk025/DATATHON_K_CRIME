import os
import json
import datetime
from typing import Dict, Any
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.ml.features import FeatureExtractor
from app.ml.preprocessing import Preprocessor
from app.ml.models import (
    HotspotModelWrapper,
    RiskModelWrapper,
    TrendModelWrapper,
    ClusteringModelWrapper,
    AnomalyModelWrapper,
    MODELS_DIR
)
from app.ml.evaluation import ModelEvaluator

class TrainingPipeline:
    @staticmethod
    def run_training_pipeline(db: Session) -> Dict[str, Any]:
        """
        Extract data, clean it, train the 5 baseline models, evaluate, and save them.
        """
        metrics = {}
        dataset_sizes = {}
        
        # 1. Hotspot Model
        print("Training Hotspot Model...")
        df_hotspot = FeatureExtractor.get_hotspot_features(db)
        dataset_sizes["hotspot"] = len(df_hotspot)
        
        # Preprocess
        df_encoded, encoding_map = Preprocessor.encode_categorical(df_hotspot, ["district_id"])
        # Columns to scale
        scale_cols = ["avg_severity", "latitude", "longitude", "historical_crime_count"]
        df_scaled, scaling_stats = Preprocessor.scale_features(df_encoded, scale_cols)
        
        features_hotspot = ["crime_year", "crime_month", "avg_severity", "latitude", "longitude", "historical_crime_count"]
        X_hotspot = df_scaled[features_hotspot]
        y_hotspot = df_scaled["crime_count"]
        
        hotspot_wrapper = HotspotModelWrapper()
        hotspot_wrapper.fit(X_hotspot, y_hotspot, encoding_map, scaling_stats)
        hotspot_wrapper.save()
        
        # Evaluate
        y_pred_hotspot = hotspot_wrapper.predict(X_hotspot)
        metrics["hotspot"] = ModelEvaluator.evaluate_hotspot(y_hotspot.values, y_pred_hotspot)

        # 2. Risk Model
        print("Training Criminal Risk Model...")
        df_risk = FeatureExtractor.get_risk_features(db)
        dataset_sizes["risk"] = len(df_risk)
        
        df_encoded_risk, encoding_map_risk = Preprocessor.encode_categorical(df_risk, ["gender"])
        df_scaled_risk, scaling_stats_risk = Preprocessor.scale_features(df_encoded_risk, ["age", "past_fir_count", "avg_severity"])
        
        features_risk = ["age", "gender", "past_fir_count", "avg_severity"]
        X_risk = df_scaled_risk[features_risk]
        y_risk = df_scaled_risk["high_risk"]
        
        risk_wrapper = RiskModelWrapper()
        risk_wrapper.fit(X_risk, y_risk, encoding_map_risk, scaling_stats_risk)
        risk_wrapper.save()
        
        # Evaluate
        y_pred_risk = risk_wrapper.predict(X_risk)
        metrics["risk"] = ModelEvaluator.evaluate_risk(y_risk.values, y_pred_risk)

        # 3. Forecast Model
        print("Training Forecast Model...")
        df_trend = FeatureExtractor.get_trend_features(db)
        dataset_sizes["forecast"] = len(df_trend)
        
        X_trend = df_trend[["month_index"]]
        y_trend = df_trend["crime_count"]
        
        trend_wrapper = TrendModelWrapper()
        trend_wrapper.fit(X_trend, y_trend)
        trend_wrapper.save()
        
        y_pred_trend = trend_wrapper.predict(X_trend)
        metrics["forecast"] = ModelEvaluator.evaluate_trend(y_trend.values, y_pred_trend)

        # 4. Clustering Model
        print("Training DBSCAN Clustering Model...")
        df_anomaly = FeatureExtractor.get_anomaly_features(db)
        dataset_sizes["clustering"] = len(df_anomaly)
        
        coords = df_anomaly[["latitude", "longitude"]].values
        clustering_wrapper = ClusteringModelWrapper()
        cluster_labels = clustering_wrapper.fit_predict(coords)
        clustering_wrapper.save()
        metrics["clustering"] = ModelEvaluator.evaluate_clustering(cluster_labels)

        # 5. Anomaly Model
        print("Training Anomaly Detection Model...")
        # Features for IsolationForest
        features_anomaly = ["latitude", "longitude", "severity", "crime_month", "day_of_week"]
        X_anomaly = df_anomaly[features_anomaly]
        
        anomaly_wrapper = AnomalyModelWrapper()
        anomaly_wrapper.fit(X_anomaly)
        anomaly_wrapper.save()
        
        anom_preds = anomaly_wrapper.predict(X_anomaly)
        # Ratio of outliers (-1)
        anom_ratio = float(np.mean(anom_preds == -1))
        metrics["anomaly"] = {
            "dataset_size": len(X_anomaly),
            "anomaly_ratio": round(anom_ratio, 3),
            "anomaly_count": int(np.sum(anom_preds == -1))
        }

        # Combine Metadata
        metadata = {
            "status": "Ready",
            "last_training_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "dataset_sizes": dataset_sizes,
            "metrics": metrics
        }
        
        # Save Metadata
        with open(os.path.join(MODELS_DIR, "metadata.json"), "w") as f:
            json.dump(metadata, f, indent=4)
            
        print("Training completed successfully! Model status is: Ready.")
        return metadata
