import asyncio
from app.services.gamification import get_gamification_profile

async def main():
    user_id = '698d7a6a1457e6f39a787093' # ObjectId for new_sales@skillarix.com
    try:
        profile = await get_gamification_profile(user_id)
        print("Profile fetched:", profile)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
