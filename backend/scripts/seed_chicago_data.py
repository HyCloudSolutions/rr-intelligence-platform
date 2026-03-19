"""
Chicago Food Inspections Data Seeder
Parses real public health data from the Chicago Data Portal and seeds the local database.

Assumes CSV is located at /tmp/chicago_food_inspections.csv
"""
import uuid
import argparse
import sys
import os
import pandas as pd
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from src.db.database import SessionLocal, engine, Base
from src.models.core import (
    Establishment,
    InspectionResult,
    DailyRiskScore,
    FacilityType,
    RiskCategory,
    InspectionType,
    InspectionResultOutcome,
)

# ── Constants ────────────────────────────────────────────────────────────────
LOCAL_TENANT_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
MOCK_INSPECTOR_IDS = [uuid.UUID(f"22222222-2222-2222-2222-{str(i).zfill(12)}") for i in range(1, 11)]

def parse_risk(risk_str):
    if not isinstance(risk_str, str):
        return RiskCategory.MEDIUM
    if "Risk 1" in risk_str:
        return RiskCategory.HIGH
    elif "Risk 3" in risk_str:
        return RiskCategory.LOW
    return RiskCategory.MEDIUM

def parse_facility_type(fac_str):
    if not isinstance(fac_str, str):
        return FacilityType.RESTAURANT
    fac_str = fac_str.lower()
    if "grocery" in fac_str:
        return FacilityType.GROCERY
    elif "mobile" in fac_str:
        return FacilityType.MOBILE
    return FacilityType.RESTAURANT

def parse_result(result_str):
    if not isinstance(result_str, str):
        return None
    r = result_str.lower()
    if r == "pass":
        return InspectionResultOutcome.PASS
    elif "pass w" in r:
        return InspectionResultOutcome.PASS_CONDITIONS
    elif "fail" in r:
        return InspectionResultOutcome.FAIL
    elif "business" in r:
        return InspectionResultOutcome.OUT_OF_BUSINESS
    return None

def parse_inspection_type(type_str):
    if not isinstance(type_str, str):
        return InspectionType.CANVAS
    t = type_str.lower()
    if "complaint" in t:
        return InspectionType.COMPLAINT
    elif "re-inspection" in t:
        return InspectionType.RE_INSPECTION
    return InspectionType.CANVAS

def parse_violations(vio_str):
    if not isinstance(vio_str, str):
        return 0, ""
    # Critical violations in Chicago are typically 1-14
    count = 0
    notes = str(vio_str)[:200] + "..." if len(str(vio_str)) > 200 else str(vio_str)
    
    parts = str(vio_str).split(" | ")
    for part in parts:
        try:
            num = int(part.split(".")[0])
            if num <= 14:
                count += 1
        except:
            pass
    return count, notes

def seed_chicago_data(db: Session, csv_path="/tmp/chicago_food_inspections.csv", limit=2000):
    print(f"Loading CSV from {csv_path}...")
    df = pd.read_csv(csv_path)
    
    print(f"Loaded {len(df)} rows. Filtering for valid licenses and recent years...")
    df['Inspection Date'] = pd.to_datetime(df['Inspection Date'])
    # Get last 2 years of data to keep it relevant
    cutoff_date = pd.Timestamp.now() - pd.DateOffset(years=2)
    df = df[df['Inspection Date'] >= cutoff_date]
    df = df.dropna(subset=['License #', 'DBA Name', 'Address', 'Latitude', 'Longitude'])
    
    # Sort by date descending so we get latest state
    df = df.sort_values(by=['License #', 'Inspection Date'], ascending=[True, False])
    
    print("Extracting unique establishments...")
    unique_ests = df.drop_duplicates(subset=['License #'])
    if len(unique_ests) > limit:
        unique_ests = unique_ests.sample(n=limit, random_state=42)
    
    # Keep only inspections for our selected establishments
    valid_licenses = set(unique_ests['License #'])
    df_inspections = df[df['License #'].isin(valid_licenses)]
    
    print(f"Seeding {len(unique_ests)} establishments and {len(df_inspections)} inspections...")
    
    db.query(DailyRiskScore).filter(DailyRiskScore.tenant_id == LOCAL_TENANT_ID).delete()
    db.query(InspectionResult).filter(InspectionResult.tenant_id == LOCAL_TENANT_ID).delete()
    db.query(Establishment).filter(Establishment.tenant_id == LOCAL_TENANT_ID).delete()
    db.commit()

    est_objects = {}
    db_ests = []
    
    # Create Establishments
    for _, row in unique_ests.iterrows():
        est_id = uuid.uuid4()
        license_id = str(row['License #'])
        est_objects[license_id] = est_id
        
        state = str(row.get('State', 'IL'))
        if state == 'nan': state = 'IL'
        city = str(row.get('City', 'CHICAGO'))
        if city == 'nan': city = 'CHICAGO'
        
        db_ests.append(Establishment(
            id=est_id,
            tenant_id=LOCAL_TENANT_ID,
            license_id=license_id,
            name=str(row['DBA Name'])[:100],
            facility_type=parse_facility_type(row['Facility Type']),
            risk_category=parse_risk(row['Risk']),
            address=f"{row['Address']}, {city}, {state}",
            zip=str(row['Zip'])[:10] if not pd.isna(row['Zip']) else "",
            latitude=float(row['Latitude']),
            longitude=float(row['Longitude']),
            is_active=True
        ))
        
    # Chunk insert
    batch_size = 500
    for i in range(0, len(db_ests), batch_size):
        db.bulk_save_objects(db_ests[i:i + batch_size])
    db.commit()

    # Create Inspections
    db_inspections = []
    import random
    
    for _, row in df_inspections.iterrows():
        outcome = parse_result(row['Results'])
        if not outcome:
            continue
            
        license_id = str(row['License #'])
        est_id = est_objects.get(license_id)
        if not est_id: continue
        
        crit_vios, notes = parse_violations(row['Violations'])
        
        db_inspections.append(InspectionResult(
            tenant_id=LOCAL_TENANT_ID,
            establishment_id=est_id,
            inspector_id=random.choice(MOCK_INSPECTOR_IDS),
            inspection_date=row['Inspection Date'].date(),
            inspection_type=parse_inspection_type(row['Inspection Type']),
            result=outcome,
            critical_violations=crit_vios,
            notes=notes,
            processed_for_ml=True
        ))
        
    for i in range(0, len(db_inspections), batch_size):
        db.bulk_save_objects(db_inspections[i:i + batch_size])
    db.commit()
    
    print("✅ Seed complete!")
    print(f"Total active establishments: {len(db_ests)}")
    print(f"Total historical inspections: {len(db_inspections)}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed real Chicago database")
    parser.add_argument("--limit", type=int, default=1500, help="Number of establishments to seed")
    args = parser.parse_args()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_chicago_data(db, limit=args.limit)
    finally:
        db.close()
