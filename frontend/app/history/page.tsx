'use client'

import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'

const API = 'https://nico-dev-id-ai-research-assistant-api.hf.space'

interface User {
  nama: string
  email: string
}

interface Research {
  id: number
  topik: string
  status: string
  created_at: string
}

export default function History() {
  const [user, setUser] = useState<User | null>(null)
  const [researches, setResearches] = useState<Research[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedResearch, setSelectedResearch] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
      return
    }
    ambilData(token)
  }, [])

  const ambilData = async (token: string) => {
    try {
      const [profilRes, researchRes] = await Promise.all([
        fetch(`${API}/profil`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/researches`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      if (!profilRes.ok) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      const profil = await profilRes.json()
      const researchData = await researchRes.json()

      setUser(profil)
      setResearches(researchData.researches || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const lihatDetail = async (id: number) => {
    setLoadingDetail(true)
    setSelectedResearch(null)
    const token = localStorage.getItem('token')
    const res = await fetch(`${API}/researches/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    setSelectedResearch(data)
    setLoadingDetail(false)
  }

  const statusColor: Record<string, string> = {
    done: 'bg-emerald-500/20 text-emerald-400',
    processing: 'bg-yellow-500/20 text-yellow-400',
    error: 'bg-red-500/20 text-red-400',
    pending: 'bg-slate-500/20 text-slate-400'
  }

  const hapusResearch = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Hapus riset ini?')) return
    const token = localStorage.getItem('token')
    await fetch(`${API}/researches/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (selectedResearch?.id === id) setSelectedResearch(null)
    ambilData(token!)
}

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar nama={user?.nama} />

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">📚 Research History</h1>
          <p className="text-slate-400 mt-1">{researches.length} riset tersimpan</p>
        </div>

        {researches.length === 0 ? (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">🔬</div>
            <p className="text-slate-400">Belum ada riset. Mulai riset pertama kamu!</p>
            <a
              href="/dashboard"
              className="mt-4 inline-block bg-emerald-500 text-white px-6 py-3 rounded-xl hover:bg-emerald-600 transition font-medium"
            >
              Mulai Riset
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* List Researches */}
            <div className="space-y-3">
              {researches.map((research) => (
                <div
                  key={research.id}
                  onClick={() => lihatDetail(research.id)}
                  className={`bg-slate-800 border rounded-2xl p-5 cursor-pointer transition hover:border-emerald-500/50 ${
                    selectedResearch?.id === research.id
                      ? 'border-emerald-500/50'
                      : 'border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white font-medium line-clamp-2">{research.topik}</p>
                      <p className="text-slate-500 text-xs mt-2">
                        {new Date(research.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                    <span className={`text-xs px-2 py-1 rounded-full ml-3 ${statusColor[research.status]}`}>
                      {research.status}
                    </span>

                    <button
                     onClick={(e) => hapusResearch(research.id, e)}
                     className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-500/10 trsnsition"
                    >
                    🗑️
                    </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail Panel */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 h-fit sticky top-6">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              ) : selectedResearch ? (
                <div>
                  <h2 className="text-white font-bold text-lg mb-2">{selectedResearch.topik}</h2>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusColor[selectedResearch.status]}`}>
                    {selectedResearch.status}
                  </span>

                  {selectedResearch.laporan_akhir && (
                    <div className="mt-4">
                      <h3 className="text-emerald-400 font-medium mb-2">📄 Laporan Akhir:</h3>
                      <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto">
                        {selectedResearch.laporan_akhir}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">Klik riset untuk lihat detail</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}