import hashlib, base64
from Crypto.Cipher import AES
from jose import jwt
from datetime import datetime, timedelta
from app.core.config import settings

def hash_file_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def encrypt_aes(data: bytes) -> bytes:
    key = settings.AES_KEY.encode()[:32]
    cipher = AES.new(key, AES.MODE_GCM)
    ct, tag = cipher.encrypt_and_digest(data)
    return base64.b64encode(cipher.nonce + tag + ct)

def create_jwt(subject: str) -> str:
    exp = datetime.utcnow() + timedelta(hours=24)
    return jwt.encode({"sub": subject, "exp": exp}, settings.SECRET_KEY, algorithm="HS256")
