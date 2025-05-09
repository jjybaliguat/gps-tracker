"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useTheme } from "next-themes"

export const description = "An interactive bar chart"

const chartData = [
  { date: "2024-05-01", expected: 28800, actual: 17000 },
  { date: "2024-05-02", expected: 28800, actual: 17000 },
  { date: "2024-05-03", expected: 28800, actual: 17000 },
  { date: "2024-05-05", expected: 28800, actual: 17000 },
  { date: "2024-05-06", expected: 28800, actual: 17000 },
  { date: "2024-05-07", expected: 28800, actual: 17000 },
  { date: "2024-05-08", expected: 28800, actual: 17000 },
]

const chartConfig = {
      expected: {
        label: "Expected",
        color: "hsl(var(--chart-1))",  // Default color (light mode)
      },
      actual: {
        label: "Actual",
        color: "hsl(var(--chart-2))",  // Default color (light mode)
      },
} satisfies ChartConfig

export function WeeklyEfficiencyChart() {
  const [activeChart, setActiveChart] =
    React.useState<keyof typeof chartConfig>("expected")

    const {theme} = useTheme()

  const total = React.useMemo(
    () => ({
      expected: chartData.reduce((acc, curr) => acc + curr.expected, 0),
      actual: chartData.reduce((acc, curr) => acc + curr.actual, 0),
    }),
    []
  )

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Weekly GPG Transmission Effeciency</CardTitle>
          <CardDescription>
            Showing weekly GPS data transmission
          </CardDescription>
        </div>
        <div className="flex">
          {["expected", "actual"].map((key) => {
            const chart = key as keyof typeof chartConfig
            return (
              <button
                key={chart}
                data-active={activeChart === chart}
                className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
                onClick={() => setActiveChart(chart)}
              >
                <span className="text-xs text-muted-foreground">
                  {chartConfig[chart].label}
                </span>
                <span className="text-lg font-bold leading-none sm:text-3xl">
                  {total[key as keyof typeof total].toLocaleString()}
                </span>
              </button>
            )
          })}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="actual"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  }}
                />
              }
            />
            <Bar dataKey={activeChart}
            fill={
                theme === 'dark'
                  ? chartConfig['expected']?.color.replace('--chart-', '--chart-') + '-dark'
                  : chartConfig['expected']?.color.replace('--chart-', '--chart-') + '-light'
              }
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
