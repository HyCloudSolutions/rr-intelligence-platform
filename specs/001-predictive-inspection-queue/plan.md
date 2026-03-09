# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Creates the core predictive inspection queue feature. This encompasses a Python/FastAPI backend driving a daily PyTorch batch scoring job (with Captum explainability) and exposing the results securely to a Next.js 14 responsive web frontend. The entire stack will be orchestrated locally via Docker Compose for E2E testing, adhering to the project's strict tenant isolation and ML explainability mandates.

## Technical Context



**Language/Version**: Python 3.11 (Backend/ML) / TypeScript 5.x (Frontend)
**Primary Dependencies**: FastAPI, PyTorch, MLflow, Captum, Next.js 14 (App Router), shadcn/ui
**Storage**: PostgreSQL (via RDS in Prod / Docker locally)
**Testing**: pytest (Backend) / Jest & React Testing Library (Frontend) 
**Target Platform**: AWS ECS Fargate, Vercel
**Project Type**: Multi-tier Web Application (React Frontend + Python API/ML Batch worker)
**Performance Goals**: ML Batch job must complete processing all active establishments within 4 hours nightly. API P95 latency < 500ms.
**Constraints**: Mobile-first responsive design for field inspectors. Must support offline queue caching for low-connectivity environments.
**Scale/Scope**: ~1,500 Active Establishments per tenant (City/County scale), ~50-100 Field Inspectors, ~5-10 Directors.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Predictive & Proactive**: Yes. Replaces calendar scheduling with a nightly ML risk score queue.
- **Explainable AI**: Yes. Captum calculates the top 3 contributing factors for every score shown directly on the Inspector's cards.
- **Tenant Isolation**: Yes. All RDS tables have a strict `tenant_id` foreign key, isolated at the row-level based on Cognito JWT claims.
- **Managed Cloud-Native**: Yes. AWS Fargate for the API/batch processor, Vercel for the web UI, RDS for data.
- **IaC**: Yes. All AWS infrastructure is provisioned natively via Terraform.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/
```

**Structure Decision**: Selected the decoupled Web application structure (`backend/` fastAPI, `frontend/` Next.js 14) to mirror the MVP design document's architectural mandate.

## Data Ingestion Architecture

Historical data (CSV format) is ingested via a dedicated Next.js UI (`/director/ingestion`). The upload is processed directly in the backend Python runtime for immediate validation rather than leveraging S3/EventBridge to reduce MVP infrastructure complexity. The backend uses Pandas to parse, deduplicate, and seed the PostgreSQL database (`Establishments`, `InspectionResults`, `DailyRiskScores`).
