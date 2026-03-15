import os
import sqlalchemy
from sqlalchemy import create_engine

db_url = os.getenv("DATABASE_URL")
print(f"Testing connection to: {db_url.split('@')[1] if db_url and '@' in db_url else 'NONE'}")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        print("✅ Connection successful!")
        result = conn.execute(sqlalchemy.text("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'"))
        count = result.scalar()
        print(f"Table count: {count}")
except Exception as e:
    print(f"❌ Connection failed: {str(e)}")
