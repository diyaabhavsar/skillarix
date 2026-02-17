from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from datetime import datetime
from ....services.auth import verify_bearer_token
from ....database import db

router = APIRouter()

streaks_collection = db["user_streaks"]

@router.get("/", response_model=List[Dict[str, Any]])
async def get_notifications(
    token: dict = Depends(verify_bearer_token)
):
    """
    Get generic notifications for the user.
    Currently checks for daily streak reminders.
    """
    user_id = token.get("sub")
    notifications = []
    
    # Check Streak Status
    streak_data = streaks_collection.find_one({"user_id": user_id})
    today = datetime.utcnow().date()
    
    if streak_data:
        last_activity = streak_data.get("last_activity_date")
        current_streak = streak_data.get("current_streak", 0)
        
        if last_activity:
            last_date = last_activity.date()
            if last_date < today:
                # User hasn't practiced today
                notifications.append({
                    "id": "daily_streak_reminder",
                    "type": "warning",
                    "title": "Streak Risk!",
                    "message": f"You haven't taken a test today! Complete one now to keep your {current_streak} day streak alive.",
                    "timestamp": datetime.utcnow().isoformat(),
                    "read": False,
                    "action_link": "/practice" 
                })
    else:
        # No streak yet
        notifications.append({
            "id": "start_streak",
            "type": "info",
            "title": "Start Your Streak",
            "message": "Take your first assessment today to start building your streak!",
            "timestamp": datetime.utcnow().isoformat(),
            "read": False,
             "action_link": "/practice"
        })

    return notifications
