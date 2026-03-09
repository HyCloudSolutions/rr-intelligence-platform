from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_, not_
from typing import List, Optional
from datetime import datetime, date

from src.db.database import get_db
from src.models.core import DailyRiskScore, Establishment, InspectionResult, RiskBand, FacilityType
from src.api.middleware.auth import get_current_tenant_id, get_current_user_role
from pydantic import BaseModel
from pydantic import Field

router = APIRouter(prefix="/api/v1/queue", tags=["queue"])


class RiskScoreResponse(BaseModel):
    id: str
    score_date: date
    risk_score: float
    risk_band: str
    factor_1_name: str
    factor_1_weight: float
    factor_2_name: str
    factor_2_weight: float
    factor_3_name: str
    factor_3_weight: float

    class Config:
        from_attributes = True


class EstablishmentQueueItem(BaseModel):
    id: str
    name: str
    license_id: str
    address: str
    facility_type: str
    risk_data: RiskScoreResponse
    assigned_inspector: Optional[str] = None

    class Config:
        from_attributes = True


@router.get("/daily", response_model=List[EstablishmentQueueItem])
def get_daily_queue(
    target_date: date = Query(default_factory=lambda: datetime.utcnow().date()),
    risk_band: Optional[str] = Query(default=None, description="Filter by risk band: High, Medium, Low"),
    facility_type: Optional[str] = Query(default=None, description="Filter by facility type: Restaurant, Grocery, Mobile"),
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    role: str = Depends(get_current_user_role),
):
    """
    Returns the prioritized daily inspection queue for the current tenant.
    Implements ML fallback (T011b) by retrieving yesterday's queue if today's is missing.
    Supports optional filtering by risk_band and facility_type.
    """
    if role not in ["inspector", "director"]:
        raise HTTPException(status_code=403, detail="Not authorized to view the queue.")

    # 1. Try fetching scores for the requested date (usually today)
    # Exclude establishments that already have an inspection for the target date
    inspected_subquery = (
        db.query(InspectionResult.establishment_id)
        .filter(
            InspectionResult.tenant_id == tenant_id,
            InspectionResult.inspection_date == target_date
        )
        .subquery()
    )

    base_filters = [
        DailyRiskScore.tenant_id == tenant_id,
        DailyRiskScore.score_date == target_date,
        Establishment.is_active == True,
        not_(Establishment.id.in_(inspected_subquery)),
    ]

    # Apply optional filters — convert strings to enum members for PostgreSQL
    risk_band_map = {"High": RiskBand.HIGH, "Medium": RiskBand.MEDIUM, "Low": RiskBand.LOW}
    facility_type_map = {
        "Restaurant": FacilityType.RESTAURANT,
        "Grocery": FacilityType.GROCERY,
        "Mobile": FacilityType.MOBILE,
    }

    risk_band_enum = risk_band_map.get(risk_band) if risk_band else None
    facility_type_enum = facility_type_map.get(facility_type) if facility_type else None

    if risk_band_enum:
        base_filters.append(DailyRiskScore.risk_band == risk_band_enum)
    if facility_type_enum:
        base_filters.append(Establishment.facility_type == facility_type_enum)

    scores = (
        db.query(DailyRiskScore)
        .join(Establishment)
        .filter(*base_filters)
        .order_by(desc(DailyRiskScore.risk_score))
        .all()
    )

    # 2. ML Fallback Logic (T011b) - If no scores today, fetch the most recent available scores
    if not scores:
        import logging

        logging.warning(
            f"No risk scores found for {target_date}. Falling back to most recent available."
        )

        # Find the most recent date we DO have scores for
        most_recent = (
            db.query(DailyRiskScore.score_date)
            .filter(DailyRiskScore.tenant_id == tenant_id)
            .order_by(desc(DailyRiskScore.score_date))
            .first()
        )

        if most_recent:
            fallback_date = most_recent[0]
            
            # Rebuild filters with fallback date
            fallback_filters = [
                DailyRiskScore.tenant_id == tenant_id,
                DailyRiskScore.score_date == fallback_date,
                Establishment.is_active == True,
                not_(Establishment.id.in_(inspected_subquery)),
            ]
            if risk_band_enum:
                fallback_filters.append(DailyRiskScore.risk_band == risk_band_enum)
            if facility_type_enum:
                fallback_filters.append(Establishment.facility_type == facility_type_enum)

            # Since we're using fallback scores, we still want to filter out 
            # establishments inspected *today* (target_date), not the fallback date
            scores = (
                db.query(DailyRiskScore)
                .join(Establishment)
                .filter(*fallback_filters)
                .order_by(desc(DailyRiskScore.risk_score))
                .all()
            )
        else:
            return []  # Empty queue if database is entirely devoid of scores

    # 3. Format response
    mock_inspectors = ["Sarah Chen", "Marcus Johnson", "Elena Rodriguez", "James Kim", "Priya Patel"]
    response = []
    for idx, score in enumerate(scores):
        response.append(
            EstablishmentQueueItem(
                id=str(score.establishment.id),
                name=score.establishment.name,
                license_id=score.establishment.license_id,
                address=score.establishment.address,
                facility_type=score.establishment.facility_type.value,
                assigned_inspector=mock_inspectors[idx % len(mock_inspectors)] if role == "director" else None,
                risk_data=RiskScoreResponse(
                    id=str(score.id),
                    score_date=score.score_date,
                    risk_score=score.risk_score,
                    risk_band=score.risk_band.value,
                    factor_1_name=score.factor_1_name,
                    factor_1_weight=score.factor_1_weight,
                    factor_2_name=score.factor_2_name,
                    factor_2_weight=score.factor_2_weight,
                    factor_3_name=score.factor_3_name,
                    factor_3_weight=score.factor_3_weight,
                ),
            )
        )

    return response
