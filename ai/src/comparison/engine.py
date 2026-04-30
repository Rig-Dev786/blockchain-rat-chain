"""
engine.py — Core comparison pipeline: video → frames → detect → score → verdict.

Pipeline per video:
  1. Verify integrity (SHA-256 check against provided hash)
  2. Extract quality frames (blur gate + scene-change detection)
  3. Run YOLOv8 detection on each frame
  4. Collect all detections + evidence frame hashes
  5. Score detections (severity-weighted)

Then compare move-in vs move-out to produce final verdict dict.
"""

import logging
import uuid
import time
from typing import Optional

import numpy as np

from src.preprocessing.frames import extract_frames
from src.detection.detector import DamageDetector
from src.detection.scoring import compute_verdict
from src.security.hasher import hash_bytes, hash_frame, verify_file_integrity

logger = logging.getLogger(__name__)

# Singleton detector — loaded once, reused across requests
_detector: Optional[DamageDetector] = None


def get_detector() -> DamageDetector:
    global _detector
    if _detector is None:
        _detector = DamageDetector()
    return _detector


def _process_video(
    video_bytes: bytes,
    label: str,
) -> tuple[list[dict], list[str]]:
    """
    Extract frames and run detection on a single video.

    Returns:
        (all_detections, evidence_frame_hashes)
        - all_detections: flat list of all detection dicts across all frames
        - evidence_frame_hashes: SHA-256 hashes of frames where damage was detected
    """
    detector = get_detector()
    all_detections: list[dict] = []
    evidence_hashes: list[str] = []

    frame_count = 0
    for frame_idx, frame in extract_frames(video_bytes):
        frame_dets = detector.detect(frame)
        frame_count += 1

        if frame_dets:
            # Hash this frame as evidence (only frames with detections)
            evidence_hashes.append(hash_frame(frame))
            for det in frame_dets:
                det["frame_idx"] = frame_idx
            all_detections.extend(frame_dets)

    logger.info(
        f"[{label}] Processed {frame_count} frames, "
        f"{len(all_detections)} detections, "
        f"{len(evidence_hashes)} evidence frames"
    )
    return all_detections, evidence_hashes


def compare_videos(
    move_in_bytes: bytes,
    move_out_bytes: bytes,
    move_in_hash: Optional[str] = None,
    move_out_hash: Optional[str] = None,
    property_id: Optional[str] = None,
) -> dict:
    """
    Full pipeline: compare move-in and move-out videos, produce signed-ready verdict.

    Args:
        move_in_bytes: Raw bytes of move-in video.
        move_out_bytes: Raw bytes of move-out video.
        move_in_hash: Expected SHA-256 of move-in video (for integrity check).
        move_out_hash: Expected SHA-256 of move-out video (for integrity check).
        property_id: Optional property identifier for traceability.

    Returns:
        Verdict dict ready for signing and blockchain submission.

    Raises:
        ValueError: If file integrity check fails (tampered video detected).
    """
    job_id = str(uuid.uuid4())
    timestamp = int(time.time())

    logger.info(f"Starting inspection job {job_id} for property {property_id or 'unknown'}")

    # --- Integrity checks ---
    actual_move_in_hash = hash_bytes(move_in_bytes)
    actual_move_out_hash = hash_bytes(move_out_bytes)

    if move_in_hash and not verify_file_integrity(move_in_bytes, move_in_hash):
        raise ValueError(
            f"Move-in video integrity check failed. "
            f"Expected {move_in_hash[:16]}…, got {actual_move_in_hash[:16]}…"
        )
    if move_out_hash and not verify_file_integrity(move_out_bytes, move_out_hash):
        raise ValueError(
            f"Move-out video integrity check failed. "
            f"Expected {move_out_hash[:16]}…, got {actual_move_out_hash[:16]}…"
        )

    # --- Detection ---
    move_in_detections, move_in_evidence = _process_video(move_in_bytes, "move_in")
    move_out_detections, move_out_evidence = _process_video(move_out_bytes, "move_out")

    # --- Scoring + Verdict ---
    verdict_data = compute_verdict(move_in_detections, move_out_detections)

    # --- Assemble full verdict payload ---
    return {
        "job_id": job_id,
        "property_id": property_id or "",
        "timestamp": timestamp,
        **verdict_data,
        "move_in_video_hash": actual_move_in_hash,
        "move_out_video_hash": actual_move_out_hash,
        "move_in_evidence_hashes": move_in_evidence,
        "move_out_evidence_hashes": move_out_evidence,
    }
