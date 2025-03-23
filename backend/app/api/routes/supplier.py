import uuid
from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, HTTPException
from sqlmodel import SQLModel, Field, Relationship, func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import Message, Suppliers, SuppliersCreate, SuppliersPublic, SuppliersPublicList, SuppliersUpdate



# API Routes

router = APIRouter(prefix="/suppliers", tags=["Supplier"])

@router.get("/", response_model=SuppliersPublicList)
def read_suppliers(
    session: SessionDep, current_user: CurrentUser, skip: int = 0, limit: int = 100, search: str = None,
    sortBy: str = None, sortOrder: str = "asc"
) -> Any:
    """
    Retrieve suppliers.
    """
    query = session.query(Suppliers).filter(Suppliers.is_active == True)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Suppliers.supplier_name.ilike(search_term)) | 
            (Suppliers.contact_person.ilike(search_term)) |
            (Suppliers.email.ilike(search_term))
        )

    if sortBy:
        sort_column = getattr(Suppliers, sortBy, None)
        if sort_column:
            if sortOrder and sortOrder.lower() == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())
    
    # Get total count for pagination
    total_count = query.count()
    
    # Apply pagination
    items = query.offset(skip).limit(limit).all()
    return SuppliersPublicList(data=items, count=total_count)

@router.post("/", response_model=SuppliersPublic)
def create_supplier(*, session: SessionDep, current_user: CurrentUser, supplier_in: SuppliersCreate) -> Any:
    """
    Create a new supplier.
    """
    # Check if supplier with the same name already exists
    existing_supplier = session.query(Suppliers).filter(
        Suppliers.supplier_name == supplier_in.supplier_name,
        Suppliers.is_active == True
    ).first()
    
    if existing_supplier:
        raise HTTPException(status_code=400, detail="Supplier with this name already exists")
    
    # Create the supplier
    supplier = Suppliers.model_validate(
        supplier_in, 
        update={
            "created_by_id": current_user.id, 
            "updated_by_id": current_user.id
        }
    )
    session.add(supplier)
    session.commit()
    session.refresh(supplier)
    return supplier

@router.put("/{id}", response_model=SuppliersPublic)
def update_supplier(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID, supplier_in: SuppliersUpdate) -> Any:
    """
    Update a supplier.
    """
    supplier = session.get(Suppliers, id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    update_dict = supplier_in.model_dump(exclude_unset=True)
    
    # Check for duplicate name if name is being changed
    if "supplier_name" in update_dict and update_dict["supplier_name"] != supplier.supplier_name:
        existing_supplier = session.query(Suppliers).filter(
            Suppliers.supplier_name == update_dict["supplier_name"],
            Suppliers.supplier_id != id,
            Suppliers.is_active == True
        ).first()
        
        if existing_supplier:
            raise HTTPException(status_code=400, detail="Supplier with this name already exists")
    
    # Add update timestamp and user
    update_dict["updated_at"] = datetime.now()
    update_dict["updated_by_id"] = current_user.id
    
    supplier.sqlmodel_update(update_dict)
    session.add(supplier)
    session.commit()
    session.refresh(supplier)
    return supplier

@router.get("/{id}", response_model=SuppliersPublic)
def read_supplier(*, session: SessionDep, current_user: CurrentUser, id: uuid.UUID) -> Any:
    """
    Get supplier by ID.
    """
    supplier = session.get(Suppliers, id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    if not current_user.is_superuser and not supplier.is_active:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    return supplier

@router.delete("/{id}")
def delete_supplier(
    session: SessionDep, current_user: CurrentUser, id: uuid.UUID
) -> Message:
    """
    Delete a supplier (soft delete by setting is_active to False).
    """
    supplier = session.get(Suppliers, id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="Not enough permission")
    
    supplier.is_active = False
    supplier.updated_at = datetime.now()
    supplier.updated_by_id = current_user.id
    
    session.add(supplier)
    session.commit()
    session.refresh(supplier)
    return Message(message="Supplier is deleted successfully")