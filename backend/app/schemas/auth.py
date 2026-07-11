from pydantic import BaseModel, EmailStr
from uuid import UUID

class LoginRequest(BaseModel):
    username: str
    password: str

class UserLoginResponse(BaseModel):
    id: UUID
    name: str
    role: str

class LoginResponse(BaseModel):
    success: bool
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserLoginResponse

class UserMeResponse(BaseModel):
    id: UUID
    name: str
    email: str
    role: str

class LogoutResponse(BaseModel):
    success: bool
    message: str
