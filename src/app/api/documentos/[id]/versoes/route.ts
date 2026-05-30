import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sha256 } from '@/lib/hash'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id: documentoId } = await params
  const { conteudo_md, alteracoes } = await req.json()

  if (!conteudo_md || !alteracoes) {
    return NextResponse.json({ error: 'Conteúdo e descrição de alterações são obrigatórios' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Calcula próximo número de versão
    const { rows: versoes } = await client.query<{ numero_versao: string }>(
      'SELECT numero_versao FROM versoes_documento WHERE documento_id = $1 ORDER BY criado_em DESC LIMIT 1',
      [documentoId]
    )
    const ultimaVersao = versoes[0]?.numero_versao ?? '0.0'
    const [major, minor] = ultimaVersao.split('.').map(Number)
    const novaVersao = `${major}.${minor + 1}`

    const versaoRes = await client.query<{ id: string }>(
      `INSERT INTO versoes_documento (documento_id, numero_versao, conteudo_md, hash_conteudo, alteracoes, criado_por)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [documentoId, novaVersao, conteudo_md, sha256(conteudo_md), alteracoes, session.id]
    )
    const versaoId = versaoRes.rows[0].id

    await client.query(
      'UPDATE documentos SET versao_atual_id = $1, status = $2 WHERE id = $3',
      [versaoId, 'Rascunho', documentoId]
    )

    // Remove aprovações pendentes anteriores (nova versão reinicia o fluxo)
    await client.query(
      `DELETE FROM aprovacoes WHERE versao_id IN (
        SELECT id FROM versoes_documento WHERE documento_id = $1 AND id != $2
      ) AND status = 'Pendente'`,
      [documentoId, versaoId]
    )

    await client.query('COMMIT')
    return NextResponse.json({ id: versaoId, numero_versao: novaVersao }, { status: 201 })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  } finally {
    client.release()
  }
}
