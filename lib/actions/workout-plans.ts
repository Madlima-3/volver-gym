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
  return { supabase, user }
}

export async function createWorkoutPlan(formData: FormData) {
  const { supabase, user } = await requireAdmin()

  const name = formData.get("name") as string
  const description = formData.get("description") as string

  const { data, error } = await supabase
    .from("workout_plans")
    .insert({ name, description, created_by: user.id })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/treinos")
  redirect(`/treinos/${data.id}`)
}

export async function updateWorkoutPlan(id: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const name = formData.get("name") as string
  const description = formData.get("description") as string

  const { error } = await supabase
    .from("workout_plans")
    .update({ name, description })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath(`/treinos/${id}`)
  revalidatePath("/treinos")
}

export async function assignWorkoutPlan(id: string, formData: FormData) {
  const { supabase } = await requireAdmin()

  const assignedTo = formData.get("assigned_to") as string | null
  const value = assignedTo === "" ? null : assignedTo

  const { error } = await supabase
    .from("workout_plans")
    .update({ assigned_to: value })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath(`/treinos/${id}`)
}

export async function deleteWorkoutPlan(id: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("workout_plans")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/treinos")
  redirect("/treinos")
}

export async function togglePlanActive(id: string, isActive: boolean) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("workout_plans")
    .update({ is_active: !isActive })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath(`/treinos/${id}`)
  revalidatePath("/treinos")
}
