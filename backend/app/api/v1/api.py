from fastapi import APIRouter
from .endpoints import auth, categories, products, conversations, test_configurations, user,websoket,reports, association, file_upload, elevenlabs

api_router = APIRouter()

api_router.include_router(user.router,prefix="/users", tags=["user"])
api_router.include_router(auth.router,prefix="/auth", tags=["authentication"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(products.router, prefix="/products", tags=["products"])
api_router.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
api_router.include_router(websoket.router, prefix="/websoket", tags=["websoket"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(test_configurations.router, prefix="/test-configurations", tags=["test-configurations"])
api_router.include_router(association.router, prefix="/association", tags=["association"])
api_router.include_router(file_upload.router, prefix="/file-upload", tags=["file-upload"])
api_router.include_router(elevenlabs.router, prefix="/elevenlabs", tags=["elevenlabs"])