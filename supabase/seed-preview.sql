-- Ejecutar esto en el SQL Editor de Supabase
-- Crea el schema preview para los deployments de prueba en Vercel

CREATE SCHEMA IF NOT EXISTS preview;

CREATE TABLE IF NOT EXISTS preview.app_data (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS preview.quinielas (
  id BIGSERIAL PRIMARY KEY,
  participante TEXT NOT NULL,
  archivo_fuente TEXT NOT NULL DEFAULT 'Quiniela',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quinielas_participante ON preview.quinielas(participante);

CREATE TABLE IF NOT EXISTS preview.login_attempts (
  id BIGSERIAL PRIMARY KEY,
  ip TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  username TEXT
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON preview.login_attempts(ip);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON preview.login_attempts(attempted_at);
