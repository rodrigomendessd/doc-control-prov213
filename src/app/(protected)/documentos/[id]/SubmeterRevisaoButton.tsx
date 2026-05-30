'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SubmeterRevisaoButton({ documentoId }: { documentoId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleClick() {
    if (!confirm('Submeter este documento para revisão TI?')) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/documentos/${documentoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'submeter_revisao' }),
    })
    setLoading(false)
    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao submeter')
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Submetendo...' : 'Submeter para Revisão TI →'}
      </button>
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
    </div>
  )
}
