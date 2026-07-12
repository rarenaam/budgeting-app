"use client"

import { useMemo } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { AlertTriangle, CalendarClock, TrendingDown, TrendingUp } from "lucide-react"
import { Badge, Card } from "./primitives"
import {
  type BudgetState,
  allocateByPriority,
  formatCurrency,
  monthlyNet,
  projectCapital,
  totalCapital,
} from "@/lib/budget"

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-popover p-3 text-sm shadow-md">
      <p className="mb-1 font-medium">{label === "Now" ? "Today" : `Month ${String(label).replace("M", "")}`}</p>
      {payload.map((entry: any) => (
        <p key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="capitalize text-muted-foreground">{entry.dataKey}</span>
          <span className="font-mono font-medium">{formatCurrency(entry.value)}</span>
        </p>
      ))}
    </div>
  )
}

export function ProjectTab({ state }: { state: BudgetState }) {
  const projection = useMemo(() => projectCapital(state, 12), [state])
  const net = monthlyNet(state)
  const start = totalCapital(state)
  const end = projection[projection.length - 1]?.total ?? start
  const change = end - start
  const { underfunded } = useMemo(() => {
    const { allocations } = allocateByPriority(state)
    return { underfunded: allocations.filter((a) => !a.funded) }
  }, [state])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Capital today</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{formatCurrency(start)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Projected in 12 months</p>
          <p className="mt-2 font-mono text-2xl font-semibold">{formatCurrency(end)}</p>
        </Card>
        <Card className={`p-5 ${change < 0 ? "border-destructive/40" : ""}`}>
          <p className="text-sm text-muted-foreground">Net change</p>
          <p
            className={`mt-2 flex items-center gap-2 font-mono text-2xl font-semibold ${
              change < 0 ? "text-destructive" : "text-primary"
            }`}
          >
            {change < 0 ? (
              <TrendingDown className="h-5 w-5" aria-hidden="true" />
            ) : (
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            )}
            {change >= 0 ? "+" : ""}
            {formatCurrency(change)}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <CalendarClock className="h-5 w-5 text-primary" aria-hidden="true" />
            12-month capital projection
          </h2>
          <Badge tone={net >= 0 ? "good" : "bad"}>
            {net >= 0 ? "+" : ""}
            {formatCurrency(net)} / month
          </Badge>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={projection} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillSinking" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--chart-1)"
                strokeWidth={2.5}
                fill="url(#fillTotal)"
              />
              <Area
                type="monotone"
                dataKey="sinking"
                stroke="var(--chart-2)"
                strokeWidth={2}
                fill="url(#fillSinking)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-chart-1" aria-hidden="true" /> Total capital
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-chart-2" aria-hidden="true" /> Sinking funds
          </span>
        </div>
      </Card>

      {net < 0 ? (
        <Card className="border-destructive/40 p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/12 text-destructive">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h3 className="font-semibold text-destructive">You&apos;re spending more than you earn</h3>
              <p className="mt-1 text-pretty text-sm leading-relaxed text-muted-foreground">
                At {formatCurrency(net)}/month your capital declines over time. Sinking funds are not
                being fed{underfunded.length ? `, leaving ${underfunded.length} underfunded` : ""}.
                Head to the Sinking Funds tab to re-prioritize, or run a Simulation to test changes.
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <h3 className="mb-3 font-semibold">Month-by-month breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Month</th>
                  <th className="py-2 pr-4 text-right font-medium">Checking</th>
                  <th className="py-2 pr-4 text-right font-medium">Savings</th>
                  <th className="py-2 pr-4 text-right font-medium">Sinking</th>
                  <th className="py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {projection.map((p) => (
                  <tr key={p.month} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4 font-sans">{p.month === 0 ? "Now" : `Month ${p.month}`}</td>
                    <td className="py-2 pr-4 text-right">{formatCurrency(p.checking)}</td>
                    <td className="py-2 pr-4 text-right">{formatCurrency(p.savings)}</td>
                    <td className="py-2 pr-4 text-right">{formatCurrency(p.sinking)}</td>
                    <td className="py-2 text-right font-semibold">{formatCurrency(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
