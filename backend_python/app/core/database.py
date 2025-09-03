from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from urllib.parse import quote_plus
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

DB_USERNAME = os.getenv("DB_USERNAME")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_DATABASE")
DB_HOSTNAME = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_CONNECTION = os.getenv("DB_CONNECTION")

# Build MongoDB URL based on whether credentials are provided
if DB_USERNAME and DB_PASSWORD:
    MONGO_URL = f"{DB_CONNECTION}://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOSTNAME}:{DB_PORT}/{DB_NAME}"
else:
    MONGO_URL = f"{DB_CONNECTION}://{DB_HOSTNAME}:{DB_PORT}/{DB_NAME}"

# Async MongoDB client for FastAPI
client = None
database = None

def init_db():
    """Initialize the MongoDB connection and test it."""
    global client, database
    try:
        client = AsyncIOMotorClient(MONGO_URL)
        database = client[DB_NAME]
        
        # Test connection with sync client
        sync_client = MongoClient(MONGO_URL)
        sync_client.admin.command('ping')
        sync_client.close()
        
        logger.info("MongoDB connection successful.")
        return database
    except Exception as e:
        logger.error(f"Error initializing MongoDB: {e}")
        raise

def get_database():
    """Get the MongoDB database instance."""
    if database is None:
        init_db()
    return database

def get_db():
    """Provide database instance for dependency injection."""
    return get_database()

def close_db():
    """Close the MongoDB connection."""
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")