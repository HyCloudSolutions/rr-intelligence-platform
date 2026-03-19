import pandas as pd
import sys
import uuid
from typing import List
from datetime import datetime

# Adjust path to enable src imports if run standalone
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.db.database import SessionLocal
from src.models.core import Establishment, FacilityType, RiskCategory


# Assuming standard municipal CSV structure
# LICENSE_ID, NAME, ADDRESS, ZIP, FACILITY_TYPE, BASELINE_RISK
def parse_and_ingest_facilities(csv_path: str, tenant_id: str):
    print(f"Ingesting facilities from {csv_path} for Tenant: {tenant_id}")

    try:
        df = pd.read_csv(csv_path)
    except Exception as e:
        print(f"Failed to read CSV: {str(e)}")
        sys.exit(1)

    db = SessionLocal()
    tenant_uuid = uuid.UUID(tenant_id)

    new_records = 0
    updated_records = 0
    errors = 0

    for index, row in df.iterrows():
        try:
            lic_id = str(row.get("LICENSE_ID", "")).strip()
            if not lic_id:
                continue  # Skip rows without primary license key

            # Basic mapping
            fac_type_str = str(row.get("FACILITY_TYPE", "Restaurant"))
            fac_type_enum = FacilityType.RESTAURANT
            if "Grocery" in fac_type_str:
                fac_type_enum = FacilityType.GROCERY
            elif "Mobile" in fac_type_str:
                fac_type_enum = FacilityType.MOBILE

            risk_str = str(row.get("BASELINE_RISK", "Medium"))
            risk_enum = RiskCategory.MEDIUM
            if "High" in risk_str:
                risk_enum = RiskCategory.HIGH
            elif "Low" in risk_str:
                risk_enum = RiskCategory.LOW

            # Check existence
            existing = (
                db.query(Establishment)
                .filter(
                    Establishment.tenant_id == tenant_uuid,
                    Establishment.license_id == lic_id,
                )
                .first()
            )

            if existing:
                existing.name = str(row.get("NAME", existing.name))
                existing.address = str(row.get("ADDRESS", existing.address))
                existing.zip = str(row.get("ZIP", existing.zip))
                existing.facility_type = fac_type_enum
                existing.risk_category = risk_enum
                existing.updated_at = datetime.utcnow()
                updated_records += 1
            else:
                new_est = Establishment(
                    tenant_id=tenant_uuid,
                    license_id=lic_id,
                    name=str(row.get("NAME", "Unknown Node")),
                    address=str(row.get("ADDRESS", "Unknown Address")),
                    zip=str(row.get("ZIP", "")),
                    facility_type=fac_type_enum,
                    risk_category=risk_enum,
                )
                db.add(new_est)
                new_records += 1

        except Exception as row_error:
            print(f"Row {index} failed: {str(row_error)}")
            errors += 1

    try:
        db.commit()
        print(
            f"Ingestion Complete. Inserted: {new_records}, Updated: {updated_records}, Errors: {errors}"
        )

    except Exception as e:
        print(f"Ingestion transaction failed: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ingest_csv.py <path_to_csv> [tenant_id]")
        sys.exit(1)

    csv_file = sys.argv[1]
    # Default to our local mock tenant if none provided
    target_tenant = (
        sys.argv[2] if len(sys.argv) > 2 else "11111111-1111-1111-1111-111111111111"
    )

    parse_and_ingest_facilities(csv_file, target_tenant)
