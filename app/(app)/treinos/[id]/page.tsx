type Props = { params: Promise<{ id: string }> }

export default async function FichaDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <div>
      <h1>Teste de rota dinâmica</h1>
      <p>ID da ficha: {id}</p>
    </div>
  )
}
