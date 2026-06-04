# 📝 Doit — Full-Stack Todo App

A production-structured todo application built with **FastAPI**, **PostgreSQL**, **JWT authentication**, **Google OAuth2**, and a **React** frontend.

---

## 📚 Table of Contents

1. [Tech Stack](#-tech-stack)
2. [Project Architecture](#-project-architecture)
3. [Folder Structure](#-folder-structure)
4. [Prerequisites](#-prerequisites)
5. [Step 1 — Project Setup](#step-1--project-setup)
6. [Step 2 — Environment Variables](#step-2--environment-variables)
7. [Step 3 — Database Setup (PostgreSQL)](#step-3--database-setup-postgresql)
8. [Step 4 — SQLAlchemy Models](#step-4--sqlalchemy-models)
9. [Step 5 — Alembic Migrations](#step-5--alembic-migrations)
10. [Step 6 — Pydantic Schemas](#step-6--pydantic-schemas)
11. [Step 7 — Auth Service (Hashing + JWT)](#step-7--auth-service-hashing--jwt)
12. [Step 8 — Auth Dependency (get_current_user)](#step-8--auth-dependency-get_current_user)
13. [Step 9 — Auth Router (Register / Login / Logout)](#step-9--auth-router-register--login--logout)
14. [Step 10 — Todo Router (CRUD)](#step-10--todo-router-crud)
15. [Step 11 — Google OAuth2](#step-11--google-oauth2)
16. [Step 12 — Main App Entry Point](#step-12--main-app-entry-point)
17. [Step 13 — Running the Backend](#step-13--running-the-backend)
18. [Step 14 — React Frontend](#step-14--react-frontend)
19. [Step 15 — Connecting Frontend to Backend (CORS)](#step-15--connecting-frontend-to-backend-cors)
20. [API Reference](#-api-reference)
21. [Auth Flow Explained](#-auth-flow-explained)
22. [Logout & Token Blacklist](#-logout--token-blacklist)
23. [Testing with Swagger UI](#-testing-with-swagger-ui)
24. [Common Errors & Fixes](#-common-errors--fixes)
25. [Production Checklist](#-production-checklist)

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | FastAPI (Python 3.11+)              |
| Database   | PostgreSQL 15+                      |
| ORM        | SQLAlchemy 2.x                      |
| Migrations | Alembic                             |
| Auth       | JWT (python-jose) + passlib/bcrypt  |
| OAuth2     | Authlib (Google)                    |
| Frontend   | React 18 + Vite                     |
| Styling    | Pure CSS (no framework)             |

---

## 🏗 Project Architecture

```
Browser / React
      │
      │  HTTP (JSON)
      ▼
  FastAPI app
      │
      ├── /auth/*   ← Register, Login, Logout, Google OAuth2
      └── /todos/*  ← CRUD (protected — requires JWT)
            │
            ▼
     PostgreSQL
      ├── users
      ├── todos
      └── token_blacklist
```

**Request lifecycle for a protected route:**

```
Client sends:  GET /todos/
               Authorization: Bearer <token>
                        │
               FastAPI calls get_current_user()
                        │
               ┌────────▼────────┐
               │ Token blacklisted? ──► 401 Token revoked
               └────────┬────────┘
                        │
               ┌────────▼────────┐
               │  JWT valid?      ──► 401 Invalid credentials
               └────────┬────────┘
                        │
               ┌────────▼────────┐
               │  User exists?    ──► 401 User not found
               └────────┬────────┘
                        │
               Route handler runs ──► 200 Response
```

---

## 📁 Folder Structure

```
fastapi-todo/
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app, middleware, routers
│   ├── config.py                # Settings loaded from .env
│   ├── database.py              # SQLAlchemy engine + session + Base
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py              # User table
│   │   ├── todo.py              # Todo table
│   │   └── token_blacklist.py   # Revoked JWT tokens
│   │
│   ├── schemas/
│   │   ├── user.py              # UserCreate, UserOut
│   │   ├── todo.py              # TodoCreate, TodoUpdate, TodoOut
│   │   └── token.py             # Token, TokenData
│   │
│   ├── routers/
│   │   ├── auth.py              # /auth/* endpoints
│   │   └── todos.py             # /todos/* endpoints
│   │
│   ├── services/
│   │   ├── auth.py              # hash_password, verify_password, create/decode JWT
│   │   └── oauth.py             # Google OAuth2 client setup
│   │
│   └── dependencies/
│       └── auth.py              # get_current_user Depends()
│
├── alembic/                     # Auto-generated migration scripts
├── alembic.ini                  # Alembic config
├── .env                         # Secrets (never commit)
├── .env.example                 # Template to share with team
├── requirements.txt
└── todo-frontend/               # React app
    ├── src/
    │   ├── App.jsx              # Full app (single file)
    │   └── main.jsx
    ├── index.html
    └── package.json
```

---

## ✅ Prerequisites

Before starting, make sure you have:

- **Python 3.11+** — `python3 --version`
- **PostgreSQL 15+** running locally — `psql --version`
- **Node.js 18+** — `node --version`
- **pip** and **npm**

---

## Step 1 — Project Setup

### Create the project

```bash
mkdir fastapi-todo && cd fastapi-todo
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
```

### Install backend dependencies

```bash
pip install fastapi uvicorn[standard] sqlalchemy asyncpg \
  alembic psycopg2-binary python-jose[cryptography] \
  passlib[bcrypt] python-multipart httpx python-dotenv \
  authlib itsdangerous pydantic-settings email-validator
```

### Save dependencies

```bash
pip freeze > requirements.txt
```

### Create the folder structure

```bash
mkdir -p app/models app/schemas app/routers app/services app/dependencies
touch app/__init__.py app/models/__init__.py
touch app/main.py app/config.py app/database.py
touch app/models/user.py app/models/todo.py app/models/token_blacklist.py
touch app/schemas/user.py app/schemas/todo.py app/schemas/token.py
touch app/routers/auth.py app/routers/todos.py
touch app/services/auth.py app/services/oauth.py
touch app/dependencies/auth.py
```

---

## Step 2 — Environment Variables

### Create `.env`

```bash
# .env — never commit this file
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/todo_db
SECRET_KEY=change-this-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

> **Generate a strong SECRET_KEY:**
> ```bash
> openssl rand -hex 32
> ```

### Create `.env.example` (safe to commit)

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/todo_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
```

### Create `app/config.py`

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## Step 3 — Database Setup (PostgreSQL)

### Create the database

```bash
psql -U postgres
```

```sql
CREATE DATABASE todo_db;
-- verify it exists:
\l
\q
```

### Create `app/database.py`

```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

engine = create_engine(settings.database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    """Dependency — yields a DB session, closes after each request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Why `get_db` as a dependency?**  
FastAPI's `Depends(get_db)` automatically opens a session before your route runs and closes it after — even if an exception occurs. This prevents connection leaks.

---

## Step 4 — SQLAlchemy Models

Models define what your PostgreSQL tables look like. SQLAlchemy maps Python classes to tables.

### `app/models/user.py`

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    email            = Column(String, unique=True, index=True, nullable=False)
    username         = Column(String, unique=True, index=True, nullable=False)
    hashed_password  = Column(String, nullable=True)   # nullable for OAuth users
    is_active        = Column(Boolean, default=True)
    oauth_provider   = Column(String, nullable=True)   # "google" or None
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    todos = relationship("Todo", back_populates="owner", cascade="all, delete")
```

### `app/models/todo.py`

```python
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Todo(Base):
    __tablename__ = "todos"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, nullable=False)
    description = Column(String, nullable=True)
    completed   = Column(Boolean, default=False)
    owner_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="todos")
```

### `app/models/token_blacklist.py`

```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database import Base

class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id         = Column(Integer, primary_key=True, index=True)
    token      = Column(String, unique=True, index=True, nullable=False)
    revoked_at = Column(DateTime(timezone=True), server_default=func.now())
```

> **Why a token blacklist?**  
> JWTs are stateless — the server can't "cancel" them once issued. By storing revoked tokens in this table and checking it on every request, logout actually works before the token expires.

---

## Step 5 — Alembic Migrations

Alembic tracks database schema changes like Git tracks code.

### Initialize Alembic

```bash
alembic init alembic
```

### Edit `alembic/env.py`

Find `target_metadata = None` and replace the block:

```python
# Add these imports at the top of alembic/env.py
from app.database import Base
from app.models import user, todo, token_blacklist   # triggers model registration

# Replace:
# target_metadata = None
# With:
target_metadata = Base.metadata
```

### Edit `alembic.ini`

```ini
# Find this line and update it:
sqlalchemy.url = postgresql://postgres:yourpassword@localhost:5432/todo_db
```

### Run migrations

```bash
# Generate migration file from your models
alembic revision --autogenerate -m "initial tables"

# Apply migration to database
alembic upgrade head

# Verify tables were created
psql -U postgres -d todo_db -c "\dt"
```

**Useful Alembic commands:**

```bash
alembic history               # show all migrations
alembic current               # show current revision
alembic downgrade -1          # roll back one migration
alembic upgrade head          # apply all pending migrations
```

---

## Step 6 — Pydantic Schemas

Schemas define what data comes **in** (request body) and goes **out** (response). They are separate from models — models talk to the DB, schemas talk to the client.

### `app/schemas/user.py`

```python
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserOut(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool

    class Config:
        from_attributes = True   # allows conversion from SQLAlchemy model
```

### `app/schemas/token.py`

```python
from pydantic import BaseModel
from typing import Optional

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[int] = None
```

### `app/schemas/todo.py`

```python
from pydantic import BaseModel
from typing import Optional

class TodoCreate(BaseModel):
    title: str
    description: Optional[str] = None

class TodoUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None

class TodoOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    completed: bool
    owner_id: int
    created_at: str | None = None

    class Config:
        from_attributes = True
```

---

## Step 7 — Auth Service (Hashing + JWT)

All authentication logic lives here — independent of FastAPI so it's easy to test.

### `app/services/auth.py`

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    payload = {
        "sub": str(user_id),
        "exp": expire,
        "type": "access"
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)

def decode_access_token(token: str) -> int:
    """Decodes token and returns user_id. Raises JWTError if invalid."""
    payload = jwt.decode(
        token, settings.secret_key, algorithms=[settings.algorithm]
    )
    user_id = payload.get("sub")
    if not user_id:
        raise JWTError("Missing subject claim")
    return int(user_id)
```

**Key concepts:**

| Concept | Detail |
|---------|--------|
| `bcrypt` | One-way hashing — even if your DB leaks, passwords are safe |
| `sub` claim | Standard JWT field for the subject (user ID) |
| `exp` claim | Expiry time — JWT library validates this automatically |
| `HS256` | HMAC-SHA256 signing algorithm |

---

## Step 8 — Auth Dependency (get_current_user)

This is the function FastAPI calls automatically on every protected route via `Depends()`.

### `app/dependencies/auth.py`

```python
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
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Check if token was explicitly revoked (logout)
    revoked = db.query(TokenBlacklist).filter(
        TokenBlacklist.token == token
    ).first()
    if revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked. Please log in again.",
        )

    # Decode and validate the JWT
    try:
        user_id = decode_access_token(token)
    except JWTError:
        raise credentials_error

    # Fetch user from DB
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise credentials_error

    return user
```

**How `Depends()` chains work:**

```
Route handler
    └── Depends(get_current_user)
            ├── Depends(oauth2_scheme)  → extracts token from Authorization header
            └── Depends(get_db)         → opens DB session
```

FastAPI resolves the entire dependency tree before calling your route.

---

## Step 9 — Auth Router (Register / Login / Logout)

### `app/routers/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.token_blacklist import TokenBlacklist
from app.schemas.user import UserCreate, UserOut
from app.schemas.token import Token
from app.services.auth import hash_password, verify_password, create_access_token
from app.dependencies.auth import get_current_user, oauth2_scheme

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=201)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.query(User).filter(User.username == user_in.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=user_in.email,
        username=user_in.username,
        hashed_password=hash_password(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer"}


@router.post("/logout")
def logout(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.add(TokenBlacklist(token=token))
    db.commit()
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
```

> **`OAuth2PasswordRequestForm`** expects `application/x-www-form-urlencoded` with fields `username` and `password`. This is the OAuth2 spec. Your frontend must send form data for login, not JSON.

---

## Step 10 — Todo Router (CRUD)

Every endpoint is protected. The `owner_id == current_user.id` filter ensures users can only access their own todos.

### `app/routers/todos.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoUpdate, TodoOut
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/todos", tags=["Todos"])


@router.get("/", response_model=List[TodoOut])
def list_todos(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return db.query(Todo).filter(Todo.owner_id == user.id).all()


@router.post("/", response_model=TodoOut, status_code=201)
def create_todo(
    todo_in: TodoCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    todo = Todo(**todo_in.model_dump(), owner_id=user.id)
    db.add(todo)
    db.commit()
    db.refresh(todo)
    return todo


@router.get("/{todo_id}", response_model=TodoOut)
def get_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    todo = db.query(Todo).filter(
        Todo.id == todo_id, Todo.owner_id == user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    return todo


@router.put("/{todo_id}", response_model=TodoOut)
def update_todo(
    todo_id: int,
    todo_in: TodoUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    todo = db.query(Todo).filter(
        Todo.id == todo_id, Todo.owner_id == user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    for field, value in todo_in.model_dump(exclude_unset=True).items():
        setattr(todo, field, value)
    db.commit()
    db.refresh(todo)
    return todo


@router.delete("/{todo_id}", status_code=204)
def delete_todo(
    todo_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    todo = db.query(Todo).filter(
        Todo.id == todo_id, Todo.owner_id == user.id
    ).first()
    if not todo:
        raise HTTPException(status_code=404, detail="Todo not found")
    db.delete(todo)
    db.commit()
```

---

## Step 11 — Google OAuth2

### Get Google credentials

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add authorized redirect URI: `http://localhost:8000/auth/google/callback`
7. Copy the **Client ID** and **Client Secret** into your `.env`

### `app/services/oauth.py`

```python
from authlib.integrations.starlette_client import OAuth
from app.config import settings

oauth = OAuth()

oauth.register(
    name="google",
    client_id=settings.google_client_id,
    client_secret=settings.google_client_secret,
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)
```

### Add Google routes to `app/routers/auth.py`

```python
# Add these imports at the top of auth.py
from starlette.requests import Request
from starlette.responses import RedirectResponse
from app.services.oauth import oauth

# Add these routes at the bottom of the router

@router.get("/google")
async def google_login(request: Request):
    """Redirect user to Google's consent screen."""
    redirect_uri = settings.google_redirect_uri
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Google calls this after user consents. Exchange code for user info."""
    google_token = await oauth.google.authorize_access_token(request)
    user_info = google_token.get("userinfo")

    # Find existing user or create new one (upsert)
    user = db.query(User).filter(User.email == user_info["email"]).first()
    if not user:
        user = User(
            email=user_info["email"],
            username=user_info["email"].split("@")[0],
            oauth_provider="google",
            hashed_password=None,   # OAuth users have no password
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    token = create_access_token(user.id)

    # Redirect to frontend with token in query string
    return RedirectResponse(
        url=f"http://localhost:5173?access_token={token}"
    )
```

---

## Step 12 — Main App Entry Point

### `app/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.config import settings
from app.routers import auth, todos

app = FastAPI(
    title="Doit — Todo API",
    version="1.0.0",
    description="Full-stack todo app with JWT + Google OAuth2",
)

# Session middleware required for OAuth2 state parameter (CSRF protection)
app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)

# CORS — allows React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(todos.router)

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
```

---

## Step 13 — Running the Backend

```bash
# Make sure your venv is active
source venv/bin/activate

# Start the server with auto-reload
uvicorn app.main:app --reload --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

Open **http://localhost:8000/docs** — you'll see the full Swagger UI with all endpoints.

---

## Step 14 — React Frontend

### Create the Vite project

```bash
npm create vite@latest todo-frontend -- --template react
cd todo-frontend
npm install
```

### Add the app

Copy `TodoApp.jsx` into `src/App.jsx`.

Edit `src/main.jsx` — remove any CSS imports:

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

### Run the frontend

```bash
npm run dev
```

Open **http://localhost:5173**

---

## Step 15 — Connecting Frontend to Backend (CORS)

CORS is already configured in `main.py`. The frontend sends requests to `http://localhost:8000` and includes the JWT automatically:

```js
// Every protected request includes this header:
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token is stored in `localStorage` after login and sent on every API call.

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/auth/register` | ✗ | `UserCreate` (JSON) | Create account |
| `POST` | `/auth/login` | ✗ | form: `username`, `password` | Get JWT token |
| `POST` | `/auth/logout` | ✓ | — | Revoke token |
| `GET` | `/auth/me` | ✓ | — | Get current user |
| `GET` | `/auth/google` | ✗ | — | Start Google login |
| `GET` | `/auth/google/callback` | ✗ | — | Google OAuth2 callback |

### Todos

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `GET` | `/todos/` | ✓ | — | List all your todos |
| `POST` | `/todos/` | ✓ | `TodoCreate` (JSON) | Create a todo |
| `GET` | `/todos/{id}` | ✓ | — | Get a single todo |
| `PUT` | `/todos/{id}` | ✓ | `TodoUpdate` (JSON) | Update a todo |
| `DELETE` | `/todos/{id}` | ✓ | — | Delete a todo |

### Request/Response examples

**Register:**
```json
POST /auth/register
{
  "email": "alice@example.com",
  "username": "alice",
  "password": "secretpass"
}

→ 201
{
  "id": 1,
  "email": "alice@example.com",
  "username": "alice",
  "is_active": true
}
```

**Login:**
```
POST /auth/login
Content-Type: application/x-www-form-urlencoded

username=alice&password=secretpass

→ 200
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

**Create todo:**
```json
POST /todos/
Authorization: Bearer eyJhbGci...

{
  "title": "Learn FastAPI",
  "description": "Build a todo app"
}

→ 201
{
  "id": 1,
  "title": "Learn FastAPI",
  "description": "Build a todo app",
  "completed": false,
  "owner_id": 1
}
```

---

## 🔐 Auth Flow Explained

### Email/Password login

```
1. User submits username + password
2. FastAPI looks up user by username
3. verify_password() compares plain password against bcrypt hash
4. create_access_token() encodes {sub: user_id, exp: now+30min} → signs with SECRET_KEY
5. Client stores token in localStorage
6. Every subsequent request includes: Authorization: Bearer <token>
7. get_current_user() decodes and validates on each protected request
```

### Google OAuth2 flow

```
1. User visits GET /auth/google
2. FastAPI redirects to Google consent screen
3. User approves → Google redirects to /auth/google/callback?code=...
4. FastAPI exchanges code for user profile via Google API
5. If user exists → fetch; if not → create with oauth_provider="google"
6. Issue JWT same as regular login
7. Redirect browser to frontend with ?access_token=...
```

---

## 🚪 Logout & Token Blacklist

JWT tokens are **stateless** — once issued, the server cannot cancel them. The solution is a blacklist table.

**Logout flow:**
```
1. Client sends POST /auth/logout with token in header
2. get_current_user() validates the token (still works)
3. Token is written to token_blacklist table
4. Client deletes token from localStorage
5. Any future request with the old token → get_current_user() finds it in blacklist → 401
```

**Cleanup (optional for production):**

```sql
-- Run periodically to remove expired tokens (no need to reject them anyway)
DELETE FROM token_blacklist
WHERE revoked_at < NOW() - INTERVAL '1 day';
```

---

## 🧪 Testing with Swagger UI

1. Open **http://localhost:8000/docs**
2. Use `POST /auth/register` to create a user
3. Use `POST /auth/login` — enter username and password in the form
4. Copy the `access_token` from the response
5. Click **Authorize** (🔒 button, top right)
6. Enter: `Bearer <your_token>` and click Authorize
7. Now all protected endpoints work — try `GET /todos/`

---

## 🐛 Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `connection refused` | PostgreSQL not running | `brew services start postgresql` |
| `relation "users" does not exist` | Migration not run | `alembic upgrade head` |
| `422 Unprocessable Entity` on login | Sending JSON instead of form data | Login uses `application/x-www-form-urlencoded` |
| `401 Token has been revoked` | Using token after logout | Log in again to get a new token |
| `ImportError: No module named 'app'` | Wrong working directory | Run `uvicorn` from the `fastapi-todo/` root |
| CORS error in browser | Backend missing CORS config | Ensure `CORSMiddleware` is added in `main.py` |
| Google OAuth: `redirect_uri_mismatch` | URI mismatch | URI in Google Console must exactly match `.env` |

---

## 🚀 Production Checklist

Before deploying:

- [ ] Generate a strong `SECRET_KEY` via `openssl rand -hex 32`
- [ ] Set `ACCESS_TOKEN_EXPIRE_MINUTES` to a reasonable value (15–30 min)
- [ ] Store all secrets in environment variables — never in code
- [ ] Add `HTTPS` — JWT over HTTP is insecure
- [ ] Replace `localhost` origins in CORS with your actual domain
- [ ] Update Google OAuth2 redirect URI to your production domain
- [ ] Add a cron job to clean expired tokens from `token_blacklist`
- [ ] Use connection pooling (e.g. `PgBouncer`) for the DB
- [ ] Set up proper logging and error monitoring (e.g. Sentry)
- [ ] Run behind a reverse proxy (Nginx) with rate limiting

---

## 📦 Full `requirements.txt`

```
fastapi
uvicorn[standard]
sqlalchemy
asyncpg
alembic
psycopg2-binary
python-jose[cryptography]
passlib[bcrypt]
python-multipart
httpx
python-dotenv
authlib
itsdangerous
pydantic-settings
email-validator
```

---

## 🗂 Quick Reference — All Files

| File | Purpose |
|------|---------|
| `app/main.py` | App factory, middleware, router registration |
| `app/config.py` | Typed settings from `.env` |
| `app/database.py` | Engine, session, `get_db` dependency |
| `app/models/user.py` | `users` table |
| `app/models/todo.py` | `todos` table |
| `app/models/token_blacklist.py` | `token_blacklist` table |
| `app/schemas/user.py` | `UserCreate`, `UserOut` |
| `app/schemas/todo.py` | `TodoCreate`, `TodoUpdate`, `TodoOut` |
| `app/schemas/token.py` | `Token`, `TokenData` |
| `app/services/auth.py` | `hash_password`, `verify_password`, `create_access_token`, `decode_access_token` |
| `app/services/oauth.py` | Google OAuth2 client |
| `app/dependencies/auth.py` | `get_current_user` |
| `app/routers/auth.py` | `/auth/*` endpoints |
| `app/routers/todos.py` | `/todos/*` endpoints |
| `todo-frontend/src/App.jsx` | Full React frontend |

---

*Built step by step with FastAPI + PostgreSQL + React.*
