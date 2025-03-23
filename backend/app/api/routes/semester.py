import uuid
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel, Field, Relationship, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Message, Semesters, SemestersCreate, SemestersPublic, SemestersPublicList, SemestersUpdate


# API Routes

router = APIRouter(prefix="/semesters", tags=["Semester"])

@router.get("/", response_model=SemestersPublicList)
def read_semesters(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100, search: str = None,
    sortBy: str = None,
    sortOrder: str = "asc"
) -> Any:
    """
    Retrieve semesters.
    """
    query = session.query(Semesters).filter(Semesters.is_active == True)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Semesters.semester_name.ilike(search_term)
        )

    if sortBy:
        sort_column = getattr(Semesters, sortBy, None)
        if sort_column:
            if sortOrder and sortOrder.lower() == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    items = query.offset(skip).limit(limit).all()
    return SemestersPublicList(data=items, count=total_count)

@router.get("/current", response_model=SemestersPublic)
def get_current_semester(
    session: SessionDep, current_user: CurrentUser
) -> Any:
    """
    Get the current active semester based on the current date.
    """
    now = datetime.now()
    current_semester = session.query(Semesters).filter(
        Semesters.start_date <= now,
        Semesters.end_date >= now,
        Semesters.is_active == True
    ).first()
    
    if not current_semester:
        raise HTTPException(status_code=404, detail="No active semester found for the current date")
    
    return current_semester

@router.post("/", response_model=SemestersPublic)
def create_semester(*, session: SessionDep, current_user: CurrentUser, semester_in: SemestersCreate) -> Any:
    """
    Create a new semester.
    """
    # Validate dates
    if semester_in.start_date >= semester_in.end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Check for overlapping semesters
    overlapping = session.query(Semesters).filter(
        Semesters.is_active == True,
        Semesters.start_date <= semester_in.end_date,
        Semesters.end_date >= semester_in.start_date
    ).first()
    
    if overlapping:
        raise HTTPException(status_code=400, detail="This semester overlaps with an existing semester")
    
    semester = Semesters.model_validate(
        semester_in, 
        update={
            "created_by_id": current_user.id, 
            "updated_by_id": current_user.id
        }
    )
    session.add(semester)
    session.commit()
    session.refresh(semester)
    return semester

@router.put("/{id}", response_model=SemestersPublic)
def update_semester(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID, semester_in: SemestersUpdate) -> Any:
    """
    Update a semester.
    """
    semester = session.get(Semesters, id)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    update_dict = semester_in.model_dump(exclude_unset=True)
    
    # Check dates if they are being updated
    start_date = update_dict.get("start_date", semester.start_date)
    end_date = update_dict.get("end_date", semester.end_date)
    
    if start_date >= end_date:
        raise HTTPException(status_code=400, detail="Start date must be before end date")
    
    # Check for overlapping semesters if dates are being changed
    if "start_date" in update_dict or "end_date" in update_dict:
        overlapping = session.query(Semesters).filter(
            Semesters.semester_id != id,
            Semesters.is_active == True,
            Semesters.start_date <= end_date,
            Semesters.end_date >= start_date
        ).first()
        
        if overlapping:
            raise HTTPException(status_code=400, detail="This update would cause overlap with an existing semester")
    
    # Add update timestamp and user
    update_dict["updated_at"] = datetime.now()
    update_dict["updated_by_id"] = current_user.id
    
    semester.sqlmodel_update(update_dict)
    session.add(semester)
    session.commit()
    session.refresh(semester)
    return semester

@router.get("/{id}", response_model=SemestersPublic)
def read_semester(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get semester by ID.
    """
    semester = session.get(Semesters, id)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    if not current_user.is_superuser and not semester.is_active:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    return semester

@router.delete("/{id}")
def delete_semester(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a semester (soft delete by setting is_active to False).
    """
    semester = session.get(Semesters, id)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    semester.is_active = False
    semester.updated_at = datetime.now()
    semester.updated_by_id = current_user.id
    
    session.add(semester)
    session.commit()
    session.refresh(semester)
    return Message(message="Semester is deleted successfully")