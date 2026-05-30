'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const tipos = ['PSI', 'POP', 'Politica', 'Manual', 'Formulario', 'Outros']

export default function NovoDocumentoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo:        fd.get('titulo'),
        tipo:          fd.get('tipo'),
        codigo_artigo: fd.get('codigo_artigo') || null,
        conteudo_md:   fd.get('conteudo_md'),
        alteracoes:    'Versão inicial',
      }),
    })
    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      router.push(`/documentos/${data.id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Erro ao criar documento')
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Novo Documento</h1>
        <p className="text-sm text-zinc-500 mt-1">O documento será criado como Rascunho — versão 1.0</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-zinc-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Título *</label>
          <input
            name="titulo"
            required
            placeholder="Ex: Política de Segurança da Informação"
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Tipo *</label>
            <select
              name="tipo"
              required
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione...</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Artigo do Provimento
              <span className="text-zinc-400 font-normal ml-1">(opcional)</span>
            </label>
            <input
              name="codigo_artigo"
              placeholder="Ex: Art. 5"
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Conteúdo (Markdown) *</label>
          <textarea
            name="conteudo_md"
            required
            rows={16}
            placeholder="# Título do Documento&#10;&#10;## 1. Objetivo&#10;&#10;..."
            className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          />
          <p className="text-xs text-zinc-400 mt-1">Formato Markdown. Use # para títulos, ## para seções.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Criando...' : 'Criar Documento'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-2 text-sm text-zinc-600 border border-zinc-300 rounded-md hover:bg-zinc-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}
