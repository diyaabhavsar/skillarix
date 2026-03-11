from datetime import datetime
from typing import Optional, List, Annotated
from pydantic import BaseModel, Field, BeforeValidator
from bson import ObjectId

# Helper for Pydantic v2 to handle ObjectId
PyObjectId = Annotated[str, BeforeValidator(str)]

# ========================================
# BADGE MODELS
# ========================================

class Badge(BaseModel):
    """
    Represents a badge/achievement that users can earn.
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    name: str
    description: str
    icon: str  # Icon name or URL
    category: str  # "skill", "milestone", "special", "streak"
    criteria: dict  # Conditions to earn this badge
    points: int  # XP points awarded
    rarity: str  # "common", "rare", "epic", "legendary"
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserBadge(BaseModel):
    """
    Represents a badge earned by a user.
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: str
    badge_id: str
    earned_at: datetime = Field(default_factory=datetime.utcnow)
    progress: Optional[dict] = None  # For progressive badges
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ========================================
# POINTS & LEVELS MODELS
# ========================================

class UserPoints(BaseModel):
    """
    Tracks user's XP points and level.
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: str
    total_xp: int = 0
    current_level: int = 1
    xp_to_next_level: int = 100
    lifetime_xp: int = 0  # Never decreases
    rank: Optional[int] = None  # Global rank
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class PointsTransaction(BaseModel):
    """
    Records XP gain/loss transactions.
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: str
    amount: int  # Can be positive or negative
    reason: str  # "conversation_complete", "badge_earned", "streak_bonus", etc.
    metadata: Optional[dict] = None  # Additional context
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ========================================
# LEADERBOARD MODELS
# ========================================

class LeaderboardEntry(BaseModel):
    """
    Represents a user's position on the leaderboard.
    """
    user_id: str
    username: str
    email: Optional[str] = None
    total_xp: int
    current_level: int
    rank: int
    badges_count: int
    sessions_count: int
    average_score: float
    streak_days: int = 0
    
    class Config:
        populate_by_name = True


class Leaderboard(BaseModel):
    """
    Leaderboard response with filters.
    """
    period: str  # "all_time", "monthly", "weekly", "daily"
    entries: List[LeaderboardEntry]
    total_users: int
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True


# ========================================
# MILESTONE MODELS
# ========================================

class Milestone(BaseModel):
    """
    Represents a skill milestone/achievement.
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    name: str
    description: str
    category: str  # "sessions", "score", "streak", "skill_mastery"
    target_value: int  # e.g., 10 sessions, 80% avg score
    reward_xp: int
    reward_badge_id: Optional[str] = None
    icon: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserMilestone(BaseModel):
    """
    Tracks user progress toward milestones.
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: str
    milestone_id: str
    current_value: int = 0
    target_value: int
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    progress_percentage: float = 0.0
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ========================================
# STREAK MODELS
# ========================================

class UserStreak(BaseModel):
    """
    Tracks user's daily activity streak.
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: str
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[datetime] = None
    streak_milestones: List[int] = []  # [7, 14, 30, 60, 90, 180, 365]
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ========================================
# REWARD MODELS
# ========================================

class Reward(BaseModel):
    """
    Represents a reward that can be unlocked.
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    name: str
    description: str
    type: str  # "avatar", "theme", "title", "feature_unlock"
    cost_xp: int  # XP required to unlock
    required_level: int = 1
    required_badges: List[str] = []
    icon: str
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserReward(BaseModel):
    """
    Tracks rewards unlocked by user.
    """
    id: Optional[PyObjectId] = Field(None, alias="_id")
    user_id: str
    reward_id: str
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)
    is_equipped: bool = False  # For avatars, themes, titles
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ========================================
# GAMIFICATION PROFILE
# ========================================

class GamificationProfile(BaseModel):
    """
    Complete gamification profile for a user.
    """
    user_id: str
    username: str
    total_xp: int
    current_level: int
    rank: Optional[int] = None
    badges: List[dict] = []
    milestones_completed: int = 0
    milestones_in_progress: List[dict] = []
    current_streak: int = 0
    longest_streak: int = 0
    rewards_unlocked: int = 0
    sessions_count: int = 0
    average_score: float = 0.0
    
    class Config:
        populate_by_name = True
