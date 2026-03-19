import os
import pickle
import numpy as np
import pandas as pd
from typing import List, Dict, Any, Tuple
from loguru import logger
import xgboost as xgb

# Path to the serialized XGBoost model
MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "models", "global_baseline_xgb.pkl")

# Load model lazily
_model = None

def get_model() -> xgb.XGBClassifier:
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        with open(MODEL_PATH, "rb") as f:
            _model = pickle.load(f)
            logger.info(f"Loaded XGBoost model from {MODEL_PATH}")
    return _model

def generate_predictions(establishments_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Given a list of establishment features, predicts the failure risk probability.
    
    Expected input format for each dictionary in the list:
    {
        "id": "establishment_id",
        "is_restaurant": 1 or 0,
        "is_grocery": 1 or 0,
        "is_mobile": 1 or 0,
        "risk_level": 3, 2, 1, or 0,
        "days_since_last_inspection": int,
        "historical_failures": int
    }
    
    Returns a list of dictionaries with predictions and explainability factors.
    """
    if not establishments_data:
        return []

    model = get_model()
    
    # Feature order exactly as trained in the notebook
    feature_names = ['is_restaurant', 'is_grocery', 'is_mobile', 'risk_level', 
                     'days_since_last_inspection', 'historical_failures']
    
    # Build dataframe for batch prediction
    df = pd.DataFrame(establishments_data)
    X = df[feature_names]
    
    # Extract feature importances to use for explainability
    # For XGBoost, we can get global feature importances
    global_importances = model.feature_importances_
    
    # Predict probabilities for class 1 (Fail)
    proba = model.predict_proba(X)
    failure_probs = proba[:, 1]
    
    results = []
    for i, row_dict in enumerate(establishments_data):
        prob = failure_probs[i]
        
        # Determine risk band based on thresholds. 
        # (Since overall failure is rare, even a 10-15% prob could be high risk)
        if prob > 0.15:
            risk_band = "High"
        elif prob > 0.05:
            risk_band = "Medium"
        else:
            risk_band = "Low"
            
        # For explainability, we multiply feature value by global importance
        # to find out what contributed most for this specific restaurant.
        # This is a heuristic approach for MVP explainability.
        row_values = X.iloc[i].values
        contributions = row_values * global_importances
        top_factor_idx = np.argmax(contributions)
        top_factor_name = feature_names[top_factor_idx]
        
        # Map raw feature names to human-readable explanations
        factor_map = {
            'is_restaurant': 'Facility Baseline Risk (Restaurant)',
            'is_grocery': 'Facility Baseline Risk (Grocery)',
            'is_mobile': 'Facility Baseline Risk (Mobile)',
            'risk_level': 'Health Code Risk Categorization',
            'days_since_last_inspection': 'Time Since Last Inspection',
            'historical_failures': 'History of Failed Inspections'
        }
        
        results.append({
            "establishment_id": row_dict.get("id"),
            "failure_probability": float(prob),
            "risk_band": risk_band,
            "top_risk_factor": factor_map.get(top_factor_name, top_factor_name),
        })
        
    return results
