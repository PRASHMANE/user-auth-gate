
from pydantic import BaseModel, EmailStr
from typing import Optional

# app/schemas/token.py
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None