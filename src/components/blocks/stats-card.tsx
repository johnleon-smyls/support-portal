import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { SectionLabel } from "@/components/ui/section-label"
import { StatRow } from "@/components/ui/stat-row"
import { Separator } from "@/components/ui/separator"

type StatItem = {
  label: string
  sublabel?: string
  value: string | number
  valueColor?: string
}

type StatsCardProps = React.ComponentProps<typeof Card> & {
  icon: React.ReactNode
  title: string
  iconBg?: string
  iconColor?: string
  stats: StatItem[]
  /** Show separators between stat rows. Default: true */
  dividers?: boolean
}

function StatsCard({
  icon,
  title,
  iconBg,
  iconColor,
  stats,
  dividers = true,
  className,
  ...props
}: StatsCardProps) {
  return (
    <Card className={cn("", className)} {...props}>
      <CardHeader>
        <SectionLabel icon={icon} label={title} iconBg={iconBg} iconColor={iconColor} />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {stats.map((stat, i) => (
            <React.Fragment key={i}>
              {i > 0 && dividers && <Separator />}
              <StatRow
                label={stat.label}
                sublabel={stat.sublabel}
                value={stat.value}
                valueColor={stat.valueColor}
              />
            </React.Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export { StatsCard }
export type { StatItem }
