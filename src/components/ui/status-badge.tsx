import * as React from 'react'
import { cn } from '@/lib/utils'

/**
 * Status color map — defines bg and text color for each status.
 * Adapted for helpdesk statuses with SMYLS brand/status tokens.
 */
const statusStyles = {
  // Ticket statuses
  open: { bg: 'bg-smyls-blue-50', text: 'text-smyls-blue-500', dot: 'bg-smyls-blue-400' },
  replied: { bg: 'bg-smyls-green-50', text: 'text-smyls-green-500', dot: 'bg-smyls-green-400' },
  resolved: { bg: 'bg-status-green-50', text: 'text-status-green-500', dot: 'bg-status-green-400' },
  closed: { bg: 'bg-status-gray-100', text: 'text-status-gray-500', dot: 'bg-status-gray-400' },
  // Priority levels
  low: { bg: 'bg-status-green-50', text: 'text-status-green-500', dot: 'bg-status-green-400' },
  medium: { bg: 'bg-status-yellow-50', text: 'text-status-yellow-600', dot: 'bg-status-yellow-400' },
  high: { bg: 'bg-smyls-orange-50', text: 'text-smyls-orange-500', dot: 'bg-smyls-orange-400' },
  urgent: { bg: 'bg-status-red-50', text: 'text-status-red-500', dot: 'bg-status-red-400' },
} as const

type Status = keyof typeof statusStyles

type StatusBadgeProps = Omit<React.ComponentProps<'span'>, 'children'> & {
  status: Status
  /** Override the display label. Defaults to the status name capitalized. */
  label?: string
  /** Show a dot indicator before the label. Default: true */
  dot?: boolean
}

function StatusBadge({ status, label, dot = true, className, ...props }: StatusBadgeProps) {
  const style = statusStyles[status]
  const displayLabel = label ?? status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(
        'inline-flex h-5 w-fit shrink-0 items-center gap-1.5 rounded-4xl px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        style.bg,
        style.text,
        className
      )}
      {...props}
    >
      {dot && <span className={cn('size-1.5 shrink-0 rounded-full', style.dot)} />}
      {displayLabel}
    </span>
  )
}

export { StatusBadge, statusStyles }
export type { Status }
