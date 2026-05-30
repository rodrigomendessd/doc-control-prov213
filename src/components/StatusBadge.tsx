const config: Record<string, { label: string; className: string }> = {
  Rascunho:              { label: 'Rascunho',          className: 'bg-zinc-100 text-zinc-700' },
  Revisao_TI:            { label: 'Revisão TI',        className: 'bg-blue-100 text-blue-700' },
  Aguardando_Aprovacao:  { label: 'Ag. Aprovação',     className: 'bg-amber-100 text-amber-700' },
  Aprovado:              { label: 'Aprovado',           className: 'bg-emerald-100 text-emerald-700' },
  Obsoleto:              { label: 'Obsoleto',           className: 'bg-red-100 text-red-600' },
}

export default function StatusBadge({ status }: { status: string }) {
  const { label, className } = config[status] ?? { label: status, className: 'bg-zinc-100 text-zinc-700' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
  )
}
