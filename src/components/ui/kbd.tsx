import * as React from 'react'
import { CommandIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useOS } from '@/hooks/useOS'

/* -- Key icon SVGs -- */

function ShiftIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-1 -1 15 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-[8px] w-[9px]', className)}
    >
      <path
        d="M4.5 10C4.2 10 3.95 9.9 3.78 9.73C3.6 9.55 3.5 9.3 3.5 9V6.5H1.2C0.95 6.5 0.75 6.42 0.6 6.28C0.45 6.14 0.38 5.96 0.38 5.75C0.38 5.63 0.41 5.52 0.47 5.42C0.53 5.32 0.61 5.22 0.72 5.11L5.75 0.25C5.85 0.15 5.96 0.08 6.07 0.04C6.18 0 6.3 0 6.42 0C6.55 0 6.66 0.02 6.77 0.06C6.88 0.1 6.98 0.17 7.08 0.27L12.07 5.13C12.17 5.23 12.25 5.33 12.31 5.44C12.37 5.54 12.4 5.65 12.4 5.77C12.4 5.98 12.33 6.14 12.18 6.28C12.04 6.42 11.85 6.5 11.63 6.5H9.3V9C9.3 9.3 9.2 9.55 9.02 9.73C8.85 9.9 8.6 10 8.3 10H4.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  )
}

/* -- Symbol map --
 * Maps magic key names to rendered content.
 * Values can be strings (text) or React elements (icons).
 */
const symbolMap: Record<string, React.ReactNode> = {
  shift: <ShiftIcon />,
  mod: null, // handled separately with OS detection
}

/* -- Kbd --
 * Single keyboard key cap.
 * Hidden below `sm` by default — pass `className` to override.
 */
function Kbd({
  className,
  children,
  ...props
}: React.ComponentProps<'kbd'>) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        'hidden sm:inline-flex',
        'h-5 min-w-5 items-center justify-center rounded border border-border bg-muted px-1 font-sans text-[11px] font-medium text-muted-foreground select-none',
        className
      )}
      {...props}
    >
      {children}
    </kbd>
  )
}

/* -- KbdShortcut --
 * Renders a multi-key shortcut combo.
 *
 * Magic keys (auto-resolved):
 *   "mod"   -> Cmd icon (Mac) / Ctrl text (other)
 *   "shift" -> outlined shift arrow icon
 *
 * Usage:
 *   <KbdShortcut keys={["mod", "K"]} />
 *   <KbdShortcut keys={["mod", "shift", "P"]} />
 */
function KbdShortcut({
  keys,
  className,
  ...props
}: { keys: string[] } & Omit<React.ComponentProps<'span'>, 'children'>) {
  const { isMac } = useOS()

  const resolved = keys.map((key) => {
    if (key === 'mod') {
      return isMac
        ? <CommandIcon className="!size-2.75 stroke-[2.25]" />
        : 'Ctrl'
    }
    return symbolMap[key.toLowerCase()] ?? key
  })

  return (
    <span
      data-slot="kbd-shortcut"
      className={cn('hidden sm:inline-flex items-center gap-0.5', className)}
      {...props}
    >
      {resolved.map((content, i) => (
        <Kbd key={i} className="sm:inline-flex">
          {content}
        </Kbd>
      ))}
    </span>
  )
}

export { Kbd, KbdShortcut }
