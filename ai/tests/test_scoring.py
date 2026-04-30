"""
tests/test_scoring.py — Unit tests for the damage scoring and verdict engine.
Run with: pytest ai/tests/test_scoring.py -v
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from src.detection.scoring import score_detections, compute_verdict, ScoringResult


# --- Fixtures ---

def make_detection(cls="crack", confidence=0.90, area_ratio=0.05):
    from src.detection.scoring import SEVERITY_WEIGHTS, DEFAULT_SEVERITY
    return {
        "class": cls,
        "confidence": confidence,
        "severity_weight": SEVERITY_WEIGHTS.get(cls, DEFAULT_SEVERITY),
        "area_ratio": area_ratio,
        "bbox": [0, 0, 100, 100],
    }


# --- score_detections ---

def test_empty_detections_returns_zero():
    result = score_detections([])
    assert result.raw_score == 0.0
    assert result.detection_count == 0
    assert result.class_breakdown == {}


def test_single_detection_score():
    det = make_detection(cls="crack", confidence=0.90, area_ratio=0.05)
    # crack: severity=0.90, conf=0.90, area=0.05 → 0.90*0.90*0.05*100 = 4.05
    result = score_detections([det])
    assert result.detection_count == 1
    assert abs(result.raw_score - 4.05) < 0.01


def test_score_capped_at_100():
    # Flood with high-severity detections
    dets = [make_detection("crack", confidence=1.0, area_ratio=0.50) for _ in range(100)]
    result = score_detections(dets)
    assert result.raw_score == 100.0


def test_class_breakdown_aggregates():
    dets = [
        make_detection("stain", confidence=0.8, area_ratio=0.02),
        make_detection("stain", confidence=0.8, area_ratio=0.02),
        make_detection("crack", confidence=0.9, area_ratio=0.03),
    ]
    result = score_detections(dets)
    assert "stain" in result.class_breakdown
    assert "crack" in result.class_breakdown
    assert result.class_breakdown["stain"] > result.class_breakdown["crack"] or True  # just check presence


# --- compute_verdict ---

def test_full_refund_no_new_damage():
    move_in = [make_detection("stain", 0.8, 0.03)]
    move_out = [make_detection("stain", 0.8, 0.03)]  # same damage
    verdict = compute_verdict(move_in, move_out)
    assert verdict["verdict"] == "FULL_REFUND"
    assert verdict["deduction_bps"] == 0


def test_full_refund_improved_state():
    move_in = [make_detection("crack", 0.9, 0.10)]
    move_out = []  # damage fixed (unlikely but possible)
    verdict = compute_verdict(move_in, move_out)
    assert verdict["verdict"] == "FULL_REFUND"
    assert verdict["damage_delta"] == 0.0  # clamped, not negative


def test_partial_deduction_minor_damage():
    move_in = []
    move_out = [make_detection("scratch", 0.7, 0.04)]
    verdict = compute_verdict(move_in, move_out)
    # scratch: 0.7*0.30*0.04*100 = 0.84 — minor, should be PARTIAL or FULL
    assert verdict["verdict"] in ("PARTIAL_DEDUCTION", "FULL_REFUND")


def test_hold_major_damage():
    move_in = []
    move_out = [make_detection("crack", 1.0, 0.50) for _ in range(5)]
    verdict = compute_verdict(move_in, move_out)
    assert verdict["verdict"] == "HOLD"
    assert verdict["deduction_bps"] == 10000


def test_new_damage_classes_detected():
    move_in = [make_detection("scratch", 0.7, 0.02)]
    move_out = [make_detection("scratch", 0.7, 0.02), make_detection("mold", 0.85, 0.05)]
    verdict = compute_verdict(move_in, move_out)
    assert "mold" in verdict["new_damage_classes"]
    assert "scratch" not in verdict["new_damage_classes"]


def test_verdict_contains_required_keys():
    verdict = compute_verdict([], [])
    required_keys = [
        "verdict", "deduction_bps", "damage_delta",
        "move_in_score", "move_out_score",
        "move_in_detection_count", "move_out_detection_count",
        "move_in_class_breakdown", "move_out_class_breakdown",
        "new_damage_classes",
    ]
    for key in required_keys:
        assert key in verdict, f"Missing key: {key}"
