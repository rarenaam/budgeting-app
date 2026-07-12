"use client"

import type React from "react"
import { useEffect } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={cn(
          "max-h-[92svh] w-full overflow-y-auto rounded-t-2xl border border-border bg-card text-card-foreground shadow-xl sm:max-w-lg sm:rounded-2xl",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="icon" aria-label="Close dialog" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[]
  value: T
  onChange: (value: T) => void
  ariaLabel?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex w-full items-center gap-1 rounded-xl border border-border bg-secondary p-1 sm:w-auto"
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition sm:flex-none",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  )
}

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-foreground", className)}
      {...props}
    />
  )
}

type FieldProps = {
  label?: string
  prefix?: string
  className?: string
} & React.InputHTMLAttributes<HTMLInputElement>

export function TextField({ label, prefix, className, id, ...props }: FieldProps) {
  const inputId = id || props.name
  return (
    <div className={className}>
      {label ? <Label htmlFor={inputId}>{label}</Label> : null}
      <div className="relative flex items-center">
        {prefix ? (
          <span className="pointer-events-none absolute left-3 text-sm text-muted-foreground">
            {prefix}
          </span>
        ) : null}
        <input
          id={inputId}
          className={cn(
            "h-11 w-full rounded-xl border border-input bg-background text-sm text-foreground outline-none transition",
            "placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30",
            prefix ? "pl-7 pr-3" : "px-3",
          )}
          {...props}
        />
      </div>
    </div>
  )
}

type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "destructive"
  size?: "sm" | "md" | "icon"
} & React.ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
    ghost: "bg-transparent text-foreground hover:bg-secondary",
    outline: "border border-border bg-background text-foreground hover:bg-secondary",
    destructive: "bg-destructive text-white hover:opacity-90",
  }
  const sizes: Record<string, string> = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    icon: "h-9 w-9",
  }
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "neutral" | "good" | "warn" | "bad" }) {
  const tones: Record<string, string> = {
    neutral: "bg-secondary text-secondary-foreground",
    good: "bg-primary/12 text-primary",
    warn: "bg-chart-2/20 text-[oklch(0.45_0.12_75)]",
    bad: "bg-destructive/12 text-destructive",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
