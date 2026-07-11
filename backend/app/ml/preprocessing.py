import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, List

class Preprocessor:
    @staticmethod
    def extract_date_features(df: pd.DataFrame, date_column: str) -> pd.DataFrame:
        """
        Extract Year, Month, Week, and Day of Week from a datetime column.
        """
        df = df.copy()
        dates = pd.to_datetime(df[date_column])
        df['crime_year'] = dates.dt.year
        df['crime_month'] = dates.dt.month
        # dt.isocalendar().week returns the ISO week
        df['crime_week'] = dates.dt.isocalendar().week.astype(int)
        df['day_of_week'] = dates.dt.dayofweek
        return df

    @staticmethod
    def encode_categorical(df: pd.DataFrame, columns: List[str], mapping_dict: Dict[str, Dict[Any, int]] = None) -> Tuple[pd.DataFrame, Dict[str, Dict[Any, int]]]:
        """
        Simple label encoder to map categorical columns to numerical indexes.
        """
        df = df.copy()
        if mapping_dict is None:
            mapping_dict = {}
            
        for col in columns:
            if col not in df.columns:
                continue
                
            if col not in mapping_dict:
                # Build mapping dictionary
                unique_vals = df[col].dropna().unique()
                mapping_dict[col] = {val: idx for idx, val in enumerate(unique_vals)}
                
            # Map values, fallback to -1 for unknown
            df[col] = df[col].map(mapping_dict[col]).fillna(-1).astype(int)
            
        return df, mapping_dict

    @staticmethod
    def scale_features(df: pd.DataFrame, columns: List[str], stats_dict: Dict[str, Tuple[float, float]] = None) -> Tuple[pd.DataFrame, Dict[str, Tuple[float, float]]]:
        """
        Standard scaling (z-score normalization) for numeric columns.
        """
        df = df.copy()
        if stats_dict is None:
            stats_dict = {}
            
        for col in columns:
            if col not in df.columns:
                continue
                
            if col not in stats_dict:
                mean_val = float(df[col].mean())
                std_val = float(df[col].std())
                if std_val == 0 or np.isnan(std_val):
                    std_val = 1.0
                stats_dict[col] = (mean_val, std_val)
                
            mean, std = stats_dict[col]
            df[col] = (df[col] - mean) / std
            
        return df, stats_dict

    @staticmethod
    def clean_missing(df: pd.DataFrame, fill_rules: Dict[str, Any]) -> pd.DataFrame:
        """
        Impute missing values based on custom rules.
        """
        df = df.copy()
        for col, val in fill_rules.items():
            if col in df.columns:
                if val == 'mean':
                    df[col] = df[col].fillna(df[col].mean())
                elif val == 'median':
                    df[col] = df[col].fillna(df[col].median())
                elif val == 'mode':
                    df[col] = df[col].fillna(df[col].mode().iloc[0] if not df[col].mode().empty else 0)
                else:
                    df[col] = df[col].fillna(val)
        return df
