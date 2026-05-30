import pool from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await pool.query('SELECT 1')
    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ status: 'error' }, { status: 503 })
  }
}
