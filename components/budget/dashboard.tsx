"use client"

import { useState } from "react"
import { LayoutGrid, LineChart, PiggyBank, RefreshCw, Sparkles, Target } from "lucide-react"
import { Button } from "./primitives"
import { OverviewTab } from "./overview-tab"
import { SinkingFundsTab } from "./sinking-funds-tab"
import { ProjectTab } from "./project-tab"
import { SimulationDialog } from "./simulation-dialog"
import { type BudgetState, allocateByPriority, formatCurrency, totalCapital } from "@/lib/budget"

type TabKey = "overview" | "funds" | "project"

const TABS: { key: TabKey; label: string; icon: typeof LayoutGrid }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "funds", label: "Sinking Funds", icon: Target },
  { key: "project", label: "Project", icon: LineChart },
]

export function Dashboard({
  state,
  onChange,
  onReset,
}: {
  state: BudgetState
  onChange: (updater: (prev: BudgetState) => BudgetState) => void
  onReset: () => void
}) {
  const [tab, setTab] = useState<TabKey>("overview")
  const [simOpen, setSimOpen] = useState(false)

  const underfundedCount = allocateByPriority(state).allocations.filter((a) => !a.funded).length

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <PiggyBank className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Nestegg</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(totalCapital(state))} total capital
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setSimOpen(true)}>
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Simulate</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reset all data"
              onClick={onReset}
              title="Reset all data"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mx-auto flex max-w-6xl gap-1 px-3" aria-label="Dashboard sections">
          {TABS.map(({ key, label, icon: Icon }) => {
            const active = tab === key
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
                {key === "funds" && underfundedCount > 0 ? (
                  <span className="ml-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-white">
                    {underfundedCount}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === "overview" ? <OverviewTab state={state} onChange={onChange} /> : null}
        {tab === "funds" ? <SinkingFundsTab state={state} onChange={onChange} /> : null}
        {tab === "project" ? <ProjectTab state={state} /> : null}
      </main>

      <SimulationDialog
        open={simOpen}
        onClose={() => setSimOpen(false)}
        state={state}
        onApply={(next) => onChange(() => next)}
      />
    </div>
  )
}
