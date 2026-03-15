from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import queue, inspections, dashboard, establishments, ingestion, tenants, users

app = FastAPI(title="RestaurantRisk Intelligence API")

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


# Register Core API routers (Phase 3 & 4)
app.include_router(queue.router)
app.include_router(inspections.router)
app.include_router(dashboard.router)
app.include_router(establishments.router)
app.include_router(ingestion.router)
app.include_router(tenants.router)
app.include_router(users.router)
