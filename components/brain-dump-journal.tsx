"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import { CalendarDays, ChevronLeft, ChevronRight, NotebookPen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionCard, SortableSectionCard } from "@/components/section-card"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  FIXED_SECTION_IDS,
  SECTIONS,
  createId,
  emptyEntry,
  formatLongDate,
  loadSectionOrder,
  loadStore,
  saveSectionOrder,
  saveStore,
  shiftDay,
  todayKey,
  type DayEntry,
  type JournalStore,
} from "@/lib/journal"

export function BrainDumpJournal() {
  const [store, setStore] = useState<JournalStore>({})
  const [selectedDate, setSelectedDate] = useState<string>(todayKey())
  const [sectionOrder, setSectionOrder] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    // Small distance threshold so taps on inputs/buttons aren't treated as drags.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // Load once on mount. Honor a ?date=YYYY-MM-DD param from the calendar page.
  useEffect(() => {
    setStore(loadStore())
    setSectionOrder(loadSectionOrder())
    const param = new URLSearchParams(window.location.search).get("date")
    setSelectedDate(param && /^\d{4}-\d{2}-\d{2}$/.test(param) ? param : todayKey())
    setHydrated(true)
  }, [])

  // Persist whenever the store changes (after hydration).
  useEffect(() => {
    if (hydrated) saveStore(store)
  }, [store, hydrated])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setSectionOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as string)
      const newIndex = prev.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return prev
      const next = arrayMove(prev, oldIndex, newIndex)
      saveSectionOrder(next)
      return next
    })
  }, [])

  const entry: DayEntry = store[selectedDate] ?? emptyEntry(selectedDate)
  const isToday = selectedDate === todayKey()

  const mutate = useCallback(
    (updater: (draft: DayEntry) => DayEntry) => {
      setStore((prev) => {
        const current = prev[selectedDate] ?? emptyEntry(selectedDate)
        return { ...prev, [selectedDate]: updater(current) }
      })
    },
    [selectedDate],
  )

  const addItem = useCallback(
    (sectionId: string, text: string) =>
      mutate((draft) => {
        const items = draft.lists[sectionId] ?? []
        return {
          ...draft,
          lists: { ...draft.lists, [sectionId]: [...items, { id: createId(), text, done: false }] },
        }
      }),
    [mutate],
  )

  const toggleItem = useCallback(
    (sectionId: string, id: string) =>
      mutate((draft) => ({
        ...draft,
        lists: {
          ...draft.lists,
          [sectionId]: (draft.lists[sectionId] ?? []).map((i) =>
            i.id === id ? { ...i, done: !i.done } : i,
          ),
        },
      })),
    [mutate],
  )

  const editItem = useCallback(
    (sectionId: string, id: string, text: string) =>
      mutate((draft) => ({
        ...draft,
        lists: {
          ...draft.lists,
          [sectionId]: (draft.lists[sectionId] ?? []).map((i) => (i.id === id ? { ...i, text } : i)),
        },
      })),
    [mutate],
  )

  const removeItem = useCallback(
    (sectionId: string, id: string) =>
      mutate((draft) => ({
        ...draft,
        lists: {
          ...draft.lists,
          [sectionId]: (draft.lists[sectionId] ?? []).filter((i) => i.id !== id),
        },
      })),
    [mutate],
  )

  const setNotes = useCallback(
    (value: string) => mutate((draft) => ({ ...draft, notes: value })),
    [mutate],
  )

  const longDate = useMemo(() => formatLongDate(selectedDate), [selectedDate])

  const gridSections = sectionOrder
    .map((id) => SECTIONS.find((s) => s.id === id))
    .filter((s): s is (typeof SECTIONS)[number] => Boolean(s))
  const bottomSections = FIXED_SECTION_IDS.map((id) => SECTIONS.find((s) => s.id === id)).filter(
    (s): s is (typeof SECTIONS)[number] => Boolean(s),
  )

  // Avoid hydration mismatch: render shell until client store is loaded.
  if (!hydrated) {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <NotebookPen className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-serif text-2xl font-semibold leading-none text-foreground">Brain Dump</h1>
              <p className="mt-1 text-sm text-muted-foreground">Clear your head, one box at a time.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Previous day"
                onClick={() => setSelectedDate((d) => shiftDay(d, -1))}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => dateInputRef.current?.showPicker?.()}
                  className="px-2 text-center text-sm font-medium text-card-foreground"
                >
                  <span className="block leading-tight">{longDate}</span>
                  {!isToday && <span className="text-xs font-normal text-primary">Tap to pick a date</span>}
                </button>
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  max={todayKey()}
                  onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                  className="absolute inset-0 size-0 opacity-0"
                  aria-label="Pick a date"
                />
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Next day"
                disabled={isToday}
                onClick={() => setSelectedDate((d) => shiftDay(d, 1))}
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>

            {!isToday && (
              <Button variant="secondary" size="sm" onClick={() => setSelectedDate(todayKey())}>
                Today
              </Button>
            )}

            <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/history" />}>
              <CalendarDays className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Past entries</span>
            </Button>

            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        {!isToday && (
          <div className="mb-5 rounded-xl border border-accent bg-accent/40 px-4 py-3 text-sm text-accent-foreground">
            You&apos;re viewing a past entry. Changes are saved to this day automatically.
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={gridSections.map((s) => s.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gridSections.map((section) => (
                <SortableSectionCard
                  key={section.id}
                  section={section}
                  items={entry.lists[section.id] ?? []}
                  onAdd={(text) => addItem(section.id, text)}
                  onToggle={(id) => toggleItem(section.id, id)}
                  onEdit={(id, text) => editItem(section.id, id, text)}
                  onRemove={(id) => removeItem(section.id, id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {bottomSections.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            {bottomSections.map((section) => (
              <SectionCard
                key={section.id}
                section={section}
                items={entry.lists[section.id] ?? []}
                notes={entry.notes}
                onAdd={(text) => addItem(section.id, text)}
                onToggle={(id) => toggleItem(section.id, id)}
                onEdit={(id, text) => editItem(section.id, id, text)}
                onRemove={(id) => removeItem(section.id, id)}
                onNotesChange={setNotes}
              />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Everything is saved automatically on this device.
        </p>
      </div>
    </main>
  )
}
