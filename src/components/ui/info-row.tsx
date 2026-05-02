import * as React from 'react'
import { cn } from '@/lib/utils'

type InfoRowProps = React.ComponentProps<'div'> & {
  icon?: React.ReactNode
  /** Primary text */
  label: string
  /** Optional secondary text shown after/below the label */
  sublabel?: string
  /** Indent the row (for continuation lines like city/state under address) */
  indent?: boolean
  /** Render label as placeholder (muted, italic) */
  isPlaceholder?: boolean
  /** Render sublabel inline and highlighted (bold + foreground color) */
  highlightSublabel?: boolean
}

function InfoRow({
  icon,
  label,
  sublabel,
  indent = false,
  isPlaceholder = false,
  highlightSublabel = false,
  className,
  ...props
}: InfoRowProps) {
  return (
    <div
      data-slot="info-row"
      className={cn('flex items-start gap-2.5 text-sm', indent && 'pl-6', className)}
      {...props}
    >
      {icon && (
        <span className="inline-flex h-[1.25rem] w-5 shrink-0 items-center justify-center text-muted-foreground [&_svg]:size-3.5">
          {icon}
        </span>
      )}
      <div className="min-w-0">
        <span
          className={
            isPlaceholder
              ? 'text-muted-foreground'
              : highlightSublabel
                ? 'text-muted-foreground'
                : 'text-foreground'
          }
        >
          {label}
        </span>
        {sublabel &&
          (highlightSublabel ? (
            <span className="ml-1.5 font-semibold text-foreground">{sublabel}</span>
          ) : (
            <span className="block text-xs text-muted-foreground">{sublabel}</span>
          ))}
      </div>
    </div>
  )
}

export { InfoRow }
