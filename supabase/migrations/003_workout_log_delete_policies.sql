-- Fix: users could not delete their own workout_logs.
-- RLS was enabled on workout_logs/exercise_logs but no DELETE policy existed
-- for the owning user, so `.delete()` silently affected 0 rows (no error).

CREATE POLICY "Usuário deleta seus próprios logs"
  ON public.workout_logs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin deleta logs"
  ON public.workout_logs
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Needed so the ON DELETE CASCADE from workout_logs can actually remove
-- the related exercise_logs rows under RLS.
CREATE POLICY "Usuário deleta seus exercise_logs"
  ON public.exercise_logs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.workout_logs wl
      WHERE wl.id = workout_log_id AND wl.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin deleta exercise_logs"
  ON public.exercise_logs
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
