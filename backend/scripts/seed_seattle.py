import uuid
from datetime import datetime, timedelta
import random
from src.db.database import SessionLocal
from src.models.core import Establishment, InspectionResult, FacilityType, RiskCategory, InspectionType, InspectionResultOutcome

def seed_seattle():
    db = SessionLocal()
    # Seattle Tenant ID
    seattle_id = uuid.UUID("d9bfd712-e53b-4de4-89d2-d762b49ae507")
    
    print(f"Seeding Seattle ({seattle_id})...")
    
    # Check if already seeded to avoid duplicates
    existing = db.query(Establishment).filter(Establishment.tenant_id == seattle_id).first()
    if existing:
        print("Seattle already has data. Skipping.")
        return

    establishments_data = [
        {"name": "Pike Place Chowder", "address": "1530 Post Alley", "zip": "98101", "type": FacilityType.RESTAURANT, "risk": RiskCategory.HIGH},
        {"name": "Space Needle Lounge", "address": "400 Broad St", "zip": "98109", "type": FacilityType.RESTAURANT, "risk": RiskCategory.MEDIUM},
        {"name": "Elliott's Oyster House", "address": "1201 Alaskan Way", "zip": "98101", "type": FacilityType.RESTAURANT, "risk": RiskCategory.HIGH},
        {"name": "Ballard Coffee Works", "address": "2060 NW Market St", "zip": "98107", "type": FacilityType.RESTAURANT, "risk": RiskCategory.LOW},
        {"name": "Uwajimaya Seattle", "address": "600 5th Ave S", "zip": "98104", "type": FacilityType.GROCERY, "risk": RiskCategory.MEDIUM},
        {"name": "Seattle Food Truck", "address": "901 5th Ave", "zip": "98164", "type": FacilityType.MOBILE, "risk": RiskCategory.LOW},
    ]

    for data in establishments_data:
        est = Establishment(
            id=uuid.uuid4(),
            tenant_id=seattle_id,
            name=data["name"],
            address=data["address"],
            zip=data["zip"],
            facility_type=data["type"],
            risk_category=data["risk"],
            is_active=True,
            updated_at=datetime.utcnow()
        )
        db.add(est)
        db.flush() # Get ID for inspections
        
        # Add 2-4 inspections for each
        num_inspections = random.randint(2, 4)
        for i in range(num_inspections):
            is_recent = i == 0
            days_ago = random.randint(1, 30) if is_recent else random.randint(60, 365)
            
            outcome = random.choice([InspectionResultOutcome.PASS, InspectionResultOutcome.PASS_CONDITIONS])
            # Give one fail if it's the high risk one
            if data["risk"] == RiskCategory.HIGH and i == 1:
                outcome = InspectionResultOutcome.FAIL

            insp = InspectionResult(
                id=uuid.uuid4(),
                tenant_id=seattle_id,
                establishment_id=est.id,
                inspector_id=uuid.uuid4(), # Mock inspector
                inspection_date=(datetime.now() - timedelta(days=days_ago)).date(),
                inspection_type=random.choice(list(InspectionType)),
                result=outcome,
                critical_violations=random.randint(0, 3) if outcome != InspectionResultOutcome.FAIL else random.randint(4, 8),
                notes="Standard compliance audit performed.",
                processed_for_ml=True
            )
            db.add(insp)

    db.commit()
    print("Successfully seeded Seattle Establishments and Inspections.")
    db.close()

if __name__ == "__main__":
    seed_seattle()
