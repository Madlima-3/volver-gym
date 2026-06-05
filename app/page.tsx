import { redirect } from "next/navigation"

// A raiz redireciona para o dashboard.
// O middleware envia para /login se não houver sessão ativa.
export default function Home() {
  redirect("/dashboard")
}
