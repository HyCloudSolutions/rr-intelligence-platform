from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
from pydantic import BaseModel
from datetime import date

from src.db.database import get_db
from src.api.middleware.auth import get_current_tenant_id, get_current_user_role

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])

class ForecastItem(BaseModel):
    zip_code: str
    month: date
    avg_score: float

@router.get("/forecast", response_model=List[ForecastItem])
def get_load_forecast(
    db: Session = Depends(get_db),
    tenant_id: str = Depends(get_current_tenant_id),
    role: str = Depends(get_current_user_role),
):
    """
    Returns aggregated historical averages of risk scores grouped by ZIP and month 
    to forecast future workload hotspots.
    """
    if role != "director":
        raise HTTPException(status_code=403, detail="Only directors can view workload forecasts.")

    # Using raw SQL for efficient DATE_TRUNC and aggregate grouping
    query = text("""
        SELECT 
            e.zip as zip_code, 
            DATE_TRUNC('month', d.score_date) as month,
            AVG(d.risk_score) as avg_score
        FROM daily_risk_scores d
        JOIN establishments e ON d.establishment_id = e.id
        WHERE d.tenant_id = :tenant_id
        GROUP BY e.zip, month
        ORDER BY month ASC, avg_score DESC;
    """)
    
    try:
        result = db.execute(query, {"tenant_id": tenant_id})
        forecasts = []
        for row in result:
             forecasts.append(
                 ForecastItem(
                     zip_code=row.zip_code if row.zip_code else "Unknown",
                     month=row.month.date() if hasattr(row.month, 'date') else row.month,
                     avg_score=round(float(row.avg_score), 2)
                 )
             )
        return forecasts
    except Exception as e:
        # Fallback or error logging
        print(f"Error generating forecast: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to calculate forecast metrics.")
