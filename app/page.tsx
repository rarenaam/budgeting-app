"use client"

import { useState, useEffect } from "react"
import { SetupForm } from "@/components/budget/setup-form"
import { Dashboard } from "@/components/budget/dashboard"
import { type BudgetState, demoState } from "@/lib/budget"

// PAS DIT AAN NAAR JOUW VERCEL URL (ZONDER slash aan het einde!)
const BACKEND_URL = "https://budget-backend-q95y47b3k-joppevanijkel-5313s-projects.vercel.app";

export default function Page() {
  const [state, setState] = useState<BudgetState | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  // 1. Haal bij het opstarten de data op uit de backend/database
  useEffect(() => {
    async function fetchBudget() {
      try {
        // Eerst even de salaris-update triggeren
        await fetch(`${BACKEND_URL}/api/budget/update`);
        
        // Daarna de actuele state ophalen
        const res = await fetch(`${BACKEND_URL}/api/budget`);
        if (res.ok) {
          const data = await res.json();
          
          // EXACTE MATCH MET JOUW BUDGETSTATE TYPE:
          const safeData: BudgetState = {
            checking: Number(data?.checking) || 0,
            savings: Number(data?.savings) || 0,
            sinkingFunds: Array.isArray(data?.sinkingFunds) ? data.sinkingFunds : [],
            income: Array.isArray(data?.income) ? data.income : (Array.isArray(data?.incomes) ? data.incomes : []),
            expenses: Array.isArray(data?.expenses) ? data.expenses : (Array.isArray(data?.fixedExpenses) ? data.fixedExpenses : [])
          };
          
          // Als de database écht leeg is, sturen we door naar SetupForm
          if (!data || Object.keys(data).length === 0 || (safeData.income.length === 0 && safeData.expenses.length === 0)) {
            setState(null);
          } else {
            setState(safeData);
          }
        } else {
          setState(null);
        }
      } catch (err) {
        console.error("Fout bij ophalen budget:", err);
        setState(null);
      } finally {
        setLoading(false);
      }
    }
    fetchBudget();
  }, []);

  // 2. Functie om wijzigingen direct op te slaan in de backend
  async function saveState(nextState: BudgetState | null) {
    setState(nextState);
    if (!nextState) return;

    try {
      await fetch(`${BACKEND_URL}/api/budget`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextState),
      });
    } catch (err) {
      console.error("Fout bij opslaan budget:", err);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Budget laden uit database...</div>
  }

  if (!state) {
    return (
      <SetupForm
        onComplete={(next) => saveState(next)}
        onUseDemo={() => saveState(structuredClone(demoState))}
      />
    )
  }

  return (
    <Dashboard
      state={state}
      onChange={(updater) => {
        const next = updater(state);
        saveState(next);
      }}
      onReset={() => saveState(null)}
    />
  )
}
