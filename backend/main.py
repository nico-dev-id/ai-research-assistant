import os
import json
from fastapi import FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from database import SessionLocal, UserModel, ResearchModel
from auth import hash_password, verifikasi_password, buat_token, verifikasi_token
from agents import buat_research_graph

load_dotenv()

app = FastAPI(title="AI Research Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = verifikasi_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token tidak valid!")
    user = db.query(UserModel).filter(UserModel.email == payload["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User tidak ditemukan!")
    return user

class RegisterInput(BaseModel):
    nama: str
    email: str
    password: str

# ==================
# AUTH ENDPOINTS
# ==================

@app.post("/register")
def register(data: RegisterInput, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(UserModel.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar!")
    user_baru = UserModel(
        nama=data.nama,
        email=data.email,
        password=hash_password(data.password)
    )
    db.add(user_baru)
    db.commit()
    db.refresh(user_baru)
    return {"pesan": "Registrasi berhasil!", "nama": user_baru.nama}

@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == form.username).first()
    if not user:
        raise HTTPException(status_code=401, detail="Email tidak ditemukan!")
    if not verifikasi_password(form.password, user.password):
        raise HTTPException(status_code=401, detail="Password salah!")
    token = buat_token({"sub": user.email, "nama": user.nama})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/profil")
def profil(current_user: UserModel = Depends(get_current_user)):
    return {"nama": current_user.nama, "email": current_user.email}

# ==================
# RESEARCH HISTORY ENDPOINTS
# ==================

@app.get("/researches")
def get_researches(current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    researches = db.query(ResearchModel).filter(
        ResearchModel.user_id == current_user.id
    ).order_by(ResearchModel.created_at.desc()).all()
    return {
        "total": len(researches),
        "researches": [
            {
                "id": r.id,
                "topik": r.topik,
                "status": r.status,
                "created_at": r.created_at
            } for r in researches
        ]
    }

@app.get("/researches/{research_id}")
def get_research_detail(research_id: int, current_user: UserModel = Depends(get_current_user), db: Session = Depends(get_db)):
    research = db.query(ResearchModel).filter(
        ResearchModel.id == research_id,
        ResearchModel.user_id == current_user.id
    ).first()
    if not research:
        raise HTTPException(status_code=404, detail="Riset tidak ditemukan!")
    return {
        "id": research.id,
        "topik": research.topik,
        "hasil_riset": research.hasil_riset,
        "hasil_analisis": research.hasil_analisis,
        "laporan_akhir": research.laporan_akhir,
        "status": research.status,
        "created_at": research.created_at
    }

# ==================
# WEBSOCKET - MULTI AGENT RESEARCH
# ==================

@app.websocket("/ws/research")
async def websocket_research(websocket: WebSocket):
    await websocket.accept()
    db = SessionLocal()
    
    try:
        # Terima topik dan token dari frontend
        data = await websocket.receive_json()
        topik = data.get("topik")
        token = data.get("token")
        
        # Verifikasi user
        payload = verifikasi_token(token)
        if not payload:
            await websocket.send_json({"type": "error", "message": "Token tidak valid!"})
            await websocket.close()
            return
        
        user = db.query(UserModel).filter(UserModel.email == payload["sub"]).first()
        if not user:
            await websocket.send_json({"type": "error", "message": "User tidak ditemukan!"})
            await websocket.close()
            return
        
        # Simpan research record dengan status processing
        research = ResearchModel(
            user_id=user.id,
            topik=topik,
            status="processing"
        )
        db.add(research)
        db.commit()
        db.refresh(research)
        
        await websocket.send_json({
            "type": "start",
            "message": f"Memulai riset: {topik}",
            "research_id": research.id
        })
        
        # Jalankan graph dengan streaming
        graph = buat_research_graph()
        
        initial_state = {
            "topik": topik,
            "hasil_search": "",
            "hasil_analisis": "",
            "laporan_akhir": "",
            "progress": []
        }
        
        final_state = None
        
        # Stream setiap step dari graph
        async for event in graph.astream(initial_state):
            for node_name, node_state in event.items():
                agent_messages = {
                    "researcher": "🔍 Researcher Agent sedang mencari data...",
                    "analyst": "📊 Analyst Agent sedang menganalisis...",
                    "writer": "✍️ Writer Agent sedang menulis laporan..."
                }
                
                await websocket.send_json({
                    "type": "progress",
                    "agent": node_name,
                    "message": agent_messages.get(node_name, f"{node_name} selesai"),
                })
                
                final_state = node_state
        
        # Simpan hasil ke database
        research.hasil_riset = final_state.get('hasil_search', '')
        research.hasil_analisis = final_state.get('hasil_analisis', '')
        research.laporan_akhir = final_state.get('laporan_akhir', '')
        research.status = "done"
        db.commit()
        
        # Kirim hasil akhir
        await websocket.send_json({
            "type": "complete",
            "research_id": research.id,
            "laporan_akhir": final_state.get('laporan_akhir', ''),
        })
        
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({"type": "error", "message": str(e)})
    finally:
        db.close()