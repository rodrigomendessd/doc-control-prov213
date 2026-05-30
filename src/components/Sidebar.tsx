'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/dashboard',    label: 'Dashboard' },
  { href: '/documentos',   label: 'Documentos' },
  { href: '/aprovacoes',   label: 'Aprovações' },
]

export default function Sidebar({ nome, papel }: { nome: string; papel: string }) {
  const pathname = usePathname()
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest">Doc Control</p>
        <p className="text-sm text-slate-300 mt-1 truncate">Prov. 213/2026</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-6 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 truncate">{nome}</p>
        <p className="text-xs text-slate-500">{papel}</p>
        <form action="/api/auth/logout" method="POST" className="mt-2">
          <button
            type="submit"
            className="text-xs text-slate-400 hover:text-red-400 transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
