import {
  Phone,
  Mail,
  MessageSquare,
  CheckSquare,
  CalendarClock,
  RotateCcw,
  Clock,
  CalendarPlus,
  Search,
  Trophy,
  ShoppingCart,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

export type SectionType = "list" | "text"

export type SectionDef = {
  id: string
  title: string
  placeholder: string
  icon: LucideIcon
  type: SectionType
}

export const SECTIONS: SectionDef[] = [
  { id: "call", title: "I need to call", placeholder: "Who do you need to call?", icon: Phone, type: "list" },
  { id: "email", title: "I need to email", placeholder: "Who do you need to email?", icon: Mail, type: "list" },
  { id: "text", title: "I need to text", placeholder: "Who do you need to text?", icon: MessageSquare, type: "list" },
  { id: "today", title: "I need to do today", placeholder: "What has to happen today?", icon: CheckSquare, type: "list" },
  { id: "appointments", title: "Appointments", placeholder: "Add an appointment...", icon: CalendarClock, type: "list" },
  { id: "followup", title: "I need to follow up on", placeholder: "What needs a follow-up?", icon: RotateCcw, type: "list" },
  { id: "soon", title: "I need to do soon", placeholder: "What's coming up soon?", icon: Clock, type: "list" },
  { id: "schedule", title: "I need to schedule", placeholder: "What should be scheduled?", icon: CalendarPlus, type: "list" },
  { id: "research", title: "I need to research", placeholder: "What do you want to look into?", icon: Search, type: "list" },
  { id: "buy", title: "I need to buy", placeholder: "What do you need to buy?", icon: ShoppingCart, type: "list" },
  { id: "wins", title: "Today's Wins", placeholder: "What went well today?", icon: Trophy, type: "list" },
  { id: "thoughts", title: "Random Thoughts", placeholder: "Empty your head here...", icon: Sparkles, type: "text" },
]

export type JournalItem = {
  id: string
  text: string
  done: boolean
}

export type DayEntry = {
  date: string // yyyy-mm-dd
  lists: Record<string, JournalItem[]>
  notes: string
}

export type JournalStore = Record<string, DayEntry>

const STORAGE_KEY = "brain-dump-journal-v1"
const ORDER_KEY = "brain-dump-section-order-v1"

// Sections pinned to the bottom row and excluded from reordering.
export const FIXED_SECTION_IDS = ["wins", "thoughts"]

// Default order of the reorderable (grid) sections.
export function defaultSectionOrder(): string[] {
  return SECTIONS.filter((s) => !FIXED_SECTION_IDS.includes(s.id)).map((s) => s.id)
}

export function loadSectionOrder(): string[] {
  const fallback = defaultSectionOrder()
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(ORDER_KEY)
    if (!raw) return fallback
    const saved = JSON.parse(raw) as string[]
    // Keep only valid, reorderable ids, then append any new sections added since.
    const valid = saved.filter((id) => fallback.includes(id))
    const missing = fallback.filter((id) => !valid.includes(id))
    return [...valid, ...missing]
  } catch {
    return fallback
  }
}

export function saveSectionOrder(order: string[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(ORDER_KEY, JSON.stringify(order))
  } catch {
    // ignore
  }
}

export function todayKey(): string {
  return toDateKey(new Date())
}

export function toDateKey(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function shiftDay(key: string, delta: number): string {
  const d = keyToDate(key)
  d.setDate(d.getDate() + delta)
  return toDateKey(d)
}

export function emptyEntry(date: string): DayEntry {
  return { date, lists: {}, notes: "" }
}

export function createId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function loadStore(): JournalStore {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as JournalStore
  } catch {
    return {}
  }
}

export function saveStore(store: JournalStore): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore quota / serialization errors
  }
}

export function entryHasContent(entry: DayEntry | undefined): boolean {
  if (!entry) return false
  if (entry.notes.trim().length > 0) return true
  return Object.values(entry.lists).some((items) => items && items.length > 0)
}

export function countOpenItems(entry: DayEntry | undefined): number {
  if (!entry) return 0
  return Object.values(entry.lists).reduce(
    (sum, items) => sum + (items ? items.filter((i) => !i.done).length : 0),
    0,
  )
}

export function formatLongDate(key: string): string {
  return keyToDate(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

export function formatShortDate(key: string): string {
  return keyToDate(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}
