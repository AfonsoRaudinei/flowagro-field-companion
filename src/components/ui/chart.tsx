import * as React from "react"
import { cn } from "@/lib/utils"

// Simple chart placeholder components to replace recharts
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
  }
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ReactNode
  }
>(({ className, children, config, ...props }, ref) => {
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        className={cn(
          "flex aspect-video justify-center items-center text-xs bg-muted/50 rounded-lg border",
          className
        )}
        {...props}
      >
        <div className="text-center text-muted-foreground">
          <p className="text-sm">Gráficos temporariamente indisponíveis</p>
          <p className="text-xs">Dados disponíveis em formato de tabela</p>
        </div>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

// Placeholder components
const ChartTooltip = () => null
const ChartTooltipContent = () => null
const ChartLegend = () => null
const ChartLegendContent = () => null
const ChartStyle = () => null

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}