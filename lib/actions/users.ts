"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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
  return { supabase, adminId: user.id }
}

export type InviteState = { error?: string; success?: boolean }

export async function inviteUser(
  _prevState: InviteState,
  formData: FormData
): Promise<InviteState> {
  const { adminId } = await requireAdmin()

  const email = formData.get("email") as string
  const name = (formData.get("name") as string) || null

  if (!email) return { error: "Email é obrigatório." }

  const adminClient = createAdminClient()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://volver-gym.vercel.app"

  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: name ? { name } : {},
    redirectTo: `${siteUrl}/auth/confirm`,
  })

  if (error) return { error: error.message }

  if (name) {
    await adminClient
      .from("users")
      .update({ name, invited_by: adminId })
      .eq("id", data.user.id)
  }

  revalidatePath("/admin/usuarios")
  return { success: true }
}

export async function deleteUser(userId: string) {
  const { supabase: _s, adminId } = await requireAdmin()

  if (userId === adminId) {
    return { error: "Você não pode excluir sua própria conta." }
  }

  const adminClient = createAdminClient()

  // workout_logs.user_id has no CASCADE, must delete manually before auth delete
  const { error: logsError } = await adminClient
    .from("workout_logs")
    .delete()
    .eq("user_id", userId)

  if (logsError) return { error: "Erro ao remover histórico de treinos." }

  // Nullify assigned_to (no CASCADE on this FK either)
  await adminClient.from("workout_plans").update({ assigned_to: null }).eq("assigned_to", userId)

  // created_by is NOT NULL — reassign to current admin
  await adminClient.from("workout_plans").update({ created_by: adminId }).eq("created_by", userId)

  const { error } = await adminClient.auth.admin.deleteUser(userId)

  if (error) return { error: error.message }

  revalidatePath("/admin/usuarios")
  redirect("/admin/usuarios")
}

export async function updateUserRole(userId: string, role: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("users")
    .update({ role })
    .eq("id", userId)

  if (error) throw new Error(error.message)

  revalidatePath("/admin/usuarios")
  revalidatePath(`/admin/usuarios/${userId}`)
}
