import numpy as np
from sklearn.metrics import r2_score, mean_absolute_error, accuracy_score, f1_score, precision_score, recall_score
from typing import Dict, Any

class ModelEvaluator:
    @staticmethod
    def evaluate_hotspot(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """
        Evaluate regression performance for hotspot prediction.
        """
        mae = float(mean_absolute_error(y_true, y_pred))
        r2 = float(r2_score(y_true, y_pred))
        # Handle division by zero for R2
        if np.isnan(r2) or r2 < 0:
            r2 = 0.0
        return {
            "mean_absolute_error": round(mae, 3),
            "r2_score": round(r2, 3),
            "accuracy": round(max(0, 100 * (1 - (mae / (np.mean(y_true) if np.mean(y_true) != 0 else 1)))), 1)
        }

    @staticmethod
    def evaluate_risk(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """
        Evaluate binary classification performance for risk scoring.
        """
        acc = float(accuracy_score(y_true, y_pred))
        f1 = float(f1_score(y_true, y_pred, zero_division=0))
        prec = float(precision_score(y_true, y_pred, zero_division=0))
        rec = float(recall_score(y_true, y_pred, zero_division=0))
        
        return {
            "accuracy": round(acc * 100, 1),
            "f1_score": round(f1, 3),
            "precision": round(prec, 3),
            "recall": round(rec, 3)
        }

    @staticmethod
    def evaluate_trend(y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """
        Evaluate forecast regression.
        """
        mae = float(mean_absolute_error(y_true, y_pred))
        return {
            "mean_absolute_error": round(mae, 3),
            "accuracy": round(max(0, 100 * (1 - (mae / (np.mean(y_true) if np.mean(y_true) != 0 else 1)))), 1)
        }

    @staticmethod
    def evaluate_clustering(labels: np.ndarray) -> Dict[str, Any]:
        """
        Evaluate DBSCAN clustering labels.
        """
        unique_labels = set(labels)
        n_clusters = len(unique_labels) - (1 if -1 in unique_labels else 0)
        n_noise = list(labels).count(-1)
        total = len(labels)
        
        return {
            "cluster_count": n_clusters,
            "anomaly_count": n_noise,
            "anomaly_ratio": round(n_noise / total if total > 0 else 0, 3)
        }
