from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timezone
from src.api.routes import queue, inspections, dashboard, establishments, ingestion, tenants, users, analytics

from src.db.database import get_db

app = FastAPI(title="RestaurantRisk Intelligence API")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
def health_check(db: Session = Depends(get_db)):
    """Production health check — verifies DB connectivity for the ALB."""
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "status": "healthy" if db_ok else "degraded",
        "db": db_ok,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Register Core API routers (Phase 3 & 4)
app.include_router(queue.router)
app.include_router(inspections.router)
app.include_router(dashboard.router)
app.include_router(establishments.router)
app.include_router(ingestion.router)
app.include_router(tenants.router)
app.include_router(users.router)
app.include_router(analytics.router)

