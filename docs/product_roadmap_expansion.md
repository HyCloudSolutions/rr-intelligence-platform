# Product Roadmap: Commercial Expansion & Sellability

To successfully monetize and scale the **RestaurantRisk Intelligence Platform**, we can transition from a predictive queue into an **operational command center** for both municipalities and commercial enterprises. 

Here is the strategic approach to rolling out these advanced features divided into actionable phases.

---

## 📅 Phase 1: Operational Efficiency (Low-Hanging Fruit)
*Focus: Adding immediately sellable ROI metrics requiring minimal data core changes.*

### 📍 1. Dynamic Smart Routing (The "Inspector's GPS")
*   **The Concept**: Build a mapping engine that calculates fuel-efficient itineraries for inspectors visiting multiple high-risk locations daily.
*   **Approach**:
    *   **Backend**: Integrate with Mapbox, Google Maps, or AWS Location Service to solve TSP (Travelling Salesperson Problem) arrays using coordinates in the `establishments` table.
    *   **Frontend**: Add a "Map View" in the Inspector Mobile Drawer that displays nodes connected in order of scheduled visitations.
*   **Commercial Pitch**: *"Save 15% on daily fleet vehicle support and fuel budgets."*

### 📈 2. Predictive Resource Load Balancing
*   **The Concept**: Project strategic staff demand forecasting benchmarks for Directors based on seasonal metrics.
*   **Approach**:
    *   **Backend**: Add trend-aggregation endpoints combining rolling 30-day failure score increments.
    *   **Frontend**: Create a sidebar sub-page showing "Forecasted Hotspots" using Framer or Tremor widgets grouped by regional ZIP groupings.
*   **Commercial Pitch**: *"Anticipate seasonal volume overflows and request precise budgetary support."*

---

## 📅 Phase 2: Commercial Diversification (New Revenue Streams)
*Focus: Scaling subscription opportunities outside government licenses into B2B Franchise compliance.*

### 🚨 1. B2B Self-Audit Franchise Portal
*   **The Concept**: Sell light-view Dashboard access to restaurant chains so owners can run internal compliance score simulation diagnostics.
*   **Approach**:
    *   **Auth**: Add a `franchise_manager` role block inside AWS Cognito for isolation.
    *   **Database**: Create a `self_inspections` schema layout for internal checklist logging on sub-establishments.
    *   **Logic**: Run a background worker that weights successfully logged inside-audits to *lower* the predictive risk node calculation for that establishment in the city queue.
*   **Commercial Pitch**: *"Proactively maintain compliance scores to avoid brand-damaging failed grades in public dashboards."*

---

## 📅 Phase 3: Hardware & AI Vision Upgrades (Deep Differentiation)
*Focus: Fully bulletproofing inspection evidence structures with automated image diagnostics.*

### 📸 1. Computer Vision Inspection Verification
*   **The Concept**: Automatic evidence validation checking photos logged at compliance checks.
*   **Approach**:
    *   **Backend**: Spin up an asynchronous endpoint on AWS SageMaker looking at image uploads. 
    *   **Feature set**: Build Image models that detect OCR from temperature logging displays, hygiene posters, or sanitation layout tags to auto-check manual typing anomalies.
*   **Commercial Pitch**: *"Accelerate reporting speed by 20% and provide litigations defense for any dispute queries."*

### 🛡️ 2. Dynamic "Public Seal of Safety" API Widget
*   **The Concept**: A live score badge embeddable onto Yelp and Google reviews for clean operators.
*   **Approach**:
    *   Create a public gateway layout `GET /api/v1/public/seal/{establishment_id}` returning a secured SVG node render of their real-time safety index percentage.
*   **Commercial Pitch**: *"Gain virility and organic word-of-mouth branding powered by safety ratings diagnostics."*
