# 🔬 AI Multi-Agent Research Assistant

A sophisticated research automation system using multi-agent AI orchestration. Three specialized AI agents (Researcher, Analyst, Writer) collaborate in real-time to produce comprehensive research reports.

## 🚀 Live Demo

Frontend: https://
Backend API: https://

## ✨ Features
- 🔐 User authentication (JWT)
- 🤖 Multi-agent AI orchestration with LangGraph
- 🔍 Real-time web search integration
- ⚡ Live progress streaming via WebSocket
- 📊 3-stage AI pipeline: Research → Analysis → Report Writing
- 📝 Structured, professional research reports
- 📚 Research history tracking

## 🛠️ Tech Stack

**Backend:**
- FastAPI (Python)
- LangGraph (multi-agent orchestration)
- LangChain + Groq API (LLaMA 3.3 70b)
- WebSocket (real-time communication)
- DuckDuckGo Search (web search)
- PostgreSQL + SQLAlchemy
- JWT Authentication

**Frontend:**
- Next.js 15 + TypeScript
- React
- WebSocket Client
- Tailwind CSS

## 🏗️ Architecture

User Query
↓
WebSocket Connection
↓
LangGraph Orchestrator

🔍 Researcher Agent               
→ Web search via DuckDuckGo       
↓                          
📊 Analyst Agent                  
→ Pattern analysis with LLaMA     
↓                          
✍️ Writer Agent                    
→ Structured report generation
↓
Real-time Progress Updates 
→ Frontend
↓
Final Research Report

## 💡 Key Technical Highlights
- **Multi-Agent Orchestration**: Built with LangGraph's StateGraph for sequential agent workflow with shared state management
- **Real-time Streaming**: WebSocket implementation for live progress updates as each agent completes its task
- **Async Processing**: Fully async WebSocket handler supporting concurrent research sessions
- **State Management**: TypedDict-based state passing between agents ensures type safety throughout the pipeline

## 🚦 Getting Started

### Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📝 Environment Variables

### Backend (.env)

DATABASE_URL=postgresql://...
GROQ_API_KEY=gsk_...

> ⚠️ Note: This is a portfolio project demonstrating multi-agent AI orchestration patterns.