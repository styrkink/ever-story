import base64
import io
import logging
from contextlib import asynccontextmanager

import numpy as np
import torch
from fastapi import FastAPI, HTTPException
from PIL import Image
from pydantic import BaseModel

logger = logging.getLogger("face-service")
logging.basicConfig(level=logging.INFO)

mtcnn = None
resnet = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global mtcnn, resnet
    from facenet_pytorch import MTCNN, InceptionResnetV1

    logger.info("Loading FaceNet model (VGGFace2 pretrained, 512-d)...")
    mtcnn = MTCNN(keep_all=True, device="cpu", post_process=False)
    resnet = InceptionResnetV1(pretrained="vggface2").eval()
    logger.info("Model ready")
    yield


app = FastAPI(lifespan=lifespan)


class ExtractRequest(BaseModel):
    image: str  # raw base64, no "data:..." prefix


class ExtractResponse(BaseModel):
    faceFound: bool
    qualityScore: float
    embedding: list[float]


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract", response_model=ExtractResponse)
async def extract(req: ExtractRequest):
    try:
        img_bytes = base64.b64decode(req.image)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(400, "Invalid image data")

    boxes, probs = mtcnn.detect(img)

    if boxes is None or len(boxes) == 0:
        return ExtractResponse(faceFound=False, qualityScore=0.0, embedding=[])

    faces = mtcnn(img)  # (N, 3, 160, 160) — aligned face crops
    if faces is None:
        return ExtractResponse(faceFound=False, qualityScore=0.0, embedding=[])

    # Pick the face with highest detection confidence
    best_idx = int(np.argmax(probs))
    face = faces[best_idx].unsqueeze(0)  # (1, 3, 160, 160)

    with torch.no_grad():
        emb = resnet(face).squeeze().numpy()  # (512,)

    # L2 normalise → unit vector
    norm = float(np.linalg.norm(emb))
    if norm > 0:
        emb = emb / norm

    quality = float(np.clip(probs[best_idx], 0.0, 1.0))

    return ExtractResponse(
        faceFound=True,
        qualityScore=quality,
        embedding=emb.tolist(),
    )
