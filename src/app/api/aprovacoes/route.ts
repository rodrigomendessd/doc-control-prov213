import pool from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const { rows } = await pool.query(`
    SELECT a.id, a.nivel, a.status, a.comentario, a.data,
           d.id AS documento_id, d.titulo, d.tipo,
           v.numero_versao, u.nome AS aprovador_nome
    FROM aprovacoes a
    JOIN versoes_documento v ON v.id = a.versao_id
    JOIN documentos d ON d.id = v.documento_id
    LEFT JOIN usuarios u ON u.id = a.aprovador_id
    WHERE a.status = 'Pendente'
    ORDER BY a.nivel, a.criado_em
  `)
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { aprovacaoId, decisao, comentario } = await req.json()
  if (!aprovacaoId || !['Aprovado', 'Rejeitado'].includes(decisao)) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })
  }

  const { rows } = await pool.query<{ nivel: number; versao_id: string; status: string }>(
    'SELECT nivel, versao_id, status FROM aprovacoes WHERE id = $1',
    [aprovacaoId]
  )
  const aprovacao = rows[0]
  if (!aprovacao || aprovacao.status !== 'Pendente') {
    return NextResponse.json({ error: 'Aprovação não encontrada ou já processada' }, { status: 404 })
  }

  // Valida permissão por nível
  if (aprovacao.nivel === 1 && !['TI', 'Admin'].includes(session.papel)) {
    return NextResponse.json({ error: 'Apenas usuários TI podem aprovar nível 1' }, { status: 403 })
  }
  if (aprovacao.nivel === 2 && !['Titular', 'Admin'].includes(session.papel)) {
    return NextResponse.json({ error: 'Apenas o Titular pode aprovar nível 2' }, { status: 403 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(
      'UPDATE aprovacoes SET status = $1, aprovador_id = $2, comentario = $3, data = now() WHERE id = $4',
      [decisao, session.id, comentario ?? null, aprovacaoId]
    )

    // Busca documento_id pela versao
    const { rows: docRows } = await client.query<{ documento_id: string }>(
      'SELECT documento_id FROM versoes_documento WHERE id = $1',
      [aprovacao.versao_id]
    )
    const documentoId = docRows[0].documento_id

    if (decisao === 'Rejeitado') {
      // Volta para Rascunho
      await client.query("UPDATE documentos SET status = 'Rascunho' WHERE id = $1", [documentoId])
    } else if (decisao === 'Aprovado' && aprovacao.nivel === 1) {
      // Avança para aguardar aprovação titular
      await client.query("UPDATE documentos SET status = 'Aguardando_Aprovacao' WHERE id = $1", [documentoId])
      await client.query(
        "INSERT INTO aprovacoes (versao_id, nivel) VALUES ($1, 2)",
        [aprovacao.versao_id]
      )
    } else if (decisao === 'Aprovado' && aprovacao.nivel === 2) {
      // Aprovação final
      await client.query("UPDATE documentos SET status = 'Aprovado' WHERE id = $1", [documentoId])
    }

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
