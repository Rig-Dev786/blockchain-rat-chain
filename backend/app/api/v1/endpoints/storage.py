from fastapi import APIRouter
router = APIRouter()

@router.get("/")
def storage_root():
    return {"module": "storage"}
