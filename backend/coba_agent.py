import os
from dotenv import load_dotenv

load_dotenv()

from typing import TypedDict, List
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, END
from ddgs import DDGS
from agents import jalankan_riset

print("🤖 Memulai riset multi-agent...")
print("=" * 50)

topik = input("Masukkan topik riset: ")

hasil = jalankan_riset(topik)

print("\n" + "=" * 50)
print("PROGRESS:")
for p in hasil['progress']:
    print(p)

print("\n" + "=" * 50)
print("LAPORAN AKHIR:")
print(hasil['laporan_akhir'])