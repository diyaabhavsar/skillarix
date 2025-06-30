from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str
    API_V1_STR: str

    # Security
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    # Groq
    GROQ_API_KEY: str
    
    #openai
    OPENAI_API_KEY: str
    
    MODEL: int
    MODEL_NAME: str

    # MongoDB
    MONGODB_URL: str
    DATABASE_NAME: str

    # CORS
    CORS_ORIGINS: list

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

settings = Settings()
