import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SectionLabel } from '@/components/ui/section-label'

type ListCardProps<T> = React.ComponentProps<typeof Card> & {
  icon?: React.ReactNode
  title: string
  iconBg?: string
  iconColor?: string
  count?: number
  /** Items to render */
  items: T[]
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode
  /** Optional action element in the header (e.g. add button) */
  action?: React.ReactNode
  /** Layout: stack (vertical list) or grid. Default: stack */
  layout?: 'stack' | 'grid'
  /** Grid columns class when layout is grid. Default: "grid-cols-1 md:grid-cols-2" */
  gridCols?: string
  /** Optional footer content */
  footer?: React.ReactNode
}

function ListCard<T>({
  icon,
  title,
  iconBg,
  iconColor,
  count,
  items,
  renderItem,
  action,
  layout = 'stack',
  gridCols = 'grid-cols-1 md:grid-cols-2',
  footer,
  className,
  ...props
}: ListCardProps<T>) {
  return (
    <Card className={cn('', className)} {...props}>
      <CardHeader className="flex! flex-row items-center justify-between">
        {icon ? (
          <SectionLabel
            icon={icon}
            label={title}
            iconBg={iconBg}
            iconColor={iconColor}
            count={count}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold">{title}</span>
            {count !== undefined && (
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
        )}
        {action}
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            layout === 'stack' && 'space-y-2',
            layout === 'grid' && `grid gap-3 ${gridCols}`
          )}
        >
          {items.map((item, i) => (
            <React.Fragment key={i}>{renderItem(item, i)}</React.Fragment>
          ))}
        </div>
        {footer && <div className="mt-4">{footer}</div>}
      </CardContent>
    </Card>
  )
}

export { ListCard }
