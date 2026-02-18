
import asyncio
import sys
sys.path.append(".")
from app.database import AsyncSessionLocal
from app.services.space_service import SpaceService
from app.models.space import Space
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        # Check all spaces
        result = await db.execute(select(Space))
        spaces = result.scalars().all()
        print(f"Total spaces: {len(spaces)}")
        for s in spaces:
            print(f"Space: {s.name} (ID: {s.id}, Workspace: {s.workspace_id})")

if __name__ == "__main__":
    asyncio.run(main())
