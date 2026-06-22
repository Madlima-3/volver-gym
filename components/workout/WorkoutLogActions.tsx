"use client"

import { useState, useTransition } from "react"
import { deleteWorkoutLog, updateWorkoutLogDate } from "@/lib/actions/workout-logs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, CalendarDays } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  logId: string
  executedAt: string  // ISO string
}

export function WorkoutLogActions({ logId, executedAt }: Props) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editingDate, setEditingDate] = useState(false)

  // Convert UTC ISO to local datetime-local value (YYYY-MM-DDTHH:mm)
  const localDate = new Date(executedAt)
  const pad = (n: number) => String(n).padStart(2, "0")
  const defaultDateValue = `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}`

  const [dateValue, setDateValue] = useState(defaultDateValue)

  function handleDelete() {
    startTransition(() => deleteWorkoutLog(logId))
  }

  function handleSaveDate() {
    const formData = new FormData()
    formData.set("executed_at", dateValue)
    startTransition(() => updateWorkoutLogDate(logId, formData))
  }

  return (
    <div className="space-y-3">
      {/* Edit date */}
      {editingDate ? (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <p className="text-sm font-medium">Editar data do treino</p>
          <Input
            type="datetime-local"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            max={new Date().toISOString().slice(0, 16)}
            className="text-sm"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleSaveDate}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? "Salvando…" : "Salvar"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setEditingDate(false); setDateValue(defaultDateValue) }}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setEditingDate(true)}
        >
          <CalendarDays className="h-4 w-4 mr-2" />
          Editar data do treino
        </Button>
      )}

      {/* Delete */}
      {confirmDelete ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <p className="text-sm font-medium text-destructive">Excluir este registro?</p>
          <p className="text-xs text-muted-foreground">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? "Excluindo…" : "Sim, excluir"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className={cn("w-full text-destructive hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30")}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir registro
        </Button>
      )}
    </div>
  )
}
