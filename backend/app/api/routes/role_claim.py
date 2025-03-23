import uuid
from typing import Any, List
from datetime import datetime
from sqlalchemy import or_
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlmodel import func, select, Session

from app.api.deps import CurrentUser, SessionDep

from app.models import (
    RoleClaims, RolesClaimsCreate, RolesClaimsUpdate, RolesClaimsPublicList,
    RolesClaimsPublic, Roles, Message
)

router = APIRouter(prefix="/role-claims", tags=["RoleClaims"])


@router.get("/", response_model=RolesClaimsPublicList)
def read_role_claims(
    session: SessionDep, 
    current_user: CurrentUser,
    skip: int = 0, 
    limit: int = 100,
    search: str = None,
    sortBy: str = None,
    sortOrder: str = "asc"
) -> Any:
    """
    Retrieve role claims with optional filtering by role_id.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    query = session.query(RoleClaims).filter(RoleClaims.role_claim_isactive == True)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                RoleClaims.role_claim_type.ilike(search_term),
                RoleClaims.role_claim_value.ilike(search_term)
            )

        )
    if sortBy:
        if hasattr(RoleClaims, sortBy):
            sort_column = getattr(RoleClaims, sortBy)
            if sortOrder and sortOrder.lower() == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())

    # Get total count for pagination
    total_count = query.count()

    # Apply pagination to the query
    query = query.offset(skip).limit(limit).all()

    return RolesClaimsPublicList(data=query, count=total_count)


@router.post("/", response_model=RolesClaimsPublic)
def create_role_claim(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    role_claim_in: RolesClaimsCreate
) -> Any:
    """
    Create a new role claim.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check if the role exists
    role = session.get(Roles, role_claim_in.role_id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check if the same claim already exists for this role
    existing_query = select(RoleClaims).where(
        RoleClaims.role_id == role_claim_in.role_id,
        RoleClaims.role_claim_type == role_claim_in.role_claim_type,
        RoleClaims.role_claim_value == role_claim_in.role_claim_value
    )
    existing_claim = session.exec(existing_query).first()
    
    if existing_claim:
        if existing_claim.role_claim_isactive:
            raise HTTPException(status_code=400, detail="This claim already exists for this role")
        else:
            # If it exists but is inactive, reactivate it
            existing_claim.role_claim_isactive = True
            existing_claim.updated_at = datetime.now()
            existing_claim.updated_by_id = current_user.id
            session.add(existing_claim)
            session.commit()
            session.refresh(existing_claim)
            return existing_claim
    
    # Create new role claim
    role_claim = RoleClaims(
        role_claim_type=role_claim_in.role_claim_type,
        role_claim_value=role_claim_in.role_claim_value,
        role_claim_isactive=True if role_claim_in.role_claim_isactive is None else role_claim_in.role_claim_isactive,
        role_id=role_claim_in.role_id,
        created_by_id=current_user.id,
        created_at=datetime.now()
    )
    
    session.add(role_claim)
    session.commit()
    session.refresh(role_claim)
    
    return role_claim

@router.get("/{role_claim_id}", response_model=RolesClaimsPublic)
def read_role_claim(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    role_claim_id: uuid.UUID
) -> Any:
    """
    Get a specific role claim by ID.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    role_claim = session.get(RoleClaims, role_claim_id)
    if not role_claim:
        raise HTTPException(status_code=404, detail="Role claim not found")
    
    return role_claim

@router.put("/{id}", response_model=RolesClaimsPublic)
def update_role_claim(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    role_claim_in: RolesClaimsUpdate
) -> Any:
    """
    Update a role claim.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    role_claim = session.get(RoleClaims, id)
    if not role_claim:
        raise HTTPException(status_code=404, detail="Role claim not found")
    
    # Check if role exists if role_id is being updated
    if role_claim_in.role_id != role_claim.role_id:
        role = session.get(Roles, role_claim_in.role_id)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
    
    # Check for duplicate if type or value is changing
    if (role_claim_in.role_claim_type != role_claim.role_claim_type or 
        role_claim_in.role_claim_value != role_claim.role_claim_value or
        role_claim_in.role_id != role_claim.role_id):
        
        existing_query = select(RoleClaims).where(
            RoleClaims.role_id == role_claim_in.role_id,
            RoleClaims.role_claim_type == role_claim_in.role_claim_type,
            RoleClaims.role_claim_value == role_claim_in.role_claim_value,
            RoleClaims.role_claim_id != id
        )
        existing_claim = session.exec(existing_query).first()
        
        if existing_claim and existing_claim.role_claim_isactive:
            raise HTTPException(status_code=400, detail="This claim already exists for this role")
    
    # Update the role claim
    role_claim.role_claim_type = role_claim_in.role_claim_type
    role_claim.role_claim_value = role_claim_in.role_claim_value
    if role_claim_in.role_claim_isactive is not None:
        role_claim.role_claim_isactive = role_claim_in.role_claim_isactive
    role_claim.role_id = role_claim_in.role_id
    role_claim.updated_at = datetime.now()
    role_claim.updated_by_id = current_user.id
    
    session.add(role_claim)
    session.commit()
    session.refresh(role_claim)
    
    return role_claim

@router.delete("/{role_claim_id}", response_model=Message)
def delete_role_claim(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    role_claim_id: uuid.UUID,
    permanent: bool = Query(False, description="Permanently delete the claim instead of soft delete")
) -> Any:
    """
    Delete a role claim.
    By default, this is a soft delete (sets isactive to False).
    Set permanent=true to permanently delete the record.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    role_claim = session.get(RoleClaims, role_claim_id)
    if not role_claim:
        raise HTTPException(status_code=404, detail="Role claim not found")
    
    if permanent:
        # Hard delete
        session.delete(role_claim)
        session.commit()
        return Message(message="Role claim permanently deleted")
    else:
        # Soft delete
        role_claim.role_claim_isactive = False
        role_claim.updated_at = datetime.now()
        role_claim.updated_by_id = current_user.id
        
        session.add(role_claim)
        session.commit()
        
        return Message(message="Role claim deactivated successfully")