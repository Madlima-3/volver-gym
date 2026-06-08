"use client"

import { useActionState, useRef } from "react"
import { createExerciseTemplate } from "@/lib/actions/exercise-templates"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GymCard } from "@/components/ui/GymCard"
import { Plus } from "lucide-react"

type Props = { muscleGroups: string[] }

const initialState: { error?: string; success?: boolean } = {}

export function AddTemplateForm({ muscleGroups }: Props) {
  const [state, action, isPending] = useActionState(createExerciseTemplate, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  if (state?.success && formRef.current) {
    formRef.current.reset()
  }

  return (
    <GymCard elevated className="p-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Adicionar exercício
      </h3>
      <form ref={formRef} action={action} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label htmlFor="name" className="sr-only">Nome</Label>
          <Input id="name" name="name" placeholder="Nome do exercício" required />
        </div>
        <div className="sm:w-52">
          <Label htmlFor="muscle_group" className="sr-only">Grupo muscular</Label>
          <select
            id="muscle_group"
            name="muscle_group"
            required
            defaultValue=""
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="" disabled>Grupo muscular</option>
            {muscleGroups.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" disabled={isPending} className="shrink-0">
          <Plus className="h-4 w-4 mr-1.5" />
          {isPending ? "Salvando..." : "Adicionar"}
        </Button>
      </form>
      {state?.error && (
        <p className="text-sm text-destructive mt-2">{state.error}</p>
      )}
    </GymCard>
  )
}
