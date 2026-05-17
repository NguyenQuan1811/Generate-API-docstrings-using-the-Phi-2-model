from pydantic import BaseModel, EmailStr
from typing import Optional

class UserRegister(BaseModel):
    username: str
    password: str
    email: EmailStr

class UserLogin(BaseModel):
    username: str
    password: str

class CodeItem(BaseModel):
    content: str
    docstring: Optional[str] = ""

class ExportRequest(BaseModel):
    items: list[dict]