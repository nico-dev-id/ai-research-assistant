import os
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:admin123@localhost:5432/research_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

# Tabel users
class UserModel(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    researches = relationship("ResearchModel", back_populates="user")

# Tabel research (riwayat riset)
class ResearchModel(Base):
    __tablename__ = "researches"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    topik = Column(String, nullable=False)
    hasil_riset = Column(Text, nullable=True)
    hasil_analisis = Column(Text, nullable=True)
    laporan_akhir = Column(Text, nullable=True)
    status = Column(String, default="pending")  # pending, processing, done, error
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("UserModel", back_populates="researches")

Base.metadata.create_all(bind=engine)
print("Database Research siap!")