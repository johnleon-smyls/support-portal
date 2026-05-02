import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none",
        // Hit area
        "after:absolute after:-inset-x-3 after:-inset-y-2",
        // Focus
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        // Validation
        "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        /*
         * Size variants — CSS vars drive the thumb's calc() so positions stay in sync.
         *   --switch-w:     track width    (matches w-N)
         *   --switch-h:     track height   (matches h-N)
         *   --switch-thumb: thumb diameter  (80% of track height for consistent proportions)
         *
         * Thumb padding & checked offset are derived in the Thumb element:
         *   pad   = (h - thumb - 2px border) / 2
         *   check = w - thumb - pad - 2px border
         */
        "data-[size=default]:h-5 data-[size=default]:w-10 data-[size=default]:[--switch-w:calc(var(--spacing)*10)] data-[size=default]:[--switch-h:calc(var(--spacing)*5)] data-[size=default]:[--switch-thumb:calc(var(--spacing)*4)]",
        "data-[size=sm]:h-4 data-[size=sm]:w-8 data-[size=sm]:[--switch-w:calc(var(--spacing)*8)] data-[size=sm]:[--switch-h:calc(var(--spacing)*4)] data-[size=sm]:[--switch-thumb:calc(var(--spacing)*3.2)]",
        // State
        "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block rounded-full bg-background ring-0 transition-transform",
          // Thumb size (inherits from root's --switch-thumb)
          "size-[var(--switch-thumb)]",
          // Padding = (track height - thumb - 2 * border) / 2, same on all sides
          "[--switch-pad:calc((var(--switch-h)-var(--switch-thumb)-2px)/2)]",
          "data-[state=unchecked]:translate-x-[var(--switch-pad)]",
          "data-[state=checked]:translate-x-[calc(var(--switch-w)-var(--switch-thumb)-var(--switch-pad)-2px)]",
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
