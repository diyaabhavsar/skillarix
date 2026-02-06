import os
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .api.v1.api import api_router


app = FastAPI(title=settings.PROJECT_NAME, debug=True)

import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = "".join(traceback.format_exception(None, exc, exc.__traceback__))
    print(f"Global exception: {error_msg}")
    with open("error.log", "a") as f:
        f.write(f"\n\n--- Error at {datetime.now()} ---\n")
        f.write(error_msg)
    return JSONResponse(
        status_code=500,
        content={"message": "Internal Server Error", "detail": str(exc), "traceback": error_msg},
    )

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def startup_checks():
    missing = []
    if not settings.OPENAI_API_KEY:
        missing.append("OPENAI_API_KEY")
    # If MODEL is 0 (Groq), we need GROQ_API_KEY
    if settings.MODEL == 0 and not settings.GROQ_API_KEY:
        missing.append("GROQ_API_KEY")
        
    if missing:
        print(f"WARNING: The following critical environment variables are missing: {', '.join(missing)}. Evaluation features may fail.")

# Ensure 'uploads/' directory exists at the project root
UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../uploads"))
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Mount static files
app.mount("/api/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8070)