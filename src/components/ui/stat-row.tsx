import * as React from "react"
import { cn } from "@/lib/utils"

type StatRowProps = React.ComponentProps<"div"> & {
  label: string
  sublabel?: string
  value: string | number
  /** Tailwind text color class for the value, e.g. "text-smyls-green-500" */
  valueColor?: string
}

function StatRow({
  label,
  sublabel,
  value,
  valueColor = "text-foreground",
  className,
  ...props
}: StatRowProps) {
  return (
    <div
      data-slot="stat-row"
      className={cn("flex items-center justify-between", className)}
      {...props}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {sublabel && (
          <div className="text-xs text-muted-foreground/70">{sublabel}</div>
        )}
      </div>
      <div className={cn("text-xl font-bold tracking-tight", valueColor)}>
        {value}
      </div>
    </div>
  )
}

export { StatRow }
