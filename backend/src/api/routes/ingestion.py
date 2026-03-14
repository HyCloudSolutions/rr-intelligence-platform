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
from src.models.core import Establishment, FacilityType, RiskCategory

router = APIRouter(prefix="/api/v1/ingestion", tags=["Ingestion"])


def process_csv_background(file_path: str, tenant_id: str):
    """Background task to parse the uploaded CSV and insert Establishments."""
    print(f"Starting background ingestion for Tenant {tenant_id}")
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        print(f"Failed to read CSV in background: {e}")
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
        for index, row in df.iterrows():
            try:
                # San Francisco uses 'business_id', Chicago uses 'LICENSE_ID' or 'License #'
                lic_id = str(row.get("business_id", row.get("LICENSE_ID", ""))).strip()
                if not lic_id or lic_id == "nan":
                    lic_id = str(row.get("License #", "")).strip()
                    if not lic_id or lic_id == "nan":
                        continue

                fac_type_str = str(row.get("FACILITY_TYPE", row.get("Facility Type", "Restaurant")))
                fac_type_enum = FacilityType.RESTAURANT
                if "Grocery" in fac_type_str:
                    fac_type_enum = FacilityType.GROCERY
                elif "Mobile" in fac_type_str or "Truck" in fac_type_str:
                    fac_type_enum = FacilityType.MOBILE

                # SF uses 'risk_category' (e.g. 'Low Risk', 'High Risk')
                risk_str = str(row.get("risk_category", row.get("BASELINE_RISK", row.get("Risk", "Medium"))))
                risk_enum = RiskCategory.MEDIUM
                if "High" in risk_str or "Risk 1" in risk_str:
                    risk_enum = RiskCategory.HIGH
                elif "Low" in risk_str or "Risk 3" in risk_str:
                    risk_enum = RiskCategory.LOW

                name = str(row.get("business_name", row.get("NAME", row.get("DBA Name", "Unknown Name"))))
                address = str(row.get("business_address", row.get("ADDRESS", row.get("Address", "Unknown Address"))))
                zip_code = str(row.get("business_postal_code", row.get("ZIP", row.get("Zip", ""))))

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
                    new_records += 1

            except Exception as row_error:
                print(f"Row {index} failed: {row_error}")
                errors += 1

        db.commit()
        print(f"Ingestion Complete. Inserted: {new_records}, Updated: {updated_records}, Errors: {errors}")

    except Exception as e:
        print(f"Ingestion transaction failed: {e}")
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
        fd, temp_path = tempfile.mkstemp(suffix=".csv")
        with os.fdopen(fd, "wb") as f_out:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                f_out.write(chunk)
                
        # Queue the background processing task
        background_tasks.add_task(process_csv_background, temp_path, tenant_id)
        
        return {
            "status": "processing", 
            "message": "File uploaded successfully. Processing in background."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
