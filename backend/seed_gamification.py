"""
Seed script to populate the database with initial badges and milestones.
Run this script once to initialize the gamification system.
"""

import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import db

badges_collection = db["badges"]
milestones_collection = db["milestones"]


# ========================================
# BADGE DEFINITIONS
# ========================================

BADGES = [
    # SKILL BADGES
    {
        "name": "first_conversation",
        "description": "Complete your first sales conversation",
        "icon": "🎯",
        "category": "skill",
        "criteria": {"type": "sessions", "value": 1, "condition": "gte"},
        "points": 50,
        "rarity": "common",
        "is_active": True
    },
    {
        "name": "perfect_score",
        "description": "Achieve a perfect 10/10 score",
        "icon": "⭐",
        "category": "skill",
        "criteria": {"type": "perfect_score", "value": 10, "condition": "eq"},
        "points": 200,
        "rarity": "epic",
        "is_active": True
    },
    {
        "name": "high_performer",
        "description": "Score 8 or higher on a conversation",
        "icon": "🏆",
        "category": "skill",
        "criteria": {"type": "score", "value": 8, "condition": "gte"},
        "points": 100,
        "rarity": "rare",
        "is_active": True
    },
    {
        "name": "sales_expert",
        "description": "Maintain an average score of 80% or higher",
        "icon": "💎",
        "category": "skill",
        "criteria": {"type": "average_score", "value": 80, "condition": "gte"},
        "points": 300,
        "rarity": "legendary",
        "is_active": True
    },
    {
        "name": "objection_handler",
        "description": "Excel in handling objections (Sales Strategy 3/3)",
        "icon": "🛡️",
        "category": "skill",
        "criteria": {"type": "skill_category", "category": "sales_strategy", "threshold": 3},
        "points": 150,
        "rarity": "rare",
        "is_active": True
    },
    {
        "name": "technical_master",
        "description": "Perfect technical accuracy (2/2)",
        "icon": "🔬",
        "category": "skill",
        "criteria": {"type": "skill_category", "category": "technical_accuracy", "threshold": 2},
        "points": 150,
        "rarity": "rare",
        "is_active": True
    },
    
    # MILESTONE BADGES
    {
        "name": "10_conversations",
        "description": "Complete 10 sales conversations",
        "icon": "🎖️",
        "category": "milestone",
        "criteria": {"type": "sessions", "value": 10, "condition": "gte"},
        "points": 200,
        "rarity": "rare",
        "is_active": True
    },
    {
        "name": "25_conversations",
        "description": "Complete 25 sales conversations",
        "icon": "🏅",
        "category": "milestone",
        "criteria": {"type": "sessions", "value": 25, "condition": "gte"},
        "points": 400,
        "rarity": "epic",
        "is_active": True
    },
    {
        "name": "50_conversations",
        "description": "Complete 50 sales conversations",
        "icon": "👑",
        "category": "milestone",
        "criteria": {"type": "sessions", "value": 50, "condition": "gte"},
        "points": 800,
        "rarity": "legendary",
        "is_active": True
    },
    {
        "name": "100_conversations",
        "description": "Complete 100 sales conversations - Master Trainer!",
        "icon": "🌟",
        "category": "milestone",
        "criteria": {"type": "sessions", "value": 100, "condition": "gte"},
        "points": 1500,
        "rarity": "legendary",
        "is_active": True
    },
    
    # STREAK BADGES
    {
        "name": "week_streak_badge",
        "description": "Maintain a 7-day activity streak",
        "icon": "🔥",
        "category": "streak",
        "criteria": {"type": "streak", "value": 7, "condition": "gte"},
        "points": 150,
        "rarity": "rare",
        "is_active": True
    },
    {
        "name": "month_streak_badge",
        "description": "Maintain a 30-day activity streak",
        "icon": "🔥🔥",
        "category": "streak",
        "criteria": {"type": "streak", "value": 30, "condition": "gte"},
        "points": 500,
        "rarity": "epic",
        "is_active": True
    },
    {
        "name": "quarter_streak_badge",
        "description": "Maintain a 90-day activity streak",
        "icon": "🔥🔥🔥",
        "category": "streak",
        "criteria": {"type": "streak", "value": 90, "condition": "gte"},
        "points": 1000,
        "rarity": "legendary",
        "is_active": True
    },
    {
        "name": "year_streak_badge",
        "description": "Maintain a 365-day activity streak - Unstoppable!",
        "icon": "🔥👑",
        "category": "streak",
        "criteria": {"type": "streak", "value": 365, "condition": "gte"},
        "points": 5000,
        "rarity": "legendary",
        "is_active": True
    },
    
    # LEVEL BADGES
    {
        "name": "level_5_badge",
        "description": "Reach Level 5",
        "icon": "⚡",
        "category": "milestone",
        "criteria": {"type": "level", "value": 5, "condition": "gte"},
        "points": 100,
        "rarity": "common",
        "is_active": True
    },
    {
        "name": "level_10_badge",
        "description": "Reach Level 10",
        "icon": "⚡⚡",
        "category": "milestone",
        "criteria": {"type": "level", "value": 10, "condition": "gte"},
        "points": 250,
        "rarity": "rare",
        "is_active": True
    },
    {
        "name": "level_25_badge",
        "description": "Reach Level 25",
        "icon": "⚡⚡⚡",
        "category": "milestone",
        "criteria": {"type": "level", "value": 25, "condition": "gte"},
        "points": 500,
        "rarity": "epic",
        "is_active": True
    },
    {
        "name": "level_50_badge",
        "description": "Reach Level 50",
        "icon": "⚡👑",
        "category": "milestone",
        "criteria": {"type": "level", "value": 50, "condition": "gte"},
        "points": 1000,
        "rarity": "legendary",
        "is_active": True
    },
    {
        "name": "level_100_badge",
        "description": "Reach Level 100 - Legendary Status!",
        "icon": "⚡🌟",
        "category": "milestone",
        "criteria": {"type": "level", "value": 100, "condition": "gte"},
        "points": 5000,
        "rarity": "legendary",
        "is_active": True
    },
    
    # SPECIAL BADGES
    {
        "name": "early_adopter",
        "description": "One of the first users of Skillarix",
        "icon": "🚀",
        "category": "special",
        "criteria": {"type": "manual"},
        "points": 500,
        "rarity": "epic",
        "is_active": True
    },
    {
        "name": "consistent_learner",
        "description": "Complete at least 5 conversations per week for 4 weeks",
        "icon": "📚",
        "category": "special",
        "criteria": {"type": "manual"},
        "points": 400,
        "rarity": "rare",
        "is_active": True
    },
    {
        "name": "top_10_leaderboard",
        "description": "Reach Top 10 on the global leaderboard",
        "icon": "🥇",
        "category": "special",
        "criteria": {"type": "manual"},
        "points": 1000,
        "rarity": "legendary",
        "is_active": True
    }
]


# ========================================
# MILESTONE DEFINITIONS
# ========================================

MILESTONES = [
    # SESSION MILESTONES
    {
        "name": "Beginner Trainer",
        "description": "Complete 5 sales conversations",
        "category": "sessions",
        "target_value": 5,
        "reward_xp": 100,
        "icon": "🎯",
        "is_active": True
    },
    {
        "name": "Intermediate Trainer",
        "description": "Complete 20 sales conversations",
        "category": "sessions",
        "target_value": 20,
        "reward_xp": 300,
        "icon": "🎖️",
        "is_active": True
    },
    {
        "name": "Advanced Trainer",
        "description": "Complete 50 sales conversations",
        "category": "sessions",
        "target_value": 50,
        "reward_xp": 800,
        "icon": "🏅",
        "is_active": True
    },
    {
        "name": "Expert Trainer",
        "description": "Complete 100 sales conversations",
        "category": "sessions",
        "target_value": 100,
        "reward_xp": 2000,
        "icon": "👑",
        "is_active": True
    },
    
    # SCORE MILESTONES
    {
        "name": "Rising Star",
        "description": "Achieve an average score of 60%",
        "category": "score",
        "target_value": 60,
        "reward_xp": 200,
        "icon": "⭐",
        "is_active": True
    },
    {
        "name": "High Achiever",
        "description": "Achieve an average score of 75%",
        "category": "score",
        "target_value": 75,
        "reward_xp": 400,
        "icon": "🌟",
        "is_active": True
    },
    {
        "name": "Sales Champion",
        "description": "Achieve an average score of 85%",
        "category": "score",
        "target_value": 85,
        "reward_xp": 800,
        "icon": "🏆",
        "is_active": True
    },
    {
        "name": "Sales Legend",
        "description": "Achieve an average score of 95%",
        "category": "score",
        "target_value": 95,
        "reward_xp": 2000,
        "icon": "💎",
        "is_active": True
    },
    
    # STREAK MILESTONES
    {
        "name": "Committed Learner",
        "description": "Maintain a 3-day streak",
        "category": "streak",
        "target_value": 3,
        "reward_xp": 50,
        "icon": "🔥",
        "is_active": True
    },
    {
        "name": "Dedicated Professional",
        "description": "Maintain a 14-day streak",
        "category": "streak",
        "target_value": 14,
        "reward_xp": 300,
        "icon": "🔥🔥",
        "is_active": True
    },
    {
        "name": "Unstoppable Force",
        "description": "Maintain a 60-day streak",
        "category": "streak",
        "target_value": 60,
        "reward_xp": 1000,
        "icon": "🔥🔥🔥",
        "is_active": True
    },
    
    # BADGE COLLECTION MILESTONES
    {
        "name": "Badge Collector",
        "description": "Earn 5 different badges",
        "category": "badges",
        "target_value": 5,
        "reward_xp": 150,
        "icon": "🎖️",
        "is_active": True
    },
    {
        "name": "Badge Hunter",
        "description": "Earn 10 different badges",
        "category": "badges",
        "target_value": 10,
        "reward_xp": 400,
        "icon": "🏅",
        "is_active": True
    },
    {
        "name": "Badge Master",
        "description": "Earn 20 different badges",
        "category": "badges",
        "target_value": 20,
        "reward_xp": 1000,
        "icon": "👑",
        "is_active": True
    }
]


def seed_badges():
    """Seed badges into the database."""
    print("🎯 Seeding badges...")
    
    # Clear existing badges (optional - comment out if you want to keep existing)
    # badges_collection.delete_many({})
    
    inserted_count = 0
    updated_count = 0
    
    for badge_data in BADGES:
        # Check if badge already exists
        existing = badges_collection.find_one({"name": badge_data["name"]})
        
        if existing:
            # Update existing badge
            badges_collection.update_one(
                {"name": badge_data["name"]},
                {"$set": {**badge_data, "updated_at": datetime.utcnow()}}
            )
            updated_count += 1
            print(f"  ✅ Updated: {badge_data['name']}")
        else:
            # Insert new badge
            badge_data["created_at"] = datetime.utcnow()
            badges_collection.insert_one(badge_data)
            inserted_count += 1
            print(f"  ✨ Created: {badge_data['name']}")
    
    print(f"\n✅ Badges seeded: {inserted_count} created, {updated_count} updated")


def seed_milestones():
    """Seed milestones into the database."""
    print("\n🎯 Seeding milestones...")
    
    # Clear existing milestones (optional - comment out if you want to keep existing)
    # milestones_collection.delete_many({})
    
    inserted_count = 0
    updated_count = 0
    
    for milestone_data in MILESTONES:
        # Check if milestone already exists
        existing = milestones_collection.find_one({"name": milestone_data["name"]})
        
        if existing:
            # Update existing milestone
            milestones_collection.update_one(
                {"name": milestone_data["name"]},
                {"$set": {**milestone_data, "updated_at": datetime.utcnow()}}
            )
            updated_count += 1
            print(f"  ✅ Updated: {milestone_data['name']}")
        else:
            # Insert new milestone
            milestone_data["created_at"] = datetime.utcnow()
            milestones_collection.insert_one(milestone_data)
            inserted_count += 1
            print(f"  ✨ Created: {milestone_data['name']}")
    
    print(f"\n✅ Milestones seeded: {inserted_count} created, {updated_count} updated")


def main():
    """Main seeding function."""
    print("=" * 60)
    print("🎮 GAMIFICATION SYSTEM SEEDER")
    print("=" * 60)
    
    try:
        seed_badges()
        seed_milestones()
        
        print("\n" + "=" * 60)
        print("✅ SEEDING COMPLETE!")
        print("=" * 60)
        print(f"\nTotal Badges: {badges_collection.count_documents({})}")
        print(f"Total Milestones: {milestones_collection.count_documents({})}")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
