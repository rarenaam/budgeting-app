"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button, TextField } from "./primitives"
import { type LineItem, formatCurrency, uid } from "@/lib/budget"

export function LineItemEditor({
  items,
  onChange,
  addLabel,
  namePlaceholder,
  accent,
}: {
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  addLabel: string
  namePlaceholder: string
  accent: "income" | "expense"
}) {
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")

  function add() {
    if (!name.trim() || !(Number(amount) > 0)) return
    onChange([...items, { id: uid("li"), name: name.trim(), amount: Number(amount) }])
    setName("")
    setAmount("")
  }

  function update(id: string, patch: Partial<LineItem>) {
    onChange(items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  function remove(id: string) {
    onChange(items.filter((item) => item.id !== id))
  }

  const dotColor = accent === "income" ? "bg-primary" : "bg-chart-4"

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-3 text-center text-sm text-muted-foreground">
          Nothing added yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"
            >
              <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} aria-hidden="true" />
              <input
                aria-label="Name"
                value={item.name}
                onChange={(e) => update(item.id, { name: e.target.value })}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span>$</span>
                <input
                  aria-label="Amount"
                  type="number"
                  min="0"
                  value={item.amount}
                  onChange={(e) => update(item.id, { amount: Number(e.target.value) || 0 })}
                  className="w-20 bg-transparent text-right font-mono text-foreground outline-none"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Remove ${item.name}`}
                onClick={() => remove(item.id)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <TextField
          aria-label={namePlaceholder}
          placeholder={namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) add()
          }}
          className="flex-1"
        />
        <TextField
          aria-label="Amount"
          type="number"
          min="0"
          prefix="$"
          placeholder="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) add()
          }}
          className="w-28"
        />
        <Button type="button" size="icon" onClick={add} aria-label={addLabel} className="h-11 w-11">
          <Plus className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>

      <p className="text-right text-xs text-muted-foreground">
        Subtotal:{" "}
        <span className="font-mono font-semibold text-foreground">
          {formatCurrency(items.reduce((t, i) => t + (Number(i.amount) || 0), 0))}
        </span>
      </p>
    </div>
  )
}
