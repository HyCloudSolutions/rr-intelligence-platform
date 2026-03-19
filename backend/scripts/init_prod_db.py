import sys
import os
import uuid
from datetime import datetime

# Add app to path
sys.path.append(os.getcwd())

from src.db.database import engine, SessionLocal
from src.models.core import Base, Tenant, Establishment, FacilityType, RiskCategory

def init_prod_db():
    print("🚀 Starting Production Database Initialization...")
    
    # 1. Create Tables
    print("📦 Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tables created.")
    
    db = SessionLocal()
    try:
        # 2. Seed Tenants
        tenants_to_seed = [
            {"id": "11111111-1111-1111-1111-111111111111", "name": "City of Chicago", "email": "admin@chicago.gov"},
            {"id": "d9bfd712-e53b-4de4-89d2-d762b49ae507", "name": "City of Seattle", "email": "admin@seattle.gov"}
        ]
        
        for t_data in tenants_to_seed:
            t_id = uuid.UUID(t_data["id"])
            existing = db.query(Tenant).filter(Tenant.id == t_id).first()
            if not existing:
                print(f"🌱 Seeding tenant: {t_data['name']}")
                new_t = Tenant(
                    id=t_id,
                    name=t_data["name"],
                    contact_email=t_data["email"],
                    tier="Enterprise"
                )
                db.add(new_t)
            else:
                print(f"⏭️ Tenant {t_data['name']} already exists.")
        
        db.commit()
        print("✅ Seeding complete.")
        
    except Exception as e:
        print(f"❌ Error during initialization: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_prod_db()
