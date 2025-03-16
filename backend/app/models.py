from datetime import datetime 
from typing import List, Optional
import uuid

from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel,Column,TIMESTAMP, text


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = True
    is_superuser: bool = False
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)


# Properties to receive via API on update, all are optional
class UserUpdate(UserBase):
    email: EmailStr | None = Field(default=None, max_length=255)  # type: ignore
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(max_length=255)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# Item Category shared propeties

class ItemCategoryBase(SQLModel):
    item_category_name: str = Field(min_length=1, max_length=255)
    item_category_code: str = Field(min_length=1, max_length=100)
    item_category_isactive: bool = Field(default=True)

class ItemCategoryCreate(ItemCategoryBase):
    """Model for creating a new category"""
    pass

class ItemCategoryUpdate(SQLModel):
    """Model for updating an existing category"""
    item_category_code: str | None= Field(default=None, min_length=1, max_length=100)
    item_category_name: str | None = Field(default=None, max_length=255)
    item_category_isactive: bool| None = Field(default=None)

class ItemCategory(ItemCategoryBase, table=True):
    item_category_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    item_category_name: str = Field(max_length=255)
    item_category_code: str = Field(max_length=100)
     # Audit fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(), nullable=False)
    updated_at: datetime | None = Field(default=None, nullable=True)
    
    # Foreign keys
    created_by_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    updated_by_id: uuid.UUID | None= Field(foreign_key="user.id", nullable=True)

     # Relationships
    created_by: User = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[ItemCategory.created_by_id]"}
    )
    updated_by: User | None = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[ItemCategory.updated_by_id]"}
    )

class ItemCategoryPublic(ItemCategoryBase):
    """Model for public API responses"""
    item_category_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: uuid.UUID
    updated_by_id: Optional[uuid.UUID] = None


class ItemCategoriesPublic(SQLModel):
    """Container for multiple categories"""
    data: List[ItemCategoryPublic]
    count: int

class RolesBase(SQLModel):
    role_name: str = Field(min_length=1, max_length=255)
    role_is_active :bool = Field(default = True)

class RolesCreate(RolesBase):
    """ Model for creating Roles"""
    pass

class RolesUpdate(SQLModel):
    """Model to update roles information"""
    role_name: str | None = Field(min_length=1, max_length=255)
    role_is_active :bool | None = Field(default = None)

class Roles(RolesBase, table=True):
    role_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    role_name: str = Field(max_length=255)
    role_is_active :bool = Field(default = True)
     # Audit fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(), nullable=False)
    updated_at: datetime | None = Field(default=None, nullable=True)
    
    # Foreign keys
    created_by_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    updated_by_id: uuid.UUID | None= Field(foreign_key="user.id", nullable=True)

     # Relationships
    created_by: User = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[roles.created_by_id]"}
    )
    updated_by: User | None = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[roles.updated_by_id]"}
    )

class RolesPublic(RolesBase):
    """Model for the Public API response"""
    role_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: uuid.UUID
    updated_by_id: Optional[uuid.UUID] = None


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
