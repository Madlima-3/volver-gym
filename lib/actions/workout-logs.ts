"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function logWorkout(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const workoutPlanId = formData.get("workout_plan_id") as string
  const notes = (formData.get("notes") as string) || null
  const exerciseIds = (formData.get("exercise_ids") as string).split(",").filter(Boolean)

  const { data: log, error: logError } = await supabase
    .from("workout_logs")
    .insert({ user_id: user.id, workout_plan_id: workoutPlanId, notes })
    .select("id")
    .single()

  if (logError) throw new Error(logError.message)

  const exerciseLogs = exerciseIds.map((exId) => ({
    workout_log_id: log.id,
    exercise_id: exId,
    sets_done: Number(formData.get(`ex_${exId}_sets`)) || null,
    reps_done: (formData.get(`ex_${exId}_reps`) as string) || null,
    weight_used: Number(formData.get(`ex_${exId}_weight`)) || null,
    notes: (formData.get(`ex_${exId}_notes`) as string) || null,
  }))

  if (exerciseLogs.length > 0) {
    const { error } = await supabase.from("exercise_logs").insert(exerciseLogs)
    if (error) throw new Error(error.message)
  }

  revalidatePath("/historico")
  redirect(`/historico/${log.id}`)
}

export async function addAdminFeedback(logId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")

  const feedback = (formData.get("admin_feedback") as string) || null

  const { error } = await supabase
    .from("workout_logs")
    .update({ admin_feedback: feedback })
    .eq("id", logId)

  if (error) throw new Error(error.message)

  revalidatePath(`/historico/${logId}`)
}
