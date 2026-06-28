"use client";

import { Trophy } from "lucide-react";
import calcularPuntos from "@/utils/calcularPuntos";

interface LeaderboardProps {
  quinielas: any[];
  resultados: Record<string, any>;
  puntajeConfig?: Record<string, { exacto: number; diferencia: number; ganador: number }>;
  partidos?: any[];
  onSelectQuiniela?: (nombre: string) => void;
}

const PHASE_ORDER = ["J1", "J2", "J3", "16vos", "8vos", "4tos", "Semifinal", "3er Puesto", "Final", "Cuadro"];

const PHASE_DISPLAY: Record<string, string> = {
  dieciseisavos: "16vos",
  octavos: "8vos",
  cuartos: "4tos",
  semifinal: "Semifinal",
  tercer_puesto: "3er Puesto",
  final: "Final",
};

function computePhaseTotals(quiniela: any, resultados: Record<string, any>, puntajeConfig: any, partidos?: any[]) {
  const { total, detalle } = calcularPuntos(quiniela, resultados, puntajeConfig, partidos);

  const jorLookup: Record<string, string> = {};
  if (partidos) {
    for (const p of partidos) {
      if (p.partido_id && p.jor) jorLookup[p.partido_id] = p.jor;
    }
  }

  const phaseTotals: Record<string, number> = {};

  for (const d of detalle) {
    let phase: string;
    if (d.fase === "grupos") {
      phase = jorLookup[(d as any).partido_id] || "J?";
    } else if (d.fase === "cuadro_de_honor") {
      phase = "Cuadro";
    } else if (d.fase.startsWith("clasificado_")) {
      phase = PHASE_DISPLAY[d.fase.replace("clasificado_", "")] || d.fase;
    } else {
      phase = PHASE_DISPLAY[d.fase] || d.fase;
    }
    phaseTotals[phase] = (phaseTotals[phase] || 0) + d.pts;
  }

  return { total, phaseTotals };
}

export default function Leaderboard({ quinielas, resultados, puntajeConfig, partidos, onSelectQuiniela }: LeaderboardProps) {
  const entries = quinielas
    .map((q) => {
      const { total, phaseTotals } = computePhaseTotals(q, resultados, puntajeConfig, partidos);
      return {
        nombre: q.participante || "Desconocido",
        puntos: total,
        phaseTotals,
      };
    })
    .sort((a, b) => b.puntos - a.puntos);

  const allPhaseKeys = new Set<string>();
  for (const e of entries) {
    for (const key of Object.keys(e.phaseTotals)) {
      allPhaseKeys.add(key);
    }
  }
  const phaseKeys = PHASE_ORDER.filter((k) => allPhaseKeys.has(k));
  const colCount = 2 + phaseKeys.length + 1;

  const positions: number[] = [];
  for (let i = 0; i < entries.length; i++) {
    if (i === 0 || entries[i].puntos !== entries[i - 1].puntos) {
      positions.push(i + 1);
    } else {
      positions.push(positions[i - 1]);
    }
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="text-yellow-500 w-6 h-6" />
        <h3 className="text-xl font-bold text-gray-800">Leaderboard</h3>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap min-w-[600px]">
          <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 w-10">Pos</th>
              <th className="px-3 py-3">Nombre</th>
              {phaseKeys.map((k) => (
                <th key={k} className="px-2 py-3 text-center text-[10px]">{k}</th>
              ))}
              <th className="px-3 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry, index) => (
              <tr key={index} onClick={() => onSelectQuiniela?.(entry.nombre)} className="hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="px-3 py-4 font-bold text-gray-400">{positions[index]}</td>
                <td className="px-3 py-4 font-semibold text-gray-800 text-sm">{entry.nombre}</td>
                {phaseKeys.map((k) => (
                  <td key={k} className="px-2 py-4 text-center">
                    <span className={`text-xs font-bold ${(entry.phaseTotals[k] || 0) > 0 ? "text-gray-700" : "text-gray-300"}`}>
                      {entry.phaseTotals[k] || 0}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-4 text-right">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                    {entry.puntos}
                  </span>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={colCount} className="px-4 py-8 text-center text-gray-400 italic">
                  No hay quinielas cargadas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
