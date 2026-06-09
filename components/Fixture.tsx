"use client";

import { CheckCircle2, XCircle, MapPin } from "lucide-react";
import { evaluarPartidoGrupo, evaluarPartidoEliminatoria, getPuntajePorFase } from "@/utils/calcularPuntos";

interface FixtureProps {
  partidos: any[];
  quiniela: any;
  resultados: Record<string, any>;
  puntajeConfig?: Record<string, { exacto: number; diferencia: number; ganador: number }>;
}

function parseEquipos(match: any) {
  if (match.equipos?.local) return match.equipos;
  if (match.casa) return { local: match.casa, visitante: match.fuera };
  if (typeof match.equipos === "string") {
    const parts = match.equipos.split(" vs. ");
    return { local: parts[0] || "Local", visitante: parts[1] || "Visitante" };
  }
  return { local: "Local", visitante: "Visitante" };
}

function getPredictionForMatch(quiniela: any, partidoId: string) {
  for (const grupo of quiniela.fase_de_grupos || []) {
    for (const p of grupo.partidos || []) {
      if (p.partido_id === partidoId) return p.pronostico;
    }
  }
  for (const [, partidos] of Object.entries(quiniela.fase_final || {})) {
    for (const p of (partidos as any[]) || []) {
      if (p.juego_id === partidoId || p.partido_id === partidoId) return p.pronostico;
    }
  }
  return null;
}

function getResultStatus(pronostico: any, resultado: any) {
  if (!pronostico || !resultado) return null;
  const gc = pronostico.goles_casa;
  const gf = pronostico.goles_fuera;
  const rc = resultado.goles_local ?? resultado.goles_casa;
  const rf = resultado.goles_visitante ?? resultado.goles_fuera;
  if (gc === rc && gf === rf) return "correct";
  const gPron = gc > gf ? "1" : gc < gf ? "2" : "X";
  const gReal = rc > rf ? "1" : rc < rf ? "2" : "X";
  if (gPron === "X" && gReal === "X") {
    const predWinner = pronostico.marca_ganador_casa || pronostico.marca_ganador_fuera || "";
    const realWinner = resultado.ganador_penales || "";
    if (predWinner && realWinner) {
      return predWinner.toLowerCase() === realWinner.toLowerCase() ? "correct" : "incorrect";
    }
  }
  if (gPron === gReal) return "partial";
  return "incorrect";
}

function getQuinielaTeams(match: any, quiniela: any) {
  if (!quiniela?.fase_final) return null;
  for (const [, partidos] of Object.entries(quiniela.fase_final)) {
    for (const p of (partidos as any[]) || []) {
      if (String(p.juego_id) === String(match.partido_id) && p.casa && p.fuera) {
        return { local: p.casa, visitante: p.fuera };
      }
    }
  }
  return null;
}

function getPointsForMatch(match: any, quiniela: any, resultados: Record<string, any>, puntajeConfig: any) {
  const pred = getPredictionForMatch(quiniela, match.partido_id);
  const real = resultados[match.partido_id];
  if (!pred || !real) return null;
  const isGroup = match.fase?.startsWith("Fase de Grupos");
  const config = puntajeConfig || {};
  if (isGroup) {
    return evaluarPartidoGrupo(pred, real, config.grupos);
  }
  const faseConfig = getPuntajePorFase(match.partido_id, config);
  const quinielaPartido = (() => {
    for (const [, partidos] of Object.entries(quiniela.fase_final || {})) {
      for (const p of (partidos as any[]) || []) {
        if (String(p.juego_id) === String(match.partido_id)) return p;
      }
    }
    return null;
  })();
  return evaluarPartidoEliminatoria(pred, real, faseConfig, match, quinielaPartido);
}

function MatchCard({ match, prediction, real, status, quiniela, points }: any) {
  const quinielaTeams = getQuinielaTeams(match, quiniela);
  const equipos = quinielaTeams || parseEquipos(match);
  const isKnockout = !match.fase?.startsWith("Fase de Grupos");
  const predWinner = isKnockout && prediction?.marca_ganador_casa
    ? equipos.local
    : isKnockout && prediction?.marca_ganador_fuera
    ? equipos.visitante
    : null;
  return (
    <div
      className={`bg-white rounded-2xl border-2 transition-all p-5 shadow-sm ${
        status === "correct"
          ? "border-green-500 shadow-green-50"
          : status === "incorrect"
          ? "border-red-500 shadow-red-50"
          : "border-gray-100"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          {match.jor
            ? `Grupo ${match.fase?.replace("Fase de Grupos - Grupo ", "") || ""} · ${match.jor.replace("J", "Jornada ")}`
            : match.partido_id}
        </span>
        <div className="flex items-center gap-1 text-gray-400">
          <MapPin className="w-3 h-3" />
          <span className="text-[10px] leading-none">{match.ciudad}</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm truncate pr-2 flex items-center gap-1">
            {equipos.local}
            {predWinner === equipos.local && (
              <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 leading-none">
                GANADOR
              </span>
            )}
          </span>
          <div className="flex gap-1">
            <span className="bg-gray-50 text-gray-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold border border-gray-100">
              {prediction?.goles_casa ?? "-"}
            </span>
            {real && (
              <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-sm">
                {real.goles_local ?? real.goles_casa}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm truncate pr-2 flex items-center gap-1">
            {equipos.visitante}
            {predWinner === equipos.visitante && (
              <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 leading-none">
                GANADOR
              </span>
            )}
          </span>
          <div className="flex gap-1">
            <span className="bg-gray-50 text-gray-700 w-8 h-8 rounded-lg flex items-center justify-center font-bold border border-gray-100">
              {prediction?.goles_fuera ?? "-"}
            </span>
            {real && (
              <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-sm">
                {real.goles_visitante ?? real.goles_fuera}
              </span>
            )}
          </div>
        </div>
      </div>

      {status && (
        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-center gap-2">
          {status === "correct" ? (
            <>
              <CheckCircle2 className="text-green-500 w-4 h-4" />
              <span className="text-xs font-bold text-green-600">Acierto</span>
            </>
          ) : status === "partial" ? (
            <>
              <CheckCircle2 className="text-yellow-500 w-4 h-4" />
              <span className="text-xs font-bold text-yellow-600">Parcial</span>
            </>
          ) : (
            <>
              <XCircle className="text-red-500 w-4 h-4" />
              <span className="text-xs font-bold text-red-600">Fallo</span>
            </>
          )}
          {points != null && (
            <span className={`ml-1 text-xs font-black ${points > 0 ? "text-blue-600" : "text-gray-300"}`}>
              {points > 0 ? `+${points}` : `+0`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

const KNOCKOUT_PHASES = [
  "Dieciseisavos de Final",
  "Octavos de Final",
  "Cuartos de Final",
  "Semifinal",
  "Tercer Lugar",
  "Gran Final",
];

export default function Fixture({ partidos, quiniela, resultados, puntajeConfig }: FixtureProps) {
  if (!quiniela) {
    return <div className="text-center p-20 text-gray-400">Selecciona un participante</div>;
  }

  const groupMatches = (partidos || [])
    .filter((m: any) => m.fase?.startsWith("Fase de Grupos"))
    .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));

  const grupos: Record<string, any[]> = {};
  for (const m of groupMatches) {
    const letter = m.fase?.replace("Fase de Grupos - Grupo ", "") || "";
    if (!grupos[letter]) grupos[letter] = [];
    grupos[letter].push(m);
  }

  const jornadaLabels: Record<string, string> = { J1: "Jornada 1", J2: "Jornada 2", J3: "Jornada 3" };

  const ch = quiniela.cuadro_de_honor || {};

  const fmt = (v: any) => (v && v !== "nan" ? v : "—");

  return (
    <div className="space-y-10">
      {/* Cuadro de Honor */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 border-l-4 border-blue-600 pl-4 mb-4">
          Cuadro de Honor
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Campeón</span>
            <p className="text-lg font-black text-amber-900 mt-1">{fmt(ch.campeon)}</p>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subcampeón</span>
            <p className="text-lg font-black text-gray-800 mt-1">{fmt(ch.subcampeon)}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">3.er Lugar</span>
            <p className="text-lg font-black text-orange-900 mt-1">{fmt(ch.tercer_puesto)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { key: "bota_oro", label: "Bota de Oro" },
            { key: "bota_plata", label: "Bota de Plata" },
            { key: "bota_bronce", label: "Bota de Bronce" },
            { key: "balon_oro", label: "Balón de Oro" },
            { key: "balon_plata", label: "Balón de Plata" },
            { key: "balon_bronce", label: "Balón de Bronce" },
          ].map(({ key, label }) => (
            <div key={key} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</span>
              <p className="text-sm font-bold text-gray-800 mt-1">{fmt(ch[key])}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fase de Grupos */}
      <div>
        <h3 className="text-lg font-bold text-blue-900 border-l-4 border-blue-600 pl-4 mb-6">
          Fase de Grupos
        </h3>
        <div className="space-y-8">
          {Object.entries(grupos).map(([letter, matches]) => (
            <div key={letter}>
              <h4 className="flex items-center gap-2 text-md font-bold text-white bg-blue-600 rounded-xl px-4 py-2 mb-4 shadow-sm">
                <span className="w-7 h-7 bg-white text-blue-600 rounded-lg flex items-center justify-center text-sm font-black">
                  {letter}
                </span>
                Grupo {letter}
              </h4>
              {["J1", "J2", "J3"].map((jor) => {
                const jMatches = matches.filter((m: any) => m.jor === jor);
                if (jMatches.length === 0) return null;
                return (
                  <div key={jor} className="mb-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                      {jornadaLabels[jor]}
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {jMatches.map((match: any) => {
                        const pred = getPredictionForMatch(quiniela, match.partido_id);
                        const real = resultados[match.partido_id];
                        return (
                          <MatchCard
                            key={match.partido_id}
                            match={match}
                            prediction={pred}
                            real={real}
                            status={getResultStatus(pred, real)}
                            quiniela={quiniela}
                            points={getPointsForMatch(match, quiniela, resultados, puntajeConfig)}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Fases Finales */}
      {KNOCKOUT_PHASES.map((faseLabel) => {
        const matchesInFase = (partidos || [])
          .filter((m: any) => m.fase === faseLabel)
          .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
        if (matchesInFase.length === 0) return null;

        return (
          <div key={faseLabel}>
            <h3 className="text-lg font-bold text-blue-900 border-l-4 border-blue-600 pl-4 mb-6">
              {faseLabel}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {matchesInFase.map((match: any) => {
                const pred = getPredictionForMatch(quiniela, match.partido_id);
                const real = resultados[match.partido_id];
                return (
                <MatchCard
                  key={match.partido_id}
                  match={match}
                  prediction={pred}
                  real={real}
                  status={getResultStatus(pred, real)}
                  quiniela={quiniela}
                  points={getPointsForMatch(match, quiniela, resultados, puntajeConfig)}
                />);
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
