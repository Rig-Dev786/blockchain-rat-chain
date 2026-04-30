"""
scoring.py — Severity-weighted damage score engine.

Score formula per detection:
    contribution = confidence × severity_weight × area_ratio × 100

Aggregate score = sum of all contributions, clamped to [0, 100].

The delta score (move_out_score - move_in_score) drives the verdict.
Pre-existing damage from move-in is subtracted so tenants aren't charged for it.

Verdict thresholds (configurable via env vars):
    delta ≤ THRESHOLD_NONE   → FULL_REFUND       (no new damage)
    delta ≤ THRESHOLD_MINOR  → PARTIAL_DEDUCTION  (minor new damage)
    delta >  THRESHOLD_MINOR → HOLD               (major damage)
"""

import os
import logging
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Severity weights — single source of truth for both detector and scoring.
# These drive how much each damage class contributes to the final score.
# Tune these as you collect real inspection data.
# ---------------------------------------------------------------------------
SEVERITY_WEIGHTS: dict[str, float] = {
    "crack":   0.90,   # structural, high severity
    "hole":    0.85,   # structural damage
    "mold":    0.80,   # health hazard
    "broken":  0.75,   # fixture/fitting damage
    "stain":   0.45,   # surface, medium
    "scratch": 0.30,   # cosmetic, low
    "scuff":   0.20,   # cosmetic, very low
}
DEFAULT_SEVERITY = 0.50  # fallback for classes not in SEVERITY_WEIGHTS

logger = logging.getLogger(__name__)

# Verdict thresholds — tune these as you collect labeled inspection data
THRESHOLD_NONE = float(os.getenv("DAMAGE_THRESHOLD_NONE", "3.0"))
THRESHOLD_MINOR = float(os.getenv("DAMAGE_THRESHOLD_MINOR", "20.0"))

# Deduction basis points (out of 10000 = 100%)
DEDUCTION_PARTIAL_BPS = int(os.getenv("DEDUCTION_PARTIAL_BPS", "3000"))   # 30%
DEDUCTION_HOLD_BPS = int(os.getenv("DEDUCTION_HOLD_BPS", "10000"))         # 100%


@dataclass
class ScoringResult:
    raw_score: float           # sum of weighted contributions
    detection_count: int       # number of detections that contributed
    class_breakdown: dict      # {class_name: total_contribution}


def score_detections(detections: list[dict]) -> ScoringResult:
    """
    Compute weighted damage score from a list of detection dicts.

    Each detection must have: confidence, severity_weight, area_ratio.
    Returns a ScoringResult with raw_score in [0, 100].
    """
    total = 0.0
    class_breakdown: dict[str, float] = {}

    for det in detections:
        contribution = (
            det["confidence"]
            * det["severity_weight"]
            * det["area_ratio"]
            * 100.0
        )
        total += contribution

        cls = det["class"]
        class_breakdown[cls] = round(class_breakdown.get(cls, 0.0) + contribution, 4)

    return ScoringResult(
        raw_score=round(min(total, 100.0), 4),
        detection_count=len(detections),
        class_breakdown={k: round(v, 4) for k, v in class_breakdown.items()},
    )


def compute_verdict(
    move_in_detections: list[dict],
    move_out_detections: list[dict],
) -> dict:
    """
    Compare move-in vs move-out damage scores and produce a verdict.

    Returns:
        {
            "verdict": "FULL_REFUND" | "PARTIAL_DEDUCTION" | "HOLD",
            "deduction_bps": int,           # basis points (0–10000)
            "damage_delta": float,          # move_out_score - move_in_score
            "move_in_score": float,
            "move_out_score": float,
            "move_in_detection_count": int,
            "move_out_detection_count": int,
            "move_in_class_breakdown": dict,
            "move_out_class_breakdown": dict,
            "new_damage_classes": list[str], # classes present in move-out but not move-in
        }
    """
    move_in_result = score_detections(move_in_detections)
    move_out_result = score_detections(move_out_detections)

    delta = move_out_result.raw_score - move_in_result.raw_score
    # Clamp delta: negative means property improved (rare), treat as 0
    effective_delta = max(delta, 0.0)

    # Identify newly appearing damage classes
    move_in_classes = set(move_in_result.class_breakdown.keys())
    move_out_classes = set(move_out_result.class_breakdown.keys())
    new_classes = sorted(move_out_classes - move_in_classes)

    # Verdict decision
    if effective_delta <= THRESHOLD_NONE:
        verdict = "FULL_REFUND"
        deduction_bps = 0
    elif effective_delta <= THRESHOLD_MINOR:
        verdict = "PARTIAL_DEDUCTION"
        deduction_bps = DEDUCTION_PARTIAL_BPS
    else:
        verdict = "HOLD"
        deduction_bps = DEDUCTION_HOLD_BPS

    logger.info(
        f"Verdict: {verdict} | delta={effective_delta:.2f} | "
        f"move_in={move_in_result.raw_score:.2f} → move_out={move_out_result.raw_score:.2f}"
    )

    return {
        "verdict": verdict,
        "deduction_bps": deduction_bps,
        "damage_delta": round(effective_delta, 4),
        "move_in_score": move_in_result.raw_score,
        "move_out_score": move_out_result.raw_score,
        "move_in_detection_count": move_in_result.detection_count,
        "move_out_detection_count": move_out_result.detection_count,
        "move_in_class_breakdown": move_in_result.class_breakdown,
        "move_out_class_breakdown": move_out_result.class_breakdown,
        "new_damage_classes": new_classes,
    }
