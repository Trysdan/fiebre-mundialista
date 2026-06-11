"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Trophy,
  Settings,
  User,
  Home,
  Search,
  Calendar as CalendarIcon,
  Mail,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Leaderboard from "@/components/Leaderboard";
import Fixture from "@/components/Fixture";
import AdminPanel from "@/components/AdminPanel";

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

  const SIMULATED_TODAY = "2026-06-11";

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
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const matchesToday = partidos.filter((m) => m.fecha === SIMULATED_TODAY);

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
                <div className="bg-blue-600 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-4">
                      ¡Vive el Mundial 2026!
                    </h2>
                    <p className="text-blue-100 mb-8 max-w-md">
                      Ingresa tu cédula para ver tus quinielas y el fixture
                      completo.
                    </p>
                    <form
                      onSubmit={handleSearch}
                      className="flex gap-2 max-w-sm"
                    >
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Buscar por nombre del participante..."
                          className="w-full bg-white text-gray-900 rounded-xl py-3 pl-10 pr-4 focus:ring-2 focus:ring-blue-400 outline-none"
                          value={searchCedula}
                          onChange={(e) => setSearchCedula(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-white text-blue-600 font-semibold px-6 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        Buscar
                      </button>
                    </form>
                  </div>
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarIcon className="text-blue-600 w-6 h-6" />
                      <h3 className="text-xl font-bold text-gray-800">
                        Partidos del Día
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {matchesToday.map((match) => {
                        const equipos = parseMatchTeams(match);
                        const real = resultados[match.partido_id];
                        return (
                        <div
                          key={match.partido_id}
                          className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between"
                        >
                          <div className="text-center w-1/3">
                            <p className="font-bold text-gray-900 h-12 flex items-center justify-center">
                              {equipos.local}
                            </p>
                          </div>
                          <div className="text-center">
                            {real ? (
                              <div className="flex items-center justify-center gap-2">
                                <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-sm text-sm">
                                  {real.goles_local ?? real.goles_casa}
                                </span>
                                <span className="text-gray-400 font-bold text-xs">-</span>
                                <span className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold shadow-sm text-sm">
                                  {real.goles_visitante ?? real.goles_fuera}
                                </span>
                              </div>
                            ) : (
                              <p className="text-2xl font-black text-blue-600">VS</p>
                            )}
                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                              {match.hora}
                            </p>
                          </div>
                          <div className="text-center w-1/3">
                            <p className="font-bold text-gray-900 h-12 flex items-center justify-center">
                              {equipos.visitante}
                            </p>
                          </div>
                        </div>
                        );
                      })}
                      {matchesToday.length === 0 && (
                        <p className="text-gray-500 italic">
                          No hay partidos programados para hoy.
                        </p>
                      )}
                    </div>
                  </section>

                  <Leaderboard
                    quinielas={quinielas}
                    resultados={resultados}
                    puntajeConfig={puntajeConfig}
                    partidos={partidos}
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
                <div className="flex gap-2">
                  {userQuinielas.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedQuiniela(q)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedQuiniela?.participante === q.participante &&
                        selectedQuiniela?.archivo_fuente === q.archivo_fuente
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
                onSaveResultados={handleSaveResultados}
                onSavePuntajeConfig={handleSavePuntajeConfig}
                onSavePartidos={handleSavePartidos}
                onSaveCuadroHonor={handleSaveCuadroHonor}
                onSaveContacto={handleSaveContacto}
                onSaveAdminCreds={handleSaveAdminCreds}
                onDeleteQuiniela={handleDeleteQuiniela}
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
