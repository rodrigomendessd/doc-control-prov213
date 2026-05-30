'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function NovaVersaoForm({
  documentoId,
  versaoAtualConteudo,
}: {
  documentoId: string
  versaoAtualConteudo: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch(`/api/documentos/${documentoId}/versoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conteudo_md: fd.get('conteudo_md'),
        alteracoes:  fd.get('alteracoes'),
      }),
    })
    setLoading(false)
    if (res.ok) {
      setShow(false)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao salvar versão')
    }
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="px-4 py-2 text-sm border border-indigo-300 text-indigo-700 rounded-md hover:bg-indigo-50"
      >
        + Adicionar nova versão
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Conteúdo (Markdown) *</label>
        <textarea
          name="conteudo_md"
          required
          defaultValue={versaoAtualConteudo}
          rows={14}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Descrição das alterações *</label>
        <input
          name="alteracoes"
          required
          placeholder="Ex: Atualização da seção 3 — política de backup"
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar versão'}
        </button>
        <button
          type="button"
          onClick={() => setShow(false)}
          className="px-4 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
