# Tasks — Phase 1: Operational Efficiency

Tracks the implementation of Smart Routing and Predictive Forecasts.

## 🗄️ Backend (FastAPI)
- [ ] T001: Install routing dependencies (`requests` or `mapbox` wrapper). <!-- id: 1 -->
- [ ] T002: Create `backend/src/services/routing.py` for Mapbox matrix queries. <!-- id: 2 -->
- [ ] T003: Create `/api/v1/queue/route` endpoint to sort queue by coordinates. <!-- id: 3 -->
- [ ] T004: Create `/api/v1/analytics/forecast` route aggregation endpoint. <!-- id: 4 -->

## 🎨 Frontend (Next.js)
- [ ] T005: Setup map drawer module (`SmartRouteDrawer.tsx`). <!-- id: 5 -->
- [ ] T006: Add "View Optimized Route" trigger button to daily queue menu. <!-- id: 6 -->
- [ ] T007: Build Director Sub-Page `/director/forecasts` displaying average risk trends. <!-- id: 7 -->

## ✅ Verification
- [ ] T008: Verify correct route sorting on frontend drawers against fixtures. <!-- id: 8 -->
