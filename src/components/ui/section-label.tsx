import * as React from "react"
import { cn } from "@/lib/utils"

type SectionLabelProps = React.ComponentProps<"div"> & {
  icon: React.ReactNode
  label: string
  /** Accent color for the icon background. Pass a Tailwind bg class like "bg-smyls-blue-50" */
  iconBg?: string
  /** Accent color for the icon itself. Pass a Tailwind text class like "text-smyls-blue-500" */
  iconColor?: string
  /** Optional count badge shown after the label */
  count?: number | string
}

function SectionLabel({
  icon,
  label,
  iconBg = "bg-smyls-blue-50",
  iconColor = "text-smyls-blue-500",
  count,
  className,
  ...props
}: SectionLabelProps) {
  return (
    <div
      data-slot="section-label"
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <div
        className={cn(
          "grid size-7 shrink-0 place-items-center rounded-lg [&_svg]:size-4",
          iconBg,
          iconColor
        )}
      >
        {icon}
      </div>
      <span className="text-base font-semibold">{label}</span>
      {count !== undefined && (
        <span className="text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </div>
  )
}

export { SectionLabel }
