import os
from typing import TypedDict, List
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from ddgs import DDGS

# State yang akan "mengalir" antar agent
class ResearchState(TypedDict):
    topik: str
    hasil_search: str
    hasil_analisis: str
    laporan_akhir: str
    progress: List[str]

llm = ChatGroq(
    api_key=os.environ.get("GROQ_API_KEY"),
    model_name="llama-3.3-70b-versatile"
)

# AGENT 1 - Researcher
def researcher_agent(state: ResearchState) -> ResearchState:
    print(f"🔍 Researcher Agent: Mencari info tentang '{state['topik']}'")
    
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(state['topik'], max_results=5))
        
        hasil_search = "\n\n".join([
            f"Sumber: {r['title']}\n{r['body']}"
            for r in results
        ])
    except Exception as e:
        hasil_search = f"Tidak dapat melakukan web search: {str(e)}"
    
    state['hasil_search'] = hasil_search
    state['progress'].append("✅ Researcher selesai mengumpulkan data")
    return state

# AGENT 2 - Analyst
def analyst_agent(state: ResearchState) -> ResearchState:
    print(f"📊 Analyst Agent: Menganalisis data...")
    
    prompt = f"""Kamu adalah seorang analis riset profesional.

Topik riset: {state['topik']}

Data yang dikumpulkan:
{state['hasil_search']}

Analisis data di atas dan berikan:
1. Insight utama (3-5 poin)
2. Tren yang teridentifikasi
3. Implikasi penting

Jawab dalam bahasa Indonesia, terstruktur dan profesional."""

    response = llm.invoke(prompt)
    state['hasil_analisis'] = response.content
    state['progress'].append("✅ Analyst selesai menganalisis data")
    return state

# AGENT 3 - Writer
def writer_agent(state: ResearchState) -> ResearchState:
    print(f"✍️ Writer Agent: Menulis laporan akhir...")
    
    prompt = f"""Kamu adalah seorang penulis laporan riset profesional.

Topik: {state['topik']}

Hasil Analisis:
{state['hasil_analisis']}

Buatlah laporan riset yang terstruktur dengan format:

# Laporan Riset: [Topik]

## Ringkasan Eksekutif
(2-3 kalimat ringkasan keseluruhan)

## Temuan Utama
(poin-poin penting dari analisis)

## Kesimpulan
(kesimpulan akhir dan rekomendasi)

Jawab dalam bahasa Indonesia, profesional dan mudah dibaca."""

    response = llm.invoke(prompt)
    state['laporan_akhir'] = response.content
    state['progress'].append("✅ Writer selesai menulis laporan")
    return state

# Buat Graph (alur kerja multi-agent)
def buat_research_graph():
    workflow = StateGraph(ResearchState)
    
    # Tambah node (agent)
    workflow.add_node("researcher", researcher_agent)
    workflow.add_node("analyst", analyst_agent)
    workflow.add_node("writer", writer_agent)
    
    # Tentukan alur (edges)
    workflow.set_entry_point("researcher")
    workflow.add_edge("researcher", "analyst")
    workflow.add_edge("analyst", "writer")
    workflow.add_edge("writer", END)
    
    return workflow.compile()

# Fungsi untuk menjalankan riset
def jalankan_riset(topik: str):
    graph = buat_research_graph()
    
    initial_state = {
        "topik": topik,
        "hasil_search": "",
        "hasil_analisis": "",
        "laporan_akhir": "",
        "progress": []
    }
    
    hasil = graph.invoke(initial_state)
    return hasil