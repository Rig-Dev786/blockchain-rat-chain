"""
detector.py — YOLOv8 damage detection with confidence filtering and NMS deduplication.

Damage classes and their severity weights (0.0–1.0).
These weights feed into the scoring engine — tune them as you collect real data.

  crack       → 0.90  (structural, high severity)
  hole        → 0.85  (structural damage)
  mold        → 0.80  (health hazard)
  broken      → 0.75  (fixture/fitting damage)
  stain       → 0.45  (surface, medium)
  scratch     → 0.30  (cosmetic, low)
  scuff       → 0.20  (cosmetic, very low)
"""

import logging
import numpy as np
from pathlib import Path
from ultralytics import YOLO

logger = logging.getLogger(__name__)

# Default confidence threshold — detections below this are noise
DEFAULT_CONF_THRESHOLD = 0.50

# IoU threshold for NMS deduplication across frames
NMS_IOU_THRESHOLD = 0.45

# Severity weights imported from scoring module (single source of truth)
from src.detection.scoring import SEVERITY_WEIGHTS, DEFAULT_SEVERITY


class DamageDetector:
    def __init__(
        self,
        weights_path: str = "models/weights/best.pt",
        conf_threshold: float = DEFAULT_CONF_THRESHOLD,
    ):
        weights = Path(weights_path)
        if not weights.exists():
            # Fall back to base YOLOv8n during development (no fine-tuned weights yet)
            logger.warning(
                f"Weights not found at {weights_path}. "
                "Falling back to base yolov8n — detections won't be damage-specific. "
                "Fine-tune the model before production use."
            )
            self.model = YOLO("yolov8n.pt")
        else:
            self.model = YOLO(str(weights))

        self.conf_threshold = conf_threshold
        logger.info(
            f"DamageDetector loaded — conf_threshold={conf_threshold}, "
            f"weights={'base yolov8n' if not weights.exists() else weights_path}"
        )

    def detect(self, frame: np.ndarray) -> list[dict]:
        """
        Run inference on a single frame.

        Returns:
            List of detection dicts:
            {
                "class": str,
                "confidence": float,
                "bbox": [x1, y1, x2, y2],   # pixel coords
                "severity_weight": float,     # from SEVERITY_WEIGHTS
                "area_ratio": float,          # bbox area / frame area (0–1)
            }
        """
        results = self.model(frame, conf=self.conf_threshold, verbose=False)
        h, w = frame.shape[:2]
        frame_area = h * w

        detections = []
        for r in results:
            for box in r.boxes:
                class_name = r.names[int(box.cls)].lower()
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox_area = (x2 - x1) * (y2 - y1)

                detections.append({
                    "class": class_name,
                    "confidence": round(float(box.conf), 4),
                    "bbox": [round(v, 2) for v in [x1, y1, x2, y2]],
                    "severity_weight": SEVERITY_WEIGHTS.get(class_name, DEFAULT_SEVERITY),
                    "area_ratio": round(bbox_area / frame_area, 6),
                })

        return detections

    def detect_batch(self, frames: list[np.ndarray]) -> list[list[dict]]:
        """Run detection on a batch of frames. More efficient than calling detect() in a loop."""
        results = self.model(frames, conf=self.conf_threshold, verbose=False)
        batch_detections = []

        for i, r in enumerate(results):
            h, w = frames[i].shape[:2]
            frame_area = h * w
            frame_dets = []

            for box in r.boxes:
                class_name = r.names[int(box.cls)].lower()
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                bbox_area = (x2 - x1) * (y2 - y1)

                frame_dets.append({
                    "class": class_name,
                    "confidence": round(float(box.conf), 4),
                    "bbox": [round(v, 2) for v in [x1, y1, x2, y2]],
                    "severity_weight": SEVERITY_WEIGHTS.get(class_name, DEFAULT_SEVERITY),
                    "area_ratio": round(bbox_area / frame_area, 6),
                })

            batch_detections.append(frame_dets)

        return batch_detections
