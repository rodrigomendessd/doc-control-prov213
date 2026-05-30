import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'

async function getSummary() {
  const [counts, recent, pendingApprovals] = await Promise.all([
    pool.query<{ status: string; total: string }>(`
      SELECT status, COUNT(*) AS total FROM documentos GROUP BY status ORDER BY status
    `),
    pool.query<{ id: string; titulo: string; tipo: string; status: string; atualizado_em: Date }>(`
      SELECT id, titulo, tipo, status, atualizado_em
      FROM documentos ORDER BY atualizado_em DESC LIMIT 5
    `),
    pool.query<{ total: string }>(`
      SELECT COUNT(*) AS total FROM aprovacoes WHERE status = 'Pendente'
    `),
  ])
  return {
    counts: counts.rows,
    recent: recent.rows,
    pendingApprovals: parseInt(pendingApprovals.rows[0]?.total ?? '0'),
  }
}

const statusOrder = ['Rascunho', 'Revisao_TI', 'Aguardando_Aprovacao', 'Aprovado', 'Obsoleto']
const cardColor: Record<string, string> = {
  Rascunho:             'bg-zinc-50 border-zinc-200',
  Revisao_TI:           'bg-blue-50 border-blue-200',
  Aguardando_Aprovacao: 'bg-amber-50 border-amber-200',
  Aprovado:             'bg-emerald-50 border-emerald-200',
  Obsoleto:             'bg-red-50 border-red-200',
}
const statusLabel: Record<string, string> = {
  Rascunho:             'Rascunho',
  Revisao_TI:           'Em Revisão TI',
  Aguardando_Aprovacao: 'Ag. Aprovação',
  Aprovado:             'Aprovados',
  Obsoleto:             'Obsoletos',
}

export default async function DashboardPage() {
  const session = await getSession()
  const { counts, recent, pendingApprovals } = await getSummary()

  const countMap = Object.fromEntries(counts.map(r => [r.status, parseInt(r.total)]))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">Bem-vindo, {session?.nome}</p>
      </div>

      {pendingApprovals > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-amber-800 font-medium">
            {pendingApprovals} aprovação{pendingApprovals > 1 ? 'ões' : ''} pendente{pendingApprovals > 1 ? 's' : ''}
          </p>
          <Link href="/aprovacoes" className="text-sm text-amber-700 font-semibold hover:underline">
            Ver fila →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statusOrder.map(status => (
          <div key={status} className={`rounded-lg border p-4 ${cardColor[status]}`}>
            <p className="text-2xl font-bold text-zinc-900">{countMap[status] ?? 0}</p>
            <p className="text-xs text-zinc-600 mt-1">{statusLabel[status]}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-zinc-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
          <h2 className="text-sm font-semibold text-zinc-900">Documentos Recentes</h2>
          <Link href="/documentos" className="text-xs text-indigo-600 hover:underline">Ver todos</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-500 border-b border-zinc-100">
              <th className="px-5 py-3 text-left font-medium">Título</th>
              <th className="px-5 py-3 text-left font-medium">Tipo</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-zinc-400 text-xs">
                  Nenhum documento criado ainda.{' '}
                  <Link href="/documentos/novo" className="text-indigo-600 hover:underline">Criar primeiro</Link>
                </td>
              </tr>
            )}
            {recent.map(doc => (
              <tr key={doc.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-5 py-3">
                  <Link href={`/documentos/${doc.id}`} className="text-indigo-700 hover:underline font-medium">
                    {doc.titulo}
                  </Link>
                </td>
                <td className="px-5 py-3 text-zinc-600">{doc.tipo}</td>
                <td className="px-5 py-3"><StatusBadge status={doc.status} /></td>
                <td className="px-5 py-3 text-zinc-500">
                  {new Date(doc.atualizado_em).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
