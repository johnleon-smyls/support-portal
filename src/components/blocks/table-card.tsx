import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SectionLabel } from '@/components/ui/section-label'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'

type Column<T> = {
  key: string
  label: string
  render?: (item: T, index: number) => React.ReactNode
  /** Class applied to body cells only */
  className?: string
  /** Class applied to the header cell only */
  headerClassName?: string
}

type TableCardProps<T> = React.ComponentProps<typeof Card> & {
  icon?: React.ReactNode
  title: string
  iconBg?: string
  iconColor?: string
  count?: number
  columns: Column<T>[]
  rows: T[]
  /** Optional action element in the header (e.g. export button) */
  action?: React.ReactNode
  /** Optional content above the table (e.g. search/filters) */
  toolbar?: React.ReactNode
  /** Optional footer below the table (e.g. pagination, "view all") */
  footer?: React.ReactNode
  /** Optional class applied to each body row */
  rowClassName?: string
}

function TableCard<T extends Record<string, unknown>>({
  icon,
  title,
  iconBg,
  iconColor,
  count,
  columns,
  rows,
  action,
  toolbar,
  footer,
  rowClassName,
  className,
  ...props
}: TableCardProps<T>) {
  return (
    <Card className={cn('overflow-hidden', className)} {...props}>
      <CardHeader>
        <div className="flex items-center justify-between">
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
        </div>
        {toolbar && <div className="mt-3">{toolbar}</div>}
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-border min-h-[280px]">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      'h-10 uppercase text-xs tracking-wide !text-muted-foreground !font-semibold',
                      col.headerClassName
                    )}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i} className={rowClassName}>
                  {columns.map((col) => (
                    <TableCell key={col.key} className={col.className}>
                      {col.render ? col.render(row, i) : (row[col.key] as React.ReactNode)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {footer && <div className="mt-3 text-sm text-muted-foreground">{footer}</div>}
      </CardContent>
    </Card>
  )
}

export { TableCard }
export type { Column }
