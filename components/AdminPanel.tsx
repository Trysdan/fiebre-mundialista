"use client";

import { useState } from "react";
import {
  Lock,
  LogOut,
  CheckCircle2,
  Save,
  Plus,
  MessageCircle,
  Mail,
  Info,
  Medal,
} from "lucide-react";

interface AdminPanelProps {
  partidos: any[];
  resultados: Record<string, any>;
  puntajeConfig: Record<string, any>;
  contacto?: { email: string; telefonos: string[] };
  onSaveResultados: (resultados: Record<string, any>) => Promise<void>;
  onSavePuntajeConfig: (config: any) => Promise<void>;
  onSavePartidos?: (partidos: Record<string, { casa: string; fuera: string }>) => Promise<void>;
  onSaveCuadroHonor?: (cuadro: Record<string, string>) => Promise<void>;
  onSaveContacto?: (data: { email: string; telefonos: string[] }) => Promise<void>;
}

function parseMatchTeams(match: any) {
  if (match.equipos?.local) return match.equipos;
  if (match.casa) return { local: match.casa, visitante: match.fuera };
  if (typeof match.equipos === "string") {
    const parts = match.equipos.split(" vs. ");
    return { local: parts[0] || "Local", visitante: parts[1] || "Visitante" };
  }
  return { local: "Local", visitante: "Visitante" };
}

const PHASES = [
  { key: "grupos", label: "Fase Grupos" },
  { key: "dieciseisavos", label: "16vos de Final" },
  { key: "octavos", label: "8vos de Final" },
  { key: "cuartos", label: "4tos de Final" },
  { key: "semifinal", label: "Semifinal" },
  { key: "tercer_puesto", label: "Tercer Puesto" },
  { key: "final", label: "Gran Final" },
];

export default function AdminPanel({
  partidos,
  resultados,
  puntajeConfig: initialConfig,
  contacto: initialContacto,
  onSaveResultados,
  onSavePuntajeConfig,
  onSavePartidos,
  onSaveCuadroHonor,
  onSaveContacto,
}: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localResults, setLocalResults] = useState<Record<string, any>>(resultados);
  const [puntajeConfig, setPuntajeConfig] = useState(initialConfig);
  const [teamEdits, setTeamEdits] = useState<Record<string, { casa: string; fuera: string }>>({});
  const [cuadroHonor, setCuadroHonor] = useState<Record<string, string>>(
    resultados.cuadro_de_honor || {}
  );
  const [localContacto, setLocalContacto] = useState<{ email: string; telefonos: string[] }>(
    initialContacto || { email: "", telefonos: [] }
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      setIsLoggedIn(true);
    } else {
      alert("Credenciales incorrectas");
    }
  };

  const handleSaveResults = async () => {
    await onSaveResultados(localResults);
    alert("Resultados guardados exitosamente");
  };

  const handleSaveConfig = async () => {
    await onSavePuntajeConfig(puntajeConfig);
    alert("Configuración de puntos guardada");
  };

  const handleSaveTeams = async () => {
    if (!onSavePartidos) return;
    await onSavePartidos(teamEdits);
    alert("Equipos de fases finales actualizados");
  };

  const handleSaveCuadroHonor = async () => {
    if (!onSaveCuadroHonor) return;
    await onSaveCuadroHonor(cuadroHonor);
    alert("Cuadro de Honor actualizado");
  };

  const handleSaveContacto = async () => {
    if (!onSaveContacto) return;
    await onSaveContacto(localContacto);
    alert("Contacto actualizado");
  };

  const updateConfig = (phase: string, field: string, value: number) => {
    setPuntajeConfig((prev) => {
      const current = prev[phase];
      if (typeof current === "object" && !Array.isArray(current)) {
        return { ...prev, [phase]: { ...current, [field]: value } };
      }
      return { ...prev, [phase]: value };
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-20">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-6 text-blue-600">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Panel Administrador
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Ingresa tus credenciales para continuar
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="text"
              placeholder="Usuario"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              type="password"
              placeholder="Contraseña"
              className="w-full bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-md"
            >
              Ingresar
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">
          Gestión Administrativa
        </h2>
        <button
          onClick={() => setIsLoggedIn(false)}
          className="flex items-center gap-2 text-red-600 font-semibold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Cargar Resultados Reales */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="text-blue-600" />
                Cargar Resultados Reales
              </h3>
            </div>
            {(() => {
              const groupMatches = (partidos || [])
                .filter((m: any) => m.fase?.startsWith("Fase de Grupos"))
                .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
              const fechas: Record<string, any[]> = {};
              for (const m of groupMatches) {
                if (!fechas[m.fecha]) fechas[m.fecha] = [];
                fechas[m.fecha].push(m);
              }
              const KO_PHASES = [
                "Dieciseisavos de Final", "Octavos de Final", "Cuartos de Final",
                "Semifinal", "Tercer Lugar", "Gran Final",
              ];
              return (
                <div className="space-y-6">
                  {Object.entries(fechas).map(([fecha, matches]) => (
                    <div key={fecha}>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                        {new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                      </h4>
                      <div className="space-y-2">
                        {matches.map((match: any) => (
                          <div key={match.partido_id} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl">
                            <span className="text-[10px] font-bold text-gray-400 w-14 leading-tight">
                              {match.jor
                                ? `Grupo ${match.fase?.replace("Fase de Grupos - Grupo ", "")} · ${match.jor.replace("J", "J")}`
                                : match.partido_id}
                            </span>
                            <span className="text-xs text-gray-500 w-10">{match.hora}</span>
                            <span className="text-xs font-semibold truncate max-w-[90px] text-right flex-1">
                              {parseMatchTeams(match).local}
                            </span>
                            <div className="flex items-center gap-1">
                              <input type="number" className="w-10 h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                                value={localResults[match.partido_id]?.goles_local ?? ""}
                                onChange={(e) => { const val = parseInt(e.target.value); setLocalResults((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], goles_local: isNaN(val) ? 0 : val, goles_visitante: prev[match.partido_id]?.goles_visitante ?? 0 } })); }} />
                              <span className="text-gray-400 text-xs">-</span>
                              <input type="number" className="w-10 h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                                value={localResults[match.partido_id]?.goles_visitante ?? ""}
                                onChange={(e) => { const val = parseInt(e.target.value); setLocalResults((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], goles_visitante: isNaN(val) ? 0 : val, goles_local: prev[match.partido_id]?.goles_local ?? 0 } })); }} />
                            </div>
                            <span className="text-xs font-semibold truncate max-w-[90px] flex-1">
                              {parseMatchTeams(match).visitante}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {KO_PHASES.map((fase) => {
                    const matches = (partidos || []).filter((m: any) => m.fase === fase)
                      .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
                    if (matches.length === 0) return null;
                    return (
                      <div key={fase}>
                        <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-3">{fase}</h4>
                        <div className="space-y-2">
                          {matches.map((match: any) => (
                            <div key={match.partido_id} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl">
                              <span className="text-[10px] font-bold text-gray-400 w-14">{match.partido_id}</span>
                              <span className="text-xs text-gray-500 w-10">{match.hora}</span>
                              <span className="text-xs font-semibold truncate max-w-[90px] text-right flex-1">
                                {parseMatchTeams(match).local}
                              </span>
                              <div className="flex items-center gap-1">
                                <input type="number" className="w-10 h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                                  value={localResults[match.partido_id]?.goles_local ?? ""}
                                  onChange={(e) => { const val = parseInt(e.target.value); setLocalResults((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], goles_local: isNaN(val) ? 0 : val, goles_visitante: prev[match.partido_id]?.goles_visitante ?? 0 } })); }} />
                                <span className="text-gray-400 text-xs">-</span>
                                <input type="number" className="w-10 h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                                  value={localResults[match.partido_id]?.goles_visitante ?? ""}
                                  onChange={(e) => { const val = parseInt(e.target.value); setLocalResults((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], goles_visitante: isNaN(val) ? 0 : val, goles_local: prev[match.partido_id]?.goles_local ?? 0 } })); }} />
                              </div>
                              <span className="text-xs font-semibold truncate max-w-[90px] flex-1">
                                {parseMatchTeams(match).visitante}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            <button onClick={handleSaveResults} className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-blue-700 transition-colors">
              <Save className="w-5 h-5" />
              Guardar Resultados
            </button>
          </div>

          {/* Cuadro de Honor */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Medal className="text-amber-500" />
              Cuadro de Honor (Respuestas Correctas)
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {["campeon", "subcampeon", "tercer_puesto"].map((field) => (
                <div key={field}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    {field === "campeon" ? "Campeón" : field === "subcampeon" ? "Subcampeón" : "3.er Lugar"}
                  </label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    value={cuadroHonor[field] || ""}
                    onChange={(e) => setCuadroHonor((prev) => ({ ...prev, [field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["bota_oro", "bota_plata", "bota_bronce", "balon_oro", "balon_plata", "balon_bronce"].map((field) => (
                <div key={field}>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    {field === "bota_oro" ? "Bota de Oro" : field === "bota_plata" ? "Bota de Plata" : field === "bota_bronce" ? "Bota de Bronce" : field === "balon_oro" ? "Balón de Oro" : field === "balon_plata" ? "Balón de Plata" : "Balón de Bronce"}
                  </label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                    value={cuadroHonor[field] || ""}
                    onChange={(e) => setCuadroHonor((prev) => ({ ...prev, [field]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSaveCuadroHonor} className="mt-6 w-full bg-amber-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-amber-700 transition-colors">
              <Save className="w-5 h-5" />
              Guardar Cuadro de Honor
            </button>
          </div>

          {/* Equipos Fases Finales */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Info className="text-blue-600" />
              Equipos - Fases Finales
            </h3>
            {(() => {
              const knockout = (partidos || []).filter((m: any) => {
                const id = parseInt(m.partido_id, 10);
                return !isNaN(id) && id >= 73;
              });
              const phases = [
                "Dieciseisavos de Final", "Octavos de Final", "Cuartos de Final",
                "Semifinal", "Tercer Lugar", "Gran Final",
              ];
              return phases.map((fase) => {
                const matches = knockout.filter((m: any) => m.fase === fase);
                if (matches.length === 0) return null;
                return (
                  <div key={fase} className="mb-6">
                    <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">{fase}</h4>
                    <div className="space-y-3">
                      {matches.map((match: any) => {
                        const edit = teamEdits[match.partido_id];
                        const casa = edit?.casa ?? match.casa ?? "";
                        const fuera = edit?.fuera ?? match.fuera ?? "";
                        return (
                          <div key={match.partido_id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                            <span className="text-xs font-bold text-gray-400 w-8">{match.partido_id}</span>
                            <input type="text" className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                              value={casa}
                              onChange={(e) => setTeamEdits((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], casa: e.target.value, fuera } }))}
                            />
                            <span className="text-gray-400 text-sm font-bold">vs</span>
                            <input type="text" className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                              value={fuera}
                              onChange={(e) => setTeamEdits((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], fuera: e.target.value, casa } }))}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              });
            })()}
            <button onClick={handleSaveTeams} className="mt-4 w-full bg-orange-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-orange-700 transition-colors">
              <Save className="w-5 h-5" />
              Guardar Equipos
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Plus className="text-blue-600" />
              Añadir Participante
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <input type="text" placeholder="Nombre Completo" className="bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none" />
              <input type="text" placeholder="Cédula" className="bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none" />
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 text-center cursor-pointer hover:bg-gray-100 transition-colors">
              <Info className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">Click para cargar JSON de Quiniela</p>
            </div>
            <button className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md">
              <Save className="w-5 h-5" />
              Guardar Participante
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Configuración de Puntos */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Puntaje por Fase</h3>
            <div className="space-y-1 mb-4 text-xs text-gray-400 font-semibold uppercase tracking-wider grid grid-cols-4 gap-2 px-1">
              <span className="col-span-1">Fase</span>
              <span className="text-center">Exacto</span>
              <span className="text-center">Dif.</span>
              <span className="text-center">Gan.</span>
            </div>
            <div className="space-y-3">
              {PHASES.map(({ key, label }) => {
                const phase = puntajeConfig[key] || { exacto: 0, diferencia: 0, ganador: 0 };
                return (
                  <div key={key} className="grid grid-cols-4 gap-2 items-center bg-gray-50 p-2 rounded-xl">
                    <span className="text-xs font-semibold text-gray-600 truncate">{label}</span>
                    <input type="number" className="w-full h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                      value={phase.exacto}
                      onChange={(e) => updateConfig(key, "exacto", parseInt(e.target.value) || 0)} />
                    <input type="number" className="w-full h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                      value={phase.diferencia}
                      onChange={(e) => updateConfig(key, "diferencia", parseInt(e.target.value) || 0)} />
                    <input type="number" className="w-full h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                      value={phase.ganador}
                      onChange={(e) => updateConfig(key, "ganador", parseInt(e.target.value) || 0)} />
                  </div>
                );
              })}
            </div>
            <h4 className="text-sm font-bold text-gray-600 mt-6 mb-3">Cuadro de Honor</h4>
            <div className="space-y-2">
              {[
                { key: "campeon", label: "Campeón" },
                { key: "subcampeon", label: "Subcampeón" },
                { key: "tercer_puesto", label: "3.er Lugar" },
                { key: "bota_oro", label: "Bota de Oro" },
                { key: "bota_plata", label: "Bota de Plata" },
                { key: "bota_bronce", label: "Bota de Bronce" },
                { key: "balon_oro", label: "Balón de Oro" },
                { key: "balon_plata", label: "Balón de Plata" },
                { key: "balon_bronce", label: "Balón de Bronce" },
              ].map(({ key, label }) => {
                const val = (puntajeConfig.cuadro_de_honor || {})[key] ?? 0;
                return (
                  <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                    <span className="text-xs font-semibold text-gray-600">{label}</span>
                    <input type="number" className="w-16 h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                      value={val}
                      onChange={(e) => updateConfig("cuadro_de_honor", key, parseInt(e.target.value) || 0)} />
                  </div>
                );
              })}
            </div>
            <button onClick={handleSaveConfig} className="mt-4 w-full bg-green-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-green-700 transition-colors text-sm">
              <Save className="w-4 h-4" />
              Guardar Configuración
            </button>
          </div>

          {/* Contacto */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Contacto</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  value={localContacto.email}
                  onChange={(e) => setLocalContacto((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Teléfonos (WhatsApp)</label>
                  <button onClick={() => setLocalContacto((prev) => ({ ...prev, telefonos: [...prev.telefonos, ""] }))}
                    className="text-xs text-blue-600 font-bold hover:underline">+ Agregar</button>
                </div>
                <div className="space-y-2">
                  {localContacto.telefonos.map((tel, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input type="text" className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                        value={tel}
                        onChange={(e) => {
                          const newTels = [...localContacto.telefonos];
                          newTels[i] = e.target.value;
                          setLocalContacto((prev) => ({ ...prev, telefonos: newTels }));
                        }}
                      />
                      <button onClick={() => setLocalContacto((prev) => ({ ...prev, telefonos: prev.telefonos.filter((_, j) => j !== i) }))}
                        className="text-red-500 text-sm font-bold hover:underline">X</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={handleSaveContacto} className="mt-4 w-full bg-green-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-green-700 transition-colors text-sm">
              <Save className="w-4 h-4" />
              Guardar Contacto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
