from datetime import datetime 
import uuid
from typing import Any, Dict, List, Optional, ClassVar
from pydantic import EmailStr
from sqlmodel import Field, Relationship, SQLModel,Column,TIMESTAMP, text
from sqlalchemy.orm import relationship


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
     # Relationship to subcategories
    subcategories: List["ItemSubCategory"] = Relationship(
        back_populates="category", 
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
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




class ItemSubCategoryBase(SQLModel):
    item_subcategory_name: str = Field(min_length=1, max_length=255)
    item_subcategory_code: str = Field(min_length=1, max_length=100)
    item_subcategory_isactive: bool = Field(default=True)
    # Foreign key to parent category
    item_category_id: uuid.UUID = Field(foreign_key="itemcategory.item_category_id")


class ItemSubCategoryCreate(ItemSubCategoryBase):
    """Model for creating a new subcategory"""
    pass


class ItemSubCategoryUpdate(SQLModel):
    """Model for updating an existing subcategory"""
    item_subcategory_name: str | None = Field(default=None, max_length=255)
    item_subcategory_code: str | None = Field(default=None, min_length=1, max_length=100)
    item_subcategory_isactive: bool | None = Field(default=None)
    item_category_id: uuid.UUID | None = Field(default=None)


class ItemSubCategory(ItemSubCategoryBase, table=True):
    item_subcategory_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    item_subcategory_name: str = Field(max_length=255)
    item_subcategory_code: str = Field(max_length=100)
    
    # Audit fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(), nullable=False)
    updated_at: datetime | None = Field(default=None, nullable=True)
    
    # Foreign keys
    created_by_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    updated_by_id: uuid.UUID | None = Field(foreign_key="user.id", nullable=True)

    # Relationships
    created_by: User = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[ItemSubCategory.created_by_id]"}
    )
    updated_by: User | None = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[ItemSubCategory.updated_by_id]"}
    )
    # # Define the relationship to ItemCategory without expecting a back_populates
    # category: ItemCategory = Relationship(
    #     sa_relationship_kwargs={"foreign_keys": "[ItemSubCategory.item_category_id]"}
    # )
    category: "ItemCategory" = Relationship(
        back_populates="subcategories",
        sa_relationship_kwargs={"foreign_keys": "[ItemSubCategory.item_category_id]"}
    )
   
    
   


# # Add this to the ItemCategory class to establish the relationship
# ItemCategory.subcategories: List[ItemSubCategory] = Relationship(
#     back_populates="category", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
# )


class ItemSubCategoryPublic(ItemSubCategoryBase):
    """Model for public API responses"""
    item_subcategory_id: uuid.UUID
    item_category_name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: uuid.UUID
    updated_by_id: Optional[uuid.UUID] = None
    # Use the Forward Reference for the category to avoid circular imports
    category: Optional["ItemCategoryPublic"] = None
    
    class Config:
        orm_mode = True


class ItemSubCategoriesPublic(SQLModel):
    """Container for multiple subcategories"""
    data: List[ItemSubCategoryPublic]
    count: int


# For a more complete response that includes the parent category information
class ItemSubCategoryWithCategory(ItemSubCategoryPublic):
    """Model for public API responses with category details"""
    category: Optional["ItemCategoryPublic"] = None




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
    __tablename__ = "roles"
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
        sa_relationship_kwargs={"foreign_keys": "[Roles.created_by_id]"}
    )
    updated_by: User | None = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Roles.updated_by_id]"}
    )

class RolesPublic(RolesBase):
    """Model for the Public API response"""
    role_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: uuid.UUID
    updated_by_id: Optional[uuid.UUID] = None

class RolesPublicList(SQLModel):
    """Container for multiple categories"""
    data: List[RolesPublic]
    count: int

class RolesClaimsBase(SQLModel):
    role_claim_type: str = Field(min_length=1, max_length=100)
    role_claim_value: str = Field(min_length=1, max_length=100)
    role_claim_isactive: bool | None = Field(default = None)
    role_id: uuid.UUID = Field()

class RolesClaimsCreate(RolesClaimsBase):
    """Create Roles Claims"""
    pass

class RolesClaimsUpdate(RolesClaimsBase):
    role_claim_type: str = Field(min_length=1, max_length=100)
    role_claim_value: str = Field(min_length=1, max_length=100)
    role_claim_isactive: bool | None = Field(default = None)


class RoleClaims(RolesClaimsBase, table=True):
    __tablename__ = "roleclaims"
    
    role_claim_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Audit fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(), nullable=False)
    updated_at: datetime | None = Field(default=None, nullable=True)
    
    # Foreign keys
    created_by_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    updated_by_id: uuid.UUID | None = Field(foreign_key="user.id", nullable=True)
    role_id: uuid.UUID = Field(foreign_key="roles.role_id", nullable=False)

    # Relationships without back_populates
    created_by: User = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "RoleClaims.created_by_id == User.id",
            "foreign_keys": "[RoleClaims.created_by_id]"
        }
    )
    updated_by: User | None = Relationship(
        sa_relationship_kwargs={
            "primaryjoin": "RoleClaims.updated_by_id == User.id",
            "foreign_keys": "[RoleClaims.updated_by_id]"
        }
    )
    role: Roles = Relationship()  # Using default relationship to roles



class RolesClaimsPublic(RolesClaimsBase):
    """Model for public API Response"""
    role_claim_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: uuid.UUID
    updated_by_id: Optional[uuid.UUID] = None

class RolesClaimsPublicList(SQLModel):
    """Container for multiple subcategories"""
    data: List[RolesClaimsPublic]
    count: int

class UserRoleBase(SQLModel):
    """Base model for user role association"""
    is_active: bool = Field(default=True)


class UserRoleCreate(UserRoleBase):
    """Model for creating a user role association"""
    user_id: uuid.UUID
    role_id: uuid.UUID


class UserRoleUpdate(SQLModel):
    """Model for updating a user role association"""
    is_active: bool | None = Field(default=None)

class UserRole(UserRoleBase, table=True):
    __tablename__ = "userrole"
    
    # Primary key
    user_role_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Foreign keys
    user_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    role_id: uuid.UUID = Field(foreign_key="roles.role_id", nullable=False)
    created_by_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    updated_by_id: uuid.UUID | None = Field(foreign_key="user.id", nullable=True)
    
    # Audit fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(), nullable=False)
    updated_at: datetime | None = Field(default=None, nullable=True)
    
    # Relationships - explicitly specify which foreign key to use for each relationship
    user: User = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[UserRole.user_id]"}
    )
    role: Roles = Relationship()
    created_by: User = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[UserRole.created_by_id]"}
    )
    updated_by: User | None = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[UserRole.updated_by_id]"}
    )

class UserRolePublic(UserRoleBase):
    """Model for public API responses"""
    user_role_id: uuid.UUID
    user_id: uuid.UUID
    role_id: uuid.UUID
    created_at: datetime
    updated_at: datetime | None = None
    created_by_id: uuid.UUID
    updated_by_id: uuid.UUID | None = None


class UserRolesPublic(SQLModel):
    """Container for multiple user role associations"""
    data: list[UserRolePublic]
    count: int



class LocationsBase(SQLModel):
    location_name: str = Field(min_length=1, max_length=255)
    location_is_active: bool = Field(default=True)

class LocationsCreate(LocationsBase):
    """ Model for creating Locations"""
    pass

class LocationsUpdate(SQLModel):
    """Model to update locations information"""
    location_name: str | None = Field(min_length=1, max_length=255)
    location_is_active: bool | None = Field(default=None)

class Locations(LocationsBase, table=True):
    __tablename__ = "locations"
    location_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    location_name: str = Field(max_length=255)
    location_is_active: bool = Field(default=True)
    
    # Audit fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(), nullable=False)
    updated_at: datetime | None = Field(default=None, nullable=True)
    
    # Foreign keys
    created_by_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    updated_by_id: uuid.UUID | None = Field(foreign_key="user.id", nullable=True)

    # Relationships
    created_by: User = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Locations.created_by_id]"}
    )
    updated_by: User | None = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Locations.updated_by_id]"}
    )

class LocationsPublic(LocationsBase):
    """Model for the Public API response"""
    location_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: uuid.UUID
    updated_by_id: Optional[uuid.UUID] = None

class LocationsPublicList(SQLModel):
    """Container for multiple locations"""
    data: List[LocationsPublic]
    count: int


# Semester Models

class SemestersBase(SQLModel):
    semester_name: str = Field(min_length=1, max_length=255)
    start_date: datetime = Field(nullable=False)
    end_date: datetime = Field(nullable=False)
    is_active: bool = Field(default=True)

class SemestersCreate(SemestersBase):
    """ Model for creating Semesters"""
    pass

class SemestersUpdate(SQLModel):
    """Model to update semesters information"""
    semester_name: str | None = Field(min_length=1, max_length=255, default=None)
    start_date: datetime | None = Field(default=None)
    end_date: datetime | None = Field(default=None)
    is_active: bool | None = Field(default=None)

class Semesters(SemestersBase, table=True):
    __tablename__ = "semesters"
    semester_id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Audit fields
    created_at: datetime = Field(default_factory=lambda: datetime.now(), nullable=False)
    updated_at: datetime | None = Field(default=None, nullable=True)
    
    # Foreign keys
    created_by_id: uuid.UUID = Field(foreign_key="user.id", nullable=False)
    updated_by_id: uuid.UUID | None = Field(foreign_key="user.id", nullable=True)

    # Relationships
    created_by: "User" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Semesters.created_by_id]"}
    )
    updated_by: "User | None" = Relationship(
        sa_relationship_kwargs={"foreign_keys": "[Semesters.updated_by_id]"}
    )

class SemestersPublic(SemestersBase):
    """Model for the Public API response"""
    semester_id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by_id: uuid.UUID
    updated_by_id: Optional[uuid.UUID] = None

class SemestersPublicList(SQLModel):
    """Container for multiple semesters"""
    data: List[SemestersPublic]
    count: int







# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    """
    Model representing the decoded JWT payload
    """
    sub: Optional[str] = None
    exp: Optional[int] = None
    iat: Optional[int] = None
    is_superuser: Optional[bool] = False
    is_active: Optional[bool] = True
    roles: Optional[List[Dict[str, str]]] = []
    claims: Optional[Dict[str, List[str]]] = {}


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
