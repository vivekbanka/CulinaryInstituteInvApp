import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep

from app.api.deps import CurrentUser, SessionDep
from app.models import RolesBase, RolesCreate, RolesPublic, RolesUpdate, Roles,Message


router = APIRouter(prefix="/roles", tags=["Role"])

@router.get("/", response_model=RolesPublic)
def read_roles(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve roles.
    """
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(Roles)
        count = session.exec(count_statement).one()
        statement = select(Roles).offset(skip).limit(limit)
        roles = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .where(Roles.role_isactive == True)
            .select_from(Roles)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(Roles)
            .where(Role.role_isactive == True)
            .offset(skip)
            .limit(limit)
        )
        roles = session.exec(statement).all()

    return RolePublic(data=roles, count=count)

@router.post("/", response_model=RolesPublic)
def create_role(*, session: SessionDep, current_user: CurrentUser, role_in: RolesCreate) -> Any:
    """
    Create a new role.
    """
    role = Roles.model_validate(role_in, update={"created_by_id": current_user.id, "updated_by_id": current_user.id})
    session.add(role)
    session.commit()
    session.refresh(role)
    return role

@router.put("/{id}", response_model=RolesPublic)
def update_role(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID, role_in: RolesUpdate) -> Any:
    """
    Update a role.
    """
    role = session.get(Roles, id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    update_dict = role_in.model_dump(exclude_unset=True)
    role.sqlmodel_update(update_dict)
    session.add(role)
    session.commit()
    session.refresh(role)
    return role

@router.get("/{id}", response_model=RolesPublic)
def read_role(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get role by ID.
    """
    role = session.get(Role, id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if not current_user.is_superuser and not role.role_isactive:
        raise HTTPException(status_code=400, detail="Not enough permission")
    return role

@router.delete("/{id}")
def delete_role(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a role (soft delete by setting isactive to False).
    """
    role = session.get(Role, id)
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    update_dict = RoleUpdate(role_isactive=False)
    role.sqlmodel_update(update_dict)
    session.add(role)
    session.commit()
    session.refresh(role)
    return Message(message="Role is deleted successfully")
