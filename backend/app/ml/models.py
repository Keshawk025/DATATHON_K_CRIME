import os
import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.cluster import DBSCAN
from typing import Dict, Any, Tuple

MODELS_DIR = "/home/hp/Datathon/backend/models"
os.makedirs(MODELS_DIR, exist_ok=True)

class HotspotModelWrapper:
    def __init__(self):
        self.model = RandomForestRegressor(n_estimators=50, random_state=42)
        self.encoding_map = {}
        self.scaling_stats = {}

    def fit(self, X: pd.DataFrame, y: pd.Series, encoding_map: dict, scaling_stats: dict):
        self.encoding_map = encoding_map
        self.scaling_stats = scaling_stats
        self.model.fit(X, y)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict(X)

    def save(self):
        with open(os.path.join(MODELS_DIR, "hotspot_model.pkl"), "wb") as f:
            pickle.dump(self, f)

    @staticmethod
    def load() -> 'HotspotModelWrapper':
        path = os.path.join(MODELS_DIR, "hotspot_model.pkl")
        if not os.path.exists(path):
            return HotspotModelWrapper()
        with open(path, "rb") as f:
            return pickle.load(f)


class RiskModelWrapper:
    def __init__(self):
        self.model = RandomForestClassifier(n_estimators=50, random_state=42)
        self.encoding_map = {}
        self.scaling_stats = {}

    def fit(self, X: pd.DataFrame, y: pd.Series, encoding_map: dict, scaling_stats: dict):
        self.encoding_map = encoding_map
        self.scaling_stats = scaling_stats
        self.model.fit(X, y)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict(X)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict_proba(X)

    def save(self):
        with open(os.path.join(MODELS_DIR, "risk_model.pkl"), "wb") as f:
            pickle.dump(self, f)

    @staticmethod
    def load() -> 'RiskModelWrapper':
        path = os.path.join(MODELS_DIR, "risk_model.pkl")
        if not os.path.exists(path):
            return RiskModelWrapper()
        with open(path, "rb") as f:
            return pickle.load(f)


class TrendModelWrapper:
    def __init__(self):
        self.model = LinearRegression()

    def fit(self, X: pd.DataFrame, y: pd.Series):
        self.model.fit(X, y)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return self.model.predict(X)

    def save(self):
        with open(os.path.join(MODELS_DIR, "trend_model.pkl"), "wb") as f:
            pickle.dump(self, f)

    @staticmethod
    def load() -> 'TrendModelWrapper':
        path = os.path.join(MODELS_DIR, "trend_model.pkl")
        if not os.path.exists(path):
            return TrendModelWrapper()
        with open(path, "rb") as f:
            return pickle.load(f)


class ClusteringModelWrapper:
    def __init__(self):
        self.model = DBSCAN(eps=0.05, min_samples=2)

    def fit_predict(self, coords: np.ndarray) -> np.ndarray:
        """
        Coordinates is a 2D array: [[lat, lon], ...]
        Returns cluster assignments (outliers labeled -1)
        """
        return self.model.fit_predict(coords)

    def save(self):
        with open(os.path.join(MODELS_DIR, "clustering_model.pkl"), "wb") as f:
            pickle.dump(self, f)

    @staticmethod
    def load() -> 'ClusteringModelWrapper':
        path = os.path.join(MODELS_DIR, "clustering_model.pkl")
        if not os.path.exists(path):
            return ClusteringModelWrapper()
        with open(path, "rb") as f:
            return pickle.load(f)


class AnomalyModelWrapper:
    def __init__(self):
        self.model = IsolationForest(contamination=0.1, random_state=42)

    def fit(self, X: pd.DataFrame):
        self.model.fit(X)

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """
        Returns -1 for anomalies, 1 for normal data.
        """
        return self.model.predict(X)

    def decision_function(self, X: pd.DataFrame) -> np.ndarray:
        """
        Anomaly score. Lower is more anomalous.
        """
        return self.model.decision_function(X)

    def save(self):
        with open(os.path.join(MODELS_DIR, "anomaly_model.pkl"), "wb") as f:
            pickle.dump(self, f)

    @staticmethod
    def load() -> 'AnomalyModelWrapper':
        path = os.path.join(MODELS_DIR, "anomaly_model.pkl")
        if not os.path.exists(path):
            return AnomalyModelWrapper()
        with open(path, "rb") as f:
            return pickle.load(f)
