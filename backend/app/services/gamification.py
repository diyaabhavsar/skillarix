from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from bson import ObjectId
from app.database import db
from app.models.gamification import (
    UserPoints, PointsTransaction, UserBadge, Badge,
    UserMilestone, Milestone, UserStreak, LeaderboardEntry, GamificationProfile
)

# Collections
points_collection = db["user_points"]
transactions_collection = db["points_transactions"]
badges_collection = db["badges"]
user_badges_collection = db["user_badges"]
milestones_collection = db["milestones"]
user_milestones_collection = db["user_milestones"]
streaks_collection = db["user_streaks"]

# Constants
XP_PER_LEVEL = 100

async def get_user_points(user_id: str) -> UserPoints:
    """Get user points, initializing if not exists."""
    points_data = points_collection.find_one({"user_id": user_id})
    if not points_data:
        points_data = {
            "user_id": user_id,
            "total_xp": 0,
            "current_level": 1,
            "xp_to_next_level": XP_PER_LEVEL,
            "lifetime_xp": 0,
            "updated_at": datetime.utcnow()
        }
        points_collection.insert_one(points_data)
    
    return UserPoints(**points_data)

async def award_xp(user_id: str, amount: int, reason: str, metadata: Optional[Dict] = None) -> Dict[str, Any]:
    """Award XP to a user and handle level ups."""
    points_data = await get_user_points(user_id)
    
    new_total_xp = points_data.total_xp + amount
    new_lifetime_xp = points_data.lifetime_xp + (amount if amount > 0 else 0)
    
    # Calculate level
    # Simple linear leveling for now: Level = 1 + (Total XP / 100)
    new_level = 1 + (new_total_xp // XP_PER_LEVEL)
    xp_to_next = XP_PER_LEVEL - (new_total_xp % XP_PER_LEVEL)
    
    # Update DB
    points_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "total_xp": new_total_xp,
                "lifetime_xp": new_lifetime_xp,
                "current_level": new_level,
                "xp_to_next_level": xp_to_next,
                "updated_at": datetime.utcnow()
            }
        }
    )
    
    # Log transaction
    try:
        transaction = PointsTransaction(
            user_id=user_id,
            amount=amount,
            reason=reason,
            metadata=metadata
        )
        tx_data = transaction.model_dump(by_alias=True, exclude={"id"})
        # Ensure _id is removed if None, to let Mongo generate it
        if "_id" in tx_data and tx_data["_id"] is None:
            del tx_data["_id"]
            
        transactions_collection.insert_one(tx_data)
        print(f"✅ Awarded {amount} XP to {user_id}. New Total: {new_total_xp}")
    except Exception as e:
        print(f"❌ Error logging transaction: {e}")
        # Even if logging fails, we return success for XP update
        
    return {
        "new_level": new_level,
        "leveled_up": new_level > points_data.current_level,
        "xp_gained": amount
    }

async def update_streak(user_id: str) -> Dict[str, Any]:
    """Update user activity streak."""
    streak_data = streaks_collection.find_one({"user_id": user_id})
    now = datetime.utcnow()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    
    if not streak_data:
        streak_data = {
            "user_id": user_id,
            "current_streak": 1,
            "longest_streak": 1,
            "last_activity_date": now,
            "streak_milestones": []
        }
        streaks_collection.insert_one(streak_data)
        return {"current_streak": 1, "status": "started"}
    
    last_date = streak_data.get("last_activity_date")
    if not last_date:
         last_date = now # Should not happen if initialized correctly

    # Check if last activity was yesterday (or today)
    last_date_day = last_date.replace(hour=0, minute=0, second=0, microsecond=0)
    diff_days = (today - last_date_day).days
    
    new_streak = streak_data["current_streak"]
    status = "maintained"
    
    if diff_days == 1:
        # Consecutive day
        new_streak += 1
        status = "increased"
    elif diff_days > 1:
        # Broken streak
        new_streak = 1
        status = "reset"
    # If diff_days == 0, streak is already updated for today
    
    longest = max(new_streak, streak_data.get("longest_streak", 0))
    
    if diff_days >= 1: # Only update if it's a new day
        streaks_collection.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "current_streak": new_streak,
                    "longest_streak": longest,
                    "last_activity_date": now
                }
            }
        )
        # Check streak badges here if needed
        await check_streak_milestones(user_id, new_streak)
        
    return {"current_streak": new_streak, "status": status}

async def check_streak_milestones(user_id: str, streak: int):
    """Check and award badges for streaks."""
    # Find active streak badges not yet earned
    badges = list(badges_collection.find({"category": "streak", "is_active": True}))
    earned_badge_ids = [b["badge_id"] for b in user_badges_collection.find({"user_id": user_id})]
    
    for badge in badges:
        b_id = str(badge["_id"])
        if b_id in earned_badge_ids:
            continue
            
        criteria = badge.get("criteria", {})
        if criteria.get("type") == "streak":
            threshold = criteria.get("value", 0)
            if streak >= threshold:
                await award_badge(user_id, badge)

async def check_milestones(user_id: str, category: str, value: int):
    """Update progress for milestones in a specific category."""
    print(f"Checking milestones for user {user_id}, category={category}, value={value}")
    
    # Find all milestones of this category
    active_milestones = list(milestones_collection.find({"category": category, "is_active": True}))
    print(f"Found {len(active_milestones)} active milestones for category '{category}'")
    
    for ms in active_milestones:
        ms_id = str(ms["_id"])
        
        # Get or create user progress
        user_ms = user_milestones_collection.find_one({"user_id": user_id, "milestone_id": ms_id})
        
        target = ms["target_value"]
        current = value 
        
        # Simpler approach: update 'current_value' to the passed value if it's higher
        
        if not user_ms:
            print(f"Creating new user milestone record for {ms['name']}")
            is_completed = current >= target
            user_milestones_collection.insert_one({
                "user_id": user_id,
                "milestone_id": ms_id,
                "current_value": current,
                "target_value": target,
                "is_completed": is_completed,
                "completed_at": datetime.utcnow() if is_completed else None,
                "progress_percentage": min(100.0, (current / target) * 100)
            })
            if is_completed:
                print(f"🎉 Milestone completed (new): {ms['name']}")
                await award_xp(user_id, ms["reward_xp"], f"milestone_completed: {ms['name']}")
        else:
            # Update if current value is different (allow updates even if not strictly greater for score changes?)
            # For score, average might fluctuate. But usually we want "max achieved".
            # If current > stored, update.
            old_val = user_ms.get("current_value", 0)
            if current >= old_val: # changed > to >= to ensure sync
                is_completed = current >= target
                
                # If already completed, don't re-complete or re-award, just update value/percentage
                already_completed = user_ms.get("is_completed", False)
                newly_completed = is_completed and not already_completed
                
                if current != old_val or newly_completed:
                     print(f"Updating milestone {ms['name']}: {old_val} -> {current}")
                     user_milestones_collection.update_one(
                        {"_id": user_ms["_id"]},
                        {
                            "$set": {
                                "current_value": current,
                                "is_completed": is_completed,
                                "completed_at": datetime.utcnow() if newly_completed else user_ms.get("completed_at"),
                                "progress_percentage": min(100.0, (current / target) * 100)
                            }
                        }
                     )
                     if newly_completed:
                        print(f"🎉 Milestone completed (update): {ms['name']}")
                        await award_xp(user_id, ms["reward_xp"], f"milestone_completed: {ms['name']}")

async def award_badge(user_id: str, badge: Dict):
    """Award a badge to a user."""
    badge_id = str(badge["_id"])
    
    # Double check if already exists
    if user_badges_collection.find_one({"user_id": user_id, "badge_id": badge_id}):
        return

    user_badges_collection.insert_one({
        "user_id": user_id,
        "badge_id": badge_id,
        "earned_at": datetime.utcnow(),
        "progress": None
    })
    
    # Award XP for badge
    await award_xp(user_id, badge["points"], f"badge_earned: {badge['name']}")

async def recalculate_streak_from_history(user_id: str):
    """
    Recalculate streak based on conversation history.
    """
    pipeline = [
        {"$match": {"user_id": ObjectId(user_id), "is_deleted": {"$ne": True}}},
        {"$project": {"created_at": 1}},
        {"$sort": {"created_at": 1}}
    ]
    conversations = list(db["conversations"].aggregate(pipeline))
    
    if not conversations:
        return
        
    # Extract unique dates (YYYY-MM-DD)
    # Ensure created_at is treated as datetime
    dates = set()
    for c in conversations:
        c_date = c.get("created_at")
        
        # Fallback to ObjectId timestamp if created_at is missing
        if not c_date and "_id" in c:
            try:
                c_date = c["_id"].generation_time
            except:
                pass
                
        if isinstance(c_date, str):
            try:
                c_date = datetime.fromisoformat(c_date.replace("Z", "+00:00"))
            except:
                continue
                
        if isinstance(c_date, datetime):
            dates.add(c_date.date())
            
    sorted_dates = sorted(list(dates))
    
    if not sorted_dates:
        return

    # Calculate longest streak
    longest_streak = 0
    current_run = 0
    last_date = None
    
    for d in sorted_dates:
        if last_date is None:
            current_run = 1
        elif (d - last_date).days == 1:
            current_run += 1
        elif (d - last_date).days > 1:
            longest_streak = max(longest_streak, current_run)
            current_run = 1
        # If diff is 0, do nothing (same day)
        last_date = d
    longest_streak = max(longest_streak, current_run)

    # Calculate current streak (ending today or yesterday)
    dates_desc = sorted_dates[::-1] # Reverse for checking current streak from most recent
    today = datetime.utcnow().date()
    yesterday = today - timedelta(days=1)
    
    current_streak = 0
    
    if dates_desc:
        last_active = dates_desc[0]
        # Streak is active if last activity was today or yesterday
        if last_active >= yesterday:
            current_streak = 1
            previous = last_active
            for d in dates_desc[1:]:
                day_diff = (previous - d).days
                if day_diff == 1:
                    current_streak += 1
                    previous = d
                elif day_diff > 1:
                    break
        else:
            current_streak = 0

    # Retrieve existing to preserve ID or other fields if needed, or just upsert
    streaks_collection.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "current_streak": current_streak,
                "longest_streak": longest_streak,
                "last_activity_date": datetime.combine(sorted_dates[-1], datetime.min.time())
            }
        },
        upsert=True
    )
    
    # Check streak badges
    await check_streak_milestones(user_id, current_streak)
    
    # Sync "streak" category milestones (UserMilestone)
    await check_milestones(user_id, "streak", current_streak)

async def sync_user_gamification(user_id: str):
    """
    Sync user's gamification stats with actual data.
    Useful for existing users or catching up missed events.
    """
    print(f"🔄 Syncing gamification for user {user_id}")
    
    # 1. Sync Sessions Count
    sessions_count = db["conversations"].count_documents({"user_id": ObjectId(user_id), "is_deleted": {"$ne": True}})
    print(f"📊 Sessions Count: {sessions_count}")
    await check_milestones(user_id, "sessions", sessions_count)
    
    # 2. Sync Streak
    await recalculate_streak_from_history(user_id)
    # Note: recalculate_streak_from_history handles the milestone check for streaks internally now

    # 3. Sync Average Score
    # Fetch all scores from possible locations
    scores_cursor = db["conversations"].find(
        {"user_id": ObjectId(user_id), "is_deleted": {"$ne": True}},
        {"score": 1, "evaluation_data.score": 1, "evaluation_data.complete_rating.total.score": 1}
    )
    
    scores = []
    for doc in scores_cursor:
        s = doc.get("score")
        if s is None:
             eval_data = doc.get("evaluation_data", {})
             if isinstance(eval_data, dict):
                 s = eval_data.get("score")
                 if s is None:
                     # Try deep nested
                     s = eval_data.get("complete_rating", {}).get("total", {}).get("score")
        
        if s is not None:
            try:
                scores.append(float(s))
            except:
                pass

    print(f"📈 Scores found: {scores}")
    
    if scores:
        MIN_SESSIONS_FOR_SCORE = 5
        
        if len(scores) >= MIN_SESSIONS_FOR_SCORE:
            avg_score = sum(scores) / len(scores)
            if max(scores) <= 10.0:
                 # Assume 0-10 scale, convert to percentage 0-100 for milestone check
                 avg_percentage = int(avg_score * 10)
            else:
                 avg_percentage = int(avg_score)
                 
            print(f"⭐ Calculated Average Score: {avg_score} -> {avg_percentage}% (from {len(scores)} sessions)")
            await check_milestones(user_id, "score", avg_percentage)
        else:
            print(f"⚠️ User has {len(scores)} scores. Need {MIN_SESSIONS_FOR_SCORE} for average score milestones. Resetting to 0.")
            try:
                # Reset all 'score' category milestones for this user
                # Find all milestone IDs for category 'score'
                score_ms = list(milestones_collection.find({"category": "score"}, {"_id": 1}))
                score_ms_ids = [str(m["_id"]) for m in score_ms]
                
                if score_ms_ids:
                    user_milestones_collection.update_many(
                        {"user_id": user_id, "milestone_id": {"$in": score_ms_ids}},
                        {"$set": {
                            "current_value": 0, 
                            "progress_percentage": 0, 
                            "is_completed": False,
                            "completed_at": None
                        }}
                    )
            except Exception as e:
                print(f"❌ Error resetting milestones: {e}")
                import traceback
                traceback.print_exc()
    else:
        print("⚠️ No scores found for user")
    
    return sessions_count

async def get_user_rank(user_id: str) -> Optional[int]:
    """Calculate user rank among non-admin users."""
    user = db["users"].find_one({"_id": ObjectId(user_id)})
    if not user or user.get("role") == "admin":
        return None

    points = await get_user_points(user_id)
    
    # Get all admin IDs to exclude
    admins = list(db["users"].find({"role": "admin"}, {"_id": 1}))
    admin_ids = []
    for a in admins:
        admin_ids.append(str(a["_id"]))
        admin_ids.append(a["_id"])

    rank = points_collection.count_documents({
        "total_xp": {"$gt": points.total_xp},
        "user_id": {"$nin": admin_ids}
    }) + 1
    
    return rank

async def get_gamification_profile(user_id: str) -> Dict[str, Any]:
    """Assemble full profile."""
    # Auto-sync essential stats on profile load
    sessions_count = await sync_user_gamification(user_id)
    
    points = await get_user_points(user_id)
    
    # Get user details for username
    user = db["users"].find_one({"_id": ObjectId(user_id)})
    username = "User"
    if user:
        username = user.get("username") or user.get("full_name") or user.get("name") or user.get("email", "User")

    # Get badges
    user_badges_cursor = user_badges_collection.find({"user_id": user_id})
    user_badges_list = list(user_badges_cursor)
    
    # Join with badge definitions
    badges_data = []
    for ub in user_badges_list:
        badge_def = badges_collection.find_one({"_id": ObjectId(ub["badge_id"])})
        if badge_def:
            full_badge = {**badge_def, "earned_at": ub["earned_at"]}
            full_badge["_id"] = str(full_badge["_id"])
            badges_data.append(full_badge)
            
    # Get streak
    streak = streaks_collection.find_one({"user_id": user_id}) or {"current_streak": 0, "longest_streak": 0}
    
    # Get milestones stats
    completed_milestones = user_milestones_collection.count_documents({"user_id": user_id, "is_completed": True})
    
    # Get Rank
    rank = await get_user_rank(user_id)

    return {
        "user_id": user_id,
        "username": username,
        "total_xp": points.total_xp,
        "current_level": points.current_level,
        "rank": rank,
        "badges": badges_data,
        "milestones_completed": completed_milestones,
        "current_streak": streak.get("current_streak", 0),
        "longest_streak": streak.get("longest_streak", 0),
        "sessions_count": sessions_count
    }

async def get_leaderboard(period: str = "all_time", limit: int = 10) -> List[Dict]:
    """Get leaderboard entries, excluding administrators."""
    # 1. Find all admin users to exclude them
    admin_users_cursor = db["users"].find({"role": "admin"}, {"_id": 1})
    admin_ids = []
    
    # Collect both string and ObjectId representations to be safe
    for admin in admin_users_cursor:
        admin_id = admin["_id"]
        admin_ids.append(admin_id) # Add as ObjectId
        if isinstance(admin_id, ObjectId):
            admin_ids.append(str(admin_id)) # Add as String
        else:
             try:
                 admin_ids.append(ObjectId(admin_id)) # Add as ObjectId if string
             except:
                 pass

    # Query: Exclude users whose 'user_id' is in the admin_ids list
    # The 'user_points' collection stores 'user_id' as string (usually)
    query = {"user_id": {"$nin": admin_ids}}
    cursor = points_collection.find(query).sort("total_xp", -1).limit(limit)
    
    entries = []
    rank = 1
    for p in cursor:
        uid = p["user_id"]
        # Fetch user details
        # Try to find user by string ID or ObjectId
        try:
            user = db["users"].find_one({"_id": ObjectId(uid)})
        except:
             user = db["users"].find_one({"_id": uid})
             
        username = "Unknown User"
        if user:
            # Try various fields for name
            username = user.get("username") or user.get("full_name") or user.get("name") or user.get("email", "User")
        
        badges_count = user_badges_collection.count_documents({"user_id": uid})
        
        # This is expensive in a loop, but fine for MVP limit=10
        try:
            sessions_count = db["conversations"].count_documents({"user_id": ObjectId(uid), "is_deleted": {"$ne": True}})
        except:
            sessions_count = 0
        
        entries.append({
            "user_id": uid,
            "username": username,
            "total_xp": p["total_xp"],
            "current_level": p["current_level"],
            "rank": rank,
            "badges_count": badges_count,
            "sessions_count": sessions_count,
            "average_score": 0, # Placeholder
            "streak_days": 0 # Placeholder
        })
        rank += 1
        
    return entries
