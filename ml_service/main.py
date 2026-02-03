from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
from ultralytics import YOLO
import logging
from typing import Dict, Any

app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Allow RN app to call backend - consider restricting origins in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to specific origins in production
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["*"],
)

# Load YOLOv8 model
try:
    model = YOLO("models/general.pt")  # Ensure this path is correct
    logger.info("Model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    model = None

@app.post("/detect")
async def detect(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Process an image and return the count of detected objects
    """
    if model is None:
        return {"error": "Model not loaded", "count": 0}
    
    try:
        # Read and validate file
        if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            return {"error": "Invalid file type. Please upload JPEG or PNG", "count": 0}
        
        # Read image file
        contents = await file.read()
        if not contents:
            return {"error": "Empty file", "count": 0}
        
        # Open and convert image
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        logger.info(f"Image loaded: {image.size} pixels")
        
        # Run detection
        results = model.predict(
            source=image, 
            conf=0.4, 
            save=False,
            verbose=False  # Disable verbose output for cleaner logs
        )
        
        # Count detected objects
        count = len(results[0].boxes) if results[0].boxes is not None else 0
        
        # Optional: Get class names if available
        class_names = []
        if results[0].boxes and hasattr(results[0].boxes, 'cls'):
            class_names = [results[0].names[int(cls)] for cls in results[0].boxes.cls]
            logger.info(f"Detected classes: {class_names}")
        
        logger.info(f"Detection completed: {count} objects found")
        
        return {
            "count": count,
            "detections": class_names,  # Optional: return class names
            "success": True
        }
        
    except Image.UnidentifiedImageError:
        logger.error("Cannot identify image file")
        return {"error": "Invalid or corrupted image file", "count": 0}
    except Exception as e:
        logger.error(f"Detection error: {e}")
        return {"error": f"Processing error: {str(e)}", "count": 0}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if model is not None else "model_not_loaded",
        "model_loaded": model is not None
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)