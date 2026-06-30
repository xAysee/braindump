"use client"

import { useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type Ref } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Check, GripVertical, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { JournalItem, SectionDef } from "@/lib/journal"

type DragHandleProps = {
  ref?: Ref<HTMLButtonElement>
  attributes?: HTMLAttributes<HTMLButtonElement>
  listeners?: Record<string, unknown>
}

function DragHandle({ ref, attributes, listeners }: DragHandleProps) {
  if (!listeners) return null
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Drag to reorder"
      className="-ml-1 shrink-0 cursor-grab touch-none rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  )
}

function isComposing(e: KeyboardEvent) {
  return e.nativeEvent.isComposing || (e as unknown as { keyCode: number }).keyCode === 229
}

function SectionTitle({ title }: { title: string }) {
  const prefix = "I need to"
  if (title.startsWith(prefix)) {
    return (
      <h2 className="font-serif text-lg font-bold leading-tight text-card-foreground">
        <span className="font-normal text-muted-foreground">{prefix}</span>
        {title.slice(prefix.length)}
      </h2>
    )
  }
  return (
    <h2 className="font-serif text-lg font-bold leading-tight text-card-foreground">{title}</h2>
  )
}

type ListSectionProps = {
  section: SectionDef
  items: JournalItem[]
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onEdit: (id: string, text: string) => void
  onRemove: (id: string) => void
  dragHandle?: DragHandleProps
}

function ListSection({ section, items, onAdd, onToggle, onEdit, onRemove, dragHandle }: ListSectionProps) {
  const [draft, setDraft] = useState("")
  const Icon = section.icon
  const openCount = items.filter((i) => !i.done).length

  function commitDraft() {
    const value = draft.trim()
    if (!value) return
    onAdd(value)
    setDraft("")
  }

  return (
    <div className="break-inside-avoid rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center gap-2">
        {dragHandle && <DragHandle {...dragHandle} />}
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <SectionTitle title={section.title} />
        {openCount > 0 && (
          <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {openCount}
          </span>
        )}
      </div>

      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="group flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              aria-pressed={item.done}
              aria-label={item.done ? "Mark as not done" : "Mark as done"}
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                item.done
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-transparent hover:border-primary",
              )}
            >
              <Check className="size-3.5" aria-hidden="true" />
            </button>
            <input
              value={item.text}
              onChange={(e) => onEdit(item.id, e.target.value)}
              className={cn(
                "min-w-0 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground",
                item.done && "text-muted-foreground line-through",
              )}
            />
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label="Delete item"
              className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-focus-within:opacity-100 group-hover:opacity-100"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground">
          <Plus className="size-4" aria-hidden="true" />
        </span>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isComposing(e)) {
              e.preventDefault()
              commitDraft()
            }
          }}
          onBlur={commitDraft}
          placeholder={section.placeholder}
          className="min-w-0 flex-1 bg-transparent py-0.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}

type TextSectionProps = {
  section: SectionDef
  value: string
  onChange: (value: string) => void
}

function TextSection({ section, value, onChange }: TextSectionProps) {
  const Icon = section.icon
  return (
    <div className="break-inside-avoid rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <SectionTitle title={section.title} />
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={section.placeholder}
        rows={5}
        className="w-full resize-y bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}

type SectionCardProps = {
  section: SectionDef
  items: JournalItem[]
  notes: string
  onAdd: (text: string) => void
  onToggle: (id: string) => void
  onEdit: (id: string, text: string) => void
  onRemove: (id: string) => void
  onNotesChange: (value: string) => void
}

export function SectionCard(props: SectionCardProps) {
  const { section, items, notes, onAdd, onToggle, onEdit, onRemove, onNotesChange } = props
  if (section.type === "text") {
    return <TextSection section={section} value={notes} onChange={onNotesChange} />
  }
  return (
    <ListSection
      section={section}
      items={items}
      onAdd={onAdd}
      onToggle={onToggle}
      onEdit={onEdit}
      onRemove={onRemove}
    />
  )
}

// Reorderable list card used in the main grid. Only list sections are sortable.
export function SortableSectionCard(props: Omit<SectionCardProps, "notes" | "onNotesChange">) {
  const { section, items, onAdd, onToggle, onEdit, onRemove } = props
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    opacity: isDragging ? 0.6 : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} className="break-inside-avoid">
      <ListSection
        section={section}
        items={items}
        onAdd={onAdd}
        onToggle={onToggle}
        onEdit={onEdit}
        onRemove={onRemove}
        dragHandle={{ ref: setActivatorNodeRef, attributes, listeners }}
      />
    </div>
  )
}
