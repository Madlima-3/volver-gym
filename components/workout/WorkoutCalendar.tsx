"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import Link from "next/link"
import { GymCard } from "@/components/ui/GymCard"
import { cn } from "@/lib/utils"

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

type Log = { id: string; executed_at: string; planName: string | null; status?: string }

export function WorkoutCalendar({ logs }: { logs: Log[] }) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) }
    else setViewMonth((m) => m - 1)
    setSelectedDay(null)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) }
    else setViewMonth((m) => m + 1)
    setSelectedDay(null)
  }

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()

  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const selectedLogs = selectedDay
    ? logs.filter((l) => sameDay(new Date(l.executed_at), selectedDay))
    : []

  return (
    <GymCard className="p-4 space-y-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold">
          {MONTHS[viewMonth]} {viewYear}
        </p>
        <button
          onClick={nextMonth}
          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-[11px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />

          const date = new Date(viewYear, viewMonth, day)
          const dayLogs = logs.filter((l) => sameDay(new Date(l.executed_at), date))
          const hasCompleted = dayLogs.some((l) => !l.status || l.status === "completed")
          const hasInProgress = dayLogs.some((l) => l.status === "in_progress")
          const isToday = sameDay(date, today)
          const isSelected = !!selectedDay && sameDay(date, selectedDay)

          return (
            <div key={day} className="flex items-center justify-center">
              <button
                onClick={() => setSelectedDay(isSelected ? null : date)}
                className={cn(
                  "relative h-9 w-9 rounded-lg text-sm transition-colors font-semibold",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : hasCompleted
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : hasInProgress
                    ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                    : isToday
                    ? "font-bold text-foreground hover:bg-secondary"
                    : "font-normal text-foreground hover:bg-secondary"
                )}
              >
                {day}
                {/* Dot indicator when day has both completed and in_progress */}
                {hasCompleted && hasInProgress && !isSelected && (
                  <span className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-amber-500" />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/20" />
          <span className="text-[11px] text-muted-foreground">Concluído</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-amber-500/20" />
          <span className="text-[11px] text-muted-foreground">Em andamento</span>
        </div>
      </div>

      {/* Selected day panel */}
      {selectedDay && (
        <div className="border-t border-border pt-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {selectedDay.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </p>
          {selectedLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhum treino neste dia.
            </p>
          ) : (
            <div className="space-y-1">
              {selectedLogs.map((l) => (
                <Link key={l.id} href={`/historico/${l.id}`}>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary transition-colors cursor-pointer">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">{l.planName ?? "Treino"}</p>
                        {l.status === "in_progress" && (
                          <Clock className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(l.executed_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {l.status === "in_progress" && " · Em andamento"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </GymCard>
  )
}
