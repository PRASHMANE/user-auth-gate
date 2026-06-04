# app/main.py
from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from app.config import settings
from app.routers import auth, todos
from fastapi.middleware.cors import CORSMiddleware

#from app.database import engine, Base  # Adjust imports based on your structure
#from app.models import User


#Base.metadata.create_all(bind=engine)

app = FastAPI(title="Todo API", version="1.0.0")

app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(todos.router)

@app.get("/health")
def health():
    return {"status": "ok"}