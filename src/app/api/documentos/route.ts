import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { sha256 } from '@/lib/hash'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const { rows } = await pool.query(`
    SELECT d.id, d.titulo, d.tipo, d.status, d.codigo_artigo,
           u.nome AS criado_por_nome, d.atualizado_em, v.numero_versao
    FROM documentos d
    LEFT JOIN usuarios u ON u.id = d.criado_por
    LEFT JOIN versoes_documento v ON v.id = d.versao_atual_id
    ORDER BY d.atualizado_em DESC
  `)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { titulo, tipo, codigo_artigo, conteudo_md, alteracoes } = await req.json()

  if (!titulo || !tipo || !conteudo_md) {
    return NextResponse.json({ error: 'Título, tipo e conteúdo são obrigatórios' }, { status: 400 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const docRes = await client.query<{ id: string }>(
      `INSERT INTO documentos (titulo, tipo, codigo_artigo, criado_por)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [titulo, tipo, codigo_artigo ?? null, session.id]
    )
    const docId = docRes.rows[0].id

    const versaoRes = await client.query<{ id: string }>(
      `INSERT INTO versoes_documento (documento_id, numero_versao, conteudo_md, hash_conteudo, alteracoes, criado_por)
       VALUES ($1, '1.0', $2, $3, $4, $5) RETURNING id`,
      [docId, conteudo_md, sha256(conteudo_md), alteracoes ?? 'Versão inicial', session.id]
    )
    const versaoId = versaoRes.rows[0].id

    await client.query(
      'UPDATE documentos SET versao_atual_id = $1 WHERE id = $2',
      [versaoId, docId]
    )

    // Cria aprovações de nível 1 e 2 (aguardando submissão explícita para revisão)
    // Neste momento o doc está como Rascunho — aprovações serão criadas ao submeter para revisão

    await client.query('COMMIT')
    return NextResponse.json({ id: docId }, { status: 201 })
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  } finally {
    client.release()
  }
}
