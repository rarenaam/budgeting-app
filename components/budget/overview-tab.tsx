"use client"

import {
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { Badge, Card, TextField } from "./primitives"
import { LineItemEditor } from "./line-item-editor"
import {
  type BudgetState,
  type LineItem,
  formatCurrency,
  monthlyNet,
  sinkingBalance,
  sinkingGoalTotal,
  totalCapital,
  totalExpenses,
  totalIncome,
} from "@/lib/budget"

function StatCard({
  label,
  value,
  icon,
  hint,
  tone = "default",
}: {
  label: string
  value: string
  icon: React.ReactNode
  hint?: React.ReactNode
  tone?: "default" | "primary" | "bad"
}) {
  const toneClass =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "bad"
        ? "bg-destructive text-white"
        : "bg-card text-card-foreground"
  const iconWrap =
    tone === "default"
      ? "bg-secondary text-primary"
      : "bg-white/15 text-current"
  return (
    <Card className={`p-5 ${toneClass}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium opacity-80">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconWrap}`}>
          {icon}
        </span>
      </div>
      <p className="mt-3 font-mono text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
      {hint ? <div className="mt-1 text-sm opacity-80">{hint}</div> : null}
    </Card>
  )
}

export function OverviewTab({
  state,
  onChange,
}: {
  state: BudgetState
  onChange: (updater: (prev: BudgetState) => BudgetState) => void
}) {
  const capital = totalCapital(state)
  const income = totalIncome(state)
  const expenses = totalExpenses(state)
  const net = monthlyNet(state)
  const goals = sinkingGoalTotal(state.sinkingFunds)
  const afterGoals = net - goals
  const deficit = net < 0

  const accounts = [
    { key: "checking", label: "Checking", value: state.checking, icon: Wallet },
    { key: "savings", label: "Savings", value: state.savings, icon: PiggyBank },
    { key: "sinking", label: "Sinking funds", value: sinkingBalance(state.sinkingFunds), icon: Target },
  ]

  function setIncome(items: LineItem[]) {
    onChange((prev) => ({ ...prev, income: items }))
  }
  function setExpenses(items: LineItem[]) {
    onChange((prev) => ({ ...prev, expenses: items }))
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Total capital"
          value={formatCurrency(capital)}
          icon={<Landmark className="h-5 w-5" aria-hidden="true" />}
          tone="primary"
          hint="Across all accounts"
        />
        <StatCard
          label="Monthly cash flow"
          value={formatCurrency(net)}
          icon={
            net >= 0 ? (
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-5 w-5" aria-hidden="true" />
            )
          }
          tone={deficit ? "bad" : "default"}
          hint={
            <span className="inline-flex items-center gap-1">
              {formatCurrency(income)} in
              <span aria-hidden="true">·</span>
              {formatCurrency(expenses)} out
            </span>
          }
        />
        <StatCard
          label="After sinking goals"
          value={formatCurrency(afterGoals)}
          icon={
            afterGoals >= 0 ? (
              <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="h-5 w-5" aria-hidden="true" />
            )
          }
          hint={`${formatCurrency(goals)} of goals / month`}
        />
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Account balances</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <TextField
            label="Checking"
            type="number"
            min="0"
            prefix="$"
            value={state.checking}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, checking: Number(e.target.value) || 0 }))
            }
          />
          <TextField
            label="Savings"
            type="number"
            min="0"
            prefix="$"
            value={state.savings}
            onChange={(e) =>
              onChange((prev) => ({ ...prev, savings: Number(e.target.value) || 0 }))
            }
          />
          <div>
            <p className="mb-1.5 block text-sm font-medium">Sinking funds</p>
            <div className="flex h-11 items-center rounded-xl border border-dashed border-border px-3 font-mono text-sm text-muted-foreground">
              {formatCurrency(sinkingBalance(state.sinkingFunds))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" aria-hidden="true" />
              Monthly income
            </h2>
            <Badge tone="good">{formatCurrency(income)}</Badge>
          </div>
          <LineItemEditor
            items={state.income}
            onChange={setIncome}
            addLabel="Add income source"
            namePlaceholder="Income source"
            accent="income"
          />
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <TrendingDown className="h-5 w-5 text-chart-4" aria-hidden="true" />
              Recurring expenses
            </h2>
            <Badge tone="bad">{formatCurrency(expenses)}</Badge>
          </div>
          <LineItemEditor
            items={state.expenses}
            onChange={setExpenses}
            addLabel="Add recurring expense"
            namePlaceholder="Expense name"
            accent="expense"
          />
        </Card>
      </div>
    </div>
  )
}
