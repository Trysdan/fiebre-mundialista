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

async function upsert(key, value) {
  const url = `${SUPABASE_URL}/rest/v1/app_data`;
  const headers = {
    "Content-Type": "application/json",
    "apikey": SUPABASE_KEY,
    "Authorization": `Bearer ${SUPABASE_KEY}`,
    "Prefer": "resolution=merge-duplicates",
  };
  if (SCHEMA !== "public") {
    headers["Content-Profile"] = SCHEMA;
    headers["Accept-Profile"] = SCHEMA;
  }
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error upsert ${key}: ${res.status} ${text}`);
  }
  console.log(`✓ [${SCHEMA}] ${key}`);
}

async function seed() {
  console.log(`Seed en schema: ${SCHEMA}`);

  const partidos = JSON.parse(readFileSync(join(DATA, "data_partidos.json"), "utf-8"));
  await upsert("partidos", partidos);

  const config = JSON.parse(readFileSync(join(DATA, "puntaje_config.json"), "utf-8"));
  await upsert("puntaje_config", config);

  await upsert("resultados", {});

  await upsert("contacto", {
    email: "fiebremundialista206@gmail.com",
    telefonos: ["04247318608", "04247149966", "04220705392"],
  });

  await upsert("admin_creds", { usuario: "admin", password: "admin" });

  console.log(`\nSeed completado en schema: ${SCHEMA}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
