CREATE TABLE IF NOT EXISTS public.exercise_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  muscle_group text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS muscle_group text;

ALTER TABLE public.exercise_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados podem ver templates"
  ON public.exercise_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admin pode inserir templates"
  ON public.exercise_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin pode atualizar templates"
  ON public.exercise_templates
  FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admin pode deletar templates"
  ON public.exercise_templates
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

INSERT INTO public.exercise_templates (name, muscle_group) VALUES
  ('Supino reto com barra', 'Peito'),
  ('Supino inclinado com barra', 'Peito'),
  ('Supino declinado com barra', 'Peito'),
  ('Supino reto com halteres', 'Peito'),
  ('Supino inclinado com halteres', 'Peito'),
  ('Crucifixo', 'Peito'),
  ('Crucifixo inclinado', 'Peito'),
  ('Crossover na polia', 'Peito'),
  ('Flexão de braço', 'Peito'),
  ('Pullover com haltere', 'Peito'),
  ('Puxada frontal', 'Costas'),
  ('Barra fixa', 'Costas'),
  ('Remada curvada com barra', 'Costas'),
  ('Remada unilateral com haltere', 'Costas'),
  ('Remada sentado na polia', 'Costas'),
  ('Levantamento terra', 'Costas'),
  ('Remada cavalinho', 'Costas'),
  ('Pull-over na polia', 'Costas'),
  ('Remada fechada', 'Costas'),
  ('Hiperextensão', 'Costas'),
  ('Desenvolvimento com barra', 'Ombros'),
  ('Desenvolvimento com halteres', 'Ombros'),
  ('Elevação lateral', 'Ombros'),
  ('Elevação frontal', 'Ombros'),
  ('Elevação posterior', 'Ombros'),
  ('Arnold press', 'Ombros'),
  ('Face pull', 'Ombros'),
  ('Remada alta', 'Ombros'),
  ('Rosca direta com barra', 'Bíceps'),
  ('Rosca alternada com haltere', 'Bíceps'),
  ('Rosca martelo', 'Bíceps'),
  ('Rosca concentrada', 'Bíceps'),
  ('Rosca Scott', 'Bíceps'),
  ('Rosca no cabo', 'Bíceps'),
  ('Rosca inversa', 'Bíceps'),
  ('Rosca spider', 'Bíceps'),
  ('Tríceps testa com barra', 'Tríceps'),
  ('Tríceps corda na polia', 'Tríceps'),
  ('Tríceps coice com haltere', 'Tríceps'),
  ('Tríceps francês', 'Tríceps'),
  ('Tríceps banco', 'Tríceps'),
  ('Tríceps mergulho', 'Tríceps'),
  ('Tríceps na barra', 'Tríceps'),
  ('Agachamento livre', 'Quadríceps'),
  ('Leg press 45°', 'Quadríceps'),
  ('Hack squat', 'Quadríceps'),
  ('Extensora', 'Quadríceps'),
  ('Avanço com halteres', 'Quadríceps'),
  ('Búlgaro', 'Quadríceps'),
  ('Afundo', 'Quadríceps'),
  ('Agachamento sumô', 'Quadríceps'),
  ('Flexora deitada', 'Posterior de coxa'),
  ('Flexora em pé', 'Posterior de coxa'),
  ('Stiff com barra', 'Posterior de coxa'),
  ('Mesa flexora', 'Posterior de coxa'),
  ('Levantamento terra romeno', 'Posterior de coxa'),
  ('Good morning', 'Posterior de coxa'),
  ('Hip thrust', 'Glúteos'),
  ('Glúteo no cabo', 'Glúteos'),
  ('Elevação pélvica', 'Glúteos'),
  ('Cadeira abdutora', 'Glúteos'),
  ('Glúteo na máquina', 'Glúteos'),
  ('Afundo lateral', 'Glúteos'),
  ('Panturrilha em pé', 'Panturrilha'),
  ('Panturrilha sentado', 'Panturrilha'),
  ('Panturrilha no leg press', 'Panturrilha'),
  ('Abdominal supra', 'Abdômen'),
  ('Abdominal infra', 'Abdômen'),
  ('Prancha', 'Abdômen'),
  ('Abdominal oblíquo', 'Abdômen'),
  ('Elevação de pernas', 'Abdômen'),
  ('Crunch no cabo', 'Abdômen'),
  ('Rotação russa', 'Abdômen'),
  ('Abdominal bicicleta', 'Abdômen'),
  ('Encolhimento de ombros com barra', 'Trapézio'),
  ('Encolhimento com halteres', 'Trapézio')
ON CONFLICT DO NOTHING;
