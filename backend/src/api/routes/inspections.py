from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
import logging

from src.db.database import get_db
from src.models.core import InspectionResult, Establishment, InspectionResultOutcome, InspectionType
from src.api.middleware.auth import get_current_tenant_id, get_current_user_role, security

router = APIRouter(
    prefix="/api/v1/inspections",
    tags=["inspections"],
    dependencies=[Depends(security)]
)

class InspectionOutcomeSubmit(BaseModel):
    establishment_id: str
    result: str  # e.g., "Pass", "Fail", "Conditional Pass"
    critical_violations: int
    notes: str = ""

@router.post("/")
def log_inspection_outcome(
    payload: InspectionOutcomeSubmit,
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    role: str = Depends(get_current_user_role),
):
    """
    Log a new inspection outcome from the inspector queue.
    """
    # 1. Authorize: Only inspectors and directors can log outcomes
    if role not in ["inspector", "director"]:
        raise HTTPException(status_code=403, detail="Not authorized to log inspections.")

    # 2. Validate establishment exists and belongs to tenant
    est = db.query(Establishment).filter(
        Establishment.id == payload.establishment_id,
        Establishment.tenant_id == tenant_id
    ).first()

    if not est:
        raise HTTPException(status_code=404, detail="Establishment not found.")

    # 3. Map string result to enum
    try:
        outcome_enum = InspectionResultOutcome(payload.result)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid outcome result: {payload.result}")

    # 4. Create new InspectionResult record
    # Note: Using a fixed UUID for inspector_id since we don't have user UUIDs in the mock JWT yet
    default_inspector_id = "00000000-0000-0000-0000-000000000001"
    
    new_inspection = InspectionResult(
        tenant_id=tenant_id,
        establishment_id=est.id,
        inspector_id=default_inspector_id,
        inspection_date=datetime.utcnow().date(),
        inspection_type=InspectionType.CANVAS,  # Defaulting to Canvas (routine) for MVP
        result=outcome_enum,
        critical_violations=payload.critical_violations,
        # notes field doesn't exist on the core model in this MVP, so we drop it here 
        # but keep it in the API for future expansion
    )

    db.add(new_inspection)
    db.commit()
    db.refresh(new_inspection)

    logging.info(f"Logged new inspection {new_inspection.id} for establishment {est.name}")

    # FUTURE: Trigger ML recalculation job here using Celery or background tasks

    return {
        "success": True,
        "inspection_id": str(new_inspection.id)
    }

class HistoryEstablishmentInfo(BaseModel):
    id: str
    name: str

class InspectionHistoryRecord(BaseModel):
    id: str
    establishment: HistoryEstablishmentInfo
    date: str
    result: str
    critical_violations: int

@router.get("/history")
def get_inspection_history(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    role: str = Depends(get_current_user_role),
):
    """
    Retrieve recently completed inspections for the current user.
    """
    if role not in ["inspector", "director"]:
        raise HTTPException(status_code=403, detail="Not authorized.")

    default_inspector_id = "00000000-0000-0000-0000-000000000001"
    import uuid
    tenant_uuid = uuid.UUID(tenant_id)
    inspector_uuid = uuid.UUID(default_inspector_id)

    # Join with Establishment to get the name
    history = (
        db.query(InspectionResult, Establishment)
        .join(Establishment, InspectionResult.establishment_id == Establishment.id)
        .filter(
            InspectionResult.tenant_id == tenant_uuid,
            InspectionResult.inspector_id == inspector_uuid
        )
        .order_by(InspectionResult.inspection_date.desc(), InspectionResult.created_at.desc())
        .limit(20)
        .all()
    )

    return {
        "inspections": [
            InspectionHistoryRecord(
                id=str(insp.id),
                establishment=HistoryEstablishmentInfo(id=str(est.id), name=est.name),
                date=str(insp.inspection_date),
                result=insp.result.value if hasattr(insp.result, 'value') else str(insp.result),
                critical_violations=insp.critical_violations
            )
            for insp, est in history
        ]
    }
