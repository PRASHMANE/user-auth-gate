# app/routers/todos.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.todo import Todo
from app.models.user import User
from app.schemas.todo import TodoCreate, TodoUpdate, TodoOut
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/todos", tags=["todos"])

@router.get("/", response_model=List[TodoOut])
def list_todos(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Todo).filter(Todo.owner_id == user.id).all()

@router.post("/", response_model=TodoOut, status_code=201)
def create_todo(todo_in: TodoCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    todo = Todo(**todo_in.model_dump(), owner_id=user.id)
    db.add(todo); db.commit(); db.refresh(todo)
    return todo

@router.get("/{todo_id}", response_model=TodoOut)
def get_todo(todo_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.owner_id == user.id).first()
    if not todo:
        raise HTTPException(404, "Todo not found")
    return todo

@router.put("/{todo_id}", response_model=TodoOut)
def update_todo(todo_id: int, todo_in: TodoUpdate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.owner_id == user.id).first()
    if not todo:
        raise HTTPException(404, "Todo not found")
    for field, val in todo_in.model_dump(exclude_unset=True).items():
        setattr(todo, field, val)
    db.commit(); db.refresh(todo)
    return todo

@router.delete("/{todo_id}", status_code=204)
def delete_todo(todo_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    todo = db.query(Todo).filter(Todo.id == todo_id, Todo.owner_id == user.id).first()
    if not todo:
        raise HTTPException(404, "Todo not found")
    db.delete(todo); db.commit()