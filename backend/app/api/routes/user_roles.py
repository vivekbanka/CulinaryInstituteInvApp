import uuid
from typing import Any, List

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep

from app.models import UserRole, UserRolesPublic, UserRoleCreate, UserRolePublic, UserRoleUpdate, Message

router = APIRouter(prefix="/userroles", tags=["UserRole"])

@router.get("/", response_model=UserRolePublic)
def read_user_roles(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve user roles.
    """
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(UserRole)
        count = session.exec(count_statement).one()
        statement = select(UserRole).offset(skip).limit(limit)
        user_roles = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .where(UserRole.user_role_isactive == True)
            .select_from(UserRole)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(UserRole)
            .where(UserRole.user_role_isactive == True)
            .offset(skip)
            .limit(limit)
        )
        user_roles = session.exec(statement).all()

    return UserRolePublic(data=user_roles, count=count)

@router.post("/", response_model=UserRolesPublic)
def create_user_role(*, session: SessionDep, current_user: CurrentUser, user_role_in: UserRoleCreate) -> Any:
    """
    Assign a role to a user.
    """
    # Check if the user-role combination already exists
    statement = select(UserRole).where(
        UserRole.user_id == user_role_in.user_id,
        UserRole.role_id == user_role_in.role_id,
        UserRole.user_role_isactive == True
    )
    existing_user_role = session.exec(statement).first()
    
    if existing_user_role:
        raise HTTPException(status_code=400, detail="User already has this role assigned")
    
    user_role = UserRole.model_validate(user_role_in, update={
        "created_by_id": current_user.id, 
        "updated_by_id": current_user.id
    })
    session.add(user_role)
    session.commit()
    session.refresh(user_role)
    return user_role

@router.put("/{id}", response_model=UserRolesPublic)
def update_user_role(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID, user_role_in: UserRoleUpdate) -> Any:
    """
    Update a user role.
    """
    user_role = session.get(UserRole, id)
    if not user_role:
        raise HTTPException(status_code=404, detail="User role not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    update_dict = user_role_in.model_dump(exclude_unset=True)
    user_role.sqlmodel_update(update_dict)
    session.add(user_role)
    session.commit()
    session.refresh(user_role)
    return user_role

@router.get("/{id}", response_model=UserRolesPublic)
def read_user_role(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get user role by ID.
    """
    user_role = session.get(UserRole, id)
    if not user_role:
        raise HTTPException(status_code=404, detail="User role not found")
    if not current_user.is_superuser and not user_role.user_role_isactive:
        raise HTTPException(status_code=400, detail="Not enough permission")
    return user_role

@router.get("/user/{user_id}", response_model=UserRolePublic)
def read_user_roles_by_user(*, session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID) -> Any:
    """
    Get all roles for a specific user.
    """
    # Check if requesting user is superuser or the user themselves
    if not current_user.is_superuser and current_user.id != user_id:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    count_statement = (
        select(func.count())
        .where(
            UserRole.user_id == user_id,
            UserRole.user_role_isactive == True
        )
        .select_from(UserRole)
    )
    count = session.exec(count_statement).one()
    
    statement = (
        select(UserRole)
        .where(
            UserRole.user_id == user_id,
            UserRole.user_role_isactive == True
        )
    )
    user_roles = session.exec(statement).all()
    
    return UserRolePublic(data=user_roles, count=count)

@router.get("/role/{role_id}", response_model=UserRolePublic)
def read_users_by_role(*, session: SessionDep, current_user: CurrentUser, role_id: uuid.UUID) -> Any:
    """
    Get all users that have a specific role.
    """
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    count_statement = (
        select(func.count())
        .where(
            UserRole.role_id == role_id,
            UserRole.user_role_isactive == True
        )
        .select_from(UserRole)
    )
    count = session.exec(count_statement).one()
    
    statement = (
        select(UserRole)
        .where(
            UserRole.role_id == role_id,
            UserRole.user_role_isactive == True
        )
    )
    user_roles = session.exec(statement).all()
    
    return UserRolePublic(data=user_roles, count=count)

@router.delete("/{id}")
def delete_user_role(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Remove a role from a user (soft delete by setting isactive to False).
    """
    user_role = session.get(UserRole, id)
    if not user_role:
        raise HTTPException(status_code=404, detail="User role not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    update_dict = UserRoleUpdate(user_role_isactive=False)
    user_role.sqlmodel_update(update_dict)
    session.add(user_role)
    session.commit()
    session.refresh(user_role)
    return Message(message="User role is removed successfully")