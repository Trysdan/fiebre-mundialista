# Fiebre Mundialista '26 ⚽

Aplicación web para gestionar quinielas del Mundial 2026. Los participantes cargan sus predicciones (marcadores, fases finales y cuadro de honor) y compiten en un leaderboard en tiempo real.

## Stack

- **Next.js 15** (App Router)
- **Supabase** (PostgreSQL para datos persistentes)
- **Tailwind CSS v4**
- **Deploy**: Vercel

## Funcionalidades

### 👤 Participante
- Busca tu quiniela por nombre
- Visualiza el **Fixture** completo de los 104 partidos:
  - Fase de grupos ordenada por grupo y jornada
  - Fases finales (dieciseisavos → gran final)
  - Cada partido muestra tu pronóstico, el resultado real (si existe) y los puntos obtenidos
- **Cuadro de Honor**: predicciones de campeón, subcampeón, tercer puesto y premios individuales (bota/balón de oro/plata/bronce)

### 🏆 Leaderboard
- Ranking en tiempo real con puntos de todos los participantes
- Puntaje calculado por:
  - **Acierto exacto**: goles exactos (más puntos en fases avanzadas)
  - **Diferencia de goles**: mismo margen
  - **Ganador 1X2**: solo quien gana o empate
  - **Cuadro de Honor**: puntos por cada acierto en el cuadro de honor
- En fases finales, además se valida que los **equipos pronosticados** coincidan con los reales

### 🔧 Admin
- **Resultados**: carga de marcadores reales, agrupados por fecha (fase de grupos) y por fase (eliminatorias)
- **Equipos**: actualiza los nombres de equipos en fases finales a medida que avanzan
- **Cuadro de Honor**: define las respuestas correctas (campeón, botas, balones, etc.)
- **Puntaje**: configuración de puntos por fase y por cada campo del cuadro de honor
- Login: `admin / admin`

## Estructura

```
├── app/api/          → API Routes (data, admin, config)
├── components/       → UI: Leaderboard, Fixture, AdminPanel
├── lib/              → Cliente Supabase
├── data/             → Datos iniciales (partidos, puntaje_config)
├── scripts/          → seed.mjs (carga inicial a Supabase)
├── supabase/         → seed.sql (esquema de tablas)
├── src/              → App.tsx (orquestador principal)
├── utils/            → calcularPuntos.js (motor de puntuación)
└── public/           → Logo.jpeg, background.png
```

## Deploy

1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar `supabase/seed.sql` en el SQL Editor
3. Configurar variables de entorno:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. `npm run seed` (sube partidos y configuración a Supabase)
5. Deploy en [Vercel](https://vercel.com) conectando el repo de GitHub
