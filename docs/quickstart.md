# RestaurantRisk Intelligence Platform MVP Quickstart

This guide provides everything you need to run the MVP of the RestaurantRisk platform on your local machine.

## Prerequisites
- Docker & Docker Compose
- Node.js (for frontend dependency resolution if not running in container entirely)
- Python 3.11 (if running backend outside Docker)

## 1. Start the Environment

The entire stack (PostgreSQL database, FastAPI Backend, Next.js Frontend, Mocked AWS LocalStack) is orchestrated via Docker Compose.

```bash
docker compose up --build
```

**Services Started:**
- `db`: PostgreSQL 15 on port `5432`
- `backend`: FastAPI Python API on `http://localhost:8000`
- `frontend`: Next.js 14 App on `http://localhost:3000`
- `localstack`: Mocking AWS Cognito Tenant Identities

## 2. Seed Mock Data

Once the backend container shows `Application startup complete.`, open a second terminal and execute the data seeder. This creates dummy establishments, past inspections, and generates today's ML risk queues:

```bash
docker compose exec backend python scripts/seed_local_data.py
```

## 3. Experience The Platform

Open your browser to the frontend application: `http://localhost:3000`

### Persona A: The Field Inspector
- **Username**: `inspector`
- **Password**: `any string`
- **Flow**: Navigate to `/inspector/queue`. You will see the ML-prioritized list of high-risk establishments for today. Click one to log a mock inspection outcome. When submitted, the establishment disappears from your daily queue.

### Persona B: The Health Director
- **Username**: `director`
- **Password**: `any string`
- **Flow**: Navigate to `/director/dashboard`. You will see the aggregated jurisdictional KPIs and the 12-month historical risk distribution trend for your tenant.
- **Data Ingestion**: Navigate to `/director/ingestion` to see the portal for uploading bulk CSV historical records (this connects to the Python ingest job we wrote).

## Important Architectural Notes

1. **Tenant Isolation**: Both personas operate within a strict tenant boundary. The mock NextAuth login generates a dummy JWT that the FastAPI backend strictly enforces via middleware inside `src/api/middleware/auth.py`. 
2. **Explainable AI (Captum)**: Notice the percentages on the Inspector's "Risk Cards". These are generated live by the PyTorch batch job utilizing `IntegratedGradients` from the `captum` library to explain *why* the neural network scored the establishment high risk.
3. **Offline Sync**: The Inspection Form utilizes the `offlineSync.ts` IndexedDB fallback. Turn off your Wi-Fi and submit a form; it will queue locally and resync.
