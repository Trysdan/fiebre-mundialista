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
