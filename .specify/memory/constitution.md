<!--
Sync Impact Report:
- Version change: 1.0.0 -> 1.0.1
- List of modified principles:
  - Template 1 -> I. Predictive, Not Reactive
  - Template 2 -> II. Explainable AI (Transparency)
  - Template 3 -> III. Tenant Isolation & Security First
  - Template 4 -> IV. Cloud-Native & Managed Service
  - Template 5 -> V. Infrastructure as Code (IaC)
- Added sections: Data Layer & ML Standards, Development & Workflow
- Removed sections: N/A
- Templates requiring updates (✅ updated):
  - .specify/templates/plan-template.md ✅ updated
  - .specify/templates/spec-template.md ✅ updated
  - .specify/templates/tasks-template.md ✅ updated
-->

# RestaurantRisk Intelligence Platform Constitution

## Core Principles

### I. Predictive, Not Reactive
Risk scores MUST be computed proactively using machine learning models to provide field inspectors with a prioritized daily queue, rather than scheduling based on fixed calendars or reacting solely to complaints.

### II. Explainable AI (Transparency)
Every prediction surfaced to the user MUST include actionable, plain-language explainability (e.g., top 3 contributing factors via Captum). The machine learning scoring methodology MUST NOT operate as an opaque black box to health department staff.

### III. Tenant Isolation & Security First
All data MUST be strictly isolated per tenant (county/municipality). Cross-tenant data access is strictly prohibited. Security and privacy of inspection rules, historical data, and outcomes MUST be governed by robust authentication (e.g., AWS Cognito) and row-level tenant filters in the database.

### IV. Cloud-Native & Managed Service
The platform MUST impose zero infrastructure management burden on the tenant. Solutions MUST aggressively leverage managed, stateless cloud infrastructure (e.g., AWS ECS Fargate, Vercel, RDS, Serverless EventBridge) to ensure effortless scalability, high availability, and straightforward multi-tenant hosting.

### V. Infrastructure as Code (IaC)
All infrastructure and service provisioning MUST be defined and deployed through code (Terraform). Manual console changes in any environment (Dev, Staging, or Prod) are strictly disallowed to maintain reproducible and auditable setups.

## Data Layer & ML Standards

Input data (inspections, licenses, complaints) MUST uniformly process through an automated ETL pipeline ensuring idempotent updates. Preprocessing and feature engineering logic MUST be shared exactly between training and production inference. The ML Layer MUST utilize **PyTorch** for tabular modeling and **MLflow** for experiment/model tracking. Production machine learning models MUST maintain defined performance minimums (e.g., AUC-ROC >= 0.70) and alert on data drift or performance degradation via CloudWatch. Nightly batch scoring MUST be favored over real-time inference to reduce infrastructure complexity.

## Development & Workflow

The platform maintains a decoupled architecture: a **Next.js 14 (App Router)** frontend utilizing `shadcn/ui`, `Tailwind CSS`, and `Tremor` for dashboards, and a stateless **FastAPI (Python)** backend hosted on AWS ECS Fargate. All new features MUST fulfill CI/CD requirements (e.g., GitHub Actions, Vercel deployments), including automated testing, linter checks, and deployment staging gates before promotion to production. Code reviews MUST evaluate changes against architectural principles and emphasize minimal long-term maintenance overhead.

## Governance

This Constitution supersedes all ad-hoc development practices. Any structural alteration to tenant isolation, ML explainability, or IaC workflows MUST be documented, reviewed, and approved via pull requests updating this file. Role-based access constraints (e.g., `inspector` vs `director`) and tenant data retention policies (default 7 years) MUST be strictly upheld. No PR highlighting a violation of these Core Principles may be merged.

**Version**: 1.0.1 | **Ratified**: 2026-03-05 | **Last Amended**: 2026-03-05
