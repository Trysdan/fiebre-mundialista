"use client";

import { useState, useRef, useEffect } from "react";
import { convertXlsxToQuinielaJson } from "../lib/xlsxParser";
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
  Upload,
  Trash2,
  XCircle,
  ChevronDown,
} from "lucide-react";
interface AdminPanelProps {
  partidos: any[];
  resultados: Record<string, any>;
  puntajeConfig: Record<string, any>;
  contacto?: { email: string; telefonos: string[] };
  adminCreds?: { usuario: string; password: string };
  quinielas?: any[];
  onSaveResultados: (resultados: Record<string, any>) => Promise<void>;
  onSavePuntajeConfig: (config: any) => Promise<void>;
  onSavePartidos?: (partidos: Record<string, { casa: string; fuera: string }>) => Promise<void>;
  onSaveCuadroHonor?: (cuadro: Record<string, string>) => Promise<void>;
  onSaveContacto?: (data: { email: string; telefonos: string[] }) => Promise<void>;
  onSaveAdminCreds?: (creds: { usuario: string; password: string }) => Promise<void>;
  onDeleteQuiniela?: (participante: string) => Promise<void>;
  onRefresh?: () => Promise<void>;
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

export default function AdminPanel({
  partidos,
  resultados,
  puntajeConfig: initialConfig,
  contacto: initialContacto,
  adminCreds: initialCreds,
  quinielas,
  onSaveResultados,
  onSavePuntajeConfig,
  onSavePartidos,
  onSaveCuadroHonor,
  onSaveContacto,
  onSaveAdminCreds,
  onDeleteQuiniela,
  onRefresh,
}: AdminPanelProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBlocked, setLoginBlocked] = useState(false);
  const [blockCountdown, setBlockCountdown] = useState(0);
  const [localResults, setLocalResults] = useState<Record<string, any>>(resultados);
  const [puntajeConfig, setPuntajeConfig] = useState(initialConfig);
  const [teamEdits, setTeamEdits] = useState<Record<string, { casa: string; fuera: string }>>({});
  const [creds, setCreds] = useState(initialCreds || { usuario: "admin", password: "admin" });
  const [localCreds, setLocalCreds] = useState(initialCreds || { usuario: "admin", password: "admin" });
  const [cuadroHonor, setCuadroHonor] = useState<Record<string, string>>(
    resultados.cuadro_de_honor || {}
  );
  const [localContacto, setLocalContacto] = useState<{ email: string; telefonos: string[] }>(
    initialContacto || { email: "", telefonos: [] }
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [resultadosOpen, setResultadosOpen] = useState(true);
  const [resultadosSections, setResultadosSections] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleKeyEnter = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === "Enter") { e.preventDefault(); fn(); }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && e.target instanceof HTMLElement) {
        const input = e.target.closest("input, textarea, select");
        if (!input) return;
        const card = input.closest(".rounded-2xl");
        if (!card) return;
        const btns = card.querySelectorAll("button");
        for (const btn of btns) {
          if (btn.textContent?.includes("Guardar")) { btn.click(); break; }
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    fetch("/api/env").then((r) => r.json()).then((env) => {
      if (env.isPreview) {
        fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: "admin", password: "admin" }),
        }).then((res) => {
          if (res.ok) setIsLoggedIn(true);
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  const handleSaveParticipante = async () => {
    if (!selectedFile && !googleSheetUrl) return;
    setUploading(true);
    try {
      let jsonData: any;
      if (googleSheetUrl) {
        const match = googleSheetUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (!match) throw new Error("URL de Google Sheets inválida");
        const sheetId = match[1];
        const resp = await fetch(
          `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx`
        );
        if (!resp.ok) throw new Error("No se pudo descargar el archivo del link");
        const buf = await resp.arrayBuffer();
        jsonData = convertXlsxToQuinielaJson(new Uint8Array(buf));
      } else if (selectedFile!.name.endsWith(".xlsx")) {
        const buf = await selectedFile!.arrayBuffer();
        jsonData = convertXlsxToQuinielaJson(new Uint8Array(buf));
      } else {
        const text = await selectedFile!.text();
        jsonData = JSON.parse(text);
      }
      const participante = jsonData.participante || selectedFile?.name.replace(/\.(json|xlsx)$/i, "") || "Sin_Nombre";
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "quiniela",
          participante,
          archivo_fuente: googleSheetUrl || selectedFile!.name,
          ...jsonData,
        }),
      });
      if (res.ok) {
        alert(`Participante "${participante}" guardado`);
        setSelectedFile(null);
        setGoogleSheetUrl("");
        await onRefresh?.();
      } else {
        const err = await res.json();
        alert("Error: " + (err.error || "No se pudo guardar"));
      }
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "No se pudo procesar"));
    } finally {
      setUploading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setLoginBlocked(false);
        setIsLoggedIn(true);
      } else if (data.error === "blocked") {
        setLoginBlocked(true);
        setLoginError(data.message || "Demasiados intentos. Intenta más tarde.");
        if (data.retryAfter) {
          setBlockCountdown(data.retryAfter);
          const interval = setInterval(() => {
            setBlockCountdown((prev) => {
              if (prev <= 1) { clearInterval(interval); setLoginBlocked(false); return 0; }
              return prev - 1;
            });
          }, 1000);
        }
      } else {
        setLoginError(data.message || "Credenciales incorrectas");
      }
    } catch {
      setLoginError("Error de conexión al servidor");
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

  const handleSaveCreds = async () => {
    if (!onSaveAdminCreds) return;
    await onSaveAdminCreds(localCreds);
    setCreds(localCreds);
    alert("Credenciales actualizadas");
  };

  const handleSaveContacto = async () => {
    if (!onSaveContacto) return;
    await onSaveContacto(localContacto);
    alert("Contacto actualizado");
  };

  const updateConfig = (phase: string, field: string, value: number) => {
    setPuntajeConfig((prev) => {
      const current = prev[phase];
      return { ...prev, [phase]: { ...(typeof current === "object" && !Array.isArray(current) ? current : {}), [field]: value } };
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
                className="w-full bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loginBlocked}
              />
              <input
                type="password"
                placeholder="Contraseña"
                className="w-full bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loginBlocked}
              />
              {loginError && (
                <div className={`text-sm font-semibold text-center p-3 rounded-xl ${loginBlocked ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"}`}>
                  {loginBlocked && blockCountdown > 0
                    ? `⏳ ${Math.floor(blockCountdown / 60)}:${String(blockCountdown % 60).padStart(2, "0")}`
                    : loginError}
                </div>
              )}
              <button
                type="submit"
                disabled={loginBlocked}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loginBlocked ? "Bloqueado" : "Ingresar"}
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

      <div className="flex gap-2 flex-wrap mb-6 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        {[
          { id: "sec-resultados", label: "Resultados" },
          { id: "sec-cuadro-honor", label: "Cuadro de Honor" },
          { id: "sec-equipos", label: "Equipos Finales" },
          { id: "sec-participante", label: "Añadir Participante" },
          { id: "sec-registrados", label: "Registrados" },
          { id: "sec-puntaje", label: "Puntaje" },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            className="text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Cargar Resultados Reales */}
          <div id="sec-resultados" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <button onClick={() => setResultadosOpen(!resultadosOpen)} className="flex items-center justify-between w-full mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="text-blue-600" />
                Cargar Resultados Reales
              </h3>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${resultadosOpen ? "" : "-rotate-90"}`} />
            </button>
            {resultadosOpen && (() => {
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
                  {Object.entries(fechas).map(([fecha, matches]) => {
                    const secKey = "fecha_" + fecha;
                    const isOpen = resultadosSections[secKey] !== false;
                    return (
                    <div key={fecha}>
                      <button onClick={() => setResultadosSections((prev) => ({ ...prev, [secKey]: !isOpen }))}
                        className="flex items-center gap-2 w-full mb-3">
                        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {new Date(fecha + "T12:00:00").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}
                        </h4>
                      </button>
                      {isOpen && (<div className="space-y-2">
                        {matches.map((match: any) => (
                          <div key={match.partido_id} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl flex-wrap">
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
                                  onKeyDown={(e) => handleKeyEnter(e, handleSaveResults)}
                                  onChange={(e) => { const val = parseInt(e.target.value); setLocalResults((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], goles_local: isNaN(val) ? 0 : val, goles_visitante: prev[match.partido_id]?.goles_visitante ?? 0 } })); }} />
                                <span className="text-gray-400 text-xs">-</span>
                                <input type="number" className="w-10 h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                                  value={localResults[match.partido_id]?.goles_visitante ?? ""}
                                  onKeyDown={(e) => handleKeyEnter(e, handleSaveResults)}
                                  onChange={(e) => { const val = parseInt(e.target.value); setLocalResults((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], goles_visitante: isNaN(val) ? 0 : val, goles_local: prev[match.partido_id]?.goles_local ?? 0 } })); }} />
                              </div>
                              <span className="text-xs font-semibold truncate max-w-[90px] flex-1">
                                {parseMatchTeams(match).visitante}
                              </span>
                              {localResults[match.partido_id] && (
                                <button onClick={() => setLocalResults((prev) => { const c = { ...prev }; delete c[match.partido_id]; return c; })}
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-colors"
                                  title="Limpiar resultado">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>)}
                      </div>
                  )})}
                   {KO_PHASES.map((fase) => {
                    const matches = (partidos || []).filter((m: any) => m.fase === fase)
                      .sort((a: any, b: any) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora));
                    if (matches.length === 0) return null;
                    const secKey = "ko_" + fase;
                    const isOpen = resultadosSections[secKey] !== false;
                    return (
                      <div key={fase}>
                        <button onClick={() => setResultadosSections((prev) => ({ ...prev, [secKey]: !isOpen }))}
                          className="flex items-center gap-2 w-full mb-3">
                          <ChevronDown className={`w-3.5 h-3.5 text-blue-400 transition-transform ${isOpen ? "" : "-rotate-90"}`} />
                          <h4 className="text-xs font-bold text-blue-500 uppercase tracking-wider">{fase}</h4>
                        </button>
                        {isOpen && (<div className="space-y-2">
                          {matches.map((match: any) => {
                            const teams = parseMatchTeams(match);
                            return (
                            <div key={match.partido_id} className="flex items-center gap-1.5 bg-gray-50 p-2.5 rounded-xl flex-wrap">
                              <span className="text-[10px] font-bold text-gray-400 w-10">{match.partido_id}</span>
                              <span className="text-xs text-gray-500 w-8">{match.hora}</span>
                              <span className="text-xs font-semibold truncate max-w-[80px] text-right">
                                {teams.local}
                              </span>
                              <div className="flex items-center gap-1">
                                <input type="number" className="w-9 h-7 text-center bg-white border border-gray-200 rounded-lg text-xs font-bold"
                                  value={localResults[match.partido_id]?.goles_local ?? ""}
                                  onKeyDown={(e) => handleKeyEnter(e, handleSaveResults)}
                                  onChange={(e) => { const val = parseInt(e.target.value); setLocalResults((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], goles_local: isNaN(val) ? 0 : val, goles_visitante: prev[match.partido_id]?.goles_visitante ?? 0 } })); }} />
                                <span className="text-gray-400 text-xs">-</span>
                                <input type="number" className="w-9 h-7 text-center bg-white border border-gray-200 rounded-lg text-xs font-bold"
                                  value={localResults[match.partido_id]?.goles_visitante ?? ""}
                                  onKeyDown={(e) => handleKeyEnter(e, handleSaveResults)}
                                  onChange={(e) => { const val = parseInt(e.target.value); setLocalResults((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], goles_visitante: isNaN(val) ? 0 : val, goles_local: prev[match.partido_id]?.goles_local ?? 0 } })); }} />
                              </div>
                              <span className="text-xs font-semibold truncate max-w-[75px]">
                                {teams.visitante}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] font-bold">
                                <label className={`px-1.5 py-0.5 rounded cursor-pointer ${localResults[match.partido_id]?.ganador_penales === teams.local ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-500"}`}>
                                  <input type="radio" name={`ganador_${match.partido_id}`} value={teams.local} className="hidden"
                                    checked={localResults[match.partido_id]?.ganador_penales === teams.local}
                                    onChange={() => setLocalResults((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], goles_local: prev[match.partido_id]?.goles_local ?? 0, goles_visitante: prev[match.partido_id]?.goles_visitante ?? 0, ganador_penales: teams.local } }))}
                                  /> {teams.local}
                                </label>
                                <label className={`px-1.5 py-0.5 rounded cursor-pointer ${localResults[match.partido_id]?.ganador_penales === teams.visitante ? "bg-blue-600 text-white" : "bg-white border border-gray-300 text-gray-500"}`}>
                                  <input type="radio" name={`ganador_${match.partido_id}`} value={teams.visitante} className="hidden"
                                    checked={localResults[match.partido_id]?.ganador_penales === teams.visitante}
                                    onChange={() => setLocalResults((prev) => ({ ...prev, [match.partido_id]: { ...prev[match.partido_id], goles_local: prev[match.partido_id]?.goles_local ?? 0, goles_visitante: prev[match.partido_id]?.goles_visitante ?? 0, ganador_penales: teams.visitante } }))}
                                  /> {teams.visitante}
                                </label>
                              </div>
                            {localResults[match.partido_id] && (
                              <button onClick={() => setLocalResults((prev) => { const c = { ...prev }; delete c[match.partido_id]; return c; })}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-lg transition-colors"
                                title="Limpiar resultado">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            </div>
                          )})}
                          </div>)}
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
          <div id="sec-cuadro-honor" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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
          <div id="sec-equipos" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
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

          <div id="sec-participante" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <Plus className="text-blue-600" />
              Añadir Participante
            </h3>
            <p className="text-xs text-gray-400 mb-4">Sube el archivo JSON o XLSX de la quiniela. El nombre se extrae automáticamente del archivo.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.xlsx"
              className="hidden"
              onChange={(e) => { setSelectedFile(e.target.files?.[0] || null); setGoogleSheetUrl(""); }}
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 text-center cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                {selectedFile ? selectedFile.name : "Click para cargar JSON o XLSX de Quiniela"}
              </p>
            </div>
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">o</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <input type="text" placeholder="O pega el link de Google Sheets"
              value={googleSheetUrl}
              onChange={(e) => { setGoogleSheetUrl(e.target.value); setSelectedFile(null); }}
              className="w-full bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none text-sm"
            />
            <button
              onClick={handleSaveParticipante}
              disabled={uploading || (!selectedFile && !googleSheetUrl)}
              className="mt-6 w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {uploading ? "Guardando..." : "Guardar Participante"}
            </button>
          </div>

          {/* Participantes Registrados */}
          <div id="sec-registrados" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-xl font-bold flex items-center gap-2 mb-6">
              <CheckCircle2 className="text-green-600" />
              Participantes Registrados
            </h3>
            {(!quinielas || quinielas.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-6">No hay participantes registrados</p>
            ) : (
              <div className="space-y-2">
                {[...new Set((quinielas || []).map((q: any) => q.participante))].sort().map((name: string) => (
                  <div key={name as string} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <span className="font-semibold text-sm text-gray-700">{name as string}</span>
                    <button
                      onClick={async () => {
                        if (window.confirm(`¿Eliminar a "${name}"?`)) {
                          await onDeleteQuiniela?.(name as string);
                        }
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Configuración de Puntos */}
          <div id="sec-puntaje" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Puntaje</h3>
            <div className="space-y-1 mb-4 text-xs text-gray-400 font-semibold uppercase tracking-wider grid grid-cols-4 gap-2 px-1">
              <span className="col-span-1">Criterio</span>
              <span className="text-center">Exacto</span>
              <span className="text-center">Dif.</span>
              <span className="text-center">Gan.</span>
            </div>
            <div className="grid grid-cols-4 gap-2 items-center bg-gray-50 p-2 rounded-xl">
              <span className="text-xs font-semibold text-gray-600 truncate">General (todas las fases)</span>
              <input type="number" className="w-full h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                value={puntajeConfig.grupos?.exacto ?? 4}
                onChange={(e) => updateConfig("grupos", "exacto", parseInt(e.target.value) || 0)} />
              <input type="number" className="w-full h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                value={puntajeConfig.grupos?.diferencia ?? 3}
                onChange={(e) => updateConfig("grupos", "diferencia", parseInt(e.target.value) || 0)} />
              <input type="number" className="w-full h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                value={puntajeConfig.grupos?.ganador ?? 2}
                onChange={(e) => updateConfig("grupos", "ganador", parseInt(e.target.value) || 0)} />
            </div>

            <h4 className="text-sm font-bold text-gray-600 mt-6 mb-3">Clasificado (por equipo acertado en fase final)</h4>
            <div className="space-y-1 mb-4 text-xs text-gray-400 font-semibold uppercase tracking-wider grid grid-cols-2 gap-2 px-1">
              <span>Fase</span>
              <span className="text-center">Pts por equipo</span>
            </div>
            <div className="space-y-3">
              {[
                { key: "dieciseisavos", label: "16vos de Final" },
                { key: "octavos", label: "8vos de Final" },
                { key: "cuartos", label: "4tos de Final" },
                { key: "semifinal", label: "Semifinal" },
                { key: "tercer_puesto", label: "Tercer Puesto" },
                { key: "final", label: "Gran Final" },
              ].map(({ key, label }) => {
                const val = (puntajeConfig.clasificado || {})[key] ?? 0;
                return (
                  <div key={key} className="flex items-center justify-between bg-gray-50 p-2 rounded-xl">
                    <span className="text-xs font-semibold text-gray-600">{label}</span>
                    <input type="number" className="w-16 h-8 text-center bg-white border border-gray-200 rounded-lg text-sm font-bold"
                      value={val}
                      onChange={(e) => updateConfig("clasificado", key, parseInt(e.target.value) || 0)} />
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

          {/* Credenciales */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-4">Credenciales Admin</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Usuario</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  value={localCreds.usuario}
                  onChange={(e) => setLocalCreds((prev) => ({ ...prev, usuario: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Contraseña</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  value={localCreds.password}
                  onChange={(e) => setLocalCreds((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>
            </div>
            <button onClick={handleSaveCreds} className="mt-4 w-full bg-red-600 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-red-700 transition-colors text-sm">
              <Save className="w-4 h-4" />
              Guardar Credenciales
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
