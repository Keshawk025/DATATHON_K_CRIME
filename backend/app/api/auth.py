from datetime import timedelta
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core import security
from app.core.config import settings
from app.database.session import get_db
from app.models.models import User
from app.api.deps import get_current_user
from app.schemas.auth import LoginRequest, LoginResponse, UserMeResponse, LogoutResponse

router = APIRouter()

@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not security.verify_password(login_data.password, user.hashed_password):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "success": False,
                "message": "Invalid username or password"
            }
        )
    
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        subject=user.id,
        expires_delta=expires_delta
    )
    
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": {
            "id": str(user.id),
            "name": user.username,
            "role": user.role
        }
    }

@router.get("/me", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "name": current_user.username,
        "email": current_user.email,
        "role": current_user.role
    }

@router.post("/logout", response_model=LogoutResponse)
def logout():
    return {
        "success": True,
        "message": "Logged out successfully"
    }
