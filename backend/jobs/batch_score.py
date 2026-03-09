import sys
import os
import uuid
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
from datetime import datetime
from captum.attr import IntegratedGradients

# Ensure backend root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.database import SessionLocal
from src.models.core import DailyRiskScore, Establishment, RiskBand
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- Mock PyTorch Model Definition ---
class PredictiveRiskModel(nn.Module):
    def __init__(self, input_size=4):
        super(PredictiveRiskModel, self).__init__()
        # Simple feedforward for demonstration
        self.fc1 = nn.Linear(input_size, 8)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(8, 1)
        self.sigmoid = nn.Sigmoid()

    def forward(self, x):
        x = self.relu(self.fc1(x))
        # Map to 0-1 probability
        return self.sigmoid(self.fc2(x))


def extract_features(db_session, tenant_id: str) -> pd.DataFrame:
    """
    Simulates ELT extraction of establishment features from the database.
    Queries the newly seeded historical Chicago data.
    """
    logger.info(f"Extracting features for tenant {tenant_id}...")
    from sqlalchemy import func
    from src.models.core import InspectionResult, InspectionResultOutcome, InspectionType, RiskCategory
    
    establishments = (
        db_session.query(Establishment)
        .filter(Establishment.tenant_id == tenant_id, Establishment.is_active == True)
        .all()
    )

    data = []
    today = datetime.utcnow().date()
    
    for est in establishments:
        # 1. Historical Fails (count of FAIL outcomes)
        fail_count = db_session.query(func.count(InspectionResult.id)).filter(
            InspectionResult.establishment_id == est.id,
            InspectionResult.result == InspectionResultOutcome.FAIL
        ).scalar() or 0
        
        # 2. Days Since Last Inspection
        last_insp = db_session.query(func.max(InspectionResult.inspection_date)).filter(
            InspectionResult.establishment_id == est.id
        ).scalar()
        days_since = (today - last_insp).days if last_insp else 365
        
        # 3. Sanitation Complaints
        complaints = db_session.query(func.count(InspectionResult.id)).filter(
            InspectionResult.establishment_id == est.id,
            InspectionResult.inspection_type == InspectionType.COMPLAINT
        ).scalar() or 0
        
        # 4. Baseline Risk (from city designation)
        if est.risk_category == RiskCategory.HIGH:
            baseline = 0.85
        elif est.risk_category == RiskCategory.MEDIUM:
            baseline = 0.50
        else:
            baseline = 0.20

        data.append(
            {
                "establishment_id": est.id,
                "f_hist_vios": float(min(fail_count, 10)),
                "f_days_since": float(min(days_since, 730)), # Up to 2 years
                "f_complaints": float(min(complaints, 5)),
                "f_baseline": baseline,
            }
        )

    return pd.DataFrame(data)


def calculate_bands(score: float) -> RiskBand:
    if score >= 70.0:
        return RiskBand.HIGH
    if score >= 35.0:
        return RiskBand.MEDIUM
    return RiskBand.LOW


def run_nightly_scoring(tenant_id: str):
    """
    Executes the PyTorch inference and Captum explainability pipeline.
    """
    logger.info(f"Starting nightly batch scoring for tenant: {tenant_id}")
    db = SessionLocal()

    try:
        df = extract_features(db, tenant_id)
        if df.empty:
            logger.warning("No active establishments found for tenant.")
            return

        # 1. Prepare Model
        model = PredictiveRiskModel(input_size=4)
        model.eval()  # Set to evaluation mode

        # 2. Prepare Data Tensor
        feature_cols = ["f_hist_vios", "f_days_since", "f_complaints", "f_baseline"]
        feature_names = [
            "Historical Critical Violations",
            "Days Since Last Inspection",
            "Sanitation Complaints",
            "Facility Type Baseline",
        ]

        X_tensor = torch.tensor(df[feature_cols].values, dtype=torch.float32)

        # 3. Run Inference (Predict Risk 0-100)
        with torch.no_grad():
            predictions = model(X_tensor).squeeze() * 100.0  # Scale to 0-100

        # 4. Run Captum Explainability (T013)
        # Intergrated Gradients provides feature attributions for deep networks
        ig = IntegratedGradients(model)
        X_tensor.requires_grad_()

        # Baseline is a zero tensor of same shape
        baseline = torch.zeros(X_tensor.shape)

        # Calculate attributions (weights) for every single prediction
        attributions, delta = ig.attribute(
            X_tensor, baseline, target=0, return_convergence_delta=True
        )

        # 5. Persist to Database
        today = datetime.utcnow().date()
        new_scores = []

        for i, row in df.iterrows():
            est_id = row["establishment_id"]
            score = float(predictions[i])
            attr = attributions[i].detach().numpy()

            # Get top 3 indices by absolute attribution magnitude
            top_3_idx = np.argsort(np.abs(attr))[-3:][::-1]

            # Normalize to percentages for display weight
            total_attr = np.sum(np.abs(attr[top_3_idx])) + 1e-9

            risk_score = DailyRiskScore(
                tenant_id=uuid.UUID(tenant_id),
                establishment_id=est_id,
                score_date=today,
                risk_score=score,
                risk_band=calculate_bands(score),
                factor_1_name=feature_names[top_3_idx[0]],
                factor_1_weight=float(np.abs(attr[top_3_idx[0]]) / total_attr),
                factor_2_name=feature_names[top_3_idx[1]],
                factor_2_weight=float(np.abs(attr[top_3_idx[1]]) / total_attr),
                factor_3_name=feature_names[top_3_idx[2]],
                factor_3_weight=float(np.abs(attr[top_3_idx[2]]) / total_attr),
            )
            new_scores.append(risk_score)

        # Clear existing scores for today to make script idempotent
        db.query(DailyRiskScore).filter(
            DailyRiskScore.tenant_id == tenant_id, DailyRiskScore.score_date == today
        ).delete()

        db.add_all(new_scores)
        db.commit()

        logger.info(
            f"Successfully scored {len(new_scores)} establishments and generated Captum explanations."
        )

    except Exception as e:
        logger.error(f"Batch scoring failed: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    # Local fallback for testing T012/T013
    LOCAL_TENANT_ID = "11111111-1111-1111-1111-111111111111"
    run_nightly_scoring(LOCAL_TENANT_ID)
