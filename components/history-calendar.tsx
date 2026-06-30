"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, NotebookPen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  countOpenItems,
  entryHasContent,
  toDateKey,
  todayKey,
  type JournalStore,
} from "@/lib/journal"

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

export function HistoryCalendar() {
  const router = useRouter()
  const [store, setStore] = useState<JournalStore>({})
  const [hydrated, setHydrated] = useState(false)
  const today = new Date()
  const [month, setMonth] = useState(() => ({ year: today.getFullYear(), month: today.getMonth() }))
  const [pickerOpen, setPickerOpen] = useState(false)
  // Year currently shown inside the picker panel (independent from the calendar until a month is chosen).
  const [pickerYear, setPickerYear] = useState(month.year)

  useEffect(() => {
    // Lazy import to keep this client-only.
    import("@/lib/journal").then(({ loadStore }) => {
      setStore(loadStore())
      setHydrated(true)
    })
  }, [])

  const todayStr = todayKey()

  const cells = useMemo(() => {
    const first = new Date(month.year, month.month, 1)
    const startWeekday = first.getDay()
    const daysInMonth = new Date(month.year, month.month + 1, 0).getDate()
    const list: (number | null)[] = []
    for (let i = 0; i < startWeekday; i++) list.push(null)
    for (let d = 1; d <= daysInMonth; d++) list.push(d)
    return list
  }, [month])

  const entryCount = useMemo(
    () => Object.keys(store).filter((k) => entryHasContent(store[k])).length,
    [store],
  )

  function go(delta: number) {
    setMonth((m) => {
      const next = new Date(m.year, m.month + delta, 1)
      return { year: next.getFullYear(), month: next.getMonth() }
    })
  }

  function togglePicker() {
    setPickerOpen((o) => {
      if (!o) setPickerYear(month.year)
      return !o
    })
  }

  function selectMonth(m: number) {
    setMonth({ year: pickerYear, month: m })
    setPickerOpen(false)
  }

  const isCurrentMonthAhead = pickerYear > today.getFullYear()

  function openDay(day: number) {
    const key = toDateKey(new Date(month.year, month.month, day))
    if (key > todayStr) return
    router.push(`/?date=${key}`)
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/" />}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <NotebookPen className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-serif text-2xl font-semibold leading-none text-foreground">Past entries</h1>
              <p className="mt-1 text-sm text-muted-foreground">Pick a day to revisit it.</p>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="relative mb-4 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={togglePicker}
              aria-expanded={pickerOpen}
              aria-label="Choose month and year"
              className="-ml-2 gap-1.5 font-serif text-xl font-medium text-card-foreground hover:bg-secondary"
            >
              {MONTHS[month.month]} {month.year}
              <ChevronDown
                className={cn("size-4 text-muted-foreground transition-transform", pickerOpen && "rotate-180")}
                aria-hidden="true"
              />
            </Button>
            <div className="flex items-center gap-1 rounded-xl border border-border p-1">
              <Button variant="ghost" size="icon" className="size-8" aria-label="Previous month" onClick={() => go(-1)}>
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Next month" onClick={() => go(1)}>
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>

            {pickerOpen && (
              <button
                type="button"
                aria-hidden="true"
                tabIndex={-1}
                className="fixed inset-0 z-10 cursor-default"
                onClick={() => setPickerOpen(false)}
              />
            )}
            {pickerOpen && (
              <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-xl border border-border bg-popover p-3 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Previous year"
                    onClick={() => setPickerYear((y) => y - 1)}
                  >
                    <ChevronLeft className="size-4" aria-hidden="true" />
                  </Button>
                  <span className="font-serif text-lg font-medium text-popover-foreground">{pickerYear}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    aria-label="Next year"
                    disabled={isCurrentMonthAhead}
                    onClick={() => setPickerYear((y) => y + 1)}
                  >
                    <ChevronRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {MONTHS.map((name, m) => {
                    const isFuture =
                      pickerYear > today.getFullYear() ||
                      (pickerYear === today.getFullYear() && m > today.getMonth())
                    const isSelected = pickerYear === month.year && m === month.month
                    return (
                      <button
                        key={name}
                        type="button"
                        disabled={isFuture}
                        onClick={() => selectMonth(m)}
                        className={cn(
                          "rounded-lg py-2 text-sm transition-colors",
                          isFuture && "cursor-not-allowed text-muted-foreground/40",
                          !isFuture && !isSelected && "text-popover-foreground hover:bg-secondary",
                          isSelected && "bg-primary font-medium text-primary-foreground",
                        )}
                      >
                        {name.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {WEEKDAYS.map((w) => (
              <div key={w} className="py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {w}
              </div>
            ))}

            {cells.map((day, i) => {
              if (day === null) return <div key={`blank-${i}`} aria-hidden="true" />
              const key = toDateKey(new Date(month.year, month.month, day))
              const isToday = key === todayStr
              const isFuture = key > todayStr
              const entry = store[key]
              const has = hydrated && entryHasContent(entry)
              const open = has ? countOpenItems(entry) : 0
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isFuture}
                  onClick={() => openDay(day)}
                  aria-label={`Open ${MONTHS[month.month]} ${day}, ${month.year}${has ? " (has entries)" : ""}`}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition-colors",
                    isFuture && "cursor-not-allowed text-muted-foreground/40",
                    !isFuture && has && "bg-accent/50 font-medium text-accent-foreground hover:bg-accent",
                    !isFuture && !has && "text-card-foreground hover:bg-secondary",
                    isToday && "ring-2 ring-primary ring-offset-1 ring-offset-card",
                  )}
                >
                  <span>{day}</span>
                  {open > 0 && (
                    <span className="absolute bottom-1 size-1.5 rounded-full bg-primary" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {hydrated
            ? entryCount > 0
              ? `${entryCount} day${entryCount === 1 ? "" : "s"} with saved entries. Highlighted days have notes; a dot means open items.`
              : "No saved entries yet — start journaling and your days will appear here."
            : "Loading your entries…"}
        </p>
      </div>
    </main>
  )
}
