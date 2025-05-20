from fastapi import APIRouter, Query
from typing import List, Optional

router = APIRouter(prefix="/trends", tags=["trends"])

@router.get("/")
async def get_trends(category: Optional[str] = None, limit: int = 10):
    # Add your trends fetching logic here
    return {"trends": ["trend1", "trend2"]}

@router.get("/categories")
async def get_categories():
    # Add categories fetching logic
    return {"categories": ["AI", "Machine Learning", "Data Science"]}