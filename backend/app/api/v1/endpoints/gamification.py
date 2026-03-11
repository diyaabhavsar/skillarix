from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.services.auth import verify_bearer_token
from app.services.gamification import (
    get_user_points,
    check_streak_milestones,
    update_streak,
    get_gamification_profile,
    get_leaderboard,
    check_milestones,
    award_xp,
    sync_user_gamification,
    get_user_rank
)
from app.models.gamification import (
    UserPoints, Leaderboard, Badge, UserBadge, 
    Milestone, UserMilestone, UserStreak, LeaderboardEntry,
    GamificationProfile
)
from app.database import db

router = APIRouter()

# -----------------------------------------------------------
# 1️⃣ Get User Profile (Gamification)
# -----------------------------------------------------------
@router.get("/profile", response_model=GamificationProfile)
async def get_my_gamification_profile(token=Depends(verify_bearer_token)):
    user_id = token["id"]
    profile_data = await get_gamification_profile(user_id)
    
    # Needs to match Pydantic model exactly
    return GamificationProfile(
        user_id=user_id,
        username=profile_data.get("username", "User"),
        total_xp=profile_data.get("total_xp", 0),
        current_level=profile_data.get("current_level", 1),
        rank=profile_data.get("rank"),
        badges=profile_data.get("badges", []),
        milestones_completed=profile_data.get("milestones_completed", 0),
        milestones_in_progress=[],
        current_streak=profile_data.get("current_streak", 0),
        longest_streak=profile_data.get("longest_streak", 0),
        rewards_unlocked=0,
        sessions_count=profile_data.get("sessions_count", 0),
        average_score=0.0
    )


# -----------------------------------------------------------
# 2️⃣ Get Leaderboard
# -----------------------------------------------------------
@router.get("/leaderboard")
async def get_leaderboard_view(
    period: str = Query("all_time", regex="^(all_time|monthly|weekly|daily)$"),
    limit: int = Query(10, ge=1, le=100),
    token=Depends(verify_bearer_token)
):
    entries = await get_leaderboard(period, limit)
    
    # Transform to Pydantic model
    entry_models = [
        LeaderboardEntry(
            user_id=str(e["user_id"]),
            username=e["username"],
            total_xp=e["total_xp"],
            current_level=e["current_level"],
            rank=e["rank"],
            badges_count=e["badges_count"],
            sessions_count=e["sessions_count"],
            average_score=e["average_score"],
            streak_days=e["streak_days"]
        ) for e in entries
    ]
    
    return Leaderboard(
        period=period,
        entries=entry_models,
        total_users=len(entries) # Should be count of all users in DB really
    )


# -----------------------------------------------------------
# 3️⃣ Get User Badges
# -----------------------------------------------------------
@router.get("/badges", response_model=List[dict])
async def get_my_badges(token=Depends(verify_bearer_token)):
    user_id = token["id"]
    
    # Join with UserBadge
    user_badges = list(db["user_badges"].find({"user_id": user_id}))
    
    result = []
    for ub in user_badges:
        badge_def = db["badges"].find_one({"_id": ObjectId(ub["badge_id"])})
        if badge_def:
            badge_def["_id"] = str(badge_def["_id"])
            badge_def["earned_at"] = ub["earned_at"]
            result.append(badge_def)
            
    return result


# -----------------------------------------------------------
# 4️⃣ Get User Points
# -----------------------------------------------------------
@router.get("/points", response_model=UserPoints)
async def get_my_points(token=Depends(verify_bearer_token)):
    user_id = token["id"]
    return await get_user_points(user_id)


# -----------------------------------------------------------
# 5️⃣ Get User Milestones
# -----------------------------------------------------------
@router.get("/milestones")
async def get_my_milestones(token=Depends(verify_bearer_token)):
    user_id = token["id"]
    
    # Ensure stats are synced (e.g. session counts)
    await sync_user_gamification(user_id)    
    # Return both defined milestones and user progress
    all_milestones = list(db["milestones"].find({"is_active": True}))
    user_progress = list(db["user_milestones"].find({"user_id": user_id}))
    
    progress_map = {str(up["milestone_id"]): up for up in user_progress}
    
    detailed_milestones = []
    for ms in all_milestones:
        ms_id = str(ms["_id"])
        prog = progress_map.get(ms_id, {})
        
        detailed_milestones.append({
            "id": ms_id,
            "name": ms["name"],
            "description": ms["description"],
            "target_value": ms["target_value"],
            "current_value": prog.get("current_value", 0),
            "is_completed": prog.get("is_completed", False),
            "progress_percentage": prog.get("progress_percentage", 0.0),
            "reward_xp": ms["reward_xp"],
            "icon": ms.get("icon", "")
        })
        
    return detailed_milestones


# -----------------------------------------------------------
# 6️⃣ Get User Streak
# -----------------------------------------------------------
@router.get("/streak", response_model=UserStreak)
async def get_my_streak(token=Depends(verify_bearer_token)):
    user_id = token["id"]
    
    # Auto-update streak checking
    result = await update_streak(user_id)
    
    return UserStreak(
        user_id=user_id,
        current_streak=result["current_streak"],
        longest_streak=result.get("longest_streak", 0) # This might be missing if update returns minimal
    )


# -----------------------------------------------------------
# 7️⃣ Get User Rank
# -----------------------------------------------------------
@router.get("/rank")
async def get_my_rank(token=Depends(verify_bearer_token)):
    user_id = token["id"]
    rank = await get_user_rank(user_id)
    return {"rank": rank, "percentile": 0}


# -----------------------------------------------------------
# 8️⃣ Get Gamification Stats (Admin)
# -----------------------------------------------------------
@router.get("/stats")
async def get_gamification_stats(token=Depends(verify_bearer_token)):
    if token["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
        
    total_xp_awarded = 0
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$total_xp"}}}]
    res = list(db["user_points"].aggregate(pipeline))
    if res:
        total_xp_awarded = res[0]["total"]
        
    total_badges = db["user_badges"].count_documents({})
    
    return {
        "total_xp_distributed": total_xp_awarded,
        "total_badges_earned": total_badges,
        "active_users_gamified": db["user_points"].count_documents({})
    }
