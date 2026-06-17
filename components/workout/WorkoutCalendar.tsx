"use client"

import { useState } from "react"
import { DayPicker } from "react-day-picker"
import { ptBR } from "react-day-picker/locale"
import Link from "next/link"
import { GymCard } from "@/components/ui/GymCard"
import { ChevronRight } from "lucide-react"

type Log = {
  id: string
  executed_at: string
  planName: string | null
}

type Props = {
  logs: Log[]
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function WorkoutCalendar({ logs }: Props) {
  const [month, setMonth] = useState(new Date())
  const [selected, setSelected] = useState<Date | undefined>()

  const trainingDates = logs.map((l) => new Date(l.executed_at))

  const selectedLogs = selected
    ? logs.filter((l) => sameDay(new Date(l.executed_at), selected))
    : []

  return (
    <GymCard className="p-4 space-y-3">
      <DayPicker
        locale={ptBR}
        month={month}
        onMonthChange={setMonth}
        modifiers={{ trained: trainingDates }}
        modifiersClassNames={{
          trained: "rdp-trained",
        }}
        selected={selected}
        onSelect={(day: Date | undefined) => setSelected((prev) => (prev && day && sameDay(prev, day) ? undefined : day))}
        classNames={{
          root: "w-full",
          months: "w-full",
          month: "w-full",
          month_caption: "flex items-center justify-between px-1 mb-3",
          caption_label: "text-sm font-semibold capitalize",
          nav: "flex items-center gap-1",
          button_previous:
            "h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
          button_next:
            "h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors",
          chevron: "h-4 w-4",
          month_grid: "w-full border-collapse",
          weekdays: "mb-1",
          weekday: "text-[11px] font-medium text-muted-foreground text-center pb-2 w-[14.28%]",
          weeks: "",
          week: "flex",
          day: "relative flex-1 h-9 text-center p-0",
          day_button:
            "mx-auto h-9 w-9 text-sm rounded-lg transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          today: "font-bold text-foreground",
          outside: "opacity-25 pointer-events-none",
          selected: "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary",
        }}
      />

      {/* Inline CSS for trained modifier */}
      <style>{`
        .rdp-trained button {
          background-color: color-mix(in oklch, var(--color-primary) 20%, transparent);
          color: var(--color-primary);
          font-weight: 600;
        }
        .rdp-selected .rdp-trained button,
        .rdp-trained.rdp-selected button {
          background-color: var(--color-primary) !important;
          color: var(--color-primary-foreground) !important;
        }
      `}</style>

      {/* Selected day workouts */}
      {selected && (
        <div className="border-t border-border pt-3">
          {selectedLogs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhum treino neste dia.
            </p>
          ) : (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                {selected.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })}
              </p>
              {selectedLogs.map((l) => (
                <Link key={l.id} href={`/historico/${l.id}`}>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary transition-colors cursor-pointer">
                    <div>
                      <p className="text-sm font-medium">{l.planName ?? "Treino"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(l.executed_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
