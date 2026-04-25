import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SectionLabel } from '@/components/ui/section-label'
import { InfoRow } from '@/components/ui/info-row'

type InfoItem = {
  icon?: React.ReactNode
  label: string
  sublabel?: string
  indent?: boolean
  isPlaceholder?: boolean
  highlightSublabel?: boolean
  className?: string
}

type InfoCardProps = React.ComponentProps<typeof Card> & {
  /** Icon for the section label */
  icon?: React.ReactNode
  /** Title for the section label */
  title: string
  /** Icon background color class */
  iconBg?: string
  /** Icon color class */
  iconColor?: string
  /** List of info items to display */
  items: InfoItem[]
  /** Optional action element in the header (e.g. edit button) */
  action?: React.ReactNode
  /** Optional footer content below items */
  footer?: React.ReactNode
}

function InfoCard({
  icon,
  title,
  iconBg,
  iconColor,
  items,
  action,
  footer,
  className,
  ...props
}: InfoCardProps) {
  return (
    <Card className={cn('', className)} {...props}>
      <CardHeader className="flex! flex-row items-center justify-between">
        {icon ? (
          <SectionLabel icon={icon} label={title} iconBg={iconBg} iconColor={iconColor} />
        ) : (
          <span className="text-base font-semibold">{title}</span>
        )}
        {action}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="space-y-2.5">
          {items.map((item, i) => (
            <InfoRow
              key={i}
              icon={item.icon}
              label={item.label}
              sublabel={item.sublabel}
              indent={item.indent}
              isPlaceholder={item.isPlaceholder}
              highlightSublabel={item.highlightSublabel}
              className={item.className}
            />
          ))}
        </div>
        {footer && <div className="mt-auto">{footer}</div>}
      </CardContent>
    </Card>
  )
}

export { InfoCard }
export type { InfoItem }
