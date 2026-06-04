# app/dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist
from app.services.auth import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    err = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    # 1. Check if token was revoked (logout)
    revoked = db.query(TokenBlacklist).filter(
        TokenBlacklist.token == token
    ).first()
    if revoked:
        raise HTTPException(401, detail="Token has been revoked. Please log in again.")

    # 2. Decode and return user
    try:
        user_id = decode_access_token(token)
    except JWTError:
        raise err

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise err
    return user