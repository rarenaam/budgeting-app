"use client"

import { useState } from "react"
import { SetupForm } from "@/components/budget/setup-form"
import { Dashboard } from "@/components/budget/dashboard"
import { type BudgetState, demoState } from "@/lib/budget"

export default function Page() {
  const [state, setState] = useState<BudgetState | null>(null)

  if (!state) {
    return (
      <SetupForm
        onComplete={(next) => setState(next)}
        onUseDemo={() => setState(structuredClone(demoState))}
      />
    )
  }

  return (
    <Dashboard
      state={state}
      onChange={(updater) => setState((prev) => (prev ? updater(prev) : prev))}
      onReset={() => setState(null)}
    />
  )
}
