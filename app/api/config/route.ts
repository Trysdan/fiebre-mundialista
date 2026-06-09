import { NextResponse } from "next/server";
import { getRow, upsertRow } from "@/lib/supabase";

export async function GET() {
  try {
    const value = await getRow("puntaje_config");
    return NextResponse.json(value || {});
  } catch {
    return NextResponse.json({ error: "Error al leer la config" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await upsertRow("puntaje_config", body);
    return NextResponse.json({ success: true, message: "Configuración guardada" });
  } catch {
    return NextResponse.json({ error: "Error al guardar la config" }, { status: 500 });
  }
}
