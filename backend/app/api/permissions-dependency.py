from typing import List, Optional, Callable, Any
from fastapi import Depends, HTTPException, status
from sqlmodel import select

from app.api.deps import CurrentUser, SessionDep, get_current_user
from app.models import UserRole,Roles,RoleClaims

def has_permission(required_claim: str) -> Callable:
    """
    Dependency to check if the current user has the required claim.
    Usage:
    
    @router.get("/protected-endpoint")
    def protected_endpoint(current_user: CurrentUser = Depends(has_permission("read:items"))):
        # Only users with the "read:items" claim can access this endpoint
        return {"message": "You have access to this resource"}
    """
    async def _has_permission(
        current_user: CurrentUser = Depends(get_current_user),
        session: SessionDep = Depends()
    ) -> CurrentUser:
        # Superuser has all permissions
        if current_user.is_superuser:
            return current_user
            
        # Get all active roles for the user
        user_roles_statement = (
            select(UserRole.role_id)
            .where(
                UserRole.user_id == current_user.id,
                UserRole.user_role_isactive == True
            )
        )
        user_role_ids = [role_id for role_id, in session.exec(user_roles_statement).all()]
        
        if not user_role_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Check if any of the user's roles has the required claim
        statement = (
            select(RoleClaim)
            .join(RoleClaim, RoleClaim.claim_id == Claim.id)
            .where(
                RoleClaim.role_id.in_(user_role_ids),
                RoleClaim.role_claim_isactive == True,
                Claim.claim_isactive == True,
                Claim.claim_name == required_claim
            )
        )
        matching_claim = session.exec(statement).first()
        
        if not matching_claim:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
            
        return current_user
        
    return _has_permission

def has_any_permission(required_claims: List[str]) -> Callable:
    """
    Dependency to check if the current user has any of the required claims.
    Usage:
    
    @router.get("/protected-endpoint")
    def protected_endpoint(current_user: CurrentUser = Depends(has_any_permission(["read:items", "admin:items"]))):
        # Users with either "read:items" OR "admin:items" claim can access this endpoint
        return {"message": "You have access to this resource"}
    """
    async def _has_any_permission(
        current_user: CurrentUser = Depends(get_current_user),
        session: SessionDep = Depends()
    ) -> CurrentUser:
        # Superuser has all permissions
        if current_user.is_superuser:
            return current_user
            
        # Get all active roles for the user
        user_roles_statement = (
            select(UserRole.role_id)
            .where(
                UserRole.user_id == current_user.id,
                UserRole.user_role_isactive == True
            )
        )
        user_role_ids = [role_id for role_id, in session.exec(user_roles_statement).all()]
        
        if not user_role_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Check if any of the user's roles has any of the required claims
        statement = (
            select(RoleClaims)
            .join(UserRole, UserRole.role_id == RoleClaims.role_id)
            .where(
                UserRole.role_id.in_(user_role_ids),
                RoleClaims.role_claim_isactive == True,
                RoleClaims.role_claim_value.in_(required_claims)
            )
        )
        matching_claim = session.exec(statement).first()
        
        if not matching_claim:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
            
        return current_user
        
    return _has_any_permission

def has_all_permissions(required_claims: List[str]) -> Callable:
    """
    Dependency to check if the current user has all of the required claims.
    Usage:
    
    @router.get("/protected-endpoint")
    def protected_endpoint(current_user: CurrentUser = Depends(has_all_permissions(["read:items", "edit:items"]))):
        # Only users with BOTH "read:items" AND "edit:items" claims can access this endpoint
        return {"message": "You have access to this resource"}
    """
    async def _has_all_permissions(
        current_user: CurrentUser = Depends(get_current_user),
        session: SessionDep = Depends()
    ) -> CurrentUser:
        # Superuser has all permissions
        if current_user.is_superuser:
            return current_user
            
        # Get all active roles for the user
        user_roles_statement = (
            select(UserRole.role_id)
            .where(
                UserRole.user_id == current_user.id,
                UserRole.user_role_isactive == True
            )
        )
        user_role_ids = [role_id for role_id, in session.exec(user_roles_statement).all()]
        
        if not user_role_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        
        # Check if any of the user's roles has all of the required claims

        statement = (
            select(RoleClaims)
            .join(UserRole, UserRole.role_id == RoleClaims.role_id)
            .where(
                UserRole.role_id.in_(user_role_ids),
                RoleClaims.role_claim_isactive == True,
                RoleClaims.role_claim_value.in_(required_claims)
            )
            .distinct()
        )
        
        user_claims = [claim_name for claim_name, in session.exec(statement).all()]
        
        # Check if all required claims are in the user's claims
        if not all(claim in user_claims for claim in required_claims):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
            
        return current_user
        
    return _has_all_permissions

# Add to the get_current_user_with_claims function to app/api/deps.py
async def get_current_user_with_claims(
    current_user: CurrentUser = Depends(get_current_user),
    session: SessionDep = Depends()
) -> CurrentUser:
    """
    Get the current user with their claims attached.
    """
    # If user is superuser, we can skip the claim lookup
    if current_user.is_superuser:
        # Add a special attribute to indicate superuser
        setattr(current_user, "user_claims", ["*"])
        return current_user
        
    # Get all active roles for the user
    user_roles_statement = (
        select(UserRole.role_id)
        .where(
            UserRole.user_id == current_user.id,
            UserRole.user_role_isactive == True
        )
    )
    user_role_ids = [role_id for role_id, in session.exec(user_roles_statement).all()]
    
    # Get all claims for these roles
    claims = []
    if user_role_ids:
        statement = (
            select(RoleClaims.role_claim_value)
            .distinct()
            .join(UserRole, UserRole.role_id == RoleClaims.role_id)
            .where(
                UserRole.role_id.in_(user_role_ids),
                RoleClaims.role_claim_isactive == True
            )
        )
        claims = [claim_name for claim_name, in session.exec(statement).all()]
    
    # Attach claims to the user object
    setattr(current_user, "user_claims", claims)
    return current_user