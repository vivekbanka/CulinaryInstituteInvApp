import uuid
from typing import Any
from sqlalchemy import or_
from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep

from app.models import ItemCategory, ItemCategoriesPublic, ItemCategoryCreate, ItemCategoryPublic, ItemCategoryUpdate, Message

router = APIRouter(prefix="/itemsCategory", tags=["ItemCategory"])

@router.get("/", response_model=ItemCategoriesPublic)
def read_item_Categories(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100,search: str = None,
    sortBy: str = None,
    sortOrder: str = "asc"
) -> Any:
    """
    Retrieve items.
    """
    query = session.query(ItemCategory).filter(ItemCategory.item_category_isactive == True)

    
    # Apply search filter if provided
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                ItemCategory.item_category_name.ilike(search_term),
                ItemCategory.item_category_code.ilike(search_term),
            )
        )
    
    # Apply sorting if provided
    if sortBy:
        # Get the column to sort by
        sort_column = getattr(ItemCategory, sortBy, None)
        if sort_column:
            if sortOrder and sortOrder.lower() == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    items = query.offset(skip).limit(limit).all()

    return ItemCategoriesPublic(data=items, count=total_count)

@router.post("/", response_model=ItemCategoryPublic)
def create_ItemCategory( *, session: SessionDep, current_user: CurrentUser,  item_Category_in: ItemCategoryCreate) -> Any:
    """
        Create Item Category
    """
    item_category = ItemCategory.model_validate(item_Category_in, update={"created_by_id": current_user.id, "updated_by_id": current_user.id})
    session.add(item_category)
    session.commit()
    session.refresh(item_category)
    return item_category

@router.put("/{id}", response_model=ItemCategoryPublic)
def update_ItemCatergory(*,
    session: SessionDep,
    current_user: CurrentUser, id:uuid.UUID, item_categeory_in:ItemCategoryUpdate) -> Any:
    """
        Update Item Category 
    """
    item_categeory = session.get(ItemCategory,id)
    if not item_categeory:
        raise HTTPException(status_code = 404, detail="Item Category not Found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    update_dict = item_categeory_in.model_dump(exclude_unset=True)
    item_categeory.sqlmodel_update(update_dict)
    session.add(item_categeory)
    session.commit()
    session.refresh(item_categeory)
    return item_categeory


@router.delete("/{id}", response_model=Message)
def delete_item(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
        Delete Item Category
    """
    item_Category = session.get(ItemCategory, id)
    if not item_Category:
        raise HTTPException(status_code = 404, detail="Item Category not Found")
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    item_Category.item_category_isactive = False
    session.add(item_Category)
    session.commit()
    return Message(Message="ItemCategory is deleted sucessfully")