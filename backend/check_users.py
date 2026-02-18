
import asyncio
import os
import sys

# Add root directory to path so we can import app modules
sys.path.append(".")

from app.database import AsyncSessionLocal
from app.services.member_service import MemberService

async def main():
    async with AsyncSessionLocal() as db:
        # Assuming workspace_id='ws_01jk5' or we can query active workspaces first
        # Let's query Spaces first to find a workspace ID if needed, 
        # or just query members directly if we know the workspace ID.
        # But wait, MemberService.list_workspace_members takes workspace_id.
        
        # Let's try to query Users table directly to see if 'jf23xhj09k3h' exists
        from app.models.user import User
        from sqlalchemy import select
        
        result = await db.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.name} (ID: {u.id}, SupabaseID: {u.supabase_id})")

if __name__ == "__main__":
    asyncio.run(main())
