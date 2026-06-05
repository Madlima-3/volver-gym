"use client"

import { useState, useTransition } from "react"
import { addExercise } from "@/lib/actions/exercises"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, X } from "lucide-react"

export function AddExerciseForm({ workoutPlanId }: { workoutPlanId: string }) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await addExercise(workoutPlanId, formData)
      setOpen(false)
    })
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4 mr-1" />
        Adicionar exercício
      </Button>
    )
  }

  return (
    <form action={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Novo exercício</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ex-name">Nome *</Label>
        <Input id="ex-name" name="name" placeholder="ex: Supino reto" required />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="ex-sets">Séries</Label>
          <Input id="ex-sets" name="sets" type="number" min="1" placeholder="3" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ex-reps">Reps</Label>
          <Input id="ex-reps" name="reps" placeholder="8-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ex-weight">Carga (kg)</Label>
          <Input id="ex-weight" name="suggested_weight" type="number" step="0.5" placeholder="20" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ex-notes">Observações</Label>
        <Textarea
          id="ex-notes"
          name="notes"
          placeholder="Técnica, variações, etc."
          className="min-h-[60px]"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Salvar exercício"}
        </Button>
      </div>
    </form>
  )
}
