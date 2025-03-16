import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep

from app.models import ItemSubCategory, ItemSubCategoriesPublic, ItemSubCategoryCreate, ItemSubCategoryPublic, ItemSubCategoryUpdate, Message, ItemSubCategoryWithCategory, ItemCategory

router = APIRouter(prefix="/itemsSubCategory", tags=["ItemSubCategory"])

@router.get("/", response_model=ItemSubCategoriesPublic)
def read_item_subcategories(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve item subcategories.
    """
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(ItemSubCategory)
        count = session.exec(count_statement).one()
        statement = select(ItemSubCategory).offset(skip).limit(limit)
        item_subcategories = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .where(ItemSubCategory.item_subcategory_isactive == True)
            .select_from(ItemSubCategory)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(ItemSubCategory)
            .where(ItemSubCategory.item_subcategory_isactive == True)
            .offset(skip)
            .limit(limit)
        )
        item_subcategories = session.exec(statement).all()

    return ItemSubCategoriesPublic(data=item_subcategories, count=count)

@router.get("/category/{category_id}", response_model=ItemSubCategoriesPublic)
def read_item_subcategories_by_category(
    session: SessionDep, current_user: CurrentUser, category_id: uuid.UUID, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve item subcategories by category ID.
    """
    # Check if category exists
    category = session.get(ItemCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if current_user.is_superuser:
        count_statement = select(func.count()).where(
            ItemSubCategory.item_category_id == category_id
        ).select_from(ItemSubCategory)
        count = session.exec(count_statement).one()
        
        statement = select(ItemSubCategory).where(
            ItemSubCategory.item_category_id == category_id
        ).offset(skip).limit(limit)
        item_subcategories = session.exec(statement).all()
    else:
        count_statement = select(func.count()).where(
            (ItemSubCategory.item_category_id == category_id) &
            (ItemSubCategory.item_subcategory_isactive == True)
        ).select_from(ItemSubCategory)
        count = session.exec(count_statement).one()
        
        statement = select(ItemSubCategory).where(
            (ItemSubCategory.item_category_id == category_id) &
            (ItemSubCategory.item_subcategory_isactive == True)
        ).offset(skip).limit(limit)
        item_subcategories = session.exec(statement).all()

    return ItemSubCategoriesPublic(data=item_subcategories, count=count)

@router.get("/{id}", response_model=ItemSubCategoryWithCategory)
def read_item_subcategory(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Any:
    """
    Get a specific item subcategory by ID with its parent category.
    """
    item_subcategory = session.get(ItemSubCategory, id)
    if not item_subcategory:
        raise HTTPException(status_code=404, detail="Item subcategory not found")
    
    if not current_user.is_superuser and not item_subcategory.item_subcategory_isactive:
        raise HTTPException(status_code=404, detail="Item subcategory not found")
    
    # Fetch the parent category
    category = session.get(ItemCategory, item_subcategory.item_category_id)
    
    # Create the response with the category included
    response = ItemSubCategoryWithCategory.model_validate(item_subcategory)
    response.category = category
    
    return response

@router.post("/", response_model=ItemSubCategoryPublic)
def create_item_subcategory(
    *, session: SessionDep, current_user: CurrentUser, item_subcategory_in: ItemSubCategoryCreate
) -> Any:
    """
    Create a new item subcategory.
    """
    # Verify the category exists
    category = session.get(ItemCategory, item_subcategory_in.item_category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Parent category not found")
    
    # Check if a subcategory with the same code already exists
    existing = session.exec(
        select(ItemSubCategory).where(
            ItemSubCategory.item_subcategory_code == item_subcategory_in.item_subcategory_code
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Subcategory with this code already exists")
    
    item_subcategory = ItemSubCategory.model_validate(
        item_subcategory_in, 
        update={"created_by_id": current_user.id, "updated_by_id": current_user.id}
    )
    
    session.add(item_subcategory)
    session.commit()
    session.refresh(item_subcategory)
    
    return item_subcategory

@router.put("/{id}", response_model=ItemSubCategoryPublic)
def update_item_subcategory(
    *, session: SessionDep, current_user: CurrentUser, id: uuid.UUID, item_subcategory_in: ItemSubCategoryUpdate
) -> Any:
    """
    Update an item subcategory.
    """
    item_subcategory = session.get(ItemSubCategory, id)
    if not item_subcategory:
        raise HTTPException(status_code=404, detail="Item subcategory not found")
    
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    # If category is being updated, verify it exists
    if item_subcategory_in.item_category_id is not None:
        category = session.get(ItemCategory, item_subcategory_in.item_category_id)
        if not category:
            raise HTTPException(status_code=404, detail="Parent category not found")
    
    # Check if code is being updated to one that already exists
    if item_subcategory_in.item_subcategory_code is not None and item_subcategory_in.item_subcategory_code != item_subcategory.item_subcategory_code:
        existing = session.exec(
            select(ItemSubCategory).where(
                ItemSubCategory.item_subcategory_code == item_subcategory_in.item_subcategory_code
            )
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Subcategory with this code already exists")
    
    # Update the subcategory
    update_dict = item_subcategory_in.model_dump(exclude_unset=True)
    update_dict["updated_by_id"] = current_user.id
    item_subcategory.sqlmodel_update(update_dict)
    
    session.add(item_subcategory)
    session.commit()
    session.refresh(item_subcategory)
    
    return item_subcategory

@router.delete("/{id}", response_model=Message)
def delete_item_subcategory(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Soft delete an item subcategory.
    """
    item_subcategory = session.get(ItemSubCategory, id)
    if not item_subcategory:
        raise HTTPException(status_code=404, detail="Item subcategory not found")
    
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    # Soft delete by setting isactive to False
    update_dict = ItemSubCategoryUpdate(item_subcategory_isactive=False)
    item_subcategory.sqlmodel_update(update_dict)
    
    session.add(item_subcategory)
    session.commit()
    session.refresh(item_subcategory)
    
    return Message(message="Item subcategory is deleted successfully")