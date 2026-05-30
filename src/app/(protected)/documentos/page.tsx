import pool from '@/lib/db'
import StatusBadge from '@/components/StatusBadge'
import Link from 'next/link'

async function getDocumentos(status?: string, tipo?: string) {
  const conditions: string[] = []
  const params: string[] = []
  if (status) { conditions.push(`d.status = $${params.push(status)}`); }
  if (tipo)   { conditions.push(`d.tipo = $${params.push(tipo)}`); }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const { rows } = await pool.query<{
    id: string; titulo: string; tipo: string; status: string;
    codigo_artigo: string; criado_por_nome: string; atualizado_em: Date; numero_versao: string
  }>(`
    SELECT d.id, d.titulo, d.tipo, d.status, d.codigo_artigo,
           u.nome AS criado_por_nome, d.atualizado_em,
           v.numero_versao
    FROM documentos d
    LEFT JOIN usuarios u ON u.id = d.criado_por
    LEFT JOIN versoes_documento v ON v.id = d.versao_atual_id
    ${where}
    ORDER BY d.atualizado_em DESC
  `, params)
  return rows
}

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tipo?: string }>
}) {
  const { status, tipo } = await searchParams
  const docs = await getDocumentos(status, tipo)

  const tipos = ['PSI', 'POP', 'Politica', 'Manual', 'Formulario', 'Outros']
  const statuses = [
    { value: 'Rascunho',             label: 'Rascunho' },
    { value: 'Revisao_TI',           label: 'Revisão TI' },
    { value: 'Aguardando_Aprovacao', label: 'Ag. Aprovação' },
    { value: 'Aprovado',             label: 'Aprovado' },
    { value: 'Obsoleto',             label: 'Obsoleto' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Documentos</h1>
        <Link
          href="/documentos/novo"
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
        >
          + Novo documento
        </Link>
      </div>

      <div className="flex gap-3 mb-5 flex-wrap">
        <form method="GET" className="flex gap-2 flex-wrap">
          <select
            name="status"
            defaultValue={status ?? ''}
            onChange={e => { (e.target.form as HTMLFormElement).submit() }}
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-700"
          >
            <option value="">Todos os status</option>
            {statuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <select
            name="tipo"
            defaultValue={tipo ?? ''}
            onChange={e => { (e.target.form as HTMLFormElement).submit() }}
            className="px-3 py-1.5 text-sm border border-zinc-200 rounded-md bg-white text-zinc-700"
          >
            <option value="">Todos os tipos</option>
            {tipos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </form>
        {(status || tipo) && (
          <Link href="/documentos" className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-700 self-center">
            Limpar filtros ×
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg border border-zinc-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-zinc-500 border-b border-zinc-100">
              <th className="px-5 py-3 text-left font-medium">Título</th>
              <th className="px-5 py-3 text-left font-medium">Tipo</th>
              <th className="px-5 py-3 text-left font-medium">Artigo</th>
              <th className="px-5 py-3 text-left font-medium">Versão</th>
              <th className="px-5 py-3 text-left font-medium">Status</th>
              <th className="px-5 py-3 text-left font-medium">Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-zinc-400 text-xs">
                  Nenhum documento encontrado.
                </td>
              </tr>
            )}
            {docs.map(doc => (
              <tr key={doc.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                <td className="px-5 py-3">
                  <Link href={`/documentos/${doc.id}`} className="text-indigo-700 hover:underline font-medium">
                    {doc.titulo}
                  </Link>
                  <p className="text-xs text-zinc-400">{doc.criado_por_nome}</p>
                </td>
                <td className="px-5 py-3 text-zinc-600">{doc.tipo}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{doc.codigo_artigo ?? '—'}</td>
                <td className="px-5 py-3 text-zinc-500 text-xs">{doc.numero_versao ?? '—'}</td>
                <td className="px-5 py-3"><StatusBadge status={doc.status} /></td>
                <td className="px-5 py-3 text-zinc-500 text-xs">
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
