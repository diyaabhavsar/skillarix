"""
Role-Based Access Control (RBAC) Permissions System
Defines permissions for different user roles in the Skillarix platform.
"""

from enum import Enum
from typing import List, Dict
from fastapi import HTTPException, status

class UserRole(str, Enum):
    """User roles in the system"""
    ADMIN = "admin"
    SALESMAN = "salesman"
    EMPLOYEE = "employee"  # Legacy role, kept for backward compatibility

class Permission(str, Enum):
    """System permissions"""
    # User Management
    VIEW_ALL_USERS = "view_all_users"
    CREATE_USER = "create_user"
    EDIT_USER = "edit_user"
    DELETE_USER = "delete_user"
    
    # Product Management
    VIEW_PRODUCTS = "view_products"
    CREATE_PRODUCT = "create_product"
    EDIT_PRODUCT = "edit_product"
    DELETE_PRODUCT = "delete_product"
    
    # Category Management
    VIEW_CATEGORIES = "view_categories"
    CREATE_CATEGORY = "create_category"
    EDIT_CATEGORY = "edit_category"
    DELETE_CATEGORY = "delete_category"
    
    # Test Configuration Management
    VIEW_TEST_CONFIGS = "view_test_configs"
    CREATE_TEST_CONFIG = "create_test_config"
    EDIT_TEST_CONFIG = "edit_test_config"
    DELETE_TEST_CONFIG = "delete_test_config"
    
    # Training Sessions
    START_TRAINING_SESSION = "start_training_session"
    VIEW_OWN_SESSIONS = "view_own_sessions"
    VIEW_ALL_SESSIONS = "view_all_sessions"
    DELETE_OWN_SESSIONS = "delete_own_sessions"
    DELETE_ALL_SESSIONS = "delete_all_sessions"
    
    # Prompts Management
    VIEW_PROMPTS = "view_prompts"
    CREATE_PROMPT = "create_prompt"
    EDIT_PROMPT = "edit_prompt"
    DELETE_PROMPT = "delete_prompt"
    
    # Analytics & Reports
    VIEW_OWN_ANALYTICS = "view_own_analytics"
    VIEW_ALL_ANALYTICS = "view_all_analytics"
    EXPORT_REPORTS = "export_reports"
    
    # System Settings
    MANAGE_SYSTEM_SETTINGS = "manage_system_settings"
    VIEW_SYSTEM_LOGS = "view_system_logs"


# Role-Permission Mapping
ROLE_PERMISSIONS: Dict[UserRole, List[Permission]] = {
    UserRole.ADMIN: [
        # Full access to everything
        Permission.VIEW_ALL_USERS,
        Permission.CREATE_USER,
        Permission.EDIT_USER,
        Permission.DELETE_USER,
        
        Permission.VIEW_PRODUCTS,
        Permission.CREATE_PRODUCT,
        Permission.EDIT_PRODUCT,
        Permission.DELETE_PRODUCT,
        
        Permission.VIEW_CATEGORIES,
        Permission.CREATE_CATEGORY,
        Permission.EDIT_CATEGORY,
        Permission.DELETE_CATEGORY,
        
        Permission.VIEW_TEST_CONFIGS,
        Permission.CREATE_TEST_CONFIG,
        Permission.EDIT_TEST_CONFIG,
        Permission.DELETE_TEST_CONFIG,
        
        Permission.START_TRAINING_SESSION,
        Permission.VIEW_OWN_SESSIONS,
        Permission.VIEW_ALL_SESSIONS,
        Permission.DELETE_OWN_SESSIONS,
        Permission.DELETE_ALL_SESSIONS,
        
        Permission.VIEW_PROMPTS,
        Permission.CREATE_PROMPT,
        Permission.EDIT_PROMPT,
        Permission.DELETE_PROMPT,
        
        Permission.VIEW_OWN_ANALYTICS,
        Permission.VIEW_ALL_ANALYTICS,
        Permission.EXPORT_REPORTS,
        
        Permission.MANAGE_SYSTEM_SETTINGS,
        Permission.VIEW_SYSTEM_LOGS,
    ],
    
    UserRole.SALESMAN: [
        # Salesmen can train but have limited management access
        Permission.VIEW_PRODUCTS,  # Can view products (read-only)
        Permission.VIEW_CATEGORIES,  # Can view categories (read-only)
        
        Permission.VIEW_TEST_CONFIGS,  # Can view test configs
        
        Permission.START_TRAINING_SESSION,  # Can start training sessions
        Permission.VIEW_OWN_SESSIONS,  # Can only view their own sessions
        Permission.DELETE_OWN_SESSIONS,  # Can only delete their own sessions
        
        Permission.VIEW_OWN_ANALYTICS,  # Can only view their own analytics
    ],
    
    UserRole.EMPLOYEE: [
        # Legacy role - similar to salesman but with slightly more access
        Permission.VIEW_PRODUCTS,
        Permission.VIEW_CATEGORIES,
        
        Permission.VIEW_TEST_CONFIGS,
        Permission.CREATE_TEST_CONFIG,  # Can create test configs
        
        Permission.START_TRAINING_SESSION,
        Permission.VIEW_OWN_SESSIONS,
        Permission.DELETE_OWN_SESSIONS,
        
        Permission.VIEW_OWN_ANALYTICS,
    ],
}


def get_user_permissions(role: str) -> List[Permission]:
    """
    Get all permissions for a given role.
    
    Args:
        role: User role string
        
    Returns:
        List of permissions for the role
    """
    try:
        user_role = UserRole(role)
        return ROLE_PERMISSIONS.get(user_role, [])
    except ValueError:
        return []


def has_permission(user_role: str, required_permission: Permission) -> bool:
    """
    Check if a user role has a specific permission.
    
    Args:
        user_role: User's role
        required_permission: Permission to check
        
    Returns:
        True if user has permission, False otherwise
    """
    permissions = get_user_permissions(user_role)
    return required_permission in permissions


def require_permission(required_permission: Permission):
    """
    Decorator to require a specific permission for an endpoint.
    
    Usage:
        @router.get("/products")
        @require_permission(Permission.VIEW_PRODUCTS)
        async def get_products(token = Depends(verify_bearer_token)):
            ...
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Extract token from kwargs
            token = kwargs.get('token')
            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_role = token.get('role')
            if not user_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User role not found"
                )
            
            if not has_permission(user_role, required_permission):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required: {required_permission.value}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_any_permission(required_permissions: List[Permission]):
    """
    Decorator to require ANY of the specified permissions for an endpoint.
    
    Usage:
        @router.get("/sessions")
        @require_any_permission([Permission.VIEW_OWN_SESSIONS, Permission.VIEW_ALL_SESSIONS])
        async def get_sessions(token = Depends(verify_bearer_token)):
            ...
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            token = kwargs.get('token')
            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_role = token.get('role')
            if not user_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User role not found"
                )
            
            # Check if user has ANY of the required permissions
            has_any = any(has_permission(user_role, perm) for perm in required_permissions)
            
            if not has_any:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions. Required one of: {[p.value for p in required_permissions]}"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def require_role(allowed_roles: List[UserRole]):
    """
    Decorator to require specific roles for an endpoint.
    
    Usage:
        @router.get("/admin/dashboard")
        @require_role([UserRole.ADMIN])
        async def admin_dashboard(token = Depends(verify_bearer_token)):
            ...
    """
    def decorator(func):
        async def wrapper(*args, **kwargs):
            token = kwargs.get('token')
            if not token:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
            
            user_role = token.get('role')
            if not user_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User role not found"
                )
            
            try:
                role_enum = UserRole(user_role)
                if role_enum not in allowed_roles:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail=f"Access denied. Required roles: {[r.value for r in allowed_roles]}"
                    )
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Invalid user role"
                )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


def can_access_user_data(requesting_user_role: str, requesting_user_id: str, target_user_id: str) -> bool:
    """
    Check if a user can access another user's data.
    
    Args:
        requesting_user_role: Role of the user making the request
        requesting_user_id: ID of the user making the request
        target_user_id: ID of the user whose data is being accessed
        
    Returns:
        True if access is allowed, False otherwise
    """
    # Admins can access anyone's data
    if requesting_user_role == UserRole.ADMIN.value:
        return True
    
    # Users can only access their own data
    return requesting_user_id == target_user_id
