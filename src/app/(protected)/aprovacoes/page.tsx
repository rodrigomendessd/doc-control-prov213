import pool from '@/lib/db'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'

async function getAprovacoesPendentes() {
  const { rows } = await pool.query<{
    aprovacao_id: string; nivel: number; documento_id: string;
    titulo: string; tipo: string; numero_versao: string;
    aprovador_nome: string; criado_em: Date
  }>(`
    SELECT a.id AS aprovacao_id, a.nivel, d.id AS documento_id,
           d.titulo, d.tipo, v.numero_versao,
           u.nome AS aprovador_nome, a.criado_em
    FROM aprovacoes a
    JOIN versoes_documento v ON v.id = a.versao_id
    JOIN documentos d ON d.id = v.documento_id
    LEFT JOIN usuarios u ON u.id = a.aprovador_id
    WHERE a.status = 'Pendente'
    ORDER BY a.nivel, a.criado_em
  `)
  return rows
}

export default async function AprovacoesPage() {
  const pendentes = await getAprovacoesPendentes()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Fila de Aprovações</h1>
        <p className="text-sm text-zinc-500 mt-1">{pendentes.length} aprovação(ões) pendente(s)</p>
      </div>

      <div className="bg-white rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-500 border-b border-zinc-100">
              <th className="px-5 py-3 text-left font-medium">Documento</th>
              <th className="px-5 py-3 text-left font-medium">Tipo</th>
              <th className="px-5 py-3 text-left font-medium">Versão</th>
              <th className="px-5 py-3 text-left font-medium">Nível</th>
              <th className="px-5 py-3 text-left font-medium">Aguardando desde</th>
              <th className="px-5 py-3 text-left font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {pendentes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-zinc-400 text-xs">
                  Nenhuma aprovação pendente.
                </td>
              </tr>
            )}
            {pendentes.map(row => (
              <tr key={row.aprovacao_id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-5 py-3">
                  <Link href={`/documentos/${row.documento_id}`} className="text-indigo-700 hover:underline font-medium">
                    {row.titulo}
                  </Link>
                </td>
                <td className="px-5 py-3 text-zinc-600">{row.tipo}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{row.numero_versao}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                    row.nivel === 1
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    {row.nivel === 1 ? 'Nível 1 — TI' : 'Nível 2 — Titular'}
                  </span>
                </td>
                <td className="px-5 py-3 text-zinc-500 text-xs">
                  {new Date(row.criado_em).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-5 py-3">
                  <Link
                    href={`/documentos/${row.documento_id}`}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    Analisar →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
