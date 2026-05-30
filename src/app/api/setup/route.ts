import pool from '@/lib/db'
import { hash } from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

// Only works when no users exist. Creates the first Admin user.
export async function POST(req: NextRequest) {
  const { rows } = await pool.query('SELECT COUNT(*) AS total FROM usuarios')
  if (parseInt(rows[0].total) > 0) {
    return NextResponse.json({ error: 'Setup já realizado. Use o login.' }, { status: 403 })
  }

  const { nome, email, senha } = await req.json()
  if (!nome || !email || !senha || senha.length < 8) {
    return NextResponse.json({ error: 'Nome, e-mail e senha (mín. 8 chars) são obrigatórios' }, { status: 400 })
  }

  const senha_hash = await hash(senha, 10)
  await pool.query(
    'INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES ($1, $2, $3, $4)',
    [nome, email, senha_hash, 'Admin']
  )

  return NextResponse.json({ ok: true, message: 'Usuário Admin criado. Faça login.' })
}

export async function GET() {
  const { rows } = await pool.query('SELECT COUNT(*) AS total FROM usuarios')
  const needsSetup = parseInt(rows[0].total) === 0
  return NextResponse.json({ needsSetup })
}
