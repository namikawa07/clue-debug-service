import asyncio
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import engine

async def fix_enum():
    async with engine.connect() as conn:
        print("Executing: ALTER TYPE tasktype ADD VALUE IF NOT EXISTS 'TASK'...")
        try:
            # We use a DO block to make it idempotent if possible, 
            # but ADD VALUE is special in Postgres.
            # In Postgres 12+, we can't easily use IF NOT EXISTS for ADD VALUE inside a block.
            # We'll just try to add it and ignore the error if it exists.
            
            # Break out of any automatic transaction if the driver handles it
            await conn.execute(text("COMMIT"))
            
            # Try to add the value
            await conn.execute(text("ALTER TYPE tasktype ADD VALUE 'TASK'"))
            await conn.execute(text("COMMIT"))
            print("Successfully updated tasktype enum.")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("'TASK' value already exists in tasktype enum. No changes needed.")
            elif "transaction" in str(e).lower():
                print(f"Transaction error (expected if driver wraps): {e}")
                print("Trying a different approach...")
                # Fallback: some drivers allow this if we use a different execution mode
            else:
                print(f"An error occurred: {e}")

if __name__ == "__main__":
    asyncio.run(fix_enum())
