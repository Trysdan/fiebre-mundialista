-- Ejecutar esto en el SQL Editor de Supabase
-- Luego correr: node scripts/seed.mjs

CREATE TABLE IF NOT EXISTS app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS quinielas (
  id BIGSERIAL PRIMARY KEY,
  participante TEXT NOT NULL,
  archivo_fuente TEXT NOT NULL DEFAULT 'Quiniela',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quinielas_participante ON quinielas(participante);

CREATE TABLE IF NOT EXISTS login_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  username TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
