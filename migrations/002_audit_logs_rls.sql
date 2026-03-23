-- Migration 002: Enable RLS on audit_logs table

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_view_own_audit_logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_audit_logs"
  ON audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
