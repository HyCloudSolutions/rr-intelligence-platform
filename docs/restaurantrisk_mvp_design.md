# RestaurantRisk Intelligence Platform
## MVP & Design Document v1.0

> **Prepared by:** HyCloudSolutions  
> **Date:** March 2026  
> **Version:** 1.1 — ML Layer updated to PyTorch  
> **Status:** Draft

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Solution Overview](#3-solution-overview)
4. [Target Users](#4-target-users)
5. [MVP Scope](#5-mvp-scope)
6. [System Architecture](#6-system-architecture)
7. [Data Layer](#7-data-layer)
8. [ML Layer](#8-ml-layer)
9. [Application Layer](#9-application-layer)
10. [Infrastructure Layer](#10-infrastructure-layer)
11. [Frontend Design System](#11-frontend-design-system)
12. [Security & Compliance](#12-security--compliance)
13. [Multi-Tenancy Model](#13-multi-tenancy-model)
14. [MVP Build Plan](#14-mvp-build-plan)
15. [Out of Scope (Post-MVP)](#15-out-of-scope-post-mvp)
16. [Open Decisions](#16-open-decisions)

---

## 1. Executive Summary

**RestaurantRisk Intelligence Platform** is a cloud-based SaaS application that enables municipal and county health departments to prioritize food establishment inspections using predictive machine learning — before inspectors step through the door.

The system ingests historical inspection records, sanitation complaints, business license data, and environmental signals to produce a daily risk-ranked queue of food establishments. Inspectors see which locations are most likely to have critical violations today. Directors see jurisdiction-wide trends, inspector performance, and compliance reporting.

The methodology is based on the publicly validated [City of Chicago Food Inspections Evaluation](https://github.com/Chicago/food-inspections-evaluation) project, adapted into a fully managed, multi-tenant cloud SaaS product.

**Core Value Proposition:**
- Catch critical violations faster with fewer inspector hours
- Data-driven inspection prioritization vs. calendar-based scheduling
- Zero infrastructure burden on the health department

---

## 2. Problem Statement

### Current State

Most mid-size city and county health departments operate food inspection programs using one of the following approaches:

- **Calendar rotation** — establishments are inspected on a fixed cycle (e.g., every 6 months), regardless of risk
- **Complaint-driven only** — inspectors respond reactively to public complaints
- **Manual judgment** — experienced inspectors use intuition based on familiarity with establishments

### Why This Fails

| Problem | Impact |
|---|---|
| High-risk establishments inspected on the same cadence as low-risk ones | Critical violations go undetected between cycles |
| Inspector time is finite and budget-constrained | Inefficient allocation of limited resources |
| No early warning system for emerging risk | Outbreaks occur before intervention |
| Reporting to state agencies is manual and time-consuming | Director bandwidth consumed by paperwork |

### The Opportunity

The City of Chicago demonstrated that predictive modeling can identify establishments with critical violations **7.5 days sooner on average** compared to calendar-based scheduling. For a mid-size county with 2,000 food establishments and 8 inspectors, this compounds into significantly better public health outcomes and measurable ROI.

---

## 3. Solution Overview

### How It Works

```
Raw Data Sources
      ↓
Ingestion & Normalization (ETL)
      ↓
Feature Engineering
      ↓
ML Risk Scoring Model (nightly batch)
      ↓
Risk-Ranked Inspection Queue
      ↓
Inspector Mobile View  |  Director Dashboard
```

### What Makes It Different

- **Predictive, not reactive** — risk scores are computed proactively, not after complaints arrive
- **Explainable AI** — every risk score shows the top contributing factors in plain language (not a black box)
- **Workflow-integrated** — inspectors don't need a separate system; the queue replaces their morning briefing
- **Managed service** — the county doesn't manage infrastructure, model retraining, or data pipelines

---

## 4. Target Users

### Primary Users

#### 4.1 Field Inspector
**Profile:** Environmental Health Officer conducting on-site inspections  
**Device:** Mobile phone (Android/iOS), occasionally tablet  
**Context:** In the field, may have limited connectivity  
**Core Need:** Know where to go today and why  

**Key Jobs To Be Done:**
- View today's prioritized inspection queue
- Understand why a specific establishment is flagged high-risk
- Log inspection outcomes in the field
- Access establishment history quickly

#### 4.2 Health Department Director
**Profile:** Department head or supervisor overseeing inspection program  
**Device:** Desktop / laptop  
**Context:** Office-based, reviewing weekly/monthly performance  
**Core Need:** Demonstrate program effectiveness, manage team, report to state  

**Key Jobs To Be Done:**
- Monitor jurisdiction-wide risk trends
- Track inspector activity and coverage
- Generate compliance reports for state submission
- Identify neighborhoods or establishment types with systemic issues

### Secondary Users (Post-MVP)

- **County IT Administrator** — manages user accounts and data uploads
- **State Health Agency** — receives exported reports (no direct system access in MVP)

---

## 5. MVP Scope

### In Scope ✅

| Feature | Description |
|---|---|
| Data ingestion | Manual CSV upload of inspection history per county |
| ETL pipeline | Normalize, clean, and load inspection data into feature store |
| ML risk scoring | Nightly batch scoring of all active establishments |
| Risk score explainability | Top 3 risk factors displayed per establishment |
| Inspector queue view | Mobile-responsive prioritized daily queue |
| Inspection outcome logging | Inspector marks result (pass/fail/critical violations) |
| Director dashboard | KPI cards, risk distribution, trend charts |
| Multi-tenant auth | County-isolated login via AWS Cognito |
| Basic reporting | Exportable CSV inspection summary report |
| Terraform IaC | Full infrastructure-as-code for reproducible deploys |

### Out of Scope for MVP ❌

- Yelp / Google Reviews API integration
- Native iOS/Android app (responsive web only)
- Real-time risk scoring (nightly batch sufficient)
- Automated data pull from county systems
- In-app billing and subscription management
- On-premise or hybrid deployment
- Automated state agency report submission
- Franchise/restaurant operator self-assessment portal

---

## 6. System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        USER LAYER                           │
│                                                             │
│   Inspector (Mobile Browser)    Director (Desktop Browser)  │
└───────────────────┬────────────────────────┬────────────────┘
                    │                        │
                    ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
│                                                             │
│              Next.js 14 (App Router)                        │
│              Deployed on Vercel                             │
│              shadcn/ui + Tremor + Tailwind CSS              │
└───────────────────────────┬─────────────────────────────────┘
                            │  HTTPS / REST
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                          │
│                                                             │
│              FastAPI (Python)                               │
│              AWS ECS Fargate (containerized)                │
│              AWS Cognito (JWT auth)                         │
└────────┬──────────────────────────────────┬─────────────────┘
         │                                  │
         ▼                                  ▼
┌─────────────────┐              ┌──────────────────────────┐
│   DATA LAYER    │              │       ML LAYER           │
│                 │              │                          │
│ PostgreSQL RDS  │◄─────────────│ scikit-learn (RF model)  │
│ (feature store  │              │ MLflow (model registry)  │
│  + risk scores  │              │ AWS EventBridge (cron)   │
│  + outcomes)    │              │ Lambda (trigger)         │
│                 │              │ EC2 / SageMaker (train)  │
└─────────────────┘              └──────────────────────────┘
         ▲
         │
┌─────────────────┐
│  INGESTION      │
│  LAYER          │
│                 │
│ S3 (raw data)   │
│ AWS Glue / ETL  │
│ (Python)        │
└─────────────────┘
         ▲
         │
  County CSV Upload
  (manual, via secure portal)
```

### Architecture Principles

1. **Tenant isolation at the data layer** — each county's data is logically separated; no cross-tenant data access is possible
2. **Frontend and backend are fully decoupled** — Vercel hosts the Next.js app; AWS hosts everything else
3. **Stateless API** — FastAPI is stateless; all state lives in RDS; horizontal scaling is trivial
4. **Batch over real-time for MVP** — nightly scoring jobs reduce cost and complexity without sacrificing usefulness
5. **Infrastructure as Code** — every AWS resource is provisioned via Terraform; environments are reproducible

---

## 7. Data Layer

### 7.1 Input Data Sources (MVP)

| Source | Format | Acquisition | Notes |
|---|---|---|---|
| Historical inspection records | CSV | Manual upload by county | Core dataset — required |
| Business license data | CSV | Manual upload | Business age, ownership |
| Sanitation/311 complaints | CSV | Manual upload | Complaint frequency signal |
| NOAA weather data | API | Automated pull | Temperature correlation |
| Census block data | Static file | Loaded at setup | Neighborhood context |

### 7.2 Raw Data Storage

```
S3 Bucket Structure:
s3://restaurantrisk-{tenant_id}/
├── raw/
│   ├── inspections/
│   │   └── YYYY-MM-DD_upload.csv
│   ├── licenses/
│   └── complaints/
├── processed/
│   └── features/
└── models/
    └── YYYY-MM-DD/
```

### 7.3 Feature Store Schema (PostgreSQL)

**`establishments` table**
```sql
CREATE TABLE establishments (
    id              UUID PRIMARY KEY,
    tenant_id       UUID NOT NULL,
    license_number  VARCHAR(50),
    name            VARCHAR(255),
    address         TEXT,
    zip_code        VARCHAR(10),
    facility_type   VARCHAR(100),
    latitude        DECIMAL(9,6),
    longitude       DECIMAL(9,6),
    license_date    DATE,
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**`inspections` table**
```sql
CREATE TABLE inspections (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    establishment_id    UUID REFERENCES establishments(id),
    inspection_date     DATE,
    inspection_type     VARCHAR(50),
    result              VARCHAR(50),  -- PASS, FAIL, PASS W/ CONDITIONS
    critical_violations INTEGER,
    minor_violations    INTEGER,
    inspector_id        UUID,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

**`risk_scores` table**
```sql
CREATE TABLE risk_scores (
    id                  UUID PRIMARY KEY,
    tenant_id           UUID NOT NULL,
    establishment_id    UUID REFERENCES establishments(id),
    score_date          DATE,
    risk_score          DECIMAL(5,2),  -- 0.00 to 100.00
    risk_band           VARCHAR(10),   -- HIGH, MEDIUM, LOW
    top_factor_1        VARCHAR(255),
    top_factor_2        VARCHAR(255),
    top_factor_3        VARCHAR(255),
    model_version       VARCHAR(50),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.4 ETL Pipeline

**Technology:** Python (Pandas + SQLAlchemy), triggered via AWS Lambda on S3 upload event

**Steps:**
1. Validate uploaded CSV schema (column names, data types, required fields)
2. Deduplicate records against existing data
3. Standardize address formats (normalize for geo-matching)
4. Compute derived fields (days since last inspection, rolling violation counts)
5. Load clean records into PostgreSQL feature store
6. Trigger ML scoring job on completion

**Error Handling:**
- Validation failures generate an error report returned to the uploader
- Partial loads are rolled back (atomic transactions)
- All raw files are preserved in S3 regardless of outcome

---

## 8. ML Layer

### 8.1 Model Choice: PyTorch Neural Network (Tabular Classifier)

**Why PyTorch:**
- Full control over model architecture — easier to evolve from MVP to production-grade model
- Native support for embedding layers — ideal for high-cardinality categoricals like `facility_type` and `zip_code`
- GPU-acceleratable on AWS (EC2 `g4dn` or SageMaker) as data volume grows
- First-class integration with MLflow for experiment tracking
- Positions the platform for future enhancements (sequence modeling on inspection history, multi-task learning)
- Aligns with PhD research trajectory in Applied AI Engineering

**Model Architecture: Tabular Deep Neural Network**

A feed-forward network with entity embeddings for categorical features — the same architecture popularized by fast.ai for structured/tabular data. Outperforms tree-based models when categorical cardinality is high and sufficient data exists.

```python
class RiskScoringModel(nn.Module):
    def __init__(self, embedding_dims, n_numeric, hidden_sizes=[256, 128, 64]):
        super().__init__()

        # Entity embeddings for categorical features
        self.embeddings = nn.ModuleList([
            nn.Embedding(num_categories, embed_dim)
            for num_categories, embed_dim in embedding_dims
        ])

        # Embedding output size + numeric features
        embed_output_size = sum(e for _, e in embedding_dims)
        input_size = embed_output_size + n_numeric

        # Feed-forward layers with BatchNorm + Dropout
        layers = []
        for i, hidden_size in enumerate(hidden_sizes):
            layers += [
                nn.Linear(input_size if i == 0 else hidden_sizes[i-1], hidden_size),
                nn.BatchNorm1d(hidden_size),
                nn.ReLU(),
                nn.Dropout(p=0.3)
            ]
        self.network = nn.Sequential(*layers)

        # Binary classification output (critical violation: yes/no)
        self.output = nn.Linear(hidden_sizes[-1], 1)

    def forward(self, x_cat, x_num):
        embedded = [emb(x_cat[:, i]) for i, emb in enumerate(self.embeddings)]
        x = torch.cat(embedded + [x_num], dim=1)
        x = self.network(x)
        return torch.sigmoid(self.output(x))
```

**Output:** Probability of critical violation at next inspection (0.0–1.0), scaled to 0–100 risk score

**Training Configuration:**
| Parameter | Value |
|---|---|
| Loss function | `BCELoss` (binary cross-entropy) |
| Optimizer | `AdamW` (weight decay 1e-4) |
| Learning rate | 1e-3 with `ReduceLROnPlateau` scheduler |
| Batch size | 512 |
| Epochs | 50 (early stopping patience: 5) |
| Class imbalance handling | `pos_weight` in BCELoss (critical violations are minority class) |

---

### 8.2 Feature Set (MVP)

**Numeric Features** (normalized via `StandardScaler` before input)

| Feature | Description |
|---|---|
| `days_since_last_inspection` | Calendar days since most recent inspection |
| `prior_critical_violations_12m` | Count of critical violations in past 12 months |
| `prior_fail_rate` | Historical fail rate (0.0–1.0) |
| `complaint_count_90d` | Sanitation complaints in last 90 days |
| `establishment_age_years` | Years since license issue date |
| `avg_temp_30d` | Average temperature last 30 days (NOAA) |
| `zip_code_risk_index` | Rolling average violation rate by ZIP |
| `days_since_ownership_change` | Ownership changes correlate with higher risk |

**Categorical Features** (entity embeddings)

| Feature | Cardinality | Embedding Dim |
|---|---|---|
| `facility_type` | ~15 types | 8 |
| `season` | 4 (Q1–Q4) | 3 |
| `zip_code` | ~100–500 per county | 16 |
| `inspection_type` | ~5 types | 4 |

*Embedding dims follow the rule of thumb: `min(50, (cardinality // 2) + 1)`*

---

### 8.3 Data Preprocessing Pipeline

```python
# Preprocessing stack
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder

# Numeric: StandardScaler
numeric_pipeline = Pipeline([('scaler', StandardScaler())])

# Categorical: LabelEncoder → integer index → PyTorch Embedding
categorical_pipeline = Pipeline([('encoder', LabelEncoder())])

# Missing value strategy
# Numeric: fill with median (robust to outliers in government data)
# Categorical: fill with 'UNKNOWN' category token
```

Preprocessing artifacts (scalers, encoders) are **serialized and stored alongside the model** in S3/MLflow so inference uses identical transforms as training.

---

### 8.4 Model Training Pipeline

```
Trigger: Nightly at 2:00 AM (EventBridge → Lambda → EC2 g4dn.xlarge)

Steps:
1.  Pull feature set from PostgreSQL (last 3 years of data per tenant)
2.  Apply preprocessing pipeline (scaler + encoders)
3.  Time-based train/val split (80/20 — no data leakage)
4.  Handle class imbalance: compute pos_weight from training set
5.  Train PyTorch model (50 epochs max, early stopping on val AUC)
6.  Evaluate: Precision, Recall, F1, AUC-ROC on validation set
7.  If AUC-ROC ≥ 0.70 → promote to production
8.  Save model artifacts to S3 + register in MLflow:
      - model.pt (PyTorch state dict)
      - preprocessor.pkl (sklearn pipeline)
      - config.json (feature schema, thresholds)
9.  Run batch inference: score all active establishments
10. Write risk scores + Captum attributions to risk_scores table
11. CloudWatch alarm if AUC-ROC drops >5% vs. 30-day average
```

**EC2 Instance:** `g4dn.xlarge` (1x NVIDIA T4 GPU, 16GB RAM) — cost-effective for tabular model at MVP scale. Falls back to CPU (`c5.2xlarge`) if GPU unavailable.

---

### 8.5 Explainability — Captum (PyTorch-native)

Since scikit-learn SHAP is not used, explainability is handled via **Captum** — PyTorch's official interpretability library — using **Integrated Gradients**.

```python
from captum.attr import IntegratedGradients

ig = IntegratedGradients(model)
attributions = ig.attribute(
    inputs=(x_cat, x_num),
    target=0,
    n_steps=50
)
# Returns feature-level attribution scores
# Top 3 by absolute magnitude → human-readable labels
```

Each risk score surfaces the **top 3 attribution features** in plain English:

| Raw Feature | Human-Readable Label |
|---|---|
| `prior_critical_violations_12m` | "3 critical violations in the past year" |
| `complaint_count_90d` | "2 public complaints in the last 90 days" |
| `days_since_last_inspection` | "Last inspected 287 days ago" |
| `avg_temp_30d` | "High ambient temperatures this month" |
| `zip_code` | "High-risk ZIP code history" |

These labels appear directly in the inspector's queue view — no ML knowledge required.

---

### 8.6 ML Dependencies

```txt
# requirements-ml.txt
torch==2.2.0
torchvision==0.17.0          # for future image integration
captum==0.7.0                # explainability
mlflow==2.11.0               # experiment tracking + model registry
scikit-learn==1.4.0          # preprocessing pipelines
pandas==2.2.0                # feature engineering
numpy==1.26.4
sqlalchemy==2.0.28           # DB connection
psycopg2-binary==2.9.9       # PostgreSQL driver
boto3==1.34.0                # S3 artifact storage
```

---

### 8.7 Model Versioning & Registry (MLflow)

```
MLflow Tracking Server (hosted on EC2 or managed via AWS):

Experiment: "restaurantrisk-{tenant_id}"
  └── Run: 2026-03-05_02:00
        ├── Metrics: auc_roc, precision, recall, f1, val_loss
        ├── Params: hidden_sizes, lr, batch_size, epochs_trained
        ├── Artifacts:
        │     ├── model.pt
        │     ├── preprocessor.pkl
        │     └── config.json
        └── Tags: tenant_id, model_version, promoted=true/false

Model Registry:
  └── "risk-scorer-{tenant_id}"
        ├── Staging → latest trained model pending validation
        └── Production → currently serving model
```

---

### 8.8 Model Performance Monitoring

| Metric | Threshold | Action |
|---|---|---|
| AUC-ROC | < 0.70 | Block promotion to production |
| AUC-ROC drop | > 5% vs. 30-day avg | CloudWatch alarm → notify admin |
| Precision @ HIGH band | < 0.60 | Flag for manual review |
| Training job failure | Any | SNS alert → Simon |
| Inference latency | > 5 min for 2K establishments | Scale EC2 instance |

Monthly review: compare predicted risk scores against actual inspection outcomes to validate real-world model performance.

---

## 9. Application Layer

### 9.1 Backend — FastAPI

**Language:** Python 3.11  
**Framework:** FastAPI  
**Hosting:** AWS ECS Fargate (Docker container)  
**Auth:** JWT tokens issued by AWS Cognito, validated on every request  

**Core API Endpoints (MVP)**

```
Authentication
  POST   /auth/login
  POST   /auth/refresh
  POST   /auth/logout

Establishments
  GET    /establishments                  → paginated list with current risk scores
  GET    /establishments/{id}             → single establishment detail + history

Inspection Queue
  GET    /queue/today                     → today's prioritized queue for inspector
  GET    /queue/history                   → past queues

Inspections
  POST   /inspections                     → log inspection outcome
  GET    /inspections/{establishment_id}  → inspection history for establishment

Dashboard
  GET    /dashboard/summary               → KPI cards (director view)
  GET    /dashboard/trends                → time-series risk trend data
  GET    /dashboard/distribution          → risk band distribution

Reports
  GET    /reports/inspections/export      → CSV export of inspection outcomes

Admin
  POST   /admin/upload                    → initiate CSV data upload to S3
  GET    /admin/upload/status             → check ETL job status
  GET    /admin/users                     → list users for tenant
  POST   /admin/users                     → create user
```

**Middleware:**
- Tenant isolation enforced at middleware layer — every query is scoped to `tenant_id` from JWT
- Rate limiting via AWS API Gateway (100 req/min per user)
- Request logging to CloudWatch

### 9.2 Frontend — Next.js

**Framework:** Next.js 14 (App Router)  
**Hosting:** Vercel  
**Auth:** NextAuth.js connected to AWS Cognito  

#### Inspector View — Mobile Queue

```
┌────────────────────────────────┐
│ 🔴 HIGH RISK        Score: 94  │
│ Casa Blanca Mexican Kitchen    │
│ 1420 W. Fullerton Ave          │
│                                │
│ ⚠ 3 critical violations/yr    │
│ ⚠ 2 complaints last 90 days   │
│ ⚠ Last inspected 301 days ago │
│                                │
│ [Start Inspection]             │
├────────────────────────────────┤
│ 🟡 MEDIUM RISK      Score: 61  │
│ Sunrise Diner                  │
│ 842 N. Clark St                │
│                                │
│ ⚠ High temps this month       │
│ ⚠ Ownership changed 45 days   │
│                                │
│ [Start Inspection]             │
├────────────────────────────────┤
│ 🟢 LOW RISK         Score: 22  │
│ ...                            │
└────────────────────────────────┘
```

**Inspector View Features:**
- Sorted by risk score descending
- Color-coded risk bands (red/amber/green)
- Expandable cards showing top 3 risk factors
- One-tap "Start Inspection" → opens outcome logging form
- Filter by risk band, facility type, ZIP code
- Offline-tolerant (PWA with service worker caching the day's queue)

#### Director Dashboard — Desktop

```
┌──────────────────────────────────────────────────────────────┐
│  RestaurantRisk                          Bexar County Health  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 2,341    │  │  187     │  │  43%     │  │  7.2 days│   │
│  │ Active   │  │ High     │  │ Critical │  │ Avg Lead │   │
│  │ Estab.   │  │ Risk     │  │ Catch    │  │ Time     │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  Risk Trend (12 months)          Risk Distribution          │
│  ┌──────────────────────┐        ┌──────────────────────┐  │
│  │  [area chart]        │        │  [donut chart]       │  │
│  │                      │        │  High / Med / Low    │  │
│  └──────────────────────┘        └──────────────────────┘  │
│                                                              │
│  Recent Inspections                          [Export CSV]   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Establishment | Risk Score | Result | Inspector | Date│  │
│  │ ...                                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Director Dashboard Features:**
- KPI cards: active establishments, high-risk count, critical violation catch rate, average lead time
- 12-month risk trend line chart (Tremor)
- Risk band distribution donut chart
- Recent inspections table with filtering
- CSV export of any date range

---

## 10. Infrastructure Layer

### 10.1 AWS Services

| Service | Role |
|---|---|
| **S3** | Raw data lake — CSV uploads, model artifacts |
| **RDS PostgreSQL** | Primary database — feature store, risk scores, inspection outcomes |
| **ECS Fargate** | Containerized FastAPI backend — serverless containers |
| **ECR** | Docker image registry for FastAPI container |
| **Lambda** | ETL trigger on S3 upload, scheduled scoring job trigger |
| **EventBridge** | Nightly cron for ML training pipeline |
| **SageMaker** (or EC2) | ML model training environment |
| **Cognito** | Auth — user pools per tenant, JWT issuance |
| **API Gateway** | Rate limiting, HTTPS termination in front of ECS |
| **CloudWatch** | Logging, metrics, alarms (model degradation, ETL failures) |
| **Secrets Manager** | DB credentials, API keys |
| **VPC** | Network isolation — RDS not publicly accessible |

### 10.2 Environments

| Environment | Purpose | Notes |
|---|---|---|
| `dev` | Local development + feature branches | Docker Compose locally, Terraform for AWS dev account |
| `staging` | Pre-production validation | Mirror of prod, seeded with synthetic data |
| `production` | Live customer tenants | Multi-AZ RDS, Fargate auto-scaling enabled |

### 10.3 Terraform Module Structure

```
terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── modules/
│   ├── networking/       # VPC, subnets, security groups
│   ├── database/         # RDS PostgreSQL, parameter groups
│   ├── compute/          # ECS cluster, Fargate task definitions
│   ├── storage/          # S3 buckets, lifecycle policies
│   ├── auth/             # Cognito user pools, app clients
│   ├── ml/               # SageMaker or EC2 training environment
│   ├── events/           # EventBridge rules, Lambda functions
│   └── monitoring/       # CloudWatch dashboards, alarms, SNS
└── environments/
    ├── dev/
    ├── staging/
    └── prod/
```

### 10.4 CI/CD Pipeline

```
GitHub Repository
      ↓
GitHub Actions
      ├── Lint + Test (on PR)
      ├── Build Docker image → push to ECR (on merge to main)
      ├── Terraform plan (on PR)
      ├── Terraform apply → staging (on merge to main)
      └── Terraform apply → prod (manual approval gate)

Vercel (Frontend)
      ├── Preview deploy (on every PR — branch URL)
      └── Production deploy (on merge to main — automatic)
```

---

## 11. Frontend Design System

### 11.1 Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Components | shadcn/ui (Radix UI primitives) |
| Styling | Tailwind CSS |
| Charts | Tremor |
| Icons | Lucide React |
| Animation | Framer Motion (subtle, purposeful) |
| Typography | Geist (Vercel's font — clean, modern) |
| Auth | NextAuth.js → AWS Cognito |
| Data Fetching | React Query (TanStack Query) |
| Hosting | Vercel |

### 11.2 Design Tokens

```css
/* Brand Colors */
--color-brand-primary:    #1a56db;   /* Trustworthy blue */
--color-brand-accent:     #0ea5e9;   /* Sky blue highlight */

/* Risk Band Colors */
--color-risk-high:        #ef4444;   /* Red */
--color-risk-medium:      #f59e0b;   /* Amber */
--color-risk-low:         #22c55e;   /* Green */

/* Neutrals */
--color-surface:          #ffffff;
--color-surface-muted:    #f8fafc;
--color-border:           #e2e8f0;
--color-text-primary:     #0f172a;
--color-text-muted:       #64748b;

/* Typography Scale */
--font-family:            'Geist', sans-serif;
--font-size-xs:           0.75rem;
--font-size-sm:           0.875rem;
--font-size-base:         1rem;
--font-size-lg:           1.125rem;
--font-size-xl:           1.25rem;
--font-size-2xl:          1.5rem;
--font-size-3xl:          1.875rem;
```

### 11.3 Component Architecture

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (inspector)/
│   │   ├── queue/
│   │   └── inspection/[id]/
│   └── (director)/
│       ├── dashboard/
│       ├── establishments/
│       └── reports/
├── components/
│   ├── ui/               # shadcn/ui base components
│   ├── queue/            # Inspector queue components
│   │   ├── QueueCard.tsx
│   │   ├── RiskBadge.tsx
│   │   └── RiskFactorList.tsx
│   ├── dashboard/        # Director dashboard components
│   │   ├── KPICard.tsx
│   │   ├── RiskTrendChart.tsx
│   │   └── InspectionTable.tsx
│   └── shared/
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── LoadingState.tsx
├── lib/
│   ├── api.ts            # API client (React Query hooks)
│   ├── auth.ts           # NextAuth config
│   └── utils.ts
└── types/
    └── index.ts          # Shared TypeScript types
```

### 11.4 Responsive Breakpoints

| Breakpoint | Target |
|---|---|
| `sm` (640px) | Large phones |
| `md` (768px) | Tablets |
| `lg` (1024px) | Desktop — Director dashboard primary |
| Mobile-first | Inspector queue primary |

---

## 12. Security & Compliance

### 12.1 Authentication & Authorization

- All users authenticate via **AWS Cognito** (OAuth 2.0 / JWT)
- Tokens expire after 1 hour; refresh tokens valid for 30 days
- Role-based access: `inspector` and `director` roles enforced at API layer
- Passwords: min 12 characters, MFA optional (recommended for directors)

### 12.2 Data Security

- All data encrypted **at rest** (RDS: AES-256, S3: SSE-S3)
- All data encrypted **in transit** (TLS 1.2+ enforced)
- RDS accessible only from within VPC — no public endpoint
- S3 buckets are private; upload URLs are pre-signed, time-limited (15 min)
- Database credentials stored in AWS Secrets Manager — never in code or environment variables

### 12.3 Tenant Isolation

- Every database query includes a `tenant_id` filter enforced at the API middleware layer
- Separate Cognito User Pool per tenant (no cross-tenant authentication possible)
- S3 bucket paths are prefixed by `tenant_id`
- No shared compute between tenants (Fargate tasks are stateless; DB is the isolation boundary)

### 12.4 Compliance Considerations

- **HIPAA:** Food inspection data is not PHI; HIPAA does not apply
- **SOC 2 Type II:** Target for Year 1 post-MVP (AWS infrastructure inherits many controls)
- **FedRAMP:** Not required for county-level GovTech; evaluate if pursuing federal contracts
- **Data Retention:** Configurable per tenant; default 7 years (matches typical government record retention)
- **Audit Logging:** All API actions logged to CloudWatch with user, timestamp, and action

---

## 13. Multi-Tenancy Model

### Tenant Onboarding Flow

```
1. Sales signs county → contract executed
2. HyCloudSolutions provisions tenant:
   a. Cognito User Pool created for county
   b. Tenant record inserted (admin DB)
   c. S3 bucket prefix initialized
   d. Terraform workspace applied (if dedicated resources needed)
3. County IT uploads historical inspection CSV via secure portal
4. ETL pipeline runs → feature store populated
5. First ML scoring job runs → initial risk scores generated
6. Admin creates Inspector and Director accounts
7. Onboarding call: walkthrough with Health Department Director
8. Go live
```

### Tenant Configuration (per tenant)

| Setting | Description |
|---|---|
| `jurisdiction_name` | Display name (e.g., "Bexar County Health Dept.") |
| `facility_types` | Which facility types to include in scoring |
| `inspection_frequency_target` | Target days between inspections (used in scoring) |
| `high_risk_threshold` | Score threshold for HIGH band (default: 75) |
| `medium_risk_threshold` | Score threshold for MEDIUM band (default: 45) |
| `report_export_format` | CSV or Excel |
| `data_retention_years` | Default: 7 |

---

## 14. MVP Build Plan

### Team Assumptions
- 1 Full-stack developer (or Simon + 1 contractor)
- 1 ML Engineer (part-time / contract)
- Infrastructure: Simon (Terraform expertise)

### Phase 1 — Foundation (Weeks 1–4)

| Task | Owner | Duration |
|---|---|---|
| Terraform: VPC, RDS, S3, Cognito | Simon | Week 1 |
| Database schema + migrations | Dev | Week 1 |
| FastAPI scaffold + auth middleware | Dev | Week 2 |
| ETL pipeline (CSV → PostgreSQL) | Dev | Week 2–3 |
| ML baseline model (PyTorch tabular NN + Captum) | ML Eng | Week 2–4 |
| Nightly scoring job (Lambda + EventBridge) | Simon + ML Eng | Week 4 |

### Phase 2 — Application (Weeks 5–10)

| Task | Owner | Duration |
|---|---|---|
| Next.js scaffold + NextAuth + Cognito | Dev | Week 5 |
| Inspector queue view (mobile) | Dev | Week 6–7 |
| Outcome logging flow | Dev | Week 7 |
| Director dashboard KPI cards | Dev | Week 8 |
| Director trend charts (Tremor) | Dev | Week 8–9 |
| Inspection history table + CSV export | Dev | Week 9 |
| Captum explainability integration (Integrated Gradients) | ML Eng | Week 9 |
| Admin: CSV upload portal + status | Dev | Week 10 |

### Phase 3 — Hardening (Weeks 11–14)

| Task | Owner | Duration |
|---|---|---|
| Multi-tenant isolation testing | Simon | Week 11 |
| Security review + pen test basics | Simon | Week 11–12 |
| Performance testing (2,000+ establishments) | Dev | Week 12 |
| CI/CD pipeline (GitHub Actions + Vercel) | Simon | Week 12 |
| Staging environment validation | All | Week 13 |
| Pilot customer onboarding (1 county) | Simon | Week 14 |

**Total MVP Timeline: ~14 weeks**

### MVP Cost Estimate (AWS, monthly at launch)

| Service | Est. Monthly Cost |
|---|---|
| RDS PostgreSQL (db.t3.medium, Multi-AZ) | ~$120 |
| ECS Fargate (2 tasks, 0.5 vCPU / 1GB) | ~$30 |
| S3 (50 GB) | ~$2 |
| Lambda (ETL + scoring triggers) | ~$5 |
| Cognito (first 50K MAU free) | $0 |
| CloudWatch + misc | ~$20 |
| **Total AWS** | **~$177/month** |
| Vercel Pro | ~$20/month |
| **Grand Total** | **~$200/month** |

*Scales modestly with tenant count — predominantly database-driven costs.*

---

## 15. Out of Scope (Post-MVP)

| Feature | Rationale for Deferral |
|---|---|
| Yelp / Google Reviews integration | API cost + complexity; complaint data is adequate proxy for MVP |
| Native mobile app | Responsive web covers MVP use case; evaluate after user feedback |
| Real-time risk scoring | Nightly batch sufficient; real-time adds infrastructure complexity |
| Automated county data sync | Requires county IT integration; manual upload is faster to launch |
| Restaurant operator self-assessment portal | Different buyer, different sales motion — Phase 2 product |
| In-app billing (Stripe) | Manage manually for first 3–5 customers |
| On-premise deployment option | Cloud-only for MVP; evaluate if lost deals justify investment |
| State agency automated submission | Manual export covers MVP; automate per state if needed |
| Advanced GIS / mapping | Risk-ranked list is sufficient; map view is a nice-to-have |

---

## 16. Open Decisions

| Decision | Options | Recommended | Owner | Due |
|---|---|---|---|---|
| ML training infrastructure | SageMaker vs. EC2 | EC2 `g4dn.xlarge` (GPU, cost-effective at MVP scale) | Simon | Week 2 |
| Frontend state management | React Query only vs. Zustand + React Query | React Query only (sufficient for MVP) | Dev | Week 5 |
| Multi-tenancy DB strategy | Shared schema + tenant_id vs. schema-per-tenant | Shared schema + tenant_id (simpler to operate) | Simon | Week 1 |
| PWA offline strategy | Service worker caching vs. none | Basic SW caching for inspector queue | Dev | Week 7 |
| First pilot county | Bexar (San Antonio) vs. Travis (Austin) vs. Collin | TBD — Simon to pursue | Simon | Month 2 |
| Pricing model | Per-establishment/year vs. flat monthly | Per-establishment/year | Simon | Month 1 |

---

*Document version controlled in GitHub. Update version number and date on each revision.*  
*© 2026 HyCloudSolutions. Confidential.*