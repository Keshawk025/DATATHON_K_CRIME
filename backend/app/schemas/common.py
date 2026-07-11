from pydantic import BaseModel
from typing import Optional, Any, Generic, TypeVar

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    success: bool
    message: str
    data: Optional[T] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    errors: Optional[Any] = None
