"""
hasher.py — SHA-256 file integrity for tamper detection.

Flow:
  1. Hash raw video bytes at upload time → store hash alongside file
  2. Before inference, re-hash and compare — abort if mismatch
  3. Hash individual evidence frames → embed in verdict for on-chain anchoring
"""

import hashlib
import json
import logging
import numpy as np
import cv2

logger = logging.getLogger(__name__)


def hash_bytes(data: bytes) -> str:
    """SHA-256 hash of arbitrary bytes. Returns hex digest."""
    return hashlib.sha256(data).hexdigest()


def hash_file(path: str) -> str:
    """SHA-256 hash of a file on disk, streamed to handle large files."""
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def hash_verdict_payload(verdict: dict) -> str:
    """
    Deterministic SHA-256 hash of a verdict dict.
    Uses sort_keys=True so key ordering never affects the hash.
    """
    canonical = json.dumps(verdict, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def hash_frame(frame: np.ndarray) -> str:
    """SHA-256 hash of a single OpenCV frame (evidence anchoring)."""
    _, encoded = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
    return hash_bytes(encoded.tobytes())


def verify_file_integrity(data: bytes, expected_hash: str) -> bool:
    """
    Re-hash data and compare against stored hash.
    Returns True if intact, False if tampered / corrupted.
    """
    actual = hash_bytes(data)
    if actual != expected_hash:
        logger.warning(
            f"Integrity check FAILED — expected {expected_hash[:16]}…, got {actual[:16]}…"
        )
        return False
    logger.debug(f"Integrity check passed — {actual[:16]}…")
    return True
