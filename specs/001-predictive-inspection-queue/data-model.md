# Data Model & Contracts: 001-predictive-inspection-queue

**Phase**: 1
**Date**: 2026-03-05
**Feature**: [spec.md](../../specs/001-predictive-inspection-queue/spec.md)
**Context**: [research.md](../../specs/001-predictive-inspection-queue/research.md)

## 1. Entities

### Establishment (Tenant-Scoped)

Represents a physical food service business licensed by the county.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| tenant_id | UUID | Foreign Key, Indexed | Mandatory isolation boundary |
| license_id | String | Indexed | External system ID for the business license |
| name | String | Not Null | DBA name |
| facility_type | Enum | Not Null | e.g., Restaurant, Grocery Store, Mobile Food |
| risk_category | Enum | Not Null | Static license tier (High, Medium, Low) |
| address | String | Not Null | Physical location |
| zip | String | Indexed | Zip code (useful for geographic clustering features) |
| latitude | Float | Nullable | Geolocation |
| longitude | Float | Nullable | Geolocation |
| is_active | Boolean | Default True | If false, excluded from nightly ML scoring |
| updated_at | Timestamp | Default NOW() | Track last sync from external license DB |

### InspectionResult (Tenant-Scoped)

Represents a historical or newly logged outcome. Acts as ground truth for ML training.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| tenant_id | UUID | Foreign Key, Indexed | Mandatory isolation boundary |
| establishment_id | UUID | Foreign Key, Indexed | Link to business |
| inspector_id | UUID | Foreign Key | Link to Cognito user ID (for Director tracking) |
| inspection_date | Date | Not Null, Indexed | Date of visit |
| inspection_type | Enum | Not Null | Canvas, Complaint, Re-inspection |
| result | Enum | Not Null | Pass, Pass w/ Conditions, Fail, Out of Business |
| critical_violations | Integer | Default 0 | Count of health code violations deemed critical |
| notes | Text | Nullable | Optional field notes from inspector |
| processed_for_ml | Boolean | Default False | Flag indicating if this record was consumed by feature store |
| created_at | Timestamp | Default NOW() | Record creation time |

### DailyRiskScore (Tenant-Scoped)

The output matrix from the nightly PyTorch batch scoring job.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | Primary Key | Unique identifier |
| tenant_id | UUID | Foreign Key, Indexed | Mandatory isolation boundary |
| establishment_id | UUID | Foreign Key, Indexed | Link to business |
| score_date | Date | Not Null, Indexed | The date this prediction is valid for |
| risk_score | Float | 0.0 to 100.0 | The raw PyTorch output probability scaled |
| risk_band | Enum | Not Null | High (top 20%), Medium (21-80%), Low (Bottom 20%) |
| factor_1_name | String | Not Null | Captum explainability top factor name |
| factor_1_weight | Float | Not Null | Captum explainability top factor impact |
| factor_2_name | String | Not Null | Captum explainability 2nd factor name |
| factor_2_weight | Float | Not Null | Captum explainability 2nd factor impact |
| factor_3_name | String | Not Null | Captum explainability 3rd factor name |
| factor_3_weight | Float | Not Null | Captum explainability 3rd factor impact |

*Index*: `(tenant_id, score_date, risk_score DESC)` for O(1) daily queue retrieval.

---

## 2. API Contracts (`contracts/api/v1`)

### Endpoint: GET `/api/v1/queue/daily` (Inspector Queue)
**Auth**: Cognito JWT Required (Role: `inspector`)
**Isolation**: Implicitly filters by `tenant_id` on the JWT claims.

**Response (200 OK)**:
```json
{
  "queue_date": "2026-03-05",
  "total_items": 42,
  "establishments": [
    {
      "establishment_id": "uuid",
      "name": "Burger Joint",
      "address": "123 Main St",
      "risk_band": "High",
      "risk_score": 92.4,
      "factors": [
        {"name": "Previous Critical Violations", "impact": "High"},
        {"name": "Time Since Last Inspection", "impact": "Medium"},
        {"name": "Recent Nearby Complaints", "impact": "Medium"}
      ]
    }
    // ... ordered by risk_score descending
  ]
}
```

### Endpoint: POST `/api/v1/inspections/outcome` (Inspector Logging)
**Auth**: Cognito JWT Required (Role: `inspector`)

**Request Body**:
```json
{
  "establishment_id": "uuid",
  "inspection_type": "Canvas",
  "result": "Fail",
  "critical_violations_count": 2,
  "notes": "Found temperature abuse in walk-in cooler."
}
```

**Response (201 Created)**:
```json
{
  "status": "success",
  "inspection_id": "uuid",
  "message": "Outcome logged and removed from daily queue."
}
```

### Endpoint: GET `/api/v1/dashboard/jurisdiction-summary` (Director Dashboard)
**Auth**: Cognito JWT Required (Role: `director`)

**Response (200 OK)**:
```json
{
  "active_establishments": 1450,
  "high_risk_queue_size": 290,
  "critical_catch_rate_30d": 68.5, // % of high risk inspections yielding critical violations
  "avg_lead_time_days": 185,
  "historical_trend": [
    {"month": "2025-04", "avg_risk": 45.2, "critical_violations": 112},
    // ... 12 months data
  ]
}
```
