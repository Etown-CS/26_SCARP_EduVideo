import os
import shutil
import traceback
from pathlib import Path
from fastapi import FastAPI, BackgroundTasks
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
import tempfile
import base64
import threading

from main import unique_folder_name, client
from doc_analysis import run_doc_analysis
from pedagogical_structuring import run_pedagogical_structuring
from script_gen import run_script_gen
from visual_gen import run_visual_gen

cred = credentials.Certificate(os.environ["FIREBASE_SERVICE_ACCOUNT_PATH"])
firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

VIDEOS_DIR = Path("served_videos")
VIDEOS_DIR.mkdir(exist_ok=True)
BASE_URL = os.environ.get("SERVER_BASE_URL", "http://localhost:8000")

app.mount("/videos", StaticFiles(directory=str(VIDEOS_DIR)), name="videos")

_cancel_lock = threading.Lock()
_cancelled: set[str] = set()

class JobCancelled(Exception):
    pass

def request_cancel(video_doc_id: str) -> None:
    with _cancel_lock:
        _cancelled.add(video_doc_id)


def is_cancelled(video_doc_id: str) -> bool:
    with _cancel_lock:
        return video_doc_id in _cancelled

def clear_cancel(video_doc_id: str) -> None:
    with _cancel_lock:
        _cancelled.discard(video_doc_id)

def run_pipeline(pdf_path: str, prompt: str, output_name: str, on_stage=None) -> str:
    output_folder = str(Path("output_sample/") / output_name)
    Path(output_folder).mkdir(parents=True, exist_ok=True)

    if on_stage:
        on_stage("doc_analysis")
    doc_json_path = run_doc_analysis(pdf_path, prompt, output_name)

    if on_stage:
        on_stage("pedagogical_structuring")
    pedagogical_json_path = run_pedagogical_structuring(doc_json_path)

    if on_stage:
        on_stage("script_gen")
    script_json_path = run_script_gen(pedagogical_json_path)

    if on_stage:
        on_stage("visual_gen")
    final_video_path = run_visual_gen(script_json_path, client)

    return final_video_path

def download_pdf(user_id: str, file_id: str) -> str:
    doc_ref = db.collection("documentContents").document(file_id)
    snap = doc_ref.get()
    if not snap.exists:
        raise ValueError(f"No document content found for file_id={file_id}")

    data = snap.to_dict()
    if data.get("userId") != user_id:
        raise ValueError(f"file_id={file_id} does not belong to user_id={user_id}")
    data_url = data.get("content")
    if not data_url:
        raise ValueError(f"Document content is empty for file_id={file_id}")

    _, b64_data = data_url.split(",", 1)
    pdf_bytes = base64.b64decode(b64_data)

    tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
    tmp.write(pdf_bytes)
    tmp.close()
    return tmp.name

def publish_video(video_doc_id: str, local_video_path: str, base_url: str) -> str:
    dest = VIDEOS_DIR / f"{video_doc_id}.mp4"
    shutil.copy(local_video_path, dest)
    return f"{base_url}/videos/{dest.name}"

def job_ref(user_id: str, video_doc_id: str):
    return db.collection("users").document(user_id).collection("videos").document(video_doc_id)

def run_job(user_id: str, video_doc_id: str, file_id: str, prompt: str, output_name: str):
    ref = job_ref(user_id, video_doc_id)
    local_pdf_path = None

    def safe_update(payload):
        try:
            ref.update(payload)
        except Exception as err:
            print(f"[{video_doc_id}] could not update doc: {err}")

    def on_stage(stage):
        if is_cancelled(video_doc_id):
            raise JobCancelled()
        safe_update({"status": "processing", "stage": stage})

    try:
        if is_cancelled(video_doc_id):
            raise JobCancelled()
        local_pdf_path = download_pdf(user_id, file_id)
        final_video_path = run_pipeline(local_pdf_path, prompt, output_name, on_stage=on_stage)
        if is_cancelled(video_doc_id):
            raise JobCancelled()
        video_url = publish_video(video_doc_id, final_video_path, BASE_URL)
        safe_update({"status": "complete", "stage": "done", "videoUrl": video_url})
    except JobCancelled:
        print(f"[{video_doc_id}] cancelled by user")
    except Exception as e:
        safe_update({
            "status": "failed",
            "error": str(e),
            "traceback": traceback.format_exc(),
        })
    finally: 
        clear_cancel(video_doc_id)
        if local_pdf_path and os.path.exists(local_pdf_path):
            os.remove(local_pdf_path)

class StartJobRequest(BaseModel):
    userId: str
    videoDocId: str
    fileId: str
    prompt: str
    outputName: str | None = None

class CancelJobRequest(BaseModel):
    userId: str
    videoDocId: str

@app.post("/jobs/cancel")
async def cancel_job(req: CancelJobRequest):
    request_cancel(req.videoDocId)
    return {"cancelled": True}

@app.post("/jobs/start")
async def start_job(req: StartJobRequest, background_tasks: BackgroundTasks):
    output_name = unique_folder_name(req.outputName or "video")
    prompt = req.prompt.strip() or "Create a short video focusing on the main topic"
    job_ref(req.userId, req.videoDocId).set({"status": "queued", "stage": None}, merge=True)
    background_tasks.add_task(
        run_job, req.userId, req.videoDocId, req.fileId, prompt, output_name
    )
    return {"videoDocId": req.videoDocId}

@app.delete("/api/videos/{video_doc_id}")
async def delete_video(video_doc_id: str):
    video_path = VIDEOS_DIR / f"{video_doc_id}.mp4"
    if video_path.exists():
        video_path.unlink()
        return {"deleted": True}
    return {"deleted": False, "reason": "file not found"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
