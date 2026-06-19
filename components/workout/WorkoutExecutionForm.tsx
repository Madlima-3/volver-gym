"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { logWorkout } from "@/lib/actions/workout-logs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GymCard } from "@/components/ui/GymCard"
import { cn } from "@/lib/utils"
import { Dumbbell, Timer, Plus, Minus, X } from "lucide-react"

type Exercise = {
  id: string
  name: string
  sets: number | null
  reps: string | null
  suggested_weight: number | null
  notes: string | null
  order_index: number
  lastWeight?: number | null
  lastReps?: string | null
}

type ExState = {
  setsDone: number
  reps: string
  weight: string
  exNotes: string
  timerEnd: number | null   // epoch ms when timer expires
  timerDuration: number     // seconds
  timerOpen: boolean        // picker visible
}

const PRESETS = [
  { label: "30s", value: 30 },
  { label: "1min", value: 60 },
  { label: "90s", value: 90 },
  { label: "2min", value: 120 },
]

function playBeep() {
  try {
    const ctx = new AudioContext()
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      const t = ctx.currentTime + i * 0.3
      gain.gain.setValueAtTime(0.5, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      osc.start(t)
      osc.stop(t + 0.25)
    }
  } catch {}
}

function fmt(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const m = Math.floor(s / 60)
  return m > 0 ? `${m}:${(s % 60).toString().padStart(2, "0")}` : `${s}s`
}

type Props = {
  workoutPlanId: string
  planName: string
  exercises: Exercise[]
}

export function WorkoutExecutionForm({ workoutPlanId, exercises }: Props) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState("")
  const [now, setNow] = useState(Date.now())

  const [exStates, setExStates] = useState<Record<string, ExState>>(() =>
    Object.fromEntries(
      exercises.map((ex) => [
        ex.id,
        {
          setsDone: 0,
          reps: ex.reps ?? "",
          weight: String(ex.lastWeight ?? ex.suggested_weight ?? ""),
          exNotes: "",
          timerEnd: null,
          timerDuration: 60,
          timerOpen: false,
        } satisfies ExState,
      ])
    )
  )

  // Keep a ref so the interval always reads current state
  const exStatesRef = useRef(exStates)
  exStatesRef.current = exStates

  // Track processed timers to prevent double-firing
  const processedTimers = useRef(new Set<string>())

  useEffect(() => {
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)

      const updates: Record<string, Partial<ExState>> = {}
      let anyCompleted = false

      Object.entries(exStatesRef.current).forEach(([exId, state]) => {
        if (state.timerEnd !== null && t >= state.timerEnd) {
          const key = `${exId}:${state.timerEnd}`
          if (!processedTimers.current.has(key)) {
            processedTimers.current.add(key)
            updates[exId] = {
              timerEnd: null,
              timerOpen: false,
              setsDone: state.setsDone + 1,
            }
            anyCompleted = true
          }
        }
      })

      if (anyCompleted) {
        playBeep()
        try { navigator.vibrate([300, 100, 300]) } catch {}
        setExStates((prev) => {
          const next = { ...prev }
          Object.entries(updates).forEach(([id, patch]) => {
            next[id] = { ...next[id], ...patch }
          })
          return next
        })
      }
    }, 250)
    return () => clearInterval(id)
  }, [])

  function update(id: string, patch: Partial<ExState>) {
    setExStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  function handleSubmit() {
    const fd = new FormData()
    fd.append("workout_plan_id", workoutPlanId)
    fd.append("notes", notes)
    fd.append("exercise_ids", exercises.map((e) => e.id).join(","))
    exercises.forEach((ex) => {
      const s = exStates[ex.id]
      fd.append(`ex_${ex.id}_sets`, String(s.setsDone || ex.sets || ""))
      fd.append(`ex_${ex.id}_reps`, s.reps)
      fd.append(`ex_${ex.id}_weight`, s.weight)
      fd.append(`ex_${ex.id}_notes`, s.exNotes)
    })
    startTransition(() => logWorkout(fd))
  }

  const activeCount = exercises.filter((ex) => exStates[ex.id].setsDone > 0).length

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      {exercises.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(activeCount / exercises.length) * 100}%` }}
            />
          </div>
          <span className="shrink-0 tabular-nums">{activeCount}/{exercises.length}</span>
        </div>
      )}

      {/* Exercise cards */}
      <div className="space-y-4">
        {exercises.map((ex, idx) => {
          const s = exStates[ex.id]
          const remaining = s.timerEnd ? s.timerEnd - now : 0
          const isRunning = s.timerEnd !== null && remaining > 0
          const pct = isRunning ? (remaining / (s.timerDuration * 1000)) * 100 : 0

          return (
            <GymCard
              key={ex.id}
              className={cn("p-4 space-y-4 transition-colors", s.setsDone > 0 && "border-primary/20")}
            >
              {/* Header */}
              <div className="flex items-start gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{ex.name}</p>
                  <div className="flex flex-wrap gap-x-3 mt-0.5">
                    {ex.sets && <span className="text-xs text-muted-foreground">{ex.sets} séries</span>}
                    {ex.reps && <span className="text-xs text-muted-foreground">{ex.reps} reps</span>}
                    {ex.suggested_weight && (
                      <span className="text-xs text-muted-foreground">{ex.suggested_weight} kg sugerido</span>
                    )}
                  </div>
                  {ex.lastWeight && (
                    <p className="text-xs text-primary mt-0.5">
                      Último: {ex.lastWeight} kg{ex.lastReps ? ` · ${ex.lastReps} reps` : ""}
                    </p>
                  )}
                </div>
              </div>

              {ex.notes && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-primary/30 pl-2">
                  {ex.notes}
                </p>
              )}

              {/* Series counter + timer button */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => update(ex.id, { setsDone: Math.max(0, s.setsDone - 1) })}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="text-center min-w-[4.5rem]">
                    <p className="text-2xl font-bold tabular-nums leading-none">
                      {s.setsDone}
                      {ex.sets ? (
                        <span className="text-sm font-normal text-muted-foreground">/{ex.sets}</span>
                      ) : null}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">séries</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => update(ex.id, { setsDone: s.setsDone + 1 })}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {!isRunning && (
                  <button
                    type="button"
                    onClick={() => update(ex.id, { timerOpen: !s.timerOpen })}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-3 h-9 text-xs font-medium transition-colors shrink-0",
                      s.timerOpen
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "border border-border text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Timer className="h-3.5 w-3.5" />
                    Descansar
                  </button>
                )}
              </div>

              {/* Timer panel */}
              {(s.timerOpen || isRunning) && (
                <div className="rounded-xl bg-secondary/60 p-3 space-y-3">
                  {isRunning ? (
                    <div className="space-y-2">
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-none rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-4xl font-bold tabular-nums text-primary tracking-tight">
                          {fmt(remaining)}
                        </p>
                        <button
                          type="button"
                          onClick={() => update(ex.id, { timerEnd: null })}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-3.5 w-3.5" /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Tempo de descanso</p>
                      <div className="flex gap-2 flex-wrap items-center">
                        {PRESETS.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => update(ex.id, { timerDuration: p.value })}
                            className={cn(
                              "px-3 h-8 rounded-lg text-xs font-medium transition-colors",
                              s.timerDuration === p.value
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:bg-muted/70"
                            )}
                          >
                            {p.label}
                          </button>
                        ))}
                        <Input
                          type="number"
                          min="5"
                          max="600"
                          className="h-8 w-16 text-xs text-center"
                          placeholder="seg"
                          value={PRESETS.some((p) => p.value === s.timerDuration) ? "" : s.timerDuration}
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            if (v >= 5) update(ex.id, { timerDuration: v })
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          update(ex.id, { timerEnd: Date.now() + s.timerDuration * 1000 })
                        }
                      >
                        <Timer className="h-3.5 w-3.5 mr-1.5" />
                        Iniciar descanso → +1 série ao final
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Reps, weight, notes */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Reps</Label>
                  <Input
                    value={s.reps}
                    onChange={(e) => update(ex.id, { reps: e.target.value })}
                    placeholder={ex.reps ?? "—"}
                    className="h-8 text-sm"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Carga (kg)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={s.weight}
                    onChange={(e) => update(ex.id, { weight: e.target.value })}
                    placeholder={String(ex.lastWeight ?? ex.suggested_weight ?? "—")}
                    className="h-8 text-sm"
                    inputMode="decimal"
                  />
                </div>
              </div>
              <Input
                value={s.exNotes}
                onChange={(e) => update(ex.id, { exNotes: e.target.value })}
                placeholder="Observações deste exercício..."
                className="h-8 text-sm"
              />
            </GymCard>
          )
        })}
      </div>

      {/* General notes */}
      <div className="space-y-2">
        <Label>Notas gerais do treino</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Como foi o treino hoje?"
          className="min-h-[70px] text-sm"
        />
      </div>

      {/* Submit */}
      <Button
        type="button"
        onClick={handleSubmit}
        className="w-full h-12 text-base font-semibold"
        disabled={isPending}
      >
        <Dumbbell className="h-5 w-5 mr-2" />
        {isPending ? "Salvando treino..." : "Concluir treino"}
      </Button>
    </div>
  )
}
