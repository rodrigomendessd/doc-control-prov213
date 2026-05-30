import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import NovaVersaoForm from './NovaVersaoForm'
import AprovacaoForm from './AprovacaoForm'
import SubmeterRevisaoButton from './SubmeterRevisaoButton'

async function getDocumento(id: string) {
  const { rows } = await pool.query<{
    id: string; titulo: string; tipo: string; status: string;
    codigo_artigo: string; criado_por_nome: string; criado_em: Date; atualizado_em: Date
  }>(`
    SELECT d.id, d.titulo, d.tipo, d.status, d.codigo_artigo,
           u.nome AS criado_por_nome, d.criado_em, d.atualizado_em
    FROM documentos d
    LEFT JOIN usuarios u ON u.id = d.criado_por
    WHERE d.id = $1
  `, [id])
  return rows[0] ?? null
}

async function getVersoes(documentoId: string) {
  const { rows } = await pool.query<{
    id: string; numero_versao: string; hash_conteudo: string;
    alteracoes: string; criado_por_nome: string; criado_em: Date; conteudo_md: string
  }>(`
    SELECT v.id, v.numero_versao, v.hash_conteudo, v.alteracoes, v.conteudo_md,
           u.nome AS criado_por_nome, v.criado_em
    FROM versoes_documento v
    LEFT JOIN usuarios u ON u.id = v.criado_por
    WHERE v.documento_id = $1
    ORDER BY v.criado_em DESC
  `, [documentoId])
  return rows
}

async function getAprovacoesPendentes(versaoId: string) {
  const { rows } = await pool.query<{
    id: string; nivel: number; status: string; comentario: string;
    aprovador_nome: string; data: Date
  }>(`
    SELECT a.id, a.nivel, a.status, a.comentario, a.data,
           u.nome AS aprovador_nome
    FROM aprovacoes a
    LEFT JOIN usuarios u ON u.id = a.aprovador_id
    WHERE a.versao_id = $1
    ORDER BY a.nivel
  `, [versaoId])
  return rows
}

export default async function DocumentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  const [doc, versoes] = await Promise.all([getDocumento(id), getVersoes(id)])

  if (!doc) notFound()

  const versaoAtual = versoes[0]
  const aprovacoes = versaoAtual ? await getAprovacoesPendentes(versaoAtual.id) : []

  const canApproveLevel1 = session?.papel === 'TI' || session?.papel === 'Admin'
  const canApproveLevel2 = session?.papel === 'Titular' || session?.papel === 'Admin'

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/documentos" className="text-xs text-zinc-400 hover:text-zinc-600">← Documentos</Link>
          <h1 className="text-2xl font-semibold text-zinc-900 mt-1">{doc.titulo}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={doc.status} />
            <span className="text-xs text-zinc-500">{doc.tipo}</span>
            {doc.codigo_artigo && <span className="text-xs text-zinc-400">{doc.codigo_artigo}</span>}
          </div>
        </div>
      </div>

      {/* Versão atual — conteúdo */}
      {versaoAtual && (
        <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-900">
              Versão {versaoAtual.numero_versao}
            </h2>
            <span className="text-xs text-zinc-400 font-mono" title="SHA-256">
              #{versaoAtual.hash_conteudo.slice(0, 12)}…
            </span>
          </div>
          <div className="prose prose-sm max-w-none text-zinc-700">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{versaoAtual.conteudo_md}</pre>
          </div>
        </div>
      )}

      {/* Aprovações da versão atual */}
      {versaoAtual && aprovacoes.length > 0 && (
        <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Fluxo de Aprovação</h2>
          <div className="space-y-3">
            {aprovacoes.map(ap => (
              <div key={ap.id} className="flex items-center gap-3 text-sm">
                <span className="w-28 text-zinc-500 text-xs">
                  {ap.nivel === 1 ? 'Nível 1 — TI' : 'Nível 2 — Titular'}
                </span>
                <StatusBadge status={ap.status} />
                <span className="text-zinc-600">{ap.aprovador_nome ?? 'Aguardando'}</span>
                {ap.comentario && <span className="text-zinc-400 text-xs">"{ap.comentario}"</span>}
              </div>
            ))}
          </div>

          {/* Ação de aprovação */}
          {aprovacoes.some(ap => ap.status === 'Pendente' && (
            (ap.nivel === 1 && canApproveLevel1) ||
            (ap.nivel === 2 && canApproveLevel2)
          )) && (
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <AprovacaoForm
                aprovacoes={aprovacoes.filter(ap => ap.status === 'Pendente')}
                canApproveLevel1={canApproveLevel1}
                canApproveLevel2={canApproveLevel2}
              />
            </div>
          )}
        </div>
      )}

      {/* Submeter para revisão */}
      {doc.status === 'Rascunho' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-6">
          <p className="text-sm text-blue-800 font-medium mb-3">
            Este documento está em rascunho. Submeta para iniciar o fluxo de aprovação.
          </p>
          <SubmeterRevisaoButton documentoId={doc.id} />
        </div>
      )}

      {/* Nova versão */}
      {(doc.status === 'Rascunho' || doc.status === 'Revisao_TI') && (
        <div className="bg-white rounded-lg border border-zinc-200 p-6 mb-6">
          <h2 className="text-sm font-semibold text-zinc-900 mb-4">Nova Versão</h2>
          <NovaVersaoForm documentoId={doc.id} versaoAtualConteudo={versaoAtual?.conteudo_md ?? ''} />
        </div>
      )}

      {/* Histórico de versões */}
      <div className="bg-white rounded-lg border border-zinc-200">
        <div className="px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Histórico de Versões</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-500 border-b border-zinc-100">
              <th className="px-5 py-3 text-left font-medium">Versão</th>
              <th className="px-5 py-3 text-left font-medium">Alterações</th>
              <th className="px-5 py-3 text-left font-medium">Por</th>
              <th className="px-5 py-3 text-left font-medium">Data</th>
              <th className="px-5 py-3 text-left font-medium">Hash</th>
            </tr>
          </thead>
          <tbody>
            {versoes.map((v, i) => (
              <tr key={v.id} className={`border-b border-zinc-50 ${i === 0 ? 'bg-indigo-50/40' : ''}`}>
                <td className="px-5 py-3 font-medium text-zinc-900">
                  {v.numero_versao}
                  {i === 0 && <span className="ml-2 text-xs text-indigo-600">(atual)</span>}
                </td>
                <td className="px-5 py-3 text-zinc-600 text-xs">{v.alteracoes ?? '—'}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{v.criado_por_nome}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">
                  {new Date(v.criado_em).toLocaleString('pt-BR')}
                </td>
                <td className="px-5 py-3 font-mono text-zinc-400 text-xs">{v.hash_conteudo.slice(0, 16)}…</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
