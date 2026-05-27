from sqlalchemy import Column, Integer, String, Float
from database import Base

class Sighting(Base):
    __tablename__ = "sightings"

    id = Column(Integer, primary_key=True, index=True)

    species = Column(String, index=True)

    latitude = Column(Float)

    longitude = Column(Float)

    image_path = Column(String)