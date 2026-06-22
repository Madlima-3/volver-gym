"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import { completeWorkout } from "@/lib/actions/workout-logs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { GymCard } from "@/components/ui/GymCard"
import { cn } from "@/lib/utils"
import { Dumbbell, Timer, Plus, Minus, X, CheckCircle2, AlertTriangle, CalendarDays } from "lucide-react"

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
  completed: boolean
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

function toLocalDatetimeValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

type Props = {
  workoutPlanId: string
  planName: string
  exercises: Exercise[]
  logId: string
}

const STORAGE_KEY = (logId: string) => `workout_state_${logId}`

function defaultExStates(exercises: Exercise[]): Record<string, ExState> {
  return Object.fromEntries(
    exercises.map((ex) => [
      ex.id,
      {
        setsDone: 0,
        completed: false,
        reps: ex.reps ?? "",
        weight: String(ex.lastWeight ?? ex.suggested_weight ?? ""),
        exNotes: "",
        timerEnd: null,
        timerDuration: 60,
        timerOpen: false,
      } satisfies ExState,
    ])
  )
}

export function WorkoutExecutionForm({ exercises, logId }: Props) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState("")
  const [now, setNow] = useState(Date.now())
  const [workoutDate, setWorkoutDate] = useState(() => toLocalDatetimeValue(new Date()))

  const [exStates, setExStates] = useState<Record<string, ExState>>(() =>
    defaultExStates(exercises)
  )

  // Restore from localStorage after mount (avoids SSR hydration mismatch)
  const restoredRef = useRef(false)
  useEffect(() => {
    if (restoredRef.current) return
    restoredRef.current = true
    try {
      const saved = localStorage.getItem(STORAGE_KEY(logId))
      if (saved) {
        const parsed = JSON.parse(saved) as Record<string, ExState>
        setExStates((prev) =>
          Object.fromEntries(
            exercises.map((ex) => [
              ex.id,
              // Reset timer state (would be stale after returning)
              parsed[ex.id]
                ? { ...parsed[ex.id], timerEnd: null, timerOpen: false }
                : prev[ex.id],
            ])
          )
        )
      }
    } catch {}
  }, [logId, exercises])

  // Auto-save state on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY(logId), JSON.stringify(exStates))
    } catch {}
  }, [exStates, logId])

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
          Object.entries(updates).forEach(([exId, patch]) => {
            const merged = { ...next[exId], ...patch }
            const ex = exercises.find((e) => e.id === exId)
            if (ex?.sets && merged.setsDone >= ex.sets) merged.completed = true
            next[exId] = merged
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

  const [confirmPending, setConfirmPending] = useState(false)

  function submitWorkout() {
    setConfirmPending(false)
    try { localStorage.removeItem(STORAGE_KEY(logId)) } catch {}
    const fd = new FormData()
    fd.append("notes", notes)
    fd.append("executed_at", workoutDate)
    // Only log exercises that were actually executed
    const doneIds = exercises
      .filter((ex) => exStates[ex.id].setsDone > 0 || exStates[ex.id].completed)
      .map((ex) => ex.id)
    fd.append("exercise_ids", doneIds.join(","))
    doneIds.forEach((exId) => {
      const s = exStates[exId]
      fd.append(`ex_${exId}_sets`, String(s.setsDone))
      fd.append(`ex_${exId}_reps`, s.reps)
      fd.append(`ex_${exId}_weight`, s.weight)
      fd.append(`ex_${exId}_notes`, s.exNotes)
    })
    startTransition(() => completeWorkout(logId, fd))
  }

  function handleSubmit() {
    const notDone = exercises.filter(
      (ex) => !exStates[ex.id].completed && exStates[ex.id].setsDone === 0
    )
    if (notDone.length > 0) {
      setConfirmPending(true)
    } else {
      submitWorkout()
    }
  }

  const activeCount = exercises.filter((ex) => exStates[ex.id].completed).length
  const notDoneCount = exercises.filter(
    (ex) => !exStates[ex.id].completed && exStates[ex.id].setsDone === 0
  ).length

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

      {/* Data do treino */}
      <GymCard className="p-4 space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Data do treino
        </label>
        <Input
          type="datetime-local"
          value={workoutDate}
          onChange={(e) => setWorkoutDate(e.target.value)}
          max={toLocalDatetimeValue(new Date())}
          className="text-sm"
        />
      </GymCard>

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
              className={cn(
                "p-4 space-y-4 transition-colors",
                s.completed
                  ? "bg-primary/10 border-primary/30"
                  : s.setsDone > 0 && "border-primary/20"
              )}
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
                <button
                  type="button"
                  onClick={() => update(ex.id, { completed: !s.completed })}
                  className="shrink-0 mt-0.5"
                  title={s.completed ? "Desmarcar como concluído" : "Marcar como concluído"}
                >
                  <CheckCircle2
                    className={cn(
                      "h-5 w-5 transition-colors",
                      s.completed ? "text-primary fill-primary/20" : "text-muted-foreground"
                    )}
                  />
                </button>
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
                    onClick={() => {
                      const newSets = s.setsDone + 1
                      const autoComplete = ex.sets ? newSets >= ex.sets : false
                      update(ex.id, { setsDone: newSets, completed: autoComplete || s.completed })
                    }}
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

      {/* Confirm dialog for uncompleted exercises */}
      {confirmPending && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-sm text-amber-500 font-medium">
              Atenção: {notDoneCount} exercício{notDoneCount !== 1 ? "s" : ""} não{notDoneCount !== 1 ? " foram" : " foi"} executado{notDoneCount !== 1 ? "s" : ""}. Deseja finalizar o treino mesmo assim?
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-9 text-sm"
              onClick={() => setConfirmPending(false)}
            >
              Voltar
            </Button>
            <Button
              type="button"
              className="flex-1 h-9 text-sm"
              onClick={submitWorkout}
              disabled={isPending}
            >
              {isPending ? "Salvando..." : "Sim, finalizar"}
            </Button>
          </div>
        </div>
      )}

      {/* Submit */}
      {!confirmPending && (
        <Button
          type="button"
          onClick={handleSubmit}
          className="w-full h-12 text-base font-semibold"
          disabled={isPending}
        >
          <Dumbbell className="h-5 w-5 mr-2" />
          {isPending ? "Salvando treino..." : "Concluir treino"}
        </Button>
      )}
    </div>
  )
}
