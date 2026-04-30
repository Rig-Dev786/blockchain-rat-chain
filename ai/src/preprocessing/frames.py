"""
frames.py — Video frame extraction with quality gating and scene-change detection.

Strategy:
  1. Sample every `interval` frames as the base rate (default: every 2s at 30fps = 60)
  2. Skip blurry frames (Laplacian variance below threshold)
  3. Also capture scene-change frames (absdiff > scene_threshold) regardless of interval
     to catch rapid room transitions without processing every frame.
"""

import cv2
import tempfile
import os
import logging
import numpy as np
from typing import Generator

logger = logging.getLogger(__name__)

# Laplacian variance below this = blurry frame, skip it
BLUR_THRESHOLD = 80.0
# Mean pixel diff above this = scene change, always capture
SCENE_CHANGE_THRESHOLD = 35.0


def _laplacian_variance(frame: np.ndarray) -> float:
    """Measure sharpness. Low value = blurry."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def _is_scene_change(prev: np.ndarray | None, curr: np.ndarray) -> bool:
    """Detect abrupt scene change between consecutive captured frames."""
    if prev is None:
        return False
    prev_small = cv2.resize(prev, (160, 120))
    curr_small = cv2.resize(curr, (160, 120))
    diff = cv2.absdiff(prev_small, curr_small)
    return float(diff.mean()) > SCENE_CHANGE_THRESHOLD


def extract_frames(
    video_bytes: bytes,
    interval: int = 60,
    blur_threshold: float = BLUR_THRESHOLD,
) -> Generator[tuple[int, np.ndarray], None, None]:
    """
    Extract meaningful frames from raw video bytes.

    Yields:
        (frame_index, frame_ndarray) tuples for frames that pass quality gate.

    Args:
        video_bytes: Raw video file bytes.
        interval: Sample every N frames (default 60 ≈ every 2s at 30fps).
        blur_threshold: Laplacian variance cutoff — frames below this are skipped.
    """
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as f:
            f.write(video_bytes)
            tmp_path = f.name

        cap = cv2.VideoCapture(tmp_path)
        if not cap.isOpened():
            raise ValueError("Could not open video — unsupported format or corrupt file.")

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        logger.info(f"Video: {total_frames} frames @ {fps:.1f} fps")

        frame_idx = 0
        last_captured: np.ndarray | None = None
        captured_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            is_interval_frame = (frame_idx % interval == 0)
            is_scene_change = _is_scene_change(last_captured, frame)

            if is_interval_frame or is_scene_change:
                sharpness = _laplacian_variance(frame)
                if sharpness >= blur_threshold:
                    last_captured = frame.copy()
                    captured_count += 1
                    yield (frame_idx, frame)
                else:
                    logger.debug(
                        f"Frame {frame_idx} skipped — blur score {sharpness:.1f} < {blur_threshold}"
                    )

            frame_idx += 1

        cap.release()
        logger.info(f"Extracted {captured_count} quality frames from {frame_idx} total")

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
