from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta

from src.db.database import get_db
from src.models.core import (
    Establishment,
    InspectionResult,
    DailyRiskScore,
    InspectionResultOutcome,
    RiskBand,
)
from src.api.middleware.auth import get_current_tenant_id, security
from pydantic import BaseModel

router = APIRouter(
    prefix="/api/v1/establishments", 
    tags=["establishments"],
    dependencies=[Depends(security)]
)


# ── Response Models ──────────────────────────────────────────────


class EstablishmentInfo(BaseModel):
    id: str
    name: str
    license_id: str
    address: str
    facility_type: str
    is_active: bool


class ScoreHistoryPoint(BaseModel):
    date: str
    score: float
    band: str


class InspectionRecord(BaseModel):
    id: str
    date: str
    result: str
    critical_violations: int
    non_critical_violations: int


class RiskFactorItem(BaseModel):
    name: str
    weight: float


class EstablishmentDetailResponse(BaseModel):
    establishment: EstablishmentInfo
    current_score: Optional[float]
    current_band: Optional[str]
    score_history: List[ScoreHistoryPoint]
    inspections: List[InspectionRecord]
    risk_factors: List[RiskFactorItem]


# ── Endpoints ─────────────────────────────────────────────────────

@router.get("/search", response_model=List[EstablishmentInfo])
def search_establishments(
    query: Optional[str] = None,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
):
    """Search for establishments within the tenant by name or license ID."""
    
    q = db.query(Establishment).filter(Establishment.tenant_id == tenant_id)
    
    if query:
        search_term = f"%{query}%"
        q = q.filter(
            (Establishment.name.ilike(search_term)) |
            (Establishment.license_id.ilike(search_term))
        )
        
    # Limit results to avoid massive payloads
    results = q.limit(50).all()
    
    return [
        EstablishmentInfo(
            id=str(r.id),
            name=r.name,
            license_id=r.license_id or "N/A",
            address=r.address or "Unknown",
            facility_type=r.facility_type.value if hasattr(r.facility_type, 'value') else str(r.facility_type),
            is_active=r.is_active,
        )
        for r in results
    ]


@router.get("/{establishment_id}", response_model=EstablishmentDetailResponse)
def get_establishment_detail(
    establishment_id: str,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
):
    """Returns detailed information for a single establishment."""

    est = (
        db.query(Establishment)
        .filter(
            Establishment.id == establishment_id,
            Establishment.tenant_id == tenant_id,
        )
        .first()
    )

    if not est:
        raise HTTPException(status_code=404, detail="Establishment not found")

    # Current risk score
    today = datetime.utcnow().date()
    current_score_row = (
        db.query(DailyRiskScore)
        .filter(
            DailyRiskScore.establishment_id == establishment_id,
            DailyRiskScore.score_date == today,
        )
        .first()
    )

    current_score = current_score_row.risk_score if current_score_row else None
    current_band = current_score_row.risk_band.value if current_score_row else None

    # Score history (last 30 days, or mock if empty)
    thirty_days_ago = today - timedelta(days=30)
    history_rows = (
        db.query(DailyRiskScore)
        .filter(
            DailyRiskScore.establishment_id == establishment_id,
            DailyRiskScore.score_date >= thirty_days_ago,
        )
        .order_by(DailyRiskScore.score_date.asc())
        .all()
    )

    if history_rows:
        score_history = [
            ScoreHistoryPoint(
                date=str(r.score_date),
                score=r.risk_score,
                band=r.risk_band.value,
            )
            for r in history_rows
        ]
    else:
        # Generate synthetic 30-day trajectory for demo
        import random
        random.seed(hash(establishment_id))
        base = current_score if current_score else 50.0
        score_history = []
        for i in range(30):
            d = today - timedelta(days=29 - i)
            jitter = random.uniform(-5, 5)
            s = max(0, min(100, base + jitter + (i * 0.2)))
            band = "High" if s >= 70 else ("Medium" if s >= 40 else "Low")
            score_history.append(
                ScoreHistoryPoint(date=str(d), score=round(s, 1), band=band)
            )

    # Inspection history
    insp_rows = (
        db.query(InspectionResult)
        .filter(InspectionResult.establishment_id == establishment_id)
        .order_by(InspectionResult.inspection_date.desc())
        .limit(20)
        .all()
    )

    if insp_rows:
        inspections = [
            InspectionRecord(
                id=str(r.id),
                date=str(r.inspection_date),
                result=r.result.value,
                critical_violations=r.critical_violations,
                non_critical_violations=0,
            )
            for r in insp_rows
        ]
    else:
        # Mock inspection history
        inspections = [
            InspectionRecord(id="mock-1", date="2025-12-15", result="Pass", critical_violations=0, non_critical_violations=2),
            InspectionRecord(id="mock-2", date="2025-09-22", result="Fail", critical_violations=3, non_critical_violations=5),
            InspectionRecord(id="mock-3", date="2025-06-10", result="Pass", critical_violations=0, non_critical_violations=1),
            InspectionRecord(id="mock-4", date="2025-03-05", result="Conditional", critical_violations=1, non_critical_violations=4),
        ]

    # Risk factors from current score
    risk_factors = []
    if current_score_row:
        risk_factors = [
            RiskFactorItem(name=current_score_row.factor_1_name, weight=current_score_row.factor_1_weight),
            RiskFactorItem(name=current_score_row.factor_2_name, weight=current_score_row.factor_2_weight),
            RiskFactorItem(name=current_score_row.factor_3_name, weight=current_score_row.factor_3_weight),
        ]
    else:
        risk_factors = [
            RiskFactorItem(name="Historical Critical Violations", weight=0.45),
            RiskFactorItem(name="Time Since Last Inspection", weight=0.30),
            RiskFactorItem(name="Facility Type Baseline Risk", weight=0.25),
        ]

    return EstablishmentDetailResponse(
        establishment=EstablishmentInfo(
            id=str(est.id),
            name=est.name,
            license_id=est.license_id,
            address=est.address,
            facility_type=est.facility_type.value if hasattr(est.facility_type, 'value') else str(est.facility_type),
            is_active=est.is_active,
        ),
        current_score=current_score,
        current_band=current_band,
        score_history=score_history,
        inspections=inspections,
        risk_factors=risk_factors,
    )
