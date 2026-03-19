# Machine Learning Implementation Flow
**RestaurantRisk Intelligence Platform**
**Component:** Predictive Analytics Pipeline (MVP V1)
**Date:** March 17, 2026

## 1. Overview
In a mature scale-up environment, a trained machine learning model powers predictive analytics and risk scoring. Rather than building simple hard-coded heuristics for our MVP V1, we adapted the **City of Chicago's open-source GLMNet predictive analytics algorithm**. 

By training an initial model on 250,000 historic food inspections from the Chicago Socrata Open Data Portal, we built a robust "Global Baseline Model." Because this dataset is rich in inspection failure examples, it allows us to identify universal correlations between business behaviors and critical food safety failures.

## 2. The Portability Strategy (Solving Domain Shift)
Our goal was that this ML model works on Day 1 for a new county or city signing onto the SaaS platform—e.g., in Miami or Seattle—without having to retrain. This introduces the problem of **Domain Shift**. 

If we trained the model on hyper-local variables (e.g., zip codes or density of 311 garbage complaints in specific Chicago wards), the model would fail outside of Chicago.

### Dropped Features 
To ensure cross-city portability, we dropped structurally geolocated and high-cardinality features from the training dataset:
- `longitude`, `latitude`, `zip`, `ward`
- `dba_name` (Business Name), `address`, `city`, `state`

### Kept Features (Universal Behavioral Attributes)
Instead, we focused on behaviors and circumstances that apply universally across any jurisdiction. We calculated the following inputs:
1. `is_restaurant` (Binary: 1 or 0)
2. `is_grocery` (Binary: 1 or 0)
3. `is_mobile` (Binary: 1 or 0)
4. `risk_level` (Integer: 3=High, 2=Medium, 1=Low)
5. `days_since_last_inspection` (Integer: Count of days elapsed. Captures Temporal Decay risk.)
6. `historical_failures` (Integer: Running sum of past inspection failures for the license.)

## 3. Training & Evaluation Methodology
The historical dataset was split into an 80% Training Set (200,000 records) and a 20% Validation/Test Set (50,000 records). Because failing an inspection is a relatively rare event (the dataset is highly imbalanced), we compared two tree-based ensemble models known for statistical Tabular data handling:
- **Random Forest Classifier**
- **XGBoost Classifier** (Gradient Boosted Trees)

### Model Performance
- **Random Forest:** Achieved 81% overall accuracy but severely struggled to correctly identify actual positive failures (0.00 Precision/Recall on the rare fail cases).
- **XGBoost:** Also achieved 81% overall accuracy, but successfully identified non-linear relationships, yielding a 41% Precision score for detecting rare failure instances within the testing split. 

**Decision:** We selected **XGBoost** as our V1 production model and serialized the trained weights to `models/global_baseline_xgb.pkl`.

## 4. Explainability & Production Architecture
When integrated into the backend application (`backend/src/services/ml_pipeline.py`), the pre-trained XGBoost model not only issues a probability score, but we will also extract its internal "Feature Importances" to drive the **Explainability UI** on the Director Dashboard.

For example, when an inspection is flagged High Risk, the platform can explicitly state: *Flagged High Risk primarily due to: Time Since Last Inspection (Weight 0.55).*
