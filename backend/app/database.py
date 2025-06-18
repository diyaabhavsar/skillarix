import os
from dotenv import load_dotenv
from pymongo import MongoClient
from .config import settings

# Load environment variables from a .env file
load_dotenv()

# Retrieve MongoDB connection URL and database name from environment variables
mongo_url = settings.MONGODB_URL
db_name = settings.DATABASE_NAME

# Create a MongoClient instance
mongo_client = MongoClient(mongo_url)

# Select the database using the provided name
db = mongo_client[db_name]


class MongoDB:
    def __init__(self):
        """
        MongoDB class for managing the MongoDB connection.

        Attributes:
            client (MongoClient): The MongoDB client instance.
        """
        self.client = MongoClient(mongo_url)

    async def __aenter__(self):
        """
        Async context manager entry point. Returns the selected database.

        Returns:
            Database: The selected MongoDB database.
        """
        return self.client[db_name]

    async def __aexit__(self, exc_type, exc, tb):
        """
        Async context manager exit point. Closes the MongoDB client.

        Args:
            exc_type: The exception type.
            exc: The exception instance.
            tb: The traceback object.
        """
        self.client.close()


async def get_db():
    """
    Async function for obtaining a MongoDB database instance.

    Yields:
        Database: The selected MongoDB database.
    """
    async with MongoDB() as db:
        yield db