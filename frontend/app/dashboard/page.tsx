'use client'

import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'

const API = 'http://localhost:8000'
const WS_URL = 'ws://localhost:8000'

interface User {
  nama: string
  email: string
}

interface ProgressItem {
  agent: string
  message: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [topik, setTopik] = useState<string>('')
  const [isResearching, setIsResearching] = useState<boolean>(false)
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [laporanAkhir, setLaporanAkhir] = useState<string>('')
  const [error, setError] = useState<string>('')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    ambilProfil(token)
  }, [])

  const ambilProfil = async (token: string) => {
    const res = await fetch(`${API}/profil`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (!res.ok) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      return
    }
    const data = await res.json()
    setUser(data)
  }

  const mulaiRiset = () => {
    if (!topik.trim()) {
      setError('Topik riset wajib diisi!')
      return
    }

    setError('')
    setProgress([])
    setLaporanAkhir('')
    setIsResearching(true)

    const token = localStorage.getItem('token')
    const ws = new WebSocket(`${WS_URL}/ws/research`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ topik, token }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'start') {
        setProgress(prev => [...prev, { agent: 'system', message: data.message }])
      } else if (data.type === 'progress') {
        setProgress(prev => [...prev, { agent: data.agent, message: data.message }])
      } else if (data.type === 'complete') {
        setLaporanAkhir(data.laporan_akhir)
        setIsResearching(false)
        ws.close()
      } else if (data.type === 'error') {
        setError(data.message)
        setIsResearching(false)
        ws.close()
      }
    }

    ws.onerror = () => {
      setError('Koneksi WebSocket gagal!')
      setIsResearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar nama={user?.nama} />

      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl text-center font-bold text-white">🔬 Multi-Agent Research</h1>
          <p className="text-slate-400 mt-1 text-center">Masukkan topik dan biarkan 3 AI agent bekerja sama untuk riset kamu</p>
        </div>

        {/* Input Form */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Contoh: Tren AI di Indonesia 2026"
              value={topik}
              onChange={(e) => setTopik(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isResearching && mulaiRiset()}
              disabled={isResearching}
              className="flex-1 bg-slate-700 border border-slate-600 text-white p-3 rounded-lg focus:outline-none focus:border-emerald-400 placeholder-slate-400 disabled:opacity-50"
            />
            <button
              onClick={mulaiRiset}
              disabled={isResearching}
              className="bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition font-medium disabled:opacity-50"
            >
              {isResearching ? 'Researching...' : '🚀 Mulai Riset'}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
        </div>

        {/* Progress Timeline */}
        {progress.length > 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-bold mb-4">📊 Progress</h2>
            <div className="space-y-3">
              {progress.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3">
                  <span className="text-emerald-400">●</span>
                  <span className="text-slate-300 text-sm">{item.message}</span>
                </div>
              ))}
              {isResearching && (
                <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-slate-400 text-sm">Sedang bekerja...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Final Report */}
        {laporanAkhir && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6">
            <h2 className="text-emerald-400 font-bold mb-4 text-lg">📄 Laporan Riset</h2>
            <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
              {laporanAkhir}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}