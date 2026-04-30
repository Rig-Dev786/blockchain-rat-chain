from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    AWS_ACCESS_KEY: str = ""
    AWS_SECRET_KEY: str = ""
    S3_BUCKET: str = "rentproof-media"
    POLYGON_RPC_URL: str
    ESCROW_CONTRACT_ADDRESS: str
    AI_SERVICE_URL: str
    AES_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
