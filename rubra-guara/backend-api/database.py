from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# banco local SQLite
DATABASE_URL = "sqlite:///./rubra_guara.db"

# engine do banco
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

# sessão do banco (ISSO QUE ESTAVA FALTANDO OU QUEBRADO)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# base dos models
Base = declarative_base()