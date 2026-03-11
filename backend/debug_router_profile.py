import asyncio
from app.api.v1.endpoints.gamification import get_my_gamification_profile

async def main():
    token = {"id": '698d7a6a1457e6f39a787093'}
    try:
        res = await get_my_gamification_profile(token)
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
