import { Badge } from '@/components/ui/badge'
import { ENUM_LABELS } from '@/lib/labels'
import { cn } from '@/lib/utils'

const STATUS_STYLES: Record<string, string> = {
  // Neutral / pending
  PENDING: 'bg-slate-100 text-slate-700 border-slate-200',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  // In progress / analysis
  OPEN: 'bg-blue-100 text-blue-800 border-blue-200',
  IDENTIFIED: 'bg-blue-100 text-blue-800 border-blue-200',
  MEDIUM: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_ANALYSIS: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_TREATMENT: 'bg-amber-100 text-amber-800 border-amber-200',
  ASSESSED: 'bg-amber-100 text-amber-800 border-amber-200',
  EVALUATED: 'bg-amber-100 text-amber-800 border-amber-200',
  IN_REVIEW: 'bg-amber-100 text-amber-800 border-amber-200',
  ACTION_DEFINED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  IN_EXECUTION: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PENDING_VERIFICATION: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  MONITORED: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  // Warning / critical
  HIGH: 'bg-orange-100 text-orange-800 border-orange-200',
  REOPENED: 'bg-orange-100 text-orange-800 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  CORRECTIVE: 'bg-red-100 text-red-800 border-red-200',
  PREVENTIVE: 'bg-blue-100 text-blue-800 border-blue-200',
  IMPROVEMENT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  // Positive / done
  CLOSED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DONE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  VERIFIED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  IMPLEMENTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  // Inactive
  CANCELLED: 'bg-zinc-100 text-zinc-500 border-zinc-200',
  OBSOLETE: 'bg-zinc-100 text-zinc-500 border-zinc-200',
}

export function StatusBadge({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-muted-foreground">—</span>
  return (
    <Badge variant="outline" className={cn('font-medium', STATUS_STYLES[value])}>
      {ENUM_LABELS[value] ?? value}
    </Badge>
  )
}
