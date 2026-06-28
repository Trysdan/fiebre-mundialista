import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA = join(__dirname, "..", "data");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SCHEMA = process.env.SCHEMA || "public";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const partidos = JSON.parse(readFileSync(join(DATA, "data_partidos.json"), "utf-8"));

function buildGrupos() {
  const grupos = [];
  const gruposMap = {};
  for (const p of partidos.partidos) {
    if (!p.fase.startsWith("Fase de Grupos")) continue;
    const letra = p.fase.replace("Fase de Grupos - Grupo ", "");
    if (!gruposMap[letra]) gruposMap[letra] = [];
    gruposMap[letra].push(p);
  }
  for (const [letra, pts] of Object.entries(gruposMap)) {
    const equipos = new Set();
    for (const p of pts) {
      equipos.add(p.casa);
      equipos.add(p.fuera);
    }
    const equiposArr = Array.from(equipos);
    const tablaPosiciones = {};
    equiposArr.forEach((eq, i) => {
      tablaPosiciones[`POS_${i + 1}`] = eq;
    });
    const partidosGrupo = pts.map((p, j) => ({
      partido_id: p.partido_id,
      casa: p.casa,
      fuera: p.fuera,
      pronostico: { goles_casa: 1, goles_fuera: 1 },
    }));
    grupos.push({ grupo: letra, tabla_posiciones: tablaPosiciones, partidos: partidosGrupo });
  }
  return grupos;
}

function buildFaseFinal() {
  const fases = ["dieciseisavos", "octavos", "cuartos", "semifinal", "tercer_puesto", "final"];
  const result = {};
  for (const fase of fases) {
    result[fase] = [];
  }
  const faseKeys = {
    "Fase de Grupos - Grupo A": "grupos",
    "Fase de Grupos - Grupo B": "grupos",
    "Fase de Grupos - Grupo C": "grupos",
    "Fase de Grupos - Grupo D": "grupos",
    "Fase de Grupos - Grupo E": "grupos",
    "Fase de Grupos - Grupo F": "grupos",
    "Fase de Grupos - Grupo G": "grupos",
    "Fase de Grupos - Grupo H": "grupos",
    "Fase de Grupos - Grupo I": "grupos",
    "Fase de Grupos - Grupo J": "grupos",
    "Fase de Grupos - Grupo K": "grupos",
    "Fase de Grupos - Grupo L": "grupos",
    "Dieciseisavos de Final": "dieciseisavos",
    "Octavos de Final": "octavos",
    "Cuartos de Final": "cuartos",
    "Semifinal": "semifinal",
    "Tercer Puesto": "tercer_puesto",
    "Final": "final",
  };
  for (const p of partidos.partidos) {
    const faseKey = faseKeys[p.fase];
    if (!faseKey || faseKey === "grupos") continue;
    if (!result[faseKey]) continue;
    result[faseKey].push({
      juego_id: p.partido_id,
      casa: p.casa,
      fuera: p.fuera,
      pronostico: {
        goles_casa: 1,
        goles_fuera: 0,
        marca_ganador_casa: "",
        marca_ganador_fuera: "",
      },
    });
  }
  return result;
}

async function insertQuiniela(participante, data) {
  const url = `${SUPABASE_URL}/rest/v1/quinielas`;
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Prefer": "return=minimal",
  };
  if (SCHEMA !== "public") {
    headers["Content-Profile"] = SCHEMA;
    headers["Accept-Profile"] = SCHEMA;
  }
  const body = {
    participante: data.participante,
    archivo_fuente: data.archivo_fuente,
    data: data,
  };
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error insert ${participante}: ${res.status} ${text}`);
  }
  console.log(`✓ ${participante}`);
}

async function main() {
  const grupos = buildGrupos();
  const faseFinal = buildFaseFinal();

  const quinielas = [
    {
      participante: "Juan Pérez",
      archivo_fuente: "Test",
      fase_de_grupos: grupos,
      mejores_terceros: [],
      fase_final: faseFinal,
      cuadro_de_honor: {
        campeon: "Argentina",
        subcampeon: "Brasil",
        tercer_puesto: "Francia",
        bota_oro: "Lionel Messi",
        bota_plata: "Kylian Mbappé",
        bota_bronce: "Neymar",
        balon_oro: "Lionel Messi",
        balon_plata: "Kylian Mbappé",
        balon_bronce: "Neymar",
      },
    },
    {
      participante: "María García",
      archivo_fuente: "Test",
      fase_de_grupos: grupos,
      mejores_terceros: [],
      fase_final: faseFinal,
      cuadro_de_honor: {
        campeon: "Brasil",
        subcampeon: "Argentina",
        tercer_puesto: "Alemania",
        bota_oro: "Neymar",
        bota_plata: "Lionel Messi",
        bota_bronce: "Kylian Mbappé",
        balon_oro: "Neymar",
        balon_plata: "Lionel Messi",
        balon_bronce: "Kylian Mbappé",
      },
    },
    {
      participante: "Carlos López",
      archivo_fuente: "Test",
      fase_de_grupos: grupos,
      mejores_terceros: [],
      fase_final: faseFinal,
      cuadro_de_honor: {
        campeon: "Francia",
        subcampeon: "Brasil",
        tercer_puesto: "Argentina",
        bota_oro: "Kylian Mbappé",
        bota_plata: "Lionel Messi",
        bota_bronce: "Neymar",
        balon_oro: "Kylian Mbappé",
        balon_plata: "Neymar",
        balon_bronce: "Lionel Messi",
      },
    },
    {
      participante: "Ana Rodríguez",
      archivo_fuente: "Test",
      fase_de_grupos: grupos,
      mejores_terceros: [],
      fase_final: faseFinal,
      cuadro_de_honor: {
        campeon: "Alemania",
        subcampeon: "Francia",
        tercer_puesto: "Brasil",
        bota_oro: "Kylian Mbappé",
        bota_plata: "Neymar",
        bota_bronce: "Lionel Messi",
        balon_oro: "Kylian Mbappé",
        balon_plata: "Lionel Messi",
        balon_bronce: "Neymar",
      },
    },
    {
      participante: "Pedro Martínez",
      archivo_fuente: "Test",
      fase_de_grupos: grupos,
      mejores_terceros: [],
      fase_final: faseFinal,
      cuadro_de_honor: {
        campeon: "Argentina",
        subcampeon: "Francia",
        tercer_puesto: "Brasil",
        bota_oro: "Lionel Messi",
        bota_plata: "Kylian Mbappé",
        bota_bronce: "Neymar",
        balon_oro: "Lionel Messi",
        balon_plata: "Lionel Messi",
        balon_bronce: "Kylian Mbappé",
      },
    },
  ];

  console.log(`Insertando ${quinielas.length} quinielas en schema: ${SCHEMA}`);
  for (const q of quinielas) {
    await insertQuiniela(q.participante, q);
  }
  console.log("\n✓ Quinielas de prueba insertadas correctamente");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
