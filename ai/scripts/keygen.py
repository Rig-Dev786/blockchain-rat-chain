"""
scripts/keygen.py — One-time Ed25519 keypair generation for the AI signing service.

Run this ONCE before starting the AI service:
    python scripts/keygen.py

Outputs:
    keys/private_key.pem  — Keep this SECRET. Never commit to git.
    keys/public_key.pem   — Share this with the backend + smart contract.
    keys/public_key.hex   — Raw 32-byte hex, ready to paste into Solidity.

The private key is stored unencrypted for simplicity in development.
In production, protect it with a passphrase or use a secrets manager (AWS Secrets
Manager, HashiCorp Vault, etc.).
"""

import os
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization


def generate_keypair(output_dir: str = "keys") -> None:
    keys_dir = Path(output_dir)
    keys_dir.mkdir(exist_ok=True)

    private_path = keys_dir / "private_key.pem"
    public_pem_path = keys_dir / "public_key.pem"
    public_hex_path = keys_dir / "public_key.hex"

    if private_path.exists():
        print(f"⚠️  Private key already exists at {private_path}. Skipping to avoid overwrite.")
        print("   Delete keys/ manually if you want to regenerate.")
        return

    # Generate
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    # Serialize private key (PEM, no password)
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )

    # Serialize public key (PEM)
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    # Raw hex (32 bytes) — for smart contract registration
    public_raw_hex = public_key.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    ).hex()

    # Write files
    private_path.write_bytes(private_pem)
    public_pem_path.write_bytes(public_pem)
    public_hex_path.write_text(public_raw_hex)

    # Lock private key file permissions (Unix only)
    try:
        os.chmod(private_path, 0o600)
    except Exception:
        pass

    print("✅ Ed25519 keypair generated:")
    print(f"   Private key: {private_path}  ← KEEP SECRET")
    print(f"   Public key (PEM): {public_pem_path}")
    print(f"   Public key (hex): {public_hex_path}")
    print()
    print(f"   Public key hex (for smart contract):\n   {public_raw_hex}")
    print()
    print("   ⚠️  Add keys/private_key.pem to .gitignore immediately!")


if __name__ == "__main__":
    generate_keypair()
