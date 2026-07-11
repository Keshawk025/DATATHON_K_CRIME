from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logger import setup_logging
from app.core.exceptions import (
    http_exception_handler,
    validation_exception_handler,
    general_exception_handler
)

# Initialize logging
setup_logging()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for the AI-Driven Crime Analytics & Visualization Platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom exception handlers
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

from app.api import auth, dashboard, firs, criminals, districts, crime_types, alerts, heatmap, network, ai, ml, predict

app.include_router(auth.router, prefix="/auth", tags=["authentication"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(firs.router, prefix="/firs", tags=["firs"])
app.include_router(criminals.router, prefix="/criminals", tags=["criminals"])
app.include_router(districts.router, prefix="/districts", tags=["districts"])
app.include_router(crime_types.router, prefix="/crime-types", tags=["crime-types"])
app.include_router(alerts.router, prefix="/alerts", tags=["alerts"])
app.include_router(heatmap.router, prefix="/heatmap", tags=["heatmap"])
app.include_router(network.router, prefix="/network", tags=["network"])
app.include_router(ai.router, prefix="/ai", tags=["ai"])
app.include_router(ml.router, prefix="/ml", tags=["ml"])
app.include_router(predict.router, prefix="/predict", tags=["predict"])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the AI-Driven Crime Analytics & Visualization API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok"}
