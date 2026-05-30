import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// Submete documento para revisão (Rascunho → Revisao_TI), criando aprovações
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { id: documentoId } = await params
  const { acao } = await req.json()

  if (acao !== 'submeter_revisao') {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  const { rows } = await pool.query<{ status: string; versao_atual_id: string }>(
    'SELECT status, versao_atual_id FROM documentos WHERE id = $1',
    [documentoId]
  )
  const doc = rows[0]
  if (!doc) return NextResponse.json({ error: 'Documento não encontrado' }, { status: 404 })
  if (doc.status !== 'Rascunho') {
    return NextResponse.json({ error: 'Apenas rascunhos podem ser submetidos para revisão' }, { status: 422 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      "UPDATE documentos SET status = 'Revisao_TI' WHERE id = $1",
      [documentoId]
    )

    // Cria aprovação nível 1 (TI)
    await client.query(
      "INSERT INTO aprovacoes (versao_id, nivel) VALUES ($1, 1)",
      [doc.versao_atual_id]
    )

    await client.query('COMMIT')
    return NextResponse.json({ ok: true })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  } finally {
    client.release()
  }
}
