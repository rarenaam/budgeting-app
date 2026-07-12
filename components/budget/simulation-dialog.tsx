"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRight, Check, RotateCcw, Sparkles, X } from "lucide-react"
import { Badge, Button, Card } from "./primitives"
import {
  type BudgetState,
  allocateByPriority,
  formatCurrency,
  monthlyNet,
  projectCapital,
  totalCapital,
} from "@/lib/budget"

type Adjustments = {
  incomePct: number // -50 .. +50
  expensePct: number // -50 .. +50
  transfer: number // + = checking->savings, - = savings->checking
  priorities: Record<string, number>
}

function applyAdjustments(base: BudgetState, adj: Adjustments): BudgetState {
  // adj.transfer > 0 moves checking -> savings; negative moves savings -> checking.
  // Clamp so neither account can go negative.
  const move = Math.max(-base.savings, Math.min(base.checking, adj.transfer))
  return {
    ...base,
    checking: base.checking - move,
    savings: base.savings + move,
    income: base.income.map((i) => ({ ...i, amount: i.amount * (1 + adj.incomePct / 100) })),
    expenses: base.expenses.map((e) => ({ ...e, amount: e.amount * (1 + adj.expensePct / 100) })),
    sinkingFunds: base.sinkingFunds.map((f) => ({
      ...f,
      priority: adj.priorities[f.id] ?? f.priority,
    })),
  }
}

function Stat({ label, base, sim }: { label: string; base: number; sim: number }) {
  const diff = sim - base
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold">{formatCurrency(sim)}</p>
      <p
        className={`text-xs font-medium ${
          diff > 0 ? "text-primary" : diff < 0 ? "text-destructive" : "text-muted-foreground"
        }`}
      >
        {diff === 0 ? "no change" : `${diff > 0 ? "+" : ""}${formatCurrency(diff)} vs current`}
      </p>
    </div>
  )
}

export function SimulationDialog({
  open,
  onClose,
  state,
  onApply,
}: {
  open: boolean
  onClose: () => void
  state: BudgetState
  onApply: (next: BudgetState) => void
}) {
  const initial: Adjustments = useMemo(
    () => ({
      incomePct: 0,
      expensePct: 0,
      transfer: 0,
      priorities: Object.fromEntries(state.sinkingFunds.map((f) => [f.id, f.priority])),
    }),
    [state],
  )
  const [adj, setAdj] = useState<Adjustments>(initial)

  useEffect(() => {
    if (open) setAdj(initial)
  }, [open, initial])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const simulated = useMemo(() => applyAdjustments(state, adj), [state, adj])

  const baseNet = monthlyNet(state)
  const simNet = monthlyNet(simulated)
  const baseEnd = projectCapital(state, 12).at(-1)?.total ?? 0
  const simEnd = projectCapital(simulated, 12).at(-1)?.total ?? 0
  const simUnderfunded = allocateByPriority(simulated).allocations.filter((a) => !a.funded)

  if (!open) return null

  const transferMax = Math.max(state.checking, state.savings)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Budget simulation"
      onClick={onClose}
    >
      <Card
        className="flex max-h-[92svh] w-full max-w-2xl flex-col overflow-hidden rounded-b-none sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden="true" />
              What-if simulation
            </h2>
            <p className="text-sm text-muted-foreground">
              Test changes without touching your real numbers.
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Close simulation" onClick={onClose}>
            <X className="h-5 w-5" aria-hidden="true" />
          </Button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Stat label="Total capital" base={totalCapital(state)} sim={totalCapital(simulated)} />
            <Stat label="Monthly cash flow" base={baseNet} sim={simNet} />
            <Stat label="Capital in 12 mo" base={baseEnd} sim={simEnd} />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-secondary p-3 text-sm">
            <span className="font-medium">Underfunded sinking funds</span>
            <Badge tone={simUnderfunded.length ? "bad" : "good"}>
              {simUnderfunded.length} {simUnderfunded.length === 1 ? "fund" : "funds"}
            </Badge>
          </div>

          {/* Income / expense sliders */}
          <div className="space-y-4">
            <SliderRow
              label="Adjust income"
              value={adj.incomePct}
              onChange={(v) => setAdj((p) => ({ ...p, incomePct: v }))}
              suffix="%"
            />
            <SliderRow
              label="Adjust expenses"
              value={adj.expensePct}
              onChange={(v) => setAdj((p) => ({ ...p, expensePct: v }))}
              suffix="%"
            />
          </div>

          {/* Transfer between accounts */}
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium">Move funds</span>
              <span className="flex items-center gap-1.5 font-mono text-muted-foreground">
                Checking
                <ArrowRight
                  className={`h-4 w-4 ${adj.transfer < 0 ? "rotate-180" : ""} ${
                    adj.transfer === 0 ? "opacity-30" : "text-primary"
                  }`}
                  aria-hidden="true"
                />
                Savings
              </span>
            </div>
            <input
              aria-label="Move funds between checking and savings"
              type="range"
              min={-Math.round(transferMax)}
              max={Math.round(transferMax)}
              step="50"
              value={adj.transfer}
              onChange={(e) => setAdj((p) => ({ ...p, transfer: Number(e.target.value) }))}
              className="h-8 w-full accent-[var(--primary)]"
            />
            <p className="text-center text-xs text-muted-foreground">
              {adj.transfer === 0
                ? "No transfer"
                : `Move ${formatCurrency(Math.abs(adj.transfer))} ${
                    adj.transfer > 0 ? "to savings" : "to checking"
                  }`}
            </p>
          </div>

          {/* Priority tweaks */}
          {state.sinkingFunds.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Reprioritize sinking funds</p>
              {state.sinkingFunds.map((f) => (
                <div key={f.id} className="flex items-center gap-3">
                  <span className="w-32 shrink-0 truncate text-sm">{f.name}</span>
                  <input
                    aria-label={`Priority for ${f.name}`}
                    type="range"
                    min="1"
                    max="10"
                    value={adj.priorities[f.id] ?? f.priority}
                    onChange={(e) =>
                      setAdj((p) => ({
                        ...p,
                        priorities: { ...p.priorities, [f.id]: Number(e.target.value) },
                      }))
                    }
                    className="h-8 flex-1 accent-[var(--primary)]"
                  />
                  <Badge tone="neutral" className="w-9 justify-center">
                    {adj.priorities[f.id] ?? f.priority}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border p-5">
          <Button variant="ghost" onClick={() => setAdj(initial)}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Discard
            </Button>
            <Button
              onClick={() => {
                onApply(simulated)
                onClose()
              }}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Apply changes
            </Button>
          </div>
        </footer>
      </Card>
    </div>
  )
}

function SliderRow({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  suffix?: string
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span
          className={`font-mono ${
            value > 0 ? "text-primary" : value < 0 ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {value > 0 ? "+" : ""}
          {value}
          {suffix}
        </span>
      </div>
      <input
        aria-label={label}
        type="range"
        min="-50"
        max="50"
        step="1"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-full accent-[var(--primary)]"
      />
    </div>
  )
}
