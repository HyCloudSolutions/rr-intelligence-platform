# Quickstart: 001-predictive-inspection-queue

**Feature**: [spec.md](../../specs/001-predictive-inspection-queue/spec.md)
**Date**: 2026-03-05

## Local E2E Development Environment

This project utilizes `docker-compose` to run the entire RestaurantRisk Intelligence Platform locally, mocking necessary AWS services where applicable.

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- Python 3.11+
- Poetry (for Python dependency management)
- AWS CLI (configured with dummy credentials for LocalStack)

### 1. Start Infrastructure

From the repository root, start the local infrastructure (PostgreSQL, LocalStack):

```bash
docker-compose up -d db localstack
```

### 2. Run Database Migrations

Initialize the tenant-isolated schema:

```bash
cd backend
poetry run alembic upgrade head
```

### 3. Seed Mock Data & Run Initial ML Job

Load the dummy health department dataset and compute the first batch of risk scores:

```bash
cd backend
poetry run python -m scripts.seed_local_data
poetry run python -m jobs.batch_score
```

### 4. Start the Backend API (FastAPI)

```bash
cd backend
poetry run uvicorn app.main:app --reload --port 8000
```
*API Docs available at: http://localhost:8000/docs*

### 5. Start the Frontend (Next.js)

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```
*Web app available at: http://localhost:3000*

### 6. Login Credentials (Local)

The local seed script provisions two test users:
- **Inspector**: `inspector@local.health.gov` / `password123`
- **Director**: `director@local.health.gov` / `password123`
