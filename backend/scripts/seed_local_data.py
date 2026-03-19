"""
Production-Scale Local Data Seeder for RestaurantRisk Intelligence Platform.

Generates ~1,500 establishments, ~8,000 inspections over 12 months,
and 30 days of daily ML risk scores with realistic Chicago-area data.

Usage:
    python scripts/seed_local_data.py          # Full ~1,500 establishment seed
    python scripts/seed_local_data.py --small   # Quick 50-establishment seed for CI
"""

import uuid
import random
import argparse
from datetime import datetime, timedelta
import sys
import os

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
    RiskBand,
)

# ── Constants ────────────────────────────────────────────────────────────────

LOCAL_TENANT_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")

MOCK_INSPECTOR_IDS = [uuid.UUID(f"22222222-2222-2222-2222-{str(i).zfill(12)}") for i in range(1, 11)]

random.seed(42)  # Reproducible data

# ── Realistic Name Pools ─────────────────────────────────────────────────────

RESTAURANT_PREFIXES = [
    "Golden", "Royal", "Blue", "Red", "Silver", "Green", "Lucky", "Happy",
    "Star", "Grand", "Old", "New", "Big", "Little", "Sweet", "Spicy",
    "Crispy", "Fresh", "Oak", "Maple", "Cedar", "Harbor", "Sunset", "River",
    "Lake", "Prairie", "Urban", "Classic", "Modern", "Vintage",
]

RESTAURANT_SUFFIXES = [
    "Kitchen", "Grill", "Diner", "Bistro", "Cafe", "Restaurant", "Eatery",
    "Tavern", "Pub", "Bar & Grill", "Steakhouse", "Pizzeria", "Taqueria",
    "Sushi Bar", "Noodle House", "BBQ", "Seafood", "Bakery", "Deli",
    "Cantina", "Trattoria", "Brasserie", "Smokehouse", "Creamery",
    "Wings", "Burger Joint", "Pho House", "Ramen Shop", "Fish & Chips",
    "Pancake House",
]

GROCERY_NAMES = [
    "Fresh Market", "City Grocery", "Corner Store", "Food Mart", "Super Foods",
    "Daily Essentials", "Farm Fresh", "Green Basket", "Quick Stop", "Value Mart",
    "Neighborhood Market", "Express Grocery", "Community Foods", "Metro Market",
    "Harvest Foods", "Prime Provisions", "Local Pantry", "Urban Harvest",
    "Family Foods", "Budget Basket",
]

MOBILE_FOOD_NAMES = [
    "Rolling Tacos", "Street Eats", "Wheel Meals", "Roaming Kitchen",
    "Curbside Bites", "Mobile Munchies", "Food Truck Fiesta", "On The Go Eats",
    "Wandering Chef", "Pop-Up Plates", "Drive & Dine", "Nomad Noodles",
    "Cruising Cuisine", "Pavement Plates", "Quick Bites Mobile",
]

OWNER_FIRST_NAMES = [
    "James", "Maria", "Wei", "Alejandro", "Priya", "Mohammed", "Sarah", "Dmitri",
    "Yuki", "Carlos", "Fatima", "Patrick", "Aisha", "Giovanni", "Min-Ji",
    "Roberto", "Olga", "Kwame", "Ingrid", "Hassan", "Elena", "Raj", "Lucia",
    "Andrei", "Mei-Lin", "Jorge", "Amara", "Stefan", "Soo-Yeon", "Pierre",
]

OWNER_LAST_NAMES = [
    "Chen", "Rodriguez", "Patel", "Kim", "Nguyen", "Martinez", "O'Brien",
    "Kowalski", "Yamamoto", "Singh", "Johnson", "Garcia", "Williams", "Brown",
    "Jones", "Davis", "Sullivan", "Petrov", "Okafor", "Schmidt", "Rossi",
    "Larsson", "Nakamura", "Lopez", "Andersen", "Muller", "Park", "Ali",
    "Fernandez", "Ivanov",
]

CHICAGO_STREETS = [
    "Michigan Ave", "State St", "Clark St", "Halsted St", "Ashland Ave",
    "Western Ave", "Pulaski Rd", "Cicero Ave", "Central Ave", "Harlem Ave",
    "Broadway", "Lincoln Ave", "Milwaukee Ave", "Archer Ave", "Cermak Rd",
    "Roosevelt Rd", "Madison St", "Division St", "North Ave", "Fullerton Ave",
    "Belmont Ave", "Irving Park Rd", "Montrose Ave", "Lawrence Ave",
    "Devon Ave", "Howard St", "Touhy Ave", "Peterson Ave", "Foster Ave",
    "Addison St", "Diversey Ave", "Armitage Ave", "18th St", "26th St",
    "31st St", "35th St", "43rd St", "47th St", "51st St", "55th St",
    "63rd St", "67th St", "71st St", "75th St", "79th St", "83rd St",
    "87th St", "95th St", "103rd St", "111th St",
]

CHICAGO_NEIGHBORHOODS = [
    "Loop", "River North", "Lincoln Park", "Lakeview", "Wicker Park",
    "Logan Square", "Pilsen", "Bridgeport", "Hyde Park", "Rogers Park",
    "Uptown", "Edgewater", "Andersonville", "Albany Park", "Irving Park",
    "Avondale", "Humboldt Park", "Little Village", "Back of the Yards",
    "Chinatown", "Bronzeville", "South Shore", "Austin", "Garfield Park",
    "Englewood", "Chatham", "Beverly", "Mount Greenwood", "Edison Park",
    "Portage Park",
]

CHICAGO_ZIPS = [
    "60601", "60602", "60603", "60604", "60605", "60606", "60607", "60608",
    "60609", "60610", "60611", "60612", "60613", "60614", "60615", "60616",
    "60617", "60618", "60619", "60620", "60621", "60622", "60623", "60624",
    "60625", "60626", "60628", "60629", "60630", "60631", "60632", "60634",
    "60636", "60637", "60638", "60639", "60640", "60641", "60642", "60643",
    "60644", "60645", "60646", "60647", "60649", "60651", "60652", "60653",
    "60654", "60655", "60656", "60657", "60659", "60660", "60661",
]

RISK_FACTOR_NAMES = [
    "Historical Critical Violations",
    "Time Since Last Inspection",
    "Facility Type Baseline Risk",
    "Sanitation Complaints (Last 6 Mo)",
    "Neighborhood Violation Density",
    "Seasonal Risk Pattern",
    "Previous Fail Rate",
    "License Age (Newer = Higher Risk)",
    "Food Handler Certification Gaps",
    "Prior Rodent/Pest Reports",
    "Temperature Abuse History",
    "Water Supply Violations",
]

INSPECTOR_NOTES_PASS = [
    "All areas clean and up to code.",
    "Minor recommendations for improved labeling. Overall compliant.",
    "Facility well-maintained. Staff knowledgeable on food safety protocols.",
    "Good temperature control. All food stored properly.",
    "Clean kitchen, proper handwashing stations, labeled chemicals.",
    "No issues found. Establishment in full compliance.",
    "Food rotation practices excellent. Clean prep surfaces.",
    "Walk-in cooler at proper temp. Good date labeling throughout.",
]

INSPECTOR_NOTES_FAIL = [
    "Critical: Cross-contamination risk — raw poultry stored above ready-to-eat items.",
    "Temperature abuse in walk-in cooler (measured 52°F, limit 41°F).",
    "No certified food handler on premises during inspection.",
    "Evidence of rodent activity near food prep area. Droppings found under sink.",
    "Improper chemical storage — cleaning agents stored near food items.",
    "Hand wash station not functioning in kitchen. Soap dispenser empty.",
    "Multiple food items past expiration dates found in dry storage.",
    "Grease trap overflow. Floors unsanitary in kitchen area.",
    "Raw meat stored improperly. No separation between raw and cooked items.",
    "Hood ventilation system not operational. Grease buildup on filters.",
]

INSPECTOR_NOTES_CONDITIONS = [
    "Minor issues: Missing thermometer in cold hold unit. Corrected on-site.",
    "Some labeling issues in dry storage. Manager agreed to correct within 24 hours.",
    "Floor drain needs repair. No immediate food safety risk. Must fix within 30 days.",
    "One expired item found. Removed immediately. Otherwise compliant.",
    "Employee observed not wearing hair net. Corrected during inspection.",
]


# ── Generators ───────────────────────────────────────────────────────────────

def generate_establishment_name(facility_type: FacilityType, idx: int) -> str:
    if facility_type == FacilityType.RESTAURANT:
        prefix = random.choice(RESTAURANT_PREFIXES)
        suffix = random.choice(RESTAURANT_SUFFIXES)
        # Add occasional possessive name for variety
        if random.random() < 0.3:
            owner = random.choice(OWNER_FIRST_NAMES)
            return f"{owner}'s {suffix}"
        return f"{prefix} {suffix}"
    elif facility_type == FacilityType.GROCERY:
        base = random.choice(GROCERY_NAMES)
        if random.random() < 0.4:
            hood = random.choice(CHICAGO_NEIGHBORHOODS)
            return f"{hood} {base}"
        return base
    else:  # MOBILE
        return random.choice(MOBILE_FOOD_NAMES) + (f" #{idx % 10 + 1}" if random.random() < 0.3 else "")


def generate_address() -> tuple:
    num = random.randint(100, 12000)
    direction = random.choice(["N", "S", "E", "W"])
    street = random.choice(CHICAGO_STREETS)
    zipcode = random.choice(CHICAGO_ZIPS)
    # Chicago metro lat/lng bounding box
    lat = round(random.uniform(41.65, 42.02), 6)
    lng = round(random.uniform(-87.85, -87.52), 6)
    return f"{num} {direction} {street}, Chicago, IL {zipcode}", zipcode, lat, lng


def assign_risk_category(facility_type: FacilityType) -> RiskCategory:
    """Restaurants tend to be higher risk due to hot food prep."""
    if facility_type == FacilityType.RESTAURANT:
        return random.choices(
            [RiskCategory.HIGH, RiskCategory.MEDIUM, RiskCategory.LOW],
            weights=[0.35, 0.45, 0.20],
        )[0]
    elif facility_type == FacilityType.GROCERY:
        return random.choices(
            [RiskCategory.HIGH, RiskCategory.MEDIUM, RiskCategory.LOW],
            weights=[0.15, 0.45, 0.40],
        )[0]
    else:
        return random.choices(
            [RiskCategory.HIGH, RiskCategory.MEDIUM, RiskCategory.LOW],
            weights=[0.25, 0.50, 0.25],
        )[0]


def generate_risk_score(risk_category: RiskCategory) -> tuple:
    """Generate score aligned with the establishment's static risk category."""
    if risk_category == RiskCategory.HIGH:
        score = round(random.uniform(55, 98), 1)
    elif risk_category == RiskCategory.MEDIUM:
        score = round(random.uniform(30, 70), 1)
    else:
        score = round(random.uniform(5, 45), 1)

    # Add some randomness so high-category can occasionally score low
    score = max(1.0, min(99.9, score + random.gauss(0, 8)))
    score = round(score, 1)

    if score >= 70:
        band = RiskBand.HIGH
    elif score >= 35:
        band = RiskBand.MEDIUM
    else:
        band = RiskBand.LOW

    return score, band


def generate_captum_factors() -> dict:
    """Generate 3 explainability factors with weights summing to 1.0."""
    factors = random.sample(RISK_FACTOR_NAMES, 3)
    # Generate weights that sum to 1.0
    raw = [random.uniform(0.15, 0.60) for _ in range(3)]
    total = sum(raw)
    weights = [round(w / total, 2) for w in raw]
    # Fix rounding error on last weight
    weights[2] = round(1.0 - weights[0] - weights[1], 2)

    return {
        "factor_1_name": factors[0], "factor_1_weight": weights[0],
        "factor_2_name": factors[1], "factor_2_weight": weights[1],
        "factor_3_name": factors[2], "factor_3_weight": weights[2],
    }


# ── Main Seeder ──────────────────────────────────────────────────────────────

def seed_data(db: Session, num_establishments: int = 1500):
    today = datetime.utcnow().date()

    print(f"🏗️  Seeding {num_establishments} establishments (Chicago metro)...")

    # ── 1. Establishments ────────────────────────────────────────────

    facility_weights = [0.70, 0.20, 0.10]  # Restaurant, Grocery, Mobile
    facility_types = [FacilityType.RESTAURANT, FacilityType.GROCERY, FacilityType.MOBILE]

    used_names = set()
    establishments = []

    for i in range(num_establishments):
        ftype = random.choices(facility_types, weights=facility_weights)[0]
        
        # Ensure unique names
        name = generate_establishment_name(ftype, i)
        attempt = 0
        while name in used_names and attempt < 20:
            name = generate_establishment_name(ftype, i + random.randint(100, 9999))
            attempt += 1
        if name in used_names:
            name = f"{name} - {random.choice(CHICAGO_NEIGHBORHOODS)}"
        used_names.add(name)

        address, zipcode, lat, lng = generate_address()
        risk_cat = assign_risk_category(ftype)
        is_active = random.random() > 0.10  # ~90% active

        est = Establishment(
            id=uuid.uuid4(),
            tenant_id=LOCAL_TENANT_ID,
            license_id=f"LIC-{100000 + i}",
            name=name,
            facility_type=ftype,
            risk_category=risk_cat,
            address=address,
            zip=zipcode,
            latitude=lat,
            longitude=lng,
            is_active=is_active,
        )
        establishments.append(est)

    db.bulk_save_objects(establishments)
    db.commit()

    # Re-query to get IDs (bulk_save doesn't populate them)
    establishments = db.query(Establishment).filter(
        Establishment.tenant_id == LOCAL_TENANT_ID
    ).all()
    active_establishments = [e for e in establishments if e.is_active]

    active_count = len(active_establishments)
    inactive_count = len(establishments) - active_count
    print(f"   ✅ {active_count} active, {inactive_count} inactive")

    # ── 2. Historical Inspections (12 months) ────────────────────────

    print(f"📋 Generating ~12 months of inspection history...")

    inspections = []
    twelve_months_ago = today - timedelta(days=365)

    outcome_weights = [0.55, 0.15, 0.25, 0.05]
    outcomes = [
        InspectionResultOutcome.PASS,
        InspectionResultOutcome.PASS_CONDITIONS,
        InspectionResultOutcome.FAIL,
        InspectionResultOutcome.OUT_OF_BUSINESS,
    ]
    inspection_types = [InspectionType.CANVAS, InspectionType.COMPLAINT, InspectionType.RE_INSPECTION]
    itype_weights = [0.60, 0.25, 0.15]

    for est in active_establishments:
        # Each active establishment gets 1-6 inspections over the year
        num_inspections = random.choices([1, 2, 3, 4, 5, 6], weights=[0.10, 0.25, 0.30, 0.20, 0.10, 0.05])[0]

        for _ in range(num_inspections):
            days_ago = random.randint(1, 365)
            insp_date = today - timedelta(days=days_ago)

            result = random.choices(outcomes, weights=outcome_weights)[0]
            itype = random.choices(inspection_types, weights=itype_weights)[0]

            if result == InspectionResultOutcome.FAIL:
                violations = random.randint(1, 5)
                notes = random.choice(INSPECTOR_NOTES_FAIL)
            elif result == InspectionResultOutcome.PASS_CONDITIONS:
                violations = random.randint(0, 1)
                notes = random.choice(INSPECTOR_NOTES_CONDITIONS)
            elif result == InspectionResultOutcome.OUT_OF_BUSINESS:
                violations = 0
                notes = "Establishment found closed/out of business during visit."
            else:
                violations = 0
                notes = random.choice(INSPECTOR_NOTES_PASS)

            inspections.append(InspectionResult(
                tenant_id=LOCAL_TENANT_ID,
                establishment_id=est.id,
                inspector_id=random.choice(MOCK_INSPECTOR_IDS),
                inspection_date=insp_date,
                inspection_type=itype,
                result=result,
                critical_violations=violations,
                notes=notes,
                processed_for_ml=True,
            ))

    db.bulk_save_objects(inspections)
    db.commit()
    print(f"   ✅ {len(inspections)} inspection records created")

    # ── 3. Daily Risk Scores (last 30 days) ──────────────────────────

    print(f"🤖 Generating 30 days of ML risk scores...")

    risk_scores = []
    score_days = 30

    for day_offset in range(score_days):
        score_date = today - timedelta(days=day_offset)

        for est in active_establishments:
            score, band = generate_risk_score(est.risk_category)
            factors = generate_captum_factors()

            risk_scores.append(DailyRiskScore(
                tenant_id=LOCAL_TENANT_ID,
                establishment_id=est.id,
                score_date=score_date,
                risk_score=score,
                risk_band=band,
                **factors,
            ))

    # Batch insert for performance
    batch_size = 5000
    for i in range(0, len(risk_scores), batch_size):
        batch = risk_scores[i:i + batch_size]
        db.bulk_save_objects(batch)
        db.commit()
        print(f"   ... inserted {min(i + batch_size, len(risk_scores)):,}/{len(risk_scores):,} risk scores")

    print(f"   ✅ {len(risk_scores):,} risk score records created")

    # ── Summary ──────────────────────────────────────────────────────

    print(f"\n{'='*60}")
    print(f"🎉 Seed Complete!")
    print(f"{'='*60}")
    print(f"   Establishments:  {len(establishments):,} ({active_count:,} active)")
    print(f"   Inspections:     {len(inspections):,}")
    print(f"   Risk Scores:     {len(risk_scores):,} ({score_days} days × {active_count:,} establishments)")
    print(f"   Tenant ID:       {LOCAL_TENANT_ID}")
    print(f"   Score Date Range: {today - timedelta(days=score_days-1)} → {today}")
    print(f"{'='*60}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed local development database")
    parser.add_argument("--small", action="store_true", help="Quick seed with 50 establishments")
    args = parser.parse_args()

    num = 50 if args.small else 1500

    # Create tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Clear existing data (idempotent)
    print("🗑️  Clearing existing data...")
    db.query(DailyRiskScore).filter(DailyRiskScore.tenant_id == LOCAL_TENANT_ID).delete()
    db.query(InspectionResult).filter(InspectionResult.tenant_id == LOCAL_TENANT_ID).delete()
    db.query(Establishment).filter(Establishment.tenant_id == LOCAL_TENANT_ID).delete()
    db.commit()
    print("   ✅ Existing data cleared")

    seed_data(db, num_establishments=num)
    db.close()
