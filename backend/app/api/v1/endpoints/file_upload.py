from fastapi import APIRouter, HTTPException, Depends, Form, UploadFile, File
from fastapi.responses import JSONResponse
from datetime import datetime
from ....services.user import get_current_user
from app.models.user import User
import os

router = APIRouter()

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))

UPLOAD_ROOT = os.path.join(PROJECT_ROOT, "uploads")

@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    subfolder: str = Form(...)
):
    # Ensure the subfolder is safe
    safe_subfolder = "".join(c for c in subfolder if c.isalnum() or c in "-_")
    upload_dir = os.path.join(UPLOAD_ROOT, safe_subfolder)
    os.makedirs(upload_dir, exist_ok=True)

    # Create a unique filename
    filename = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_path = os.path.join(upload_dir, filename)

    # Save the file
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    # Return the relative URL for frontend use
    url = f"{os.getenv('BACKEND_URL')}/uploads/{safe_subfolder}/{filename}"
    return JSONResponse({"url": url, "filename": filename})

@router.post("/delete-uploaded-file")
async def delete_uploaded_file(
    file_url: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an uploaded file from the uploads directory.
    Expects the full file URL (as returned by upload endpoint) in file_url.
    Only admin users can delete files.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete files.")

    # Extract the relative path from the file_url
    backend_url = os.getenv('BACKEND_URL', '').rstrip('/')
    if backend_url and file_url.startswith(backend_url):
        rel_path = file_url[len(backend_url):]
    elif file_url.startswith("/uploads/"):
        rel_path = file_url
    else:
        raise HTTPException(status_code=400, detail="Invalid file URL.")

    # Build the absolute file path
    abs_path = os.path.join(PROJECT_ROOT, rel_path.lstrip("/"))
    if not abs_path.startswith(os.path.join(PROJECT_ROOT, "uploads")):
        raise HTTPException(status_code=400, detail="Invalid file path.")

    # Remove the file if it exists
    if os.path.exists(abs_path):
        os.remove(abs_path)
        return {"detail": "File deleted successfully."}
    else:
        raise HTTPException(status_code=404, detail="File not found.")