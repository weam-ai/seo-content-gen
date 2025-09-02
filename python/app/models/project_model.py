from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from bson import ObjectId
from app.models.schemas import SystemPromptsTypeEnum

class Project(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    detailedsitemap: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    language: Optional[str] = None
    location: Optional[str] = None
    targeted_audience: Optional[str] = None
    guideline_description: Optional[str] = None
    website_url: Optional[str] = None
    keywords: Optional[Any] = None
    competitors_websites: Optional[str] = None
    organization_archetype: Optional[str] = None
    brand_spokesperson: Optional[str] = None
    most_important_thing: Optional[str] = None
    unique_differentiator: Optional[str] = None
    author_bio: Optional[str] = None
    guideline_id: Optional[str] = None
    deleted_at: Optional[datetime] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True 

class Article(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    projectId: str
    name: Optional[str] = None
    generated_outline: Optional[str] = None
    secondary_keywords: Optional[List[str]] = None
    keywords: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True


class Guideline(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    description: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True

class SystemPrompt(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(ObjectId()), alias="_id")
    name: str
    type: str
    description: Optional[str] = None
    is_default: bool = False
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
