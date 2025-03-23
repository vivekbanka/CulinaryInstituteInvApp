from fastapi import APIRouter

from app.api.routes import items, login, private, users, utils, item_category, roles, user_roles, role_claim, Item_sub_category, location, semester
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
api_router.include_router(item_category.router)
api_router.include_router(roles.router)
api_router.include_router(role_claim.router)
api_router.include_router(Item_sub_category.router)
api_router.include_router(user_roles.router)
api_router.include_router(location.router)
api_router.include_router(semester.router)

if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
