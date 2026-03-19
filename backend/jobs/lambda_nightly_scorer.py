import sys
import os
import json
from datetime import datetime
from loguru import logger

# Add src to the path so we can import modules when running as a script
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from src.db.database import SessionLocal
from src.models.core import Establishment, InspectionResult, DailyRiskScore, RiskBand
from src.services.ml_pipeline import generate_predictions

def handler(event, context):
    """
    AWS Lambda entrypoint. Triggered by EventBridge cron.
    Queries establishments, executes the ML model pipeline, and saves scores.
    """
    logger.info("Starting Nightly ML Scorer Job")
    
    db = SessionLocal()
    try:
        # 1. Fetch all active establishments
        establishments = db.query(Establishment).filter(Establishment.is_active == True).all()
        logger.info(f"Found {len(establishments)} active establishments to score.")
        
        ml_input_data = []
        for est in establishments:
            # Facility logic
            is_restaurant = 1 if est.facility_type.value == "Restaurant" else 0
            is_grocery = 1 if est.facility_type.value == "Grocery Store" else 0
            is_mobile = 1 if est.facility_type.value == "Mobile Food" else 0
            
            # Risk Level logic (High=3, Medium=2, Low=1)
            risk_val = 0
            if est.risk_category.value == "High":
                risk_val = 3
            elif est.risk_category.value == "Medium":
                risk_val = 2
            elif est.risk_category.value == "Low":
                risk_val = 1
                
            # Historical inspections
            inspections = db.query(InspectionResult).filter(
                InspectionResult.establishment_id == est.id
            ).order_by(InspectionResult.inspection_date.desc()).all()
            
            days_since = 730  # Default to 2 years if no history
            historical_fails = 0
            
            for index, insp in enumerate(inspections):
                if index == 0:
                    delta = datetime.utcnow().date() - insp.inspection_date
                    days_since = delta.days
                if insp.result.value == "Fail":
                    historical_fails += 1
                    
            ml_input_data.append({
                "id": str(est.id),
                "tenant_id": str(est.tenant_id),
                "is_restaurant": is_restaurant,
                "is_grocery": is_grocery,
                "is_mobile": is_mobile,
                "risk_level": risk_val,
                "days_since_last_inspection": days_since,
                "historical_failures": historical_fails
            })
            
        if not ml_input_data:
            logger.info("No establishments found to evaluate.")
            db.close()
            return {"status": "success", "processed": 0}
            
        # 2. Call the Model Pipeline
        logger.info(f"Passing {len(ml_input_data)} records to ml_pipeline.py...")
        predictions = generate_predictions(ml_input_data)
        
        logger.info("Saving predictions to the RDS database...")
        today = datetime.utcnow().date()
        
        # 3. Upsert scores into DailyRiskScore
        for index, pred in enumerate(predictions):
            original_data = ml_input_data[index]
            tenant_id = original_data["tenant_id"]
            est_id = pred["establishment_id"]
            
            existing = db.query(DailyRiskScore).filter(
                DailyRiskScore.establishment_id == est_id,
                DailyRiskScore.score_date == today
            ).first()
            
            risk_band_enum = RiskBand.LOW
            if pred["risk_band"] == "High":
                risk_band_enum = RiskBand.HIGH
            elif pred["risk_band"] == "Medium":
                risk_band_enum = RiskBand.MEDIUM
                
            prob_percent = pred["failure_probability"] * 100
            
            if existing:
                existing.risk_score = prob_percent
                existing.risk_band = risk_band_enum
                existing.factor_1_name = pred["top_risk_factor"]
                existing.factor_1_weight = 1.0 # Highest weight
                existing.factor_2_name = "Secondary Feature"
                existing.factor_2_weight = 0.5
                existing.factor_3_name = "Tertiary Feature"
                existing.factor_3_weight = 0.25
            else:
                new_score = DailyRiskScore(
                    tenant_id=tenant_id,
                    establishment_id=est_id,
                    score_date=today,
                    risk_score=prob_percent,
                    risk_band=risk_band_enum,
                    factor_1_name=pred["top_risk_factor"],
                    factor_1_weight=1.0,
                    factor_2_name="Secondary Feature",
                    factor_2_weight=0.5,
                    factor_3_name="Tertiary Feature",
                    factor_3_weight=0.25
                )
                db.add(new_score)
                
        db.commit()
        logger.info("Successfully committed DailyRiskScores.")
        return {"status": "success", "processed": len(predictions)}
        
    except Exception as e:
        logger.exception(f"Job failed: {str(e)}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    # Local execution testing
    logger.info("Local CLI trigger detected.")
    handler({}, None)
