import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const cookieStore = await cookies()
  cookieStore.delete('doc_session')
  return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3001'))
}
