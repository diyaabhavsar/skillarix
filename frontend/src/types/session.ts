export type Message = {
  role: "system" | "user";
  content: string;
  evaluation?: {
    score: number;
    feedback: string;
    idealAnswer?: string;
  };
};

export type FilterSettings = {
  difficultyLevel: "easy" | "medium" | "hard";
  customerPersona: string;
  focusAreas: string[];
  questionCount: number;
};

// User roles in the system
export type UserRole = "admin" | "salesman" | "employee";

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  active?: boolean;
}

// Permission types for frontend access control
export enum Permission {
  // User Management
  VIEW_ALL_USERS = "view_all_users",
  CREATE_USER = "create_user",
  EDIT_USER = "edit_user",
  DELETE_USER = "delete_user",
  
  // Product Management
  VIEW_PRODUCTS = "view_products",
  CREATE_PRODUCT = "create_product",
  EDIT_PRODUCT = "edit_product",
  DELETE_PRODUCT = "delete_product",
  
  // Category Management
  VIEW_CATEGORIES = "view_categories",
  CREATE_CATEGORY = "create_category",
  EDIT_CATEGORY = "edit_category",
  DELETE_CATEGORY = "delete_category",
  
  // Test Configuration Management
  VIEW_TEST_CONFIGS = "view_test_configs",
  CREATE_TEST_CONFIG = "create_test_config",
  EDIT_TEST_CONFIG = "edit_test_config",
  DELETE_TEST_CONFIG = "delete_test_config",
  
  // Training Sessions
  START_TRAINING_SESSION = "start_training_session",
  VIEW_OWN_SESSIONS = "view_own_sessions",
  VIEW_ALL_SESSIONS = "view_all_sessions",
  DELETE_OWN_SESSIONS = "delete_own_sessions",
  DELETE_ALL_SESSIONS = "delete_all_sessions",
  
  // Analytics & Reports
  VIEW_OWN_ANALYTICS = "view_own_analytics",
  VIEW_ALL_ANALYTICS = "view_all_analytics",
  EXPORT_REPORTS = "export_reports",
  
  // System Settings
  MANAGE_SYSTEM_SETTINGS = "manage_system_settings",
  VIEW_SYSTEM_LOGS = "view_system_logs",
}

// Role-Permission mapping (matches backend)
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Full access
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
    Permission.VIEW_OWN_ANALYTICS,
    Permission.VIEW_ALL_ANALYTICS,
    Permission.EXPORT_REPORTS,
    Permission.MANAGE_SYSTEM_SETTINGS,
    Permission.VIEW_SYSTEM_LOGS,
  ],
  salesman: [
    // Limited access - training focused
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_CATEGORIES,
    Permission.VIEW_TEST_CONFIGS,
    Permission.START_TRAINING_SESSION,
    Permission.VIEW_OWN_SESSIONS,
    Permission.DELETE_OWN_SESSIONS,
    Permission.VIEW_OWN_ANALYTICS,
  ],
  employee: [
    // Legacy role - similar to salesman with test config creation
    Permission.VIEW_PRODUCTS,
    Permission.VIEW_CATEGORIES,
    Permission.VIEW_TEST_CONFIGS,
    Permission.CREATE_TEST_CONFIG,
    Permission.START_TRAINING_SESSION,
    Permission.VIEW_OWN_SESSIONS,
    Permission.DELETE_OWN_SESSIONS,
    Permission.VIEW_OWN_ANALYTICS,
  ],
};

// Helper function to check if user has permission
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
}

// Helper function to check if user has any of the permissions
export function hasAnyPermission(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Helper function to check if user has all permissions
export function hasAllPermissions(userRole: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

