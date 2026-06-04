# app/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist
from app.schemas.user import UserCreate, UserOut
from app.schemas.token import Token
from app.services.auth import hash_password, verify_password, create_access_token
from app.dependencies.auth import get_current_user, oauth2_scheme
# Add to app/routers/auth.py
from starlette.requests import Request
from starlette.responses import RedirectResponse
from app.services.oauth import oauth
from app.config import settings
router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=201)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(400, "Email already registered")
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(400, "Username already taken")
    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hash_password(user_in.password)
    )
    db.add(user); db.commit(); db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(401, "Invalid username or password")
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/logout")
def logout(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Blacklist the token — it will be rejected on every future request
    db.add(TokenBlacklist(token=token))
    db.commit()
    return {"message": "Successfully logged out"}

@router.get("/google")
async def google_login(request: Request):
    # Redirect user to Google's consent screen
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    # Google calls us back here with ?code=...
    google_token = await oauth.google.authorize_access_token(request)
    user_info = google_token.get("userinfo")

    # Upsert: find existing user or create new one
    user = db.query(User).filter(User.email == user_info["email"]).first()
    if not user:
        user = User(
            email=user_info["email"],
            username=user_info["email"].split("@")[0],
            oauth_provider="google",
            hashed_password=None,   # no password for OAuth users
        )
        db.add(user); db.commit(); db.refresh(user)

    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}