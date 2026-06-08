"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("users").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") redirect("/dashboard")
  return supabase
}

export type TemplateState = { error?: string; success?: boolean }

export async function createExerciseTemplate(
  _prev: TemplateState,
  formData: FormData
): Promise<TemplateState> {
  const supabase = await requireAdmin()

  const name = (formData.get("name") as string).trim()
  const muscle_group = (formData.get("muscle_group") as string).trim()

  if (!name || !muscle_group) return { error: "Nome e grupo muscular são obrigatórios." }

  const { error } = await supabase
    .from("exercise_templates")
    .insert({ name, muscle_group })

  if (error) return { error: error.message }

  revalidatePath("/admin/exercicios")
  return { success: true }
}

export async function updateExerciseTemplate(id: string, formData: FormData): Promise<void> {
  const supabase = await requireAdmin()

  const name = (formData.get("name") as string).trim()
  const muscle_group = (formData.get("muscle_group") as string).trim()

  if (!name || !muscle_group) return

  const { error } = await supabase
    .from("exercise_templates")
    .update({ name, muscle_group })
    .eq("id", id)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/exercicios")
  redirect("/admin/exercicios")
}

export async function deleteExerciseTemplate(id: string): Promise<{ error?: string }> {
  const supabase = await requireAdmin()

  const { error } = await supabase
    .from("exercise_templates")
    .delete()
    .eq("id", id)

  if (error) return { error: error.message }

  revalidatePath("/admin/exercicios")
  return {}
}
