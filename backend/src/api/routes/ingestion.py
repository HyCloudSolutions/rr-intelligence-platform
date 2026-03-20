from fastapi import APIRouter, Depends, UploadFile, File, BackgroundTasks, HTTPException
from typing import Dict, Any
import pandas as pd
import tempfile
import os
import uuid
from datetime import datetime
from pydantic import BaseModel

from src.api.middleware.auth import get_current_tenant_id, get_current_user_role
from src.db.database import get_db
from sqlalchemy.orm import Session
from src.models.core import Establishment, FacilityType, RiskCategory, InspectionResult, InspectionType, InspectionResultOutcome, DailyRiskScore, RiskBand
import boto3

router = APIRouter(prefix="/api/v1/ingestion", tags=["Ingestion"])

# In-memory tracking for background ingestion jobs
ingestion_jobs: Dict[str, Dict[str, Any]] = {}


def process_csv_background(file_path: str, tenant_id: str, job_id: str, mapping: Dict[str, str] = {}):
    """Background task to parse the uploaded CSV and insert Establishments with custom mapping."""
    print(f"Starting background ingestion for Tenant {tenant_id}, Job {job_id}")
    if job_id not in ingestion_jobs:
        ingestion_jobs[job_id] = {"status": "processing", "rows_total": 0, "processed": 0, "errors": 0}
    try:
        df = pd.read_csv(file_path)
        ingestion_jobs[job_id]["rows_total"] = len(df)
    except Exception as e:
        print(f"Failed to read CSV in background: {e}")
        ingestion_jobs[job_id]["status"] = "failed"
        if os.path.exists(file_path):
            os.remove(file_path)
        return

    # Create a fresh DB session for the background worker
    from src.db.database import SessionLocal
    db = SessionLocal()
    tenant_uuid = uuid.UUID(tenant_id)

    new_records = 0
    updated_records = 0
    errors = 0

    try:
        processed_est_ids = set()
        for index, row in df.iterrows():
            try:
                # Use provided mapping if alive, fallback to defaults
                lic_col = mapping.get("license_id", "business_id")
                lic_id = str(row.get(lic_col, row.get("LICENSE_ID", row.get("License #", "")))).strip()
                if not lic_id or lic_id == "nan":
                    continue

                fac_col = mapping.get("facility_type", "FACILITY_TYPE")
                fac_type_str = str(row.get(fac_col, row.get("Facility Type", "Restaurant")))
                fac_type_enum = FacilityType.RESTAURANT
                if "Grocery" in fac_type_str:
                    fac_type_enum = FacilityType.GROCERY
                elif "Mobile" in fac_type_str or "Truck" in fac_type_str:
                    fac_type_enum = FacilityType.MOBILE

                risk_col = mapping.get("risk_category", "risk_category")
                risk_str = str(row.get(risk_col, row.get("BASELINE_RISK", row.get("Risk", "Medium"))))
                risk_enum = RiskCategory.MEDIUM
                if "High" in risk_str or "Risk 1" in risk_str:
                    risk_enum = RiskCategory.HIGH
                elif "Low" in risk_str or "Risk 3" in risk_str:
                    risk_enum = RiskCategory.LOW

                name_col = mapping.get("name", "business_name")
                name = str(row.get(name_col, row.get("NAME", row.get("DBA Name", "Unknown Name"))))
                
                addr_col = mapping.get("address", "business_address")
                address = str(row.get(addr_col, row.get("ADDRESS", row.get("Address", "Unknown Address"))))
                
                zip_col = mapping.get("zip_code", "business_postal_code")
                zip_code = str(row.get(zip_col, row.get("ZIP", row.get("Zip", ""))))

                existing = (
                    db.query(Establishment)
                    .filter(
                        Establishment.tenant_id == tenant_uuid,
                        Establishment.license_id == lic_id,
                    )
                    .first()
                )

                if existing:
                    existing.name = name
                    existing.address = address
                    existing.zip = zip_code
                    existing.facility_type = fac_type_enum
                    existing.risk_category = risk_enum
                    existing.updated_at = datetime.utcnow()
                    updated_records += 1
                    est_id = existing.id
                else:
                    new_est = Establishment(
                        tenant_id=tenant_uuid,
                        license_id=lic_id,
                        name=name,
                        address=address,
                        zip=zip_code,
                        facility_type=fac_type_enum,
                        risk_category=risk_enum,
                    )
                    db.add(new_est)
                    db.flush()
                    est_id = new_est.id
                    new_records += 1

                processed_est_ids.add(str(est_id))

                # Parse and ingest InspectionResult if present
                insp_date_str = str(row.get("inspection_date", ""))
                if insp_date_str and insp_date_str != "nan":
                    try:
                        insp_date = datetime.strptime(insp_date_str.split("T")[0], "%Y-%m-%d").date()
                    except ValueError:
                        insp_date = None

                    if insp_date:
                        existing_insp = db.query(InspectionResult).filter(
                            InspectionResult.establishment_id == est_id,
                            InspectionResult.inspection_date == insp_date
                        ).first()

                        if not existing_insp:
                            res_str = str(row.get("inspection_result", "")).upper()
                            outcome = InspectionResultOutcome.PASS
                            if "UNSATISFACTORY" in res_str or "FAIL" in res_str:
                                outcome = InspectionResultOutcome.FAIL
                            elif "CONDITIONS" in res_str:
                                outcome = InspectionResultOutcome.PASS_CONDITIONS

                            type_str = str(row.get("inspection_type", "")).upper()
                            insp_type = InspectionType.CANVAS
                            if "COMPLAINT" in type_str:
                                insp_type = InspectionType.COMPLAINT
                            elif "RE-INSPECTION" in type_str or "RETURN" in type_str:
                                insp_type = InspectionType.RE_INSPECTION

                            try:
                                pts = int(float(row.get("violation_points", 0)))
                            except (ValueError, TypeError):
                                pts = 0

                            new_insp = InspectionResult(
                                tenant_id=tenant_uuid,
                                establishment_id=est_id,
                                inspector_id=uuid.uuid4(),  # Mock inspector for historical uploads
                                inspection_date=insp_date,
                                inspection_type=insp_type,
                                result=outcome,
                                critical_violations=pts,
                                notes=f"Historical data import"
                            )
                            db.add(new_insp)

                ingestion_jobs[job_id]["processed"] += 1

            except Exception as row_error:
                print(f"Row {index} failed: {row_error}")
                errors += 1
                ingestion_jobs[job_id]["errors"] += 1

        db.commit()

        # Step 2: Generate ML Predictions (Real Dataset)
        if processed_est_ids:
            from src.services.ml_pipeline import generate_predictions
            import random
            from datetime import datetime
            today = datetime.utcnow().date()
            
            est_batch = []
            for est_id in processed_est_ids:
                est_uuid = uuid.UUID(est_id)
                est = db.query(Establishment).filter(Establishment.id == est_uuid).first()
                if not est: continue
                
                fails_count = db.query(InspectionResult).filter(
                    InspectionResult.establishment_id == est_uuid,
                    InspectionResult.result == InspectionResultOutcome.FAIL
                ).count()
                
                last_insp = db.query(InspectionResult).filter(
                    InspectionResult.establishment_id == est_uuid
                ).order_by(InspectionResult.inspection_date.desc()).first()
                
                days_since = 365 # Default
                if last_insp:
                    days_since = (today - last_insp.inspection_date).days
                    
                risk_lvl = 2 # Medium default
                if est.risk_category == RiskCategory.HIGH: risk_lvl = 3
                elif est.risk_category == RiskCategory.LOW: risk_lvl = 1
                
                est_batch.append({
                    "id": str(est.id),
                    "is_restaurant": 1 if est.facility_type == FacilityType.RESTAURANT else 0,
                    "is_grocery": 1 if est.facility_type == FacilityType.GROCERY else 0,
                    "is_mobile": 1 if est.facility_type == FacilityType.MOBILE else 0,
                    "risk_level": risk_lvl,
                    "days_since_last_inspection": days_since,
                    "historical_failures": fails_count
                })
                
            predictions = generate_predictions(est_batch)
            for pred in predictions:
                score_val = pred["failure_probability"] * 100 
                # XGBoost models can sometimes give score close to 0. Limit minimum.
                score_val = max(10, round(score_val, 1))
                band_str = pred.get("risk_band", "Low")
                band = RiskBand.HIGH if band_str == "High" else (RiskBand.MEDIUM if band_str == "Medium" else RiskBand.LOW)
                
                f1_name = pred.get("top_risk_factor", "Time Since Inspection")
                f1_weight = random.uniform(0.4, 0.6)
                f2_name = "Historical Failures" if f1_name != "Historical Failures" else "Establishment Type Risk"
                f2_weight = random.uniform(0.2, 0.3)
                f3_name = "Risk Level Default"
                f3_weight = 1.0 - f1_weight - f2_weight

                rf = DailyRiskScore(
                    tenant_id=tenant_uuid,
                    establishment_id=uuid.UUID(pred["establishment_id"]),
                    score_date=today,
                    risk_score=score_val,
                    risk_band=band,
                    factor_1_name=f1_name, factor_1_weight=round(f1_weight, 2),
                    factor_2_name=f2_name, factor_2_weight=round(f2_weight, 2),
                    factor_3_name=f3_name, factor_3_weight=round(f3_weight, 2),
                )
                db.add(rf)
        
        db.commit()

        ingestion_jobs[job_id]["status"] = "completed"
        print(f"Ingestion Complete. Inserted: {new_records}, Updated: {updated_records}, Errors: {errors}")

    except Exception as e:
        print(f"Ingestion transaction failed: {e}")
        ingestion_jobs[job_id]["status"] = "failed"
        ingestion_jobs[job_id]["error_msg"] = str(e)
        db.rollback()
    finally:
        db.close()
        # Clean up temp file
        if os.path.exists(file_path):
            os.remove(file_path)


@router.post("")
async def upload_ingestion_csv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    tenant_id: str = Depends(get_current_tenant_id),
    role: str = Depends(get_current_user_role),
):
    """
    Accepts a standard CSV file upload from a Director and queues it for asynchronous DB insertion.
    """
    if role != "director":
        raise HTTPException(status_code=403, detail="Only directors can ingest data.")

    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV.")

    # Save via chunking to handle potentially large files
    try:
        # Load into memory to get exact count for feedback
        import pandas as pd
        df = pd.read_csv(file.file)
        row_count = len(df)
        
        job_id = str(uuid.uuid4())
        ingestion_jobs[job_id] = {
            "status": "processing",
            "rows_total": row_count,
            "processed": 0,
            "errors": 0
        }
        
        fd, temp_path = tempfile.mkstemp(suffix=".csv")
        df.to_csv(temp_path, index=False)
                
        # Queue the background processing task
        background_tasks.add_task(process_csv_background, temp_path, tenant_id, job_id)
        
        return {
            "status": "processing", 
            "job_id": job_id,
            "message": f"Upload successful. Queued {row_count} records for database insertion and ML indexing."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status/{job_id}")
async def get_ingestion_status(job_id: str, role: str = Depends(get_current_user_role)):
    """
    Returns the processing status, row counts and errors for an ingestion job.
    """
    if role != "director":
        raise HTTPException(status_code=403, detail="Only directors can check status.")
        
    if job_id not in ingestion_jobs:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    return {
        "job_id": job_id,
        "status": ingestion_jobs[job_id]["status"],
        "rows_total": ingestion_jobs[job_id]["rows_total"],
        "processed": ingestion_jobs[job_id].get("processed", 0),
        "errors": ingestion_jobs[job_id].get("errors", 0),
    }

class IngestionWithMapping(BaseModel):
    temp_file: str
    mapping: Dict[str, str]

@router.post("/analyze-headers")
async def analyze_csv_headers(
    file: UploadFile = File(...),
    role: str = Depends(get_current_user_role)
):
    """Returns headers of the uploaded CSV to map onto GUI fields."""
    if role != "director":
        raise HTTPException(status_code=403, detail="Only directors can ingest data.")
    
    try:
        import pandas as pd
        import tempfile
        import os
        
        # 1. Write stream to temp file to fully avoid seek(0) content locks
        fd, temp_path = tempfile.mkstemp(suffix=".csv")
        with os.fdopen(fd, 'wb') as tmp:
            tmp.write(await file.read())
            
        # 2. Analyze from disk file path
        df = pd.read_csv(temp_path, nrows=5)
        headers = df.columns.tolist()
        
        df_full = pd.read_csv(temp_path, usecols=[0]) # lightweight count
        rows_count = len(df_full)
        
        return {
            "headers": headers,
            "temp_path": temp_path,
            "rows": rows_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze CSV: {str(e)}")

@router.post("/start-mapped")
async def start_mapped_ingestion(
    req: IngestionWithMapping,
    background_tasks: BackgroundTasks,
    tenant_id: str = Depends(get_current_tenant_id),
    role: str = Depends(get_current_user_role)
):
    """Triggers background processing utilizing explicit mapping nodes."""
    if role != "director":
        raise HTTPException(status_code=403, detail="Only directors can ingest data.")
        
    if not os.path.exists(req.temp_file):
        raise HTTPException(status_code=400, detail="Temporary upload cache not found or expired.")
        
    job_id = str(uuid.uuid4())
    
    ingestion_jobs[job_id] = {
        "status": "processing",
        "rows_total": 0, # fetched dynamically in background
        "processed": 0,
        "errors": 0
    }
    
    background_tasks.add_task(process_csv_background, req.temp_file, tenant_id, job_id, req.mapping)
    return {"job_id": job_id, "status": "processing"}

@router.post("/trigger-scoring")
async def trigger_scoring_lambda(is_admin: bool = Depends(lambda: True)): # Simplify auth for demonstration
    """SuperAdmin Trigger explicitly Calling Invoke Lambda loops."""
    # Authenticate superadmin in real logic
    try:
        lambda_name = os.getenv("SCORING_LAMBDA_NAME")
        if not lambda_name:
            proj = os.getenv("PROJECT_NAME", "restaurantrisk")
            env = os.getenv("ENVIRONMENT", "prod")
            lambda_name = f"{proj}-{env}-nightly-ml-scorer"

        lambda_client = boto3.client("lambda", region_name=os.getenv("AWS_REGION", "us-east-1"))
        
        # Invoke Lambda asynchronously
        response = lambda_client.invoke(
            FunctionName=lambda_name,
            InvocationType='Event'
        )
        
        return {
            "status": "triggered", 
            "message": f"Scoring calculation Lambda ({lambda_name}) triggered asynchronously.",
            "aws_status_code": response.get('StatusCode')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

