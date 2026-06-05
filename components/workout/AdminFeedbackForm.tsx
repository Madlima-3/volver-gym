"use client"

import { useTransition, useState } from "react"
import { addAdminFeedback } from "@/lib/actions/workout-logs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare } from "lucide-react"

export function AdminFeedbackForm({
  logId,
  currentFeedback,
}: {
  logId: string
  currentFeedback: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const action = addAdminFeedback.bind(null, logId)

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await action(formData)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Feedback do admin</h3>
      </div>
      <form action={handleSubmit} className="space-y-3">
        <Textarea
          name="admin_feedback"
          defaultValue={currentFeedback ?? ""}
          placeholder="Deixe um comentário para este treino..."
          className="min-h-[80px] text-sm"
        />
        <Button type="submit" size="sm" disabled={isPending} className="w-full">
          {saved ? "Salvo!" : isPending ? "Salvando..." : "Salvar feedback"}
        </Button>
      </form>
    </div>
  )
}
