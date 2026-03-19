import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import xgboost as xgb
from sklearn.metrics import classification_report, accuracy_score, f1_score
import pickle
import os

print("=== RestaurantRisk Intelligence Platform ===")
print("=== Global Baseline ML Model Training ===\n")

def load_city_data():
    # Chicago Socrata API allows up to 250,000 records per paginated request.
    url = "https://data.cityofchicago.org/resource/4ijn-s7e5.json?$limit=250000&$order=inspection_id%20DESC"
    df = pd.read_json(url)
    return df

print("Downloading dataset...")
raw_df = load_city_data()
print(f"Loaded {len(raw_df)} records.")

def engineer_features(df):
    df['target_failure'] = df['results'].apply(lambda x: 1 if x == 'Fail' else 0)
    
    df['facility_type'] = df['facility_type'].str.lower().fillna('unknown')
    df['is_restaurant'] = df['facility_type'].apply(lambda x: 1 if 'restaurant' in x or 'food' in x else 0)
    df['is_grocery'] = df['facility_type'].apply(lambda x: 1 if 'grocery' in x or 'store' in x else 0)
    df['is_mobile'] = df['facility_type'].apply(lambda x: 1 if 'mobile' in x or 'truck' in x else 0)
    
    df['risk_level'] = df['risk'].astype(str).apply(
        lambda x: 3 if 'Risk 1' in x else (2 if 'Risk 2' in x else (1 if 'Risk 3' in x else 0))
    )
    
    df['inspection_date'] = pd.to_datetime(df['inspection_date'])
    
    df = df.sort_values(by=['license_', 'inspection_date'])
    
    df['prev_inspection_date'] = df.groupby('license_')['inspection_date'].shift(1)
    df['days_since_last_inspection'] = (df['inspection_date'] - df['prev_inspection_date']).dt.days
    df['days_since_last_inspection'] = df['days_since_last_inspection'].fillna(730)
    
    df['historical_failures'] = df.groupby('license_')['target_failure'].cumsum().shift(1).fillna(0)
    
    features = ['is_restaurant', 'is_grocery', 'is_mobile', 'risk_level', 
                'days_since_last_inspection', 'historical_failures']
    
    X = df[features]
    y = df['target_failure']
    
    return X, y

print("\nEngineering portability features...")
X, y = engineer_features(raw_df)

print("\nTraining models...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

rf_model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
rf_model.fit(X_train, y_train)
rf_preds = rf_model.predict(X_test)

print("\n=== Random Forest ===")
print(classification_report(y_test, rf_preds))

xgb_model = xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1, random_state=42)
xgb_model.fit(X_train, y_train)
xgb_preds = xgb_model.predict(X_test)

print("\n=== XGBoost ===")
print(classification_report(y_test, xgb_preds))

os.makedirs("models", exist_ok=True)
with open('models/global_baseline_xgb.pkl', 'wb') as f:
    pickle.dump(xgb_model, f)

print("\nSuccessfully saved models/global_baseline_xgb.pkl")
print("Feature mappings needed for API integration:", list(X.columns))
