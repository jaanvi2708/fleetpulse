import logging
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fleetpulse.database")

DATABASE_URL = settings.DATABASE_URL
engine = None
SessionLocal = None

# Attempt to connect to PostgreSQL, fallback to SQLite if it fails
try:
    if DATABASE_URL.startswith("postgresql"):
        logger.info("Attempting connection to PostgreSQL database...")
        # Add connect_timeout to avoid hanging indefinitely if Postgres is down
        engine = create_engine(
            DATABASE_URL, 
            pool_pre_ping=True,
            connect_args={"connect_timeout": 5}
        )
        # Test connection
        with engine.connect() as conn:
            logger.info("Successfully connected to PostgreSQL database.")
except Exception as e:
    logger.warning(f"Failed to connect to PostgreSQL: {e}. Falling back to SQLite database.")
    engine = None

if engine is None:
    # Use SQLite fallback
    FALLBACK_URL = "sqlite:///./fleetpulse.db"
    logger.info(f"Initializing SQLite database at: {FALLBACK_URL}")
    engine = create_engine(
        FALLBACK_URL, 
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
