"""
tests/test_hasher.py — Unit tests for SHA-256 integrity hashing.
Run with: pytest ai/tests/test_hasher.py -v
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import hashlib
from src.security.hasher import (
    hash_bytes,
    hash_verdict_payload,
    verify_file_integrity,
)


def test_hash_bytes_deterministic():
    data = b"rentproof test data"
    assert hash_bytes(data) == hash_bytes(data)


def test_hash_bytes_correct_sha256():
    data = b"hello"
    expected = hashlib.sha256(b"hello").hexdigest()
    assert hash_bytes(data) == expected


def test_hash_verdict_payload_deterministic():
    verdict = {"verdict": "FULL_REFUND", "deduction_bps": 0, "damage_delta": 0.0}
    h1 = hash_verdict_payload(verdict)
    h2 = hash_verdict_payload(verdict)
    assert h1 == h2


def test_hash_verdict_payload_key_order_independent():
    v1 = {"a": 1, "b": 2}
    v2 = {"b": 2, "a": 1}
    assert hash_verdict_payload(v1) == hash_verdict_payload(v2)


def test_verify_integrity_passes():
    data = b"some video bytes"
    h = hash_bytes(data)
    assert verify_file_integrity(data, h) is True


def test_verify_integrity_fails_on_tampered_data():
    data = b"original video bytes"
    h = hash_bytes(data)
    tampered = b"tampered video bytes"
    assert verify_file_integrity(tampered, h) is False


def test_verify_integrity_fails_on_wrong_hash():
    data = b"video"
    assert verify_file_integrity(data, "deadbeef" * 8) is False
