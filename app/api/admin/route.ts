import { NextResponse } from "next/server";
import { upsertRow, getRow, insertQuiniela, deleteQuiniela } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    if (type === "resultados") {
      await upsertRow("resultados", body.resultados);
      return NextResponse.json({ success: true, message: "Resultados actualizados" });
    }

    if (type === "quiniela") {
      await insertQuiniela(body);
      return NextResponse.json({ success: true, message: "Quiniela guardada" });
    }

    if (type === "partidos") {
      const updates = body.partidos as Record<string, { casa: string; fuera: string }>;
      const data = await getRow("partidos");
      const partidos = data?.partidos || [];
      for (const p of partidos) {
        const upd = updates[p.partido_id];
        if (upd) {
          p.casa = upd.casa;
          p.fuera = upd.fuera;
          if (p.equipos) {
            p.equipos.local = upd.casa;
            p.equipos.visitante = upd.fuera;
          }
        }
      }
      await upsertRow("partidos", data);
      return NextResponse.json({ success: true, message: "Equipos actualizados" });
    }

    if (type === "cuadro_honor") {
      const resultados = (await getRow("resultados")) || {};
      resultados.cuadro_de_honor = body.cuadro_de_honor;
      await upsertRow("resultados", resultados);
      return NextResponse.json({ success: true, message: "Cuadro de honor actualizado" });
    }

    if (type === "contacto") {
      await upsertRow("contacto", body.contacto);
      return NextResponse.json({ success: true, message: "Contacto actualizado" });
    }

    if (type === "admin_creds") {
      await upsertRow("admin_creds", body.admin_creds);
      return NextResponse.json({ success: true, message: "Credenciales actualizadas" });
    }

    if (type === "delete_quiniela") {
      await deleteQuiniela(body.participante);
      return NextResponse.json({ success: true, message: "Participante eliminado" });
    }

    if (type === "disabled_phases") {
      await upsertRow("disabled_phases", body.disabledPhases);
      return NextResponse.json({ success: true, message: "Fases deshabilitadas actualizadas" });
    }

    if (type === "ch_manual_pts") {
      await upsertRow("ch_manual_pts", body.chManualPts);
      return NextResponse.json({ success: true, message: "Puntos CH manuales guardados" });
    }

    return NextResponse.json({ error: "Tipo de operación no válido" }, { status: 400 });
  } catch (error) {
    console.error("Error en admin:", error);
    return NextResponse.json({ error: "Error al guardar los datos" }, { status: 500 });
  }
}
