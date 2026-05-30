'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Aprovacao = { id: string; nivel: number; status: string }

export default function AprovacaoForm({
  aprovacoes,
  canApproveLevel1,
  canApproveLevel2,
}: {
  aprovacoes: Aprovacao[]
  canApproveLevel1: boolean
  canApproveLevel2: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [comentario, setComentario] = useState('')
  const [error, setError] = useState('')

  const pendente = aprovacoes.find(ap =>
    ap.status === 'Pendente' &&
    ((ap.nivel === 1 && canApproveLevel1) || (ap.nivel === 2 && canApproveLevel2))
  )

  if (!pendente) return null

  async function submitDecisao(decisao: 'Aprovado' | 'Rejeitado') {
    setLoading(true)
    setError('')
    const res = await fetch('/api/aprovacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aprovacaoId: pendente!.id, decisao, comentario }),
    })
    setLoading(false)
    if (res.ok) {
      setComentario('')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao registrar decisão')
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Sua vez de agir — Nível {pendente.nivel} ({pendente.nivel === 1 ? 'Revisão TI' : 'Aprovação Titular'})
      </p>
      <input
        value={comentario}
        onChange={e => setComentario(e.target.value)}
        placeholder="Comentário (opcional)"
        className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          onClick={() => submitDecisao('Aprovado')}
          disabled={loading}
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
        >
          Aprovar
        </button>
        <button
          onClick={() => submitDecisao('Rejeitado')}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
        >
          Rejeitar
        </button>
      </div>
    </div>
  )
}
