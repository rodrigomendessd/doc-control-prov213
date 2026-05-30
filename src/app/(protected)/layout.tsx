import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <Sidebar nome={session.nome} papel={session.papel} />
      <main className="ml-60 flex-1 p-8">{children}</main>
    </div>
  )
}
