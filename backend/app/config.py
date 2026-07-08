import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "FleetPulse"
    
    # JWT Auth settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "cyber_logistics_fleet_pulse_secret_key_2026_@_987654321")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Database Settings
    # Default to local SQLite if DATABASE_URL is not set or we are running locally
    # Otherwise use PostgreSQL URL
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/fleetpulse"
    )
    
    class Config:
        case_sensitive = True

settings = Settings()
