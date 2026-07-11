from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional

class CrimeTypeBase(BaseModel):
    name: str = Field(..., example="Theft (Sec 379 IPC)")
    description: Optional[str] = Field(None, example="Dishonest removal of movable property")

class CrimeType(CrimeTypeBase):
    id: UUID

    class Config:
        from_attributes = True
