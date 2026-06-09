"use client";

import { Trophy } from "lucide-react";
import calcularPuntos from "@/utils/calcularPuntos";

interface LeaderboardProps {
  quinielas: any[];
  resultados: Record<string, any>;
  puntajeConfig?: Record<string, { exacto: number; diferencia: number; ganador: number }>;
  partidos?: any[];
}

export default function Leaderboard({ quinielas, resultados, puntajeConfig, partidos }: LeaderboardProps) {
  const entries = quinielas
    .map((q) => {
      const { total, detalle } = calcularPuntos(q, resultados, puntajeConfig, partidos);
      const exactos = detalle.filter((d) => {
        const phase = d.fase === "grupos" ? "grupos" : "eliminatoria";
        return d.pts >= 4;
      }).length;
      return {
        nombre: q.participante || "Desconocido",
        puntos: total,
        aciertos_exactos: exactos,
      };
    })
    .sort((a, b) => b.puntos - a.puntos);

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="text-yellow-500 w-6 h-6" />
        <h3 className="text-xl font-bold text-gray-800">Leaderboard</h3>
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3">Pos</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3 text-right">Pts</th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">Exactos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.map((entry, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 font-bold text-gray-400">{index + 1}</td>
                <td className="px-4 py-4 font-semibold text-gray-800">{entry.nombre}</td>
                <td className="px-4 py-4 text-right">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold">
                    {entry.puntos}
                  </span>
                </td>
                <td className="px-4 py-4 text-right hidden sm:table-cell">
                  <span className="text-sm text-gray-500">{entry.aciertos_exactos}</span>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">
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
