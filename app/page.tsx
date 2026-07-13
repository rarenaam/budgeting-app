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
          
          // SUPER AGRESSIEVE FIX: Zorg dat arrays NOOIT undefined of null kunnen zijn, zelfs als 'data' leeg is.
          const safeData = {
            balance: data?.balance ?? 0,
            dailySalary: data?.dailySalary ?? 0,
            lastUpdated: data?.lastUpdated ?? new Date().toISOString(),
            transactions: Array.isArray(data?.transactions) ? data.transactions : [],
            incomes: Array.isArray(data?.incomes) ? data.incomes : [],
            fixedExpenses: Array.isArray(data?.fixedExpenses) ? data.fixedExpenses : [],
            sinkingFunds: Array.isArray(data?.sinkingFunds) ? data.sinkingFunds : []
          };
          
          // Als de database écht leeg is (geen balance en geen transacties), sturen we door naar SetupForm
          if (!data || Object.keys(data).length === 0) {
            setState(null);
          } else {
            setState(safeData);
          }
        } else {
          // Als de backend een fout geeft (bijv. document bestaat niet), toon het SetupForm
          setState(null);
        }
      } catch (err) {
        console.error("Fout bij ophalen budget:", err);
        setState(null); // Toon setup form bij fouten zodat de gebruiker kan resetten
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
