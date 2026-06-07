"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/dashboard")
  return { supabase }
}

export async function addExercise(workoutPlanId: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  // Calcula o próximo order_index
  const { data: existing } = await supabase
    .from("exercises")
    .select("order_index")
    .eq("workout_plan_id", workoutPlanId)
    .order("order_index", { ascending: false })
    .limit(1)

  const nextIndex = (existing?.[0]?.order_index ?? -1) + 1

  const muscle_group = (formData.get("muscle_group") as string) || null

  const { error } = await supabase.from("exercises").insert({
    workout_plan_id: workoutPlanId,
    name: formData.get("name") as string,
    sets: Number(formData.get("sets")) || null,
    reps: (formData.get("reps") as string) || null,
    suggested_weight: Number(formData.get("suggested_weight")) || null,
    notes: (formData.get("notes") as string) || null,
    order_index: nextIndex,
    muscle_group,
  })

  if (error) throw new Error(error.message)

  revalidatePath(`/treinos/${workoutPlanId}`)
}

export async function deleteExercise(exerciseId: string, workoutPlanId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId)

  if (error) throw new Error(error.message)

  revalidatePath(`/treinos/${workoutPlanId}`)
}

export async function updateExercise(exerciseId: string, workoutPlanId: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("exercises")
    .update({
      name: formData.get("name") as string,
      sets: Number(formData.get("sets")) || null,
      reps: (formData.get("reps") as string) || null,
      suggested_weight: Number(formData.get("suggested_weight")) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", exerciseId)

  if (error) throw new Error(error.message)

  revalidatePath(`/treinos/${workoutPlanId}`)
}
