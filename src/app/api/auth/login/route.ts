import pool from '@/lib/db'
import { signToken } from '@/lib/auth'
import { compare } from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json()

  if (!email || !senha) {
    return NextResponse.json({ error: 'E-mail e senha são obrigatórios' }, { status: 400 })
  }

  const { rows } = await pool.query<{
    id: string; nome: string; email: string; senha_hash: string; papel: string; ativo: boolean
  }>('SELECT * FROM usuarios WHERE email = $1 LIMIT 1', [email])

  const user = rows[0]
  if (!user || !user.ativo) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const senhaOk = await compare(senha, user.senha_hash)
  if (!senhaOk) {
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
  }

  const token = await signToken({
    id: user.id,
    nome: user.nome,
    email: user.email,
    papel: user.papel as 'TI' | 'Titular' | 'Admin',
  })

  const cookieStore = await cookies()
  cookieStore.set('doc_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return NextResponse.json({ ok: true })
}
