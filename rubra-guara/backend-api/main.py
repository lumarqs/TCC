from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import shutil
import os

from database import SessionLocal, engine, Base
from models.sighting import Sighting

# cria tabelas no banco
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS (libera Expo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# pasta de uploads
UPLOAD_FOLDER = "uploads"

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# ----------------------------
# HOME
# ----------------------------
@app.get("/")
def home():
    return {
        "message": "API Rubra Guará funcionando 🚀"
    }


# ----------------------------
# CRIAR REGISTRO
# ----------------------------
@app.post("/sightings")
async def create_sighting(
    species: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    photo: UploadFile = File(...)
):
    file_path = f"{UPLOAD_FOLDER}/{photo.filename}"

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(photo.file, buffer)

    db: Session = SessionLocal()

    sighting = Sighting(
        species=species,
        latitude=latitude,
        longitude=longitude,
        image_path=file_path
    )

    db.add(sighting)
    db.commit()
    db.refresh(sighting)

    db.close()

    return {
        "message": "Registro criado com sucesso",
        "id": sighting.id
    }


# ----------------------------
# HEATMAP
# ----------------------------
@app.get("/heatmap")
def get_heatmap():
    db: Session = SessionLocal()

    sightings = db.query(Sighting).all()

    points = [
        {
            "latitude": item.latitude,
            "longitude": item.longitude,
            "weight": 1,
            "species": item.species
        }
        for item in sightings
    ]

    db.close()

    return points