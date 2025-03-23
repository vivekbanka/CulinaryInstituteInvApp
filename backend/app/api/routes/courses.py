import uuid
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel, Field, Relationship, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Courses, Message, CoursesCreate, CoursesPublic, CoursesPublicList, CoursesUpdate, Semesters



# API Routes

router = APIRouter(prefix="/courses", tags=["Course"])

@router.get("/", response_model=CoursesPublicList)
def read_courses(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100, search: str = None,
    sortBy: str = None, sortOrder: str = "asc", semester_id: uuid.UUID = None
) -> Any:
    """
    Retrieve courses with optional filtering by semester.
    """
    query = session.query(Courses).filter(Courses.is_active == True)
    
    # Filter by semester if provided
    if semester_id:
        query = query.filter(Courses.semester_id == semester_id)
    
    # Search by name or description
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Courses.course_name.ilike(search_term)) | 
            (Courses.course_description.ilike(search_term))
        )

    # Sorting
    if sortBy:
        sort_column = getattr(Courses, sortBy, None)
        if sort_column:
            if sortOrder and sortOrder.lower() == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    items = query.offset(skip).limit(limit).all()
    return CoursesPublicList(data=items, count=total_count)

@router.post("/", response_model=CoursesPublic)
def create_course(*, session: SessionDep, current_user: CurrentUser, course_in: CoursesCreate) -> Any:
    """
    Create a new course associated with a semester.
    """
    # Verify the semester exists
    semester = session.get(Semesters, course_in.semester_id)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    # Verify the semester is active
    if not semester.is_active:
        raise HTTPException(status_code=400, detail="Cannot add course to an inactive semester")
    
    # Create the course
    course = Courses.model_validate(
        course_in, 
        update={
            "created_by_id": current_user.id, 
            "updated_by_id": current_user.id
        }
    )
    session.add(course)
    session.commit()
    session.refresh(course)
    return course

@router.put("/{id}", response_model=CoursesPublic)
def update_course(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID, course_in: CoursesUpdate) -> Any:
    """
    Update a course.
    """
    course = session.get(Courses, id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    update_dict = course_in.model_dump(exclude_unset=True)
    
    # If semester_id is being updated, verify the new semester exists and is active
    if "semester_id" in update_dict:
        semester = session.get(Semesters, update_dict["semester_id"])
        if not semester:
            raise HTTPException(status_code=404, detail="Semester not found")
        if not semester.is_active:
            raise HTTPException(status_code=400, detail="Cannot move course to an inactive semester")
    
    # Add update timestamp and user
    update_dict["updated_at"] = datetime.now()
    update_dict["updated_by_id"] = current_user.id
    
    course.sqlmodel_update(update_dict)
    session.add(course)
    session.commit()
    session.refresh(course)
    return course

@router.get("/{id}", response_model=CoursesPublic)
def read_course(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get course by ID.
    """
    course = session.get(Courses, id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if not current_user.is_superuser and not course.is_active:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    return course

@router.get("/semester/{semester_id}", response_model=CoursesPublicList)
def read_courses_by_semester(
    *, session: SessionDep, current_user: CurrentUser, semester_id: uuid.UUID, 
    skip: int = 0, limit: int = 100
) -> Any:
    """
    Get all courses for a specific semester.
    """
    # Verify the semester exists
    semester = session.get(Semesters, semester_id)
    if not semester:
        raise HTTPException(status_code=404, detail="Semester not found")
    
    # Get active courses for this semester
    query = session.query(Courses).filter(
        Courses.semester_id == semester_id,
        Courses.is_active == True
    )
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    items = query.offset(skip).limit(limit).all()
    return CoursesPublicList(data=items, count=total_count)

@router.delete("/{id}")
def delete_course(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a course (soft delete by setting is_active to False).
    """
    course = session.get(Courses, id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    course.is_active = False
    course.updated_at = datetime.now()
    course.updated_by_id = current_user.id
    
    session.add(course)
    session.commit()
    session.refresh(course)
    return Message(message="Course is deleted successfully")