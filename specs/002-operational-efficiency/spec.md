# Specification — Phase 1: Operational Efficiency

This specification covers the implementation of **Dynamic Smart Routing** and **Predictive Load Balancing** to optimize the daily operations of Health Department inspectors and directors.

## 👥 Target Users
1.  **Field Inspector**: Needs to know the best driving order to visit High-Risk locations today.
2.  **Health Director**: Needs to see where future workload surges will over-burden staff resources.

---

## 🛠️ Feature 1: Dynamic Smart Routing

### 💡 The Problem
Inspectors are sorted by `Risk Score`, but a sequence ranked `95, 94, 91` may compel them to drive back and forth across the city, wasting finite vehicle fuel budget and inspector-hours.

### 📐 The Solution
Create a routing layer that re-orders the Daily Queue matching the Traveling Salesperson Problem (TSP) constraints.

### 📋 Technical Scope
*   **Data Structure**: Uses existing `latitude` and `longitude` fields in the `establishments` model.
*   **Backend (FastAPI)**:
    *   Add `/api/v1/queue/route` endpoint.
    *   Calculates vertex-to-vertex matrix grids. 
    *   Option A: OR-Tools (Python plugin).
    *   Option B: External Matrix API (Mapbox / Google Maps / AWS Location). *Mapbox preferred for easy JS integrations.*
*   **Frontend (Next.js)**:
    *   Render optimal nodes over a Map UI sidebar.
    *   Provide high-level travel durations summary.

---

## 🛠️ Feature 2: Predictive Load Balancing

### 💡 The Problem
Directors cannot strategically forecast how resources are allocated month-to-month based on decay variables.

### 📐 The Solution
Provide aggregated forecasts detailing predicted risk spikes scoped spatially.

### 📋 Technical Scope
*   **Backend (FastAPI)**:
    *   Aggregation route: `GET /api/v1/dashboard/forecast` mapping scoring rolling datasets clustered by ZIP nodes.
*   **Frontend (Next.js)**:
    *   Include a sidebar sub-page: "Forecasting Workspace" with Tremor map grids.
