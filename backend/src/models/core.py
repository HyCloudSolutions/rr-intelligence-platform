from sqlalchemy import (
    Column,
    String,
    Float,
    Boolean,
    Integer,
    DateTime,
    Date,
    ForeignKey,
    Enum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum
from datetime import datetime

from src.db.database import Base


class FacilityType(enum.Enum):
    RESTAURANT = "Restaurant"
    GROCERY = "Grocery Store"
    MOBILE = "Mobile Food"


class RiskCategory(enum.Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class InspectionType(enum.Enum):
    CANVAS = "Canvas"
    COMPLAINT = "Complaint"
    RE_INSPECTION = "Re-inspection"


class InspectionResultOutcome(enum.Enum):
    PASS = "Pass"
    PASS_CONDITIONS = "Pass w/ Conditions"
    FAIL = "Fail"
    OUT_OF_BUSINESS = "Out of Business"


class RiskBand(enum.Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class Tenant(Base):
    """The root aggregate entity representing a subscribed municipality."""
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)
    contact_email = Column(String, nullable=False)
    tier = Column(String, default="Standard")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Establishment(Base):
    __tablename__ = "establishments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(
        UUID(as_uuid=True), nullable=False, index=True
    )  # Strict isolation
    license_id = Column(String, index=True)
    name = Column(String, nullable=False)
    facility_type = Column(Enum(FacilityType), nullable=False)
    risk_category = Column(Enum(RiskCategory), nullable=False)
    address = Column(String, nullable=False)
    zip = Column(String, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

    inspections = relationship("InspectionResult", back_populates="establishment")
    risk_scores = relationship("DailyRiskScore", back_populates="establishment")


class InspectionResult(Base):
    __tablename__ = "inspection_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    establishment_id = Column(
        UUID(as_uuid=True), ForeignKey("establishments.id"), index=True
    )
    inspector_id = Column(UUID(as_uuid=True), nullable=False)
    inspection_date = Column(Date, nullable=False, index=True)
    inspection_type = Column(Enum(InspectionType), nullable=False)
    result = Column(Enum(InspectionResultOutcome), nullable=False)
    critical_violations = Column(Integer, default=0)
    notes = Column(String, nullable=True)
    processed_for_ml = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    establishment = relationship("Establishment", back_populates="inspections")


class DailyRiskScore(Base):
    __tablename__ = "daily_risk_scores"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    establishment_id = Column(
        UUID(as_uuid=True), ForeignKey("establishments.id"), index=True
    )
    score_date = Column(Date, nullable=False, index=True)
    risk_score = Column(Float, nullable=False)
    risk_band = Column(Enum(RiskBand), nullable=False)
    factor_1_name = Column(String, nullable=False)
    factor_1_weight = Column(Float, nullable=False)
    factor_2_name = Column(String, nullable=False)
    factor_2_weight = Column(Float, nullable=False)
    factor_3_name = Column(String, nullable=False)
    factor_3_weight = Column(Float, nullable=False)

    establishment = relationship("Establishment", back_populates="risk_scores")
