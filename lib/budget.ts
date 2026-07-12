export type CashAccount = {
  id: string
  name: string
  balance: number
}

export type SinkingFund = {
  id: string
  name: string
  /** 1 (low) - 10 (high) */
  priority: number
  monthlyGoal: number
  balance: number
}

export type LineItem = {
  id: string
  name: string
  amount: number
}

export type BudgetState = {
  checking: number
  savings: number
  sinkingFunds: SinkingFund[]
  income: LineItem[]
  expenses: LineItem[]
}

/** ---------- helpers ---------- */

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export function sum(items: { amount: number }[]): number {
  return items.reduce((total, item) => total + (Number(item.amount) || 0), 0)
}

export function sinkingBalance(funds: SinkingFund[]): number {
  return funds.reduce((total, fund) => total + (Number(fund.balance) || 0), 0)
}

export function sinkingGoalTotal(funds: SinkingFund[]): number {
  return funds.reduce((total, fund) => total + (Number(fund.monthlyGoal) || 0), 0)
}

export function totalCapital(state: BudgetState): number {
  return state.checking + state.savings + sinkingBalance(state.sinkingFunds)
}

export function totalIncome(state: BudgetState): number {
  return sum(state.income)
}

export function totalExpenses(state: BudgetState): number {
  return sum(state.expenses)
}

/** Money left after fixed expenses, before funding sinking goals. */
export function monthlyNet(state: BudgetState): number {
  return totalIncome(state) - totalExpenses(state)
}

/** Money left after expenses AND fully funding every sinking fund goal. */
export function discretionary(state: BudgetState): number {
  return monthlyNet(state) - sinkingGoalTotal(state.sinkingFunds)
}

/** True when fixed expenses + sinking goals outrun income for the month. */
export function isOverdraft(state: BudgetState): boolean {
  return totalExpenses(state) + sinkingGoalTotal(state.sinkingFunds) > totalIncome(state)
}

/** ---------- scenarios ---------- */

export type Scenario = "optimistic" | "realistic" | "worst"

export const SCENARIOS: Record<
  Scenario,
  { label: string; incomeFactor: number; expenseFactor: number; description: string }
> = {
  optimistic: {
    label: "Optimistic",
    incomeFactor: 1.1,
    expenseFactor: 0.95,
    description: "Income +10%, expenses −5%",
  },
  realistic: {
    label: "Realistic",
    incomeFactor: 1,
    expenseFactor: 1,
    description: "Your numbers as entered",
  },
  worst: {
    label: "Worst-case",
    incomeFactor: 0.8,
    expenseFactor: 1.1,
    description: "Income −20%, expenses +10%",
  },
}

/** Scenario-adjusted monthly income and expenses. */
export function scenarioFlows(state: BudgetState, scenario: Scenario) {
  const { incomeFactor, expenseFactor } = SCENARIOS[scenario]
  return {
    income: totalIncome(state) * incomeFactor,
    expenses: totalExpenses(state) * expenseFactor,
  }
}

export type FundAllocation = {
  fund: SinkingFund
  requested: number
  allocated: number
  shortfall: number
  funded: boolean
}

/**
 * Distributes available cash to sinking funds in priority order (highest first).
 * When cash runs short, lower-priority funds are left underfunded.
 */
export function allocateByPriority(state: BudgetState): {
  available: number
  allocations: FundAllocation[]
  fullyFunded: boolean
} {
  const available = Math.max(0, monthlyNet(state))
  let remaining = available

  const ordered = [...state.sinkingFunds].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority
    return b.monthlyGoal - a.monthlyGoal
  })

  const allocations: FundAllocation[] = ordered.map((fund) => {
    const requested = Number(fund.monthlyGoal) || 0
    const allocated = Math.min(requested, Math.max(0, remaining))
    remaining -= allocated
    return {
      fund,
      requested,
      allocated,
      shortfall: requested - allocated,
      funded: allocated >= requested - 0.001,
    }
  })

  return {
    available,
    allocations,
    fullyFunded: allocations.every((a) => a.funded),
  }
}

export type ProjectionPoint = {
  month: number
  label: string
  checking: number
  savings: number
  sinking: number
  total: number
}

/**
 * Projects capital across `months` months. Each month:
 *  - income lands, expenses leave (net flows into checking)
 *  - sinking goals are funded by priority from available cash and move into sinking balances
 */
export function projectCapital(
  state: BudgetState,
  months = 12,
  scenario: Scenario = "realistic",
): ProjectionPoint[] {
  const points: ProjectionPoint[] = []
  let checking = state.checking
  let savings = state.savings
  const fundBalances = new Map(state.sinkingFunds.map((f) => [f.id, f.balance]))

  const { income, expenses } = scenarioFlows(state, scenario)

  points.push({
    month: 0,
    label: "Now",
    checking,
    savings,
    sinking: sinkingBalance(state.sinkingFunds),
    total: totalCapital(state),
  })

  for (let month = 1; month <= months; month++) {
    let net = income - expenses
    checking += net

    // fund sinking goals by priority from whatever is available this month
    let available = Math.max(0, net)
    const ordered = [...state.sinkingFunds].sort((a, b) => b.priority - a.priority)
    for (const fund of ordered) {
      const goal = Number(fund.monthlyGoal) || 0
      const move = Math.min(goal, available)
      available -= move
      checking -= move
      fundBalances.set(fund.id, (fundBalances.get(fund.id) || 0) + move)
    }

    const sinking = Array.from(fundBalances.values()).reduce((t, v) => t + v, 0)
    points.push({
      month,
      label: `M${month}`,
      checking,
      savings,
      sinking,
      total: checking + savings + sinking,
    })
  }

  return points
}

export const demoState: BudgetState = {
  checking: 4200,
  savings: 12500,
  sinkingFunds: [
    { id: uid("sf"), name: "Car Maintenance", priority: 8, monthlyGoal: 150, balance: 600 },
    { id: uid("sf"), name: "Holiday Gifts", priority: 5, monthlyGoal: 100, balance: 250 },
    { id: uid("sf"), name: "Vacation", priority: 6, monthlyGoal: 300, balance: 1200 },
    { id: uid("sf"), name: "Emergency Buffer", priority: 10, monthlyGoal: 250, balance: 3000 },
  ],
  income: [
    { id: uid("inc"), name: "Salary", amount: 4800 },
    { id: uid("inc"), name: "Freelance", amount: 600 },
  ],
  expenses: [
    { id: uid("exp"), name: "Rent", amount: 1800 },
    { id: uid("exp"), name: "Groceries", amount: 550 },
    { id: uid("exp"), name: "Utilities", amount: 220 },
    { id: uid("exp"), name: "Subscriptions", amount: 90 },
    { id: uid("exp"), name: "Transport", amount: 180 },
  ],
}

export const emptyState: BudgetState = {
  checking: 0,
  savings: 0,
  sinkingFunds: [],
  income: [],
  expenses: [],
}
