from fastapi import APIRouter, UploadFile, File, HTTPException
from services.pdf_service import extract_and_chunk
from services.chroma_service import index_chunks, get_collection_stats
from services.video_service import load_transcript, get_chunks_from_transcript
import shutil, os, json

router = APIRouter(prefix="/ingest", tags=["ingest"])
os.makedirs("uploads", exist_ok=True)

@router.post("/pdf/{product_id}")
async def ingest_pdf(product_id: str, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files accepted")
    temp_path = f"uploads/{product_id}_{file.filename}"
    try:
        with open(temp_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        chunks = extract_and_chunk(temp_path, product_id)
        result = index_chunks(product_id, chunks)
        stats = get_collection_stats(product_id)
        return {
            "status": "success",
            "filename": file.filename,
            "chunks_indexed": result["indexed"],
            "total_chunks_in_db": stats["total_chunks"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.post("/transcript/{product_id}/{video_id}")
async def ingest_transcript(product_id: str, video_id: str, file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".json"):
        raise HTTPException(status_code=400, detail="Only JSON transcript files accepted")
    try:
        content = await file.read()
        transcript = json.loads(content)
        chunks = get_chunks_from_transcript(transcript, product_id, video_id)
        result = index_chunks(product_id, chunks)
        stats = get_collection_stats(product_id)
        return {
            "status": "success",
            "video_id": video_id,
            "segments_processed": len(transcript),
            "chunks_indexed": result["indexed"],
            "total_chunks_in_db": stats["total_chunks"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats/{product_id}")
async def get_stats(product_id: str):
    return get_collection_stats(product_id)