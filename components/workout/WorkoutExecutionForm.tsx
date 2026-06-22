"use client"

import { useTransition, useState } from "react"
import { logWorkout } from "@/lib/actions/workout-logs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, CheckCircle2, Dumbbell } from "lucide-react"

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

type Props = {
  workoutPlanId: string
  planName: string
  exercises: Exercise[]
}

const todayLocal = () => {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

export function WorkoutExecutionForm({ workoutPlanId, planName, exercises }: Props) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [workoutDate, setWorkoutDate] = useState(todayLocal)

  function handleSubmit(formData: FormData) {
    formData.set("executed_at", workoutDate)
    startTransition(() => logWorkout(formData))
  }

  const doneCount = Object.values(done).filter(Boolean).length

  return (
    <form action={handleSubmit} className="space-y-6">
      <input type="hidden" name="workout_plan_id" value={workoutPlanId} />
      <input
        type="hidden"
        name="exercise_ids"
        value={exercises.map((e) => e.id).join(",")}
      />

      {/* Progresso */}
      {exercises.length > 0 && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 rounded-full"
              style={{ width: `${(doneCount / exercises.length) * 100}%` }}
            />
          </div>
          <span className="shrink-0 tabular-nums">
            {doneCount}/{exercises.length}
          </span>
        </div>
      )}

      {/* Data do treino */}
      <div className="rounded-xl border bg-card p-4 space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Data do treino
        </label>
        <input
          type="datetime-local"
          name="executed_at"
          value={workoutDate}
          onChange={(e) => setWorkoutDate(e.target.value)}
          max={todayLocal()}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* Exercícios */}
      <div className="space-y-4">
        {exercises.map((ex, idx) => (
          <div
            key={ex.id}
            className={`rounded-xl border p-4 space-y-4 transition-colors ${
              done[ex.id] ? "bg-muted/40 border-muted" : "bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">{ex.name}</p>
                  <div className="flex flex-wrap gap-x-3 mt-0.5">
                    {ex.sets && (
                      <span className="text-xs text-muted-foreground">
                        {ex.sets} séries
                      </span>
                    )}
                    {ex.reps && (
                      <span className="text-xs text-muted-foreground">{ex.reps} reps</span>
                    )}
                    {ex.suggested_weight && (
                      <span className="text-xs text-muted-foreground">
                        Sugerido: {ex.suggested_weight} kg
                      </span>
                    )}
                  </div>
                  {ex.lastWeight && (
                    <p className="text-xs text-primary mt-0.5">
                      Último: {ex.lastWeight} kg
                      {ex.lastReps ? ` · ${ex.lastReps} reps` : ""}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDone((d) => ({ ...d, [ex.id]: !d[ex.id] }))}
                className="shrink-0 mt-0.5"
              >
                <CheckCircle2
                  className={`h-5 w-5 transition-colors ${
                    done[ex.id]
                      ? "text-primary fill-primary/20"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            </div>

            {ex.notes && (
              <p className="text-xs text-muted-foreground italic border-l-2 pl-2">
                {ex.notes}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor={`ex_${ex.id}_sets`} className="text-xs">
                  Séries
                </Label>
                <Input
                  id={`ex_${ex.id}_sets`}
                  name={`ex_${ex.id}_sets`}
                  type="number"
                  min="0"
                  placeholder={String(ex.sets ?? "")}
                  defaultValue={ex.sets ?? ""}
                  className="h-8 text-sm"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`ex_${ex.id}_reps`} className="text-xs">
                  Reps
                </Label>
                <Input
                  id={`ex_${ex.id}_reps`}
                  name={`ex_${ex.id}_reps`}
                  placeholder={ex.reps ?? ""}
                  defaultValue={ex.reps ?? ""}
                  className="h-8 text-sm"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`ex_${ex.id}_weight`} className="text-xs">
                  Carga (kg)
                </Label>
                <Input
                  id={`ex_${ex.id}_weight`}
                  name={`ex_${ex.id}_weight`}
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder={String(ex.lastWeight ?? ex.suggested_weight ?? "")}
                  defaultValue={ex.lastWeight ?? ex.suggested_weight ?? ""}
                  className="h-8 text-sm"
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor={`ex_${ex.id}_notes`} className="text-xs">
                Observações
              </Label>
              <Input
                id={`ex_${ex.id}_notes`}
                name={`ex_${ex.id}_notes`}
                placeholder="Como foi esse exercício?"
                className="h-8 text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Notas gerais */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notas gerais do treino</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Como foi o treino hoje? Alguma observação geral?"
          className="min-h-[70px] text-sm"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        disabled={isPending}
      >
        <Dumbbell className="h-5 w-5 mr-2" />
        {isPending ? "Salvando treino..." : "Concluir treino"}
      </Button>
    </form>
  )
}
