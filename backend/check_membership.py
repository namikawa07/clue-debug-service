
import asyncio
import sys
sys.path.append(".")
from app.database import AsyncSessionLocal
from sqlalchemy import select
from app.models.member import Member
from app.models.user import User

async def main():
    async with AsyncSessionLocal() as db:
        # Check memberships for user 'jf23xhj09k3h'
        result = await db.execute(select(Member).where(Member.user_id == 'jf23xhj09k3h'))
        members = result.scalars().all()
        
        print(f"Memberships for 'developer' (jf23xhj09k3h):")
        for m in members:
            print(f" - Workspace: {m.workspace_id}, Role: {m.role}")
            
        # Also check for 'Mohammed anfas K P'
        result = await db.execute(select(User).where(User.name.ilike('%anfas%')))
        users = result.scalars().all()
        for u in users:
            print(f"User found: {u.name} ({u.id})")
            m_res = await db.execute(select(Member).where(Member.user_id == u.id))
            for m in m_res.scalars().all():
                 print(f"   - Member of {m.workspace_id} as {m.role}")

if __name__ == "__main__":
    asyncio.run(main())
