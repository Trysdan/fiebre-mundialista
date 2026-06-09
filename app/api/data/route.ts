import { NextResponse } from "next/server";
import { getAllRows, getQuinielas } from "@/lib/supabase";

export async function GET() {
  try {
    const rows = await getAllRows();
    const map: Record<string, any> = {};
    for (const row of rows) {
      map[row.key] = row.value;
    }
    const quinielas = await getQuinielas();

    return NextResponse.json({
      partidos: map.partidos || { partidos: [] },
      resultados: map.resultados || {},
      puntajeConfig: map.puntaje_config || {},
      contacto: map.contacto || { email: "", telefonos: [] },
      adminCreds: map.admin_creds || { usuario: "admin", password: "admin" },
      quinielas,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return NextResponse.json({ error: "Error al leer los datos" }, { status: 500 });
  }
}
