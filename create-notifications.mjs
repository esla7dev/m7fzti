import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = {};
fs.readFileSync('.env.local', 'utf-8').split(/\r?\n/).forEach(l => {
  const i = l.indexOf('=');
  if (i > 0) env[l.slice(0, i)] = l.slice(i + 1);
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_can_view_own_notifications') THEN
    CREATE POLICY users_can_view_own_notifications ON notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_can_create_notifications') THEN
    CREATE POLICY users_can_create_notifications ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_can_update_own_notifications') THEN
    CREATE POLICY users_can_update_own_notifications ON notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_can_delete_own_notifications') THEN
    CREATE POLICY users_can_delete_own_notifications ON notifications FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
`;

const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
if (error) {
  console.log('rpc exec_sql not available, trying direct pg...');
  // Try using the management API
  const resp = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql_query: sql }),
  });
  if (!resp.ok) {
    console.log('Cannot run SQL via API. Please run this SQL in Supabase Dashboard > SQL Editor:');
    console.log(sql);
  } else {
    console.log('Table created successfully!');
  }
} else {
  console.log('Table created successfully!');
}
