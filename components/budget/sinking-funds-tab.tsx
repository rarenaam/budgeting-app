"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Flag, Plus, Target, Trash2 } from "lucide-react"
import { Badge, Button, Card, TextField } from "./primitives"
import {
  type BudgetState,
  type SinkingFund,
  allocateByPriority,
  formatCurrency,
  monthlyNet,
  sinkingGoalTotal,
  uid,
} from "@/lib/budget"

function priorityTone(priority: number): "good" | "warn" | "bad" {
  if (priority >= 8) return "bad"
  if (priority >= 5) return "warn"
  return "good"
}

export function SinkingFundsTab({
  state,
  onChange,
}: {
  state: BudgetState
  onChange: (updater: (prev: BudgetState) => BudgetState) => void
}) {
  const [name, setName] = useState("")
  const [priority, setPriority] = useState("5")
  const [goal, setGoal] = useState("")
  const [balance, setBalance] = useState("")

  const { available, allocations, fullyFunded } = allocateByPriority(state)
  const goals = sinkingGoalTotal(state.sinkingFunds)
  const net = monthlyNet(state)
  const underfunded = allocations.filter((a) => !a.funded)

  function addFund() {
    if (!name.trim()) return
    const fund: SinkingFund = {
      id: uid("sf"),
      name: name.trim(),
      priority: Math.min(10, Math.max(1, Number(priority) || 1)),
      monthlyGoal: Number(goal) || 0,
      balance: Number(balance) || 0,
    }
    onChange((prev) => ({ ...prev, sinkingFunds: [...prev.sinkingFunds, fund] }))
    setName("")
    setPriority("5")
    setGoal("")
    setBalance("")
  }

  function updateFund(id: string, patch: Partial<SinkingFund>) {
    onChange((prev) => ({
      ...prev,
      sinkingFunds: prev.sinkingFunds.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }))
  }

  function removeFund(id: string) {
    onChange((prev) => ({
      ...prev,
      sinkingFunds: prev.sinkingFunds.filter((f) => f.id !== id),
    }))
  }

  const allocationById = new Map(allocations.map((a) => [a.fund.id, a]))
  const sorted = [...state.sinkingFunds].sort((a, b) => b.priority - a.priority)

  return (
    <div className="space-y-6">
      {/* Priority funding summary */}
      <Card className={`p-6 ${net < goals ? "border-destructive/40" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Flag className="h-5 w-5 text-primary" aria-hidden="true" />
              Priority funding
            </h2>
            <p className="mt-1 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
              Each month {formatCurrency(available)} is available for sinking funds. Goals total{" "}
              {formatCurrency(goals)}. Cash is allocated highest priority first.
            </p>
          </div>
          {fullyFunded ? (
            <Badge tone="good">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              All funded
            </Badge>
          ) : (
            <Badge tone="bad">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              {underfunded.length} underfunded
            </Badge>
          )}
        </div>

        {net < goals ? (
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-destructive/10 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p className="leading-relaxed">
              Your goals exceed available cash by{" "}
              <span className="font-semibold">{formatCurrency(goals - Math.max(0, net))}</span>/month.
              Lower-priority funds below will fall short. Consider raising income, trimming expenses,
              or lowering some priorities.
            </p>
          </div>
        ) : null}

        <ul className="mt-4 space-y-2">
          {allocations.map((a) => {
            const pct = a.requested > 0 ? Math.round((a.allocated / a.requested) * 100) : 100
            return (
              <li key={a.fund.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2 font-medium">
                    <Badge tone={priorityTone(a.fund.priority)}>P{a.fund.priority}</Badge>
                    {a.fund.name}
                  </span>
                  <span className="font-mono text-muted-foreground">
                    {formatCurrency(a.allocated)} / {formatCurrency(a.requested)}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full ${a.funded ? "bg-primary" : "bg-destructive"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {!a.funded ? (
                  <p className="mt-1.5 text-xs text-destructive">
                    Short {formatCurrency(a.shortfall)}/month
                  </p>
                ) : null}
              </li>
            )
          })}
          {allocations.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              Add a sinking fund to see priority allocation.
            </li>
          ) : null}
        </ul>
      </Card>

      {/* Manage funds */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
          <Target className="h-5 w-5 text-primary" aria-hidden="true" />
          Manage sinking funds
        </h2>

        <ul className="space-y-3">
          {sorted.map((fund) => {
            const alloc = allocationById.get(fund.id)
            return (
              <li
                key={fund.id}
                className="grid grid-cols-2 items-end gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1.6fr_0.9fr_1fr_1fr_auto]"
              >
                <TextField
                  label="Name"
                  value={fund.name}
                  onChange={(e) => updateFund(fund.id, { name: e.target.value })}
                  className="col-span-2 sm:col-span-1"
                />
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-sm font-medium">
                    <span>Priority</span>
                    <span className="font-mono text-primary">{fund.priority}</span>
                  </label>
                  <input
                    aria-label={`Priority for ${fund.name}`}
                    type="range"
                    min="1"
                    max="10"
                    value={fund.priority}
                    onChange={(e) => updateFund(fund.id, { priority: Number(e.target.value) })}
                    className="h-11 w-full accent-[var(--primary)]"
                  />
                </div>
                <TextField
                  label="Monthly goal"
                  type="number"
                  min="0"
                  prefix="$"
                  value={fund.monthlyGoal}
                  onChange={(e) => updateFund(fund.id, { monthlyGoal: Number(e.target.value) || 0 })}
                />
                <TextField
                  label="Saved"
                  type="number"
                  min="0"
                  prefix="$"
                  value={fund.balance}
                  onChange={(e) => updateFund(fund.id, { balance: Number(e.target.value) || 0 })}
                />
                <div className="flex items-center justify-end gap-2">
                  {alloc && !alloc.funded ? (
                    <Badge tone="bad" aria-label="underfunded">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                    </Badge>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${fund.name}`}
                    onClick={() => removeFund(fund.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>

        {/* Add new fund */}
        <div className="mt-4 grid grid-cols-2 items-end gap-3 rounded-xl border border-dashed border-border p-3 sm:grid-cols-[1.6fr_0.9fr_1fr_1fr_auto]">
          <TextField
            label="New fund"
            placeholder="e.g. Birthdays"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-2 sm:col-span-1"
          />
          <TextField
            label="Priority"
            type="number"
            min="1"
            max="10"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
          <TextField
            label="Monthly goal"
            type="number"
            min="0"
            prefix="$"
            placeholder="0"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
          <TextField
            label="Saved"
            type="number"
            min="0"
            prefix="$"
            placeholder="0"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
          />
          <Button onClick={addFund} aria-label="Add sinking fund" className="h-11">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add
          </Button>
        </div>
      </Card>
    </div>
  )
}
