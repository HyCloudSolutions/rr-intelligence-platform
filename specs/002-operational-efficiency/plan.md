# Implementation Plan — Phase 1: Operational Efficiency

This plan outlines the technical steps to prototype and deploy **Dynamic Smart Routing** and **Predictive Load Forecasting**.

## 📐 Technical Decisions

### 1. Routing Engine: Mapbox Matrix API vs. OR-Tools
*   **Decision**: Use **Mapbox Matrix API** (In Backend).
*   **Why**: Food inspecting relies heavily on distinct road distances, one-way streets, and speed limits which straight-line/Haversine or local network matrices might miscalculate without dedicated local datasets. Mapbox integrates effortlessly with existing Next.js dynamic maps.

### 2. Forecast Aggregation
*   Combine `DailyRiskScore` values grouped by monthly averages and `zip` groupings inside SQL queries using PostgreSQL aggregations (`DATE_TRUNC`, `AVG`).

---

## 🛠️ Proposed Changes

### [Component] Backend (FastAPI)

#### [NEW] `backend/src/services/routing.py`
- Create wrapper function `get_optimal_route(locations: List[Dict])` using Mapbox Matrix endpoints.
- Support Traveling Salesperson solving back to the original node (Route sorting).

#### [NEW] `backend/src/api/routes/queue.py` -> Route Additions
- `POST /api/v1/queue/route`: Accepts user's current Coordinates and returns re-ordered JSON Queue.

#### [NEW] `backend/src/api/routes/analytics.py` -> Route Additions
- `GET /api/v1/analytics/forecast`: Groups risk metrics per spatial grid.

---

### [Component] Frontend (Next.js)

#### [NEW] `frontend/src/components/SmartRouteDrawer.tsx`
- Expandable drawer on top of the Queue list showing a loaded map instance with optimized waypoint connectors.

#### [NEW] `frontend/src/app/director/forecasts/page.tsx`
- Grid detailing spatial-historical aggregations over Tremor charts.

---

## ✅ Verification Plan

### Automated
- Test Python backend routing wrappers against mock Mapbox response fixtures.

### Manual
- Validate coordinate sorting algorithms using known corner scenarios (e.g. cross-city back-tracking tests).
