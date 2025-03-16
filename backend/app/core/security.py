from datetime import datetime, timedelta, timezone
from sqlmodel import select
from typing import Any
import uuid
from typing import Any, Dict, List, Optional
import jwt
from passlib.context import CryptContext
from app.models import User, UserRole, RoleClaims, Roles
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


ALGORITHM = "HS256"


def create_access_token(
    user_id: uuid.UUID, 
    expires_delta: Optional[timedelta] = None,
    session = None
) -> str:
    """
    Create a JWT access token that includes user roles and role claims.
    
    Args:
        user_id: The ID of the user
        expires_delta: Optional expiration time delta, defaults to settings.ACCESS_TOKEN_EXPIRE_MINUTES
        session: Database session for querying roles and claims
        
    Returns:
        JWT token as a string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Start with basic token data
    token_data = {
        "sub": str(user_id),  # subject (user ID)
        "exp": expire,        # expiration time
        "iat": datetime.utcnow()  # issued at
    }
    
    # If a database session is provided, fetch and include roles and claims
    if session:
        # Get user to check if superuser
        user = session.get(User, user_id)
        if user:
            token_data["is_superuser"] = user.is_superuser
            token_data["is_active"] = user.is_active
            
            # If superuser, we can skip detailed permissions as they have all
            if not user.is_superuser:
                # Get user's active roles
                user_roles_query = select(UserRole, Roles).join(
                    Roles, UserRole.role_id == Roles.role_id
                ).where(
                    UserRole.user_id == user_id,
                    UserRole.is_active == True
                )
                user_role_results = session.exec(user_roles_query).all()
                
                # Extract role IDs and names
                roles = []
                role_ids = []
                for user_role, role in user_role_results:
                    roles.append({
                        "id": str(role.role_id),
                        "name": role.role_name
                    })
                    role_ids.append(role.role_id)
                
                token_data["roles"] = roles
                
                # If there are roles, get the claims
                if role_ids:
                    # Get all active claims for the user's roles
                    claims_query = select(RoleClaims).where(
                        RoleClaims.role_id.in_(role_ids),
                        RoleClaims.role_claim_isactive == True
                    )
                    role_claims = session.exec(claims_query).all()
                    
                    # Organize claims by type
                    claims_by_type = {}
                    for claim in role_claims:
                        if claim.role_claim_type not in claims_by_type:
                            claims_by_type[claim.role_claim_type] = []
                        
                        claims_by_type[claim.role_claim_type].append(claim.role_claim_value)
                    
                    token_data["claims"] = claims_by_type
    
    # Create the JWT token
    encoded_jwt = jwt.encode(
        token_data, 
        settings.SECRET_KEY, 
        algorithm=ALGORITHM
    )
    print(encoded_jwt)
    
    return encoded_jwt

def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decode a JWT token and return its contents.
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload as a dictionary
    """
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[ALGORITHM]
    )

def get_claims_from_token(token: str) -> Dict[str, List[str]]:
    """
    Extract claims from a JWT token.
    
    Args:
        token: JWT token string
        
    Returns:
        Dictionary of claim types and their values
    """
    decoded_token = decode_access_token(token)
    
    # Superusers have all permissions
    if decoded_token.get("is_superuser", False):
        return {"*": ["*"]}
    
    return decoded_token.get("claims", {})

def has_claim_in_token(token: str, claim_type: str, claim_value: str) -> bool:
    """
    Check if a token has a specific claim.
    
    Args:
        token: JWT token string
        claim_type: The type of claim to check
        claim_value: The value of the claim to check
        
    Returns:
        True if the token has the claim, False otherwise
    """
    claims = get_claims_from_token(token)
    
    # Superuser has all claims
    if "*" in claims and "*" in claims["*"]:
        return True
    
    # Check for specific claim
    return claim_type in claims and claim_value in claims[claim_type]

def has_role_in_token(token: str, role_id: str = None, role_name: str = None) -> bool:
    """
    Check if a token has a specific role.
    
    Args:
        token: JWT token string
        role_id: Optional role ID to check
        role_name: Optional role name to check
        
    Returns:
        True if the token has the role, False otherwise
    """
    if not role_id and not role_name:
        raise ValueError("Either role_id or role_name must be provided")
    
    decoded_token = decode_access_token(token)
    
    # Superusers have all roles
    if decoded_token.get("is_superuser", False):
        return True
    
    roles = decoded_token.get("roles", [])
    
    if role_id:
        return any(role["id"] == role_id for role in roles)
    
    if role_name:
        return any(role["name"] == role_name for role in roles)
    
    return False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
