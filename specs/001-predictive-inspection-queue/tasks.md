# Tasks: 001-predictive-inspection-queue

**Input**: Design documents from `/specs/001-predictive-inspection-queue/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the decoupled web application.

- [x] T001 Initialize Python/FastAPI backend project in `backend/` using Poetry
- [x] T002 Initialize Next.js 14 frontend project in `frontend/`
- [x] T003 [P] Configure Docker Compose environment in `docker-compose.yml` (PostgreSQL, LocalStack)
- [x] T004 [P] Configure backend linting (Ruff/Black) in `backend/pyproject.toml`
- [x] T005 [P] Configure frontend linting (ESLint/Prettier) in `frontend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Setup SQLAlchemy database schema, Alembic migrations, and tenant-isolation base in `backend/src/db/`
- [x] T007 Create base data models (Establishment, InspectionResult, DailyRiskScore) in `backend/src/models/` mapping to `data-model.md`
- [x] T008 [P] Implement authentication middleware (AWS Cognito mock via LocalStack) in `backend/src/api/middleware/auth.py`
- [x] T009 [P] Setup Next.js 14 NextAuth configuration in `frontend/src/app/api/auth/[...nextauth]/route.ts`
- [x] T010 Setup initial local seed script in `backend/scripts/seed_local_data.py`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Field Inspector Daily Queue (Priority: P1) 🎯 MVP

**Goal**: As a Field Inspector, I need to see a prioritized daily list of food establishments ranked by predictive risk.
**Independent Test**: Web app renders a sorted queue based on dummy ML data seeded in the database.

### Implementation for User Story 1

- [x] T011 [P] [US1] Implement GET `/api/v1/queue/daily` endpoint in `backend/src/api/routes/queue.py`
- [x] T011b [P] [US1] Implement fallback logic in `/api/v1/queue/daily` to serve previous day's queue if current ML score is missing
- [x] T012 [P] [US1] Create PyTorch nightly batch scoring skeleton in `backend/jobs/batch_score.py`
- [x] T013 [P] [US1] Integrate Captum explainability into the scoring job in `backend/jobs/batch_score.py`
- [x] T014 [US1] Build mobile-responsive Queue UI component in `frontend/src/app/inspector/queue/page.tsx`
- [x] T015 [US1] Build Risk Card component displaying top 3 factors in `frontend/src/components/RiskCard.tsx`
- [x] T016 [US1] Wire frontend to backend queue API securely passing tenant auth token.

**Checkpoint**: At this point, User Story 1 is fully functional. Inspectors can login and view their ML-driven queues.

---

## Phase 4: User Story 2 - Inspector Outcome Logging (Priority: P1)

**Goal**: As a Field Inspector, I need to easily log the outcome of my inspection directly from the queue interface.
**Independent Test**: Inspector clicks a card, submits a fail form, UI updates, and DB reflects the new InspectionResult.

### Implementation for User Story 2

- [x] T017 [P] [US2] Implement POST `/api/v1/inspections/outcome` endpoint in `backend/src/api/routes/inspections.py`
- [x] T018 [P] [US2] Build Inspection Outcome Form component with Server Actions in `frontend/src/components/OutcomeForm.tsx`
- [x] T019 [P] [US2] Build robust offline caching layer (PWA Service Worker + IndexedDB) for offline queue viewing and queued form submissions in `frontend/src/lib/offlineSync.ts`
- [x] T020 [US2] Integrate the Outcome Form into the active Queue UI in `frontend/src/app/inspector/queue/page.tsx`
- [x] T021 [US2] Add backend logic to remove establishment from 'active' daily queue upon outcome submission.

**Checkpoint**: At this point, the ML data loop is closed. Queues are generated, and outcomes are captured.

---

## Phase 5: User Story 3 - Director Sub-Jurisdiction Insights (Priority: P2)

**Goal**: As a Health Department Director, I need a dashboard summarizing jurisdiction-wide risk distribution and historical trends.
**Independent Test**: Director logs into desktop app and sees accurate KPI aggregations based on the seeded InspectionResults and RiskScores.

### Implementation for User Story 3

- [x] T022 [P] [US3] Implement GET `/api/v1/dashboard/jurisdiction-summary` in `backend/src/api/routes/dashboard.py` (aggregate APIs)
- [x] T023 [P] [US3] Build Director Dashboard page in `frontend/src/app/director/dashboard/page.tsx`
- [x] T024 [US3] Build Tremor KPI cards component for high-level metrics
- [x] T025 [US3] Build Tremor AreaChart component for 12-month historical risk trends

**Checkpoint**: Main MVP is complete. Directors have observability over the system.
- [x] T025b [US3] Build basic Data Ingestion UI allowing Directors to upload historical CSVs in `frontend/src/app/director/ingestion/page.tsx`
- [x] T026 [US3] Wire frontend components to backend dashboard API ensuring Director role authorization.
- [x] T026b [Data] Create foundational Python script to process CSV ingestion `backend/scripts/ingestion/ingest_csv.py`
- [x] T026c [Orchestration] Expand `docker-compose.yml` to include `frontend` and `backend` services alongside `db` for single-command `docker compose up` E2E testing.

**Checkpoint**: All 3 primary user stories are now independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and bridge the gap to deployment.

- [x] T027 Configure Terraform definitions for AWS ECS Fargate, RDS, and EventBridge in `terraform/main.tf`
- [x] T028 [P] Set up GitHub Actions CI for backend testing and linting in `.github/workflows/backend.yml`
- [x] T029 [P] Set up Vercel deployment configuration for frontend in `frontend/vercel.json`
- [x] T030 Refine mobile styling and Tailwind utility classes across all inspector views.
- [x] T031 Run `quickstart.md` locally end-to-end to validate the developer experience.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phases 3/4/5)**: All depend on Foundational phase completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Foundation -> T11 through T16
- **User Story 2 (P1)**: Foundation -> US1 complete -> T17 through T21 (relies on Queue UI existing)
- **User Story 3 (P2)**: Foundation -> Can be run entirely in parallel with US1/US2.

### Parallel Opportunities

- T003, T004, T005 in Setup can be done simultaneously.
- T008, T009 in Foundational auth setup can be done simultaneously across stack.
- Backend API endpoints and Frontend dummy components can be built in parallel for every User Story.
