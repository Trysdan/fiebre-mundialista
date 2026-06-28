"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Trophy,
  Settings,
  User,
  Home,
  Search,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Leaderboard from "@/components/Leaderboard";
import Fixture from "@/components/Fixture";
import AdminPanel from "@/components/AdminPanel";
import { getTeamFlag } from "@/lib/flags";

type Panel = "INICIO" | "PARTICIPANTE" | "ADMINISTRADOR";

function parseMatchTeams(match: any) {
  if (match.equipos?.local) return match.equipos;
  if (match.casa) return { local: match.casa, visitante: match.fuera };
  if (typeof match.equipos === "string") {
    const parts = match.equipos.split(" vs. ");
    return { local: parts[0] || "Local", visitante: parts[1] || "Visitante" };
  }
  return { local: "Local", visitante: "Visitante" };
}

export default function App() {
  const [activePanel, setActivePanel] = useState<Panel>("INICIO");
  const [searchCedula, setSearchCedula] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedQuiniela, setSelectedQuiniela] = useState<any>(null);

  const [partidos, setPartidos] = useState<any[]>([]);
  const [resultados, setResultados] = useState<Record<string, any>>({});
  const [quinielas, setQuinielas] = useState<any[]>([]);
  const [puntajeConfig, setPuntajeConfig] = useState<any>({});
  const [contacto, setContacto] = useState<{ email: string; telefonos: string[] }>({
    email: "",
    telefonos: [],
  });
  const [adminCreds, setAdminCreds] = useState({ usuario: "admin", password: "admin" });
  const [disabledPhases, setDisabledPhases] = useState<string[]>([]);
  const [isPreview, setIsPreview] = useState(false);
  const [viewDate, setViewDate] = useState("");

  const SIMULATED_TODAY = new Date().toLocaleDateString("en-CA", { timeZone: "America/Caracas" });

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/data");
      const json = await res.json();
      setPartidos(json.partidos?.partidos || []);
      setResultados(json.resultados || {});
      setQuinielas(json.quinielas || []);
      if (json.puntajeConfig) setPuntajeConfig(json.puntajeConfig);
      if (json.contacto) setContacto(json.contacto);
      if (json.adminCreds) setAdminCreds(json.adminCreds);
      if (json.disabledPhases) setDisabledPhases(json.disabledPhases);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    setViewDate(SIMULATED_TODAY);
    fetch("/api/env").then((r) => r.json()).then((env) => {
      setIsPreview(env.isPreview);
    }).catch(() => {});
  }, [fetchData]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = quinielas.find(
      (q) =>
        q.participante?.toLowerCase() === searchCedula.toLowerCase() ||
        searchCedula === "123"
    );
    if (found || searchCedula === "123") {
      const user = found?.participante || "JesusPrueba";
      setSelectedUser(user);
      const userQuinielas = quinielas.filter((q) => q.participante === user);
      setSelectedQuiniela(userQuinielas[0] || null);
      setActivePanel("PARTICIPANTE");
    } else {
      alert("Participante no encontrado. Busca por nombre completo.");
    }
  };

  const handleSaveResultados = async (newResults: Record<string, any>) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "resultados", resultados: newResults }),
      });
      if (res.ok) {
        setResultados(newResults);
      }
    } catch (err) {
      console.error("Error saving results:", err);
    }
  };

  const handleSavePuntajeConfig = async (
    config: Record<string, { exacto: number; diferencia: number; ganador: number }>
  ) => {
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setPuntajeConfig(config);
      }
    } catch (err) {
      console.error("Error saving config:", err);
    }
  };

  const handleSavePartidos = async (updates: Record<string, { casa: string; fuera: string }>) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "partidos", partidos: updates }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error saving partidos:", err);
    }
  };

  const handleDeleteQuiniela = async (participante: string) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "delete_quiniela", participante }),
      });
      if (res.ok) {
        await fetchData();
        alert(`"${participante}" eliminado`);
      } else {
        alert("Error al eliminar participante");
      }
    } catch (err) {
      console.error("Error deleting quiniela:", err);
    }
  };

  const handleSaveAdminCreds = async (creds: { usuario: string; password: string }) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "admin_creds", admin_creds: creds }),
      });
      if (res.ok) setAdminCreds(creds);
    } catch (err) {
      console.error("Error saving admin creds:", err);
    }
  };

  const handleSaveDisabledPhases = async (phases: string[]) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "disabled_phases", disabledPhases: phases }),
      });
      if (res.ok) setDisabledPhases(phases);
    } catch (err) {
      console.error("Error saving disabled phases:", err);
    }
  };

  const handleSaveContacto = async (data: { email: string; telefonos: string[] }) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "contacto", contacto: data }),
      });
      if (res.ok) {
        setContacto(data);
      }
    } catch (err) {
      console.error("Error saving contacto:", err);
    }
  };

  const handleSaveCuadroHonor = async (cuadro: Record<string, string>) => {
    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "cuadro_honor", cuadro_de_honor: cuadro }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error("Error saving cuadro de honor:", err);
    }
  };

  const userQuinielas = quinielas.filter((q) => q.participante === selectedUser);

  const goToInicio = () => {
    setActivePanel("INICIO");
    setSelectedUser(null);
    setSelectedQuiniela(null);
  };

  const allDates = useMemo(() => {
    return [...new Set(partidos.map((m) => m.fecha))].sort();
  }, [partidos]);

  const currentDateIndex = allDates.indexOf(viewDate);

  const matchesForDate = useMemo(() => {
    if (!viewDate) return [];
    return partidos.filter((m) => m.fecha === viewDate);
  }, [partidos, viewDate]);

  const goPrevDate = () => {
    if (currentDateIndex > 0) setViewDate(allDates[currentDateIndex - 1]);
  };

  const goNextDate = () => {
    if (currentDateIndex < allDates.length - 1) setViewDate(allDates[currentDateIndex + 1]);
  };

  const goToday = () => setViewDate(SIMULATED_TODAY);

  const formatDateLabel = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" });
  };

  const isToday = viewDate === SIMULATED_TODAY;

  return (
    <div className="min-h-screen font-sans text-gray-900 pb-24 md:pb-0">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={goToInicio}
          >
            <img
              src="/Logo.jpeg"
              alt="Fiebre Mundialista"
              className="h-12 w-auto object-contain rounded-lg shadow-sm"
            />
            <div>
              <h1 className="text-xl font-black text-blue-900 leading-none">
                FIEBRE
              </h1>
              <p className="text-[10px] font-bold tracking-[0.2em] text-blue-600">
                MUNDIALISTA &apos;26
              </p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={goToInicio}
              className={`font-bold transition-all ${
                activePanel === "INICIO"
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-blue-400"
              }`}
            >
              Inicio
            </button>
            <button
              onClick={() => setActivePanel("PARTICIPANTE")}
              className={`font-bold transition-all ${
                activePanel === "PARTICIPANTE"
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-blue-400"
              }`}
            >
              Participante
            </button>
            <button
              onClick={() => setActivePanel("ADMINISTRADOR")}
              className={`font-bold transition-all ${
                activePanel === "ADMINISTRADOR"
                  ? "text-blue-600"
                  : "text-gray-400 hover:text-blue-400"
              }`}
            >
              Admin
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Contacto
              </p>
              <p className="text-xs font-bold text-blue-900">
                {contacto.telefonos?.[0] || ""}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePanel}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activePanel === "INICIO" && (
              <div className="space-y-10">
                <div className="bg-blue-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
                      ¡Vive el Mundial 2026!
                    </h2>
                    <p className="text-blue-100 mb-6 sm:mb-8 max-w-md text-sm sm:text-base">
                      Ingresa tu nombre para ver tus quinielas y el fixture
                      completo.
                    </p>
                    <form
                      onSubmit={handleSearch}
                      className="flex flex-col sm:flex-row gap-2 max-w-sm"
                    >
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre..."
                          className="w-full bg-white text-gray-900 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-400 outline-none"
                          value={searchCedula}
                          onChange={(e) => setSearchCedula(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        Buscar
                      </button>
                    </form>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <section>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                          Partidos
                        </h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={goPrevDate} disabled={currentDateIndex <= 0}
                          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <button onClick={goToday}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            isToday ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100 text-gray-500"
                          }`}>
                          Hoy
                        </button>
                        <button onClick={goNextDate} disabled={currentDateIndex < 0 || currentDateIndex >= allDates.length - 1}
                          className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                    </div>
                    {viewDate && (
                      <p className="text-xs font-semibold text-gray-400 capitalize mb-4 text-center sm:text-left">
                        {formatDateLabel(viewDate)}
                        {!isToday && (
                          <span className="text-gray-300 font-normal ml-2">(hoy es {formatDateLabel(SIMULATED_TODAY)})</span>
                        )}
                      </p>
                    )}
                    <div className="space-y-3">
                      {matchesForDate.map((match) => {
                        const equipos = parseMatchTeams(match);
                        const real = resultados[match.partido_id];
                        const flagLocal = getTeamFlag(equipos.local);
                        const flagVisit = getTeamFlag(equipos.visitante);
                        return (
                        <div
                          key={match.partido_id}
                          className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-2"
                        >
                          <div className="flex-1 text-center min-w-0">
                            <p className="font-bold text-gray-900 flex items-center justify-center gap-1.5 text-xs sm:text-sm truncate">
                              {flagLocal && <img src={flagLocal} alt="" className="w-5 h-3.5 sm:w-6 sm:h-4 shrink-0 rounded-sm object-cover" />}
                              <span className="truncate">{equipos.local}</span>
                            </p>
                          </div>
                          <div className="text-center shrink-0">
                            {real ? (
                              <div className="flex items-center justify-center gap-1 sm:gap-2">
                                <span className="bg-blue-600 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold shadow-sm text-xs sm:text-sm">
                                  {real.goles_local ?? real.goles_casa}
                                </span>
                                <span className="text-gray-400 font-bold text-[10px] sm:text-xs">-</span>
                                <span className="bg-blue-600 text-white w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center font-bold shadow-sm text-xs sm:text-sm">
                                  {real.goles_visitante ?? real.goles_fuera}
                                </span>
                              </div>
                            ) : (
                              <p className="text-lg sm:text-2xl font-black text-blue-600">VS</p>
                            )}
                            <p className="text-[10px] sm:text-xs text-gray-500 uppercase tracking-widest mt-1">
                              {match.hora}
                            </p>
                          </div>
                          <div className="flex-1 text-center min-w-0">
                            <p className="font-bold text-gray-900 flex items-center justify-center gap-1.5 text-xs sm:text-sm truncate">
                              {flagVisit && <img src={flagVisit} alt="" className="w-5 h-3.5 sm:w-6 sm:h-4 shrink-0 rounded-sm object-cover" />}
                              <span className="truncate">{equipos.visitante}</span>
                            </p>
                          </div>
                        </div>
                        );
                      })}
                      {matchesForDate.length === 0 && viewDate && (
                        <p className="text-gray-500 italic text-center py-6">
                          No hay partidos programados para esta fecha.
                        </p>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                        Criterios de Puntaje
                      </h4>
                      <div className="text-xs space-y-3">
                        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                          <span className="font-semibold text-gray-600 w-28">Resultado exacto</span>
                          <span className="font-bold text-blue-600">{puntajeConfig.grupos?.exacto ?? 4} pts</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">Diferencia {puntajeConfig.grupos?.diferencia ?? 3} pts</span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">Ganador {puntajeConfig.grupos?.ganador ?? 2} pts</span>
                        </div>
                        <p className="text-gray-400 font-medium">Clasificado a siguiente ronda (por equipo acertado):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { key: "dieciseisavos", label: "16vos" },
                            { key: "octavos", label: "8vos" },
                            { key: "cuartos", label: "4tos" },
                            { key: "semifinal", label: "Semifinal" },
                            { key: "tercer_puesto", label: "3er Puesto" },
                            { key: "final", label: "Final" },
                          ].map(({ key, label }) => {
                            const val = (puntajeConfig.clasificado || {})[key] ?? 0;
                            return val ? (
                              <span key={key} className="bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-lg">
                                {label}: {val} pts
                              </span>
                            ) : null;
                          })}
                        </div>
                        <p className="text-gray-400 font-medium pt-1">Cuadro de Honor:</p>
                        <div className="flex flex-wrap gap-1.5">
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
                            return val ? (
                              <span key={key} className="bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-lg">
                                {label}: {val} pts
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  </section>

                  <Leaderboard
                    quinielas={quinielas}
                    resultados={resultados}
                    puntajeConfig={puntajeConfig}
                    partidos={partidos}
                    disabledPhases={disabledPhases}
                    onSelectQuiniela={(nombre) => {
                      setActivePanel("PARTICIPANTE");
                      setSelectedUser(nombre);
                      const userQ = quinielas.filter((q) => q.participante === nombre);
                      setSelectedQuiniela(userQ[0] || null);
                    }}
                  />
                </div>
              </div>
            )}

            {activePanel === "PARTICIPANTE" && (
              <div className="space-y-8">
                {selectedUser ? (
                  <>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        Bienvenido, {selectedUser}
                      </h2>
                      <p className="text-gray-500">
                        Tus quinielas para el Mundial 2026
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="text-sm text-blue-600 font-semibold hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    ← Ver todos los participantes
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {userQuinielas.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedQuiniela(q)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedQuiniela?.id === q.id
                          ? "bg-blue-600 text-white shadow-md"
                          : "bg-white text-gray-600 border border-gray-200 hover:border-blue-400"
                      }`}
                    >
                      {q.archivo_fuente || `Quiniela ${i + 1}`}
                    </button>
                  ))}
                </div>

                <Fixture
                  partidos={partidos}
                  quiniela={selectedQuiniela}
                  resultados={resultados}
                  puntajeConfig={puntajeConfig}
                />
                </>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Participantes
                  </h2>
                  <p className="text-gray-500 mb-6">
                    Selecciona un participante para ver su quiniela
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[...new Set(quinielas.map((q) => q.participante))]
                      .sort((a, b) => a.localeCompare(b, "es"))
                      .map((name) => (
                        <button
                          key={name}
                          onClick={() => {
                            setSelectedUser(name);
                            const userQ = quinielas.filter((q) => q.participante === name);
                            setSelectedQuiniela(userQ[0] || null);
                          }}
                          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-left hover:border-blue-400 hover:shadow-md transition-all"
                        >
                          <span className="font-semibold text-gray-800">{name}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
              </div>
            )}

            {activePanel === "ADMINISTRADOR" && (
              <AdminPanel
                partidos={partidos}
                resultados={resultados}
                puntajeConfig={puntajeConfig}
                contacto={contacto}
                adminCreds={adminCreds}
                quinielas={quinielas}
                disabledPhases={disabledPhases}
                onSaveResultados={handleSaveResultados}
                onSavePuntajeConfig={handleSavePuntajeConfig}
                onSavePartidos={handleSavePartidos}
                onSaveCuadroHonor={handleSaveCuadroHonor}
                onSaveContacto={handleSaveContacto}
                onSaveAdminCreds={handleSaveAdminCreds}
                onSaveDisabledPhases={handleSaveDisabledPhases}
                onDeleteQuiniela={handleDeleteQuiniela}
                onRefresh={fetchData}
                isPreview={isPreview}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-4 z-50">
        <button
          onClick={goToInicio}
          className={`flex flex-col items-center gap-1 ${
            activePanel === "INICIO" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button
          onClick={() => setActivePanel("PARTICIPANTE")}
          className={`flex flex-col items-center gap-1 ${
            activePanel === "PARTICIPANTE" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <Trophy className="w-6 h-6" />
          <span className="text-[10px] font-bold">Quiniela</span>
        </button>
        <button
          onClick={() => setActivePanel("ADMINISTRADOR")}
          className={`flex flex-col items-center gap-1 ${
            activePanel === "ADMINISTRADOR" ? "text-blue-600" : "text-gray-400"
          }`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold">Admin</span>
        </button>
      </div>

      <footer className="max-w-7xl mx-auto px-4 py-12 border-t border-gray-100 mt-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <img src="/Logo.jpeg" alt="Logo" className="h-8 grayscale" />
            <p className="text-xs font-bold text-gray-400">
              &copy; 2026 Fiebre Mundialista. Todos los derechos reservados.
            </p>
          </div>
          <div className="flex gap-4">
            <a
              href={`mailto:${contacto.email}`}
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Mail className="w-5 h-5" />
            </a>
            <a
              href={`https://wa.me/${(contacto.telefonos?.[0] || "").replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-green-500 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
