"""
signing/signer.py — Ed25519 asymmetric signing for verifiable AI verdicts.

Why Ed25519 (not HMAC-SHA256):
  HMAC requires the verifier to know the secret key, which means your smart
  contract or backend would need to hold the secret — defeating trustlessness.
  With Ed25519, the smart contract only needs the PUBLIC key to verify.
  The private key stays server-side and never leaves the AI service.

Key storage:
  Private key: AI_PRIVATE_KEY_PATH env var (default: keys/private_key.pem)
  Public key:  AI_PUBLIC_KEY_PATH env var  (default: keys/public_key.pem)
  → Generate both with scripts/keygen.py

Verdict signing flow:
  1. Serialize verdict dict → canonical JSON (sort_keys=True)
  2. SHA-256 hash the canonical JSON
  3. Sign the hash with Ed25519 private key
  4. Return hex-encoded signature + public key fingerprint
"""

import json
import hashlib
import logging
import os
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives import serialization
from cryptography.exceptions import InvalidSignature

logger = logging.getLogger(__name__)

PRIVATE_KEY_PATH = os.getenv("AI_PRIVATE_KEY_PATH", "keys/private_key.pem")
PUBLIC_KEY_PATH = os.getenv("AI_PUBLIC_KEY_PATH", "keys/public_key.pem")


def _load_private_key() -> Ed25519PrivateKey:
    path = Path(PRIVATE_KEY_PATH)
    if not path.exists():
        raise FileNotFoundError(
            f"Private key not found at {PRIVATE_KEY_PATH}. "
            "Run scripts/keygen.py to generate a keypair first."
        )
    with open(path, "rb") as f:
        return serialization.load_pem_private_key(f.read(), password=None)


def _load_public_key() -> Ed25519PublicKey:
    path = Path(PUBLIC_KEY_PATH)
    if not path.exists():
        raise FileNotFoundError(
            f"Public key not found at {PUBLIC_KEY_PATH}. "
            "Run scripts/keygen.py to generate a keypair first."
        )
    with open(path, "rb") as f:
        return serialization.load_pem_public_key(f.read())


def _canonical_bytes(verdict: dict) -> bytes:
    """Deterministic JSON serialization of verdict dict."""
    return json.dumps(verdict, sort_keys=True, separators=(",", ":")).encode("utf-8")


def _verdict_hash(verdict: dict) -> bytes:
    """SHA-256 of the canonical verdict JSON."""
    return hashlib.sha256(_canonical_bytes(verdict)).digest()


def sign_verdict(verdict: dict) -> dict:
    """
    Sign a verdict dict with the AI service's Ed25519 private key.

    Returns:
        {
            "verdict_hash": str,     # hex SHA-256 of canonical verdict
            "signature": str,        # hex Ed25519 signature
            "algorithm": "Ed25519",
        }
    """
    private_key = _load_private_key()
    digest = _verdict_hash(verdict)

    # Ed25519 signs the raw message (not a pre-hashed digest)
    # We sign the SHA-256 digest bytes to keep the signed message short and deterministic
    signature_bytes = private_key.sign(digest)

    result = {
        "verdict_hash": digest.hex(),
        "signature": signature_bytes.hex(),
        "algorithm": "Ed25519",
    }

    logger.info(f"Verdict signed — hash={digest.hex()[:16]}… sig={signature_bytes.hex()[:16]}…")
    return result


def verify_verdict(verdict: dict, signature_hex: str) -> bool:
    """
    Verify a verdict signature using the AI service's Ed25519 public key.

    Returns True if valid, False if tampered or wrong key.
    Call this from the backend before forwarding to the smart contract.
    """
    public_key = _load_public_key()
    digest = _verdict_hash(verdict)

    try:
        public_key.verify(bytes.fromhex(signature_hex), digest)
        logger.info("Verdict signature verified ✓")
        return True
    except InvalidSignature:
        logger.warning("Verdict signature verification FAILED — possible tampering")
        return False


def get_public_key_hex() -> str:
    """
    Return the raw Ed25519 public key as hex (32 bytes).
    Use this to register the AI service's public key in the smart contract.
    """
    public_key = _load_public_key()
    raw_bytes = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return raw_bytes.hex()
