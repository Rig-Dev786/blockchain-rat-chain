# AI — YOLOv8 + PyTorch + OpenCV Damage Detection

## Setup
```bash
pip install -r requirements.txt
uvicorn src.main:app --port 8001 --reload
```

## Pipeline
1. Upload move-in & move-out videos
2. Extract frames → preprocess
3. YOLOv8 detects damage regions
4. Comparison engine diffs both states
5. Verdict generated + signed (SHA-256)
6. Result sent to backend → escrow release
