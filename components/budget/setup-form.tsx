"use client"

import { useState } from "react"
import { Landmark, PiggyBank, Plus, Sparkles, Target, Trash2, Wallet } from "lucide-react"
import { Badge, Button, Card, TextField } from "./primitives"
import { type BudgetState, type SinkingFund, formatCurrency, uid } from "@/lib/budget"

type DraftFund = { id: string; name: string; priority: string; monthlyGoal: string; balance: string }

export function SetupForm({
  onComplete,
  onUseDemo,
}: {
  onComplete: (state: BudgetState) => void
  onUseDemo: () => void
}) {
  const [checking, setChecking] = useState("")
  const [savings, setSavings] = useState("")
  const [funds, setFunds] = useState<DraftFund[]>([
    { id: uid("d"), name: "Emergency Buffer", priority: "10", monthlyGoal: "250", balance: "1000" },
  ])

  function addFund() {
    setFunds((prev) => [
      ...prev,
      { id: uid("d"), name: "", priority: "5", monthlyGoal: "", balance: "" },
    ])
  }

  function updateFund(id: string, patch: Partial<DraftFund>) {
    setFunds((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)))
  }

  function removeFund(id: string) {
    setFunds((prev) => prev.filter((f) => f.id !== id))
  }

  const previewTotal =
    (Number(checking) || 0) +
    (Number(savings) || 0) +
    funds.reduce((t, f) => t + (Number(f.balance) || 0), 0)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const sinkingFunds: SinkingFund[] = funds
      .filter((f) => f.name.trim())
      .map((f) => ({
        id: uid("sf"),
        name: f.name.trim(),
        priority: Math.min(10, Math.max(1, Number(f.priority) || 1)),
        monthlyGoal: Number(f.monthlyGoal) || 0,
        balance: Number(f.balance) || 0,
      }))

    onComplete({
      checking: Number(checking) || 0,
      savings: Number(savings) || 0,
      sinkingFunds,
      income: [],
      expenses: [],
    })
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <PiggyBank className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="text-balance text-3xl font-semibold tracking-tight">Welcome to Nestegg</h1>
        <p className="mx-auto mt-2 max-w-md text-pretty leading-relaxed text-muted-foreground">
          Let&apos;s set up your accounts. Enter your current balances and any sinking funds you
          already track. You can add income and expenses next.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
            Bank accounts
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Checking balance"
              name="checking"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              prefix="$"
              placeholder="0.00"
              value={checking}
              onChange={(e) => setChecking(e.target.value)}
            />
            <TextField
              label="Savings balance"
              name="savings"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              prefix="$"
              placeholder="0.00"
              value={savings}
              onChange={(e) => setSavings(e.target.value)}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Target className="h-5 w-5 text-primary" aria-hidden="true" />
              Sinking funds
            </h2>
            <Button type="button" variant="secondary" size="sm" onClick={addFund}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add fund
            </Button>
          </div>

          {funds.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No sinking funds yet. Add one for goals like car maintenance or holidays.
            </p>
          ) : (
            <ul className="space-y-3">
              {funds.map((fund) => (
                <li
                  key={fund.id}
                  className="grid grid-cols-2 gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1.4fr_0.8fr_0.9fr_0.9fr_auto]"
                >
                  <TextField
                    aria-label="Fund name"
                    placeholder="e.g. Car Maintenance"
                    value={fund.name}
                    onChange={(e) => updateFund(fund.id, { name: e.target.value })}
                    className="col-span-2 sm:col-span-1"
                  />
                  <TextField
                    aria-label="Priority 1 to 10"
                    type="number"
                    min="1"
                    max="10"
                    placeholder="Priority"
                    value={fund.priority}
                    onChange={(e) => updateFund(fund.id, { priority: e.target.value })}
                  />
                  <TextField
                    aria-label="Monthly goal"
                    type="number"
                    min="0"
                    prefix="$"
                    placeholder="Goal"
                    value={fund.monthlyGoal}
                    onChange={(e) => updateFund(fund.id, { monthlyGoal: e.target.value })}
                  />
                  <TextField
                    aria-label="Current balance"
                    type="number"
                    min="0"
                    prefix="$"
                    placeholder="Saved"
                    value={fund.balance}
                    onChange={(e) => updateFund(fund.id, { balance: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${fund.name || "fund"}`}
                    onClick={() => removeFund(fund.id)}
                    className="justify-self-end text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="flex flex-col-reverse items-center justify-between gap-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onUseDemo}
            className="w-full sm:w-auto"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Load demo data
          </Button>

          <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Starting capital</p>
              <p className="flex items-center gap-1.5 font-mono text-lg font-semibold">
                <Landmark className="h-4 w-4 text-primary" aria-hidden="true" />
                {formatCurrency(previewTotal)}
              </p>
            </div>
            <Button type="submit">Continue</Button>
          </div>
        </div>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Prototype only — all data lives in your browser session.{" "}
        <Badge tone="good">No account needed</Badge>
      </p>
    </main>
  )
}
