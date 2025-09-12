from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional, Any
from bson import ObjectId

class User(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    full_name: str
    email: str
    agency_name: str
    password_hash: str
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class AuditGroup(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    url: str
    first_run_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class Audit(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    group_id: str
    user_id: str
    parameters: Optional[Any] = None
    results: Optional[Any] = None
    run_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    progress: str = "Queued"
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class ScheduledAudit(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    user_id: str
    group_id: str
    cron_expression: str
    next_run_at: Optional[datetime] = None
    last_run_at: Optional[datetime] = None
    active: bool = True
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True