import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import LocationsBase, LocationsCreate, LocationsPublic, LocationsUpdate, Locations, Message, LocationsPublicList, Message

router = APIRouter(prefix="/locations", tags=["Location"])

@router.get("/", response_model=LocationsPublicList)
def read_locations(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100, search: str = None,
    sortBy: str = None,
    sortOrder: str = "asc"
) -> Any:
    """
    Retrieve locations.
    """
    query = session.query(Locations).filter(Locations.location_is_active == True)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            Locations.location_name.ilike(search_term)
        )

    if sortBy:
        sort_column = getattr(Locations, sortBy, None)
        if sort_column:
            if sortOrder and sortOrder.lower() == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    items = query.offset(skip).limit(limit).all()
    return LocationsPublicList(data=items, count=total_count)

@router.post("/", response_model=LocationsPublic)
def create_location(*, session: SessionDep, current_user: CurrentUser, location_in: LocationsCreate) -> Any:
    """
    Create a new location.
    """
    location = Locations.model_validate(location_in, update={"created_by_id": current_user.id, "updated_by_id": current_user.id})
    session.add(location)
    session.commit()
    session.refresh(location)
    return location

@router.put("/{id}", response_model=LocationsPublic)
def update_location(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID, location_in: LocationsUpdate) -> Any:
    """
    Update a location.
    """
    location = session.get(Locations, id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    update_dict = location_in.model_dump(exclude_unset=True)
    location.sqlmodel_update(update_dict)
    session.add(location)
    session.commit()
    session.refresh(location)
    return location

@router.get("/{id}", response_model=LocationsPublic)
def read_location(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get location by ID.
    """
    location = session.get(Locations, id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    if not current_user.is_superuser and not location.location_is_active:
        raise HTTPException(status_code=400, detail="Not enough permission")
    return location

@router.delete("/{id}")
def delete_location(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a location (soft delete by setting location_is_active to False).
    """
    location = session.get(Locations, id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    location.location_is_active = False
    session.add(location)
    session.commit()
    session.refresh(location)
    return Message(message="Location is deleted successfully")