import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep

from app.models import ItemCategory, ItemCategoriesPublic, ItemCategoryCreate, ItemCategoryPublic, ItemCategoryUpdate, Message

router = APIRouter(prefix="/itemsCategory", tags=["ItemCategory"])

@router.get("/", response_model=ItemCategoriesPublic)
def read_item_Categories(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve items.
    """
    if current_user.is_superuser:
        count_statement = select(func.count()).select_from(ItemCategory)
        count = session.exec(count_statement).one()
        statement = select(ItemCategory).offset(skip).limit(limit)
        ItemCategorys = session.exec(statement).all()
    else:
        count_statement = (
            select(func.count())
            .where(ItemCategory.item_category_isactive == True)
            .select_from(ItemCategory)
        )
        count = session.exec(count_statement).one()
        statement = (
            select(ItemCategory)
            .where(ItemCategory.item_category_isactive == True)
            .offset(skip)
            .limit(limit)
        )
        ItemCategorys = session.exec(statement).all()

    return ItemCategoriesPublic(data=ItemCategorys, count=count)

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


@router.delete("/{id}")
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
    update_dict = ItemCategoryUpdate(item_category_isactive = False)
    item_Category.sqlmodel_update(update_dict)
    session.add(item_Category)
    session.commit()
    session.refresh(item_Category)
    return Message(Message="ItemCategory is deleted sucessfully")