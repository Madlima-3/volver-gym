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

export async function inviteUser(formData: FormData) {
  const { adminId } = await requireAdmin()

  const email = formData.get("email") as string
  const name = formData.get("name") as string

  const adminClient = createAdminClient()

  // Envia convite por email via Supabase Auth
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(email, {
    data: { name },
  })

  if (error) throw new Error(error.message)

  // Atualiza o perfil com o nome e quem convidou
  await adminClient
    .from("users")
    .update({ name, invited_by: adminId })
    .eq("id", data.user.id)

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
