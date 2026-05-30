import pool from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await pool.query('SELECT 1')
    return NextResponse.json({ status: 'ok' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ status: 'error', detail: msg }, { status: 503 })
  }
}
